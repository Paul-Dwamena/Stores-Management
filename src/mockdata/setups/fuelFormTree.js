/**
 * Fuel form hierarchy — fixed Level 1 sections with open-ended nesting.
 * Values live on leaf nodes only (nodes with a `key`).
 */

import { moveTreeSiblingRelative, reorderTreeSibling } from "../../utils/treeReorder";
import {
  DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION,
  FUEL_FORM_FIELD_CATALOG,
  FUEL_FORM_SECTIONS,
  withLockedDefaultFields,
} from "./fuelFormFields";
import {
  VEHICLE_SPEC_FIELD_TYPE_OPTIONS,
  fieldTypeSupportsLengthLimits,
  fieldTypeSupportsPlaceholder,
  normalizeAcceptedFileTypes,
  normalizeDefaultValue,
  normalizeFieldOptions,
} from "./vehicleSpecTree";
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

function toCamelKey(name = "") {
  const slug = slugify(name);
  if (!slug) return "";
  return slug.replace(/-([a-z0-9])/g, (_, c) => c.toUpperCase());
}

function normalizeOptions(options) {
  return normalizeFieldOptions(options);
}

function parseOptionalLength(value) {
  if (value === "" || value == null) return null;
  const n = Number(value);
  if (!Number.isFinite(n) || n < 0) return null;
  return Math.floor(n);
}

/** Same value-field types as Vehicle Specifications. */
export const FUEL_FORM_FIELD_TYPE_OPTIONS = VEHICLE_SPEC_FIELD_TYPE_OPTIONS;

/** Allowed grid column counts for a Level 1 section. */
export const FUEL_FORM_COLUMN_OPTIONS = [1, 2, 3, 4];

export function clampFuelFormColumns(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

export function clampFuelFormColSpan(value, columns = 2) {
  const max = clampFuelFormColumns(columns);
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.floor(n)));
}


function isUploadFileFieldType(fieldType) {
  return fieldType === "file" || fieldType === "image";
}

function defaultColSpanForFieldType(fieldType, columns = 2) {
  const max = clampFuelFormColumns(columns);
  // Fuel Entry defaults new fields to full row width (volume/amount stay half in catalog).
  return max;
}

export function clampLeavesColSpan(children = [], columns) {
  return children.map((child) => {
    if (child?.key) {
      return {
        ...child,
        colSpan: clampFuelFormColSpan(child.colSpan ?? columns, columns),
      };
    }
    return {
      ...child,
      children: clampLeavesColSpan(child.children || [], columns),
    };
  });
}

/** Fixed Level 1 roots — not user-creatable / not deletable. */
export const FUEL_FORM_LEVEL_1 = FUEL_FORM_SECTIONS.map((section) => ({
  id: section.id,
  name: section.label,
  description: section.description,
}));

/**
 * Seed hierarchy from the existing section + field catalog.
 * Default visibility matches the Default Report Fuel form setup.
 */
export function buildInitialFuelFormTree() {
  const visibleBySection = withLockedDefaultFields(DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION);

  return FUEL_FORM_SECTIONS.map((section, index) => {
    const visibleIds = new Set(visibleBySection[section.id] ?? []);
    const fields = FUEL_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id,
    );
    const sectionColumns = clampFuelFormColumns(section.columns ?? 2);

    return {
      id: section.id,
      name: section.label,
      code: buildCode(section.label),
      level: 1,
      parentId: null,
      description: section.description || "",
      isLocked: true,
      isActive: true,
      key: null,
      formKey: null,
      fieldType: null,
      minLength: null,
      maxLength: null,
      required: false,
      isDefaultLocked: false,
      options: null,
      columns: sectionColumns,
      colSpan: null,
      sortOrder: index,
      children: fields.map((field, fieldIndex) => {
        const fieldType = field.fieldType || "text";
        return {
          id: field.id,
          name: field.title,
          code: buildCode(field.title),
          level: 2,
          parentId: section.id,
          description: field.description || "",
          isLocked: false,
          isActive: visibleIds.has(field.id) || field.isDefaultLocked === true,
          key: field.key,
          formKey: field.key,
          fieldType,
          minLength: field.minLength ?? null,
          maxLength: field.maxLength ?? null,
          required: field.required === true,
          isDefaultLocked: field.isDefaultLocked === true,
          options: normalizeOptions(field.options),
          placeholder: field.placeholder || "",
          defaultValue: normalizeDefaultValue(
            fieldType,
            field.defaultValue,
            normalizeOptions(field.options),
          ),
          columns: null,
          colSpan: clampFuelFormColSpan(
            field.colSpan ?? defaultColSpanForFieldType(fieldType, sectionColumns),
            sectionColumns,
          ),
          acceptedFileTypes: isUploadFileFieldType(fieldType)
            ? normalizeAcceptedFileTypes(field.acceptedFileTypes)
            : null,
          sortOrder: fieldIndex,
          children: [],
        };
      }),
    };
  });
}

