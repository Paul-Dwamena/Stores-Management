/**
 * Active maintenance schedule form setup — open-ended tree under a fixed Main section.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Create Maintenance Schedule forms always see the latest config.
 */

import {
  MAINTENANCE_SCHEDULE_FORM_LEVEL_1,
  buildInitialMaintenanceScheduleFormTree,
  clampMaintenanceScheduleFormColumns,
  clampLeavesColSpan,
  cloneMaintenanceScheduleFormTree,
  collectActiveMaintenanceScheduleFormLeaves,
  findMaintenanceScheduleFormNodeById,
  findMaintenanceScheduleFormParentNode,
  getMaintenanceScheduleFormLevel1Ancestor,
  getMaintenanceScheduleFormNodePath,
  leafToMaintenanceScheduleField,
} from "./maintenanceScheduleFormTree";
import { MAINTENANCE_SCHEDULE_FORM_SECTIONS, MAINTENANCE_SCHEDULE_FORM_FIELD_CATALOG, MAINTENANCE_SCHEDULE_FORM_GROUPS } from "./maintenanceScheduleFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const MAINTENANCE_SCHEDULE_FORM_SETUP_CHANGED_EVENT = "fleetly-maintenance-schedule-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_maintenance_schedule_form_tree",
  eventName: MAINTENANCE_SCHEDULE_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_MAINTENANCE_SCHEDULE_FORM_TREE__",
  getSeed: () => buildInitialMaintenanceScheduleFormTree(),
  clone: cloneMaintenanceScheduleFormTree,
});

const META_KEY = "fleetly_maintenance_schedule_form_meta";
const TREE_SCHEMA_VERSION = 3;
const MAINTENANCE_SCHEDULE_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "msf_001",
    name: "Default Create Maintenance Schedule Form",
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
  const missing = buildInitialMaintenanceScheduleFormTree().filter(
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
    const meta = MAINTENANCE_SCHEDULE_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampMaintenanceScheduleFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = MAINTENANCE_SCHEDULE_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    MAINTENANCE_SCHEDULE_FORM_GROUPS.map((group) => [`${group.sectionId}/${group.id}`, group]),
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
    tree = tree.filter((node) => node.id !== MAINTENANCE_SCHEDULE_FIELD_TYPE_TEST_LEVEL_ID);
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
  const ordered = MAINTENANCE_SCHEDULE_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(MAINTENANCE_SCHEDULE_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveMaintenanceScheduleFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getMaintenanceScheduleFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "msf_001",
    name: meta.name || "Default Create Maintenance Schedule Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getMaintenanceScheduleFormTree(setup = getMaintenanceScheduleFormSetup()) {
  return cloneMaintenanceScheduleFormTree(setup.tree || getOrderedTree());
}

export function saveMaintenanceScheduleFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getMaintenanceScheduleFormSetup();
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
    window.dispatchEvent(new CustomEvent(MAINTENANCE_SCHEDULE_FORM_SETUP_CHANGED_EVENT));
  }
  return getMaintenanceScheduleFormSetup();
}

export function saveMaintenanceScheduleFormTree(tree) {
  return saveMaintenanceScheduleFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getMaintenanceScheduleFormFields(setup = getMaintenanceScheduleFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getMaintenanceScheduleFormLevel1Ancestor(tree, leaf.id);
      return leafToMaintenanceScheduleField(leaf, l1?.id || null);
    });
}

export function getMaintenanceScheduleFormFieldsBySection(sectionId, setup = getMaintenanceScheduleFormSetup()) {
  return getMaintenanceScheduleFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleMaintenanceScheduleFieldsForSection(
  sectionId,
  setup = getMaintenanceScheduleFormSetup(),
) {
  const root = findMaintenanceScheduleFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveMaintenanceScheduleFormLeaves(root).map((leaf) =>
    leafToMaintenanceScheduleField(leaf, sectionId),
  );
}

/**
 * Main section with nested folder fields flattened and tagged with group metadata.
 */
export function getActiveMaintenanceScheduleFormSections(setup = getMaintenanceScheduleFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampMaintenanceScheduleFormColumns(
        root.columns ?? MAINTENANCE_SCHEDULE_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 2,
      );
      const fields = collectActiveMaintenanceScheduleFormLeaves(root).map((leaf) => {
        const field = leafToMaintenanceScheduleField(leaf, root.id);
        const parent = findMaintenanceScheduleFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getMaintenanceScheduleFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampMaintenanceScheduleFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = MAINTENANCE_SCHEDULE_FORM_SECTIONS.find((section) => section.id === root.id);
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

/** Section chips — same order as getActiveMaintenanceScheduleFormSections. */
export function getMaintenanceScheduleFormSteps(setup = getMaintenanceScheduleFormSetup()) {
  return getActiveMaintenanceScheduleFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetMaintenanceScheduleFormSetup() {
  writeMeta({
    id: "msf_001",
    name: "Default Create Maintenance Schedule Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getMaintenanceScheduleFormSetup();
}

export { MAINTENANCE_SCHEDULE_FORM_LEVEL_1 };
