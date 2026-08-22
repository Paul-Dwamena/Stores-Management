/** Catalog of fields available on the driver registration / edit form, grouped by section. */

export const DRIVER_FORM_SECTIONS = [
  {
    id: "driver_identity",
    label: "Driver Identity",
    description: "Identity details and personal biodata.",
  },
  {
    id: "contact_address",
    label: "Contact and Address",
    description: "Phone numbers, emails, digital and postal addresses.",
  },
  {
    id: "emergency_contacts",
    label: "Emergency Contacts",
    description: "People to reach in case of an emergency.",
  },
  {
    id: "drivers_licences",
    label: "Drivers Licences",
    description: "First, current, and other licences (past and present).",
  },
  {
    id: "education",
    label: "Education",
    description: "Academic and professional education history.",
  },
  {
    id: "experience",
    label: "Experience",
    description: "Driving and related work experience.",
  },
  {
    id: "branch_assignment",
    label: "Branch Assignment",
    description: "Fleet branch the driver is assigned to.",
  },
  {
    id: "others",
    label: "Others",
    description: "Any other details that do not fit in the sections above.",
  },
];

export const DRIVER_FORM_FIELD_CATALOG = [
  // —— Driver Identity ——
  {
    id: "df_first_name",
    key: "firstName",
    title: "First Name",
    fieldType: "text",
    sectionId: "driver_identity",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_last_name",
    key: "lastName",
    title: "Last / Surname",
    fieldType: "text",
    sectionId: "driver_identity",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_other_names",
    key: "otherNames",
    title: "Other Names",
    fieldType: "text",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },
  {
    id: "df_previous_names",
    key: "previousNames",
    title: "Previous Names",
    fieldType: "text",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },
  {
    id: "df_gender",
    key: "gender",
    title: "Gender",
    fieldType: "select",
    sectionId: "driver_identity",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    options: ["Male", "Female", "Other"],
  },
  {
    id: "df_dob",
    key: "dob",
    title: "Date of Birth",
    fieldType: "date",
    sectionId: "driver_identity",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_birth_country",
    key: "birthCountry",
    title: "Birth Country",
    fieldType: "text",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },
  {
    id: "df_nationality",
    key: "nationality",
    title: "Nationality",
    fieldType: "text",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },
  {
    id: "df_hometown",
    key: "hometown",
    title: "Hometown",
    fieldType: "text",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },
  {
    id: "df_ghana_card_number",
    key: "ghanaCardNumber",
    title: "Ghana Card Number",
    fieldType: "text",
    sectionId: "driver_identity",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_profile_photo",
    key: "profilePhoto",
    title: "Driver Photo",
    fieldType: "photo",
    sectionId: "driver_identity",
    required: false,
    isActive: true,
  },

  // —— Contact and Address ——
  {
    id: "df_email",
    key: "email",
    title: "Email",
    fieldType: "email",
    sectionId: "contact_address",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_primary_phone",
    key: "contactNumber",
    title: "Primary Phone",
    fieldType: "tel",
    sectionId: "contact_address",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_secondary_phone",
    key: "secondaryContactNumber",
    title: "Secondary Phone",
    fieldType: "tel",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },
  {
    id: "df_digital_address",
    key: "gpsAddress",
    title: "Digital Address (GPS)",
    fieldType: "text",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },
  {
    id: "df_postal_address",
    key: "postalAddress",
    title: "Postal Address",
    fieldType: "textarea",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },
  {
    id: "df_region",
    key: "region",
    title: "Region",
    fieldType: "region",
    sectionId: "contact_address",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_district",
    key: "district",
    title: "District",
    fieldType: "district",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },
  {
    id: "df_town",
    key: "town",
    title: "Town",
    fieldType: "town",
    sectionId: "contact_address",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_house_number",
    key: "houseNumber",
    title: "House Number",
    fieldType: "text",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },
  {
    id: "df_nearest_landmark",
    key: "nearestLandmark",
    title: "Nearest Landmark",
    fieldType: "text",
    sectionId: "contact_address",
    required: false,
    isActive: true,
  },

  // —— Emergency Contacts ——
  {
    id: "df_emergency_name",
    key: "emergencyContactName",
    title: "Emergency Contact Name",
    fieldType: "text",
    sectionId: "emergency_contacts",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_emergency_phone",
    key: "emergencyContactPhone",
    title: "Emergency Contact Phone",
    fieldType: "tel",
    sectionId: "emergency_contacts",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_emergency_relation",
    key: "emergencyContactRelation",
    title: "Relationship",
    fieldType: "text",
    sectionId: "emergency_contacts",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_emergency_alt_name",
    key: "emergencyContactAltName",
    title: "Alternate Contact Name",
    fieldType: "text",
    sectionId: "emergency_contacts",
    required: false,
    isActive: true,
  },
  {
    id: "df_emergency_alt_phone",
    key: "emergencyContactAltPhone",
    title: "Alternate Contact Phone",
    fieldType: "tel",
    sectionId: "emergency_contacts",
    required: false,
    isActive: true,
  },

  // —— Drivers Licences ——
  {
    id: "df_first_licence_number",
    key: "firstLicenceNumber",
    title: "First Licence Number",
    fieldType: "text",
    sectionId: "drivers_licences",
    required: false,
    isActive: true,
  },
  {
    id: "df_first_licence_issue",
    key: "firstLicenceIssueDate",
    title: "First Licence Issue Date",
    fieldType: "date",
    sectionId: "drivers_licences",
    required: false,
    isActive: true,
  },
  {
    id: "df_current_licence_number",
    key: "licenseNumber",
    title: "Current Licence Number",
    fieldType: "text",
    sectionId: "drivers_licences",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_current_licence_class",
    key: "currentLicenceClass",
    title: "Current Licence Class",
    fieldType: "text",
    sectionId: "drivers_licences",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_current_licence_expiry",
    key: "currentLicenceExpiry",
    title: "Current Licence Expiry",
    fieldType: "date",
    sectionId: "drivers_licences",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_other_licences",
    key: "otherLicences",
    title: "Other Licences",
    fieldType: "textarea",
    sectionId: "drivers_licences",
    required: false,
    isActive: true,
  },

  // —— Education ——
  {
    id: "df_highest_education",
    key: "highestEducation",
    title: "Highest Education Level",
    fieldType: "select",
    sectionId: "education",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    options: [
      "Basic / JHS",
      "SHS / Secondary",
      "Vocational / Technical",
      "Diploma",
      "Bachelor's Degree",
      "Master's Degree",
      "Other",
    ],
  },
  {
    id: "df_institution",
    key: "educationInstitution",
    title: "Institution",
    fieldType: "text",
    sectionId: "education",
    required: false,
    isActive: true,
  },
  {
    id: "df_education_year",
    key: "educationYear",
    title: "Year Completed",
    fieldType: "text",
    sectionId: "education",
    required: false,
    isActive: true,
  },
  {
    id: "df_education_notes",
    key: "educationNotes",
    title: "Education Notes",
    fieldType: "textarea",
    sectionId: "education",
    required: false,
    isActive: true,
  },

  // —— Experience ——
  {
    id: "df_years_experience",
    key: "yearsOfExperience",
    title: "Years of Driving Experience",
    fieldType: "text",
    sectionId: "experience",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_vehicle_types",
    key: "vehicleTypesDriven",
    title: "Vehicle Types Driven",
    fieldType: "textarea",
    sectionId: "experience",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
  {
    id: "df_previous_employer",
    key: "previousEmployer",
    title: "Previous Employer",
    fieldType: "text",
    sectionId: "experience",
    required: false,
    isActive: true,
  },
  {
    id: "df_experience_notes",
    key: "experienceNotes",
    title: "Experience Notes",
    fieldType: "textarea",
    sectionId: "experience",
    required: false,
    isActive: true,
  },

  // —— Branch ——
  {
    id: "df_branch",
    key: "branch",
    title: "Branch",
    fieldType: "branch",
    sectionId: "branch_assignment",
    required: true,
    isDefaultLocked: true,
    isActive: true,
  },
];

/** Fields that must always stay visible on Default Driver Form (cannot be turned off). */
export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  DRIVER_FORM_SECTIONS.map((section) => [
    section.id,
    DRIVER_FORM_FIELD_CATALOG.filter(
      (field) => field.sectionId === section.id && field.isDefaultLocked,
    ).map((field) => field.id),
  ]),
);

