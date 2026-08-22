/** Catalog of fields for File New Claim — fixed L1 wizard steps with leaf fields. */

export const INSURANCE_CLAIM_FORM_SECTIONS = [
  {
    id: "incident_details",
    label: "Incident Details",
    description: "Policy, vehicle, claim type, and what happened.",
    columns: 2,
  },
  {
    id: "supporting_documents",
    label: "Supporting Documents",
    description: "Upload documents that support this insurance claim.",
    columns: 2,
  },
  {
    id: "declaration_signature",
    label: "Declaration & Signature",
    description: "Confirm the declaration and sign the claim.",
    columns: 2,
  },
];

/** Collapsible subfolders under Declaration & Signature. */
export const INSURANCE_CLAIM_FORM_GROUPS = [
  {
    id: "declaration",
    sectionId: "declaration_signature",
    label: "Declaration",
    description: "Read and accept the claim declaration.",
    columns: 1,
  },
  {
    id: "signature",
    sectionId: "declaration_signature",
    label: "Signature",
    description: "Name, role, and date of the person signing.",
    columns: 2,
  },
];

const HALF = 1;
const FULL_2 = 2;

export const INSURANCE_CLAIM_FORM_FIELD_CATALOG = [
  // —— Incident Details (2 cols) ——
  {
    id: "icf_policy_no",
    key: "policyNo",
    title: "Policy Number",
    fieldType: "text",
    sectionId: "incident_details",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. POL-88210",
    minLength: 3,
    maxLength: 40,
  },
  {
    id: "icf_vehicle",
    key: "vehicle",
    title: "Vehicle / Asset",
    fieldType: "text",
    sectionId: "incident_details",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. Ford Transit #402",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "icf_type",
    key: "type",
    title: "Claim Type",
    fieldType: "select",
    sectionId: "incident_details",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    defaultValue: "Collision",
    placeholder: "Select claim type…",
    options: [
      "Collision",
      "Theft",
      "Fire Damage",
      "Flood Damage",
      "Third Party",
      "Windscreen",
      "Vandalism",
      "Other",
    ],
  },
  {
    id: "icf_date",
    key: "date",
    title: "Incident Date",
    fieldType: "date",
    sectionId: "incident_details",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "icf_location",
    key: "location",
    title: "Incident Location",
    fieldType: "text",
    sectionId: "incident_details",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "e.g. Ring Road Central, Accra",
    maxLength: 120,
  },
  {
    id: "icf_description",
    key: "description",
    title: "Description of Incident",
    fieldType: "textarea",
    sectionId: "incident_details",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: FULL_2,
    placeholder: "Describe what happened in detail...",
    maxLength: 2000,
  },
  {
    id: "icf_estimated_damage",
    key: "estimatedDamage",
    title: "Estimated Damage (GH₵)",
    fieldType: "number",
    sectionId: "incident_details",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. 8500",
  },
  {
    id: "icf_third_party",
    key: "thirdPartyInvolved",
    title: "Third Party Involved?",
    fieldType: "select",
    sectionId: "incident_details",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    defaultValue: "No",
    options: [
      { value: "No", label: "No" },
      { value: "Yes", label: "Yes" },
    ],
  },

  // —— Supporting Documents (2 cols) ——
  {
    id: "icf_police_report",
    key: "policeReport",
    title: "Police Report",
    fieldType: "file",
    acceptedFileTypes: ["pdf", "image"],
    sectionId: "supporting_documents",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    description: "Upload the police report for this incident.",
  },
  {
    id: "icf_photos_damage",
    key: "photosOfDamage",
    title: "Photos of Damage",
    fieldType: "file",
    acceptedFileTypes: ["image"],
    sectionId: "supporting_documents",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    description: "Photos showing the damage to the vehicle.",
  },
  {
    id: "icf_drivers_license",
    key: "driversLicense",
    title: "Driver's License",
    fieldType: "file",
    acceptedFileTypes: ["image", "pdf"],
    sectionId: "supporting_documents",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "icf_vehicle_registration",
    key: "vehicleRegistrationDoc",
    title: "Vehicle Registration",
    fieldType: "file",
    acceptedFileTypes: ["image", "pdf"],
    sectionId: "supporting_documents",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "icf_repair_estimate",
    key: "repairEstimate",
    title: "Repair Estimate",
    fieldType: "file",
    acceptedFileTypes: ["pdf", "image"],
    sectionId: "supporting_documents",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
  {
    id: "icf_third_party_details",
    key: "thirdPartyDetails",
    title: "Third Party Details",
    fieldType: "file",
    acceptedFileTypes: ["pdf", "image"],
    sectionId: "supporting_documents",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    description: "Required when a third party is involved.",
  },

  // —— Declaration & Signature (2 cols) ——
  {
    id: "icf_declaration_accepted",
    key: "declarationAccepted",
    title: "I have read and agree to this declaration",
    fieldType: "checkbox",
    sectionId: "declaration_signature",
    groupId: "declaration",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    defaultValue: false,
    description:
      "I declare that the particulars given in this claim, including details transferred from the accident report where applicable, are true and complete to the best of my knowledge. I understand that any false or misleading statement may result in the claim being declined and/or the policy being cancelled.",
  },
  {
    id: "icf_signatory_name",
    key: "signatoryName",
    title: "Full name",
    fieldType: "text",
    sectionId: "declaration_signature",
    groupId: "signature",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "Name of person signing this claim",
    minLength: 2,
    maxLength: 80,
  },
  {
    id: "icf_signatory_role",
    key: "signatoryRole",
    title: "Role / capacity",
    fieldType: "text",
    sectionId: "declaration_signature",
    groupId: "signature",
    required: false,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
    placeholder: "e.g. Fleet Manager, Driver",
    maxLength: 60,
  },
  {
    id: "icf_signature_date",
    key: "signatureDate",
    title: "Date",
    fieldType: "date",
    sectionId: "declaration_signature",
    groupId: "signature",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: HALF,
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSURANCE_CLAIM_FORM_SECTIONS.map((section) => [
    section.id,
    INSURANCE_CLAIM_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  INSURANCE_CLAIM_FORM_SECTIONS.map((section) => [
    section.id,
    INSURANCE_CLAIM_FORM_FIELD_CATALOG.filter(
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
