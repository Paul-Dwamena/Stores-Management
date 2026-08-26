/** Inter-store transfer requests between store locations. */

import { getUserContact } from "../org/users";
import { getReceiverByName } from "./receivers";
import { getAccessories, getInventoryStockByLocation } from "./accessories";
import { getStoreLocationOptions } from "../org/stores";

export const INTER_STORE_TRANSFER_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_APPROVAL", label: "Pending approval" },
  { value: "PENDING", label: "Pending dispatch" },
  { value: "IN_TRANSIT", label: "In transit" },
  { value: "ARRIVED", label: "Arrived" },
  { value: "COMPLETED", label: "Completed" },
  { value: "REJECTED", label: "Rejected" },
  { value: "CANCELLED", label: "Cancelled" },
];

export const INTER_STORE_TRANSFER_KIND_TABS = [
  { id: "accessories", label: "Accessories" },
];

export const INTER_STORE_TRANSFER_ACTOR = "Current user";

export function formatInterStoreItemType(itemType) {
  return itemType === "vehicle_parts" ? "Vehicle part" : "Accessory";
}

export function formatInterStoreItemDescription(item, itemType) {
  if (itemType === "vehicle_parts") {
    const levels = [
      item?.level1,
      item?.level2,
      item?.level3,
      item?.level4,
      item?.level5,
      item?.level6,
    ].filter(Boolean);
    if (levels.length) return levels.join(">");
  }
  return item?.description || item?.name || "—";
}

export function mapInventoryLocationToStore(location) {
  const value = String(location || "").trim();
  if (!value) return "";
  const options = getStoreLocationOptions();
  if (options.includes(value)) return value;
  const lower = value.toLowerCase();
  if (lower.includes("takoradi") || lower.includes("effia")) {
    return "Takoradi Regional Store — Effia";
  }
  if (lower.includes("tamale")) {
    return "Tamale Regional Store — Industrial Area";
  }
  if (lower.includes("kumasi") || lower.includes("asokwa") || lower.includes("store c")) {
    return "Kumasi Regional Store — Asokwa";
  }
  if (lower.includes("tema") || lower.includes("store b")) {
    return "Tema Fleet Store — Community 12";
  }
  if (lower.includes("accra") || lower.includes("store a") || lower.includes("yard")) {
    return "Accra Central Store — Ringway Estates";
  }
  return value;
}

export function getInterStoreFromStoreOptions() {
  const withStock = new Set();
  [...getAccessories()].forEach((item) => {
    getInventoryStockByLocation(item).forEach((row) => {
      if (!row.location || Number(row.quantity) <= 0) return;
      const store = mapInventoryLocationToStore(row.location);
      if (store) withStock.add(store);
    });
  });
  return getStoreLocationOptions().filter((store) => withStock.has(store));
}

export function getInterStoreStockLocations() {
  return getStoreLocationOptions();
}

export function getInterStoreItemsInStore(fromStore) {
  if (!fromStore) return [];

  const collect = (items, itemType) =>
    items.flatMap((item) => {
      const stockQuantity = getInventoryStockByLocation(item).reduce((sum, row) => {
        if (mapInventoryLocationToStore(row.location) !== fromStore) return sum;
        return sum + (Number(row.quantity) || 0);
      }, 0);
      if (stockQuantity <= 0) return [];
      return [{
        id: item.id,
        itemId: item.id,
        itemCode: item.itemCode,
        itemName: item.name,
        itemType,
        description: formatInterStoreItemDescription(item, itemType),
        stockQuantity,
        supplier: item.brand || "—",
      }];
    });

  return [
    ...collect(getAccessories(), "accessories"),
  ];
}

function historyEvent(action, at, by, note = "") {
  return { action, at, by, note };
}

function seedLine({
  itemId,
  itemCode,
  itemName,
  itemType,
  description,
  stockQuantity,
  quantityRequested,
  quantityApproved,
  toStore,
  supplier,
}) {
  const requested = Number(quantityRequested) || 0;
  const approved = quantityApproved == null ? null : Number(quantityApproved);
  return {
    itemId,
    itemCode,
    itemName,
    itemType,
    description,
    stockQuantity: Number(stockQuantity) || requested,
    quantityRequested: requested,
    quantityApproved: approved,
    movingQuantity: approved ?? requested,
    toStore,
    supplier: supplier || "—",
  };
}

