/** Stores requisitions — accessories and vehicle parts supply requests. */

import { generateAccessoryItemCode, getAccessories } from "./accessories";
import { getStoreLocationOptions } from "../org/stores";

export { getStoreLocationOptions };

export const REQUISITION_STATUS_OPTIONS = [
  { value: "ALL", label: "All" },
  { value: "PENDING_SUPPLY_REQUEST", label: "Pending supply request" },
  { value: "PENDING_SUPPLY_APPROVAL", label: "Pending supply approval" },
  { value: "PENDING_ISSUANCE", label: "Pending issuance" },
  { value: "SUPPLIED", label: "Supplied" },
  { value: "PARTIAL_SUPPLIED", label: "Partial supplied" },
  { value: "REJECTED", label: "Rejected" },
];

export const REQUISITION_KIND_TABS = [
  { id: "accessories", label: "Accessories" },
];

export const PENDING_REQUISITION_STATUSES = [
  "PENDING_SUPPLY_REQUEST",
  "PENDING_SUPPLY_APPROVAL",
  "PENDING_ISSUANCE",
];

/** @deprecated Prefer getStoreLocationOptions() so new stores from Setups appear. */
export const STORE_LOCATION_OPTIONS = [
  "Accra Central Store — Ringway Estates",
  "Tema Fleet Store — Community 12",
  "Kumasi Regional Store — Asokwa",
  "Takoradi Regional Store — Effia",
  "Tamale Regional Store — Industrial Area",
];

export const MOCK_ISSUE_OTP = "111111";

export const RECEIVER_OPTIONS = [
  "Kwesi Mensah",
  "Ama Serwaa",
  "Esi Nyarko",
  "Kojo Owusu",
  "Michael Addo",
  "Selorm Gbeho",
  "Fiifi Bentum",
  "Ebo Lamptey",
  "Nii Armah Quaye",
];

export function formatRequisitionStatus(status) {
  return (
    REQUISITION_STATUS_OPTIONS.find((option) => option.value === status)?.label
    ?? (status ?? "—").toString().replace(/_/g, " ")
  );
}

export function formatRequisitionDate(value) {
  if (!value) return "—";
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) return "—";
  return date.toLocaleDateString("en-GB", {
    day: "2-digit",
    month: "short",
    year: "numeric",
  });
}

export function getRequestedQuantity(row) {
  return Number(row?.quantityRequested ?? row?.quantity ?? 0) || 0;
}

export function getRequisitionRemainingQuantity(row) {
  if (!row || row.remainingRejected) return 0;
  if (row.quantityRemaining != null && row.quantityRemaining !== "") {
    return Math.max(0, Number(row.quantityRemaining) || 0);
  }
  return Math.max(0, getRequestedQuantity(row) - Number(row.quantitySupplied || 0));
}

export function getNormalizedStoreAllocations(row) {
  if (!row) return [];
  if (Array.isArray(row.storeAllocations) && row.storeAllocations.length) {
    return row.storeAllocations
      .filter((item) => item?.location)
      .map((item) => ({
        location: item.location,
        quantity: Number(item.quantity) || 0,
        quantityIssued: Number(item.quantityIssued) || 0,
      }));
  }
  const stores = Array.isArray(row.storeLocations) && row.storeLocations.length
    ? row.storeLocations
    : row.storeLocation
      ? String(row.storeLocation).split("·").map((loc) => loc.trim()).filter(Boolean)
      : [];
  if (stores.length === 1) {
    const quantity = getRequestedQuantity(row);
    return [{
      location: stores[0],
      quantity,
      quantityIssued: Number(row.quantitySupplied) || 0,
    }];
  }
  return stores.map((location) => ({
    location,
    quantity: 0,
    quantityIssued: 0,
  }));
}

export function getStoreRemainingQuantity(row, location) {
  if (!row || !location) return 0;
  const allocation = getNormalizedStoreAllocations(row).find((item) => item.location === location);
  if (!allocation) return 0;
  if (allocation.quantity > 0) {
    return Math.max(0, allocation.quantity - allocation.quantityIssued);
  }
  return getRequisitionRemainingQuantity(row);
}

export function getStoresWithRemaining(row) {
  const allocations = getNormalizedStoreAllocations(row);
  if (!allocations.length) return [];
  const withRemaining = allocations
    .filter((item) => getStoreRemainingQuantity(row, item.location) > 0)
    .map((item) => item.location);
  return withRemaining;
}

export function isRequisitionIssuable(row) {
  if (!row) return false;
  const status = row.status === "PENDING_BATCH_ISSUANCE" ? "PENDING_ISSUANCE" : row.status;
  if (status === "PENDING_ISSUANCE") return true;
  return status === "PARTIAL_SUPPLIED" && getRequisitionRemainingQuantity(row) > 0;
}

let issuanceBatchSeq = 1;

export function createIssuanceBatchId() {
  const day = new Date().toISOString().slice(0, 10).replace(/-/g, "");
  const n = String(issuanceBatchSeq).padStart(3, "0");
  issuanceBatchSeq += 1;
  return `ISS-${day}-${n}`;
}

export function buildComponentPath(levels = {}) {
  return [
    levels.level1,
    levels.level2,
    levels.level3,
    levels.level4,
    levels.level5,
    levels.level6,
  ]
    .filter(Boolean)
    .join(" > ");
}

