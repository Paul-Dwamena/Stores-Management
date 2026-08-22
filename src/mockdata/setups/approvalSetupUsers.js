import { DEMO_SYSTEM_USERS } from "../settings/users";

const APPROVAL_SETUP_USERS = [
  {
    id: "asgu_001",
    setupId: "as_001",
    userId: "usr-mgr-1",
    approvalLevel: 1,
    isActive: true,
    createdAt: "2024-03-12T09:00:00.000Z",
  },
  {
    id: "asgu_002",
    setupId: "as_001",
    userId: "usr-admin-1",
    approvalLevel: 2,
    isActive: true,
    createdAt: "2024-03-12T09:05:00.000Z",
  },
  {
    id: "asgu_003",
    setupId: "as_006",
    userId: "usr-mgr-2",
    approvalLevel: 1,
    isActive: true,
    createdAt: "2024-05-10T16:30:00.000Z",
  },
];

let approvalSetupUsers = APPROVAL_SETUP_USERS.map((entry) => ({ ...entry }));

function findUser(userId) {
  return DEMO_SYSTEM_USERS.find((user) => user.id === userId) ?? null;
}

function enrichEntry(entry) {
  const user = findUser(entry.userId);
  return {
    ...entry,
    approvalLevel: Number(entry.approvalLevel),
    isActive: Boolean(entry.isActive),
    userName: user ? `${user.firstName} ${user.lastName}` : "Unknown user",
    userRole: user?.role ?? "—",
    userEmail: user?.email ?? "—",
  };
}

export function getApprovalSetupUsers(setupId) {
  return approvalSetupUsers
    .filter((entry) => entry.setupId === setupId)
    .map((entry) => enrichEntry({ ...entry }))
    .sort((a, b) => a.approvalLevel - b.approvalLevel || a.userName.localeCompare(b.userName));
}

export function addApprovalSetupUser(setupId, payload) {
  const user = findUser(payload.userId);
  if (!user) {
    throw new Error("Select a valid user.");
  }

  const duplicate = approvalSetupUsers.find(
    (entry) => entry.setupId === setupId && entry.userId === payload.userId,
  );

  if (duplicate) {
    throw new Error("This user is already assigned to the approval group.");
  }

  const created = {
    id: `asgu_${Date.now()}`,
    setupId,
    userId: payload.userId,
    approvalLevel: Number(payload.approvalLevel),
    isActive: Boolean(payload.isActive),
    createdAt: new Date().toISOString(),
  };

  approvalSetupUsers = [created, ...approvalSetupUsers];
  return enrichEntry(created);
}

export function getSystemUserOptions() {
  return DEMO_SYSTEM_USERS.filter((user) => user.status === "Active").map((user) => ({
    value: user.id,
    label: `${user.firstName} ${user.lastName} (${user.role})`,
  }));
}
