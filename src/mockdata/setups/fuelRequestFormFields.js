/** Catalog of fields for Fuel Request forms, grouped by section. */

export const FUEL_REQUEST_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description:
      "System fields for creating a fuel request. Add nested groups or custom leaves as needed.",
    columns: 2,
  },
];

const HALF = 1;
const FULL = 2;

export const FUEL_REQUEST_FORM_FIELD_CATALOG = [
  {
    id: "fuelreq_request_type",
    key: "requestType",
    title: "Request for",
    fieldType: "radio",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: [
      { value: "vehicle", label: "Vehicle" },
      { value: "card", label: "Fuel card" },
    ],
    defaultValue: "vehicle",
    description: "Request fuel for a fleet vehicle or using a linked fuel card.",
  },
  {
    id: "fuelreq_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "vehicle",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Search vehicle…",
    description: "Shown when Request for is Vehicle.",
  },
  {
    id: "fuelreq_fuel_card",
    key: "fuelCardId",
    title: "Fuel card",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Select fuel card…",
    options: null,
    description: "Shown when Request for is Fuel card.",
  },
  {
    id: "fuelreq_vendor",
    key: "vendorId",
    title: "Vendor",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Select vendor…",
    options: null,
  },
  {
    id: "fuelreq_quantity_type",
    key: "quantityType",
    title: "Request quantity by",
    fieldType: "radio",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: [
      { value: "litres", label: "Litres" },
      { value: "amount", label: "Amount (GH₵)" },
    ],
    defaultValue: "litres",
  },
  {
    id: "fuelreq_litres",
    key: "litres",
    title: "Number of litres",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. 120",
    description: "Shown when quantity is by litres.",
  },
  {
    id: "fuelreq_amount",
    key: "amount",
    title: "Amount (GH₵)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. 450",
    description: "Shown when quantity is by amount.",
  },
  {
    id: "fuelreq_supply_date",
    key: "supplyDate",
    title: "Date to supply",
    fieldType: "date",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "fuelreq_expense_category",
    key: "expenseCategory",
    title: "Expense category",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    description: "Read-only on the Fuel Request form.",
  },
  {
    id: "fuelreq_send_via",
    key: "sendVia",
    title: "Send request via",
    fieldType: "radio",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: [
      { value: "email", label: "Email" },
      { value: "sms", label: "SMS" },
    ],
    defaultValue: "email",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_REQUEST_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_REQUEST_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_REQUEST_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of FUEL_REQUEST_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
