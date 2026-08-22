/**
 * Active assignment form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so assignment forms always see the latest config.
 */

import {
  ASSIGNMENT_FORM_LEVEL_1,
  buildInitialAssignmentFormTree,
  clampAssignmentFormColumns,
  clampLeavesColSpan,
  cloneAssignmentFormTree,
  collectActiveAssignmentFormLeaves,
  findAssignmentFormNodeById,
  getAssignmentFormLevel1Ancestor,
  leafToAssignmentField,
} from "./assignmentFormTree";
import { ASSIGNMENT_FORM_SECTIONS, ASSIGNMENT_FORM_FIELD_CATALOG } from "./assignmentFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const ASSIGNMENT_FORM_SETUP_CHANGED_EVENT = "fleetly-assignment-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_assignment_form_tree",
  eventName: ASSIGNMENT_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_ASSIGNMENT_FORM_TREE__",
  getSeed: () => buildInitialAssignmentFormTree(),
  clone: cloneAssignmentFormTree,
});

const META_KEY = "fleetly_assignment_form_meta";
const TREE_SCHEMA_VERSION = 5;
const ASSIGNMENT_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "afs_001",
    name: "Default Assignment Form",
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
  const missing = buildInitialAssignmentFormTree().filter(
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
    const meta = ASSIGNMENT_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampAssignmentFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = ASSIGNMENT_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    // Restructure L1 into Driver / Vehicle / Location & assignment type / Duties / Others.
    // Only rebuild when the tree still has the old shape — never wipe custom children
    // if the new Level 1 ids are already present (e.g. after a meta version reset).
    const ids = new Set((tree || []).map((node) => node.id));
    const hasNewStructure = ASSIGNMENT_FORM_SECTIONS.every((section) =>
      ids.has(section.id),
    );
    tree = hasNewStructure
      ? syncLevel1SectionMeta(ensureLevel1Sections(tree))
      : buildInitialAssignmentFormTree();
  }
  if (version < 3) {
    // Location & assignment type, Duties, and Others default to a 3-column grid.
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }
  if (version < 4) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 5) {
    tree = tree.filter((node) => node.id !== ASSIGNMENT_FIELD_TYPE_TEST_LEVEL_ID);
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
      collectActiveAssignmentFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getAssignmentFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "afs_001",
    name: meta.name || "Default Assignment Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getAssignmentFormTree(setup = getAssignmentFormSetup()) {
  return cloneAssignmentFormTree(setup.tree || getOrderedTree());
}

export function saveAssignmentFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getAssignmentFormSetup();
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
    window.dispatchEvent(new CustomEvent(ASSIGNMENT_FORM_SETUP_CHANGED_EVENT));
  }
  return getAssignmentFormSetup();
}

export function saveAssignmentFormTree(tree) {
  return saveAssignmentFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getAssignmentFormFields(setup = getAssignmentFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getAssignmentFormLevel1Ancestor(tree, leaf.id);
      return leafToAssignmentField(leaf, l1?.id || null);
    });
}

export function getAssignmentFormFieldsBySection(sectionId, setup = getAssignmentFormSetup()) {
  return getAssignmentFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleAssignmentFieldsForSection(
  sectionId,
  setup = getAssignmentFormSetup(),
) {
  const root = findAssignmentFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveAssignmentFormLeaves(root).map((leaf) =>
    leafToAssignmentField(leaf, sectionId),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveAssignmentFormSections(setup = getAssignmentFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveAssignmentFormLeaves(root).map((leaf) =>
        leafToAssignmentField(leaf, root.id),
      );
      if (!fields.length) return null;
      const sectionMeta = ASSIGNMENT_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampAssignmentFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resetAssignmentFormSetup() {
  writeMeta({
    id: "afs_001",
    name: "Default Assignment Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getAssignmentFormSetup();
}

export { ASSIGNMENT_FORM_LEVEL_1 };