const SEED_TRANSFERS = [
  {
    id: "ist-acc-001",
    transferNumber: "IST-ACC-2026-001",
    kind: "accessories",
    itemId: "acc-001",
    itemCode: "ACC-FLP-001",
    itemName: "Floor Mat Set (Universal)",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tema Fleet Store — Community 12",
    requestedBy: "Kwesi Mensah",
    approvedBy: "Kojo Asante",
    dispatcher: "Selorm Gbeho",
    status: "PENDING",
    createdAt: "2026-08-10T09:20:00.000Z",
    approvedAt: "2026-08-11T08:05:00.000Z",
    notes: "Move surplus mats to Tema for courier van fit-out.",
    lines: [
      seedLine({
        itemId: "acc-001",
        itemCode: "ACC-FLP-001",
        itemName: "Floor Mat Set (Universal)",
        itemType: "accessories",
        description: "Heavy-duty rubber floor mat set for light commercial vehicles.",
        stockQuantity: 18,
        quantityRequested: 8,
        quantityApproved: 6,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "AutoGuard",
      }),
      seedLine({
        itemId: "acc-005",
        itemCode: "ACC-CHG-033",
        itemName: "USB Dual Car Charger",
        itemType: "accessories",
        description: "36W dual-port USB car charger for field tablets.",
        stockQuantity: 10,
        quantityRequested: 12,
        quantityApproved: 8,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Anker",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-10T09:20:00.000Z", "Kwesi Mensah", "Move surplus mats to Tema for courier van fit-out."),
      historyEvent("approved", "2026-08-11T08:05:00.000Z", "Kojo Asante", "Approved reduced quantities against current stock."),
    ],
  },
  {
    id: "ist-acc-002",
    transferNumber: "IST-ACC-2026-002",
    kind: "accessories",
    itemId: "acc-005",
    itemCode: "ACC-CHG-033",
    itemName: "USB Dual Car Charger",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tema Fleet Store — Community 12",
    requestedBy: "Ama Serwaa",
    approvedBy: "Nii Quaye",
    dispatchedBy: "Ama Serwaa",
    dispatcher: "Selorm Gbeho",
    status: "IN_TRANSIT",
    createdAt: "2026-08-08T14:10:00.000Z",
    approvedAt: "2026-08-08T16:40:00.000Z",
    dispatchedAt: "2026-08-09T08:15:00.000Z",
    notes: "Regional restock for field tablets.",
    lines: [
      seedLine({
        itemId: "acc-005",
        itemCode: "ACC-CHG-033",
        itemName: "USB Dual Car Charger",
        itemType: "accessories",
        description: "36W dual-port USB car charger for field tablets.",
        stockQuantity: 10,
        quantityRequested: 8,
        quantityApproved: 8,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Anker",
      }),
      seedLine({
        itemId: "acc-002",
        itemCode: "ACC-WIP-014",
        itemName: "Wiper Blade Pair 22\"",
        itemType: "accessories",
        description: "All-season wiper blades for sedan and SUV fleet.",
        stockQuantity: 5,
        quantityRequested: 6,
        quantityApproved: 4,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Bosch",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-08T14:10:00.000Z", "Ama Serwaa", "Regional restock for field tablets."),
      historyEvent("approved", "2026-08-08T16:40:00.000Z", "Nii Quaye"),
      historyEvent("dispatched", "2026-08-09T08:15:00.000Z", "Ama Serwaa", "Packed and handed to regional courier."),
    ],
  },
  {
    id: "ist-acc-003",
    transferNumber: "IST-ACC-2026-003",
    kind: "accessories",
    itemId: "acc-004",
    itemCode: "ACC-TRI-021",
    itemName: "Warning Triangle Kit",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Kumasi Regional Store — Asokwa",
    requestedBy: "Fiifi Bentum",
    approvedBy: "Ama Serwaa",
    dispatchedBy: "Fiifi Bentum",
    dispatcher: "Esi Nyarko",
    receivedBy: "Kwesi Mensah",
    status: "COMPLETED",
    createdAt: "2026-07-20T11:00:00.000Z",
    approvedAt: "2026-07-20T13:10:00.000Z",
    dispatchedAt: "2026-07-20T16:40:00.000Z",
    arrivedAt: "2026-07-21T09:30:00.000Z",
    receivedAt: "2026-07-22T10:05:00.000Z",
    notes: "Returned excess safety kits to overflow store.",
    lines: [
      seedLine({
        itemId: "acc-004",
        itemCode: "ACC-TRI-021",
        itemName: "Warning Triangle Kit",
        itemType: "accessories",
        description: "Reflective warning triangle with carrying case.",
        stockQuantity: 12,
        quantityRequested: 5,
        quantityApproved: 4,
        toStore: "Kumasi Regional Store — Asokwa",
        supplier: "RoadSafe",
      }),
    ],
    history: [
      historyEvent("requested", "2026-07-20T11:00:00.000Z", "Fiifi Bentum", "Returned excess safety kits to overflow store."),
      historyEvent("approved", "2026-07-20T13:10:00.000Z", "Ama Serwaa"),
      historyEvent("dispatched", "2026-07-20T16:40:00.000Z", "Fiifi Bentum", "Loaded onto Accra van."),
      historyEvent("arrived", "2026-07-21T09:30:00.000Z", "Kwesi Mensah", "Accepted into store."),
      historyEvent("received", "2026-07-22T10:05:00.000Z", "Kwesi Mensah", "Counted into Kumasi stock."),
    ],
  },
  {
    id: "ist-acc-004",
    transferNumber: "IST-ACC-2026-004",
    kind: "accessories",
    itemId: "acc-006",
    itemCode: "ACC-JAR-009",
    itemName: "Jump Starter Pack",
    fromStore: "Tema Fleet Store — Community 12",
    toStore: "Accra Central Store — Ringway Estates",
    requestedBy: "Kudjo Alorwu",
    dispatcher: "Kofi Ansah",
    status: "PENDING_APPROVAL",
    createdAt: "2026-08-15T10:05:00.000Z",
    notes: "Need extra jump starters for Accra roadside team.",
    lines: [
      seedLine({
        itemId: "acc-006",
        itemCode: "ACC-JAR-009",
        itemName: "Jump Starter Pack",
        itemType: "accessories",
        description: "Portable lithium jump starter for roadside assist.",
        stockQuantity: 2,
        quantityRequested: 2,
        quantityApproved: null,
        toStore: "Accra Central Store — Ringway Estates",
        supplier: "NOCO",
      }),
      seedLine({
        itemId: "acc-001",
        itemCode: "ACC-FLP-001",
        itemName: "Floor Mat Set (Universal)",
        itemType: "accessories",
        description: "Heavy-duty rubber floor mat set for light commercial vehicles.",
        stockQuantity: 14,
        quantityRequested: 3,
        quantityApproved: null,
        toStore: "Accra Central Store — Ringway Estates",
        supplier: "AutoGuard",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-15T10:05:00.000Z", "Kudjo Alorwu", "Need extra jump starters for Accra roadside team."),
    ],
  },
  {
    id: "ist-acc-005",
    transferNumber: "IST-ACC-2026-005",
    kind: "accessories",
    itemId: "acc-002",
    itemCode: "ACC-WIP-014",
    itemName: "Wiper Blade Pair 22\"",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tema Fleet Store — Community 12",
    requestedBy: "Efua Darko",
    approvedBy: "Kojo Asante",
    dispatchedBy: "Efua Darko",
    dispatcher: "Nana Osei",
    arrivedBy: "Yaw Mensah",
    status: "ARRIVED",
    createdAt: "2026-08-05T08:30:00.000Z",
    approvedAt: "2026-08-05T11:15:00.000Z",
    dispatchedAt: "2026-08-06T07:40:00.000Z",
    arrivedAt: "2026-08-07T15:20:00.000Z",
    notes: "Rainy-season wiper restock held pending bin space.",
    lines: [
      seedLine({
        itemId: "acc-002",
        itemCode: "ACC-WIP-014",
        itemName: "Wiper Blade Pair 22\"",
        itemType: "accessories",
        description: "All-season wiper blades for sedan and SUV fleet.",
        stockQuantity: 5,
        quantityRequested: 4,
        quantityApproved: 4,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Bosch",
      }),
      seedLine({
        itemId: "acc-004",
        itemCode: "ACC-TRI-021",
        itemName: "Warning Triangle Kit",
        itemType: "accessories",
        description: "Reflective warning triangle with carrying case.",
        stockQuantity: 12,
        quantityRequested: 3,
        quantityApproved: 2,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "RoadSafe",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-05T08:30:00.000Z", "Efua Darko", "Rainy-season wiper restock."),
      historyEvent("approved", "2026-08-05T11:15:00.000Z", "Kojo Asante"),
      historyEvent("dispatched", "2026-08-06T07:40:00.000Z", "Efua Darko", "Sent with morning shuttle."),
      historyEvent("arrived", "2026-08-07T15:20:00.000Z", "Yaw Mensah", "Held at destination pending bin space."),
    ],
  },
  {
    id: "ist-acc-006",
    transferNumber: "IST-ACC-2026-006",
    kind: "accessories",
    itemId: "acc-003",
    itemCode: "ACC-FIR-008",
    itemName: "Fire Extinguisher 2kg",
    fromStore: "Tema Fleet Store — Community 12",
    toStore: "Accra Central Store — Ringway Estates",
    requestedBy: "Ruth Ofori",
    rejectedBy: "Kwesi Mensah",
    dispatcher: "Kwame Frimpong",
    status: "REJECTED",
    createdAt: "2026-08-02T09:00:00.000Z",
    rejectedAt: "2026-08-02T14:20:00.000Z",
    rejectionReason: "Sending store is out of stock until the replenishment PO arrives.",
    notes: "Cover Accra safety audit shortfall.",
    lines: [
      seedLine({
        itemId: "acc-003",
        itemCode: "ACC-FIR-008",
        itemName: "Fire Extinguisher 2kg",
        itemType: "accessories",
        description: "Vehicle-mounted ABC dry powder extinguisher.",
        stockQuantity: 0,
        quantityRequested: 6,
        quantityApproved: null,
        toStore: "Accra Central Store — Ringway Estates",
        supplier: "SafeFleet",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-02T09:00:00.000Z", "Ruth Ofori", "Cover Accra safety audit shortfall."),
      historyEvent("rejected", "2026-08-02T14:20:00.000Z", "Kwesi Mensah", "Sending store is out of stock until the replenishment PO arrives."),
    ],
  },
  {
    id: "ist-acc-007",
    transferNumber: "IST-ACC-2026-007",
    kind: "accessories",
    itemId: "acc-001",
    itemCode: "ACC-FLP-001",
    itemName: "Floor Mat Set (Universal)",
    fromStore: "Kumasi Regional Store — Asokwa",
    toStore: "Accra Central Store — Ringway Estates",
    requestedBy: "Yaw Mensah",
    cancelledBy: "Yaw Mensah",
    dispatcher: "Akosua Dede",
    status: "CANCELLED",
    createdAt: "2026-08-01T11:40:00.000Z",
    cancelledAt: "2026-08-01T16:10:00.000Z",
    cancelReason: "Destination already received a direct supply.",
    notes: "Balance overflow mats back to primary shelf.",
    lines: [
      seedLine({
        itemId: "acc-001",
        itemCode: "ACC-FLP-001",
        itemName: "Floor Mat Set (Universal)",
        itemType: "accessories",
        description: "Heavy-duty rubber floor mat set for light commercial vehicles.",
        stockQuantity: 10,
        quantityRequested: 5,
        quantityApproved: null,
        toStore: "Accra Central Store — Ringway Estates",
        supplier: "AutoGuard",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-01T11:40:00.000Z", "Yaw Mensah", "Balance overflow mats back to primary shelf."),
      historyEvent("cancelled", "2026-08-01T16:10:00.000Z", "Yaw Mensah", "Destination already received a direct supply."),
    ],
  },
  {
    id: "ist-vp-001",
    transferNumber: "IST-VP-2026-001",
    kind: "vehicle_parts",
    itemId: "vp-002",
    itemCode: "VP-OFL-DIE-01",
    itemName: "Engine Oil Filter",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tema Fleet Store — Community 12",
    requestedBy: "Michael Addo",
    approvedBy: "Nii Quaye",
    dispatcher: "Efua Darko",
    status: "PENDING",
    createdAt: "2026-08-12T08:40:00.000Z",
    approvedAt: "2026-08-12T15:20:00.000Z",
    notes: "Support Urvan shuttle service bay in Tema.",
    lines: [
      seedLine({
        itemId: "vp-002",
        itemCode: "VP-OFL-DIE-01",
        itemName: "Engine Oil Filter",
        itemType: "vehicle_parts",
        description: "Engine>Fuel>Oil filter",
        stockQuantity: 5,
        quantityRequested: 6,
        quantityApproved: 5,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Mann-Filter",
      }),
      seedLine({
        itemId: "vp-004",
        itemCode: "VP-RAD-ISZ-08",
        itemName: "Radiator Hose",
        itemType: "vehicle_parts",
        description: "Engine>Cooling>Hoses",
        stockQuantity: 4,
        quantityRequested: 3,
        quantityApproved: 2,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "Gates",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-12T08:40:00.000Z", "Michael Addo", "Support Urvan shuttle service bay in Tema."),
      historyEvent("approved", "2026-08-12T15:20:00.000Z", "Nii Quaye", "Approved available stock only."),
    ],
  },
  {
    id: "ist-vp-002",
    transferNumber: "IST-VP-2026-002",
    kind: "vehicle_parts",
    itemId: "vp-001",
    itemCode: "VP-BP-HLX-F",
    itemName: "Front Brake Pad Set",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Takoradi Regional Store — Effia",
    requestedBy: "Selorm Gbeho",
    rejectedBy: "Kwesi Mensah",
    dispatcher: "Esi Nyarko",
    status: "REJECTED",
    createdAt: "2026-07-18T16:25:00.000Z",
    rejectedAt: "2026-07-19T09:10:00.000Z",
    rejectionReason: "Insufficient Accra stock for this transfer.",
    notes: "Cover Takoradi brake jobs this week.",
    lines: [
      seedLine({
        itemId: "vp-001",
        itemCode: "VP-BP-HLX-F",
        itemName: "Front Brake Pad Set",
        itemType: "vehicle_parts",
        description: "Body & Exterior>Brakes>Front pads",
        stockQuantity: 8,
        quantityRequested: 4,
        quantityApproved: null,
        toStore: "Takoradi Regional Store — Effia",
        supplier: "Akebono",
      }),
    ],
    history: [
      historyEvent("requested", "2026-07-18T16:25:00.000Z", "Selorm Gbeho", "Cover Takoradi brake jobs this week."),
      historyEvent("rejected", "2026-07-19T09:10:00.000Z", "Kwesi Mensah", "Insufficient Accra stock for this transfer."),
    ],
  },
  {
    id: "ist-vp-003",
    transferNumber: "IST-VP-2026-003",
    kind: "vehicle_parts",
    itemId: "vp-003",
    itemCode: "VP-ALT-SPR-12",
    itemName: "Alternator Assembly",
    fromStore: "Kumasi Regional Store — Asokwa",
    toStore: "Tamale Regional Store — Industrial Area",
    requestedBy: "Esi Nyarko",
    approvedBy: "Kojo Asante",
    dispatchedBy: "Esi Nyarko",
    dispatcher: "Adjei Boateng",
    status: "IN_TRANSIT",
    createdAt: "2026-08-09T07:50:00.000Z",
    approvedAt: "2026-08-09T10:05:00.000Z",
    dispatchedAt: "2026-08-09T13:20:00.000Z",
    notes: "Northern region electrical kit restock.",
    lines: [
      seedLine({
        itemId: "vp-003",
        itemCode: "VP-ALT-SPR-12",
        itemName: "Alternator Assembly",
        itemType: "vehicle_parts",
        description: "Electrical>Charging>Alternator",
        stockQuantity: 1,
        quantityRequested: 1,
        quantityApproved: 1,
        toStore: "Tamale Regional Store — Industrial Area",
        supplier: "Bosch",
      }),
      seedLine({
        itemId: "vp-005",
        itemCode: "VP-CVJ-FRD-21",
        itemName: "CV Joint",
        itemType: "vehicle_parts",
        description: "Body & Exterior>Suspension>CV joint",
        stockQuantity: 2,
        quantityRequested: 2,
        quantityApproved: 2,
        toStore: "Tamale Regional Store — Industrial Area",
        supplier: "GKN",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-09T07:50:00.000Z", "Esi Nyarko", "Northern region electrical kit restock."),
      historyEvent("approved", "2026-08-09T10:05:00.000Z", "Kojo Asante"),
      historyEvent("dispatched", "2026-08-09T13:20:00.000Z", "Esi Nyarko", "Loaded onto Tamale overnight truck."),
    ],
  },
  {
    id: "ist-vp-004",
    transferNumber: "IST-VP-2026-004",
    kind: "vehicle_parts",
    itemId: "vp-001",
    itemCode: "VP-BP-HLX-F",
    itemName: "Front Brake Pad Set",
    fromStore: "Tema Fleet Store — Community 12",
    toStore: "Kumasi Regional Store — Asokwa",
    requestedBy: "Kwesi Mensah",
    dispatcher: "Kofi Ansah",
    status: "PENDING_APPROVAL",
    createdAt: "2026-08-16T09:15:00.000Z",
    notes: "Kumasi depot needs brake and tyre cover for Hilux pool.",
    lines: [
      seedLine({
        itemId: "vp-001",
        itemCode: "VP-BP-HLX-F",
        itemName: "Front Brake Pad Set",
        itemType: "vehicle_parts",
        description: "Body & Exterior>Brakes>Front pads",
        stockQuantity: 5,
        quantityRequested: 3,
        quantityApproved: null,
        toStore: "Kumasi Regional Store — Asokwa",
        supplier: "Akebono",
      }),
      seedLine({
        itemId: "vp-006",
        itemCode: "VP-TYR-AT-265",
        itemName: "All-Terrain Tyre",
        itemType: "vehicle_parts",
        description: "Wheels>Tyres>All-terrain",
        stockQuantity: 4,
        quantityRequested: 4,
        quantityApproved: null,
        toStore: "Kumasi Regional Store — Asokwa",
        supplier: "BFGoodrich",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-16T09:15:00.000Z", "Kwesi Mensah", "Kumasi depot needs brake and tyre cover for Hilux pool."),
    ],
  },
  {
    id: "ist-vp-005",
    transferNumber: "IST-VP-2026-005",
    kind: "vehicle_parts",
    itemId: "vp-004",
    itemCode: "VP-RAD-ISZ-08",
    itemName: "Radiator Hose",
    fromStore: "Tema Fleet Store — Community 12",
    toStore: "Takoradi Regional Store — Effia",
    requestedBy: "Selorm Gbeho",
    approvedBy: "Ama Serwaa",
    dispatchedBy: "Michael Addo",
    dispatcher: "Kwame Frimpong",
    arrivedBy: "Fiifi Bentum",
    status: "ARRIVED",
    createdAt: "2026-08-04T12:00:00.000Z",
    approvedAt: "2026-08-04T15:45:00.000Z",
    dispatchedAt: "2026-08-05T06:30:00.000Z",
    arrivedAt: "2026-08-06T11:10:00.000Z",
    notes: "Cooling parts held until Takoradi bay is cleared.",
    lines: [
      seedLine({
        itemId: "vp-004",
        itemCode: "VP-RAD-ISZ-08",
        itemName: "Radiator Hose",
        itemType: "vehicle_parts",
        description: "Engine>Cooling>Hoses",
        stockQuantity: 3,
        quantityRequested: 3,
        quantityApproved: 3,
        toStore: "Takoradi Regional Store — Effia",
        supplier: "Gates",
      }),
      seedLine({
        itemId: "vp-002",
        itemCode: "VP-OFL-DIE-01",
        itemName: "Engine Oil Filter",
        itemType: "vehicle_parts",
        description: "Engine>Fuel>Oil filter",
        stockQuantity: 2,
        quantityRequested: 4,
        quantityApproved: 2,
        toStore: "Takoradi Regional Store — Effia",
        supplier: "Mann-Filter",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-04T12:00:00.000Z", "Selorm Gbeho", "Cooling parts for Takoradi D-Max jobs."),
      historyEvent("approved", "2026-08-04T15:45:00.000Z", "Ama Serwaa"),
      historyEvent("dispatched", "2026-08-05T06:30:00.000Z", "Michael Addo", "Sent with western region courier."),
      historyEvent("arrived", "2026-08-06T11:10:00.000Z", "Fiifi Bentum", "Held until Takoradi bay is cleared."),
    ],
  },
  {
    id: "ist-vp-006",
    transferNumber: "IST-VP-2026-006",
    kind: "vehicle_parts",
    itemId: "vp-005",
    itemCode: "VP-CVJ-FRD-21",
    itemName: "CV Joint",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tema Fleet Store — Community 12",
    requestedBy: "Michael Addo",
    approvedBy: "Kojo Asante",
    dispatchedBy: "Kwesi Mensah",
    dispatcher: "Efua Darko",
    receivedBy: "Ama Serwaa",
    status: "COMPLETED",
    createdAt: "2026-07-25T09:00:00.000Z",
    approvedAt: "2026-07-25T11:30:00.000Z",
    dispatchedAt: "2026-07-25T14:00:00.000Z",
    arrivedAt: "2026-07-26T08:20:00.000Z",
    receivedAt: "2026-07-26T09:45:00.000Z",
    notes: "Balance driveline stock to Tema.",
    lines: [
      seedLine({
        itemId: "vp-005",
        itemCode: "VP-CVJ-FRD-21",
        itemName: "CV Joint",
        itemType: "vehicle_parts",
        description: "Body & Exterior>Suspension>CV joint",
        stockQuantity: 3,
        quantityRequested: 2,
        quantityApproved: 2,
        toStore: "Tema Fleet Store — Community 12",
        supplier: "GKN",
      }),
    ],
    history: [
      historyEvent("requested", "2026-07-25T09:00:00.000Z", "Michael Addo", "Balance driveline stock to Tema."),
      historyEvent("approved", "2026-07-25T11:30:00.000Z", "Kojo Asante"),
      historyEvent("dispatched", "2026-07-25T14:00:00.000Z", "Kwesi Mensah", "Internal store run."),
      historyEvent("arrived", "2026-07-26T08:20:00.000Z", "Ama Serwaa", "Accepted into store."),
      historyEvent("received", "2026-07-26T09:45:00.000Z", "Ama Serwaa", "Booked into Tema driveline rack."),
    ],
  },
  {
    id: "ist-vp-007",
    transferNumber: "IST-VP-2026-007",
    kind: "vehicle_parts",
    itemId: "vp-006",
    itemCode: "VP-TYR-AT-265",
    itemName: "All-Terrain Tyre",
    fromStore: "Accra Central Store — Ringway Estates",
    toStore: "Tamale Regional Store — Industrial Area",
    requestedBy: "Esi Nyarko",
    cancelledBy: "Esi Nyarko",
    dispatcher: "Nana Osei",
    status: "CANCELLED",
    createdAt: "2026-08-03T13:20:00.000Z",
    cancelledAt: "2026-08-03T17:00:00.000Z",
    cancelReason: "Tamale sourced tyres locally.",
    notes: "Land Cruiser tyre cover for northern patrols.",
    lines: [
      seedLine({
        itemId: "vp-006",
        itemCode: "VP-TYR-AT-265",
        itemName: "All-Terrain Tyre",
        itemType: "vehicle_parts",
        description: "Wheels>Tyres>All-terrain",
        stockQuantity: 6,
        quantityRequested: 4,
        quantityApproved: null,
        toStore: "Tamale Regional Store — Industrial Area",
        supplier: "BFGoodrich",
      }),
    ],
    history: [
      historyEvent("requested", "2026-08-03T13:20:00.000Z", "Esi Nyarko", "Land Cruiser tyre cover for northern patrols."),
      historyEvent("cancelled", "2026-08-03T17:00:00.000Z", "Esi Nyarko", "Tamale sourced tyres locally."),
    ],
  },
];

let sessionTransfers = SEED_TRANSFERS.map((row) => ({
  ...row,
  history: (row.history ?? []).map((event) => ({ ...event })),
}));

export function formatInterStoreTransferStatus(status) {
  return (
    INTER_STORE_TRANSFER_STATUS_OPTIONS.find((option) => option.value === status)?.label
    ?? (status ?? "—").toString().replace(/_/g, " ")
  );
}

export function formatInterStoreTransferDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function formatInterStoreTransferDateTime(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
    hour: "2-digit",
    minute: "2-digit",
  });
}

function normalizeLine(line = {}, fallback = {}) {
  const quantityRequested = Number(line.quantityRequested ?? line.movingQuantity ?? fallback.quantity) || 0;
  const quantityApproved = line.quantityApproved == null
    ? null
    : Number(line.quantityApproved);
  return {
    itemId: line.itemId || fallback.itemId || "",
    itemCode: line.itemCode || fallback.itemCode || "",
    itemName: line.itemName || fallback.itemName || "",
    itemType: line.itemType || (fallback.kind === "vehicle_parts" ? "vehicle_parts" : "accessories"),
    description: line.description || fallback.itemName || "",
    stockQuantity: Number(line.stockQuantity ?? fallback.quantity) || 0,
    quantityRequested,
    quantityApproved,
    movingQuantity: Number(line.movingQuantity ?? quantityApproved ?? quantityRequested) || 0,
    toStore: line.toStore || fallback.toStore || "",
    supplier: line.supplier || fallback.supplier || "—",
  };
}

function resolveDispatcherContact(name) {
  const receiver = getReceiverByName(name);
  if (receiver) {
    return {
      name: receiver.name,
      email: receiver.email || "",
      phone: receiver.phone || "",
      store: receiver.store || "",
    };
  }
  return getUserContact(name);
}

function withDispatcherFields(row) {
  const contact = resolveDispatcherContact(row?.dispatcher);
  return {
    dispatcher: contact.name,
    dispatcherEmail: contact.email,
    dispatcherPhone: contact.phone,
    dispatcherStore: contact.store,
  };
}

function normalizeTransfer(row) {
  if (!row) return null;
  const lines = Array.isArray(row.lines) && row.lines.length
    ? row.lines.map((line) => normalizeLine(line, row))
    : row.itemCode
      ? [normalizeLine({}, row)]
      : [];
  const quantity = lines.reduce(
    (sum, line) => sum + (Number(line.quantityApproved ?? line.movingQuantity ?? line.quantityRequested) || 0),
    0,
  ) || row.quantity;
  const toStores = [...new Set(lines.map((line) => line.toStore).filter(Boolean))];
  return {
    ...row,
    ...withDispatcherFields(row),
    lines,
    quantity,
    toStore: toStores.length === 1 ? toStores[0] : row.toStore,
    toStoreLabel: toStores.length > 1 ? "Multiple stores" : (toStores[0] || row.toStore || "—"),
    itemCount: lines.length,
    history: (row.history ?? []).map((event) => ({ ...event })),
  };
}

export function getInterStoreTransfers() {
  return sessionTransfers.map((row) => normalizeTransfer(row));
}

export function getInterStoreTransferById(id) {
  const row = sessionTransfers.find((item) => item.id === id);
  return normalizeTransfer(row);
}

function createUniqueId(prefix) {
  return `${prefix}-${Date.now()}-${Math.random().toString(36).slice(2, 8)}`;
}

function nextTransferNumber(kind) {
  const prefix = kind === "vehicle_parts" ? "IST-VP" : kind === "mixed" ? "IST" : "IST-ACC";
  const year = new Date().getFullYear();
  const pattern = new RegExp(`^${prefix}-${year}-(\\d+)$`);
  let max = 0;
  for (const row of sessionTransfers) {
    const match = String(row.transferNumber || "").match(pattern);
    if (match) max = Math.max(max, Number(match[1]));
  }
  return `${prefix}-${year}-${String(max + 1).padStart(3, "0")}`;
}

function replaceTransfer(updated) {
  const index = sessionTransfers.findIndex((row) => row.id === updated.id);
  if (index < 0) throw new Error("Transfer not found.");
  sessionTransfers = [
    ...sessionTransfers.slice(0, index),
    updated,
    ...sessionTransfers.slice(index + 1),
  ];
  return getInterStoreTransferById(updated.id);
}

function appendHistory(row, action, by, note = "", at = new Date().toISOString()) {
  return {
    ...row,
    history: [...(row.history ?? []), historyEvent(action, at, by, note)],
  };
}

export function createInterStoreTransfer(payload = {}) {
  const fromStore = String(payload.fromStore || "").trim();
  const rawLines = Array.isArray(payload.lines) ? payload.lines : [];
  if (!fromStore) throw new Error("Select the sending store.");
  if (!rawLines.length) throw new Error("Select at least one item to transfer.");

  const lines = rawLines.map((line, index) => {
    const movingQuantity = Number(line.movingQuantity ?? line.quantity);
    const toStore = String(line.toStore || "").trim();
    const stockQuantity = Number(line.stockQuantity) || 0;
    const itemCode = String(line.itemCode || "").trim();
    if (!itemCode) throw new Error(`Line ${index + 1} is missing an item code.`);
    if (!toStore) throw new Error(`Select a destination store for ${itemCode}.`);
    if (toStore === fromStore) {
      throw new Error(`${itemCode}: destination must be different from the sending store.`);
    }
    if (!movingQuantity || movingQuantity <= 0) {
      throw new Error(`Enter a moving quantity for ${itemCode}.`);
    }
    if (stockQuantity > 0 && movingQuantity > stockQuantity) {
      throw new Error(`${itemCode}: moving quantity cannot exceed stock (${stockQuantity}).`);
    }
    const itemType = line.itemType === "vehicle_parts" ? "vehicle_parts" : "accessories";
    return {
      itemId: line.itemId || "",
      itemCode,
      itemName: String(line.itemName || itemCode).trim(),
      itemType,
      description: String(line.description || line.itemName || "").trim(),
      stockQuantity,
      quantityRequested: movingQuantity,
      quantityApproved: null,
      movingQuantity,
      toStore,
      supplier: String(line.supplier || "").trim() || "—",
    };
  });

  const kinds = [...new Set(lines.map((line) => line.itemType))];
  const kind = kinds.length === 1 ? kinds[0] : "mixed";
  const first = lines[0];
  const quantity = lines.reduce((sum, line) => sum + line.movingQuantity, 0);
  const toStores = [...new Set(lines.map((line) => line.toStore))];

  const now = new Date().toISOString();
  const requestedBy = payload.requestedBy?.trim() || INTER_STORE_TRANSFER_ACTOR;
  const notes = payload.notes?.trim() || "";
  const dispatcher = payload.dispatcher?.trim() || "";
  const dispatcherContact = resolveDispatcherContact(dispatcher);
  const created = {
    id: createUniqueId(kind === "vehicle_parts" ? "ist-vp" : kind === "mixed" ? "ist" : "ist-acc"),
    transferNumber: nextTransferNumber(kind),
    kind,
    itemId: first.itemId,
    itemCode: first.itemCode,
    itemName: first.itemName,
    quantity,
    fromStore,
    toStore: toStores.length === 1 ? toStores[0] : toStores.join(" · "),
    lines,
    requestedBy,
    dispatcher: dispatcherContact.name,
    dispatcherEmail: dispatcherContact.email,
    dispatcherPhone: dispatcherContact.phone,
    dispatcherStore: dispatcherContact.store,
    status: "PENDING_APPROVAL",
    createdAt: now,
    notes,
    history: [historyEvent("requested", now, requestedBy, notes)],
  };
  sessionTransfers = [created, ...sessionTransfers];
  return getInterStoreTransferById(created.id);
}

export function applyInterStoreTransferApprovalDecision(transferId, {
  approved = false,
  reason = "",
  by = INTER_STORE_TRANSFER_ACTOR,
} = {}) {
  const row = sessionTransfers.find((item) => item.id === transferId);
  if (!row) return null;
  if (row.status !== "PENDING_APPROVAL") {
    return getInterStoreTransferById(row.id);
  }
  const now = new Date().toISOString();
  const actor = by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  if (approved) {
    const approvedLines = (row.lines || []).map((line) => {
      const quantityApproved = Number(line.quantityApproved ?? line.movingQuantity ?? line.quantityRequested) || 0;
      return {
        ...line,
        quantityApproved,
        movingQuantity: quantityApproved,
      };
    });
    return replaceTransfer(
      appendHistory(
        {
          ...row,
          lines: approvedLines,
          status: "PENDING",
          approvedAt: now,
          approvedBy: actor,
        },
        "approved",
        actor,
        "",
        now,
      ),
    );
  }
  const note = String(reason || "").trim();
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "REJECTED",
        rejectionReason: note,
      },
      "rejected",
      actor,
      note,
      now,
    ),
  );
}

export function dispatchInterStoreTransfer(id, payload = {}) {
  const row = sessionTransfers.find((item) => item.id === id);
  if (!row) throw new Error("Transfer not found.");
  if (row.status !== "PENDING") {
    throw new Error("Only approved transfers can be dispatched.");
  }
  const now = new Date().toISOString();
  const by = payload.by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  const dispatcher = payload.dispatcher?.trim() || row.dispatcher || "";
  const dispatcherContact = resolveDispatcherContact(dispatcher);
  const note = String(payload.note || "").trim();
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "IN_TRANSIT",
        dispatchedAt: now,
        dispatchedBy: by,
        dispatcher: dispatcherContact.name,
        dispatcherEmail: dispatcherContact.email,
        dispatcherPhone: dispatcherContact.phone,
        dispatcherStore: dispatcherContact.store,
      },
      "dispatched",
      by,
      note || `Dispatched by ${dispatcher || by}`,
      now,
    ),
  );
}

export function markInterStoreTransferArrived(id, payload = {}) {
  const row = sessionTransfers.find((item) => item.id === id);
  if (!row) throw new Error("Transfer not found.");
  if (row.status !== "IN_TRANSIT") {
    throw new Error("Only in-transit transfers can be marked as arrived.");
  }
  const now = new Date().toISOString();
  const by = payload.by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  const note = payload.note?.trim() || "";
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "ARRIVED",
        arrivedAt: now,
        arrivedBy: by,
      },
      "arrived",
      by,
      note,
      now,
    ),
  );
}

export function receiveInterStoreTransfer(id, payload = {}) {
  const row = sessionTransfers.find((item) => item.id === id);
  if (!row) throw new Error("Transfer not found.");
  if (row.status !== "ARRIVED") {
    throw new Error("Only arrived transfers can be received into store.");
  }
  const now = new Date().toISOString();
  const by = payload.by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  const note = payload.note?.trim() || "";
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "COMPLETED",
        receivedAt: now,
        receivedBy: by,
      },
      "received",
      by,
      note,
      now,
    ),
  );
}

export function rejectInterStoreTransfer(id, payload = {}) {
  const row = sessionTransfers.find((item) => item.id === id);
  if (!row) throw new Error("Transfer not found.");
  if (row.status !== "PENDING") {
    throw new Error("Only pending transfers can be rejected.");
  }
  const reason = String(payload.reason || "").trim();
  if (!reason) throw new Error("Add a rejection reason.");
  const now = new Date().toISOString();
  const by = payload.by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "REJECTED",
        rejectedAt: now,
        rejectedBy: by,
        rejectionReason: reason,
      },
      "rejected",
      by,
      reason,
      now,
    ),
  );
}

export function cancelInterStoreTransfer(id, payload = {}) {
  const row = sessionTransfers.find((item) => item.id === id);
  if (!row) throw new Error("Transfer not found.");
  if (row.status !== "PENDING_APPROVAL") {
    throw new Error("Only transfers pending approval can be cancelled.");
  }
  const now = new Date().toISOString();
  const by = payload.by?.trim() || INTER_STORE_TRANSFER_ACTOR;
  const note = payload.note?.trim() || "Cancelled before dispatch.";
  return replaceTransfer(
    appendHistory(
      {
        ...row,
        status: "CANCELLED",
        cancelledAt: now,
        cancelledBy: by,
        cancelReason: note,
      },
      "cancelled",
      by,
      note,
      now,
    ),
  );
}

export function formatInterStoreTransferHistoryAction(action) {
  switch (action) {
    case "requested":
      return "Requested";
    case "approved":
      return "Approved";
    case "dispatched":
      return "Dispatched";
    case "arrived":
      return "Arrived";
    case "received":
      return "Received";
    case "rejected":
      return "Rejected";
    case "cancelled":
      return "Cancelled";
    default:
      return (action ?? "—").toString().replace(/_/g, " ");
  }
}
