/**
 * Active Fuel form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Accident forms always see the latest config.
 */

import {
  ACCIDENT_FORM_LEVEL_1,
  buildInitialAccidentFormTree,
  clampAccidentFormColumns,
  clampLeavesColSpan,
  cloneAccidentFormTree,
  collectActiveAccidentFormLeaves,
  findAccidentFormNodeById,
  getAccidentFormLevel1Ancestor,
  leafToAccidentField,
} from "./accidentFormTree";
import { ACCIDENT_FORM_SECTIONS, ACCIDENT_FORM_FIELD_CATALOG } from "./accidentFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const ACCIDENT_FORM_SETUP_CHANGED_EVENT = "fleetly-accident-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_accident_form_tree",
  eventName: ACCIDENT_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_ACCIDENT_FORM_TREE__",
  getSeed: () => buildInitialAccidentFormTree(),
  clone: cloneAccidentFormTree,
});

const META_KEY = "fleetly_accident_form_meta";
const TREE_SCHEMA_VERSION = 3;
const ACCIDENT_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "accf_001",
    name: "Default Accident Form",
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
  const missing = buildInitialAccidentFormTree().filter(
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
    const meta = ACCIDENT_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampAccidentFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = ACCIDENT_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 3) {
    tree = tree.filter((node) => node.id !== ACCIDENT_FIELD_TYPE_TEST_LEVEL_ID);
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
      collectActiveAccidentFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getAccidentFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "accf_001",
    name: meta.name || "Default Accident Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getAccidentFormTree(setup = getAccidentFormSetup()) {
  return cloneAccidentFormTree(setup.tree || getOrderedTree());
}

export function saveAccidentFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getAccidentFormSetup();
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
    window.dispatchEvent(new CustomEvent(ACCIDENT_FORM_SETUP_CHANGED_EVENT));
  }
  return getAccidentFormSetup();
}

export function saveAccidentFormTree(tree) {
  return saveAccidentFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getAccidentFormFields(setup = getAccidentFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getAccidentFormLevel1Ancestor(tree, leaf.id);
      return leafToAccidentField(leaf, l1?.id || null);
    });
}

export function getAccidentFormFieldsBySection(sectionId, setup = getAccidentFormSetup()) {
  return getAccidentFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleAccidentFieldsForSection(
  sectionId,
  setup = getAccidentFormSetup(),
) {
  const root = findAccidentFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveAccidentFormLeaves(root).map((leaf) =>
    leafToAccidentField(leaf, sectionId),
  );
}

/**
 * Wizard steps follow Level-1 tree order after Move up / Move down.
 * Each step includes Level-2 collapsible subsections with their leaf fields.
 */
export function getActiveAccidentFormSections(setup = getAccidentFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionMeta = ACCIDENT_FORM_SECTIONS.find((section) => section.id === root.id);
      const groupChildren = [...(root.children || [])]
        .filter((child) => child && child.isActive !== false && !child.key)
        .sort((a, b) => {
          const orderA = Number.isFinite(a?.sortOrder) ? a.sortOrder : 0;
          const orderB = Number.isFinite(b?.sortOrder) ? b.sortOrder : 0;
          return orderA - orderB;
        });

      const subsections = groupChildren
        .map((group, groupIndex) => {
          const fields = collectActiveAccidentFormLeaves(group).map((leaf) =>
            leafToAccidentField(leaf, root.id),
          );
          if (!fields.length) return null;
          return {
            id: group.formKey || group.id.split("/").pop(),
            nodeId: group.id,
            label: group.name,
            description: group.description || "",
            columns: clampAccidentFormColumns(group.columns ?? 2),
            sortOrder: Number.isFinite(group.sortOrder) ? group.sortOrder : groupIndex,
            fields,
          };
        })
        .filter(Boolean);

      if (!subsections.length) return null;

      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampAccidentFormColumns(root.columns ?? 1),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        subsections,
        fields: subsections.flatMap((subsection) => subsection.fields),
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Wizard step chips — same order as getActiveAccidentFormSections. */
export function getAccidentWizardSteps(setup = getAccidentFormSetup()) {
  return getActiveAccidentFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetAccidentFormSetup() {
  writeMeta({
    id: "accf_001",
    name: "Default Accident Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getAccidentFormSetup();
}

export { ACCIDENT_FORM_LEVEL_1 };
