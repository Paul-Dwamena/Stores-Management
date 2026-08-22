/**
 * Vehicle Specifications hierarchy — separate from vehicle parts/components.
 * Level 1 roots are constants. Depth is open-ended. Values live on leaf nodes only.
 */

import { moveTreeSiblingRelative, reorderTreeSibling } from "../../utils/treeReorder";
import { assertCanHideFormNode, insertChildAt, buildOptionsFieldsFromPayload } from "./formTreeFieldActions";
import { resolveLeafFieldOptions } from "./resolveLeafFieldOptions";

function slugify(value = "") {
  return value
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, "-")
    .replace(/(^-|-$)/g, "");
}

function buildCode(name = "") {
  const words = name.trim().split(/\s+/).filter(Boolean);
  if (words.length === 0) return "";
  if (words.length === 1) return words[0].slice(0, 4).toUpperCase();
  return words.map((word) => word[0]).join("").toUpperCase().slice(0, 6);
}

function toFormKey(apiKey = "") {
  return apiKey.replace(/_([a-z])/g, (_, c) => c.toUpperCase());
}

/** Max characters for form tree / vehicle-spec node display names. */
export const FORM_NODE_NAME_MAX_LENGTH = 60;

/** Leaf value field input types available in setups. */
export const VEHICLE_SPEC_FIELD_TYPE_OPTIONS = [
  { value: "text", label: "Text field" },
  { value: "number", label: "Number" },
  { value: "select", label: "Select" },
  { value: "search_select", label: "Search select" },
  { value: "radio", label: "Radio" },
  { value: "checklist", label: "Checklist" },
  { value: "date", label: "Date" },
  { value: "file", label: "File" },
  { value: "checkbox", label: "Checkbox" },
  { value: "location", label: "Location" },
];

/** Multi-select accept groups for `file` fields. */
export const FILE_ACCEPT_TYPE_OPTIONS = [
  {
    value: "image",
    label: "Images",
    hint: "JPG, PNG, WEBP, GIF",
    accept: "image/jpeg,image/png,image/webp,image/gif,.jpg,.jpeg,.png,.webp,.gif",
  },
  {
    value: "pdf",
    label: "PDF",
    hint: ".pdf",
    accept: "application/pdf,.pdf",
  },
  {
    value: "word",
    label: "Word",
    hint: "DOC, DOCX",
    accept: ".doc,.docx,application/msword,application/vnd.openxmlformats-officedocument.wordprocessingml.document",
  },
  {
    value: "excel",
    label: "Excel",
    hint: "XLS, XLSX",
    accept: ".xls,.xlsx,application/vnd.ms-excel,application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
  },
  {
    value: "csv",
    label: "CSV",
    hint: ".csv",
    accept: "text/csv,.csv",
  },
];

export const ALL_ACCEPTED_FILE_TYPE_VALUES = FILE_ACCEPT_TYPE_OPTIONS.map((option) => option.value);

export function fieldTypeIsFile(fieldType) {
  return fieldType === "file" || fieldType === "image" || fieldType === "photo";
}

export function fieldTypeIsLocation(fieldType) {
  return fieldType === "location";
}

/** Unique accept groups in catalog order. Empty / unknown → all types. */
export function normalizeAcceptedFileTypes(types) {
  const allowed = new Set(ALL_ACCEPTED_FILE_TYPE_VALUES);
  const selected = new Set(
    (Array.isArray(types) ? types : [])
      .map((type) => String(type || "").trim())
      .filter((type) => allowed.has(type)),
  );
  const next = ALL_ACCEPTED_FILE_TYPE_VALUES.filter((value) => selected.has(value));
  return next.length ? next : [...ALL_ACCEPTED_FILE_TYPE_VALUES];
}

export function fileAcceptAttr(types) {
  const normalized = normalizeAcceptedFileTypes(types);
  return FILE_ACCEPT_TYPE_OPTIONS
    .filter((option) => normalized.includes(option.value))
    .map((option) => option.accept)
    .join(",");
}

