/**
 * Active vehicle registration form setup — open-ended tree under fixed Level 1 sections.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so registration forms always see the latest config.
 */

import {
  VEHICLE_REGISTRATION_FORM_LEVEL_1,
  VEHICLE_REGISTRATION_SYSTEM_SPEC_KEYS,
  buildInitialVehicleRegistrationFormTree,
  clampVehicleRegistrationFormColumns,
  cloneVehicleRegistrationFormTree,
  collectActiveVehicleRegistrationFormLeaves,
  findVehicleRegistrationFormNodeById,
  findVehicleRegistrationFormParentNode,
  getVehicleRegistrationFormLevel1Ancestor,
  getVehicleRegistrationFormNodePath,
  leafToVehicleRegistrationFormField,
} from "./vehicleRegistrationFormTree";
import { VEHICLE_REGISTRATION_FORM_SECTIONS } from "./vehicleRegistrationFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const VEHICLE_REGISTRATION_FORM_SETUP_CHANGED_EVENT = "fleetly-vehicle-registration-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_vehicle_registration_form_tree",
  eventName: VEHICLE_REGISTRATION_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_VEHICLE_REGISTRATION_FORM_TREE__",
  getSeed: () => buildInitialVehicleRegistrationFormTree(),
  clone: cloneVehicleRegistrationFormTree,
});

const META_KEY = "fleetly_vehicle_registration_form_meta";
const TREE_SCHEMA_VERSION = 10;
const VEHICLE_REGISTRATION_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "vrf_001",
    name: "Default Vehicle Registration Forms",
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

/** Textareas default to the parent section's full column width. */
function migrateTextareaColSpans(nodes = [], parentColumns = 2) {
  return nodes.map((node) => {
    const sectionColumns = node.key
      ? parentColumns
      : clampVehicleRegistrationFormColumns(node.columns ?? parentColumns);
    const next = { ...node };
    if (node.fieldType === "textarea") {
      next.colSpan = sectionColumns;
    }
    if (node.children?.length) {
      next.children = migrateTextareaColSpans(node.children, sectionColumns);
    }
    return next;
  });
}

/** Append any missing locked Level-1 sections (e.g. Others) without reshuffling. */
function ensureLevel1Sections(tree = []) {
  const existingIds = new Set(tree.map((node) => node.id));
  const missing = buildInitialVehicleRegistrationFormTree().filter(
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
    const meta = VEHICLE_REGISTRATION_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;
    return {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };
  });
}

