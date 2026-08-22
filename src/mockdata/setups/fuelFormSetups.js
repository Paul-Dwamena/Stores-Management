/**
 * Active Fuel form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Fuel Entry forms always see the latest config.
 */

import {
  FUEL_FORM_LEVEL_1,
  buildInitialFuelFormTree,
  clampFuelFormColumns,
  clampLeavesColSpan,
  cloneFuelFormTree,
  collectActiveFuelFormLeaves,
  findFuelFormNodeById,
  getFuelFormLevel1Ancestor,
  leafToFuelField,
} from "./fuelFormTree";
import { FUEL_FORM_SECTIONS, FUEL_FORM_FIELD_CATALOG } from "./fuelFormFields";
import { foldOthersIntoMain } from "./formTreeFieldActions";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const FUEL_FORM_SETUP_CHANGED_EVENT = "fleetly-fuel-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_fuel_form_tree",
  eventName: FUEL_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_FUEL_FORM_TREE__",
  getSeed: () => buildInitialFuelFormTree(),
  clone: cloneFuelFormTree,
});

const META_KEY = "fleetly_fuel_form_meta";
const TREE_SCHEMA_VERSION = 4;
const FUEL_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "fuelf_001",
    name: "Default Fuel Logs Entry Form",
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
  const missing = buildInitialFuelFormTree().filter(
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
    const meta = FUEL_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampFuelFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = FUEL_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    tree = tree.filter((node) => node.id !== FUEL_FIELD_TYPE_TEST_LEVEL_ID);
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
      collectActiveFuelFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getFuelFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "fuelf_001",
    name: meta.name || "Default Fuel Logs Entry Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getFuelFormTree(setup = getFuelFormSetup()) {
  return cloneFuelFormTree(setup.tree || getOrderedTree());
}

export function saveFuelFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getFuelFormSetup();
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
    window.dispatchEvent(new CustomEvent(FUEL_FORM_SETUP_CHANGED_EVENT));
  }
  return getFuelFormSetup();
}

export function saveFuelFormTree(tree) {
  return saveFuelFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getFuelFormFields(setup = getFuelFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getFuelFormLevel1Ancestor(tree, leaf.id);
      return leafToFuelField(leaf, l1?.id || null);
    });
}

export function getFuelFormFieldsBySection(sectionId, setup = getFuelFormSetup()) {
  return getFuelFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleFuelFieldsForSection(
  sectionId,
  setup = getFuelFormSetup(),
) {
  const root = findFuelFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveFuelFormLeaves(root).map((leaf) =>
    leafToFuelField(leaf, sectionId),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveFuelFormSections(setup = getFuelFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveFuelFormLeaves(root).map((leaf) =>
        leafToFuelField(leaf, root.id),
      );
      if (!fields.length) return null;
      const sectionMeta = FUEL_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampFuelFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function resetFuelFormSetup() {
  writeMeta({
    id: "fuelf_001",
    name: "Default Fuel Logs Entry Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getFuelFormSetup();
}

export { FUEL_FORM_LEVEL_1 };
