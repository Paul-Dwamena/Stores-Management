/** Catalog of fields for Fuel Logs Entry forms, grouped by section. */

export const FUEL_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main form",
    description:
      "System fields for logging a fuel entry. Add nested groups or custom leaves as needed.",
    columns: 2,
  },
];

const HALF = 1;
const FULL = 2;

export const FUEL_FORM_FIELD_CATALOG = [
  {
    id: "fuel_vehicle",
    key: "vehicleId",
    title: "Vehicle",
    fieldType: "vehicle",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "Search vehicle…",
  },
  {
    id: "fuel_vendor",
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
    id: "fuel_volume",
    key: "volume",
    title: "Volume (litres)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "fuel_amount",
    key: "amount",
    title: "Amount (GH₵)",
    fieldType: "number",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "",
  },
  {
    id: "fuel_payment_type",
    key: "paymentType",
    title: "Payment type",
    fieldType: "select",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    options: [
      { value: "momo", label: "Mobile money" },
      { value: "card", label: "Card" },
      { value: "cash", label: "Cash" },
    ],
    defaultValue: "cash",
  },
  {
    id: "fuel_wallet",
    key: "walletNumber",
    title: "Wallet number",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    description: "Shown when payment type is Mobile money.",
  },
  {
    id: "fuel_card",
    key: "cardNumber",
    title: "Card number",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    description: "Shown when payment type is Card.",
  },
  {
    id: "fuel_odometer",
    key: "odometer",
    title: "Odometer reading (km)",
    fieldType: "number",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
  },
  {
    id: "fuel_receipt",
    key: "receiptName",
    title: "Upload receipt",
    fieldType: "file",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    acceptedFileTypes: ["image", "pdf", "word"],
  },
  {
    id: "fuel_status",
    key: "status",
    title: "Status",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL,
    placeholder: "",
    description: "Read-only on the Fuel Entry form (Pending review).",
    defaultValue: "Pending review",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FUEL_FORM_SECTIONS.map((section) => [
    section.id,
    FUEL_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  for (const section of FUEL_FORM_SECTIONS) {
    const locked = getLockedDefaultFieldIds(section.id);
    const current = new Set(next[section.id] ?? []);
    locked.forEach((id) => current.add(id));
    next[section.id] = [...current];
  }
  return next;
}
