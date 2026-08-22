/**
 * Active Insurance claim form setup — open-ended tree under fixed Level 1 wizard steps.
 * Values are captured only on leaf nodes.
 * Tree order (including sibling reorder) is persisted to sessionStorage via a
 * window-backed store so File New Claim forms always see the latest config.
 */

import {
  INSURANCE_CLAIM_FORM_LEVEL_1,
  buildInitialInsuranceClaimFormTree,
  clampInsuranceClaimFormColumns,
  clampLeavesColSpan,
  cloneInsuranceClaimFormTree,
  collectActiveInsuranceClaimFormLeaves,
  findInsuranceClaimFormNodeById,
  findInsuranceClaimFormParentNode,
  getInsuranceClaimFormNodePath,
  leafToInsuranceClaimField,
} from "./insuranceClaimFormTree";
import { INSURANCE_CLAIM_FORM_SECTIONS, INSURANCE_CLAIM_FORM_FIELD_CATALOG } from "./insuranceClaimFormFields";
import { fieldTypeIsFile, normalizeAcceptedFileTypes } from "./vehicleSpecTree";
import { createSessionTreeStore } from "./sessionTreeStore";
import { sortTreeSiblings } from "../../utils/treeReorder";

export const INSURANCE_CLAIM_FORM_SETUP_CHANGED_EVENT = "fleetly-insurance-claim-form-setup-changed";

const treeStore = createSessionTreeStore({
  storageKey: "fleetly_insurance_claim_form_tree",
  eventName: INSURANCE_CLAIM_FORM_SETUP_CHANGED_EVENT,
  windowKey: "__FLEETLY_INSURANCE_CLAIM_FORM_TREE__",
  getSeed: () => buildInitialInsuranceClaimFormTree(),
  clone: cloneInsuranceClaimFormTree,
});

const META_KEY = "fleetly_insurance_claim_form_meta";
const TREE_SCHEMA_VERSION = 6;
const CLAIM_FIELD_TYPE_TEST_LEVEL_ID = "field_type_preview";

function readMeta() {
  const fallback = {
    id: "icf_001",
    name: "Default File New Claim Form",
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
  const missing = buildInitialInsuranceClaimFormTree().filter(
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
    const meta = INSURANCE_CLAIM_FORM_SECTIONS.find((section) => section.id === root.id);
    if (!meta) return root;

    const next = {
      ...root,
      name: meta.label,
      description: meta.description || "",
    };

    if (applyCatalogColumns && meta.columns != null) {
      const columns = clampInsuranceClaimFormColumns(meta.columns);
      const children = (root.children || []).map((child) => {
        const catalog = INSURANCE_CLAIM_FORM_FIELD_CATALOG.find((field) => field.id === child.id);
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
    if (!fieldTypeIsFile(next.fieldType)) return next;
    const catalog = INSURANCE_CLAIM_FORM_FIELD_CATALOG.find((field) => field.id === next.id);
    return {
      ...next,
      fieldType: "file",
      acceptedFileTypes: normalizeAcceptedFileTypes(
        next.acceptedFileTypes ?? catalog?.acceptedFileTypes,
      ),
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
    // Flatten L2 groups: fields live directly under fixed L1 wizard steps.
    tree = syncLevel1SectionMeta(buildInitialInsuranceClaimFormTree(), {
      applyCatalogColumns: true,
    });
  }
  if (version < 3) {
    // Drop Review & Submit; nest Declaration / Signature under Declaration & Signature.
    tree = buildInitialInsuranceClaimFormTree();
  }
  if (version < 4) {
    tree = remapImageLeavesToFile(tree);
  }
  if (version < 5) {
    tree = tree.filter((node) => node.id !== CLAIM_FIELD_TYPE_TEST_LEVEL_ID);
  }
  if (version < 6) {
    tree = tree.filter((node) => node.id !== CLAIM_FIELD_TYPE_TEST_LEVEL_ID);
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
  const ordered = INSURANCE_CLAIM_FORM_SECTIONS.map((section, index) => {
    const node = byId.get(section.id);
    if (!node) return null;
    return { ...node, sortOrder: index };
  }).filter(Boolean);

  const known = new Set(INSURANCE_CLAIM_FORM_SECTIONS.map((section) => section.id));
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
      collectActiveInsuranceClaimFormLeaves(root).map((leaf) => leaf.id),
    ]),
  );
}

export function getInsuranceClaimFormSetup() {
  const meta = readMeta();
  const tree = getOrderedTree();
  return {
    id: meta.id || "icf_001",
    name: meta.name || "Default File New Claim Form",
    isActive: meta.isActive !== false,
    tree,
    visibleFieldIdsBySection: buildVisibleFieldIdsBySection(tree),
    updatedAt: meta.updatedAt || new Date().toISOString(),
  };
}

export function getInsuranceClaimFormTree(setup = getInsuranceClaimFormSetup()) {
  return cloneInsuranceClaimFormTree(setup.tree || getOrderedTree());
}

export function saveInsuranceClaimFormSetup(payload = {}) {
  const now = new Date().toISOString();
  const current = getInsuranceClaimFormSetup();
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
    window.dispatchEvent(new CustomEvent(INSURANCE_CLAIM_FORM_SETUP_CHANGED_EVENT));
  }
  return getInsuranceClaimFormSetup();
}

export function saveInsuranceClaimFormTree(tree) {
  return saveInsuranceClaimFormSetup({ tree });
}

function flattenIncludingInactive(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenIncludingInactive(node.children, acc);
  });
  return acc;
}

