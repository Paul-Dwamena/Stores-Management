/**
 * Quotation form hierarchy — fixed Level 1 wizard steps with leaf fields
 * directly underneath (no required L2 subfolders). L1 order is not reorderable.
 */

import { moveTreeSiblingRelative, reorderTreeSibling } from "../../utils/treeReorder";
import {
  DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION,
  QUOTATION_ADJUST_SECTION,
  QUOTATION_FORM_FIELD_CATALOG,
  QUOTATION_FORM_SECTIONS,
  withLockedDefaultFields,
} from "./quotationFormFields";
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
export const QUOTATION_FORM_FIELD_TYPE_OPTIONS = VEHICLE_SPEC_FIELD_TYPE_OPTIONS;

/** Allowed grid column counts for a Level 1 section. */
export const QUOTATION_FORM_COLUMN_OPTIONS = [1, 2, 3, 4];

export function clampQuotationFormColumns(value) {
  const n = Number(value);
  if (!Number.isFinite(n)) return 2;
  return Math.min(4, Math.max(1, Math.floor(n)));
}

export function clampQuotationFormColSpan(value, columns = 2) {
  const max = clampQuotationFormColumns(columns);
  const n = Number(value);
  if (!Number.isFinite(n)) return 1;
  return Math.min(max, Math.max(1, Math.floor(n)));
}

function isUploadFileFieldType(fieldType) {
  return fieldType === "file" || fieldType === "image";
}

function defaultColSpanForFieldType(fieldType, columns = 2) {
  const max = clampQuotationFormColumns(columns);
  // New Quotation defaults new custom fields to full row width within the group columns.
  return max;
}

export function clampLeavesColSpan(children = [], columns) {
  return children.map((child) => {
    if (child?.key) {
      return {
        ...child,
        colSpan: clampQuotationFormColSpan(child.colSpan ?? columns, columns),
      };
    }
    return {
      ...child,
      children: clampLeavesColSpan(child.children || [], columns),
    };
  });
}

/** Fixed Level 1 roots — not user-creatable / not deletable. */
export const QUOTATION_FORM_ALL_SECTIONS = [
  ...QUOTATION_FORM_SECTIONS,
  QUOTATION_ADJUST_SECTION,
];

export const QUOTATION_FORM_LEVEL_1 = QUOTATION_FORM_ALL_SECTIONS.map((section) => ({
  id: section.id,
  name: section.label,
  description: section.description,
}));

/**
 * Seed hierarchy: fixed Level 1 wizard steps (+ Additional Benefits for Adjust modal).
 */
export function buildInitialQuotationFormTree() {
  const visibleBySection = withLockedDefaultFields(DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION);

  return QUOTATION_FORM_ALL_SECTIONS.map((section, index) => {
    const visibleIds = new Set(visibleBySection[section.id] ?? []);
    const fields = QUOTATION_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id,
    );
    const sectionColumns = clampQuotationFormColumns(section.columns ?? 2);

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
          colSpan: clampQuotationFormColSpan(
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

export function cloneQuotationFormTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    options: node.options
      ? node.options.map((opt) => (typeof opt === "string" ? opt : { ...opt }))
      : null,
    acceptedFileTypes: Array.isArray(node.acceptedFileTypes)
      ? [...node.acceptedFileTypes]
      : node.acceptedFileTypes ?? null,
    children: cloneQuotationFormTree(node.children || []),
  }));
}

export function isQuotationFormLeaf(node) {
  return !node?.children?.length;
}

/** True when the node is a value field (cannot have children). */
export function isQuotationFormValueField(node) {
  return Boolean(node?.key);
}

export function flattenQuotationFormTree(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenQuotationFormTree(node.children, acc);
  });
  return acc;
}

export function findQuotationFormNodeById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const match = findQuotationFormNodeById(node.children || [], id);
    if (match) return match;
  }
  return null;
}

export function findQuotationFormParentNode(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const match = findQuotationFormParentNode(node.children || [], id, node);
    if (match) return match;
  }
  return null;
}

export function getQuotationFormLevel1Ancestor(nodes = [], nodeId) {
  let current = findQuotationFormNodeById(nodes, nodeId);
  if (!current) return null;
  while (current?.parentId) {
    const parent = findQuotationFormNodeById(nodes, current.parentId);
    if (!parent) break;
    current = parent;
  }
  return current?.level === 1 ? current : null;
}

export function getQuotationFormNodePath(nodes = [], nodeId) {
  const path = [];
  let current = findQuotationFormNodeById(nodes, nodeId);
  while (current) {
    path.unshift(current.name);
    current = current.parentId
      ? findQuotationFormNodeById(nodes, current.parentId)
      : null;
  }
  return path;
}

export function getQuotationFormDescendantCount(node) {
  if (!node?.children?.length) return 0;
  return node.children.reduce(
    (total, child) => total + 1 + getQuotationFormDescendantCount(child),
    0,
  );
}

/** Active leaf value fields under a subtree (respects inactive ancestors). */
export function collectActiveQuotationFormLeaves(node) {
  if (!node || node.isActive === false || node.isHidden === true) return [];
  if (isQuotationFormValueField(node)) {
    return [node];
  }
  const children = [...(node.children || [])].sort((a, b) => {
    const orderA = Number.isFinite(a?.sortOrder) ? a.sortOrder : 0;
    const orderB = Number.isFinite(b?.sortOrder) ? b.sortOrder : 0;
    return orderA - orderB;
  });
  return children.flatMap((child) => collectActiveQuotationFormLeaves(child));
}

