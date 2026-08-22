/**
 * Active Insurance Cover form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Add Insurance Cover forms always see the latest config.
 */

import {
  INSURANCE_COVER_FORM_LEVEL_1,
  buildInitialInsuranceCoverFormTree,
  clampInsuranceCoverFormColumns,
  clampLeavesColSpan,
  cloneInsuranceCoverFormTree,
  collectActiveInsuranceCoverFormLeaves,
  findInsuranceCoverFormNodeById,
  getInsuranceCoverFormLevel1Ancestor,
  leafToInsuranceCoverField,
} from "./insuranceCoverFormTree";
import { INSURANCE_COVER_FORM_SECTIONS, INSURANCE_COVER_FORM_FIELD_CATALOG } from "./insuranceCoverFormFields";
import { foldOthersIntoMain } from "./formTreeFieldActions";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const INSURANCE_COVER_FORM_SETUP_CHANGED_EVENT = "fleetly-insurance-cover-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_INSURANCE_COVER_form_tree",
  eventName: INSURANCE_COVER_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_INSURANCE_COVER_FORM_TREE__",
  getSeed: () => buildInitialInsuranceCoverFormTree(),
  clone: cloneInsuranceCoverFormTree,
});

const META_KEY = "fleetly_INSURANCE_COVER_form_meta";
const TREE_SCHEMA_VERSION = 4;
const INSURANCE_COVER_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "inscov_001",
    name: "Default Add Insurance Cover Form",
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
  const missing = buildInitialInsuranceCoverFormTree().filter(
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
    const meta = INSURANCE_COVER_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampInsuranceCoverFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = INSURANCE_COVER_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    tree = foldOthersIntoMain(ensureLevel1Sections(tree));
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }
  if (version < 3) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 4) {
    tree = tree.filter((node) => node.id !== INSURANCE_COVER_FIELD_TYPE_TEST_LEVEL_ID);
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
      collectActiveInsuranceCoverFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getInsuranceCoverFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "inscov_001",
    name: meta.name || "Default Add Insurance Cover Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getInsuranceCoverFormTree(setup = getInsuranceCoverFormSetup()) {
  return cloneInsuranceCoverFormTree(setup.tree || getOrderedTree());
}

export function saveInsuranceCoverFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getInsuranceCoverFormSetup();
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
    window.dispatchEvent(new CustomEvent(INSURANCE_COVER_FORM_SETUP_CHANGED_EVENT));
  }
  return getInsuranceCoverFormSetup();
}

export function saveInsuranceCoverFormTree(tree) {
  return saveInsuranceCoverFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getInsuranceCoverFormFields(setup = getInsuranceCoverFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getInsuranceCoverFormLevel1Ancestor(tree, leaf.id);
      return leafToInsuranceCoverField(leaf, l1?.id || null);
    });
}

export function getInsuranceCoverFormFieldsBySection(sectionId, setup = getInsuranceCoverFormSetup()) {
  return getInsuranceCoverFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleInsuranceCoverFieldsForSection(
  sectionId,
  setup = getInsuranceCoverFormSetup(),
) {
  const root = findInsuranceCoverFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveInsuranceCoverFormLeaves(root).map((leaf) =>
    leafToInsuranceCoverField(leaf, sectionId),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveInsuranceCoverFormSections(setup = getInsuranceCoverFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveInsuranceCoverFormLeaves(root).map((leaf) =>
        leafToInsuranceCoverField(leaf, root.id),
      );
      if (!fields.length) return null;
      const sectionMeta = INSURANCE_COVER_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampInsuranceCoverFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resetInsuranceCoverFormSetup() {
  writeMeta({
    id: "inscov_001",
    name: "Default Add Insurance Cover Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getInsuranceCoverFormSetup();
}

export { INSURANCE_COVER_FORM_LEVEL_1 };
