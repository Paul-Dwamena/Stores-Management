const APPROVAL_SETUPS = [
  {
    id: "as_001",
    requestType: "leave_request",
    approvalMode: "sequential",
    approvalLevels: 2,
    authMethod: "pin",
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-03-12T08:00:00.000Z",
    updatedAt: "2024-03-12T08:00:00.000Z",
  },
  {
    id: "as_002",
    requestType: "vehicle_request",
    approvalMode: "parallel",
    approvalLevels: 2,
    authMethod: "otp",
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-04-02T11:20:00.000Z",
    updatedAt: "2024-04-02T11:20:00.000Z",
  },
  {
    id: "as_003",
    requestType: "maintenance_request",
    approvalMode: "sequential",
    approvalLevels: 2,
    authMethod: "pin",
    minAmount: 0,
    maxAmount: 25000,
    isActive: true,
    createdAt: "2024-04-18T09:45:00.000Z",
    updatedAt: "2024-06-01T14:10:00.000Z",
  },
  {
    id: "as_004",
    requestType: "work_service_request",
    approvalMode: "sequential",
    approvalLevels: 2,
    authMethod: "pin",
    minAmount: 0,
    maxAmount: 10000,
    isActive: true,
    createdAt: "2024-05-08T14:30:00.000Z",
    updatedAt: "2024-05-08T14:30:00.000Z",
  },
  {
    id: "as_005",
    requestType: "request_from_stores",
    approvalMode: "sequential",
    approvalLevels: 1,
    authMethod: "pin",
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-05-20T10:00:00.000Z",
    updatedAt: "2024-05-20T10:00:00.000Z",
  },
  {
    id: "as_006",
    requestType: "inter_store_transfer",
    approvalMode: "sequential",
    approvalLevels: 1,
    authMethod: "pin",
    minAmount: 0,
    maxAmount: 0,
    isActive: true,
    createdAt: "2024-06-02T09:00:00.000Z",
    updatedAt: "2024-06-02T09:00:00.000Z",
  },
];

let approvalSetups = APPROVAL_SETUPS.map((setup) => ({ ...setup }));

function normalizeSetup(setup) {
  return {
    ...setup,
    approvalLevels: Number(setup.approvalLevels),
    minAmount: Number(setup.minAmount),
    maxAmount: Number(setup.maxAmount),
    isActive: Boolean(setup.isActive),
  };
}

export function getApprovalSetups() {
  return approvalSetups.map((setup) => normalizeSetup({ ...setup }));
}

export function saveApprovalSetup(payload, { id } = {}) {
  const now = new Date().toISOString();
  const entry = normalizeSetup({
    ...payload,
    updatedAt: now,
    createdAt: id
      ? approvalSetups.find((setup) => setup.id === id)?.createdAt ?? now
      : now,
  });

  if (id) {
    approvalSetups = approvalSetups.map((setup) =>
      setup.id === id ? { ...setup, ...entry, id } : setup,
    );
    return approvalSetups.find((setup) => setup.id === id);
  }

  const created = {
    id: `as_${Date.now()}`,
    ...entry,
  };
  approvalSetups = [created, ...approvalSetups];
  return created;
}

export function toggleApprovalSetupActive(id) {
  approvalSetups = approvalSetups.map((setup) =>
    setup.id === id
      ? { ...setup, isActive: !setup.isActive, updatedAt: new Date().toISOString() }
      : setup,
  );
  return approvalSetups.find((setup) => setup.id === id);
}