const SEED_REQUISITIONS = [
  // ── Accessories: pending supply request ──
  {
    id: "req-acc-001",
    requestNumber: "REQ-ACC-2026-014",
    kind: "accessories",
    itemId: "acc-001",
    itemCode: "ACC-FLP-001",
    itemName: "Floor Mat Set (Universal)",
    brand: "AutoGuard",
    description: "Heavy-duty rubber floor mat set for light commercial vehicles.",
    quantity: 4,
    quantityRequested: 4,
    actualQuantity: 4,
    isOther: false,
    requestedBy: "Kwesi Mensah",
    status: "PENDING_SUPPLY_APPROVAL",
    createdAt: "2026-07-22T09:10:00.000Z",
    raisedBy: "Current Store Keeper",
    raisedAt: "2026-07-22T11:30:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocations: [
      "Accra Central Store — Ringway Estates",
      "Tema Fleet Store — Community 12",
    ],
    storeAllocations: [
      { location: "Accra Central Store — Ringway Estates", quantity: 2 },
      { location: "Tema Fleet Store — Community 12", quantity: 2 },
    ],
    storeLocation: "Accra Central Store — Ringway Estates · Tema Fleet Store — Community 12",
    comment: "Mats available across Accra and Tema. Can fulfill full requested qty.",
    approvalComment: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-007",
    requestNumber: "REQ-ACC-2026-018",
    kind: "accessories",
    itemId: "acc-006",
    itemCode: "ACC-JAR-009",
    itemName: "Jump Starter Pack",
    brand: "NOCO",
    description: "Portable lithium jump starter for roadside assist.",
    quantity: 2,
    quantityRequested: 2,
    isOther: false,
    requestedBy: "Fiifi Bentum",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-25T08:20:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-008",
    requestNumber: "REQ-ACC-2026-019",
    kind: "accessories",
    itemId: "acc-007",
    itemCode: "ACC-MNT-041",
    itemName: "Magnetic phone mount (dashboard)",
    brand: "AutoGuard",
    description: "Other request — strong magnet mount for courier vans.",
    quantity: 8,
    quantityRequested: 8,
    actualQuantity: 8,
    isOther: false,
    requestedBy: "Nii Armah Quaye",
    status: "PENDING_SUPPLY_APPROVAL",
    createdAt: "2026-07-26T10:05:00.000Z",
    raisedBy: "Current Store Keeper",
    raisedAt: "2026-07-26T12:20:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocations: [
      "Accra Central Store — Ringway Estates",
      "Tema Fleet Store — Community 12",
    ],
    storeAllocations: [
      { location: "Accra Central Store — Ringway Estates", quantity: 5 },
      { location: "Tema Fleet Store — Community 12", quantity: 3 },
    ],
    storeLocation: "Accra Central Store — Ringway Estates · Tema Fleet Store — Community 12",
    comment: "Courier van mounts split between Accra and Tema.",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Accessories: pending supply request (other / custom) ──
  {
    id: "req-acc-002",
    requestNumber: "REQ-ACC-2026-015",
    kind: "accessories",
    itemId: "acc-008",
    itemCode: "ACC-FRS-034",
    itemName: "Cabin air freshener pack",
    brand: "SafeFleet",
    description: "Custom request for executive pool vehicles.",
    quantity: 12,
    quantityRequested: 12,
    isOther: false,
    requestedBy: "Ama Serwaa",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-21T14:20:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    comment: "Draft submitted for executive pool restock.",
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-009",
    requestNumber: "REQ-ACC-2026-020",
    kind: "accessories",
    itemId: "acc-002",
    itemCode: "ACC-WIP-014",
    itemName: "Wiper Blade Pair 22\"",
    brand: "Bosch",
    description: "Spare wiper set for rainy-season rotation.",
    quantity: 10,
    quantityRequested: 10,
    isOther: false,
    requestedBy: "Ebo Lamptey",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-24T11:40:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    comment: "Ready for rainy-season allocation.",
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Accessories: pending issuance (several for batch OTP testing) ──
  {
    id: "req-acc-005",
    requestNumber: "REQ-ACC-2026-017",
    kind: "accessories",
    itemId: "acc-005",
    itemCode: "ACC-CHG-033",
    itemName: "USB Dual Car Charger",
    brand: "Anker",
    description: "36W dual-port USB car charger for field tablets.",
    quantity: 3,
    isOther: false,
    requestedBy: "Esi Nyarko",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-19T12:15:00.000Z",
    approvedBy: "Kojo Asante",
    approvalDate: "2026-07-20T09:00:00.000Z",
    quantityRequested: 3,
    actualQuantity: 3,
    storeLocations: ["Accra Central Store — Ringway Estates"],
    storeAllocations: [
      { location: "Accra Central Store — Ringway Estates", quantity: 3 },
    ],
    storeLocation: "Accra Central Store — Ringway Estates",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-010",
    requestNumber: "REQ-ACC-2026-021",
    kind: "accessories",
    itemId: "acc-004",
    itemCode: "ACC-TRI-021",
    itemName: "Warning Triangle Kit",
    brand: "RoadSafe",
    description: "Reflective warning triangle with carrying case.",
    quantity: 4,
    isOther: false,
    requestedBy: "Esi Nyarko",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-20T09:45:00.000Z",
    approvedBy: "Kojo Asante",
    approvalDate: "2026-07-21T10:30:00.000Z",
    quantityRequested: 4,
    actualQuantity: 4,
    storeLocations: ["Tema Fleet Store — Community 12", "Kumasi Regional Store — Asokwa"],
    storeAllocations: [
      { location: "Tema Fleet Store — Community 12", quantity: 2, quantityIssued: 0 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 2, quantityIssued: 0 },
    ],
    storeLocation: "Tema Fleet Store — Community 12 · Kumasi Regional Store — Asokwa",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-011",
    requestNumber: "REQ-ACC-2026-022",
    kind: "accessories",
    itemId: "acc-001",
    itemCode: "ACC-FLP-001",
    itemName: "Floor Mat Set (Universal)",
    brand: "AutoGuard",
    description: "Replacement mats for pool Hilux units.",
    quantity: 2,
    isOther: false,
    requestedBy: "Kwesi Mensah",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-21T08:10:00.000Z",
    approvedBy: "Fiifi Bentum",
    approvalDate: "2026-07-22T09:00:00.000Z",
    quantityRequested: 2,
    actualQuantity: 2,
    storeLocations: ["Accra Central Store — Ringway Estates"],
    storeAllocations: [
      { location: "Accra Central Store — Ringway Estates", quantity: 2 },
    ],
    storeLocation: "Accra Central Store — Ringway Estates",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-012",
    requestNumber: "REQ-ACC-2026-023",
    kind: "accessories",
    itemId: "acc-006",
    itemCode: "ACC-JAR-009",
    itemName: "Jump Starter Pack",
    brand: "NOCO",
    description: "Approved for roadside response kit restock.",
    quantity: 1,
    isOther: false,
    requestedBy: "Michael Addo",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-22T13:20:00.000Z",
    approvedBy: "Ama Serwaa",
    approvalDate: "2026-07-23T08:45:00.000Z",
    quantityRequested: 1,
    actualQuantity: 1,
    storeLocations: ["Kumasi Regional Store — Asokwa"],
    storeAllocations: [
      { location: "Kumasi Regional Store — Asokwa", quantity: 1 },
    ],
    storeLocation: "Kumasi Regional Store — Asokwa",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-013",
    requestNumber: "REQ-ACC-2026-024",
    kind: "accessories",
    itemId: null,
    itemCode: "ACC-035",
    itemName: "Seat cover set (cloth)",
    brand: "—",
    description: "Other — navy cloth covers for executive sedan.",
    quantity: 2,
    isOther: true,
    requestedBy: "Ama Serwaa",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-23T15:00:00.000Z",
    approvedBy: "Kojo Asante",
    approvalDate: "2026-07-24T11:10:00.000Z",
    quantityRequested: 6,
    actualQuantity: 6,
    storeLocations: ["Takoradi Regional Store — Effia"],
    storeAllocations: [
      { location: "Takoradi Regional Store — Effia", quantity: 6 },
    ],
    storeLocation: "Takoradi Regional Store — Effia",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Accessories: supplied / partial / rejected ──
  {
    id: "req-acc-003",
    requestNumber: "REQ-ACC-2026-011",
    kind: "accessories",
    itemId: "acc-002",
    itemCode: "ACC-WIP-014",
    itemName: "Wiper Blade Pair 22\"",
    brand: "Bosch",
    description: "All-season wiper blades for sedan and SUV fleet.",
    quantity: 6,
    isOther: false,
    requestedBy: "Yaw Mensah",
    status: "SUPPLIED",
    createdAt: "2026-07-10T11:00:00.000Z",
    approvedBy: "Nii Quaye",
    approvalDate: "2026-07-11T10:20:00.000Z",
    storeLocation: "Accra Central Store — Ringway Estates",
    storeLocations: ["Accra Central Store — Ringway Estates"],
    suppliedTo: "Accra Workshop",
    quantitySupplied: 6,
    quantityRemaining: 0,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-014",
    requestNumber: "REQ-ACC-2026-010",
    kind: "accessories",
    itemId: "acc-005",
    itemCode: "ACC-CHG-033",
    itemName: "USB Dual Car Charger",
    brand: "Anker",
    description: "Issued to fleet ops supervisors.",
    quantity: 5,
    isOther: false,
    requestedBy: "Selorm Gbeho",
    status: "SUPPLIED",
    createdAt: "2026-07-05T09:30:00.000Z",
    approvedBy: "Fiifi Bentum",
    approvalDate: "2026-07-06T14:00:00.000Z",
    storeLocation: "Accra Central Store — Ringway Estates",
    storeLocations: ["Accra Central Store — Ringway Estates"],
    suppliedTo: "Fleet Operations",
    quantitySupplied: 5,
    quantityRemaining: 0,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-006",
    requestNumber: "REQ-ACC-2026-012",
    kind: "accessories",
    itemId: "acc-004",
    itemCode: "ACC-TRI-021",
    itemName: "Warning Triangle Kit",
    brand: "RoadSafe",
    description: "Reflective warning triangle with carrying case.",
    quantity: 10,
    isOther: false,
    requestedBy: "Ruth Ofori",
    status: "PARTIAL_SUPPLIED",
    createdAt: "2026-07-12T08:30:00.000Z",
    approvedBy: "Ama Serwaa",
    approvalDate: "2026-07-13T11:40:00.000Z",
    storeLocation: "Accra Central Store — Ringway Estates",
    storeLocations: ["Accra Central Store — Ringway Estates"],
    suppliedTo: "Field Dispatch",
    quantitySupplied: 6,
    quantityRemaining: 4,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-acc-015",
    requestNumber: "REQ-ACC-2026-009",
    kind: "accessories",
    itemId: "acc-006",
    itemCode: "ACC-JAR-009",
    itemName: "Jump Starter Pack",
    brand: "NOCO",
    description: "Rejected — quantity exceeds allocated safety stock.",
    quantity: 6,
    isOther: false,
    requestedBy: "Ebo Lamptey",
    status: "REJECTED",
    createdAt: "2026-07-04T16:20:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: "Exceeds current allocation for roadside kits this quarter.",
    pendingOtp: null,
  },

  // ── Vehicle parts: pending supply request ──
  {
    id: "req-vp-003",
    requestNumber: "REQ-VP-2026-010",
    kind: "vehicle_parts",
    itemId: "vp-004",
    itemCode: "VP-RAD-ISZ-08",
    itemName: "Radiator Hose",
    brand: "Gates",
    description: "Cooling > Radiator > Upper Hose",
    make: "Isuzu",
    model: "D-Max",
    year: 2023,
    chassisNumber: "MPATFR85JHT123456",
    level1: "Cooling",
    level2: "Radiator",
    level3: "Upper Hose",
    componentPath: "Cooling > Radiator > Upper Hose",
    quantity: 1,
    isOther: false,
    requestedBy: "Michael Addo",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-24T09:50:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-006",
    requestNumber: "REQ-VP-2026-012",
    kind: "vehicle_parts",
    itemId: "vp-006",
    itemCode: "VP-TYR-AT-265",
    itemName: "All-Terrain Tyre",
    brand: "BFGoodrich",
    description: "Wheels > Tyres > All-Terrain",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2018,
    chassisNumber: "JTEBU5JR5J5123456",
    level1: "Wheels",
    level2: "Tyres",
    level3: "All-Terrain",
    componentPath: "Wheels > Tyres > All-Terrain",
    quantity: 4,
    isOther: false,
    requestedBy: "Yaw Mensah",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-26T07:55:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-007",
    requestNumber: "REQ-VP-2026-013",
    kind: "vehicle_parts",
    itemId: "vp-002",
    itemCode: "VP-OFL-DIE-01",
    itemName: "Engine Oil Filter",
    brand: "Mann-Filter",
    description: "Engine > Lubrication > Oil Filter",
    make: "Nissan",
    model: "Urvan",
    year: 2019,
    chassisNumber: "JN1TBNT32U0123456",
    level1: "Engine",
    level2: "Lubrication",
    level3: "Oil Filter",
    componentPath: "Engine > Lubrication > Oil Filter",
    quantity: 8,
    quantityRequested: 8,
    actualQuantity: 5,
    isOther: false,
    requestedBy: "Fiifi Bentum",
    status: "PENDING_SUPPLY_APPROVAL",
    createdAt: "2026-07-27T09:15:00.000Z",
    raisedBy: "Current Store Keeper",
    raisedAt: "2026-07-27T10:40:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocations: [
      "Tema Fleet Store — Community 12",
      "Kumasi Regional Store — Asokwa",
    ],
    storeAllocations: [
      { location: "Tema Fleet Store — Community 12", quantity: 3 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 2 },
    ],
    storeLocation: "Tema Fleet Store — Community 12 · Kumasi Regional Store — Asokwa",
    comment: "Drawing 5 filters from Tema and Kumasi to cover this request.",
    approvalComment: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Vehicle parts: pending supply approval ──
  {
    id: "req-vp-004",
    requestNumber: "REQ-VP-2026-011",
    kind: "vehicle_parts",
    itemId: "vp-003",
    itemCode: "VP-ALT-SPR-12",
    itemName: "Alternator Assembly",
    brand: "Bosch",
    description: "Electrical > Charging > Alternator Assembly",
    make: "Mercedes-Benz",
    model: "Sprinter",
    year: 2023,
    chassisNumber: "WDB9066331N456789",
    level1: "Electrical",
    level2: "Charging",
    level3: "Alternator Assembly",
    componentPath: "Electrical > Charging > Alternator Assembly",
    quantity: 1,
    isOther: false,
    requestedBy: "Kojo Owusu",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-22T16:00:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    comment: "Alternator draft submitted for workshop bay.",
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-008",
    requestNumber: "REQ-VP-2026-014",
    kind: "vehicle_parts",
    itemId: "vp-005",
    itemCode: "VP-CVJ-FRD-21",
    itemName: "CV Joint",
    brand: "GKN",
    description: "Suspension > Front > Outer CV Joint",
    make: "Ford",
    model: "Ranger",
    year: 2022,
    chassisNumber: "1FTER4EH5NLA12345",
    level1: "Suspension",
    level2: "Front",
    level3: "Outer CV Joint",
    componentPath: "Suspension > Front > Outer CV Joint",
    quantity: 1,
    isOther: false,
    requestedBy: "Ebo Lamptey",
    status: "PENDING_SUPPLY_REQUEST",
    createdAt: "2026-07-25T12:30:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    comment: "CV joint draft ready for approval.",
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Vehicle parts: pending issuance (several, shared receivers) ──
  {
    id: "req-vp-001",
    requestNumber: "REQ-VP-2026-008",
    kind: "vehicle_parts",
    itemId: "vp-001",
    itemCode: "VP-BP-HLX-F",
    itemName: "Front Brake Pad Set",
    brand: "Akebono",
    description: "Brakes > Front > Pad Set",
    make: "Toyota",
    model: "Hilux",
    year: 2024,
    chassisNumber: "JTDBT923504012345",
    level1: "Brakes",
    level2: "Front",
    level3: "Pad Set",
    componentPath: "Brakes > Front > Pad Set",
    quantity: 2,
    isOther: false,
    requestedBy: "Kojo Owusu",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-20T10:30:00.000Z",
    approvedBy: "Fiifi Bentum",
    approvalDate: "2026-07-21T08:15:00.000Z",
    quantityRequested: 2,
    actualQuantity: 2,
    storeLocations: ["Accra Central Store — Ringway Estates"],
    storeLocation: "Accra Central Store — Ringway Estates",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-009",
    requestNumber: "REQ-VP-2026-015",
    kind: "vehicle_parts",
    itemId: "vp-002",
    itemCode: "VP-OFL-DIE-01",
    itemName: "Engine Oil Filter",
    brand: "Mann-Filter",
    description: "Engine > Lubrication > Oil Filter",
    make: "Nissan",
    model: "Urvan",
    year: 2019,
    chassisNumber: "JN1TBNT32U0123456",
    level1: "Engine",
    level2: "Lubrication",
    level3: "Oil Filter",
    componentPath: "Engine > Lubrication > Oil Filter",
    quantity: 3,
    isOther: false,
    requestedBy: "Kojo Owusu",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-21T11:00:00.000Z",
    approvedBy: "Fiifi Bentum",
    approvalDate: "2026-07-22T09:40:00.000Z",
    quantityRequested: 3,
    actualQuantity: 3,
    storeLocations: ["Tema Fleet Store — Community 12", "Kumasi Regional Store — Asokwa"],
    storeAllocations: [
      { location: "Tema Fleet Store — Community 12", quantity: 2, quantityIssued: 0 },
      { location: "Kumasi Regional Store — Asokwa", quantity: 1, quantityIssued: 0 },
    ],
    storeLocation: "Tema Fleet Store — Community 12 · Kumasi Regional Store — Asokwa",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-010",
    requestNumber: "REQ-VP-2026-016",
    kind: "vehicle_parts",
    itemId: "vp-004",
    itemCode: "VP-RAD-ISZ-08",
    itemName: "Radiator Hose",
    brand: "Gates",
    description: "Cooling > Radiator > Upper Hose",
    make: "Isuzu",
    model: "D-Max",
    year: 2023,
    chassisNumber: "MPATFR85JHT123456",
    level1: "Cooling",
    level2: "Radiator",
    level3: "Upper Hose",
    componentPath: "Cooling > Radiator > Upper Hose",
    quantity: 2,
    isOther: false,
    requestedBy: "Selorm Gbeho",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-22T14:25:00.000Z",
    approvedBy: "Nii Quaye",
    approvalDate: "2026-07-23T10:05:00.000Z",
    quantityRequested: 1,
    actualQuantity: 1,
    storeLocations: ["Accra Central Store — Ringway Estates"],
    storeLocation: "Accra Central Store — Ringway Estates",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-011",
    requestNumber: "REQ-VP-2026-017",
    kind: "vehicle_parts",
    itemId: "vp-006",
    itemCode: "VP-TYR-AT-265",
    itemName: "All-Terrain Tyre",
    brand: "BFGoodrich",
    description: "Wheels > Tyres > All-Terrain",
    make: "Toyota",
    model: "Land Cruiser",
    year: 2018,
    chassisNumber: "JTEBU5JR5J5123456",
    level1: "Wheels",
    level2: "Tyres",
    level3: "All-Terrain",
    componentPath: "Wheels > Tyres > All-Terrain",
    quantity: 2,
    isOther: false,
    requestedBy: "Selorm Gbeho",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-23T09:50:00.000Z",
    approvedBy: "Kojo Asante",
    approvalDate: "2026-07-24T08:20:00.000Z",
    quantityRequested: 2,
    actualQuantity: 2,
    storeLocations: ["Tema Fleet Store — Community 12"],
    storeLocation: "Tema Fleet Store — Community 12",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-012",
    requestNumber: "REQ-VP-2026-018",
    kind: "vehicle_parts",
    itemId: "vp-003",
    itemCode: "VP-ALT-SPR-12",
    itemName: "Alternator Assembly",
    brand: "Bosch",
    description: "Electrical > Charging > Alternator Assembly",
    make: "Mercedes-Benz",
    model: "Sprinter",
    year: 2023,
    chassisNumber: "WDB9066331N456789",
    level1: "Electrical",
    level2: "Charging",
    level3: "Alternator Assembly",
    componentPath: "Electrical > Charging > Alternator Assembly",
    quantity: 1,
    isOther: false,
    requestedBy: "Michael Addo",
    status: "PENDING_ISSUANCE",
    createdAt: "2026-07-24T16:40:00.000Z",
    approvedBy: "Ama Serwaa",
    approvalDate: "2026-07-25T11:30:00.000Z",
    quantityRequested: 4,
    actualQuantity: 4,
    storeLocations: ["Kumasi Regional Store — Asokwa", "Tamale Regional Store — Industrial Area"],
    storeAllocations: [
      { location: "Kumasi Regional Store — Asokwa", quantity: 2, quantityIssued: 0 },
      { location: "Tamale Regional Store — Industrial Area", quantity: 2, quantityIssued: 0 },
    ],
    storeLocation: "Kumasi Regional Store — Asokwa · Tamale Regional Store — Industrial Area",
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: null,
    pendingOtp: null,
  },

  // ── Vehicle parts: supplied / partial / rejected ──
  {
    id: "req-vp-005",
    requestNumber: "REQ-VP-2026-007",
    kind: "vehicle_parts",
    itemId: "vp-005",
    itemCode: "VP-CVJ-FRD-21",
    itemName: "CV Joint",
    brand: "GKN",
    description: "Suspension > Front > Outer CV Joint",
    make: "Ford",
    model: "Ranger",
    year: 2022,
    chassisNumber: "1FTER4EH5NLA12345",
    level1: "Suspension",
    level2: "Front",
    level3: "Outer CV Joint",
    componentPath: "Suspension > Front > Outer CV Joint",
    quantity: 2,
    isOther: false,
    requestedBy: "Selorm Gbeho",
    status: "SUPPLIED",
    createdAt: "2026-07-08T09:20:00.000Z",
    approvedBy: "Kojo Asante",
    approvalDate: "2026-07-09T14:00:00.000Z",
    storeLocation: "Tema Fleet Store — Community 12",
    storeLocations: ["Tema Fleet Store — Community 12"],
    quantitySupplied: 2,
    quantityRemaining: 0,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-013",
    requestNumber: "REQ-VP-2026-006",
    kind: "vehicle_parts",
    itemId: "vp-001",
    itemCode: "VP-BP-HLX-F",
    itemName: "Front Brake Pad Set",
    brand: "Akebono",
    description: "Brakes > Front > Pad Set",
    make: "Toyota",
    model: "Hilux",
    year: 2024,
    chassisNumber: "JTDBT923504012345",
    level1: "Brakes",
    level2: "Front",
    level3: "Pad Set",
    componentPath: "Brakes > Front > Pad Set",
    quantity: 1,
    isOther: false,
    requestedBy: "Kwesi Mensah",
    status: "SUPPLIED",
    createdAt: "2026-07-02T10:00:00.000Z",
    approvedBy: "Nii Quaye",
    approvalDate: "2026-07-03T09:15:00.000Z",
    storeLocation: "Accra Central Store — Ringway Estates",
    storeLocations: ["Accra Central Store — Ringway Estates"],
    quantitySupplied: 1,
    quantityRemaining: 0,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-002",
    requestNumber: "REQ-VP-2026-009",
    kind: "vehicle_parts",
    itemId: "vp-002",
    itemCode: "VP-OFL-DIE-01",
    itemName: "Engine Oil Filter",
    brand: "Mann-Filter",
    description: "Engine > Lubrication > Oil Filter",
    make: "Nissan",
    model: "Urvan",
    year: 2019,
    chassisNumber: "JN1TBNT32U0123456",
    level1: "Engine",
    level2: "Lubrication",
    level3: "Oil Filter",
    componentPath: "Engine > Lubrication > Oil Filter",
    quantity: 5,
    isOther: false,
    requestedBy: "Selorm Gbeho",
    status: "PARTIAL_SUPPLIED",
    createdAt: "2026-07-18T15:05:00.000Z",
    approvedBy: "Nii Quaye",
    approvalDate: "2026-07-19T10:10:00.000Z",
    storeLocation: "Accra Central Store — Ringway Estates",
    storeLocations: ["Accra Central Store — Ringway Estates"],
    suppliedTo: "Fleet Operations",
    quantitySupplied: 3,
    quantityRemaining: 2,
    rejectionComment: null,
    pendingOtp: null,
  },
  {
    id: "req-vp-015",
    requestNumber: "REQ-VP-2026-004",
    kind: "vehicle_parts",
    itemId: "vp-005",
    itemCode: "VP-CVJ-FRD-21",
    itemName: "CV Joint",
    brand: "GKN",
    description: "Suspension > Front > Outer CV Joint",
    make: "Ford",
    model: "Ranger",
    year: 2022,
    chassisNumber: "1FTER4EH5NLA12345",
    level1: "Suspension",
    level2: "Front",
    level3: "Outer CV Joint",
    componentPath: "Suspension > Front > Outer CV Joint",
    quantity: 2,
    isOther: false,
    requestedBy: "Nii Armah Quaye",
    status: "REJECTED",
    createdAt: "2026-07-01T13:40:00.000Z",
    approvedBy: null,
    approvalDate: null,
    storeLocation: null,
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    rejectionComment: "Wrong vehicle year on request — resubmit against 2021 chassis.",
    pendingOtp: null,
  },
];

let sessionRequisitions = SEED_REQUISITIONS.map((row) => ({ ...row }));

function normalizeRequisitionRow(row) {
  if (!row) return row;
  if (row.status !== "PENDING_BATCH_ISSUANCE") return { ...row };
  return { ...row, status: "PENDING_ISSUANCE", isBatch: false };
}

export function getRequisitionByRef(ref) {
  const key = String(ref || "").trim().toLowerCase();
  if (!key) return null;
  return getRequisitions().find(
    (row) => row.id.toLowerCase() === key || String(row.requestNumber || "").toLowerCase() === key,
  ) ?? null;
}

/** Find an existing supply requisition, or create one from approval/request stores details. */
export function ensureRequisitionForStoreRequest(details = {}) {
  const existing =
    getRequisitionByRef(details.requisitionId)
    || getRequisitionByRef(details.requestNumber)
    || getRequisitions().find((row) => {
      const code = String(details.itemCode || "").trim().toLowerCase();
      if (!code) return false;
      return (
        String(row.itemCode || "").toLowerCase() === code
        && (row.status || "").toString().toUpperCase() === "PENDING_SUPPLY_REQUEST"
      );
    })
    || null;
  if (existing) return existing;

  const itemCode = String(details.itemCode || "").trim();
  const catalogItem = itemCode
    ? getAccessories().find((item) => String(item.itemCode || "").toLowerCase() === itemCode.toLowerCase())
    : null;

  return addRequisition({
    kind: details.kind === "vehicle_parts" ? "vehicle_parts" : "accessories",
    itemId: details.itemId || catalogItem?.id || null,
    itemCode: itemCode || catalogItem?.itemCode || "",
    itemName: details.itemName || catalogItem?.name || "Store item",
    brand: details.brand || catalogItem?.brand || "",
    description: details.description || catalogItem?.description || details.justification || "",
    quantity: details.quantity ?? 1,
    justification: details.justification || "",
    photo: catalogItem?.photo || details.photo || "",
    isOther: !details.itemId && !catalogItem,
    requestedBy: details.requestedBy || "Current User",
    status: "PENDING_SUPPLY_REQUEST",
  });
}

export function getRequisitions() {
  return sessionRequisitions.map(normalizeRequisitionRow);
}

export function getRequisitionDisplayRows() {
  return sessionRequisitions
    .map(normalizeRequisitionRow)
    .sort((a, b) => new Date(b.createdAt || 0) - new Date(a.createdAt || 0));
}

function nextRequestNumber(kind) {
  const prefix = kind === "vehicle_parts" ? "REQ-VP" : "REQ-ACC";
  const year = new Date().getFullYear();
  const count = sessionRequisitions.filter((row) => row.kind === kind).length + 1;
  return `${prefix}-${year}-${String(count).padStart(3, "0")}`;
}

export function addRequisition(payload) {
  const now = new Date().toISOString();
  const kind = payload.kind === "vehicle_parts" ? "vehicle_parts" : "accessories";
  const componentPath =
    payload.componentPath
    || buildComponentPath(payload)
    || payload.description?.trim()
    || "";

  const itemName = String(payload.itemName ?? "").trim() || "—";
  const brand = String(payload.brand ?? "").trim() || "—";
  const description =
    kind === "vehicle_parts"
      ? (componentPath || String(payload.description ?? "").trim() || itemName)
      : (String(payload.description ?? "").trim() || "—");

  const created = {
    id: `req-${Date.now()}-${Math.random().toString(36).slice(2, 9)}`,
    requestNumber: nextRequestNumber(kind),
    kind,
    itemId: payload.itemId ?? null,
    itemCode: (() => {
      const code = String(payload.itemCode ?? "").trim();
      if (code && code !== "—") return code;
      // Other/custom accessories get a real code later (e.g. on supply approval)
      if (payload.isOther) return "—";
      if (kind === "accessories") return generateAccessoryItemCode();
      return `VP-${Date.now().toString().slice(-6)}`;
    })(),
    itemName,
    brand,
    description: description || "—",
    make: payload.make || null,
    model: payload.model || null,
    year: payload.year ?? null,
    chassisNumber: payload.chassisNumber || null,
    level1: payload.level1 || null,
    level2: payload.level2 || null,
    level3: payload.level3 || null,
    level4: payload.level4 || null,
    level5: payload.level5 || null,
    level6: payload.level6 || null,
    componentPath: componentPath || description || null,
    quantity: Number(payload.quantity) || 0,
    justification: String(payload.justification ?? "").trim() || null,
    photo: payload.photo || "",
    isOther: Boolean(payload.isOther),
    requestedBy: payload.requestedBy || "Current User",
    status: payload.status || "PENDING_SUPPLY_REQUEST",
    createdAt: now,
    approvedBy: null,
    approvalDate: null,
    quantityRequested: Number(payload.quantity) || 0,
    actualQuantity: null,
    storeLocation: null,
    storeLocations: [],
    storeAllocations: [],
    suppliedTo: null,
    quantitySupplied: null,
    quantityRemaining: null,
    comment: null,
    approvalComment: null,
    raisedBy: null,
    raisedAt: null,
    rejectionComment: null,
    pendingOtp: null,
  };
  sessionRequisitions = [created, ...sessionRequisitions];
  return { ...created };
}

function normalizeRaisedStoreAllocations(payload = {}, quantityRequested) {
  const requested = Number(quantityRequested);
  if (!Number.isFinite(requested) || requested <= 0) {
    throw new Error("Enter a valid quantity requested.");
  }

  let allocations = [];
  if (Array.isArray(payload.storeAllocations) && payload.storeAllocations.length) {
    allocations = payload.storeAllocations.map((row) => ({
      location: String(row?.location || "").trim(),
      quantity: Number(row?.quantity),
    })).filter((row) => row.location);
  } else {
    const locations = Array.isArray(payload.storeLocations)
      ? payload.storeLocations.map((loc) => String(loc).trim()).filter(Boolean)
      : payload.storeLocation
        ? [String(payload.storeLocation).trim()]
        : [];
    allocations = locations.map((location) => ({
      location,
      quantity: Number(payload.actualQuantity),
    }));
  }

  if (!allocations.length) {
    throw new Error("Select at least one store and enter a quantity for each.");
  }
  for (const row of allocations) {
    if (!Number.isFinite(row.quantity) || row.quantity <= 0) {
      throw new Error(`Enter a quantity supplied from ${row.location}.`);
    }
  }

  const total = allocations.reduce((sum, row) => sum + row.quantity, 0);

  return {
    storeAllocations: allocations.map((row) => ({
      location: row.location,
      quantity: row.quantity,
      quantityIssued: 0,
    })),
    storeLocations: allocations.map((row) => row.location),
    actualQuantity: total,
  };
}

export function raiseRequisitionBatch(requests = []) {
  const configured = Array.isArray(requests) ? requests : [];
  if (configured.length < 1) {
    throw new Error("Select at least one request to raise.");
  }
  const ids = new Set(configured.map((row) => row.id));
  const candidates = sessionRequisitions.filter((row) => ids.has(row.id));
  if (
    candidates.length !== configured.length
    || candidates.some((row) => row.status !== "PENDING_SUPPLY_REQUEST")
  ) {
    throw new Error("All selected requests must be pending supply request.");
  }

  const kinds = new Set(candidates.map((row) => row.kind));
  if (kinds.size !== 1) {
    throw new Error("Batch raise requires requests from the same inventory type.");
  }

  const now = new Date().toISOString();
  const configById = new Map(configured.map((row) => [row.id, row]));

  sessionRequisitions = sessionRequisitions.map((row) => {
    if (!ids.has(row.id)) return row;
    const config = configById.get(row.id);
    const quantityRequested = Number(config.quantityRequested ?? config.quantity ?? row.quantity);
    const raised = normalizeRaisedStoreAllocations(config, quantityRequested);
    return {
      ...row,
      status: "PENDING_SUPPLY_APPROVAL",
      quantity: raised.actualQuantity,
      quantityRequested,
      actualQuantity: raised.actualQuantity,
      storeLocations: raised.storeLocations,
      storeAllocations: raised.storeAllocations,
      storeLocation: raised.storeLocations.join(" · "),
      comment: config.comment?.trim() || null,
      raisedBy: "Current Store Keeper",
      raisedAt: now,
      approvedBy: null,
      approvalDate: null,
      approvalComment: null,
      suppliedTo: null,
      pendingOtp: null,
    };
  });

  return sessionRequisitions.filter((row) => ids.has(row.id)).map((row) => ({ ...row }));
}

export function approveRequisitionBatch(requests = []) {
  const configured = Array.isArray(requests) ? requests : [];
  if (configured.length < 1) {
    throw new Error("Select at least one request to approve.");
  }
  const ids = new Set(configured.map((row) => row.id));
  const candidates = sessionRequisitions.filter((row) => ids.has(row.id));
  if (
    candidates.length !== configured.length
    || candidates.some((row) => row.status !== "PENDING_SUPPLY_APPROVAL")
  ) {
    throw new Error("All selected requests must be pending supply approval.");
  }

  const kinds = new Set(candidates.map((row) => row.kind));
  if (kinds.size !== 1) {
    throw new Error("Approve requests from the same inventory type.");
  }

  const now = new Date().toISOString();
  const configById = new Map(configured.map((row) => [row.id, row]));

  sessionRequisitions = sessionRequisitions.map((row) => {
    if (!ids.has(row.id)) return row;
    const config = configById.get(row.id);
    return {
      ...row,
      status: "PENDING_ISSUANCE",
      quantity: Number(config.quantity) > 0 ? Number(config.quantity) : row.actualQuantity || row.quantity,
      storeLocation: config.storeLocation?.trim() || row.storeLocation || null,
      storeLocations: Array.isArray(config.storeLocations) && config.storeLocations.length
        ? config.storeLocations
        : row.storeLocations || [],
      storeAllocations: Array.isArray(row.storeAllocations) ? row.storeAllocations : [],
      approvalComment: config.approvalComment?.trim() || config.comment?.trim() || null,
      comment: row.comment || null,
      approvedBy: "Current Approver",
      approvalDate: now,
      batchId: null,
      batchNumber: null,
      batchApprovedAt: null,
      suppliedTo: null,
      pendingOtp: null,
    };
  });

  return sessionRequisitions.filter((row) => ids.has(row.id)).map((row) => ({ ...row }));
}

export function advanceRequisition(id, action, payload = {}) {
  const now = new Date().toISOString();
  const current = sessionRequisitions.find((row) => row.id === id);
  if (!current) {
    throw new Error("Requisition not found.");
  }

  const remaining = getRequisitionRemainingQuantity(current);
  const canIssueFromOtherStore = current.status === "PARTIAL_SUPPLIED" && remaining > 0;
  if (
    ["send_issue_otp", "issue_item"].includes(action)
    && payload.storeLocation
    && !canIssueFromOtherStore
    && current.storeLocation
    && payload.storeLocation !== current.storeLocation
    && !(Array.isArray(current.storeLocations) && current.storeLocations.includes(payload.storeLocation))
  ) {
    throw new Error("This item is assigned to a different store.");
  }

  if (action === "issue_item") {
    if (!isRequisitionIssuable(current)) {
      throw new Error("This action is not available for the current requisition status.");
    }
    if (!current.pendingOtp) {
      throw new Error("Send an OTP to the receiver before confirming issue.");
    }
    const entered = String(payload.otp || "").trim();
    if (entered !== MOCK_ISSUE_OTP && entered !== String(current.pendingOtp || "").trim()) {
      throw new Error("Confirm the OTP sent to the receiver before issuing.");
    }
    const issuing = Number(payload.quantity ?? remaining);
    if (!Number.isFinite(issuing) || issuing <= 0) {
      throw new Error("Enter a quantity to issue greater than zero.");
    }
    if (issuing > remaining) {
      throw new Error(`Quantity to issue cannot exceed remaining (${remaining}).`);
    }
    const allocations = getNormalizedStoreAllocations(current);
    if (allocations.length) {
      const issueStore = String(payload.storeLocation || "").trim();
      if (!issueStore) {
        throw new Error("Select the store you are issuing from.");
      }
      const storeRemaining = getStoreRemainingQuantity(current, issueStore);
      const canUseOtherStore = current.status === "PARTIAL_SUPPLIED" && remaining > 0;
      if (storeRemaining <= 0 && !canUseOtherStore) {
        throw new Error(`Nothing remaining to issue from ${issueStore}.`);
      }
      if (storeRemaining > 0 && issuing > storeRemaining) {
        throw new Error(`Cannot exceed remaining at ${issueStore} (${storeRemaining}).`);
      }
      if (storeRemaining <= 0 && issuing > remaining) {
        throw new Error(`Quantity to issue cannot exceed remaining (${remaining}).`);
      }
    }
  }

  let updated = null;

  sessionRequisitions = sessionRequisitions.map((row) => {
    if (row.id !== id) return row;

    if (action === "raise_supply_request" && row.status === "PENDING_SUPPLY_REQUEST") {
      const alreadySupplied = Number(row.quantitySupplied) > 0;
      const quantityRequested = Number(payload.quantityRequested ?? payload.quantity ?? row.quantity);
      const raised = normalizeRaisedStoreAllocations(payload, quantityRequested);
      updated = {
        ...row,
        status: "PENDING_SUPPLY_APPROVAL",
        quantity: raised.actualQuantity,
        quantityRequested: alreadySupplied
          ? (row.quantityRequested ?? row.quantity)
          : quantityRequested,
        actualQuantity: raised.actualQuantity,
        storeLocations: raised.storeLocations,
        storeAllocations: raised.storeAllocations,
        storeLocation: raised.storeLocations.join(" · "),
        comment: payload.comment?.trim() || null,
        raisedBy: "Current Store Keeper",
        raisedAt: now,
        approvedBy: alreadySupplied ? row.approvedBy : null,
        approvalDate: alreadySupplied ? row.approvalDate : null,
        approvalComment: null,
        suppliedTo: alreadySupplied ? row.suppliedTo : null,
        pendingOtp: null,
        quantityRemaining: alreadySupplied
          ? getRequisitionRemainingQuantity(row)
          : row.quantityRemaining,
        remainingRejected: false,
      };
      return updated;
    }

    if (action === "approval_request" && row.status === "PENDING_SUPPLY_APPROVAL") {
      updated = {
        ...row,
        status: "PENDING_ISSUANCE",
        quantity: Number(row.actualQuantity) > 0 ? Number(row.actualQuantity) : row.quantity,
        approvalComment: payload.approvalComment?.trim() || payload.comment?.trim() || null,
        comment: row.comment || payload.comment?.trim() || null,
        approvedBy: "Current Approver",
        approvalDate: now,
        storeLocation: row.storeLocation || payload.storeLocation?.trim() || null,
        storeLocations: Array.isArray(row.storeLocations) ? row.storeLocations : [],
        storeAllocations: Array.isArray(row.storeAllocations) ? row.storeAllocations : [],
        suppliedTo: null,
        pendingOtp: null,
      };
      return updated;
    }

    if (
      action === "send_issue_otp"
      && isRequisitionIssuable(row)
    ) {
      const otp = MOCK_ISSUE_OTP;
      updated = {
        ...row,
        pendingOtp: otp,
        suppliedTo: payload.suppliedTo?.trim() || row.suppliedTo || null,
      };
      return updated;
    }

    if (
      action === "issue_item"
      && isRequisitionIssuable(row)
    ) {
      const remaining = getRequisitionRemainingQuantity(row);
      const issuing = Number(payload.quantity ?? remaining);
      const alreadySupplied = Number(row.quantitySupplied || 0);
      const newSupplied = alreadySupplied + issuing;
      const newRemaining = remaining - issuing;
      const issueStore = String(payload.storeLocation || "").trim();
      const currentAllocations = getNormalizedStoreAllocations(row);
      const nextAllocations = currentAllocations.length && issueStore
        ? (
          currentAllocations.some((item) => item.location === issueStore)
            ? currentAllocations.map((item) => (
              item.location === issueStore
                ? { ...item, quantityIssued: item.quantityIssued + issuing }
                : item
            ))
            : [
              ...currentAllocations,
              { location: issueStore, quantity: issuing, quantityIssued: issuing },
            ]
        )
        : row.storeAllocations;
      updated = {
        ...row,
        status: newRemaining > 0 ? "PARTIAL_SUPPLIED" : "SUPPLIED",
        approvedBy: row.approvedBy || "Current Approver",
        approvalDate: row.approvalDate || now,
        storeAllocations: nextAllocations,
        storeLocations: nextAllocations?.length
          ? [...new Set(nextAllocations.map((item) => item.location))]
          : row.storeLocations,
        suppliedTo: payload.suppliedTo?.trim() || row.suppliedTo || null,
        quantitySupplied: newSupplied,
        quantityRemaining: newRemaining,
        remainingRejected: false,
        comment: payload.comment?.trim() || row.comment || null,
        pendingOtp: null,
        batchId: payload.batchId || row.batchId || null,
        batchNumber: payload.batchId || payload.batchNumber || row.batchNumber || null,
      };
      return updated;
    }

    return row;
  });

  if (!updated) {
    throw new Error("This action is not available for the current requisition status.");
  }

  return { ...updated };
}

export function rejectRequisition(id, rejectionComment, options = {}) {
  const comment = String(rejectionComment || "").trim();
  if (!comment) {
    throw new Error("A rejection comment is required.");
  }

  const rejectType = options.type === "store_change" ? "store_change" : "entire";

  let updated = null;
  sessionRequisitions = sessionRequisitions.map((row) => {
    if (row.id !== id) return row;
    const remaining = getRequisitionRemainingQuantity(row);
    const canRejectPending = PENDING_REQUISITION_STATUSES.includes(row.status);
    const canRejectRemaining = row.status === "PARTIAL_SUPPLIED" && remaining > 0;
    if (!canRejectPending && !canRejectRemaining) {
      return row;
    }

    if (rejectType === "store_change") {
      if (!isRequisitionIssuable(row)) {
        return row;
      }
      const remainingQty = remaining || getRequestedQuantity(row);
      updated = {
        ...row,
        status: "PENDING_SUPPLY_REQUEST",
        storeLocation: null,
        storeLocations: [],
        storeAllocations: [],
        approvedBy: row.status === "PARTIAL_SUPPLIED" ? row.approvedBy : null,
        approvalDate: row.status === "PARTIAL_SUPPLIED" ? row.approvalDate : null,
        approvalComment: null,
        raisedBy: null,
        raisedAt: null,
        actualQuantity: row.status === "PARTIAL_SUPPLIED" ? remainingQty : null,
        quantityRequested: row.quantityRequested ?? row.quantity,
        quantity: row.quantityRequested ?? row.quantity,
        quantityRemaining: remainingQty,
        remainingRejected: false,
        rejectionComment: null,
        storeChangeComment: comment,
        batchId: null,
        batchNumber: null,
        batchApprovedAt: null,
        suppliedTo: row.status === "PARTIAL_SUPPLIED" ? row.suppliedTo : null,
        pendingOtp: null,
      };
      return updated;
    }

    if (row.status === "PARTIAL_SUPPLIED") {
      updated = {
        ...row,
        quantityRemaining: 0,
        remainingRejected: true,
        rejectionComment: comment,
        pendingOtp: null,
      };
      return updated;
    }

    updated = {
      ...row,
      status: "REJECTED",
      rejectionComment: comment,
      pendingOtp: null,
    };
    return updated;
  });

  if (!updated) {
    throw new Error(
      rejectType === "store_change"
        ? "This requisition cannot be sent back for a store change in its current status."
        : "This requisition cannot be rejected in its current status.",
    );
  }

  return { ...updated };
}
