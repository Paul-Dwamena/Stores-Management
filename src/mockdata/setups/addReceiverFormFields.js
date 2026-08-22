/** Catalog of fields for Add Receiver — one Main section. */

import { RECEIVER_ROLE_OPTIONS } from "../stores/receivers";

export const ADD_RECEIVER_FORM_SECTIONS = [
  {
    id: "main_form",
    label: "Main",
    description: "Create a receiver with name, email, phone, and role.",
    columns: 2,
  },
];

/** No default subfolders — add nested groups under Main if needed. */
export const ADD_RECEIVER_FORM_GROUPS = [];

export const ADD_RECEIVER_FORM_FIELD_CATALOG = [
  {
    id: "arf_name",
    key: "name",
    title: "Name",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "Full name",
  },
  {
    id: "arf_email",
    key: "email",
    title: "Email",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "name@fleet.gh",
  },
  {
    id: "arf_phone",
    key: "phone",
    title: "Phone",
    fieldType: "text",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    placeholder: "024 000 0000",
  },
  {
    id: "arf_role",
    key: "role",
    title: "Role",
    fieldType: "select",
    sectionId: "main_form",
    required: true,
    isDefaultLocked: true,
    isActive: true,
    colSpan: 1,
    options: RECEIVER_ROLE_OPTIONS.map((role) => ({ value: role, label: role })),
    placeholder: "Select role",
  },
];

export const DEFAULT_VISIBLE_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_RECEIVER_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_RECEIVER_FORM_FIELD_CATALOG.filter((field) => field.sectionId === section.id).map(
      (field) => field.id,
    ),
  ]),
);

export const LOCKED_DEFAULT_FIELD_IDS_BY_SECTION = Object.fromEntries(
  ADD_RECEIVER_FORM_SECTIONS.map((section) => [
    section.id,
    ADD_RECEIVER_FORM_FIELD_CATALOG.filter(
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
