const REQUEST_SETUPS = [
  {
    id: "rs_001",
    requestType: "leave_request",
    revisionDeadlineDays: 7,
    isActive: true,
    visibleFieldIds: [
      "ff_leave_001",
      "ff_leave_002",
      "ff_leave_004",
      "ff_leave_005",
      "ff_leave_012",
    ],
    acceptedDocumentTypes: ["pdf", "jpeg", "png"],
    createdAt: "2024-03-01T08:00:00.000Z",
    updatedAt: "2024-03-01T08:00:00.000Z",
  },
];

let sessionRequestSetups = REQUEST_SETUPS.map((setup) => ({ ...setup }));

export function getRequestSetups() {
  return sessionRequestSetups.map((setup) => ({ ...setup }));
}

export function getRequestSetupByType(requestType) {
  return sessionRequestSetups.find((setup) => setup.requestType === requestType) ?? null;
}

export function getActiveRequestSetupByType(requestType) {
  return (
    sessionRequestSetups.find(
      (setup) => setup.requestType === requestType && setup.isActive,
    ) ?? null
  );
}

export function saveRequestSetup(payload, { id } = {}) {
  const now = new Date().toISOString();
  const entry = {
    requestType: payload.requestType,
    revisionDeadlineDays: payload.revisionDeadlineDays,
    isActive: Boolean(payload.isActive),
    visibleFieldIds: [...(payload.visibleFieldIds ?? [])],
    acceptedDocumentTypes: [...(payload.acceptedDocumentTypes ?? [])],
    updatedAt: now,
  };

  if (id) {
    sessionRequestSetups = sessionRequestSetups.map((setup) =>
      setup.id === id ? { ...setup, ...entry, id } : setup,
    );
    return sessionRequestSetups.find((setup) => setup.id === id);
  }

  const created = {
    id: `rs_${Date.now()}`,
    ...entry,
    createdAt: now,
  };
  sessionRequestSetups = [created, ...sessionRequestSetups];
  return created;
}

export function deleteRequestSetup(id) {
  sessionRequestSetups = sessionRequestSetups.filter((setup) => setup.id !== id);
}
