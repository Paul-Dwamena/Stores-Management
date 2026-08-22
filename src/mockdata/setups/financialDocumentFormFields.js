/** Catalog of fields for Upload Financial Documents — one Main section. */

export const FINANCIAL_DOCUMENT_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Upload an invoice, purchase order, audit report, or tax document.",
    columns: 1,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const FINANCIAL_DOCUMENT_FORM_GROUPS = [];

export const FINANCIAL_DOCUMENT_TYPES = [
  "Invoice",
  "Audit",
  "Purchase Order",
  "Tax",
  "Report",
  "Other",
];

export const FINANCIAL_DOCUMENT_FORM_FIELD_CATALOG = [
  {
    id: "fdf_file",
    key: "file",
    title: "Document file",
    fieldType: "file",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    acceptedFileTypes: ["image", "pdf", "word"],
    description: "PDF, DOC, DOCX, JPG, or PNG.",
  },
  {
    id: "fdf_document_name",
    key: "docName",
    title: "Document Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Fleet Insurance Invoice",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "fdf_category",
    key: "category",
    title: "Category",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Invoice",
    maxLength: 80,
    description: "Optional. Invoice, purchase order, audit, tax, or report.",
  },
  {
    id: "fdf_expiry_date",
    key: "expiryDate",
    title: "Expiry Date",
    fieldType: "date",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    description: "Optional. Leave blank if the document does not expire.",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FINANCIAL_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    FINANCIAL_DOCUMENT_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  FINANCIAL_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    FINANCIAL_DOCUMENT_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked === true,
    ).map((field) => field.id),
  ]),
);

export function getLockedDefaultFieldIds(sectionId) {
  return LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [];
}

export function withLockedDefaultFields(visibleBySection = {}) {
  const next = { ...visibleBySection };
  Object.entries(LOCKED_DEFAULT_FIELD_IDS_BY_SECTION).forEach(([sectionId, lockedIds]) => {
    const current = new Set(next[sectionId] ?? []);
    lockedIds.forEach((id) => current.add(id));
    next[sectionId] = [...current];
  });
  return next;
}
