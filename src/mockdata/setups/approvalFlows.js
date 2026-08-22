const APPROVAL_FLOWS = [];

let approvalFlows = [];

function cloneActor(item) {
  return {
    ...item,
    matrix: item.matrix ? { ...item.matrix } : {},
    editableFieldIds: Array.isArray(item.editableFieldIds) ? [...item.editableFieldIds] : [],
    alternativeRules: Array.isArray(item.alternativeRules)
      ? item.alternativeRules.map((rule) => ({
          id: rule.id,
          matrix: rule.matrix ? { ...rule.matrix } : {},
        }))
      : [],
  };
}

function normalizeFlow(flow) {
  return {
    ...flow,
    requesters: Array.isArray(flow.requesters)
      ? flow.requesters.map((item) => cloneActor(item))
      : [],
    layers: Array.isArray(flow.layers)
      ? flow.layers.map((layer) => {
          const quorum = ["any", "any_number", "all"].includes(layer.quorum)
            ? layer.quorum
            : "all";
          return {
            ...layer,
            name: layer.name || "Approval step",
            approvers: Array.isArray(layer.approvers)
              ? layer.approvers.map((item) => cloneActor(item))
              : [],
            quorum,
            quorumCount: Math.max(1, Math.floor(Number(layer.quorumCount) || 1)),
            mode:
              quorum === "all" && layer.mode === "sequential"
                ? "sequential"
                : "parallel",
            authMethod: ["pin", "otp", "none"].includes(layer.authMethod)
              ? layer.authMethod
              : "none",
            approversCanEdit: layer.approversCanEdit === true,
            deadline:
              layer.deadline && Number(layer.deadline.value) > 0
                ? {
                    value: Math.floor(Number(layer.deadline.value)),
                    unit: layer.deadline.unit === "days" ? "days" : "hours",
                  }
                : null,
          };
        })
      : [],
    selectedFieldIds: Array.isArray(flow.selectedFieldIds) ? [...flow.selectedFieldIds] : [],
    isActive: Boolean(flow.isActive),
  };
}

export function getApprovalFlows() {
  return approvalFlows.map((flow) => normalizeFlow(flow));
}

export function createApprovalFlow({
  menuItem,
  transactionId,
  transactionLabel,
  selectedFieldIds = [],
  requesters = [],
  layers = [],
}) {
  const duplicate = approvalFlows.find((flow) => flow.transactionId === transactionId);
  if (duplicate) {
    throw new Error("This transaction already has an approval flow.");
  }

  const now = new Date().toISOString();
  const created = normalizeFlow({
    id: `af_${Date.now()}`,
    menuItem,
    transactionId,
    transactionLabel,
    selectedFieldIds,
    requesters,
    layers,
    isActive: true,
    createdAt: now,
    updatedAt: now,
  });

  approvalFlows = [created, ...approvalFlows];
  return normalizeFlow(created);
}

export function updateApprovalFlow(id, patch = {}) {
  const existing = approvalFlows.find((flow) => flow.id === id);
  if (!existing) {
    throw new Error("Approval flow not found.");
  }

  approvalFlows = approvalFlows.map((flow) =>
    flow.id === id
      ? normalizeFlow({
          ...flow,
          ...patch,
          id,
          updatedAt: new Date().toISOString(),
        })
      : flow,
  );
  return approvalFlows.find((flow) => flow.id === id);
}

export function toggleApprovalFlowActive(id) {
  approvalFlows = approvalFlows.map((flow) =>
    flow.id === id
      ? { ...flow, isActive: !flow.isActive, updatedAt: new Date().toISOString() }
      : flow,
  );
  return approvalFlows.find((flow) => flow.id === id);
}