export function fieldTypeSupportsLengthLimits(fieldType) {
  return fieldType === "text";
}

export function fieldTypeSupportsOptions(fieldType) {
  return fieldType === "select" || fieldType === "radio" || fieldType === "checklist";
}

export function fieldTypeIsSearchSelect(fieldType) {
  return fieldType === "search_select";
}

/** Multi-select checkbox group (like Duties). */
export function fieldTypeIsMultiValue(fieldType) {
  return fieldType === "checklist";
}

export function fieldTypeSupportsPlaceholder(fieldType) {
  return (
    fieldType === "text"
    || fieldType === "number"
    || fieldType === "date"
    || fieldType === "textarea"
    || fieldType === "location"
    || fieldType === "search_select"
  );
}

/** Normalize option rows to `{ value, label }`. */
export function normalizeFieldOptions(options) {
  if (!options?.length) return null;
  const next = options
    .map((opt) => {
      if (typeof opt === "string") {
        const value = opt.trim();
        return value ? { value, label: value } : null;
      }
      const value = String(opt?.value ?? opt?.label ?? "").trim();
      if (!value) return null;
      const label = String(opt?.label ?? value).trim() || value;
      return { value, label };
    })
    .filter(Boolean);
  return next.length ? next : null;
}

export function normalizeDefaultValue(fieldType, value, options = null) {
  if (fieldType === "checkbox") {
    if (value === true || value === "true" || value === "1" || value === "yes") return true;
    if (value === false || value === "false" || value === "0" || value === "no") return false;
    return false;
  }
  if (fieldType === "checklist" || fieldTypeIsFile(fieldType) || fieldType === "location" || fieldType === "search_select") {
    return "";
  }
  if (value == null) return "";
  const text = String(value).trim();
  if (!text) return "";
  if (fieldTypeSupportsOptions(fieldType) && options?.length) {
    const match = options.find((opt) => {
      const optValue = typeof opt === "string" ? opt : opt.value;
      return String(optValue) === text;
    });
    return match ? text : "";
  }
  return text;
}

/** Allowed grid column counts for a Level 1 section. */
export const VEHICLE_SPEC_COLUMN_OPTIONS = [1, 2, 3, 4];

