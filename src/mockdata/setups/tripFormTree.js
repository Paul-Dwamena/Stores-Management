/**
 * Trip form hierarchy — fixed Level 1 sections with open-ended nesting.
 * Values live on leaf nodes only (nodes with a `key`).
 */

import { moveTreeSiblingRelative, reorderTreeSibling } from "../../utils/treeReorder";
import {
  DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION,
  TRIP_FORM_FIELD_CATALOG,
  TRIP_FORM_GROUPS,
  TRIP_FORM_SECTIONS,
  VEHICLE_CONDITION_GROUP_ID,
  withLockedDefaultFields,
} from "./tripFormFields";
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
export const TRIP_FORM_FIELD_TYPE_OPTIONS = VEHICLE_SPEC_FIELD_TYPE_OPTIONS;

/** Allowed grid column counts for a Level 1 section. */
export const TRIP_FORM_COLUMN_OPTIONS = [1, 2, 3, 4];

export function clampTripFormColumns(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

export function clampTripFormColSpan(value, columns = 2) {
  const max = clampTripFormColumns(columns);
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function isUploadFileFieldType(fieldType) {
  return fieldType === "file" || fieldType === "image";
}

function defaultColSpanForFieldType(fieldType, columns = 2) {
  const max = clampTripFormColumns(columns);
  // Trip modals default to full width; half-width fields set colSpan explicitly.
  if (fieldType === "photo" || fieldType === "image" || fieldType === "file") return max;
  return max;
}

function clampLeavesColSpan(children = [], columns) {
  return children.map((child) => {
    if (child?.key) {
      return {
        ...child,
        colSpan: clampTripFormColSpan(child.colSpan ?? columns, columns),
      };
    }
    return {
      ...child,
      children: clampLeavesColSpan(child.children || [], columns),
    };
  });
}

/** Fixed Level 1 roots — not user-creatable / not deletable. */
export const TRIP_FORM_LEVEL_1 = TRIP_FORM_SECTIONS.map((section) => ({
  id: section.id,
  name: section.label,
  description: section.description,
}));

function buildLeafNode(field, parentId, level, sectionColumns, sortOrder, visibleIds) {
  const fieldType = field.fieldType || "text";
  const options = normalizeOptions(field.options);
  return {
    id: field.id,
    name: field.title,
    code: buildCode(field.title),
    level,
    parentId,
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
    isPositionLocked: field.isPositionLocked === true,
    options,
    optionsSource: field.optionsSource || (options?.length ? "manual" : null),
    dropdownOptionId: field.dropdownOptionId || null,
    searchSelectSource: field.searchSelectSource || null,
    placeholder: field.placeholder || "",
    defaultValue: normalizeDefaultValue(fieldType, field.defaultValue, options),
    columns: null,
    colSpan: clampTripFormColSpan(
      field.colSpan ?? defaultColSpanForFieldType(fieldType, sectionColumns),
      sectionColumns,
    ),
    acceptedFileTypes: isUploadFileFieldType(fieldType)
      ? normalizeAcceptedFileTypes(field.acceptedFileTypes)
      : null,
    sortOrder,
    children: [],
  };
}

function buildGroupNode(group, sectionId, sectionColumns, sortOrder, visibleIds) {
  const groupColumns = clampTripFormColumns(group.columns ?? sectionColumns);
  const groupNodeId = `${sectionId}/${group.id}`;
  const fields = TRIP_FORM_FIELD_CATALOG.filter(
    (field) => field.groupId === group.id && field.sectionId === sectionId,
  );

  return {
    id: groupNodeId,
    name: group.label,
    code: buildCode(group.label),
    level: 2,
    parentId: sectionId,
    description: group.description || "",
    isLocked: false,
    isActive: true,
    key: null,
    formKey: group.id,
    fieldType: null,
    minLength: null,
    maxLength: null,
    required: false,
    isDefaultLocked: true,
    options: null,
    placeholder: "",
    defaultValue: "",
    columns: groupColumns,
    colSpan: null,
    sortOrder,
    children: fields.map((field, fieldIndex) =>
      buildLeafNode(field, groupNodeId, 3, groupColumns, fieldIndex, visibleIds),
    ),
  };
}

/**
 * Seed hierarchy from the existing section + field catalog.
 * Default visibility matches the previous Default Start & End Trip Form setup.
 */
export function buildInitialTripFormTree() {
  const visibleBySection = withLockedDefaultFields(DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION);

  return TRIP_FORM_SECTIONS.map((section, index) => {
    const visibleIds = new Set(visibleBySection[section.id] ?? []);
    const fields = TRIP_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id,
    );
    const sectionColumns = 2;
    const children = [];
    const emittedGroups = new Set();

    fields.forEach((field) => {
      if (field.groupId) {
        if (emittedGroups.has(field.groupId)) return;
        emittedGroups.add(field.groupId);
        const group = TRIP_FORM_GROUPS.find(
          (item) => item.id === field.groupId && item.sectionId === section.id,
        );
        if (!group) return;
        children.push(
          buildGroupNode(group, section.id, sectionColumns, children.length, visibleIds),
        );
        return;
      }
      children.push(
        buildLeafNode(field, section.id, 2, sectionColumns, children.length, visibleIds),
      );
    });

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
      children,
    };
  });
}