export function cloneFuelFormTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    options: node.options
      ? node.options.map((opt) => (typeof opt === "string" ? opt : { ...opt }))
      : null,
    acceptedFileTypes: Array.isArray(node.acceptedFileTypes)
      ? [...node.acceptedFileTypes]
      : node.acceptedFileTypes ?? null,
    children: cloneFuelFormTree(node.children || []),
  }));
}

export function isFuelFormLeaf(node) {
  return !node?.children?.length;
}

/** True when the node is a value field (cannot have children). */
export function isFuelFormValueField(node) {
  return Boolean(node?.key);
}

export function flattenFuelFormTree(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenFuelFormTree(node.children, acc);
  });
  return acc;
}

export function findFuelFormNodeById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findFuelFormNodeById(node.children || [], id);
    if (match) return match;
  }
  return null;
}

export function findFuelFormParentNode(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const match = findFuelFormParentNode(node.children || [], id, node);
    if (match) return match;
  }
  return null;
}

export function getFuelFormLevel1Ancestor(nodes = [], nodeId) {
  let current = findFuelFormNodeById(nodes, nodeId);
  if (!current) return null;
  while (current?.parentId) {
    const parent = findFuelFormNodeById(nodes, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.level === 1 ? current : null;
}

export function getFuelFormNodePath(nodes = [], nodeId) {
  const path = [];
  let current = findFuelFormNodeById(nodes, nodeId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId
      ? findFuelFormNodeById(nodes, current.parentId)
      : null;
  }
  return path;
}

export function getFuelFormDescendantCount(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + getFuelFormDescendantCount(child),
    0,
  );
}

/** Active leaf value fields under a subtree (respects inactive ancestors). */
export function collectActiveFuelFormLeaves(node) {
  if (!node || node.isActive === false || node.isHidden === true) return [];
  if (isFuelFormValueField(node)) {
    return [node];
  }
  const children = [...(node.children || [])].sort((a, b) => {
    const orderA = Number.isFinite(a?.sortOrder) ? a.sortOrder : 0;
    const orderB = Number.isFinite(b?.sortOrder) ? b.sortOrder : 0;
    return orderA - orderB;
  });
  return children.flatMap((child) => collectActiveFuelFormLeaves(child));
}

export function collectAllActiveFuelFormLeaves(nodes = []) {
  return nodes.flatMap((node) => collectActiveFuelFormLeaves(node));
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

export function filterFuelFormTree(nodes = [], searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return nodes;
  return filterNodes(nodes, query);
}

export function getFuelFormParentOptions(nodes = [], { excludeId = null } = {}) {
  return flattenFuelFormTree(nodes)
    .filter((node) => {
      if (isFuelFormValueField(node)) return false;
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
    throw new Error("Level 1 sections are fixed. Choose a parent under an existing section.");
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

export function addFuelFormNode(nodes = [], payload) {
  const nextTree = cloneFuelFormTree(nodes);
  const parentId = payload.parentId || null;
  if (!parentId) {
    throw new Error("Level 1 sections are fixed. Add items under an existing section.");
  }

  const parent = findFuelFormNodeById(nextTree, parentId);
  if (!parent) throw new Error("Parent node not found.");
  if (isFuelFormValueField(parent)) {
    throw new Error("Cannot add a child under a leaf value field.");
  }

  const level = parent.level + 1;
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required.");

  const id = `${parentId}/${slugify(name)}`;
  if (findFuelFormNodeById(nextTree, id)) {
    throw new Error("An item with this name already exists under the selected parent.");
  }

  const isValueField = payload.nodeKind !== "group";
  const key =
    payload.key?.trim()
    || (isValueField ? toCamelKey(name) : null);
  const fieldType = isValueField ? (payload.fieldType || "text") : null;
  const {
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
  } = isValueField
    ? buildOptionsFieldsFromPayload(payload, fieldType, normalizeOptions)
    : { options: null, optionsSource: null, dropdownOptionId: null, searchSelectSource: null };
  const placeholder =
    isValueField && fieldTypeSupportsPlaceholder(fieldType)
      ? (payload.placeholder?.trim() || "")
      : "";
  const defaultValue = isValueField
    ? normalizeDefaultValue(fieldType, payload.defaultValue, options)
    : "";
  const minLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(payload.minLength)
      : null;
  const maxLength =
    isValueField && fieldTypeSupportsLengthLimits(fieldType)
      ? parseOptionalLength(payload.maxLength)
      : null;
  const l1 = getFuelFormLevel1Ancestor(nextTree, parentId) || parent;
  const sectionColumns = clampFuelFormColumns(l1?.columns ?? 2);

  const siblings = parent.children || [];
  const sortOrder = siblings.length
    ? Math.max(...siblings.map((child, index) =>
        Number.isFinite(child.sortOrder) ? child.sortOrder : index,
      )) + 1
    : 0;

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
    formKey: isValueField ? (payload.formKey?.trim() || key) : null,
    fieldType,
    minLength,
    maxLength,
    required: isValueField ? payload.required === true : false,
    isDefaultLocked: false,
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
    placeholder,
    defaultValue,
    columns: isValueField ? null : clampFuelFormColumns(payload.columns ?? 2),
    colSpan: isValueField
      ? clampFuelFormColSpan(
          payload.colSpan ?? defaultColSpanForFieldType(fieldType, sectionColumns),
          sectionColumns,
        )
      : null,
    acceptedFileTypes: isValueField && isUploadFileFieldType(fieldType)
      ? normalizeAcceptedFileTypes(payload.acceptedFileTypes)
      : null,
    sortOrder,
    children: [],
  };

  return insertChild(nextTree, parentId, child, payload.insertAt);
}

export function updateFuelFormNode(nodes = [], nodeId, payload) {
  const nextTree = cloneFuelFormTree(nodes);
  const existing = findFuelFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;

  // Level 1: layout columns only (name/description/active stay fixed).
  if (existing.isLocked) {
    const columns = clampFuelFormColumns(payload.columns ?? existing.columns ?? 2);
    return nextTree.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        columns,
        children: clampLeavesColSpan(node.children || [], columns),
      };
    });
  }

  // Locked default leaves: column span layout only.
  if (existing.isDefaultLocked) {
    const l1 = getFuelFormLevel1Ancestor(nextTree, nodeId);
    const sectionColumns = clampFuelFormColumns(l1?.columns ?? 2);
    return updateNodeInTree(nextTree, nodeId, {
      colSpan: clampFuelFormColSpan(
        payload.colSpan ?? existing.colSpan ?? 1,
        sectionColumns,
      ),
    });
  }

  const isLeaf = isFuelFormLeaf(existing);
  const isValueField = isLeaf && payload.nodeKind !== "group";
  const name = payload.name?.trim() ?? existing.name;
  const key = isValueField
    ? (payload.key?.trim() || existing.key || toCamelKey(name))
    : null;
  const fieldType = isValueField
    ? (payload.fieldType || existing.fieldType || "text")
    : null;
  const {
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
  } = isValueField
    ? buildOptionsFieldsFromPayload(payload, fieldType, normalizeOptions, existing)
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
  const l1 = getFuelFormLevel1Ancestor(nextTree, nodeId);
  const sectionColumns = clampFuelFormColumns(l1?.columns ?? 2);

  return updateNodeInTree(nextTree, nodeId, {
    name,
    code: payload.code?.trim()?.toUpperCase() || existing.code,
    description: payload.description?.trim() ?? existing.description,
    isActive: payload.isActive ?? existing.isActive,
    key,
    formKey: isValueField ? (payload.formKey?.trim() || key) : null,
    fieldType,
    minLength,
    maxLength,
    required: isValueField
      ? (payload.required !== undefined ? payload.required === true : existing.required === true)
      : false,
    options,
    optionsSource,
    dropdownOptionId,
    searchSelectSource,
    placeholder,
    defaultValue,
    columns: isValueField
      ? null
      : clampFuelFormColumns(payload.columns ?? existing.columns ?? 2),
    colSpan: isValueField
      ? clampFuelFormColSpan(
          payload.colSpan !== undefined ? payload.colSpan : existing.colSpan ?? 1,
          sectionColumns,
        )
      : null,
    acceptedFileTypes: isValueField && isUploadFileFieldType(fieldType)
      ? normalizeAcceptedFileTypes(
          payload.acceptedFileTypes !== undefined
            ? payload.acceptedFileTypes
            : existing.acceptedFileTypes,
        )
      : null,
  });
}

export function toggleFuelFormActive(nodes = [], nodeId) {
  const nextTree = cloneFuelFormTree(nodes);
  const existing = findFuelFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  if (existing.isLocked) {
    throw new Error("Level 1 sections cannot be disabled.");
  }
  if (existing.isDefaultLocked) {
    throw new Error("Locked default fields cannot be disabled.");
  }
  return updateNodeInTree(nextTree, nodeId, { isActive: !existing.isActive });
}


export function toggleFuelFormHidden(nodes = [], nodeId) {
  const nextTree = cloneFuelFormTree(nodes);
  const existing = findFuelFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  assertCanHideFormNode(existing);
  return updateNodeInTree(nextTree, nodeId, { isHidden: existing.isHidden !== true });
}

export function deleteFuelFormNode(nodes = [], nodeId) {
  const existing = findFuelFormNodeById(nodes, nodeId);
  if (existing?.isLocked) {
    throw new Error("Level 1 sections are constants and cannot be deleted.");
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

  return remove(cloneFuelFormTree(nodes));
}

export function reorderFuelFormNode(nodes = [], nodeId, direction) {
  const { nodes: next, moved } = reorderTreeSibling(
    cloneFuelFormTree(nodes),
    nodeId,
    direction,
  );
  if (!moved) {
    throw new Error(
      direction === "up"
        ? "Already at the top among siblings."
        : "Already at the bottom among siblings.",
    );
  }
  return next;
}

export function reorderFuelFormNodeRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const { nodes: next, moved, sameParent } = moveTreeSiblingRelative(
    cloneFuelFormTree(nodes),
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

export function getFuelFormLevelLabel(level) {
  return `Level ${level}`;
}

/** Map a leaf node to the legacy field shape used by FuelFormWizard. */
export function leafToFuelField(leaf, sectionId) {
  const rawType = leaf.fieldType || "text";
  const fieldType = rawType === "image" ? "file" : rawType;
  const options = resolveLeafFieldOptions(leaf);
  return {
    id: leaf.id,
    key: leaf.key,
    formKey: leaf.formKey || leaf.key,
    title: leaf.name,
    description: leaf.description || "",
    fieldType,
    minLength: leaf.minLength ?? null,
    maxLength: leaf.maxLength ?? null,
    colSpan: leaf.colSpan ?? 1,
    sectionId,
    required: leaf.required === true,
    isDefaultLocked: leaf.isDefaultLocked === true,
    isActive: leaf.isActive !== false,
    options,
    searchSelectSource: leaf.searchSelectSource || null,
    placeholder: leaf.placeholder || "",
    defaultValue: normalizeDefaultValue(fieldType, leaf.defaultValue, options),
    acceptedFileTypes: isUploadFileFieldType(fieldType)
      ? normalizeAcceptedFileTypes(leaf.acceptedFileTypes)
      : null,
  };
}