export function clampSpecColumns(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 3;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

export function clampSpecColSpan(value, columns = 3) {
  const max = clampSpecColumns(columns);
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function defaultColSpanForFieldType(fieldType, columns = 3) {
  const max = clampSpecColumns(columns);
  if (fieldTypeIsFile(fieldType) || fieldType === "location" || fieldType === "search_select") return max;
  return 1;
}

function clampLeavesColSpan(children = [], columns) {
  return children.map((child) => {
    if (Boolean(child?.key)) {
      return {
        ...child,
        colSpan: clampSpecColSpan(child.colSpan ?? 1, columns),
      };
    }
    return {
      ...child,
      children: clampLeavesColSpan(child.children || [], columns),
    };
  });
}

function parseOptionalLength(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/** Fixed Level 1 roots — not user-creatable / not deletable. */
export const VEHICLE_SPEC_LEVEL_1 = [
  { id: "body_exterior", name: "Body & Exterior" },
  { id: "interior", name: "Interior" },
  { id: "engine", name: "Engine" },
  { id: "transmission", name: "Transmission" },
  { id: "fuel_system", name: "Fuel System" },
  { id: "brakes", name: "Brakes" },
  { id: "suspension", name: "Suspension" },
  { id: "wheels", name: "Wheels" },
  { id: "electrical", name: "Electrical" },
  { id: "hvac", name: "HVAC" },
  { id: "cooling", name: "Cooling" },
  { id: "safety_system", name: "Safety System" },
  { id: "chassis_frame", name: "Chassis Frame" },
  {
    id: "others",
    name: "Others",
    description: "Any other details that do not fit in the sections above.",
  },
];

/** @deprecated Prefer VEHICLE_SPEC_LEVEL_1 — kept for existing imports */
export const VEHICLE_SPEC_SECTIONS = VEHICLE_SPEC_LEVEL_1.map((row) => ({
  id: row.id,
  label: row.name,
  description: row.description || `${row.name} specification group.`,
}));

function L1(name, children = []) {
  const rootMeta = VEHICLE_SPEC_LEVEL_1.find((row) => row.name === name);
  const id = rootMeta?.id ?? slugify(name);
  const sectionColumns = 3;
  return {
    id,
    name,
    code: buildCode(name),
    level: 1,
    parentId: null,
    description: rootMeta?.description || `${name} specification group.`,
    isLocked: true,
    isActive: true,
    key: null,
    formKey: null,
    fieldType: null,
    options: null,
    columns: sectionColumns,
    colSpan: null,
    required: false,
    isDefaultLocked: false,
    children: attachChildren(id, 2, children, sectionColumns),
  };
}

function attachChildren(parentId, level, defs = [], sectionColumns = 3) {
  return defs.map((def) => {
    const idSlug = def.key
      ? String(def.key).replace(/_/g, "-")
      : slugify(def.name);
    const id = `${parentId}/${idSlug}`;
    const children = attachChildren(id, level + 1, def.children || [], sectionColumns);
    const isLeaf = children.length === 0;
    const fieldType = isLeaf ? def.fieldType || "text" : null;
    return {
      id,
      name: def.name,
      code: buildCode(def.name),
      level,
      parentId,
      description: def.description || "",
      isLocked: false,
      isActive: def.isActive !== false,
      key: isLeaf ? def.key || null : null,
      formKey: isLeaf ? def.formKey || (def.key ? toFormKey(def.key) : null) : null,
      fieldType,
      options: isLeaf ? normalizeFieldOptions(def.options) : null,
      placeholder: isLeaf ? def.placeholder || "" : "",
      defaultValue: isLeaf
        ? normalizeDefaultValue(
            fieldType,
            def.defaultValue,
            normalizeFieldOptions(def.options),
          )
        : "",
      minLength: isLeaf ? def.minLength ?? null : null,
      maxLength: isLeaf ? def.maxLength ?? null : null,
      columns: null,
      colSpan: isLeaf
        ? clampSpecColSpan(
            def.colSpan ?? defaultColSpanForFieldType(fieldType, sectionColumns),
            sectionColumns,
          )
        : null,
      required: isLeaf ? def.required === true : false,
      isDefaultLocked: isLeaf ? def.isDefaultLocked === true : false,
      children,
    };
  });
}

function field(
  name,
  key,
  fieldType = "text",
  options = null,
  isActive = true,
  isDefaultLocked = false,
) {
  const placeholder =
    fieldType === "number"
      ? "0"
      : fieldType === "text"
        ? `e.g. ${name}`
        : fieldType === "select" || fieldType === "radio"
          ? `Select ${String(name).toLowerCase()}…`
          : "";
  return { name, key, fieldType, options, isActive, isDefaultLocked, placeholder, children: [] };
}

function cat(name, children, isActive = true) {
  return { name, isActive, children };
}

/**
 * Seed hierarchy: L1 constants with nested groups and leaf value fields.
 */
export function buildInitialVehicleSpecTree() {
  const transmissionOptions = [
    { value: "AUTOMATIC", label: "Automatic" },
    { value: "MANUAL", label: "Manual" },
    { value: "CVT", label: "CVT" },
  ];
  const fuelOptions = [
    { value: "GASOLINE", label: "Gasoline" },
    { value: "DIESEL", label: "Diesel" },
    { value: "ELECTRIC", label: "Electric" },
    { value: "HYBRID", label: "Hybrid" },
  ];
  const brakeOptions = [
    { value: "ABS", label: "ABS" },
    { value: "Disc Brakes", label: "Disc Brakes" },
    { value: "Drum Brakes", label: "Drum Brakes" },
  ];

  return [
    L1("Body & Exterior", [
      cat("Dimensions", [
        field("Width (in)", "width", "number", null, true, true),
        field("Height (in)", "height", "number"),
        field("Length (in)", "length", "number"),
        field("Bed Length (ft)", "bed_length", "number"),
      ]),
      cat("Weight", [
        field("Curb Weight (lb)", "curb_weight", "number", null, true, true),
        field("GVWR (lb)", "gvwr", "number"),
      ]),
    ]),
    L1("Interior", [
      field("Seating Capacity", "seating_capacity", "number", null, true, true),
      field("Cabin Type", "cabin_type", "text", null, false),
    ]),
    L1("Engine", [
      cat("Overview", [
        field("Engine Summary", "engine_summary", "text", null, true, true),
      ]),
      cat("Performance", [
        field("Horsepower (hp)", "horsepower", "number", null, true, true),
        field("Torque (lb-ft)", "torque", "number"),
        field("Compression Ratio", "compression_ratio", "text"),
      ]),
      cat("Fluids", [
        field("Oil Capacity (quarts)", "oil_capacity", "number", null, true, true),
      ]),
    ]),
    L1("Transmission", [
      field("Transmission Type", "transmission_type", "select", transmissionOptions, true, true),
      field("Gears", "gears", "number"),
    ]),
    L1("Fuel System", [
      field("Fuel Type", "fuel_type", "select", fuelOptions, true, true),
      field("Battery Capacity (kWh)", "battery_capacity", "number"),
      field("Fuel Capacity (gal)", "fuel_capacity", "number"),
      cat("Tank Capacity", [
        field("Fuel Tank 1 Capacity (gal)", "fuel_tank_1_capacity", "number", null, false, true),
        field("Fuel Tank 2 Capacity (gal)", "fuel_tank_2_capacity", "number", null, false),
      ]),
    ]),
    L1("Brakes", [
      field("Brake System", "brake_system", "select", brakeOptions, true, true),
    ]),
    L1("Suspension", [
      field("Ground Clearance (in)", "ground_clearance", "number", null, true, true),
    ]),
    L1("Wheels", [
      field("Wheel Size", "wheel_size", "text", null, true, true),
      field("Tyre Size", "tyre_size", "text", null, false),
    ]),
    L1("Electrical", [
      field("Battery Type", "battery_type", "text", null, true, true),
      field("Battery Voltage (V)", "battery_voltage", "number", null, false),
    ]),
    L1("HVAC", [
      field("Climate Control", "climate_control", "text", null, true, true),
    ]),
    L1("Cooling", [
      field("Coolant Capacity (L)", "coolant_capacity", "number", null, true, true),
    ]),
    L1("Safety System", [
      field("Airbags", "airbags", "text", null, true, true),
    ]),
    L1("Chassis Frame", [
      field("Frame Type", "frame_type", "text", null, true, true),
    ]),
    L1("Others", []),
  ];
}

export function cloneSpecTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    options: node.options
      ? node.options.map((opt) => (typeof opt === "string" ? opt : { ...opt }))
      : null,
    children: cloneSpecTree(node.children || []),
  }));
}

