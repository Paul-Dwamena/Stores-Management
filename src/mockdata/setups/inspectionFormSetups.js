/**
 * Active inspection form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so inspection forms always see the latest config.
 */

import {
  INSPECTION_FORM_LEVEL_1,
  buildInitialInspectionFormTree,
  clampInspectionFormColumns,
  clampLeavesColSpan,
  cloneInspectionFormTree,
  collectActiveInspectionFormLeaves,
  findInspectionFormNodeById,
  getInspectionFormLevel1Ancestor,
  leafToInspectionField,
} from "./inspectionFormTree";
import { INSPECTION_FORM_SECTIONS, INSPECTION_FORM_FIELD_CATALOG } from "./inspectionFormFields";
import { foldOthersIntoMain } from "./formTreeFieldActions";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const INSPECTION_FORM_SETUP_CHANGED_EVENT = "fleetly-inspection-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_inspection_form_tree",
  eventName: INSPECTION_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_INSPECTION_FORM_TREE__",
  getSeed: () => buildInitialInspectionFormTree(),
  clone: cloneInspectionFormTree,
});

const META_KEY = "fleetly_inspection_form_meta";
const TREE_SCHEMA_VERSION = 6;
const INSPECTION_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "ifs_001",
    name: "Default Inspection Form",
    isActive: true,
    updatedAt: null,
    treeSchemaVersion: 0,
  };
  if (typeof sessionStorage === "undefined") {
    return { ...fallback, treeSchemaVersion: TREE_SCHEMA_VERSION };
  }
  try {
    const raw = sessionStorage.getItem(META_KEY);
    if (!raw) return fallback;
    return { ...fallback, ...JSON.parse(raw) };
  } catch {
    return fallback;
  }
}

/** Append any missing locked Level-1 sections without reshuffling. */
function ensureLevel1Sections(tree = []) {
  const existingIds = new Set(tree.map((node) => node.id));
  const missing = buildInitialInspectionFormTree().filter(
    (root) => !existingIds.has(root.id),
  );
  if (!missing.length) return tree;
  const maxSort = tree.reduce(
    (max, node) => Math.max(max, Number(node.sortOrder) || 0),
    -1,
  );
  return [
    ...tree,
    ...missing.map((node, index) => ({
      ...node,
      sortOrder: maxSort + 1 + index,
    })),
  ];
}

/** Keep locked Level-1 copy in sync with the section catalog. */
function syncLevel1SectionMeta(tree = [], { applyCatalogColumns = false } = {}) {
  return tree.map((root) => {
    if (!root?.isLocked) return root;
    const meta = INSPECTION_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampInspectionFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = INSPECTION_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
        if (!catalog || catalog.colSpan == null) return child;
        return { ...child, colSpan: catalog.colSpan };
      });
      return {
        ...next,
        columns,
        children: clampLeavesColSpan(children, columns),
      };
    }

    return next;
  });
}


function remapImageLeavesToFile(nodes = []) {
  return nodes.map((node) => {
    const next = {
      ...node,
      children: remapImageLeavesToFile(node.children || []),
    };
    if (!next.key) return next;
    if (next.fieldType !== "image" && next.fieldType !== "file") return next;
    return {
      ...next,
      fieldType: "file",
      acceptedFileTypes: normalizeAcceptedFileTypes(next.acceptedFileTypes),
    };
  });
}

function ensureTreeSchema() {
  const meta = readMeta();
  let version = meta.treeSchemaVersion || 0;
  if (version >= TREE_SCHEMA_VERSION) return;

  let tree = treeStore.get();
  if (version < 1) {
    tree = syncLevel1SectionMeta(ensureLevel1Sections(tree));
  }
  if (version < 2) {
    // Collapse to Main form + Others only.
    const ids = new Set((tree || []).map((node) => node.id));
    const hasNewStructure = INSPECTION_FORM_SECTIONS.every((section) => ids.has(section.id));
    tree = hasNewStructure
      ? syncLevel1SectionMeta(ensureLevel1Sections(tree), { applyCatalogColumns: true })
      : buildInitialInspectionFormTree();
  }
  if (version < 3) {
    // Default all Level 1 sections to a 1-column layout; refresh setup copy.
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }
  if (version < 4) {
    tree = foldOthersIntoMain(ensureLevel1Sections(tree));
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }

  if (version < 5) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 6) {
    tree = tree.filter((node) => node.id !== INSPECTION_FIELD_TYPE_TEST_LEVEL_ID);
  }

  treeStore.set(sortTreeSiblings(tree));
  writeMeta({ ...meta, treeSchemaVersion: TREE_SCHEMA_VERSION });
}

function writeMeta(meta) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

function getOrderedTree() {
  ensureTreeSchema();
  return sortTreeSiblings(treeStore.get());
}

function buildVisibleFieldIdsBySection(tree = []) {
  return Object.fromEntries(
    tree.map((root) => [
      root.id,
      collectActiveInspectionFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getInspectionFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "ifs_001",
    name: meta.name || "Default Inspection Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getInspectionFormTree(setup = getInspectionFormSetup()) {
  return cloneInspectionFormTree(setup.tree || getOrderedTree());
}

export function saveInspectionFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getInspectionFormSetup();
  const meta = {
    id: current.id,
    name: payload.name?.trim() || current.name,
    isActive: payload.isActive !== false,
    updatedAt: now,
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  };
  writeMeta(meta);
  if (payload.tree) {
    treeStore.set(sortTreeSiblings(payload.tree));
  } else if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(INSPECTION_FORM_SETUP_CHANGED_EVENT));
  }
  return getInspectionFormSetup();
}

export function saveInspectionFormTree(tree) {
  return saveInspectionFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getInspectionFormFields(setup = getInspectionFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getInspectionFormLevel1Ancestor(tree, leaf.id);
      return leafToInspectionField(leaf, l1?.id || null);
    });
}

export function getInspectionFormFieldsBySection(sectionId, setup = getInspectionFormSetup()) {
  return getInspectionFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleInspectionFieldsForSection(
  sectionId,
  setup = getInspectionFormSetup(),
) {
  const root = findInspectionFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveInspectionFormLeaves(root).map((leaf) =>
    leafToInspectionField(leaf, sectionId),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveInspectionFormSections(setup = getInspectionFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveInspectionFormLeaves(root).map((leaf) =>
        leafToInspectionField(leaf, root.id),
      );
      if (!fields.length) return null;
      const sectionMeta = INSPECTION_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampInspectionFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resetInspectionFormSetup() {
  writeMeta({
    id: "ifs_001",
    name: "Default Inspection Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getInspectionFormSetup();
}

export { INSPECTION_FORM_LEVEL_1 };