export function cloneTripFormTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    options: node.options
      ? node.options.map((opt) => (typeof opt === "string" ? opt : { ...opt }))
      : null,
    acceptedFileTypes: Array.isArray(node.acceptedFileTypes)
      ? [...node.acceptedFileTypes]
      : node.acceptedFileTypes ?? null,
    children: cloneTripFormTree(node.children || []),
  }));
}

export function isTripFormLeaf(node) {
  return !node?.children?.length;
}

/** True when the node is a value field (cannot have children). */
export function isTripFormValueField(node) {
  return Boolean(node?.key);
}

export function isTripVehicleConditionGroup(node) {
  return Boolean(
    node
    && !node.key
    && (node.formKey === VEHICLE_CONDITION_GROUP_ID
      || String(node.id || "").endsWith(`/${VEHICLE_CONDITION_GROUP_ID}`)),
  );
}

/** True when `nodeId` is the Vehicle Condition group or sits under it. */
export function isTripVehicleConditionContext(nodes = [], nodeId) {
  let current = findTripFormNodeById(nodes, nodeId);
  while (current) {
    if (isTripVehicleConditionGroup(current)) return true;
    current = current.parentId ? findTripFormNodeById(nodes, current.parentId) : null;
  }
  return false;
}

export function flattenTripFormTree(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenTripFormTree(node.children, acc);
  });
  return acc;
}

export function findTripFormNodeById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findTripFormNodeById(node.children || [], id);
    if (match) return match;
  }
  return null;
}

export function findTripFormParentNode(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const match = findTripFormParentNode(node.children || [], id, node);
    if (match) return match;
  }
  return null;
}

