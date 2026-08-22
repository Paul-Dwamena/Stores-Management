/**
 * Active Quotation form setup — open-ended tree under fixed Level 1 wizard steps.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so New Quotation forms always see the latest config.
 */

import {
  QUOTATION_FORM_LEVEL_1,
  buildInitialQuotationFormTree,
  clampQuotationFormColumns,
  clampLeavesColSpan,
  cloneQuotationFormTree,
  collectActiveQuotationFormLeaves,
  findQuotationFormNodeById,
  getQuotationFormLevel1Ancestor,
  leafToQuotationField,
} from "./quotationFormTree";
import { QUOTATION_ADJUST_SECTION, QUOTATION_FORM_SECTIONS, QUOTATION_FORM_FIELD_CATALOG } from "./quotationFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const QUOTATION_FORM_SETUP_CHANGED_EVENT = "fleetly-quotation-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_quotation_form_tree",
  eventName: QUOTATION_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_QUOTATION_FORM_TREE__",
  getSeed: () => buildInitialQuotationFormTree(),
  clone: cloneQuotationFormTree,
});

const META_KEY = "fleetly_quotation_form_meta";
const TREE_SCHEMA_VERSION = 7;
const QUOTATION_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "quotf_001",
    name: "Default New Quotation Form",
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
  const missing = buildInitialQuotationFormTree().filter(
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
  const catalog = [...QUOTATION_FORM_SECTIONS, QUOTATION_ADJUST_SECTION];
  return tree.map((root) => {
    if (!root?.isLocked) return root;
    const meta = catalog.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampQuotationFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalogField = QUOTATION_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
        if (!catalogField || catalogField.colSpan == null) return child;
        return { ...child, colSpan: catalogField.colSpan };
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
    // Flatten L2 groups: fields live directly under fixed L1 wizard steps.
    tree = syncLevel1SectionMeta(buildInitialQuotationFormTree(), {
      applyCatalogColumns: true,
    });
  }
  if (version < 3) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 4) {
    tree = tree.filter((node) => node.id !== QUOTATION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 6) {
    // Refresh Initial Details layout (cover type full-width) + official risk class options.
    tree = syncLevel1SectionMeta(buildInitialQuotationFormTree(), {
      applyCatalogColumns: true,
    });
  }
  if (version < 7) {
    // Seats default 5; vehicle/accessories values optional.
    tree = syncLevel1SectionMeta(buildInitialQuotationFormTree(), {
      applyCatalogColumns: true,
    });
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

/** Keep Level-1 roots in the fixed catalog order (not user-reorderable). */
function orderLevel1ByCatalog(tree = []) {
  const catalog = [...QUOTATION_FORM_SECTIONS, QUOTATION_ADJUST_SECTION];
  const byId = new Map(tree.map((node) => [node.id, node]));
  const ordered = catalog.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(catalog.map((section) => section.id));
  const extras = tree.filter((node) => !known.has(node.id));
  return [...ordered, ...extras];
}

function getOrderedTree() {
  ensureTreeSchema();
  return sortTreeSiblings(orderLevel1ByCatalog(treeStore.get()));
}

function buildVisibleFieldIdsBySection(tree = []) {
  return Object.fromEntries(
    tree.map((root) => [
      root.id,
      collectActiveQuotationFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getQuotationFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "quotf_001",
    name: meta.name || "Default New Quotation Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getQuotationFormTree(setup = getQuotationFormSetup()) {
  return cloneQuotationFormTree(setup.tree || getOrderedTree());
}

export function saveQuotationFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getQuotationFormSetup();
  const meta = {
    id: current.id,
    name: payload.name?.trim() || current.name,
    isActive: payload.isActive !== false,
    updatedAt: now,
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  };
  writeMeta(meta);
  if (payload.tree) {
    treeStore.set(sortTreeSiblings(orderLevel1ByCatalog(payload.tree)));
  } else if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(QUOTATION_FORM_SETUP_CHANGED_EVENT));
  }
  return getQuotationFormSetup();
}

export function saveQuotationFormTree(tree) {
  return saveQuotationFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getQuotationFormFields(setup = getQuotationFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getQuotationFormLevel1Ancestor(tree, leaf.id);
      return leafToQuotationField(leaf, l1?.id || null);
    });
}

export function getQuotationFormFieldsBySection(sectionId, setup = getQuotationFormSetup()) {
  return getQuotationFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleQuotationFieldsForSection(
  sectionId,
  setup = getQuotationFormSetup(),
) {
  const root = findQuotationFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveQuotationFormLeaves(root).map((leaf) =>
    leafToQuotationField(leaf, sectionId),
  );
}

/**
 * Wizard steps follow fixed Level-1 catalog order.
 * Fields live directly under each step (no L2 subfolders required).
 */
export function getActiveQuotationFormSections(setup = getQuotationFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveQuotationFormLeaves(root).map((leaf) =>
        leafToQuotationField(leaf, root.id),
      );
      if (!fields.length) return null;
      const sectionMeta =
        QUOTATION_FORM_SECTIONS.find((section) => section.id === root.id) ||
        (root.id === QUOTATION_ADJUST_SECTION.id ? QUOTATION_ADJUST_SECTION : null);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampQuotationFormColumns(root.columns ?? sectionMeta?.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Wizard step chips — main L1s only (excludes Additional Benefits adjust tree). */
export function getQuotationWizardSteps(setup = getQuotationFormSetup()) {
  return getActiveQuotationFormSections(setup)
    .filter((section) => section.id !== QUOTATION_ADJUST_SECTION.id)
    .map((section) => ({
      id: section.id,
      label: section.label,
    }));
}

export function resetQuotationFormSetup() {
  writeMeta({
    id: "quotf_001",
    name: "Default New Quotation Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getQuotationFormSetup();
}

export { QUOTATION_FORM_LEVEL_1 };
