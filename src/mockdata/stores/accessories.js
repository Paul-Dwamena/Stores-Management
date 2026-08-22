/** Seed accessories inventory with collection and supply history. */

export const ACCESSORY_STATUS_OPTIONS = [
  { value: "ALL", label: "All statuses" },
  { value: "ACTIVE", label: "Active" },
  { value: "LOW_STOCK", label: "Low stock" },
  { value: "OUT_OF_STOCK", label: "Out of stock" },
  { value: "INACTIVE", label: "Inactive" },
];

export const ACCESSORY_BRAND_OPTIONS = [
  { value: "AutoGuard", label: "AutoGuard" },
  { value: "Anker", label: "Anker" },
  { value: "Bosch", label: "Bosch" },
  { value: "NOCO", label: "NOCO" },
  { value: "RoadSafe", label: "RoadSafe" },
  { value: "SafeFleet", label: "SafeFleet" },
];

export const SEED_ACCESSORIES = [
  {
    id: "acc-001",
    itemCode: "ACC-FLP-001",
    name: "Floor Mat Set (Universal)",
    brand: "AutoGuard",
    description: "Heavy-duty rubber floor mat set for light commercial vehicles.",
    quantity: 42,
    totalPurchaseCost: 3360,
    unitCost: 80,
    averageUnitCost: 80,
    status: "ACTIVE",
    createdAt: "2026-06-12T09:20:00.000Z",
    updatedAt: "2026-07-18T11:05:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 18 },
      { location: "Tema Fleet Store — Community 12", quantity: 14 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 10 },
    ],
    minStock: 10,
    collectives: [
      {
        id: "col-001",
        itemCode: "ACC-FLP-001",
        name: "Floor Mat Set (Universal)",
        brand: "AutoGuard",
        description: "Issued for Hilux pool vehicles.",
        quantity: 4,
        dateCollected: "2026-07-10T08:30:00.000Z",
        unitCost: 80,
        location: "Store A — Shelf B2",
        collectedBy: "Kofi Boateng",
      },
      {
        id: "col-002",
        itemCode: "ACC-FLP-001",
        name: "Floor Mat Set (Universal)",
        brand: "AutoGuard",
        description: "Workshop demo unit collection.",
        quantity: 1,
        dateCollected: "2026-07-15T14:10:00.000Z",
        unitCost: 85,
        location: "Store B — Shelf A1",
        collectedBy: "Ama Serwaa",
      },
    ],
    supplies: [
      {
        id: "sup-001",
        itemCode: "ACC-FLP-001",
        name: "Floor Mat Set (Universal)",
        brand: "AutoGuard",
        description: "Restock order from Accra Auto Supplies.",
        quantity: 20,
        unitCost: 75,
        location: "Store A — Shelf B2",
        dateRequested: "2026-06-01T10:00:00.000Z",
        dateSupplied: "2026-06-08T15:40:00.000Z",
        receivedBy: "Yaw Mensah",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Kojo Asante",
      },
      {
        id: "sup-002",
        itemCode: "ACC-FLP-001",
        name: "Floor Mat Set (Universal)",
        brand: "AutoGuard",
        description: "Top-up supply for Q3.",
        quantity: 15,
        unitCost: 85,
        location: "Store A — Shelf B2",
        dateRequested: "2026-07-01T09:15:00.000Z",
        dateSupplied: "2026-07-05T12:00:00.000Z",
        receivedBy: "Efua Darko",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Nii Quaye",
      },
      {
        id: "sup-002b",
        itemCode: "ACC-FLP-001",
        name: "Floor Mat Set (Universal)",
        brand: "AutoGuard",
        description: "Secondary store intake.",
        quantity: 12,
        unitCost: 82,
        location: "Store B — Shelf A1",
        dateRequested: "2026-07-08T09:15:00.000Z",
        dateSupplied: "2026-07-12T11:20:00.000Z",
        receivedBy: "Efua Darko",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Nii Quaye",
      },
    ],
  },
  {
    id: "acc-002",
    itemCode: "ACC-WIP-014",
    name: "Wiper Blade Pair 22\"",
    brand: "Bosch",
    description: "All-season wiper blades for sedan and SUV fleet.",
    quantity: 26,
    totalPurchaseCost: 3120,
    unitCost: 120,
    status: "ACTIVE",
    createdAt: "2026-05-20T11:00:00.000Z",
    updatedAt: "2026-07-20T09:45:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 12 },
      { location: "Tema Fleet Store — Community 12", quantity: 8 },
      { location: "Takoradi Regional Store — Effia", quantity: 6 },
    ],
    minStock: 12,
    collectives: [
      {
        id: "col-003",
        itemCode: "ACC-WIP-014",
        name: "Wiper Blade Pair 22\"",
        brand: "Bosch",
        description: "Replacement for GR-4521-21.",
        quantity: 2,
        dateCollected: "2026-07-12T10:20:00.000Z",
        unitCost: 120,
        collectedBy: "Selorm Gbeho",
      },
    ],
    supplies: [
      {
        id: "sup-003",
        itemCode: "ACC-WIP-014",
        name: "Wiper Blade Pair 22\"",
        brand: "Bosch",
        description: "Initial stock intake.",
        quantity: 20,
        dateRequested: "2026-05-10T08:00:00.000Z",
        dateSupplied: "2026-05-18T16:30:00.000Z",
        receivedBy: "Yaw Mensah",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Kojo Asante",
      },
    ],
  },
  {
    id: "acc-003",
    itemCode: "ACC-FIR-008",
    name: "Fire Extinguisher 2kg",
    brand: "SafeFleet",
    description: "Vehicle-mounted ABC dry powder extinguisher.",
    quantity: 18,
    totalPurchaseCost: 3330,
    unitCost: 185,
    status: "ACTIVE",
    createdAt: "2026-04-02T08:00:00.000Z",
    updatedAt: "2026-07-22T13:00:00.000Z",
    location: "Tema Fleet Store — Community 12",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 8 },
      { location: "Tema Fleet Store — Community 12", quantity: 6 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 4 },
    ],
    minStock: 6,
    collectives: [
      {
        id: "col-004",
        itemCode: "ACC-FIR-008",
        name: "Fire Extinguisher 2kg",
        brand: "SafeFleet",
        description: "Issued to executive pool.",
        quantity: 3,
        dateCollected: "2026-07-08T11:45:00.000Z",
        unitCost: 185,
        collectedBy: "Michael Addo",
      },
      {
        id: "col-005",
        itemCode: "ACC-FIR-008",
        name: "Fire Extinguisher 2kg",
        brand: "SafeFleet",
        description: "Issued after safety audit.",
        quantity: 3,
        dateCollected: "2026-07-21T09:00:00.000Z",
        unitCost: 185,
        collectedBy: "Ruth Ofori",
      },
    ],
    supplies: [
      {
        id: "sup-004",
        itemCode: "ACC-FIR-008",
        name: "Fire Extinguisher 2kg",
        brand: "SafeFleet",
        description: "Awaiting replenishment PO.",
        quantity: 12,
        dateRequested: "2026-07-22T08:30:00.000Z",
        dateSupplied: null,
        receivedBy: "—",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Pending",
      },
    ],
  },
  {
    id: "acc-004",
    itemCode: "ACC-TRI-021",
    name: "Warning Triangle Kit",
    brand: "RoadSafe",
    description: "Reflective warning triangle with carrying case.",
    quantity: 25,
    totalPurchaseCost: 1875,
    unitCost: 75,
    status: "ACTIVE",
    createdAt: "2026-06-28T12:10:00.000Z",
    updatedAt: "2026-07-14T16:20:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 12 },
      { location: "Tema Fleet Store — Community 12", quantity: 8 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 5 },
    ],
    minStock: 8,
    collectives: [],
    supplies: [
      {
        id: "sup-005",
        itemCode: "ACC-TRI-021",
        name: "Warning Triangle Kit",
        brand: "RoadSafe",
        description: "Bulk safety kit purchase.",
        quantity: 25,
        dateRequested: "2026-06-20T09:00:00.000Z",
        dateSupplied: "2026-06-27T14:00:00.000Z",
        receivedBy: "Yaw Mensah",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Ama Serwaa",
      },
    ],
  },
  {
    id: "acc-005",
    itemCode: "ACC-CHG-033",
    name: "USB Dual Car Charger",
    brand: "Anker",
    description: "36W dual-port USB car charger for field tablets.",
    quantity: 24,
    totalPurchaseCost: 1680,
    unitCost: 70,
    status: "ACTIVE",
    createdAt: "2026-07-02T10:00:00.000Z",
    updatedAt: "2026-07-16T08:40:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 10 },
      { location: "Tema Fleet Store — Community 12", quantity: 8 },
      { location: "Tamale Regional Store — Industrial Area", quantity: 6 },
    ],
    minStock: 5,
    collectives: [
      {
        id: "col-006",
        itemCode: "ACC-CHG-033",
        name: "USB Dual Car Charger",
        brand: "Anker",
        description: "Issued to dispatch supervisors.",
        quantity: 2,
        dateCollected: "2026-07-16T08:15:00.000Z",
        unitCost: 70,
        collectedBy: "Esi Nyarko",
      },
    ],
    supplies: [
      {
        id: "sup-006",
        itemCode: "ACC-CHG-033",
        name: "USB Dual Car Charger",
        brand: "Anker",
        description: "IT accessories restock.",
        quantity: 20,
        dateRequested: "2026-06-25T11:20:00.000Z",
        dateSupplied: "2026-07-01T13:50:00.000Z",
        receivedBy: "Kojo Owusu",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Fiifi Bentum",
      },
    ],
  },
  {
    id: "acc-006",
    itemCode: "ACC-JAR-009",
    name: "Jump Starter Pack",
    brand: "NOCO",
    description: "Portable lithium jump starter for roadside assist.",
    quantity: 9,
    totalPurchaseCost: 8100,
    unitCost: 900,
    status: "ACTIVE",
    createdAt: "2026-03-15T09:00:00.000Z",
    updatedAt: "2026-07-19T17:10:00.000Z",
    location: "Tema Fleet Store — Community 12",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 4 },
      { location: "Tema Fleet Store — Community 12", quantity: 3 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 2 },
    ],
    minStock: 4,
    collectives: [
      {
        id: "col-007",
        itemCode: "ACC-JAR-009",
        name: "Jump Starter Pack",
        brand: "NOCO",
        description: "Temporary issue to roadside team.",
        quantity: 1,
        dateCollected: "2026-07-19T16:45:00.000Z",
        unitCost: 900,
        collectedBy: "Kudjo Alorwu",
      },
    ],
    supplies: [
      {
        id: "sup-007",
        itemCode: "ACC-JAR-009",
        name: "Jump Starter Pack",
        brand: "NOCO",
        description: "Initial equipment purchase.",
        quantity: 4,
        dateRequested: "2026-03-01T10:00:00.000Z",
        dateSupplied: "2026-03-12T11:30:00.000Z",
        receivedBy: "Yaw Mensah",
        suppliedByTitle: "Fleet manager",
        suppliedByName: "Emmanuel Tetteh",
        suppliedBy: "Emmanuel Tetteh",
        approvedBy: "Kojo Asante",
      },
    ],
  },
  {
    id: "acc-007",
    itemCode: "ACC-MNT-041",
    name: "Magnetic phone mount (dashboard)",
    brand: "AutoGuard",
    description: "Strong magnet dashboard mount for courier vans.",
    quantity: 22,
    totalPurchaseCost: 1100,
    unitCost: 50,
    status: "ACTIVE",
    createdAt: "2026-07-08T09:00:00.000Z",
    updatedAt: "2026-08-10T11:20:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 10 },
      { location: "Tema Fleet Store — Community 12", quantity: 7 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 5 },
    ],
    minStock: 6,
    collectives: [],
    supplies: [],
  },
  {
    id: "acc-008",
    itemCode: "ACC-FRS-034",
    name: "Cabin air freshener pack",
    brand: "SafeFleet",
    description: "Long-life cabin air freshener pack for executive pool vehicles.",
    quantity: 30,
    totalPurchaseCost: 450,
    unitCost: 15,
    status: "ACTIVE",
    createdAt: "2026-07-05T10:15:00.000Z",
    updatedAt: "2026-08-09T14:00:00.000Z",
    location: "Tema Fleet Store — Community 12",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 12 },
      { location: "Tema Fleet Store — Community 12", quantity: 10 },
      { location: "Takoradi Regional Store — Effia", quantity: 8 },
    ],
    minStock: 8,
    collectives: [],
    supplies: [],
  },
  {
    id: "acc-009",
    itemCode: "ACC-AID-027",
    name: "Vehicle first aid kit",
    brand: "RoadSafe",
    description: "Compact vehicle first aid kit for roadside response.",
    quantity: 16,
    totalPurchaseCost: 1280,
    unitCost: 80,
    status: "ACTIVE",
    createdAt: "2026-06-18T08:40:00.000Z",
    updatedAt: "2026-08-12T09:30:00.000Z",
    location: "Kumasi Regional Store — Asokwa",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 6 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 6 },
      { location: "Tamale Regional Store — Industrial Area", quantity: 4 },
    ],
    minStock: 5,
    collectives: [],
    supplies: [],
  },
  {
    id: "acc-010",
    itemCode: "ACC-VIS-018",
    name: "High-visibility vest",
    brand: "SafeFleet",
    description: "Reflective high-visibility vest for drivers and roadside crews.",
    quantity: 28,
    totalPurchaseCost: 840,
    unitCost: 30,
    status: "ACTIVE",
    createdAt: "2026-06-02T12:00:00.000Z",
    updatedAt: "2026-08-11T16:10:00.000Z",
    location: "Accra Central Store — Ringway Estates",
    stockByLocation: [
      { location: "Accra Central Store — Ringway Estates", quantity: 10 },
      { location: "Tema Fleet Store — Community 12", quantity: 8 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 6 },
      { location: "Takoradi Regional Store — Effia", quantity: 4 },
    ],
    minStock: 8,
    collectives: [],
    supplies: [],
  },
];

