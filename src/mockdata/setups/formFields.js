import { normalizeOptions } from "../../pages/fleet/systemSetups/formFieldsConfiguration/utils/formFieldHelpers";

const FORM_FIELDS = [
  {
    id: "ff_001",
    title: "Incident Location",
    fieldType: "input",
    required: true,
    isActive: true,
    options: [],
    dataSource: "",
    validation: { minChars: 3, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-04-10T09:00:00.000Z",
    updatedAt: "2024-04-10T09:00:00.000Z",
  },
  {
    id: "ff_002",
    title: "Damage Description",
    fieldType: "textarea",
    required: true,
    isActive: true,
    options: [],
    dataSource: "",
    validation: { minChars: 10, maxChars: 500, minSelections: null, maxSelections: null },
    createdAt: "2024-04-12T11:30:00.000Z",
    updatedAt: "2024-05-01T14:20:00.000Z",
  },
  {
    id: "ff_003",
    title: "Priority Level",
    fieldType: "select",
    required: true,
    isActive: true,
    optionsSource: "manual",
    options: normalizeOptions([
      { id: "opt_low", label: "Low", value: "low" },
      { id: "opt_medium", label: "Medium", value: "medium" },
      { id: "opt_high", label: "High", value: "high" },
    ]),
    dataSource: "",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-05-18T08:45:00.000Z",
    updatedAt: "2024-05-18T08:45:00.000Z",
  },
  {
    id: "ff_004",
    title: "Affected Systems",
    fieldType: "checkbox",
    required: false,
    isActive: true,
    options: normalizeOptions([
      { id: "opt_engine", label: "Engine", value: "engine" },
      { id: "opt_brakes", label: "Brakes", value: "brakes" },
      { id: "opt_electrical", label: "Electrical", value: "electrical" },
    ]),
    dataSource: "",
    validation: { minChars: null, maxChars: null, minSelections: 1, maxSelections: 3 },
    createdAt: "2024-06-02T10:15:00.000Z",
    updatedAt: "2024-06-02T10:15:00.000Z",
  },
  {
    id: "ff_005",
    title: "Reported Date",
    fieldType: "date",
    required: true,
    isActive: true,
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-06-20T13:00:00.000Z",
    updatedAt: "2024-06-20T13:00:00.000Z",
  },
  {
    id: "ff_006",
    title: "Assigned Vehicle",
    fieldType: "searchSelect",
    required: true,
    isActive: true,
    options: [],
    dataSource: "vehicles",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-07-08T15:40:00.000Z",
    updatedAt: "2024-07-08T15:40:00.000Z",
  },
  {
    id: "ff_007",
    title: "Fuel Type Preference",
    fieldType: "radio",
    required: false,
    isActive: false,
    options: normalizeOptions([
      { id: "opt_diesel", label: "Diesel", value: "diesel" },
      { id: "opt_petrol", label: "Petrol", value: "petrol" },
    ]),
    dataSource: "",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-08-14T09:20:00.000Z",
    updatedAt: "2024-09-01T11:10:00.000Z",
  },
  {
    id: "ff_leave_001",
    title: "Emergency Contact Name",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: 2, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:00:00.000Z",
    updatedAt: "2024-09-10T08:00:00.000Z",
  },
  {
    id: "ff_leave_002",
    title: "Emergency Contact Phone",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 20, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:05:00.000Z",
    updatedAt: "2024-09-10T08:05:00.000Z",
  },
  {
    id: "ff_leave_003",
    title: "Leave Address",
    fieldType: "textarea",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 300, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:10:00.000Z",
    updatedAt: "2024-09-10T08:10:00.000Z",
  },
  {
    id: "ff_leave_004",
    title: "Handover Required",
    fieldType: "checkbox",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: normalizeOptions([{ id: "opt_yes", label: "Handover required", value: "yes" }]),
    dataSource: "",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:15:00.000Z",
    updatedAt: "2024-09-10T08:15:00.000Z",
  },
  {
    id: "ff_leave_005",
    title: "Handover Person",
    fieldType: "searchSelect",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "users",
    validation: { minChars: null, maxChars: null, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:20:00.000Z",
    updatedAt: "2024-09-10T08:20:00.000Z",
  },
  {
    id: "ff_leave_006",
    title: "Handover Notes",
    fieldType: "textarea",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 500, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:25:00.000Z",
    updatedAt: "2024-09-10T08:25:00.000Z",
  },
  {
    id: "ff_leave_007",
    title: "Travel Destination",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:30:00.000Z",
    updatedAt: "2024-09-10T08:30:00.000Z",
  },
  {
    id: "ff_leave_008",
    title: "Leave Location",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:35:00.000Z",
    updatedAt: "2024-09-10T08:35:00.000Z",
  },
  {
    id: "ff_leave_009",
    title: "Medical Certificate Number",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 60, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:40:00.000Z",
    updatedAt: "2024-09-10T08:40:00.000Z",
  },
  {
    id: "ff_leave_010",
    title: "Doctor Name",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:45:00.000Z",
    updatedAt: "2024-09-10T08:45:00.000Z",
  },
  {
    id: "ff_leave_011",
    title: "Hospital Name",
    fieldType: "input",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 120, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:50:00.000Z",
    updatedAt: "2024-09-10T08:50:00.000Z",
  },
  {
    id: "ff_leave_012",
    title: "Additional Comments",
    fieldType: "textarea",
    required: false,
    isActive: true,
    applicableRequestTypes: ["leave_request"],
    options: [],
    dataSource: "",
    validation: { minChars: null, maxChars: 500, minSelections: null, maxSelections: null },
    createdAt: "2024-09-10T08:55:00.000Z",
    updatedAt: "2024-09-10T08:55:00.000Z",
  },
];

let formFields = FORM_FIELDS.map((field) => ({
  ...field,
  options: normalizeOptions(field.options),
}));

function normalizeField(field) {
  const optionsSource =
    field.optionsSource ??
    (field.fieldType === "select" && field.dataSource ? "dataSource" : "manual");

  return {
    ...field,
    optionsSource: field.fieldType === "select" ? optionsSource : "",
    options: normalizeOptions(field.options),
    validation: {
      minChars: field.validation?.minChars ?? null,
      maxChars: field.validation?.maxChars ?? null,
      minSelections: field.validation?.minSelections ?? null,
      maxSelections: field.validation?.maxSelections ?? null,
    },
  };
}

export function getFormFields() {
  return formFields.map((field) => normalizeField({ ...field }));
}

export function saveFormField(payload, { id } = {}) {
  const now = new Date().toISOString();
  const entry = normalizeField({
    ...payload,
    updatedAt: now,
    createdAt: id
      ? formFields.find((field) => field.id === id)?.createdAt ?? now
      : now,
  });

  if (id) {
    formFields = formFields.map((field) =>
      field.id === id ? { ...field, ...entry, id } : field,
    );
    return formFields.find((field) => field.id === id);
  }

  const created = {
    id: `ff_${Date.now()}`,
    ...entry,
  };
  formFields = [created, ...formFields];
  return created;
}

export function toggleFormFieldActive(id) {
  formFields = formFields.map((field) =>
    field.id === id ? { ...field, isActive: !field.isActive, updatedAt: new Date().toISOString() } : field,
  );
  return formFields.find((field) => field.id === id);
}
