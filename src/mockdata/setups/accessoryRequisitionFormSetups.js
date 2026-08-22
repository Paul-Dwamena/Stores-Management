/**
 * Active Accessory / Parts Requisition Form setup — open-ended tree under a fixed Main section.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Accessory / Parts Requisition Forms always see the latest config.
 */

import {
  ACCESSORY_REQUISITION_FORM_LEVEL_1,
  buildInitialAccessoryRequisitionFormTree,
  clampAccessoryRequisitionFormColumns,
  clampLeavesColSpan,
  cloneAccessoryRequisitionFormTree,
  collectActiveAccessoryRequisitionFormLeaves,
  findAccessoryRequisitionFormNodeById,
  findAccessoryRequisitionFormParentNode,
  getAccessoryRequisitionFormLevel1Ancestor,
  getAccessoryRequisitionFormNodePath,
  leafToAccessoryRequisitionField,
} from "./accessoryRequisitionFormTree";
import { ACCESSORY_REQUISITION_FORM_SECTIONS, ACCESSORY_REQUISITION_FORM_FIELD_CATALOG, ACCESSORY_REQUISITION_FORM_GROUPS } from "./accessoryRequisitionFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const ACCESSORY_REQUISITION_FORM_SETUP_CHANGED_EVENT = "fleetly-accessory-requisition-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_accessory_requisition_form_tree",
  eventName: ACCESSORY_REQUISITION_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_ACCESSORY_REQUISITION_FORM_TREE__",
  getSeed: () => buildInitialAccessoryRequisitionFormTree(),
  clone: cloneAccessoryRequisitionFormTree,
});

