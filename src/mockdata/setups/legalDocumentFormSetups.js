/**
 * Active legal document form setup — open-ended tree under a fixed Main section.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so Upload Legal Documents forms always see the latest config.
 */

import {
  LEGAL_DOCUMENT_FORM_LEVEL_1,
  buildInitialLegalDocumentFormTree,
  clampLegalDocumentFormColumns,
  clampLeavesColSpan,
  cloneLegalDocumentFormTree,
  collectActiveLegalDocumentFormLeaves,
  findLegalDocumentFormNodeById,
  findLegalDocumentFormParentNode,
  getLegalDocumentFormLevel1Ancestor,
  getLegalDocumentFormNodePath,
  leafToLegalDocumentField,
} from "./legalDocumentFormTree";
import { LEGAL_DOCUMENT_FORM_SECTIONS, LEGAL_DOCUMENT_FORM_FIELD_CATALOG, LEGAL_DOCUMENT_FORM_GROUPS } from "./legalDocumentFormFields";
import { normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const LEGAL_DOCUMENT_FORM_SETUP_CHANGED_EVENT = "fleetly-legal-document-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_legal_document_form_tree",
  eventName: LEGAL_DOCUMENT_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_LEGAL_DOCUMENT_FORM_TREE__",
  getSeed: () => buildInitialLegalDocumentFormTree(),
  clone: cloneLegalDocumentFormTree,
});

const META_KEY = "fleetly_legal_document_form_meta";
const TREE_SCHEMA_VERSION = 3;
const LEGAL_DOCUMENT_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "ldf_001",
    name: "Default Upload Legal Documents Form",
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
  const missing = buildInitialLegalDocumentFormTree().filter(
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
    const meta = LEGAL_DOCUMENT_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampLegalDocumentFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = LEGAL_DOCUMENT_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    LEGAL_DOCUMENT_FORM_GROUPS.map((group) => [`${group.sectionId}/${group.id}`, group]),
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
    tree = tree.filter((node) => node.id !== LEGAL_DOCUMENT_FIELD_TYPE_TEST_LEVEL_ID);
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
  const ordered = LEGAL_DOCUMENT_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(LEGAL_DOCUMENT_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveLegalDocumentFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getLegalDocumentFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "ldf_001",
    name: meta.name || "Default Upload Legal Documents Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getLegalDocumentFormTree(setup = getLegalDocumentFormSetup()) {
  return cloneLegalDocumentFormTree(setup.tree || getOrderedTree());
}

export function saveLegalDocumentFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getLegalDocumentFormSetup();
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
    window.dispatchEvent(new CustomEvent(LEGAL_DOCUMENT_FORM_SETUP_CHANGED_EVENT));
  }
  return getLegalDocumentFormSetup();
}

export function saveLegalDocumentFormTree(tree) {
  return saveLegalDocumentFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getLegalDocumentFormFields(setup = getLegalDocumentFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getLegalDocumentFormLevel1Ancestor(tree, leaf.id);
      return leafToLegalDocumentField(leaf, l1?.id || null);
    });
}

export function getLegalDocumentFormFieldsBySection(sectionId, setup = getLegalDocumentFormSetup()) {
  return getLegalDocumentFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleLegalDocumentFieldsForSection(
  sectionId,
  setup = getLegalDocumentFormSetup(),
) {
  const root = findLegalDocumentFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveLegalDocumentFormLeaves(root).map((leaf) =>
    leafToLegalDocumentField(leaf, sectionId),
  );
}

/**
 * Main section with nested folder fields flattened and tagged with group metadata.
 */
export function getActiveLegalDocumentFormSections(setup = getLegalDocumentFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampLegalDocumentFormColumns(
        root.columns ?? LEGAL_DOCUMENT_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 2,
      );
      const fields = collectActiveLegalDocumentFormLeaves(root).map((leaf) => {
        const field = leafToLegalDocumentField(leaf, root.id);
        const parent = findLegalDocumentFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getLegalDocumentFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampLegalDocumentFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = LEGAL_DOCUMENT_FORM_SECTIONS.find((section) => section.id === root.id);
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

/** Section chips — same order as getActiveLegalDocumentFormSections. */
export function getLegalDocumentFormSteps(setup = getLegalDocumentFormSetup()) {
  return getActiveLegalDocumentFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetLegalDocumentFormSetup() {
  writeMeta({
    id: "ldf_001",
    name: "Default Upload Legal Documents Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getLegalDocumentFormSetup();
}

export { LEGAL_DOCUMENT_FORM_LEVEL_1 };
