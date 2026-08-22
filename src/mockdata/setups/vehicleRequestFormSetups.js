/**
 * Active Vehicle Request Form setup — open-ended tree under a fixed Main section.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Vehicle Request Forms always see the latest config.
 */

import {
  VEHICLE_REQUEST_FORM_LEVEL_1,
  buildInitialVehicleRequestFormTree,
  clampVehicleRequestFormColumns,
  clampLeavesColSpan,
  cloneVehicleRequestFormTree,
  collectActiveVehicleRequestFormLeaves,
  findVehicleRequestFormNodeById,
  findVehicleRequestFormParentNode,
  getVehicleRequestFormLevel1Ancestor,
  getVehicleRequestFormNodePath,
  leafToVehicleRequestField,
} from "./vehicleRequestFormTree";
import { VEHICLE_REQUEST_FORM_SECTIONS, VEHICLE_REQUEST_FORM_FIELD_CATALOG, VEHICLE_REQUEST_FORM_GROUPS } from "./vehicleRequestFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const VEHICLE_REQUEST_FORM_SETUP_CHANGED_EVENT = "fleetly-vehicle-request-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_vehicle_request_form_tree",
  eventName: VEHICLE_REQUEST_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_VEHICLE_REQUEST_FORM_TREE__",
  getSeed: () => buildInitialVehicleRequestFormTree(),
  clone: cloneVehicleRequestFormTree,
});

const META_KEY = "fleetly_vehicle_request_form_meta";
const TREE_SCHEMA_VERSION = 4;
const VEHICLE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";
const REMOVED_VEHICLE_REQUEST_LEAF_IDS = new Set([
  "vreq_requestType",
  "vreq_neededFrom",
  "vreq_neededUntil",
]);

function readMeta() {
  const fallback = {
    id: "vreq_001",
    name: "Default Vehicle Request Form",
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
  const missing = buildInitialVehicleRequestFormTree().filter(
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
    const meta = VEHICLE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampVehicleRequestFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = VEHICLE_REQUEST_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    VEHICLE_REQUEST_FORM_GROUPS.map((group) => [`${group.sectionId}/${group.id}`, group]),
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

function pruneRemovedLeaves(nodes = []) {
  return nodes
    .filter((node) => !REMOVED_VEHICLE_REQUEST_LEAF_IDS.has(node.id))
    .map((node) => {
      const catalog = VEHICLE_REQUEST_FORM_FIELD_CATALOG.find((field) => field.id === node.id);
      const next = catalog
        ? {
            ...node,
            name: catalog.title,
            description: catalog.description || "",
            colSpan: catalog.colSpan ?? node.colSpan,
            placeholder: catalog.placeholder || node.placeholder,
          }
        : node;
      return { ...next, children: pruneRemovedLeaves(node.children || []) };
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
    tree = pruneRemovedLeaves(remapImageLeavesToFile(tree));
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }
  if (version < 3) {
    tree = tree.filter((node) => node.id !== VEHICLE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
    tree = syncLevel1SectionMeta(tree);
  }
  if (version < 4) {
    tree = tree.filter((node) => node.id !== VEHICLE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
    tree = syncLevel1SectionMeta(tree, { applyCatalogColumns: true });
  }
  if (version < 5) {
    tree = tree.filter((node) => node.id !== VEHICLE_REQUEST_FIELD_TYPE_TEST_LEVEL_ID);
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
  const ordered = VEHICLE_REQUEST_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(VEHICLE_REQUEST_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveVehicleRequestFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getVehicleRequestFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "vreq_001",
    name: meta.name || "Default Vehicle Request Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getVehicleRequestFormTree(setup = getVehicleRequestFormSetup()) {
  return cloneVehicleRequestFormTree(setup.tree || getOrderedTree());
}

export function saveVehicleRequestFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getVehicleRequestFormSetup();
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
    window.dispatchEvent(new CustomEvent(VEHICLE_REQUEST_FORM_SETUP_CHANGED_EVENT));
  }
  return getVehicleRequestFormSetup();
}

export function saveVehicleRequestFormTree(tree) {
  return saveVehicleRequestFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getVehicleRequestFormFields(setup = getVehicleRequestFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getVehicleRequestFormLevel1Ancestor(tree, leaf.id);
      return leafToVehicleRequestField(leaf, l1?.id || null);
    });
}

export function getVehicleRequestFormFieldsBySection(sectionId, setup = getVehicleRequestFormSetup()) {
  return getVehicleRequestFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleVehicleRequestFieldsForSection(
  sectionId,
  setup = getVehicleRequestFormSetup(),
) {
  const root = findVehicleRequestFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveVehicleRequestFormLeaves(root).map((leaf) =>
    leafToVehicleRequestField(leaf, sectionId),
  );
}

/**
 * Main section with nested folder fields flattened and tagged with group metadata.
 */
export function getActiveVehicleRequestFormSections(setup = getVehicleRequestFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampVehicleRequestFormColumns(
        root.columns ?? VEHICLE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 1,
      );
      const fields = collectActiveVehicleRequestFormLeaves(root).map((leaf) => {
        const field = leafToVehicleRequestField(leaf, root.id);
        const parent = findVehicleRequestFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getVehicleRequestFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampVehicleRequestFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = VEHICLE_REQUEST_FORM_SECTIONS.find((section) => section.id === root.id);
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

/** Section chips — same order as getActiveVehicleRequestFormSections. */
export function getVehicleRequestFormSteps(setup = getVehicleRequestFormSetup()) {
  return getActiveVehicleRequestFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetVehicleRequestFormSetup() {
  writeMeta({
    id: "vreq_001",
    name: "Default Vehicle Request Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getVehicleRequestFormSetup();
}

export function getAllVisibleVehicleRequestFormFields(
  setup = getVehicleRequestFormSetup(),
) {
  return getActiveVehicleRequestFormSections(setup).flatMap((section) => section.fields || []);
}

export function getInitialVehicleRequestFormValues(
  setup = getVehicleRequestFormSetup(),
) {
  const values = {};
  for (const field of getAllVisibleVehicleRequestFormFields(setup)) {
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

export { VEHICLE_REQUEST_FORM_LEVEL_1 };