const META_KEY = "fleetly_accessory_requisition_form_meta";
const TREE_SCHEMA_VERSION = 7;
const SETUP_STEP_FIELD_IDS = ["arq_category", "arq_quantityMode"];
const ACCESSORY_REQUISITION_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "arq_001",
    name: "Default Accessory / Parts Requisition Form",
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
  const missing = buildInitialAccessoryRequisitionFormTree().filter(
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
    const meta = ACCESSORY_REQUISITION_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampAccessoryRequisitionFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = ACCESSORY_REQUISITION_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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

/** Keep locked default folders in sync with the group catalog. */
function syncLockedGroupMeta(tree = []) {
  const byId = Object.fromEntries(
    ACCESSORY_REQUISITION_FORM_GROUPS.map((group) => [`${group.sectionId}/${group.id}`, group]),
  );
  const walk = (nodes = []) =>
    nodes.map((node) => {
      const group = byId[node.id];
      const next = group
        ? { ...node, name: group.label, description: group.description || "" }
        : node;
      return { ...next, children: walk(node.children || []) };
    });
  return walk(tree);
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

/** Insert Category + Number of items ahead of item fields on existing trees. */
function ensureSetupStepFields(tree = []) {
  const seed = buildInitialAccessoryRequisitionFormTree();
  const seedMain = seed.find((root) => root.id === "main_form");
  if (!seedMain) return tree;

  return tree.map((root) => {
    if (root.id !== "main_form") return root;
    const children = [...(root.children || [])];
    const existingIds = new Set(children.map((child) => child.id));
    const missing = SETUP_STEP_FIELD_IDS
      .map((id) => (seedMain.children || []).find((child) => child.id === id))
      .filter((leaf) => leaf && !existingIds.has(leaf.id))
      .map((leaf) => ({
        ...leaf,
        parentId: root.id,
        children: [],
      }));

    if (!missing.length) return root;

    const nextChildren = [...missing, ...children].map((child, index) => ({
      ...child,
      sortOrder: index,
    }));
    return { ...root, children: nextChildren };
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
    tree = tree.filter((node) => node.id !== ACCESSORY_REQUISITION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 4) {
    tree = tree.filter((node) => node.id !== ACCESSORY_REQUISITION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 5) {
    tree = tree.filter((node) => node.id !== ACCESSORY_REQUISITION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 6) {
    tree = syncLevel1SectionMeta(ensureLevel1Sections(tree), { applyCatalogColumns: true });
  }
  if (version < 7) {
    tree = ensureSetupStepFields(tree);
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
  const byId = new Map(tree.map((node) => [node.id, node]));
  const ordered = ACCESSORY_REQUISITION_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(ACCESSORY_REQUISITION_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveAccessoryRequisitionFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getAccessoryRequisitionFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "arq_001",
    name: meta.name || "Default Accessory / Parts Requisition Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getAccessoryRequisitionFormTree(setup = getAccessoryRequisitionFormSetup()) {
  return cloneAccessoryRequisitionFormTree(setup.tree || getOrderedTree());
}

export function saveAccessoryRequisitionFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getAccessoryRequisitionFormSetup();
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
    window.dispatchEvent(new CustomEvent(ACCESSORY_REQUISITION_FORM_SETUP_CHANGED_EVENT));
  }
  return getAccessoryRequisitionFormSetup();
}

export function saveAccessoryRequisitionFormTree(tree) {
  return saveAccessoryRequisitionFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getAccessoryRequisitionFormFields(setup = getAccessoryRequisitionFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getAccessoryRequisitionFormLevel1Ancestor(tree, leaf.id);
      return leafToAccessoryRequisitionField(leaf, l1?.id || null);
    });
}

export function getAccessoryRequisitionFormFieldsBySection(sectionId, setup = getAccessoryRequisitionFormSetup()) {
  return getAccessoryRequisitionFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleAccessoryRequisitionFieldsForSection(
  sectionId,
  setup = getAccessoryRequisitionFormSetup(),
) {
  const root = findAccessoryRequisitionFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveAccessoryRequisitionFormLeaves(root).map((leaf) =>
    leafToAccessoryRequisitionField(leaf, sectionId),
  );
}

/**
 * Main section with nested folder fields flattened and tagged with group metadata.
 */
export function getActiveAccessoryRequisitionFormSections(setup = getAccessoryRequisitionFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampAccessoryRequisitionFormColumns(
        root.columns ?? ACCESSORY_REQUISITION_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 2,
      );
      const fields = collectActiveAccessoryRequisitionFormLeaves(root).map((leaf) => {
        const field = leafToAccessoryRequisitionField(leaf, root.id);
        const parent = findAccessoryRequisitionFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getAccessoryRequisitionFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampAccessoryRequisitionFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = ACCESSORY_REQUISITION_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: sectionColumns,
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Section chips — same order as getActiveAccessoryRequisitionFormSections. */
export function getAccessoryRequisitionFormSteps(setup = getAccessoryRequisitionFormSetup()) {
  return getActiveAccessoryRequisitionFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetAccessoryRequisitionFormSetup() {
  writeMeta({
    id: "arq_001",
    name: "Default Accessory / Parts Requisition Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getAccessoryRequisitionFormSetup();
}

export function getAllVisibleAccessoryRequisitionFormFields(
  setup = getAccessoryRequisitionFormSetup(),
) {
  return getActiveAccessoryRequisitionFormSections(setup).flatMap((section) => section.fields || []);
}

export function getInitialAccessoryRequisitionFormValues(
  setup = getAccessoryRequisitionFormSetup(),
) {
  const values = {};
  for (const field of getAllVisibleAccessoryRequisitionFormFields(setup)) {
    const formKey = field.formKey || field.key;
    if (!formKey) continue;
    if (field.fieldType === "checkbox") {
      values[formKey] = field.defaultValue === true;
      continue;
    }
    if (field.fieldType === "checklist") {
      values[formKey] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      continue;
    }
    if (field.fieldType === "file" || field.fieldType === "image") {
      values[formKey] = null;
      continue;
    }
    if (field.fieldType === "location") {
      values[formKey] = "";
      values[`${formKey}Lat`] = null;
      values[`${formKey}Lng`] = null;
      continue;
    }
    if (
      field.defaultValue !== undefined
      && field.defaultValue !== null
      && field.defaultValue !== ""
    ) {
      values[formKey] = field.defaultValue;
      continue;
    }
    values[formKey] = "";
  }
  return values;
}

export { ACCESSORY_REQUISITION_FORM_LEVEL_1 };