export function collectAllActiveQuotationFormLeaves(nodes = []) {
  return nodes.flatMap((node) => collectActiveQuotationFormLeaves(node));
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

export function filterQuotationFormTree(nodes = [], searchQuery = "") {
  const query = searchQuery.trim().toLowerCase();
  if (!query) return nodes;
  return filterNodes(nodes, query);
}

export function getQuotationFormParentOptions(nodes = [], { excludeId = null } = {}) {
  return flattenQuotationFormTree(nodes)
    .filter((node) => {
      if (isQuotationFormValueField(node)) return false;
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

export function addQuotationFormNode(nodes = [], payload) {
  const nextTree = cloneQuotationFormTree(nodes);
  const parentId = payload.parentId || null;
  if (!parentId) {
    throw new Error("Level 1 sections are fixed. Add items under an existing section.");
  }

  const parent = findQuotationFormNodeById(nextTree, parentId);
  if (!parent) throw new Error("Parent node not found.");
  if (isQuotationFormValueField(parent)) {
    throw new Error("Cannot add a child under a leaf value field.");
  }

  const level = parent.level + 1;
  const name = payload.name?.trim();
  if (!name) throw new Error("Name is required.");

  const id = `${parentId}/${slugify(name)}`;
  if (findQuotationFormNodeById(nextTree, id)) {
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
  const l1 = getQuotationFormLevel1Ancestor(nextTree, parentId) || parent;
  const sectionColumns = clampQuotationFormColumns(l1?.columns ?? 2);

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
    columns: isValueField ? null : clampQuotationFormColumns(payload.columns ?? 2),
    colSpan: isValueField
      ? clampQuotationFormColSpan(
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

export function updateQuotationFormNode(nodes = [], nodeId, payload) {
  const nextTree = cloneQuotationFormTree(nodes);
  const existing = findQuotationFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;

  // Level 1: layout columns only (nested group columns stay independent).
  if (existing.isLocked) {
    const columns = clampQuotationFormColumns(payload.columns ?? existing.columns ?? 1);
    return nextTree.map((node) => {
      if (node.id !== nodeId) return node;
      return { ...node, columns };
    });
  }

  // Locked default groups: columns; locked default leaves: colSpan.
  if (existing.isDefaultLocked) {
    if (!existing.key) {
      const columns = clampQuotationFormColumns(payload.columns ?? existing.columns ?? 2);
      return updateNodeInTree(nextTree, nodeId, {
        columns,
        children: clampLeavesColSpan(existing.children || [], columns),
      });
    }
    const parent = findQuotationFormParentNode(nextTree, nodeId);
    const sectionColumns = clampQuotationFormColumns(parent?.columns ?? 2);
    return updateNodeInTree(nextTree, nodeId, {
      colSpan: clampQuotationFormColSpan(
        payload.colSpan ?? existing.colSpan ?? 1,
        sectionColumns,
      ),
    });
  }

  const isLeaf = isQuotationFormLeaf(existing);
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
  const l1 = getQuotationFormLevel1Ancestor(nextTree, nodeId);
  const sectionColumns = clampQuotationFormColumns(l1?.columns ?? 2);

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
      : clampQuotationFormColumns(payload.columns ?? existing.columns ?? 2),
    colSpan: isValueField
      ? clampQuotationFormColSpan(
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

export function toggleQuotationFormActive(nodes = [], nodeId) {
  const nextTree = cloneQuotationFormTree(nodes);
  const existing = findQuotationFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  if (existing.isLocked) {
    throw new Error("Level 1 sections cannot be disabled.");
  }
  if (existing.isDefaultLocked) {
    throw new Error("Locked default fields cannot be disabled.");
  }
  return updateNodeInTree(nextTree, nodeId, { isActive: !existing.isActive });
}


export function toggleQuotationFormHidden(nodes = [], nodeId) {
  const nextTree = cloneQuotationFormTree(nodes);
  const existing = findQuotationFormNodeById(nextTree, nodeId);
  if (!existing) return nextTree;
  assertCanHideFormNode(existing);
  return updateNodeInTree(nextTree, nodeId, { isHidden: existing.isHidden !== true });
}

export function deleteQuotationFormNode(nodes = [], nodeId) {
  const existing = findQuotationFormNodeById(nodes, nodeId);
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

  return remove(cloneQuotationFormTree(nodes));
}

export function reorderQuotationFormNode(nodes = [], nodeId, direction) {
  const existing = findQuotationFormNodeById(nodes, nodeId);
  if (existing?.isLocked || existing?.level === 1) {
    throw new Error(
      "Wizard steps are fixed in order: Vehicle Details → Coverage Type → Compare Quotes → Purchase.",
    );
  }
  const { nodes: next, moved } = reorderTreeSibling(
    cloneQuotationFormTree(nodes),
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

export function reorderQuotationFormNodeRelative(
  nodes = [],
  sourceId,
  targetId,
  place = "before",
) {
  const source = findQuotationFormNodeById(nodes, sourceId);
  if (source?.isLocked || source?.level === 1) {
    throw new Error(
      "Wizard steps are fixed in order: Vehicle Details → Coverage Type → Compare Quotes → Purchase.",
    );
  }
  const { nodes: next, moved, sameParent } = moveTreeSiblingRelative(
    cloneQuotationFormTree(nodes),
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

export function getQuotationFormLevelLabel(level) {
  return `Level ${level}`;
}

/** Map a leaf node to the legacy field shape used by QuotationFormWizard. */
export function leafToQuotationField(leaf, sectionId) {
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