const STORE_LOCATIONS = [
  "Accra Central Store — Ringway Estates",
  "Tema Fleet Store — Community 12",
  "Kumasi Regional Store — Asokwa",
  "Takoradi Regional Store — Effia",
  "Tamale Regional Store — Industrial Area",
];

const RECEIVABLE_SEED_DETAILS = [
  {
    supplierId: "sup-accra-auto",
    waybillNumber: "WB-ACC-2026-0148",
    deliveredByName: "Daniel Ofori",
    supplierPhone: "+233 24 410 8821",
    supplierEmail: "receipts@accraautospares.com",
    condition: "GOOD",
    notes: "Count verified against the waybill; packaging intact.",
  },
  {
    supplierId: "sup-tema-parts",
    waybillNumber: "WB-TEMA-2026-0092",
    deliveredByName: "Michael Tetteh",
    supplierPhone: "+233 20 715 4408",
    supplierEmail: "dispatch@temapartshub.com",
    condition: "PARTIALLY_DAMAGED",
    notes: "Outer carton was dented; items inspected and accepted.",
  },
  {
    supplierId: "sup-kumasi-fleet",
    waybillNumber: "WB-KFS-2026-0067",
    deliveredByName: "Samuel Asare",
    supplierPhone: "+233 55 202 6114",
    supplierEmail: "sales@kumasifleetsupplies.com",
    condition: "GOOD",
    notes: "Delivery received in full and electronic receipt acknowledged.",
  },
];