export function isSpecLeaf(node) {
  return !node?.children?.length;
}

/** True when the node is a value field (cannot have children). */
export function isSpecValueField(node) {
  return Boolean(node?.key);
}

export function flattenSpecTree(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenSpecTree(node.children, acc);
  });
  return acc;
}

export function findSpecNodeById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findSpecNodeById(node.children || [], id);
    if (match) return match;
  }
  return null;
}

export function findSpecParentNode(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const match = findSpecParentNode(node.children || [], id, node);
    if (match) return match;
  }
  return null;
}

export function getSpecLevel1Ancestor(nodes = [], nodeId) {
  let current = findSpecNodeById(nodes, nodeId);
  if (!current) return null;
  while (current?.parentId) {
    const parent = findSpecNodeById(nodes, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.level === 1 ? current : null;
}

export function getSpecNodePath(nodes = [], nodeId) {
  const path = [];
  let current = findSpecNodeById(nodes, nodeId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId ? findSpecNodeById(nodes, current.parentId) : null;
  }
  return path;
}

export function getSpecDescendantCount(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + getSpecDescendantCount(child),
    0,
  );
}

/** Active leaf nodes (value fields) under a subtree. */
export function collectActiveSpecLeaves(node) {
  if (!node || node.isActive === false || node.isHidden === true) return [];
  if (isSpecLeaf(node)) {
    return node.key ? [node] : [];
  }
  return (node.children || []).flatMap((child) => collectActiveSpecLeaves(child));
}

export function collectAllActiveSpecLeaves(nodes = []) {
  return nodes.flatMap((node) => collectActiveSpecLeaves(node));
}

function nodeMatchesSearch(node, query) {
  const haystack = `${node.name} ${node.code || ""} ${node.key || ""}`.toLowerCase();
  if (haystack.includes(query)) return true;
  return node.children?.some((child) => nodeMatchesSearch(child, query));
}

function filterNodes(nodes = [], query) {
  if (!query) return nodes;
  return nodes
    .map((node) => {
      const filteredChildren = filterNodes(node.children || [], query);
      if (nodeMatchesSearch(node, query) || filteredChildren.length > 0) {
        return { ...node, children: filteredChildren };
      }
      return null;
    })
    .filter(Boolean);
}

export function filterSpecTree(nodes = [], searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return nodes;
  return filterNodes(nodes, query);
}

export function getSpecParentOptions(nodes = [], { excludeId = null } = {}) {
  return flattenSpecTree(nodes)
    .filter((node) => {
      if (isSpecValueField(node)) return false;
      if (!excludeId) return true;
      if (node.id === excludeId) return false;
      if (node.id.startsWith(`${excludeId}/`)) return false;
      return true;
    })
    .map((node) => ({
      value: node.id,
      label: `${"— ".repeat(Math.max(0, node.level - 1))}${node.name} (Level ${node.level})`,
      level: node.level,
      isLocked: node.isLocked,
    }));
}

function insertChild(nodes = [], parentId, childNode, insertAt = "last") {
  if (!parentId) {
    throw new Error("Level 1 roots are fixed. Choose a parent under an existing Level 1 group.");
  }

  return nodes.map((node) => {
    if (node.id === parentId) {
      return {
        ...node,
        children: insertChildAt(node.children || [], childNode, insertAt),
      };
    }
    return {
      ...node,
      children: insertChild(node.children || [], parentId, childNode, insertAt),
    };
  });
}

function updateNodeInTree(nodes = [], nodeId, updates) {
  return nodes.map((node) => {
    if (node.id === nodeId) {
      return { ...node, ...updates };
    }
    return {
      ...node,
      children: updateNodeInTree(node.children || [], nodeId, updates),
    };
  });
}

export function addVehicleSpecNode(nodes = [], payload) {
  const nextTree = cloneSpecTree(nodes);
  const parentId = payload.parentId || null;
  if (!parentId) {
    throw new Error("Level 1 groups are fixed constants. Add items under an existing Level 1.");
  }

  const parent = findSpecNodeById(nextTree, parentId);
  if (!parent) throw new Error("Parent node not found.");
  if (isSpecValueField(parent)) {
    throw new Error("Cannot add a child under a leaf value field.");
  }

  const level = parent.level + 1;
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required.");

  const id = `${parentId}/${slugify(name)}`;
  if (findSpecNodeById(nextTree, id)) {
    throw new Error("An item with this name already exists under the selected parent.");
  }

  const l1 = getSpecLevel1Ancestor(nextTree, parentId);
  const sectionColumns = clampSpecColumns(l1?.columns ?? 3);

  const isValueField = payload.nodeKind !== "group";
  const key =
    payload.key?.trim()
    || (isValueField ? slugify(name).replace(/-/g, "_") : null);
  const fieldType = isValueField ? (payload.fieldType || "text") : null;
  const minLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(payload.minLength)
      : null;
  const maxLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(payload.maxLength)
      : null;

  const {
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
  } = isValueField
    ? buildOptionsFieldsFromPayload(payload, fieldType, normalizeFieldOptions)
    : { options: null, optionsSource: null, dropdownOptionId: null, searchSelectSource: null };
  const placeholder =
    isValueField && fieldTypeSupportsPlaceholder(fieldType)
      ? (payload.placeholder?.trim() || "")
      : "";
  const defaultValue = isValueField
    ? normalizeDefaultValue(fieldType, payload.defaultValue, options)
    : "";

  const child = {
    id,
    name,
    code: payload.code?.trim()?.toUpperCase() || buildCode(name),
    level,
    parentId,
    description: payload.description?.trim() ?? "",
    isLocked: false,
    isActive: payload.isActive ?? true,
    key: isValueField ? key : null,
    formKey: isValueField ? (payload.formKey?.trim() || toFormKey(key)) : null,
    fieldType,
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
    placeholder,
    defaultValue,
    minLength,
    maxLength,
    columns: null,
    colSpan: isValueField
      ? clampSpecColSpan(
          payload.colSpan ?? defaultColSpanForFieldType(fieldType, sectionColumns),
          sectionColumns,
        )
      : null,
    required: isValueField ? payload.required === true : false,
    isDefaultLocked: false,
    children: [],
  };

  return insertChild(nextTree, parentId, child, payload.insertAt);
}

export function updateVehicleSpecNode(nodes = [], nodeId, payload) {
  const nextTree = cloneSpecTree(nodes);
  const existing = findSpecNodeById(nextTree, nodeId);
  if (!existing) return nextTree;

  // Level 1: layout columns only.
  if (existing.isLocked) {
    const columns = clampSpecColumns(payload.columns ?? existing.columns ?? 3);
    return nextTree.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        columns,
        children: clampLeavesColSpan(node.children || [], columns),
      };
    });
  }

  const l1 = getSpecLevel1Ancestor(nextTree, nodeId);
  const sectionColumns = clampSpecColumns(l1?.columns ?? 3);

  // Locked default leaves: column span only.
  if (existing.isDefaultLocked) {
    return updateNodeInTree(nextTree, nodeId, {
      colSpan: clampSpecColSpan(
        payload.colSpan ?? existing.colSpan ?? 1,
        sectionColumns,
      ),
    });
  }

  const isLeaf = isSpecLeaf(existing);
  const isValueField = isLeaf && payload.nodeKind !== "group";
  const name = payload.name?.trim() ?? existing.name;
  const key = isValueField
    ? (payload.key?.trim() || existing.key || slugify(name).replace(/-/g, "_"))
    : null;
  const fieldType = isValueField
    ? (payload.fieldType || existing.fieldType || "text")
    : null;
  const minLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(
          payload.minLength !== undefined ? payload.minLength : existing.minLength,
        )
      : null;
  const maxLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(
          payload.maxLength !== undefined ? payload.maxLength : existing.maxLength,
        )
      : null;

  const {
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
  } = isValueField
    ? buildOptionsFieldsFromPayload(payload, fieldType, normalizeFieldOptions, existing)
    : { options: null, optionsSource: null, dropdownOptionId: null, searchSelectSource: null };
  const placeholder =
    isValueField && fieldTypeSupportsPlaceholder(fieldType)
      ? (
          payload.placeholder !== undefined
            ? String(payload.placeholder || "").trim()
            : (existing.placeholder || "")
        )
      : "";
  const defaultValue = isValueField
    ? normalizeDefaultValue(
        fieldType,
        payload.defaultValue !== undefined ? payload.defaultValue : existing.defaultValue,
        options,
      )
    : "";

  return updateNodeInTree(nextTree, nodeId, {
    name,
    code: payload.code?.trim()?.toUpperCase() || existing.code,
    description: payload.description?.trim() ?? existing.description,
    isActive: payload.isActive ?? existing.isActive,
    key,
    formKey: isValueField ? (payload.formKey?.trim() || toFormKey(key)) : null,
    fieldType,
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
    placeholder,
    defaultValue,
    minLength,
    maxLength,
    columns: isValueField ? null : existing.columns,
    colSpan: isValueField
      ? clampSpecColSpan(
          payload.colSpan !== undefined ? payload.colSpan : existing.colSpan ?? 1,
          sectionColumns,
        )
      : null,
    required: isValueField ? payload.required === true : false,
  });
}

