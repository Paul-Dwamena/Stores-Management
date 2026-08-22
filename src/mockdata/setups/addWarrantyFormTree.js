/**
 * Add Warranty Form hierarchy — one fixed Level 1 (Main).
 * Add nested groups under Main if needed. L1 is not reorderable.
 */

import { moveTreeSiblingRelative, reorderTreeSibling } from "../../utils/treeReorder";
import {
  DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION,
  ADD_WARRANTY_FORM_FIELD_CATALOG,
  ADD_WARRANTY_FORM_GROUPS,
  ADD_WARRANTY_FORM_SECTIONS,
  withLockedDefaultFields,
} from "./addWarrantyFormFields";
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
export const ADD_WARRANTY_FORM_FIELD_TYPE_OPTIONS = VEHICLE_SPEC_FIELD_TYPE_OPTIONS;

/** Allowed grid column counts for a Level 1 section. */
export const ADD_WARRANTY_FORM_COLUMN_OPTIONS = [1, 2, 3, 4];

export function clampAddWarrantyFormColumns(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

export function clampAddWarrantyFormColSpan(value, columns = 2) {
  const max = clampAddWarrantyFormColumns(columns);
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function isUploadFileFieldType(fieldType) {
  return fieldType === "file" || fieldType === "image";
}

function defaultColSpanForFieldType(fieldType, columns = 2) {
  const max = clampAddWarrantyFormColumns(columns);
  // Add Warranty defaults new custom fields to full row width within the group columns.
  return max;
}

export function clampLeavesColSpan(children = [], columns) {
  return children.map((child) => {
    if (child?.key) {
      return {
        ...child,
        colSpan: clampAddWarrantyFormColSpan(child.colSpan ?? columns, columns),
      };
    }
    return {
      ...child,
      children: clampLeavesColSpan(child.children || [], columns),
    };
  });
}

/** Fixed Level 1 roots — not user-creatable / not deletable. */
export const ADD_WARRANTY_FORM_LEVEL_1 = ADD_WARRANTY_FORM_SECTIONS.map((section) => ({
  id: section.id,
  name: section.label,
  description: section.description,
}));

function buildLeafNode(field, parentId, level, sectionColumns, sortOrder, visibleIds) {
  const fieldType = field.fieldType || "text";
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
    options: normalizeOptions(field.options),
    placeholder: field.placeholder || "",
    defaultValue: normalizeDefaultValue(
      fieldType,
      field.defaultValue,
      normalizeOptions(field.options),
    ),
    columns: null,
    colSpan: clampAddWarrantyFormColSpan(
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

/**
 * Seed hierarchy: Main holds name, email, phone, and role.
 */
export function buildInitialAddWarrantyFormTree() {
  const visibleBySection = withLockedDefaultFields(DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION);

  return ADD_WARRANTY_FORM_SECTIONS.map((section, index) => {
    const visibleIds = new Set(visibleBySection[section.id] ?? []);
    const sectionColumns = clampAddWarrantyFormColumns(section.columns ?? 2);
    const groups = ADD_WARRANTY_FORM_GROUPS.filter(
      (group) => group.sectionId === section.id,
    );

    const ungroupedFields = ADD_WARRANTY_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && !field.groupId,
    ).map((field, fieldIndex) =>
      buildLeafNode(field, section.id, 2, sectionColumns, fieldIndex, visibleIds),
    );

    const groupNodes = groups.map((group, groupIndex) => {
      const groupColumns = clampAddWarrantyFormColumns(group.columns ?? sectionColumns);
      const groupNodeId = `${section.id}/${group.id}`;
      const fields = ADD_WARRANTY_FORM_FIELD_CATALOG.filter(
        (field) => field.groupId === group.id && field.sectionId === section.id,
      );

      return {
        id: groupNodeId,
        name: group.label,
        code: buildCode(group.label),
        level: 2,
        parentId: section.id,
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
        sortOrder: ungroupedFields.length + groupIndex,
        children: fields.map((field, fieldIndex) =>
          buildLeafNode(field, groupNodeId, 3, groupColumns, fieldIndex, visibleIds),
        ),
      };
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
      children: [...ungroupedFields, ...groupNodes],
    };
  });
}

export function cloneAddWarrantyFormTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    options: node.options
      ? node.options.map((opt) => (typeof opt === "string" ? opt : { ...opt }))
      : null,
    children: cloneAddWarrantyFormTree(node.children || []),
  }));
}