export function getTripFormLevel1Ancestor(nodes = [], nodeId) {
  let current = findTripFormNodeById(nodes, nodeId);
  if (!current) return null;
  while (current?.parentId) {
    const parent = findTripFormNodeById(nodes, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.level === 1 ? current : null;
}

export function getTripFormNodePath(nodes = [], nodeId) {
  const path = [];
  let current = findTripFormNodeById(nodes, nodeId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId
      ? findTripFormNodeById(nodes, current.parentId)
      : null;
  }
  return path;
}

export function getTripFormDescendantCount(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + getTripFormDescendantCount(child),
    0,
  );
}

/** Active leaf value fields under a subtree (respects inactive ancestors). */
export function collectActiveTripFormLeaves(node) {
  if (!node || node.isActive === false || node.isHidden === true) return [];
  if (isTripFormValueField(node)) {
    return [node];
  }
  return (node.children || []).flatMap((child) => collectActiveTripFormLeaves(child));
}

export function collectAllActiveTripFormLeaves(nodes = []) {
  return nodes.flatMap((node) => collectActiveTripFormLeaves(node));
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

export function filterTripFormTree(nodes = [], searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return nodes;
  return filterNodes(nodes, query);
}

export function getTripFormParentOptions(nodes = [], { excludeId = null } = {}) {
  return flattenTripFormTree(nodes)
    .filter((node) => {
      if (isTripFormValueField(node)) return false;
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

export function addTripFormNode(nodes = [], payload) {
  const nextTree = cloneTripFormTree(nodes);
  const parentId = payload.parentId || null;
  if (!parentId) {
    throw new Error("Level 1 sections are fixed. Add items under an existing section.");
  }

  const parent = findTripFormNodeById(nextTree, parentId);
  if (!parent) throw new Error("Parent node not found.");
  if (isTripFormValueField(parent)) {
    throw new Error("Cannot add a child under a leaf value field.");
  }

  const level = parent.level + 1;
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required.");

  const id = `${parentId}/${slugify(name)}`;
  if (findTripFormNodeById(nextTree, id)) {
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
  const l1 = getTripFormLevel1Ancestor(nextTree, parentId) || parent;
  const sectionColumns = clampTripFormColumns(l1?.columns ?? 2);

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
    columns: isValueField ? null : clampTripFormColumns(payload.columns ?? 2),
    colSpan: isValueField
      ? clampTripFormColSpan(
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

export function updateTripFormNode(nodes = [], nodeId, payload) {
  const nextTree = cloneTripFormTree(nodes);
  const existing = findTripFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;

  // Level 1: layout columns only (name/description/active stay fixed).
  if (existing.isLocked) {
    const columns = clampTripFormColumns(payload.columns ?? existing.columns ?? 2);
    return nextTree.map((node) => {
      if (node.id !== nodeId) return node;
      return {
        ...node,
        columns,
        children: clampLeavesColSpan(node.children || [], columns),
      };
    });
  }

  // Locked default groups: column layout only. Locked default leaves: column span only.
  if (existing.isDefaultLocked) {
    const l1 = getTripFormLevel1Ancestor(nextTree, nodeId);
    const sectionColumns = clampTripFormColumns(l1?.columns ?? 2);
    if (!existing.key) {
      const columns = clampTripFormColumns(payload.columns ?? existing.columns ?? 2);
      return updateNodeInTree(nextTree, nodeId, {
        columns,
        children: clampLeavesColSpan(existing.children || [], columns),
      });
    }
    return updateNodeInTree(nextTree, nodeId, {
      colSpan: clampTripFormColSpan(
        payload.colSpan ?? existing.colSpan ?? 1,
        sectionColumns,
      ),
    });
  }

  const isLeaf = isTripFormLeaf(existing);
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
  const l1 = getTripFormLevel1Ancestor(nextTree, nodeId);
  const sectionColumns = clampTripFormColumns(l1?.columns ?? 2);

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
      : clampTripFormColumns(payload.columns ?? existing.columns ?? 2),
    colSpan: isValueField
      ? clampTripFormColSpan(
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

export function toggleTripFormActive(nodes = [], nodeId) {
  const nextTree = cloneTripFormTree(nodes);
  const existing = findTripFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  if (existing.isLocked) {
    throw new Error("Level 1 sections cannot be disabled.");
  }
  if (existing.isDefaultLocked) {
    throw new Error("Locked default fields cannot be disabled.");
  }
  return updateNodeInTree(nextTree, nodeId, { isActive: !existing.isActive });
}


export function toggleTripFormHidden(nodes = [], nodeId) {
  const nextTree = cloneTripFormTree(nodes);
  const existing = findTripFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  assertCanHideFormNode(existing);
  return updateNodeInTree(nextTree, nodeId, { isHidden: existing.isHidden !== true });
}

export function deleteTripFormNode(nodes = [], nodeId) {
  const existing = findTripFormNodeById(nodes, nodeId);
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

  return remove(cloneTripFormTree(nodes));
}

export function reorderTripFormNode(nodes = [], nodeId, direction) {
  const { nodes: next, moved } = reorderTreeSibling(
    cloneTripFormTree(nodes),
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

export function reorderTripFormNodeRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const { nodes: next, moved, sameParent } = moveTreeSiblingRelative(
    cloneTripFormTree(nodes),
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

export function getTripFormLevelLabel(level) {
  return `Level ${level}`;
}

/** Map a leaf node to the legacy field shape used by TripFormWizard. */
export function leafToTripField(leaf, sectionId) {
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
    colSpan: leaf.colSpan ?? 2,
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