export function toggleVehicleSpecActive(nodes = [], nodeId) {
  const nextTree = cloneSpecTree(nodes);
  const existing = findSpecNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  if (existing.isLocked) {
    throw new Error("Level 1 groups cannot be disabled.");
  }
  if (existing.isDefaultLocked) {
    throw new Error("Locked default fields cannot be disabled.");
  }
  return updateNodeInTree(nextTree, nodeId, { isActive: !existing.isActive });
}


export function toggleVehicleSpecHidden(nodes = [], nodeId) {
  const nextTree = cloneSpecTree(nodes);
  const existing = findSpecNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  assertCanHideFormNode(existing);
  return updateNodeInTree(nextTree, nodeId, { isHidden: existing.isHidden !== true });
}

export function deleteVehicleSpecNode(nodes = [], nodeId) {
  const existing = findSpecNodeById(nodes, nodeId);
  if (existing?.isLocked) {
    throw new Error("Level 1 groups are constants and cannot be deleted.");
  }
  if (existing?.isDefaultLocked) {
    throw new Error("Locked default fields cannot be deleted.");
  }

  const remove = (list = []) =>
    list
      .filter((node) => node.id !== nodeId)
      .map((node) => ({
        ...node,
        children: remove(node.children || []),
      }));

  return remove(cloneSpecTree(nodes));
}