export function isAddWarrantyFormLeaf(node) {
  return !node?.children?.length;
}

/** True when the node is a value field (cannot have children). */
export function isAddWarrantyFormValueField(node) {
  return Boolean(node?.key);
}

export function flattenAddWarrantyFormTree(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenAddWarrantyFormTree(node.children, acc);
  });
  return acc;
}

export function findAddWarrantyFormNodeById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findAddWarrantyFormNodeById(node.children || [], id);
    if (match) return match;
  }
  return null;
}

export function findAddWarrantyFormParentNode(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const match = findAddWarrantyFormParentNode(node.children || [], id, node);
    if (match) return match;
  }
  return null;
}

export function getAddWarrantyFormLevel1Ancestor(nodes = [], nodeId) {
  let current = findAddWarrantyFormNodeById(nodes, nodeId);
  if (!current) return null;
  while (current?.parentId) {
    const parent = findAddWarrantyFormNodeById(nodes, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.level === 1 ? current : null;
}

export function getAddWarrantyFormNodePath(nodes = [], nodeId) {
  const path = [];
  let current = findAddWarrantyFormNodeById(nodes, nodeId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId
      ? findAddWarrantyFormNodeById(nodes, current.parentId)
      : null;
  }
  return path;
}

export function getAddWarrantyFormDescendantCount(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + getAddWarrantyFormDescendantCount(child),
    0,
  );
}

/** Active leaf value fields under a subtree (respects inactive ancestors). */
export function collectActiveAddWarrantyFormLeaves(node) {
  if (!node || node.isActive === false || node.isHidden === true) return [];
  if (isAddWarrantyFormValueField(node)) {
    return [node];
  }
  const children = [...(node.children || [])].sort((a, b) => {
    const orderA = Number.isFinite(a?.sortOrder) ? a.sortOrder : 0;
    const orderB = Number.isFinite(b?.sortOrder) ? b.sortOrder : 0;
    return orderA - orderB;
  });
  return children.flatMap((child) => collectActiveAddWarrantyFormLeaves(child));
}

export function collectAllActiveAddWarrantyFormLeaves(nodes = []) {
  return nodes.flatMap((node) => collectActiveAddWarrantyFormLeaves(node));
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

export function filterAddWarrantyFormTree(nodes = [], searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return nodes;
  return filterNodes(nodes, query);
}

export function getAddWarrantyFormParentOptions(nodes = [], { excludeId = null } = {}) {
  return flattenAddWarrantyFormTree(nodes)
    .filter((node) => {
      if (isAddWarrantyFormValueField(node)) return false;
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

export function addAddWarrantyFormNode(nodes = [], payload) {
  const nextTree = cloneAddWarrantyFormTree(nodes);
  const parentId = payload.parentId || null;
  if (!parentId) {
    throw new Error("Level 1 sections are fixed. Add items under an existing section.");
  }

  const parent = findAddWarrantyFormNodeById(nextTree, parentId);
  if (!parent) throw new Error("Parent node not found.");
  if (isAddWarrantyFormValueField(parent)) {
    throw new Error("Cannot add a child under a leaf value field.");
  }

  const level = parent.level + 1;
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required.");

  const id = `${parentId}/${slugify(name)}`;
  if (findAddWarrantyFormNodeById(nextTree, id)) {
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
  const l1 = getAddWarrantyFormLevel1Ancestor(nextTree, parentId) || parent;
  const sectionColumns = clampAddWarrantyFormColumns(l1?.columns ?? 2);

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
    columns: isValueField ? null : clampAddWarrantyFormColumns(payload.columns ?? 2),
    colSpan: isValueField
      ? clampAddWarrantyFormColSpan(
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

export function updateAddWarrantyFormNode(nodes = [], nodeId, payload) {
  const nextTree = cloneAddWarrantyFormTree(nodes);
  const existing = findAddWarrantyFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;

  // Level 1: layout columns only (nested group columns stay independent).
  if (existing.isLocked) {
    const columns = clampAddWarrantyFormColumns(payload.columns ?? existing.columns ?? 1);
    return nextTree.map((node) => {
      if (node.id !== nodeId) return node;
      return { ...node, columns };
    });
  }

  // Locked default groups: columns; locked default leaves: colSpan.
  if (existing.isDefaultLocked) {
    if (!existing.key) {
      const columns = clampAddWarrantyFormColumns(payload.columns ?? existing.columns ?? 2);
      return updateNodeInTree(nextTree, nodeId, {
        columns,
        children: clampLeavesColSpan(existing.children || [], columns),
      });
    }
    const parent = findAddWarrantyFormParentNode(nextTree, nodeId);
    const sectionColumns = clampAddWarrantyFormColumns(parent?.columns ?? 2);
    return updateNodeInTree(nextTree, nodeId, {
      colSpan: clampAddWarrantyFormColSpan(
        payload.colSpan ?? existing.colSpan ?? 1,
        sectionColumns,
      ),
    });
  }

  const isLeaf = isAddWarrantyFormLeaf(existing);
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
  const l1 = getAddWarrantyFormLevel1Ancestor(nextTree, nodeId);
  const sectionColumns = clampAddWarrantyFormColumns(l1?.columns ?? 2);

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
      : clampAddWarrantyFormColumns(payload.columns ?? existing.columns ?? 2),
    colSpan: isValueField
      ? clampAddWarrantyFormColSpan(
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

export function toggleAddWarrantyFormActive(nodes = [], nodeId) {
  const nextTree = cloneAddWarrantyFormTree(nodes);
  const existing = findAddWarrantyFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  if (existing.isLocked) {
    throw new Error("Level 1 sections cannot be disabled.");
  }
  if (existing.isDefaultLocked) {
    throw new Error("Locked default fields cannot be disabled.");
  }
  return updateNodeInTree(nextTree, nodeId, { isActive: !existing.isActive });
}


export function toggleAddWarrantyFormHidden(nodes = [], nodeId) {
  const nextTree = cloneAddWarrantyFormTree(nodes);
  const existing = findAddWarrantyFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  assertCanHideFormNode(existing);
  return updateNodeInTree(nextTree, nodeId, { isHidden: existing.isHidden !== true });
}

export function deleteAddWarrantyFormNode(nodes = [], nodeId) {
  const existing = findAddWarrantyFormNodeById(nodes, nodeId);
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

  return remove(cloneAddWarrantyFormTree(nodes));
}

export function reorderAddWarrantyFormNode(nodes = [], nodeId, direction) {
  const existing = findAddWarrantyFormNodeById(nodes, nodeId);
  if (existing?.isLocked || existing?.level === 1) {
    throw new Error(
      "The Main section cannot be reordered.",
    );
  }
  const { nodes: next, moved } = reorderTreeSibling(
    cloneAddWarrantyFormTree(nodes),
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

export function reorderAddWarrantyFormNodeRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const source = findAddWarrantyFormNodeById(nodes, sourceId);
  if (source?.isLocked || source?.level === 1) {
    throw new Error(
      "The Main section cannot be reordered.",
    );
  }
  const { nodes: next, moved, sameParent } = moveTreeSiblingRelative(
    cloneAddWarrantyFormTree(nodes),
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

export function getAddWarrantyFormLevelLabel(level) {
  return `Level ${level}`;
}

/** Map a leaf node to the field shape used by Add Warranty. */
export function leafToAddWarrantyField(leaf, sectionId) {
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