let sessionAccessories = SEED_ACCESSORIES.map((item, itemIndex) => {
  const location = STORE_LOCATIONS[itemIndex % STORE_LOCATIONS.length];
  return {
    ...item,
    location,
    stockByLocation: (item.stockByLocation ?? [{ quantity: item.quantity }]).map(
      (row, rowIndex) => ({
        ...row,
        location: STORE_LOCATIONS[(itemIndex + rowIndex) % STORE_LOCATIONS.length],
      }),
    ),
    collectives: (item.collectives ?? []).map((row, rowIndex) => ({
      ...RECEIVABLE_SEED_DETAILS[(itemIndex + rowIndex) % RECEIVABLE_SEED_DETAILS.length],
      ...row,
      location,
    })),
    supplies: (item.supplies ?? []).map((row) => ({ ...row, location })),
  };
});

export function getAccessories() {
  return sessionAccessories.map((item) => ({
    ...item,
    collectives: [...(item.collectives ?? [])],
    supplies: [...(item.supplies ?? [])],
  }));
}

export function getAccessoryById(id) {
  const item = sessionAccessories.find((row) => row.id === id);
  if (!item) return null;
  return {
    ...item,
    collectives: [...(item.collectives ?? [])],
    supplies: [...(item.supplies ?? [])],
  };
}

