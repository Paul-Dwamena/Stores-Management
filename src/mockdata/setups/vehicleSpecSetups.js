/**
 * Active vehicle specifications setup — open-ended tree under fixed Level 1 roots.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so forms always see the latest order.
 */

import {
  VEHICLE_SPEC_LEVEL_1,
  VEHICLE_SPEC_SECTIONS,
  buildInitialVehicleSpecTree,
  clampSpecColSpan,
  clampSpecColumns,
  cloneSpecTree,
  collectActiveSpecLeaves,
  findSpecNodeById,
  getSpecLevel1Ancestor,
  getSpecNodePath,
  leafToSpecField,
} from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const VEHICLE_SPEC_SETUP_CHANGED_EVENT = "fleetly-vehicle-spec-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_vehicle_spec_tree",
  eventName: VEHICLE_SPEC_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_VEHICLE_SPEC_TREE__",
  getSeed: () => buildInitialVehicleSpecTree(),
  clone: cloneSpecTree,
});

const META_KEY = "fleetly_vehicle_spec_meta";
const TREE_SCHEMA_VERSION = 6;

function readMeta() {
  const fallback = {
    id: "vss_001",
    name: "Default Vehicle Specifications",
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

function writeMeta(meta) {
  if (typeof sessionStorage === "undefined") return;
  try {
    sessionStorage.setItem(META_KEY, JSON.stringify(meta));
  } catch {
    // ignore
  }
}

/** Stamp layout + locked-default fields onto older session trees. */
function migrateSpecTreeLayout(nodes = [], sectionColumns = 3) {
  const seedById = new Map();
  flattenIncludingInactive(buildInitialVehicleSpecTree()).forEach((node) => {
    seedById.set(node.id, node);
  });

  const walk = (list = [], parentColumns = sectionColumns) =>
    list.map((node) => {
      const seed = seedById.get(node.id);
      const columns = node.isLocked
        ? clampSpecColumns(node.columns ?? parentColumns)
        : null;
      const nextColumns = node.isLocked ? columns : parentColumns;
      const next = {
        ...node,
        columns: node.isLocked ? columns : null,
        colSpan: node.key
          ? clampSpecColSpan(
              node.colSpan
                ?? seed?.colSpan
                ?? 1,
              nextColumns,
            )
          : null,
        required: node.key ? node.required === true || seed?.required === true : false,
        isDefaultLocked: node.key ? seed?.isDefaultLocked === true : false,
        placeholder: node.key
          ? (node.placeholder ?? seed?.placeholder ?? "")
          : "",
        defaultValue: node.key
          ? (node.defaultValue ?? seed?.defaultValue ?? (node.fieldType === "checkbox" ? false : ""))
          : "",
        options: node.key
          ? (node.options ?? seed?.options ?? null)
          : null,
      };
      if (node.children?.length) {
        next.children = walk(node.children, nextColumns);
      }
      return next;
    });

  return walk(nodes, 3);
}

/** Fold legacy `unit` into field names and drop the unit property. */
function migrateSpecTreeUnitsIntoNames(nodes = []) {
  const seedById = new Map();
  flattenIncludingInactive(buildInitialVehicleSpecTree()).forEach((node) => {
    seedById.set(node.id, node);
  });

  const walk = (list = []) =>
    list.map((node) => {
      const seed = seedById.get(node.id);
      const next = { ...node };
      if (node.key) {
        if (seed?.name) {
          next.name = seed.name;
        } else if (
          node.unit
          && !String(node.name || "").includes(`(${node.unit})`)
        ) {
          next.name = `${node.name} (${node.unit})`;
        }
        delete next.unit;
      } else {
        delete next.unit;
      }
      if (node.children?.length) {
        next.children = walk(node.children);
      }
      return next;
    });

  return walk(nodes);
}

/** Append any missing locked Level-1 sections (e.g. Others) without reshuffling. */
function ensureLevel1Sections(tree = []) {
  const existingIds = new Set(tree.map((node) => node.id));
  const missing = buildInitialVehicleSpecTree().filter(
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
    const meta = VEHICLE_SPEC_LEVEL_1.find((section) => section.id === root.id);
    if (!meta) return root;
    return {
      ...root,
      name: meta.name,
      description:
        meta.description || root.description || `${meta.name} specification group.`,
    };
  });
}

function ensureTreeSchema() {
  const meta = readMeta();
  let version = meta.treeSchemaVersion || 0;
  if (version >= TREE_SCHEMA_VERSION) return;

  let tree = treeStore.get();
  if (version < 2) {
    tree = migrateSpecTreeLayout(tree);
  }
  if (version < 3) {
    tree = migrateSpecTreeLayout(tree);
  }
  if (version < 4) {
    tree = syncLevel1SectionMeta(
      migrateSpecTreeLayout(ensureLevel1Sections(tree)),
    );
  }
  if (version < 5) {
    tree = migrateSpecTreeLayout(tree);
  }
  if (version < 6) {
    tree = migrateSpecTreeUnitsIntoNames(tree);
  }

  treeStore.set(sortTreeSiblings(tree));
  writeMeta({ ...meta, treeSchemaVersion: TREE_SCHEMA_VERSION });
}

function getOrderedTree() {
  ensureTreeSchema();
  return sortTreeSiblings(treeStore.get());
}

export function getVehicleSpecSetup() {
  const meta = readMeta();
  return {
    id: meta.id || "vss_001",
    name: meta.name || "Default Vehicle Specifications",
    isActive: meta.isActive !== false,
    tree: getOrderedTree(),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getVehicleSpecTree(setup = getVehicleSpecSetup()) {
  return cloneSpecTree(setup.tree || getOrderedTree());
}

export function saveVehicleSpecSetup(payload) {
  const now = new Date().toISOString();
  const current = getVehicleSpecSetup();
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
    window.dispatchEvent(new CustomEvent(VEHICLE_SPEC_SETUP_CHANGED_EVENT));
  }
  return getVehicleSpecSetup();
}

export function saveVehicleSpecTree(tree) {
  return saveVehicleSpecSetup({ tree });
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getVehicleSpecFields(setup = getVehicleSpecSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => !node.children?.length && node.key)
    .map((leaf) => {
      const l1 = getSpecLevel1Ancestor(tree, leaf.id);
      const field = leafToSpecField(leaf, l1?.id || null, l1?.columns ?? 3);
      field.pathLabel = getSpecNodePath(tree, leaf.id).slice(1).join(" › ");
      return field;
    });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

export function getVehicleSpecFieldsBySection(sectionId, setup = getVehicleSpecSetup()) {
  return getVehicleSpecFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVehicleSpecFieldByApiKey(apiKey, setup = getVehicleSpecSetup()) {
  return getVehicleSpecFields(setup).find((field) => field.key === apiKey) ?? null;
}

export function getVisibleVehicleSpecFieldsForSection(
  sectionId,
  setup = getVehicleSpecSetup(),
) {
  const root = findSpecNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  const columns = clampSpecColumns(root.columns ?? 3);
  return collectActiveSpecLeaves(root).map((leaf) => {
    const field = leafToSpecField(leaf, sectionId, columns);
    field.pathLabel = getSpecNodePath(setup.tree || [], leaf.id).slice(1).join(" › ");
    return field;
  });
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted (they cannot appear on the form).
 */
export function getActiveVehicleSpecSections(setup = getVehicleSpecSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const columns = clampSpecColumns(root.columns ?? 3);
      const fields = collectActiveSpecLeaves(root).map((leaf) => {
        const field = leafToSpecField(leaf, root.id, columns);
        field.pathLabel = getSpecNodePath(tree, leaf.id).slice(1).join(" › ");
        return field;
      });
      if (!fields.length) return null;
      return {
        id: root.id,
        label: root.name,
        description: root.description || `${root.name} specification group.`,
        columns,
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

export function getAllVisibleVehicleSpecFields(setup = getVehicleSpecSetup()) {
  return getActiveVehicleSpecSections(setup).flatMap((section) => section.fields);
}

const BATTERY_CAPACITY_FIELD_KEYS = new Set(["battery_capacity", "batteryCapacity"]);
const FUEL_CAPACITY_FIELD_KEYS = new Set([
  "fuel_capacity",
  "fuelCapacity",
  "fuel_tank_1_capacity",
  "fuelTank1Capacity",
  "fuel_tank_2_capacity",
  "fuelTank2Capacity",
]);

/** Capacity fields shown based on selected Fuel Type (Electric / Hybrid / combustion). */
export function isVehicleSpecFieldVisibleForFuelType(field, fuelType) {
  const key = field?.key || field?.formKey || "";
  const normalizedFuel = String(fuelType || "").toUpperCase();
  const needsBattery = normalizedFuel === "ELECTRIC" || normalizedFuel === "HYBRID";
  const needsFuel = ["GASOLINE", "DIESEL", "HYBRID"].includes(normalizedFuel);

  if (BATTERY_CAPACITY_FIELD_KEYS.has(key)) return needsBattery;
  if (FUEL_CAPACITY_FIELD_KEYS.has(key)) return needsFuel;
  return true;
}

export function filterVehicleSpecFieldsByFuelType(fields = [], fuelType) {
  return fields.filter((field) => isVehicleSpecFieldVisibleForFuelType(field, fuelType));
}

export function getFuelTypeDependentSpecFormKeys(fields = []) {
  return fields
    .filter((field) => {
      const key = field?.key || field?.formKey || "";
      return BATTERY_CAPACITY_FIELD_KEYS.has(key) || FUEL_CAPACITY_FIELD_KEYS.has(key);
    })
    .map((field) => field.formKey)
    .filter(Boolean);
}

export function getInitialSpecFormValues(setup = getVehicleSpecSetup()) {
  const values = {};
  for (const field of getVehicleSpecFields(setup)) {
    if (field.fieldType === "checkbox") {
      values[field.formKey] = field.defaultValue === true;
      continue;
    }
    if (field.fieldType === "checklist") {
      values[field.formKey] = [];
      continue;
    }
    if (field.defaultValue !== undefined && field.defaultValue !== null && field.defaultValue !== "") {
      values[field.formKey] = field.defaultValue;
      continue;
    }
    if (
      (field.fieldType === "select" || field.fieldType === "radio")
      && field.options?.length
    ) {
      values[field.formKey] = "";
      continue;
    }
    values[field.formKey] = "";
  }
  values.transmissionType = values.transmissionType || "AUTOMATIC";
  values.fuelType = values.fuelType || "GASOLINE";
  values.brakeSystem = values.brakeSystem ?? "";
  return values;
}

export function formatSpecFieldValue(field, rawValue) {
  if (field.fieldType === "checkbox") {
    return rawValue ? "Yes" : "No";
  }
  if (field.fieldType === "checklist") {
    if (!Array.isArray(rawValue) || !rawValue.length) return "";
    return rawValue.join(", ");
  }
  if (rawValue == null || String(rawValue).trim() === "") return "";
  const text = String(rawValue).trim();
  if (field.fieldType === "image") return text;
  return text;
}

export function buildSpecificationsPayload(formData, fields = getAllVisibleVehicleSpecFields()) {
  return fields
    .map((field) => ({
      key: field.key,
      value: formatSpecFieldValue(field, formData?.[field.formKey]),
    }))
    .filter((row) => row.value);
}

export function resetVehicleSpecSetup() {
  writeMeta({
    id: "vss_001",
    name: "Default Vehicle Specifications",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getVehicleSpecSetup();
}

export { VEHICLE_SPEC_LEVEL_1, VEHICLE_SPEC_SECTIONS };
