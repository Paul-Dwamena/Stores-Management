/**
 * FormFieldRule — admin-owned behaviors evaluated on the company side at runtime.
 *
 * WHEN depends_on_field  operator  value
 * THEN action on field_id
 *
 * Rules that share the same logicGroup are AND'd together.
 */

const FORM_FIELD_RULES = [
  {
    id: "rule_1",
    fieldId: "ff_leave_009",
    dependsOnFieldId: "leave_type",
    operator: "eq",
    value: "sick",
    action: "show",
    priority: 10,
  },
  {
    id: "rule_2",
    fieldId: "ff_leave_009",
    dependsOnFieldId: "leave_type",
    operator: "eq",
    value: "sick",
    action: "require",
    logicGroup: "sick_long",
    priority: 20,
  },
];

let formFieldRules = FORM_FIELD_RULES.map((rule) => ({ ...rule }));

export function getFormFieldRules(fieldId) {
  const list = formFieldRules.map((rule) => ({ ...rule }));
  if (!fieldId) return list;
  return list.filter((rule) => rule.fieldId === fieldId);
}

export function saveFormFieldRulesForField(fieldId, rules) {
  formFieldRules = [
    ...formFieldRules.filter((rule) => rule.fieldId !== fieldId),
    ...rules.map((rule, index) => ({
      ...rule,
      id: rule.id ?? `rule_${Date.now()}_${index}`,
      fieldId,
    })),
  ];
  return getFormFieldRules(fieldId);
}