/** Flat list of all leaf field definitions (active + inactive) for lookups. */
export function getInsuranceClaimFormFields(setup = getInsuranceClaimFormSetup()) {
  const tree = setup.tree || [];
  return flattenIncludingInactive(tree)
    .filter((node) => node.key)
    .map((leaf) => {
      const l1 = getInsuranceClaimFormLevel1Ancestor(tree, leaf.id);
      return leafToInsuranceClaimField(leaf, l1?.id || null);
    });
}

export function getInsuranceClaimFormFieldsBySection(sectionId, setup = getInsuranceClaimFormSetup()) {
  return getInsuranceClaimFormFields(setup).filter((field) => field.sectionId === sectionId);
}

export function getVisibleInsuranceClaimFieldsForSection(
  sectionId,
  setup = getInsuranceClaimFormSetup(),
) {
  const root = findInsuranceClaimFormNodeById(setup.tree || [], sectionId);
  if (!root || root.isActive === false) return [];
  return collectActiveInsuranceClaimFormLeaves(root).map((leaf) =>
    leafToInsuranceClaimField(leaf, sectionId),
  );
}

/**
 * Wizard steps follow fixed Level-1 catalog order.
 * Nested folders (Declaration / Signature) are flattened as fields with group metadata.
 */
export function getActiveInsuranceClaimFormSections(setup = getInsuranceClaimFormSetup()) {
  const tree = orderLevel1ByCatalog(setup?.tree || getOrderedTree());

  return tree
    .map((root, index) => {
      if (!root || root.isActive === false) return null;
      const sectionColumns = clampInsuranceClaimFormColumns(
        root.columns ?? INSURANCE_CLAIM_FORM_SECTIONS.find((section) => section.id === root.id)?.columns ?? 2,
      );
      const fields = collectActiveInsuranceClaimFormLeaves(root).map((leaf) => {
        const field = leafToInsuranceClaimField(leaf, root.id);
        const parent = findInsuranceClaimFormParentNode(tree, leaf.id);
        const isGrouped = Boolean(parent && parent.id !== root.id);
        field.pathLabel = getInsuranceClaimFormNodePath(tree, leaf.id).slice(1).join(" › ");
        field.groupId = isGrouped ? (parent.formKey || parent.id) : null;
        field.groupLabel = isGrouped ? parent.name : null;
        field.groupDescription = isGrouped ? (parent.description || "") : null;
        field.groupColumns = isGrouped
          ? clampInsuranceClaimFormColumns(parent.columns ?? sectionColumns)
          : sectionColumns;
        return field;
      });
      if (!fields.length) return null;
      const sectionMeta = INSURANCE_CLAIM_FORM_SECTIONS.find((section) => section.id === root.id);
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

/** Wizard step chips — same order as getActiveInsuranceClaimFormSections. */
export function getInsuranceClaimWizardSteps(setup = getInsuranceClaimFormSetup()) {
  return getActiveInsuranceClaimFormSections(setup).map((section) => ({
    id: section.id,
    label: section.label,
  }));
}

export function resetInsuranceClaimFormSetup() {
  writeMeta({
    id: "icf_001",
    name: "Default File New Claim Form",
    isActive: true,
    updatedAt: new Date().toISOString(),
    treeSchemaVersion: TREE_SCHEMA_VERSION,
  });
  treeStore.reset();
  return getInsuranceClaimFormSetup();
}

export { INSURANCE_CLAIM_FORM_LEVEL_1 };
