/**
 * Active trip form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so trip forms always see the latest config.
 */

import {
  TRIP_FORM_LEVEL_1,
  buildInitialTripFormTree,
  clampTripFormColumns,
  cloneTripFormTree,
  collectActiveTripFormLeaves,
  findTripFormNodeById,
  findTripFormParentNode,
  getTripFormLevel1Ancestor,
  isTripVehicleConditionGroup,
  leafToTripField,
} from "./tripFormTree";
import { TRIP_FORM_SECTIONS } from "./tripFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const TRIP_FORM_SETUP_CHANGED_EVENT = "fleetly-trip-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_trip_form_tree",
  eventName: TRIP_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_TRIP_FORM_TREE__",
  getSeed: () => buildInitialTripFormTree(),
  clone: cloneTripFormTree,
});

const META_KEY = "fleetly_trip_form_meta";
const TREE_SCHEMA_VERSION = 8;
const TRIP_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "tfs_001",
    name: "Default Start & End Trip Form",
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
  const missing = buildInitialTripFormTree().filter(
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
function syncLevel1SectionMeta(tree = []) {
  return tree.map((root) => {
    if (!root?.isLocked) return root;
    const meta = TRIP_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;
    return {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };
  });
}

/** Sync placeholders, column spans, and seed field types onto known leaves. */
function migrateTripFormPlaceholdersAndSpans(nodes = []) {
  const seedById = new Map();
  const walkSeed = (list = []) => {
    list.forEach((node) => {
      seedById.set(node.id, node);
      if (node.children?.length) walkSeed(node.children);
    });
  };
  walkSeed(buildInitialTripFormTree());

  const walk = (list = []) =>
    list.map((node) => {
      const seed = seedById.get(node.id);
      const next = { ...node };
      if (node.key && seed) {
        if (seed.placeholder !== undefined) {
          next.placeholder = seed.placeholder || "";
        }
        if (seed.colSpan != null) {
          next.colSpan = seed.colSpan;
        }
        if (seed.fieldType) {
          next.fieldType = seed.fieldType;
        }
      }
      if (node.children?.length) {
        next.children = walk(node.children);
      }
      return next;
    });

  return walk(nodes);
}

function isUnderVehicleConditionGroup(tree, nodeId, rootId) {
  let current = findTripFormParentNode(tree, nodeId);
  while (current && current.id !== rootId) {
    if (isTripVehicleConditionGroup(current)) return true;
    current = findTripFormParentNode(tree, current.id);
  }
  return false;
}

function attachTripFieldGroupMeta(field, leaf, tree, root) {
  const parent = findTripFormParentNode(tree, leaf.id);
  const isGrouped = Boolean(parent && parent.id !== root.id);
  field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
  field.groupLabel = isGrouped ? parent.name : null;
  field.groupDescription = isGrouped ? (parent.description || "") : "";
  field.groupColumns = isGrouped
    ? clampTripFormColumns(parent.columns ?? root.columns ?? 2)
    : clampTripFormColumns(root.columns ?? 2);
  field.conditionCheck = isUnderVehicleConditionGroup(tree, leaf.id, root.id);
  return field;
}

function migrateVehicleConditionToGroups(tree = []) {
  const seedByRoot = Object.fromEntries(
    buildInitialTripFormTree().map((root) => [root.id, root]),
  );

  return tree.map((root) => {
    const seedRoot = seedByRoot[root.id];
    const seedGroup = (seedRoot?.children || []).find((child) => isTripVehicleConditionGroup(child));
    if (!seedGroup) return root;

    const children = [];
    let inserted = false;
    (root.children || []).forEach((child) => {
      if (isTripVehicleConditionGroup(child)) {
        children.push(child);
        inserted = true;
        return;
      }
      if (child.fieldType === "condition_checks" || child.key === "vehicleConditionChecks") {
        if (!inserted) {
          children.push({
            ...cloneTripFormTree([seedGroup])[0],
            parentId: root.id,
            sortOrder: child.sortOrder,
          });
          inserted = true;
        }
        return;
      }
      children.push(child);
    });

    if (!inserted) {
      children.push({
        ...cloneTripFormTree([seedGroup])[0],
        parentId: root.id,
        sortOrder: children.length,
      });
    }

    return {
      ...root,
      children: children.map((child, index) => ({ ...child, sortOrder: index })),
    };
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

function ensureEndTripCoreFields(tree = []) {
  const seedEnd = buildInitialTripFormTree().find((root) => root.id === "end_trip");
  const seedCore = (seedEnd?.children || []).filter(
    (child) => child.id === "tf_end_driver" || child.id === "tf_end_date",
  );
  if (!seedCore.length) return tree;

  return tree.map((root) => {
    if (root.id !== "end_trip") return root;
    const children = [...(root.children || [])];
    const existingIds = new Set(children.map((child) => child.id));
    const missing = seedCore.filter((child) => !existingIds.has(child.id));
    if (!missing.length) return root;
    return {
      ...root,
      children: [
        ...missing.map((child, index) => ({
          ...child,
          parentId: root.id,
          sortOrder: index,
        })),
        ...children,
      ].map((child, index) => ({ ...child, sortOrder: index })),
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
    tree = migrateTripFormPlaceholdersAndSpans(tree);
  }
  if (version < 3) {
    tree = migrateTripFormPlaceholdersAndSpans(tree);
  }
  if (version < 4) {
    tree = migrateTripFormPlaceholdersAndSpans(tree);
  }
  if (version < 5) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 6) {
    tree = tree.filter((node) => node.id !== TRIP_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 7) {
    tree = migrateVehicleConditionToGroups(tree);
  }
  if (version < 8) {
    tree = ensureEndTripCoreFields(tree);
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
      collectActiveTripFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getTripFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "dfs_001",
    name: meta.name || "Default Start & End Trip Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getTripFormTree(setup = getTripFormSetup()) {
  return cloneTripFormTree(setup.tree || getOrderedTree());
}

export function saveTripFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getTripFormSetup();
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
    window.dispatchEvent(new CustomEvent(TRIP_FORM_SETUP_CHANGED_EVENT));
  }
  return getTripFormSetup();
}

export function saveTripFormTree(tree) {
  return saveTripFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getTripFormFields(setup = getTripFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getTripFormLevel1Ancestor(tree, leaf.id);
      return leafToTripField(leaf, l1?.id || null);
    });
}

export function getTripFormFieldsBySection(sectionId, setup = getTripFormSetup()) {
  return getTripFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleTripFieldsForSection(
  sectionId,
  setup = getTripFormSetup(),
) {
  const root = findTripFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveTripFormLeaves(root).map((leaf) =>
    attachTripFieldGroupMeta(leafToTripField(leaf, sectionId), leaf, setup.tree || [], root),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveTripFormSections(setup = getTripFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveTripFormLeaves(root).map((leaf) =>
        attachTripFieldGroupMeta(leafToTripField(leaf, root.id), leaf, tree, root),
      );
      if (!fields.length) return null;
      const sectionMeta = TRIP_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampTripFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resetTripFormSetup() {
  writeMeta({
    id: "tfs_001",
    name: "Default Start & End Trip Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getTripFormSetup();
}

export { TRIP_FORM_LEVEL_1 };