/** Sensible default visibility matching the previous hardcoded form. */
export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = {
  driver_identity: [
    "df_profile_photo",
    "df_first_name",
    "df_last_name",
    "df_other_names",
    "df_gender",
    "df_dob",
    "df_nationality",
    "df_hometown",
    "df_ghana_card_number",
  ],
  contact_address: [
    "df_email",
    "df_primary_phone",
    "df_secondary_phone",
    "df_region",
    "df_district",
    "df_town",
    "df_house_number",
    "df_postal_address",
    "df_nearest_landmark",
    "df_digital_address",
  ],
  emergency_contacts: ["df_emergency_name", "df_emergency_phone", "df_emergency_relation"],
  drivers_licences: [
    "df_first_licence_number",
    "df_first_licence_issue",
    "df_current_licence_number",
    "df_current_licence_class",
    "df_current_licence_expiry",
    "df_other_licences",
  ],
  education: ["df_highest_education", "df_institution", "df_education_year"],
  experience: ["df_years_experience", "df_vehicle_types", "df_previous_employer"],
  branch_assignment: ["df_branch"],
  others: [],
};

export function getLockedDefaultFieldIds(sectionId) {
  return [...(LOCKED_DEFAULT_FIELD_IDS_BY_SECTION[sectionId] ?? [])];
}

/** Ensure locked defaults are always present in a visibility map. */
export function withLockedDefaultFields(visibleFieldIdsBySection = {}) {
  return Object.fromEntries(
    DRIVER_FORM_SECTIONS.map((section) => {
      const locked = getLockedDefaultFieldIds(section.id);
      const current = visibleFieldIdsBySection[section.id] ?? [];
      const merged = [...locked, ...current.filter((id) => !locked.includes(id))];
      return [section.id, merged];
    }),
  );
}

/** @deprecated Prefer getDriverFormFields from driverFormSetups (tree source of truth). */
export function getDriverFormFields() {
  return DRIVER_FORM_FIELD_CATALOG.map((field) => ({ ...field }));
}

/** @deprecated Prefer getDriverFormFieldsBySection from driverFormSetups. */
export function getDriverFormFieldsBySection(sectionId) {
  return getDriverFormFields().filter(
    (field) => field.sectionId === sectionId && field.isActive !== false,
  );
}
