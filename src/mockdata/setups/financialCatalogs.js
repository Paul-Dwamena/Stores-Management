/**
 * Financial setup catalogs + cost centers + budgets + funding/spending requests (session mock).
 */

import { reorderTreeSibling, sortTreeSiblings } from "../../utils/treeReorder";
import { createSessionTreeStore } from "./sessionTreeStore";

function clone(row) {
  return { ...row };
}

function nowIso() {
  return new Date().toISOString();
}

function makeId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 7)}`;
}

let fundingRequestSeq = 0;
let spendingRequestSeq = 0;

function nextFundingRequestNumber() {
  fundingRequestSeq += 1;
  return `FR-${new Date().getFullYear()}-${String(fundingRequestSeq).padStart(4, "0")}`;
}

function nextSpendingRequestNumber() {
  spendingRequestSeq += 1;
  return `SR-${new Date().getFullYear()}-${String(spendingRequestSeq).padStart(4, "0")}`;
}

// —— Phase 1 catalogs ——

const SEED_BUDGET_LINE_ITEMS = [
  {
    id: "bli-1",
    name: "Fuel Operations",
    ledgerAccountNumber: "5100-001",
    description: "Fuel purchases and bulk depot spend.",
    active: true,
  },
  {
    id: "bli-2",
    name: "Preventive Maintenance",
    ledgerAccountNumber: "5200-010",
    description: "Scheduled servicing and inspections.",
    active: true,
  },
  {
    id: "bli-3",
    name: "Corrective Repairs",
    ledgerAccountNumber: "5200-020",
    description: "Unplanned repair work.",
    active: true,
  },
  {
    id: "bli-4",
    name: "Insurance & Claims",
    ledgerAccountNumber: "5300-001",
    description: "Premiums and claim excesses.",
    active: true,
  },
];

const SEED_CLASSES = [
  {
    id: "cls-1",
    budgetLineItemId: "bli-1",
    name: "Bulk Fuel",
    classCode: "FUEL-BLK",
    description: "Depot and bulk fuel uplift.",
    active: true,
  },
  {
    id: "cls-2",
    budgetLineItemId: "bli-1",
    name: "Retail Fuel Cards",
    classCode: "FUEL-CARD",
    description: "Driver fuel card spend.",
    active: true,
  },
  {
    id: "cls-3",
    budgetLineItemId: "bli-2",
    name: "Scheduled Service",
    classCode: "PM-SCH",
    description: "OEM and fleet PM schedules.",
    active: true,
  },
  {
    id: "cls-4",
    budgetLineItemId: "bli-3",
    name: "Breakdown Repairs",
    classCode: "CR-BRK",
    description: "Roadside and workshop breakdowns.",
    active: true,
  },
  {
    id: "cls-5",
    budgetLineItemId: "bli-4",
    name: "Fleet Insurance Cover",
    classCode: "INS-CVR",
    description: "Fleet insurance premiums, claims, and policy excesses.",
    active: true,
  },
];

const SEED_COST_CENTER_LEVELS = [
  { id: "ccl-1", name: "Level 1", description: "Top organizational cost centers.", active: true, sortOrder: 1 },
  { id: "ccl-2", name: "Level 2", description: "Regional or sectional centers.", active: true, sortOrder: 2 },
  { id: "ccl-3", name: "Level 3", description: "Zone or district centers.", active: true, sortOrder: 3 },
  { id: "ccl-4", name: "Level 4", description: "Branch or site centers.", active: true, sortOrder: 4 },
];

const SEED_EXPENSE_CATEGORIES = [
  {
    id: "ec-1",
    budgetLineItemId: "bli-1",
    name: "Fuel",
    description: "Fuel and lubricants.",
    active: true,
    requiredAttachments: ["receipt"],
  },
  {
    id: "ec-2",
    budgetLineItemId: "bli-2",
    name: "Maintenance",
    description: "Workshop and parts spend.",
    active: true,
    requiredAttachments: ["invoice", "evidence"],
  },
  {
    id: "ec-3",
    budgetLineItemId: "bli-1",
    name: "Tolls & Parking",
    description: "Road tolls and parking fees.",
    active: true,
    requiredAttachments: ["receipt"],
  },
  {
    id: "ec-4",
    budgetLineItemId: "bli-4",
    name: "Insurance",
    description: "Insurance premiums and excess.",
    active: true,
    requiredAttachments: ["invoice"],
  },
  {
    id: "ec-5",
    budgetLineItemId: "bli-2",
    name: "Supplies",
    description: "General fleet supplies.",
    active: true,
    requiredAttachments: ["invoice", "receipt"],
  },
  {
    id: "ec-6",
    budgetLineItemId: "bli-3",
    name: "Corrective Repairs",
    description: "Unplanned repairs and breakdown recovery.",
    active: true,
    requiredAttachments: ["invoice", "evidence"],
  },
];

const SEED_PURPOSES = [
  { id: "pur-1", purpose: "Operations support", active: true },
  { id: "pur-2", purpose: "Emergency response", active: true },
  { id: "pur-3", purpose: "Scheduled maintenance", active: true },
  { id: "pur-4", purpose: "Compliance / inspection", active: true },
  { id: "pur-5", purpose: "Training", active: true },
];

let budgetLineItems = SEED_BUDGET_LINE_ITEMS.map(clone);
let classes = SEED_CLASSES.map(clone);
let costCenterLevels = SEED_COST_CENTER_LEVELS.map(clone);
let expenseCategories = SEED_EXPENSE_CATEGORIES.map(clone);
let purposes = SEED_PURPOSES.map(clone);

function summarize(list) {
  let active = 0;
  let inactive = 0;
  list.forEach((row) => {
    if (row.active === false) inactive += 1;
    else active += 1;
  });
  return { active, inactive, total: list.length };
}

export function getBudgetLineItems({ activeOnly = false } = {}) {
  return budgetLineItems
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone);
}

export function saveBudgetLineItem(payload) {
  const row = {
    id: payload.id || makeId("bli"),
    name: payload.name.trim(),
    ledgerAccountNumber: (payload.ledgerAccountNumber || "").trim(),
    description: (payload.description || "").trim(),
    active: payload.active !== false,
    updatedAt: nowIso(),
  };
  if (payload.id) {
    budgetLineItems = budgetLineItems.map((item) => (item.id === payload.id ? { ...item, ...row } : item));
  } else {
    budgetLineItems = [{ ...row, createdAt: nowIso() }, ...budgetLineItems];
  }
  return clone(budgetLineItems.find((item) => item.id === row.id));
}

export function setBudgetLineItemActive(id, active) {
  budgetLineItems = budgetLineItems.map((item) =>
    item.id === id ? { ...item, active: Boolean(active), updatedAt: nowIso() } : item,
  );
  return getBudgetLineItems().find((item) => item.id === id) ?? null;
}

export function summarizeBudgetLineItems() {
  return summarize(budgetLineItems);
}

export function getBudgetClasses({ activeOnly = false } = {}) {
  return classes
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone);
}

export function saveBudgetClass(payload) {
  const row = {
    id: payload.id || makeId("cls"),
    budgetLineItemId: payload.budgetLineItemId,
    name: payload.name.trim(),
    classCode: (payload.classCode || "").trim(),
    description: (payload.description || "").trim(),
    active: payload.active !== false,
    updatedAt: nowIso(),
  };
  if (payload.id) {
    classes = classes.map((item) => (item.id === payload.id ? { ...item, ...row } : item));
  } else {
    classes = [{ ...row, createdAt: nowIso() }, ...classes];
  }
  return clone(classes.find((item) => item.id === row.id));
}

export function setBudgetClassActive(id, active) {
  classes = classes.map((item) =>
    item.id === id ? { ...item, active: Boolean(active), updatedAt: nowIso() } : item,
  );
  return getBudgetClasses().find((item) => item.id === id) ?? null;
}

export function summarizeBudgetClasses() {
  return summarize(classes);
}

export function getCostCenterLevels({ activeOnly = false } = {}) {
  return costCenterLevels
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone)
    .sort((a, b) => (a.sortOrder ?? 0) - (b.sortOrder ?? 0));
}

export function saveCostCenterLevel(payload) {
  const maxOrder = costCenterLevels.reduce((max, row) => Math.max(max, row.sortOrder ?? 0), 0);
  const row = {
    id: payload.id || makeId("ccl"),
    name: payload.name.trim(),
    description: (payload.description || "").trim(),
    active: payload.active !== false,
    sortOrder: payload.sortOrder ?? (payload.id
      ? costCenterLevels.find((item) => item.id === payload.id)?.sortOrder ?? maxOrder + 1
      : maxOrder + 1),
    updatedAt: nowIso(),
  };
  if (payload.id) {
    costCenterLevels = costCenterLevels.map((item) =>
      item.id === payload.id ? { ...item, ...row } : item,
    );
  } else {
    costCenterLevels = [...costCenterLevels, { ...row, createdAt: nowIso() }];
  }
  return clone(costCenterLevels.find((item) => item.id === row.id));
}

export function setCostCenterLevelActive(id, active) {
  costCenterLevels = costCenterLevels.map((item) =>
    item.id === id ? { ...item, active: Boolean(active), updatedAt: nowIso() } : item,
  );
  return getCostCenterLevels().find((item) => item.id === id) ?? null;
}

export function summarizeCostCenterLevels() {
  return summarize(costCenterLevels);
}

export function getExpenseCategoriesCatalog({ activeOnly = false } = {}) {
  return expenseCategories
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone);
}

export function saveExpenseCategoryCatalog(payload) {
  const row = {
    id: payload.id || makeId("ec"),
    budgetLineItemId: payload.budgetLineItemId || "",
    name: payload.name.trim(),
    description: (payload.description || "").trim(),
    active: payload.active !== false,
    requiredAttachments: Array.isArray(payload.requiredAttachments)
      ? payload.requiredAttachments
      : ["receipt"],
    updatedAt: nowIso(),
  };
  if (payload.id) {
    expenseCategories = expenseCategories.map((item) =>
      item.id === payload.id ? { ...item, ...row } : item,
    );
  } else {
    expenseCategories = [{ ...row, createdAt: nowIso() }, ...expenseCategories];
  }
  return clone(expenseCategories.find((item) => item.id === row.id));
}

export function setExpenseCategoryCatalogActive(id, active) {
  expenseCategories = expenseCategories.map((item) =>
    item.id === id ? { ...item, active: Boolean(active), updatedAt: nowIso() } : item,
  );
  return getExpenseCategoriesCatalog().find((item) => item.id === id) ?? null;
}

export function summarizeExpenseCategoriesCatalog() {
  return summarize(expenseCategories);
}

export function getPurposes({ activeOnly = false } = {}) {
  return purposes
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone);
}

export function savePurpose(payload) {
  const row = {
    id: payload.id || makeId("pur"),
    purpose: (payload.purpose || payload.name || "").trim(),
    active: payload.active !== false,
    updatedAt: nowIso(),
  };
  if (payload.id) {
    purposes = purposes.map((item) => (item.id === payload.id ? { ...item, ...row } : item));
  } else {
    purposes = [{ ...row, createdAt: nowIso() }, ...purposes];
  }
  return clone(purposes.find((item) => item.id === row.id));
}

export function setPurposeActive(id, active) {
  purposes = purposes.map((item) =>
    item.id === id ? { ...item, active: Boolean(active), updatedAt: nowIso() } : item,
  );
  return getPurposes().find((item) => item.id === id) ?? null;
}

export function summarizePurposes() {
  return summarize(purposes);
}

export function summarizeFinancialCatalog(optionId) {
  switch (optionId) {
    case "budget-line-item":
      return summarizeBudgetLineItems();
    case "budget-class":
      return summarizeBudgetClasses();
    case "cost-center-level":
      return summarizeCostCenterLevels();
    case "expense-categories":
    case "expense-category":
      return summarizeExpenseCategoriesCatalog();
    case "funding-purpose":
    case "purpose":
      return summarizePurposes();
    default:
      return null;
  }
}

export function isFinancialCatalogOption(optionId) {
  return [
    "budget-line-item",
    "budget-class",
    "cost-center-level",
    "expense-categories",
    "expense-category",
    "funding-purpose",
    "purpose",
  ].includes(optionId);
}

// —— Phase 2: Cost centers ——

const SEED_COST_CENTERS = [
  {
    id: "cc-retail",
    name: "Retail",
    code: "RB000",
    levelId: "ccl-1",
    parentId: null,
    description: "Retail operations cost center.",
    active: true,
    children: [
      {
        id: "cc-north",
        name: "North Sec",
        code: "NS100",
        levelId: "ccl-2",
        parentId: "cc-retail",
        description: "Northern retail section.",
        active: true,
        children: [],
      },
      {
        id: "cc-mid",
        name: "Mid Sec",
        code: "MS100",
        levelId: "ccl-2",
        parentId: "cc-retail",
        description: "Middle retail section.",
        active: true,
        children: [],
      },
      {
        id: "cc-south",
        name: "South Sec",
        code: "SS100",
        levelId: "ccl-2",
        parentId: "cc-retail",
        description: "Southern retail section.",
        active: true,
        children: [
          {
            id: "cc-sz1",
            name: "South Zone 1",
            code: "SZ101",
            levelId: "ccl-3",
            parentId: "cc-south",
            description: "South zone one.",
            active: true,
            children: [
              {
                id: "cc-takoradi",
                name: "Takoradi",
                code: "D0100",
                levelId: "ccl-4",
                parentId: "cc-sz1",
                description: "Takoradi site.",
                active: true,
                children: [],
              },
              {
                id: "cc-cape",
                name: "Cape Coast",
                code: "D0200",
                levelId: "ccl-4",
                parentId: "cc-sz1",
                description: "Cape Coast site.",
                active: true,
                children: [],
              },
            ],
          },
          {
            id: "cc-sz2",
            name: "South Zone 2",
            code: "SZ102",
            levelId: "ccl-3",
            parentId: "cc-south",
            description: "South zone two.",
            active: true,
            children: [],
          },
        ],
      },
    ],
  },
  {
    id: "cc-alt",
    name: "Alternative",
    code: "A0209",
    levelId: "ccl-1",
    parentId: null,
    description: "Alternative channels.",
    active: true,
    children: [],
  },
  {
    id: "cc-broker",
    name: "Broker",
    code: "A0211",
    levelId: "ccl-1",
    parentId: null,
    description: "Brokerage cost center.",
    active: true,
    children: [],
  },
  {
    id: "cc-estates",
    name: "Estates",
    code: "A0102",
    levelId: "ccl-1",
    parentId: null,
    description: "Estates and facilities.",
    active: true,
    children: [],
  },
  {
    id: "cc-div",
    name: "Div",
    code: "DIV",
    levelId: "ccl-1",
    parentId: null,
    description: "Legacy division (inactive).",
    active: false,
    children: [],
  },
];

function deepCloneTree(nodes = []) {
  return nodes.map((node) => ({
    ...node,
    children: deepCloneTree(node.children ?? []),
  }));
}

export const COST_CENTER_TREE_CHANGED_EVENT = "fleetly-cost-center-tree-changed";

const costCenterTreeStore = createSessionTreeStore({
  storageKey: "fleetly_cost_center_tree",
  eventName: COST_CENTER_TREE_CHANGED_EVENT,
  windowKey: "__FLEETLY_COST_CENTER_TREE__",
  getSeed: () => SEED_COST_CENTERS,
  clone: deepCloneTree,
});

export function getCostCenterTree() {
  return sortTreeSiblings(costCenterTreeStore.get());
}

export function saveCostCenterTree(nodes) {
  return costCenterTreeStore.set(sortTreeSiblings(nodes));
}

export function flattenCostCenters(nodes = [], acc = []) {
  nodes.forEach((node) => {
    acc.push(node);
    if (node.children?.length) flattenCostCenters(node.children, acc);
  });
  return acc;
}

export function findCostCenterById(nodes = [], id) {
  for (const node of nodes) {
    if (node.id === id) return node;
    const found = findCostCenterById(node.children ?? [], id);
    if (found) return found;
  }
  return null;
}

export function findCostCenterParent(nodes = [], id, parent = null) {
  for (const node of nodes) {
    if (node.id === id) return parent;
    const found = findCostCenterParent(node.children ?? [], id, node);
    if (found !== undefined) return found;
  }
  return undefined;
}

export function getCostCenterPath(nodes = [], nodeId) {
  const path = [];
  const walk = (list, target, trail) => {
    for (const node of list) {
      const next = [...trail, node.name];
      if (node.id === target) {
        path.push(...next);
        return true;
      }
      if (walk(node.children ?? [], target, next)) return true;
    }
    return false;
  };
  walk(nodes, nodeId, []);
  return path;
}

function mapTree(nodes, mapper) {
  return nodes.map((node) => {
    const next = mapper(node);
    return {
      ...next,
      children: mapTree(node.children ?? [], mapper),
    };
  });
}

function updateInTree(nodes, id, updater) {
  return nodes.map((node) => {
    if (node.id === id) return updater(node);
    return {
      ...node,
      children: updateInTree(node.children ?? [], id, updater),
    };
  });
}

function insertChild(nodes, parentId, child) {
  if (!parentId) return [child, ...nodes];
  return nodes.map((node) => {
    if (node.id === parentId) {
      return { ...node, children: [child, ...(node.children ?? [])] };
    }
    return {
      ...node,
      children: insertChild(node.children ?? [], parentId, child),
    };
  });
}

export function addCostCenter(nodes, payload) {
  const created = {
    id: makeId("cc"),
    name: payload.name.trim(),
    code: (payload.code || "").trim().toUpperCase(),
    levelId: payload.levelId,
    parentId: payload.parentId || null,
    description: (payload.description || "").trim(),
    active: payload.active !== false,
    children: [],
    createdAt: nowIso(),
    updatedAt: nowIso(),
  };
  return insertChild(nodes, created.parentId, created);
}

export function updateCostCenter(nodes, nodeId, payload) {
  return updateInTree(nodes, nodeId, (node) => ({
    ...node,
    name: payload.name?.trim() ?? node.name,
    code: payload.code !== undefined ? payload.code.trim().toUpperCase() : node.code,
    levelId: payload.levelId ?? node.levelId,
    parentId: payload.parentId !== undefined ? payload.parentId || null : node.parentId,
    description: payload.description !== undefined ? payload.description.trim() : node.description,
    active: payload.active !== undefined ? payload.active !== false : node.active,
    updatedAt: nowIso(),
  }));
}

export function toggleCostCenterActive(nodes, nodeId) {
  return updateInTree(nodes, nodeId, (node) => ({
    ...node,
    active: !node.active,
    updatedAt: nowIso(),
  }));
}

export function reorderCostCenter(nodes, nodeId, direction) {
  const cloned = (list = []) =>
    list.map((node) => ({
      ...node,
      children: cloned(node.children ?? []),
    }));
  const { nodes: next, moved } = reorderTreeSibling(cloned(nodes), nodeId, direction);
  if (!moved) {
    throw new Error(
      direction === "up"
        ? "Already at the top among siblings."
        : "Already at the bottom among siblings.",
    );
  }
  return next;
}

export function filterCostCenterTree(nodes = [], searchQuery = "") {
  const q = searchQuery.trim().toLowerCase();
  if (!q) return deepCloneTree(nodes);

  const filterNode = (node) => {
    const children = (node.children ?? []).map(filterNode).filter(Boolean);
    const selfMatch =
      node.name.toLowerCase().includes(q)
      || (node.code || "").toLowerCase().includes(q)
      || (node.description || "").toLowerCase().includes(q);
    if (!selfMatch && children.length === 0) return null;
    return { ...node, children };
  };

  return nodes.map(filterNode).filter(Boolean);
}

export function getCostCenterParentOptions(nodes = [], { excludeId = null } = {}) {
  const levels = getCostCenterLevels({ activeOnly: true });
  const maxSort = levels.reduce((max, level) => Math.max(max, level.sortOrder || 0), 0);
  const levelById = Object.fromEntries(levels.map((level) => [level.id, level]));

  const options = [];
  const walk = (list, depth) => {
    list.forEach((node) => {
      if (node.id === excludeId) return;
      if (node.active === false) return;
      const sortOrder = levelById[node.levelId]?.sortOrder ?? depth + 1;
      // Deepest level cannot be a parent
      if (sortOrder < maxSort) {
        options.push({
          value: node.id,
          label: `${"— ".repeat(depth)}${node.name} (${node.code})`,
          levelId: node.levelId,
          sortOrder,
          depth,
        });
      }
      walk(node.children ?? [], depth + 1);
    });
  };
  walk(nodes, 0);
  return options;
}

/** Child level is always parent level + 1 (or Level 1 when no parent). */
export function resolveCostCenterChildLevelId(parentId, nodes = []) {
  const levels = getCostCenterLevels({ activeOnly: true }).sort(
    (a, b) => (a.sortOrder || 0) - (b.sortOrder || 0),
  );
  if (!levels.length) return "";
  if (!parentId) return levels[0].id;

  const parent = findCostCenterById(nodes, parentId);
  if (!parent) return levels[0].id;

  const parentLevel = levels.find((level) => level.id === parent.levelId);
  const parentOrder = parentLevel?.sortOrder ?? 1;
  const next = levels.find((level) => level.sortOrder === parentOrder + 1);
  return next?.id || "";
}

// —— Phase 3–5: Budgets, funding, spending ——

export const BUDGET_PERIOD_OPTIONS = [
  { value: "ANNUAL", label: "Annual" },
  { value: "QUARTERLY", label: "Quarterly" },
  { value: "MONTHLY", label: "Monthly" },
];

let budgets = [
  {
    id: "bud-1",
    costCenterId: "cc-retail",
    budgetLineItemId: "bli-1",
    period: "ANNUAL",
    classificationType: "combined",
    classId: "cls-1",
    expenseCategoryId: "ec-1",
    amount: 300000,
    spent: 8677.84,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-05T10:00:00.000Z",
  },
  {
    id: "bud-2",
    costCenterId: "cc-south",
    budgetLineItemId: "bli-2",
    period: "ANNUAL",
    classificationType: "combined",
    classId: "cls-3",
    expenseCategoryId: "ec-2",
    amount: 120000,
    spent: 15400,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-08T10:00:00.000Z",
  },
  {
    id: "bud-3",
    costCenterId: "cc-north",
    budgetLineItemId: "bli-1",
    period: "QUARTERLY",
    classificationType: "combined",
    classId: "cls-2",
    expenseCategoryId: "ec-1",
    amount: 85000,
    spent: 31240.5,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-10T09:30:00.000Z",
  },
  {
    id: "bud-4",
    costCenterId: "cc-mid",
    budgetLineItemId: "bli-2",
    period: "MONTHLY",
    classificationType: "combined",
    classId: "cls-3",
    expenseCategoryId: "ec-2",
    amount: 18000,
    spent: 7350,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-02-01T08:45:00.000Z",
  },
  {
    id: "bud-5",
    costCenterId: "cc-takoradi",
    budgetLineItemId: "bli-3",
    period: "QUARTERLY",
    classificationType: "combined",
    classId: "cls-4",
    expenseCategoryId: "ec-6",
    amount: 62000,
    spent: 28475.25,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-14T11:00:00.000Z",
  },
  {
    id: "bud-6",
    costCenterId: "cc-cape",
    budgetLineItemId: "bli-4",
    period: "ANNUAL",
    classificationType: "combined",
    classId: "cls-5",
    expenseCategoryId: "ec-4",
    amount: 95000,
    spent: 45000,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-16T10:20:00.000Z",
  },
  {
    id: "bud-7",
    costCenterId: "cc-sz1",
    budgetLineItemId: "bli-2",
    period: "QUARTERLY",
    classificationType: "combined",
    classId: "cls-3",
    expenseCategoryId: "ec-2",
    amount: 48000,
    spent: 19680,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-20T13:15:00.000Z",
  },
  {
    id: "bud-8",
    costCenterId: "cc-alt",
    budgetLineItemId: "bli-1",
    period: "MONTHLY",
    classificationType: "combined",
    classId: "cls-1",
    expenseCategoryId: "ec-1",
    amount: 12500,
    spent: 4230.75,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-03-01T08:00:00.000Z",
  },
  {
    id: "bud-9",
    costCenterId: "cc-broker",
    budgetLineItemId: "bli-4",
    period: "QUARTERLY",
    classificationType: "combined",
    classId: "cls-5",
    expenseCategoryId: "ec-4",
    amount: 72000,
    spent: 21800,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-24T09:10:00.000Z",
  },
  {
    id: "bud-10",
    costCenterId: "cc-estates",
    budgetLineItemId: "bli-3",
    period: "MONTHLY",
    classificationType: "combined",
    classId: "cls-4",
    expenseCategoryId: "ec-6",
    amount: 22000,
    spent: 16890,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-04-01T10:40:00.000Z",
  },
  {
    id: "bud-11",
    costCenterId: "cc-retail",
    budgetLineItemId: "bli-3",
    period: "QUARTERLY",
    classificationType: "combined",
    classId: "cls-4",
    expenseCategoryId: "ec-6",
    amount: 110000,
    spent: 83950,
    fiscalYear: 2026,
    active: true,
    createdAt: "2026-01-28T14:00:00.000Z",
  },
  {
    id: "bud-12",
    costCenterId: "cc-south",
    budgetLineItemId: "bli-4",
    period: "MONTHLY",
    classificationType: "combined",
    classId: "cls-5",
    expenseCategoryId: "ec-4",
    amount: 15000,
    spent: 15000,
    fiscalYear: 2026,
    active: false,
    createdAt: "2026-05-01T09:00:00.000Z",
  },
];

let fundingRequests = [
  {
    id: "fr-1",
    costCenterId: "cc-retail",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-1",
    justification: "Q1 depot fuel top-up for Accra routes.",
    amount: 25000,
    status: "APPROVED",
    createdAt: "2026-02-01T09:00:00.000Z",
    approvedAt: "2026-02-02T11:00:00.000Z",
  },
  {
    id: "fr-2",
    costCenterId: "cc-south",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-3",
    justification: "PM parts for southern fleet.",
    amount: 8000,
    status: "PENDING",
    createdAt: "2026-03-10T09:00:00.000Z",
    approvedAt: null,
  },
  {
    id: "fr-3",
    costCenterId: "cc-takoradi",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-3",
    justification: "Workshop consumables for Takoradi site.",
    amount: 4500,
    status: "APPROVED",
    createdAt: "2026-03-12T10:15:00.000Z",
    approvedAt: "2026-03-13T08:00:00.000Z",
  },
  {
    id: "fr-4",
    costCenterId: "cc-cape",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-4",
    justification: "Inspection compliance spend for Cape Coast.",
    amount: 3200,
    status: "REJECTED",
    createdAt: "2026-03-14T11:20:00.000Z",
    approvedAt: null,
    rejectionReason: "Duplicate request against an existing allocation.",
  },
  {
    id: "fr-5",
    costCenterId: "cc-north",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-1",
    justification: "Northern section fuel card float.",
    amount: 12000,
    status: "PENDING",
    createdAt: "2026-03-18T09:40:00.000Z",
    approvedAt: null,
  },
  {
    id: "fr-6",
    costCenterId: "cc-mid",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-2",
    justification: "Emergency roadside fuel for mid section.",
    amount: 6000,
    status: "APPROVED",
    createdAt: "2026-03-20T14:00:00.000Z",
    approvedAt: "2026-03-21T09:10:00.000Z",
  },
  {
    id: "fr-7",
    costCenterId: "cc-sz1",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-3",
    justification: "Scheduled service kits for South Zone 1.",
    amount: 9800,
    status: "PENDING",
    createdAt: "2026-03-22T08:30:00.000Z",
    approvedAt: null,
  },
  {
    id: "fr-8",
    costCenterId: "cc-retail",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-5",
    justification: "Driver fuel handling training materials.",
    amount: 1500,
    status: "APPROVED",
    createdAt: "2026-03-24T12:00:00.000Z",
    approvedAt: "2026-03-25T10:00:00.000Z",
  },
  {
    id: "fr-9",
    costCenterId: "cc-alt",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-1",
    justification: "Alternative channel depot uplift.",
    amount: 7000,
    status: "PENDING",
    createdAt: "2026-03-26T09:00:00.000Z",
    approvedAt: null,
  },
  {
    id: "fr-10",
    costCenterId: "cc-broker",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-4",
    justification: "Broker fleet compliance checks.",
    amount: 2800,
    status: "APPROVED",
    createdAt: "2026-03-27T15:45:00.000Z",
    approvedAt: "2026-03-28T11:20:00.000Z",
  },
  {
    id: "fr-11",
    costCenterId: "cc-south",
    budgetId: "bud-2",
    budgetLineItemId: "bli-2",
    purposeId: "pur-2",
    justification: "Breakdown recovery support for southern routes.",
    amount: 11000,
    status: "REJECTED",
    createdAt: "2026-03-29T10:00:00.000Z",
    approvedAt: null,
    rejectionReason: "Amount exceeds available maintenance budget.",
  },
  {
    id: "fr-12",
    costCenterId: "cc-takoradi",
    budgetId: "bud-1",
    budgetLineItemId: "bli-1",
    purposeId: "pur-1",
    justification: "Takoradi bulk fuel for April operations.",
    amount: 18000,
    status: "APPROVED",
    createdAt: "2026-04-01T09:00:00.000Z",
    approvedAt: "2026-04-02T08:30:00.000Z",
  },
];

fundingRequests = fundingRequests.map((row, index) => ({
  ...row,
  requestNumber: `FR-2026-${String(index + 1).padStart(4, "0")}`,
}));
fundingRequestSeq = fundingRequests.length;

export const SEED_PAYEES = [
  {
    id: "pay-1",
    name: "Goil Station Accra",
    accounts: [
      { id: "acc-1a", label: "GCB — 1145120001", bank: "GCB" },
      { id: "acc-1b", label: "Ecobank — 0023345567", bank: "Ecobank" },
    ],
  },
  {
    id: "pay-2",
    name: "AutoCare Workshop",
    accounts: [{ id: "acc-2a", label: "Stanbic — 9044221188", bank: "Stanbic" }],
  },
  {
    id: "pay-3",
    name: "RoadSafe Supplies",
    accounts: [
      { id: "acc-3a", label: "Absa — 3011223344", bank: "Absa" },
      { id: "acc-3b", label: "Fidelity — 1009988776", bank: "Fidelity" },
    ],
  },
];

let spendingRequests = [
  {
    id: "sr-1",
    costCenterId: "cc-retail",
    fundingRequestId: "fr-1",
    expenseCategoryId: "ec-1",
    amount: 4500,
    purposeId: "pur-1",
    justification: "Purchase depot fuel for daily Accra distribution routes.",
    payeeId: "pay-1",
    payeeAccountId: "acc-1a",
    attachments: { receipt: "fuel-receipt-feb.pdf" },
    status: "PENDING_APPROVAL",
    createdAt: "2026-02-05T14:00:00.000Z",
  },
  {
    id: "sr-2",
    costCenterId: "cc-takoradi",
    fundingRequestId: "fr-3",
    expenseCategoryId: "ec-2",
    amount: 2100,
    purposeId: "pur-3",
    justification: "Procure maintenance parts required for scheduled servicing.",
    payeeId: "pay-2",
    payeeAccountId: "acc-2a",
    attachments: { invoice: "autocare-inv-88.pdf", evidence: "parts-photo.jpg" },
    status: "APPROVED",
    createdAt: "2026-03-14T09:00:00.000Z",
    approvedAt: "2026-03-15T10:00:00.000Z",
  },
  {
    id: "sr-3",
    costCenterId: "cc-mid",
    fundingRequestId: "fr-6",
    expenseCategoryId: "ec-1",
    amount: 1800,
    purposeId: "pur-2",
    justification: "Provide emergency roadside fuel for vehicles operating in the mid section.",
    payeeId: "pay-1",
    payeeAccountId: "acc-1b",
    attachments: { receipt: "mid-fuel-mar.pdf" },
    status: "PAID",
    createdAt: "2026-03-22T11:00:00.000Z",
    approvedAt: "2026-03-23T09:00:00.000Z",
    paidAt: "2026-03-24T16:00:00.000Z",
  },
  {
    id: "sr-4",
    costCenterId: "cc-retail",
    fundingRequestId: "fr-8",
    expenseCategoryId: "ec-5",
    amount: 900,
    purposeId: "pur-5",
    justification: "Purchase training kits and consumables for driver fuel-handling sessions.",
    payeeId: "pay-3",
    payeeAccountId: "acc-3a",
    attachments: { invoice: "training-kits.pdf", receipt: "payment-slip.pdf" },
    status: "PENDING_APPROVAL",
    createdAt: "2026-03-26T13:20:00.000Z",
  },
  {
    id: "sr-5",
    costCenterId: "cc-broker",
    fundingRequestId: "fr-10",
    expenseCategoryId: "ec-4",
    amount: 1500,
    purposeId: "pur-4",
    justification: "Settle the insurance policy excess for the reported fleet incident.",
    payeeId: "pay-3",
    payeeAccountId: "acc-3b",
    attachments: { invoice: "insurance-excess.pdf" },
    status: "REJECTED",
    createdAt: "2026-03-28T15:00:00.000Z",
    rejectionReason: "Policy already covered under fleet umbrella.",
  },
  {
    id: "sr-6",
    costCenterId: "cc-takoradi",
    fundingRequestId: "fr-12",
    expenseCategoryId: "ec-1",
    amount: 5200,
    purposeId: "pur-1",
    justification: "Replenish bulk fuel allocation for Takoradi operations.",
    payeeId: "pay-1",
    payeeAccountId: "acc-1a",
    attachments: { receipt: "takoradi-bulk-apr.pdf" },
    status: "PENDING_APPROVAL",
    createdAt: "2026-04-03T10:00:00.000Z",
  },
  {
    id: "sr-7",
    costCenterId: "cc-mid",
    fundingRequestId: "fr-6",
    expenseCategoryId: "ec-3",
    amount: 350,
    purposeId: "pur-1",
    justification: "Cover approved toll and parking charges for regional operations.",
    payeeId: "pay-3",
    payeeAccountId: "acc-3a",
    attachments: { receipt: "tolls-mar.pdf" },
    status: "APPROVED",
    createdAt: "2026-03-25T08:00:00.000Z",
    approvedAt: "2026-03-25T17:00:00.000Z",
  },
  {
    id: "sr-8",
    costCenterId: "cc-retail",
    fundingRequestId: "fr-1",
    expenseCategoryId: "ec-1",
    amount: 2750,
    purposeId: "pur-1",
    justification: "Top up fuel stock for high-volume Accra delivery routes.",
    payeeId: "pay-1",
    payeeAccountId: "acc-1a",
    attachments: { receipt: "accra-fuel-topup.pdf" },
    status: "PAID",
    createdAt: "2026-02-10T12:00:00.000Z",
    approvedAt: "2026-02-11T09:00:00.000Z",
    paidAt: "2026-02-12T14:00:00.000Z",
  },
  {
    id: "sr-9",
    costCenterId: "cc-takoradi",
    fundingRequestId: "fr-3",
    expenseCategoryId: "ec-2",
    amount: 1600,
    purposeId: "pur-3",
    justification: "Complete preventive service work documented on the attached job card.",
    payeeId: "pay-2",
    payeeAccountId: "acc-2a",
    attachments: { invoice: "pm-service.pdf", evidence: "job-card.pdf" },
    status: "PENDING_APPROVAL",
    createdAt: "2026-04-04T09:30:00.000Z",
  },
  {
    id: "sr-10",
    costCenterId: "cc-broker",
    fundingRequestId: "fr-10",
    expenseCategoryId: "ec-5",
    amount: 640,
    purposeId: "pur-1",
    justification: "Purchase office and operational supplies for the brokerage fleet desk.",
    payeeId: "pay-3",
    payeeAccountId: "acc-3a",
    attachments: { invoice: "broker-supplies.pdf", receipt: "broker-receipt.pdf" },
    status: "APPROVED",
    createdAt: "2026-03-30T11:00:00.000Z",
    approvedAt: "2026-03-31T08:00:00.000Z",
  },
  {
    id: "sr-11",
    costCenterId: "cc-retail",
    fundingRequestId: "fr-1",
    expenseCategoryId: "ec-3",
    amount: 220,
    purposeId: "pur-1",
    justification: "Reimburse parking fees incurred during approved fleet operations.",
    payeeId: "pay-3",
    payeeAccountId: "acc-3b",
    attachments: { receipt: "parking-fees.pdf" },
    status: "REJECTED",
    createdAt: "2026-02-20T16:00:00.000Z",
    rejectionReason: "Personal parking claim — not reimbursable.",
  },
  {
    id: "sr-12",
    costCenterId: "cc-takoradi",
    fundingRequestId: "fr-12",
    expenseCategoryId: "ec-1",
    amount: 3900,
    purposeId: "pur-1",
    justification: "Fund the April fuel-card allocation for Takoradi drivers.",
    payeeId: "pay-1",
    payeeAccountId: "acc-1b",
    attachments: { receipt: "april-fuel-card.pdf" },
    status: "PENDING_APPROVAL",
    createdAt: "2026-04-05T07:45:00.000Z",
  },
];

spendingRequests = spendingRequests.map((row, index) => ({
  ...row,
  requestNumber: `SR-2026-${String(index + 1).padStart(4, "0")}`,
}));
spendingRequestSeq = spendingRequests.length;

export function getBudgets({ activeOnly = false } = {}) {
  return budgets
    .filter((row) => !activeOnly || row.active !== false)
    .map(clone);
}

export function getBudgetById(id) {
  const row = budgets.find((item) => item.id === id);
  return row ? clone(row) : null;
}

export function getBudgetsForCostCenter(costCenterId) {
  return getBudgets({ activeOnly: true }).filter((row) => row.costCenterId === costCenterId);
}

export function addBudget(payload) {
  const classId = payload.classId || null;
  const expenseCategoryId = payload.expenseCategoryId || null;

  if (classId) {
    const selectedClass = classes.find(
      (row) =>
        row.id === classId
        && row.active !== false
        && row.budgetLineItemId === payload.budgetLineItemId,
    );
    if (!selectedClass) {
      throw new Error("Select a class under the chosen budget line item.");
    }
  }

  if (expenseCategoryId) {
    const selectedCategory = expenseCategories.find(
      (row) =>
        row.id === expenseCategoryId
        && row.active !== false
        && row.budgetLineItemId === payload.budgetLineItemId,
    );
    if (!selectedCategory) {
      throw new Error("Select an expense category under the chosen budget line item.");
    }
  }

  const created = {
    id: makeId("bud"),
    costCenterId: payload.costCenterId,
    budgetLineItemId: payload.budgetLineItemId,
    period: payload.period,
    classificationType: "combined",
    classId,
    expenseCategoryId,
    amount: Number(payload.amount) || 0,
    spent: 0,
    fiscalYear: payload.fiscalYear || new Date().getFullYear(),
    active: true,
    createdAt: nowIso(),
  };
  budgets = [created, ...budgets];
  return clone(created);
}

export function getFundingRequests() {
  return fundingRequests.map(clone);
}

export function getApprovedFundingRequests({ costCenterId } = {}) {
  return fundingRequests
    .filter((row) => row.status === "APPROVED")
    .filter((row) => !costCenterId || row.costCenterId === costCenterId)
    .map(clone);
}

export function addFundingRequest(payload) {
  const created = {
    id: makeId("fr"),
    requestNumber: nextFundingRequestNumber(),
    costCenterId: payload.costCenterId,
    budgetId: payload.budgetId || null,
    budgetLineItemId: payload.budgetLineItemId,
    purposeId: payload.purposeId,
    justification: (payload.justification || "").trim(),
    amount: Number(payload.amount) || 0,
    status: "PENDING",
    createdAt: nowIso(),
    approvedAt: null,
  };
  fundingRequests = [created, ...fundingRequests];
  return clone(created);
}

export function advanceFundingRequest(id, action, payload = {}) {
  fundingRequests = fundingRequests.map((row) => {
    if (row.id !== id) return row;
    if (action === "approve") {
      return { ...row, status: "APPROVED", approvedAt: nowIso(), ...payload };
    }
    if (action === "reject") {
      return { ...row, status: "REJECTED", rejectionReason: payload.reason || "", ...payload };
    }
    return row;
  });
  return getFundingRequests().find((row) => row.id === id) ?? null;
}

export function getPayees() {
  return SEED_PAYEES.map((payee) => ({
    ...payee,
    accounts: payee.accounts.map((account) => ({ ...account })),
  }));
}

export function getSpendingRequests() {
  return spendingRequests.map(clone);
}

export function addSpendingRequest(payload) {
  const status = payload.status === "DRAFT" ? "DRAFT" : "PENDING_APPROVAL";
  if (status !== "DRAFT") {
    const funding = fundingRequests.find(
      (row) =>
        row.id === payload.fundingRequestId
        && row.status === "APPROVED"
        && row.costCenterId === payload.costCenterId,
    );
    if (!funding) {
      throw new Error("Select an approved funding request for this cost center.");
    }
    const category = expenseCategories.find(
      (row) =>
        row.id === payload.expenseCategoryId
        && row.active !== false
        && row.budgetLineItemId === funding.budgetLineItemId,
    );
    if (!category) {
      throw new Error("The expense category must belong to the approved budget item.");
    }
    const committed = spendingRequests
      .filter((row) => row.fundingRequestId === funding.id)
      .filter((row) => !["REJECTED", "DRAFT"].includes(row.status))
      .reduce((sum, row) => sum + Number(row.amount || 0), 0);
    const amount = Number(payload.amount);
    const remaining = Math.max(0, Number(funding.amount || 0) - committed);
    if (!amount || amount <= 0 || amount > remaining) {
      throw new Error(`Spending amount cannot exceed ${formatMoneyGhs(remaining)}.`);
    }
  }
  const created = {
    id: makeId("sr"),
    requestNumber: nextSpendingRequestNumber(),
    costCenterId: payload.costCenterId,
    fundingRequestId: payload.fundingRequestId,
    expenseCategoryId: payload.expenseCategoryId,
    amount: Number(payload.amount) || 0,
    purposeId: payload.purposeId || "",
    justification: (payload.justification || "").trim(),
    driverIds: Array.isArray(payload.driverIds) ? [...payload.driverIds] : [],
    vehicleIds: Array.isArray(payload.vehicleIds) ? [...payload.vehicleIds] : [],
    payeeId: payload.payeeId,
    payeeAccountId: payload.payeeAccountId,
    attachments: payload.attachments || {},
    status,
    createdAt: nowIso(),
  };
  spendingRequests = [created, ...spendingRequests];
  return clone(created);
}

export function advanceSpendingRequest(id, action, payload = {}) {
  spendingRequests = spendingRequests.map((row) => {
    if (row.id !== id) return row;
    if (action === "approve") {
      return { ...row, status: "APPROVED", approvedAt: nowIso(), ...payload };
    }
    if (action === "reject") {
      return { ...row, status: "REJECTED", rejectionReason: payload.reason || "", ...payload };
    }
    if (action === "pay") {
      return { ...row, status: "PAID", paidAt: nowIso(), ...payload };
    }
    return row;
  });
  return getSpendingRequests().find((row) => row.id === id) ?? null;
}

export function getFundingRequestNumber(row) {
  return row?.requestNumber || (row?.id ? String(row.id).toUpperCase() : "—");
}

export function getSpendingRequestNumber(row) {
  return row?.requestNumber || (row?.id ? String(row.id).toUpperCase() : "—");
}

export function formatMoneyGhs(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return "GHS 0.00";
  return `GHS ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}