export function generateAccessoryItemCode() {
  let max = 0;
  for (const item of sessionAccessories) {
    const match = String(item.itemCode || "").match(/(\d+)\s*$/);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `ACC-${String(max + 1).padStart(3, "0")}`;
}

function createUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

export function addAccessory(payload) {
  const now = new Date().toISOString();
  const quantity = Number(payload.quantity) || 0;
  const unitCost = Number(payload.unitCost ?? payload.unitPrice) || 0;
  const totalPurchaseCost =
    payload.totalPurchaseCost !== undefined && payload.totalPurchaseCost !== ""
      ? Number(payload.totalPurchaseCost)
      : quantity * unitCost;
  const location = payload.location?.trim() || "Accra Central Store — Ringway Estates";
  const created = {
    id: createUniqueId("acc"),
    itemCode: payload.itemCode?.trim() || generateAccessoryItemCode(),
    name: payload.name.trim(),
    brand: payload.brand?.trim() || "—",
    description: payload.description?.trim() || "",
    quantity,
    unitCost,
    averageUnitCost: unitCost,
    totalPurchaseCost,
    status: quantity <= 0 ? "OUT_OF_STOCK" : quantity <= (Number(payload.minStock) || 5) ? "LOW_STOCK" : "ACTIVE",
    createdAt: now,
    updatedAt: now,
    location,
    stockByLocation: quantity > 0 ? [{ location, quantity }] : [],
    minStock: Number(payload.minStock) || 5,
    supplierId: payload.supplierId || "",
    waybillNumber: payload.waybillNumber?.trim() || "",
    deliveredByName: payload.deliveredByName?.trim() || "",
    supplierPhone: payload.supplierPhone?.trim() || "",
    supplierEmail: payload.supplierEmail?.trim() || "",
    condition: payload.condition || "GOOD",
    notes: payload.notes?.trim() || "",
    collectives:
      quantity > 0
        ? [{
            id: createUniqueId("col"),
            itemCode: payload.itemCode?.trim() || generateAccessoryItemCode(),
            name: payload.name.trim(),
            brand: payload.brand?.trim() || "—",
            description: payload.description?.trim() || "",
            quantity,
            dateCollected: now,
            unitCost,
            location,
            collectedBy: "Store clerk",
            supplierId: payload.supplierId || "",
            waybillNumber: payload.waybillNumber?.trim() || "",
            deliveredByName: payload.deliveredByName?.trim() || "",
            supplierPhone: payload.supplierPhone?.trim() || "",
            supplierEmail: payload.supplierEmail?.trim() || "",
            condition: payload.condition || "GOOD",
            notes: payload.notes?.trim() || "",
          }]
        : [],
    supplies: [],
  };
  sessionAccessories = [created, ...sessionAccessories];
  return { ...created };
}

function resolveInventoryStatus(quantity, minStock) {
  if (quantity <= 0) return "OUT_OF_STOCK";
  if (quantity <= (Number(minStock) || 5)) return "LOW_STOCK";
  return "ACTIVE";
}

function mergeStockByLocation(existing, location, quantity) {
  const rows = (existing ?? []).map((row) => ({
    location: row.location,
    quantity: Number(row.quantity) || 0,
  }));
  const index = rows.findIndex(
    (row) => row.location.toLowerCase() === location.toLowerCase(),
  );
  if (index >= 0) {
    rows[index] = {
      ...rows[index],
      quantity: rows[index].quantity + quantity,
    };
  } else {
    rows.push({ location, quantity });
  }
  return rows.filter((row) => row.quantity > 0);
}

/** Submit a stock receipt for approval — does not update on-hand stock yet. */
export function receiveAccessoryStock(id, payload) {
  const index = sessionAccessories.findIndex((row) => row.id === id);
  if (index < 0) throw new Error("Accessory not found.");

  const quantity = Number(payload.quantity);
  const unitCost = Number(payload.unitCost ?? payload.unitPrice);
  const location = payload.location?.trim();
  if (!quantity || quantity <= 0) throw new Error("Enter a quantity greater than zero.");
  if (Number.isNaN(unitCost) || unitCost < 0) throw new Error("Enter a valid unit cost.");
  if (!location) throw new Error("Select a store location.");

  const item = sessionAccessories[index];
  const now = new Date().toISOString();
  const supply = {
    id: createUniqueId("sup"),
    itemCode: item.itemCode,
    name: item.name,
    brand: item.brand,
    description: payload.notes?.trim() || "Stock receipt submitted for approval.",
    quantity,
    unitCost,
    location,
    dateRequested: now,
    dateSupplied: null,
    receivedBy: payload.receivedBy?.trim() || "Store clerk",
    suppliedByTitle: "Fleet manager",
    suppliedByName: "Emmanuel Tetteh",
    suppliedBy: "Emmanuel Tetteh",
    approvedBy: "Pending",
    status: "PENDING_APPROVAL",
    supplierId: payload.supplierId || "",
    waybillNumber: payload.waybillNumber?.trim() || "",
    deliveredByName: payload.deliveredByName?.trim() || "",
    supplierPhone: payload.supplierPhone?.trim() || "",
    supplierEmail: payload.supplierEmail?.trim() || "",
    condition: payload.condition || "GOOD",
    notes: payload.notes?.trim() || "",
  };

  const updated = {
    ...item,
    updatedAt: now,
    supplies: [supply, ...(item.supplies ?? [])],
  };
  sessionAccessories = [
    ...sessionAccessories.slice(0, index),
    updated,
    ...sessionAccessories.slice(index + 1),
  ];
  return getAccessoryById(id);
}

/** Approve a pending stock receipt — updates on-hand stock and receivables. */
export function approveAccessoryStockReceipt(itemId, supplyId) {
  const index = sessionAccessories.findIndex((row) => row.id === itemId);
  if (index < 0) throw new Error("Accessory not found.");

  const item = sessionAccessories[index];
  const supplyIndex = (item.supplies ?? []).findIndex((row) => row.id === supplyId);
  if (supplyIndex < 0) throw new Error("Stock receipt not found.");

  const supply = item.supplies[supplyIndex];
  if (supply.status === "APPROVED" || supply.dateSupplied) {
    throw new Error("This stock receipt has already been approved.");
  }

  const quantity = Number(supply.quantity);
  const unitCost = Number(supply.unitCost);
  const location = String(supply.location || "").trim();
  if (!quantity || quantity <= 0) throw new Error("Invalid receipt quantity.");
  if (!location) throw new Error("Receipt is missing a store location.");

  const now = new Date().toISOString();
  const prevQty = Number(item.quantity) || 0;
  const prevAvg = getInventoryAverageUnitCost(item);
  const nextQty = prevQty + quantity;
  const nextAvg =
    nextQty > 0 ? (prevQty * prevAvg + quantity * unitCost) / nextQty : unitCost;
  const stockByLocation = mergeStockByLocation(
    getInventoryStockByLocation(item),
    location,
    quantity,
  );

  const approvedSupply = {
    ...supply,
    status: "APPROVED",
    dateSupplied: now,
    approvedBy: "Current Approver",
  };
  const receipt = {
    id: createUniqueId("col"),
    itemCode: item.itemCode,
    name: item.name,
    brand: item.brand,
    description: supply.notes || supply.description || "Stock received into store.",
    quantity,
    unitCost,
    location,
    dateCollected: now,
    collectedBy: supply.receivedBy || "Store clerk",
    supplierId: supply.supplierId || "",
    waybillNumber: supply.waybillNumber || "",
    deliveredByName: supply.deliveredByName || "",
    supplierPhone: supply.supplierPhone || "",
    supplierEmail: supply.supplierEmail || "",
    condition: supply.condition || "GOOD",
    notes: supply.notes || "",
    supplyId: supply.id,
  };

  const nextSupplies = [...(item.supplies ?? [])];
  nextSupplies[supplyIndex] = approvedSupply;

  const updated = {
    ...item,
    quantity: nextQty,
    unitCost: nextAvg,
    averageUnitCost: nextAvg,
    totalPurchaseCost: (Number(item.totalPurchaseCost) || 0) + quantity * unitCost,
    status: resolveInventoryStatus(nextQty, item.minStock),
    updatedAt: now,
    location: stockByLocation[0]?.location || location,
    stockByLocation,
    collectives: [receipt, ...(item.collectives ?? [])],
    supplies: nextSupplies,
  };
  sessionAccessories = [
    ...sessionAccessories.slice(0, index),
    updated,
    ...sessionAccessories.slice(index + 1),
  ];
  return getAccessoryById(itemId);
}

function mergeReceiptDetails(shared, line) {
  return {
    ...shared,
    ...line,
    condition: line.condition || shared.condition || "GOOD",
    notes: line.notes || shared.notes || "",
  };
}

export function addAccessoriesBatch(lines = [], shared = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Add at least one accessory receipt line.");
  }
  const payloads = lines.map((line) => mergeReceiptDetails(shared, line));
  payloads.forEach((payload, index) => {
    if (!payload.name?.trim()) throw new Error(`Accessory line ${index + 1} needs a name.`);
    if (!payload.brand?.trim()) throw new Error(`Accessory line ${index + 1} needs a brand.`);
    if (!Number(payload.quantity) || Number(payload.quantity) <= 0) {
      throw new Error(`Accessory line ${index + 1} needs a valid quantity.`);
    }
    if (payload.unitCost === "" || Number(payload.unitCost) < 0) {
      throw new Error(`Accessory line ${index + 1} needs a valid unit cost.`);
    }
    if (!payload.location?.trim()) throw new Error("Select a store location.");
  });
  return payloads.map((payload) => addAccessory(payload));
}

