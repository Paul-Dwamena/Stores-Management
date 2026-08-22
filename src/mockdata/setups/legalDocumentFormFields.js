/** Catalog of fields for Upload Legal Documents — one Main section. */

export const LEGAL_DOCUMENT_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Upload a contract, permit, or regulatory filing.",
    columns: 1,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const LEGAL_DOCUMENT_FORM_GROUPS = [];

export const LEGAL_DOCUMENT_TYPES = [
  "Permit",
  "Contract",
  "Regulatory",
  "Other",
];

export const LEGAL_DOCUMENT_FORM_FIELD_CATALOG = [
  {
    id: "ldf_file",
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
    id: "ldf_document_name",
    key: "docName",
    title: "Document Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. Fleet Operating Permit",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "ldf_issued_by",
    key: "issuedBy",
    title: "Issued By",
    fieldType: "text",
    sectionId: "main_form",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "e.g. DVLA Ghana",
    maxLength: 80,
    description: "Optional. Authority or party that issued this document.",
  },
  {
    id: "ldf_expiry_date",
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
  LEGAL_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    LEGAL_DOCUMENT_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  LEGAL_DOCUMENT_FORM_SECTIONS.map((section) => [
    section.id,
    LEGAL_DOCUMENT_FORM_FIELD_CATALOG.filter(
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