/** Stamp placeholder / defaultValue and normalize option rows on leaves. */
function migrateVehicleRegistrationFormFieldConfig(nodes = []) {
  return nodes.map((node) => {
    const next = { ...node };
    if (node.key) {
      next.placeholder = node.placeholder ?? "";
      next.defaultValue =
        node.defaultValue
        ?? (node.fieldType === "checkbox" ? false : "");
      if (node.options?.length) {
        next.options = node.options.map((opt) =>
          typeof opt === "string"
            ? { value: opt, label: opt }
            : { value: String(opt?.value ?? ""), label: String(opt?.label ?? opt?.value ?? "") },
        );
      } else if (
        node.fieldType === "select"
        || node.fieldType === "radio"
      ) {
        next.options = node.options ?? null;
      }
    }
    if (node.children?.length) {
      next.children = migrateVehicleRegistrationFormFieldConfig(node.children);
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

function syncVehicleRegistrationSystemFields(nodes = [], sectionId = null) {
  return nodes.map((node) => {
    const currentSection = node.level === 1 ? node.id : sectionId;
    const children = syncVehicleRegistrationSystemFields(node.children || [], currentSection);
    if (!node.key) return { ...node, children };

    if (currentSection === "details" || currentSection === "settings") {
      const isCatalogField = String(node.id).startsWith("vrf_");
      return {
        ...node,
        isDefaultLocked: isCatalogField ? true : Boolean(node.isDefaultLocked),
        children,
      };
    }

    if (currentSection === "specifications") {
      return {
        ...node,
        isDefaultLocked: VEHICLE_REGISTRATION_SYSTEM_SPEC_KEYS.has(node.key),
        children,
      };
    }

    return { ...node, children };
  });
}

function ensureTreeSchema() {
  const meta = readMeta();
  let version = meta.treeSchemaVersion || 0;
  if (version >= TREE_SCHEMA_VERSION) return;

  let tree = treeStore.get();
  if (version < 3) {
    tree = migrateTextareaColSpans(tree);
  }
  if (version < 4) {
    tree = ensureLevel1Sections(tree);
  }
  if (version < 5) {
    tree = syncLevel1SectionMeta(ensureLevel1Sections(tree));
  }
  if (version < 6) {
    tree = migrateVehicleRegistrationFormFieldConfig(tree);
  }
  if (version < 7) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 8) {
    tree = tree.filter((node) => node.id !== VEHICLE_REGISTRATION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 9) {
    tree = tree.filter((node) => node.id !== VEHICLE_REGISTRATION_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 10) {
    tree = syncVehicleRegistrationSystemFields(tree);
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
      collectActiveVehicleRegistrationFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getVehicleRegistrationFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "vrf_001",
    name: meta.name || "Default Vehicle Registration Forms",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getVehicleRegistrationFormTree(setup = getVehicleRegistrationFormSetup()) {
  return cloneVehicleRegistrationFormTree(setup.tree || getOrderedTree());
}

export function saveVehicleRegistrationFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getVehicleRegistrationFormSetup();
  const meta = {
    id: current.id,
    name: payload.name?.trim() || current.name,
    isActive: payload.isActive !== false,
    updatedAt: now,
  };
  writeMeta(meta);
  if (payload.tree) {
    treeStore.set(sortTreeSiblings(payload.tree));
  } else if (typeof window !== "undefined") {
    window.dispatchEvent(new CustomEvent(VEHICLE_REGISTRATION_FORM_SETUP_CHANGED_EVENT));
  }
  return getVehicleRegistrationFormSetup();
}

export function saveVehicleRegistrationFormTree(tree) {
  return saveVehicleRegistrationFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getVehicleRegistrationFormFields(setup = getVehicleRegistrationFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getVehicleRegistrationFormLevel1Ancestor(tree, leaf.id);
      return leafToVehicleRegistrationFormField(leaf, l1?.id || null);
    });
}

export function getVehicleRegistrationFormFieldsBySection(sectionId, setup = getVehicleRegistrationFormSetup()) {
  return getVehicleRegistrationFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleVehicleRegistrationFieldsForSection(
  sectionId,
  setup = getVehicleRegistrationFormSetup(),
) {
  const root = findVehicleRegistrationFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveVehicleRegistrationFormLeaves(root).map((leaf) =>
    leafToVehicleRegistrationFormField(leaf, sectionId),
  );
}

/**
 * Form sections follow Level-1 tree order after Move up / Move down.
 * Roots with no active leaf fields are omitted.
 */
export function getActiveVehicleRegistrationFormSections(setup = getVehicleRegistrationFormSetup()) {
  const tree = sortTreeSiblings(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const fields = collectActiveVehicleRegistrationFormLeaves(root).map((leaf) => {
        const field = leafToVehicleRegistrationFormField(leaf, root.id);
        const parent = findVehicleRegistrationFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getVehicleRegistrationFormNodePath(tree, leaf.id)
          .slice(1)
          .join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampVehicleRegistrationFormColumns(parent.columns ?? root.columns ?? 2)
          : clampVehicleRegistrationFormColumns(root.columns ?? 2);
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = VEHICLE_REGISTRATION_FORM_SECTIONS.find((section) => section.id === root.id);
      return {
        id: root.id,
        label: root.name,
        description: root.description || sectionMeta?.description || "",
        columns: clampVehicleRegistrationFormColumns(root.columns ?? 2),
        sortOrder: Number.isFinite(root.sortOrder) ? root.sortOrder : index,
        fields,
      };
    })
    .filter(Boolean)
    .sort((a, b) => a.sortOrder - b.sortOrder);
}

/** Flat list of active leaf fields across all registration form sections. */
export function getAllVisibleVehicleRegistrationFormFields(
  setup = getVehicleRegistrationFormSetup(),
) {
  return getActiveVehicleRegistrationFormSections(setup).flatMap((section) => section.fields);
}

/** Seed form state from active vehicle registration form leaves. */
export function getInitialVehicleRegistrationFormValues(
  setup = getVehicleRegistrationFormSetup(),
) {
  const values = {};
  for (const field of getAllVisibleVehicleRegistrationFormFields(setup)) {
    if (!field.formKey) continue;
    if (field.fieldType === "checkbox") {
      values[field.formKey] = field.defaultValue === true;
      continue;
    }
    if (field.fieldType === "checklist") {
      values[field.formKey] = Array.isArray(field.defaultValue) ? field.defaultValue : [];
      continue;
    }
    if (field.fieldType === "file" || field.fieldType === "image") {
      values[field.formKey] = null;
      continue;
    }
    if (field.fieldType === "location") {
      values[field.formKey] = "";
      values[`${field.formKey}Lat`] = null;
      values[`${field.formKey}Lng`] = null;
      continue;
    }
    if (
      field.defaultValue !== undefined
      && field.defaultValue !== null
      && field.defaultValue !== ""
    ) {
      values[field.formKey] = field.defaultValue;
      continue;
    }
    values[field.formKey] = "";
  }

  // Runtime-only fields (not tree leaves)
  values.manufacturerTasks = [
    { taskName: "", intervalKm: "", mileage: "0", intervalDays: "", required: true },
  ];

  // Spec defaults when present
  if (values.transmissionType === undefined || values.transmissionType === "") {
    values.transmissionType = "AUTOMATIC";
  }
  if (values.fuelType === undefined || values.fuelType === "") {
    values.fuelType = "GASOLINE";
  }

  return values;
}

export function resetVehicleRegistrationFormSetup() {
  writeMeta({
    id: "vrf_001",
    name: "Default Vehicle Registration Forms",
    isActive: true,
    updatedAt: new Date().toISOString(),
  });
  treeStore.reset();
  return getVehicleRegistrationFormSetup();
}

export { VEHICLE_REGISTRATION_FORM_LEVEL_1 };