export function receiveAccessoryStockBatch(lines = [], shared = {}) {
  if (!Array.isArray(lines) || lines.length === 0) {
    throw new Error("Add at least one accessory receipt line.");
  }
  const seen = new Set();
  const receipts = lines.map((line, index) => {
    if (!line.itemId || !sessionAccessories.some((item) => item.id === line.itemId)) {
      throw new Error(`Select a valid accessory on line ${index + 1}.`);
    }
    if (seen.has(line.itemId)) {
      throw new Error(`Accessory line ${index + 1} duplicates another selected item.`);
    }
    seen.add(line.itemId);
    if (!Number(line.quantity) || Number(line.quantity) <= 0) {
      throw new Error(`Accessory line ${index + 1} needs a valid quantity.`);
    }
    if (line.unitCost === "" || Number(line.unitCost) < 0) {
      throw new Error(`Accessory line ${index + 1} needs a valid unit cost.`);
    }
    const payload = mergeReceiptDetails(shared, line);
    if (!payload.location?.trim()) {
      throw new Error(`Accessory line ${index + 1} needs a store location.`);
    }
    return {
      id: line.itemId,
      payload,
    };
  });
  return receipts.map(({ id, payload }) => receiveAccessoryStock(id, payload));
}

export function formatAccessoryMoney(amount) {
  const value = Number(amount);
  if (Number.isNaN(value)) return "GH₵ 0.00";
  return `GH₵ ${value.toLocaleString(undefined, {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  })}`;
}