export function reorderVehicleSpecNode(nodes = [], nodeId, direction) {
  const { nodes: next, moved } = reorderTreeSibling(cloneSpecTree(nodes), nodeId, direction);
  if (!moved) {
    throw new Error(
      direction === "up"
        ? "Already at the top among siblings."
        : "Already at the bottom among siblings.",
    );
  }
  return next;
}

export function reorderVehicleSpecNodeRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const { nodes: next, moved, sameParent } = moveTreeSiblingRelative(
    cloneSpecTree(nodes),
    sourceId,
    targetId,
    place,
  );
  if (moved) return next;
  if (sameParent === false) {
    throw new Error("Can only reorder nodes within the same group.");
  }
  return null;
}

export function getSpecLevelLabel(level) {
  return `Level ${level}`;
}

/** Map a leaf node to the legacy field shape used by Add Vehicle / Details. */
export function leafToSpecField(leaf, sectionId, sectionColumns = 3) {
  const columns = clampSpecColumns(sectionColumns);
  const options = resolveLeafFieldOptions(leaf);
  const fieldType = leaf.fieldType || "text";
  return {
    id: leaf.id,
    key: leaf.key,
    formKey: leaf.formKey || toFormKey(leaf.key),
    title: leaf.name,
    description: leaf.description || "",
    fieldType,
    options,
    searchSelectSource: leaf.searchSelectSource || null,
    placeholder: leaf.placeholder || "",
    defaultValue: normalizeDefaultValue(fieldType, leaf.defaultValue, options),
    minLength: leaf.minLength ?? null,
    maxLength: leaf.maxLength ?? null,
    required: leaf.required === true,
    colSpan: clampSpecColSpan(leaf.colSpan ?? 1, columns),
    sectionId,
    isActive: leaf.isActive !== false,
    isDefaultLocked: leaf.isDefaultLocked === true,
  };
}
