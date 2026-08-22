/** Issuance receivers — people who can collect supplied parts. */

export const RECEIVER_ROLE_OPTIONS = [
  "Driver",
  "Workshop technician",
  "Workshop lead",
  "Store clerk",
  "Fleet supervisor",
  "Field dispatcher",
];

const SEED_RECEIVERS = [
  { id: "rcv-001", name: "Kwesi Mensah", email: "kwesi.mensah@fleet.gh", phone: "024 111 0001", role: "Workshop technician" },
  { id: "rcv-002", name: "Ama Serwaa", email: "ama.serwaa@fleet.gh", phone: "024 111 0002", role: "Fleet supervisor" },
  { id: "rcv-003", name: "Esi Nyarko", email: "esi.nyarko@fleet.gh", phone: "024 111 0003", role: "Store clerk" },
  { id: "rcv-004", name: "Kojo Owusu", email: "kojo.owusu@fleet.gh", phone: "024 111 0004", role: "Driver" },
  { id: "rcv-005", name: "Michael Addo", email: "michael.addo@fleet.gh", phone: "024 111 0005", role: "Workshop lead" },
  { id: "rcv-006", name: "Selorm Gbeho", email: "selorm.gbeho@fleet.gh", phone: "024 111 0006", role: "Field dispatcher" },
  { id: "rcv-007", name: "Fiifi Bentum", email: "fiifi.bentum@fleet.gh", phone: "024 111 0007", role: "Fleet supervisor" },
  { id: "rcv-008", name: "Ebo Lamptey", email: "ebo.lamptey@fleet.gh", phone: "024 111 0008", role: "Driver" },
  { id: "rcv-009", name: "Nii Armah Quaye", email: "nii.quaye@fleet.gh", phone: "024 111 0009", role: "Workshop technician" },
];

let sessionReceivers = SEED_RECEIVERS.map((row) => ({ ...row }));

export function toReceiverTree(receiver) {
  if (!receiver) return null;
  return {
    id: receiver.id,
    title: receiver.name,
    children: [
      { id: `${receiver.id}-name`, title: "Name", value: receiver.name },
      { id: `${receiver.id}-email`, title: "Email", value: receiver.email },
      { id: `${receiver.id}-phone`, title: "Phone", value: receiver.phone },
      { id: `${receiver.id}-role`, title: "Role", value: receiver.role },
    ],
  };
}

export function getReceivers() {
  return sessionReceivers.map((row) => ({
    ...row,
    tree: toReceiverTree(row),
  }));
}

export function getReceiverNames() {
  return getReceivers().map((row) => row.name);
}

export function getReceiverByName(name) {
  const needle = String(name || "").trim().toLowerCase();
  if (!needle) return null;
  return getReceivers().find((row) => row.name.toLowerCase() === needle) || null;
}

export function addReceiver(payload = {}) {
  const name = String(payload.name || "").trim();
  const email = String(payload.email || "").trim();
  const phone = String(payload.phone || "").trim();
  const role = String(payload.role || "").trim();

  if (!name) throw new Error("Enter the receiver name.");
  if (!email) throw new Error("Enter the receiver email.");
  if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email)) {
    throw new Error("Enter a valid email address.");
  }
  if (!phone) throw new Error("Enter the receiver phone number.");
  if (!role) throw new Error("Select the receiver role.");

  const duplicate = sessionReceivers.some(
    (row) => row.name.toLowerCase() === name.toLowerCase() || row.email.toLowerCase() === email.toLowerCase(),
  );
  if (duplicate) {
    throw new Error("A receiver with this name or email already exists.");
  }

  const created = {
    id: `rcv-${Date.now().toString(36)}`,
    name,
    email,
    phone,
    role,
    ...Object.fromEntries(
      Object.entries(payload).filter(
        ([key]) => !["id", "name", "email", "phone", "role", "tree"].includes(key),
      ),
    ),
  };
  sessionReceivers = [...sessionReceivers, created];
  return { ...created, tree: toReceiverTree(created) };
}