/** Weighted average unit cost from store receipts (supplies). Falls back to stored averages. */
export function getInventoryAverageUnitCost(item) {
  if (!item) return 0;
  if (item.averageUnitCost != null && !Number.isNaN(Number(item.averageUnitCost))) {
    return Number(item.averageUnitCost);
  }
  const receipts = (item.supplies ?? []).filter(
    (row) => Number(row.quantity) > 0 && row.unitCost != null && !Number.isNaN(Number(row.unitCost)),
  );
  if (receipts.length > 0) {
    const totals = receipts.reduce(
      (acc, row) => {
        const qty = Number(row.quantity) || 0;
        const cost = Number(row.unitCost) || 0;
        acc.qty += qty;
        acc.value += qty * cost;
        return acc;
      },
      { qty: 0, value: 0 },
    );
    if (totals.qty > 0) return totals.value / totals.qty;
  }
  return Number(item.unitCost) || 0;
}

/** On-hand quantity by store location. */
export function getInventoryStockByLocation(item) {
  if (!item) return [];
  if (Array.isArray(item.stockByLocation) && item.stockByLocation.length > 0) {
    return item.stockByLocation
      .map((row) => ({
        location: row.location || "—",
        quantity: Number(row.quantity) || 0,
      }))
      .filter((row) => row.quantity > 0 || row.location !== "—");
  }
  if (item.location) {
    return [{ location: item.location, quantity: Number(item.quantity) || 0 }];
  }
  return [];
}

export function formatAccessoryDate(value) {
  if (!value || value === "—") return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatAccessoryStatus(status) {
  return (status ?? "ACTIVE").toString().replace(/_/g, " ");
}
