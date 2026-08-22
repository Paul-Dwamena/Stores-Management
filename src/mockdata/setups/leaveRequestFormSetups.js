/**
 * Active Leave Request Form setup — open-ended tree under a fixed Main section.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Leave Request Forms always see the latest config.
 */

import {
  LEAVE_REQUEST_FORM_LEVEL_1,
  buildInitialLeaveRequestFormTree,
  clampLeaveRequestFormColumns,
  clampLeavesColSpan,
  cloneLeaveRequestFormTree,
  collectActiveLeaveRequestFormLeaves,
  findLeaveRequestFormNodeById,
  findLeaveRequestFormParentNode,
  getLeaveRequestFormLevel1Ancestor,
  getLeaveRequestFormNodePath,
  leafToLeaveRequestField,
} from "./leaveRequestFormTree";
import { LEAVE_REQUEST_FORM_SECTIONS, LEAVE_REQUEST_FORM_FIELD_CATALOG, LEAVE_REQUEST_FORM_GROUPS } from "./leaveRequestFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const LEAVE_REQUEST_FORM_SETUP_CHANGED_EVENT = "fleetly-leave-request-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_leave_request_form_tree",
  eventName: LEAVE_REQUEST_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_LEAVE_REQUEST_FORM_TREE__",
  getSeed: () => buildInitialLeaveRequestFormTree(),
  clone: cloneLeaveRequestFormTree,
});

const META_KEY = "fleetly_leave_request_form_meta";
const TREE_SCHEMA_VERSION = 6;
const LEAVE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "lrf_001",
    name: "Default Leave Request Form",
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
  const missing = buildInitialLeaveRequestFormTree().filter(
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
    const meta = LEAVE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampLeaveRequestFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = LEAVE_REQUEST_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    LEAVE_REQUEST_FORM_GROUPS.map((group) => [`${group.sectionId}/${group.id}`, group]),
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
    tree = tree.filter((node) => node.id !== LEAVE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 4) {
    tree = tree.filter((node) => node.id !== LEAVE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 5) {
    tree = tree.filter((node) => node.id !== LEAVE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
  }

  if (version < 6) {
    tree = syncLevel1SectionMeta(ensureLevel1Sections(tree), { applyCatalogColumns: true });
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
  const ordered = LEAVE_REQUEST_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(LEAVE_REQUEST_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveLeaveRequestFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getLeaveRequestFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "lrf_001",
    name: meta.name || "Default Leave Request Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getLeaveRequestFormTree(setup = getLeaveRequestFormSetup()) {
  return cloneLeaveRequestFormTree(setup.tree || getOrderedTree());
}

export function saveLeaveRequestFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getLeaveRequestFormSetup();
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
    window.dispatchEvent(new CustomEvent(LEAVE_REQUEST_FORM_SETUP_CHANGED_EVENT));
  }
  return getLeaveRequestFormSetup();
}

export function saveLeaveRequestFormTree(tree) {
  return saveLeaveRequestFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getLeaveRequestFormFields(setup = getLeaveRequestFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getLeaveRequestFormLevel1Ancestor(tree, leaf.id);
      return leafToLeaveRequestField(leaf, l1?.id || null);
    });
}

export function getLeaveRequestFormFieldsBySection(sectionId, setup = getLeaveRequestFormSetup()) {
  return getLeaveRequestFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleLeaveRequestFieldsForSection(
  sectionId,
  setup = getLeaveRequestFormSetup(),
) {
  const root = findLeaveRequestFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveLeaveRequestFormLeaves(root).map((leaf) =>
    leafToLeaveRequestField(leaf, sectionId),
  );
}

/**
 * Main section with nested folder fields flattened and tagged with group metadata.
 */
export function getActiveLeaveRequestFormSections(setup = getLeaveRequestFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampLeaveRequestFormColumns(
        root.columns ?? LEAVE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 2,
      );
      const fields = collectActiveLeaveRequestFormLeaves(root).map((leaf) => {
        const field = leafToLeaveRequestField(leaf, root.id);
        const parent = findLeaveRequestFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getLeaveRequestFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampLeaveRequestFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = LEAVE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id);
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

/** Section chips — same order as getActiveLeaveRequestFormSections. */
export function getLeaveRequestFormSteps(setup = getLeaveRequestFormSetup()) {
  return getActiveLeaveRequestFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetLeaveRequestFormSetup() {
  writeMeta({
    id: "lrf_001",
    name: "Default Leave Request Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getLeaveRequestFormSetup();
}

export function getAllVisibleLeaveRequestFormFields(
  setup = getLeaveRequestFormSetup(),
) {
  return getActiveLeaveRequestFormSections(setup).flatMap((section) => section.fields || []);
}

export function getInitialLeaveRequestFormValues(
  setup = getLeaveRequestFormSetup(),
) {
  const values = {};
  for (const field of getAllVisibleLeaveRequestFormFields(setup)) {
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

export { LEAVE_REQUEST_FORM_LEVEL_1 };
