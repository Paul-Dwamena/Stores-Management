/** Catalog of fields for Upload Compliance Documents — one Main section. */

export const COMPLIANCE_DOCUMENT_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Upload an MVR, medical card, background check, or other regulatory paperwork.",
    columns: 1,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const COMPLIANCE_DOCUMENT_FORM_GROUPS = [];

export const COMPLIANCE_DOCUMENT_TYPES = [
  "Motor Vehicle Record (MVR)",
  "DOT Medical Card",
  "Background Check",
  "Hazmat Certification Form",
  "Other",
];

export const COMPLIANCE_DOCUMENT_FORM_FIELD_CATALOG = [
  {
    id: "cdf_file",
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
    id: "cdf_document_name",
    key: "docName",
    title: "Document Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Motor Vehicle Record (MVR)",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "cdf_linked_to",
    key: "linkedTo",
    title: "Linked Entity",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Toyota Hilux or Afia Mensima",
    maxLength: 80,
    description: "Driver, vehicle, or internal entity this document belongs to.",
  },
  {
    id: "cdf_expiry_date",
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
  COMPLIANCE_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    COMPLIANCE_DOCUMENT_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  COMPLIANCE_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    COMPLIANCE_DOCUMENT_FORM_FIELD_CATALOG.filter(
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
