/** Issuance receivers — anyone who can collect or dispatch items. */

export const RECEIVER_ROLE_OPTIONS = [
  "Customer",
  "Walk-in customer",
  "Driver",
  "Contractor",
  "Field dispatcher",
];

const SEED_RECEIVERS = [
  { id: "rcv-001", name: "Akua Boateng", email: "akua.boateng@example.com", phone: "024 220 1101", role: "Customer" },
  { id: "rcv-002", name: "Yaw Darko", email: "yaw.darko@example.com", phone: "024 220 1102", role: "Walk-in customer" },
  { id: "rcv-003", name: "Abena Sarpong", email: "abena.sarpong@example.com", phone: "024 220 1103", role: "Customer" },
  { id: "rcv-004", name: "Kofi Ansah", email: "kofi.ansah@fleet.gh", phone: "024 220 1104", role: "Field dispatcher" },
  { id: "rcv-005", name: "Nana Osei", email: "nana.osei@fleet.gh", phone: "024 220 1105", role: "Driver" },
  { id: "rcv-006", name: "Kwame Frimpong", email: "kwame.frimpong@fleet.gh", phone: "024 220 1106", role: "Field dispatcher" },
  { id: "rcv-007", name: "Akosua Dede", email: "akosua.dede@fleet.gh", phone: "024 220 1107", role: "Driver" },
  { id: "rcv-008", name: "Efua Darko", email: "efua.darko@fleet.gh", phone: "024 220 1108", role: "Contractor" },
  { id: "rcv-009", name: "Adjei Boateng", email: "adjei.boateng@fleet.gh", phone: "024 220 1109", role: "Contractor" },
  { id: "rcv-010", name: "Selorm Gbeho", email: "selorm.gbeho@fleet.gh", phone: "024 111 0006", role: "Field dispatcher" },
  { id: "rcv-011", name: "Michael Addo", email: "michael.addo@fleet.gh", phone: "024 111 0005", role: "Driver" },
  { id: "rcv-012", name: "Ebo Lamptey", email: "ebo.lamptey@fleet.gh", phone: "024 111 0008", role: "Driver" },
  { id: "rcv-013", name: "Nii Armah Quaye", email: "nii.quaye@fleet.gh", phone: "024 111 0009", role: "Contractor" },
  { id: "rcv-014", name: "Afia Mensima", email: "afia.mensima@example.com", phone: "024 220 1114", role: "Customer" },
  { id: "rcv-015", name: "Kojo Baffoe", email: "kojo.baffoe@example.com", phone: "024 220 1115", role: "Walk-in customer" },
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

export function getReceiverContact(name) {
  const row = getReceiverByName(name);
  return {
    name: row?.name || String(name || "").trim(),
    email: row?.email || "",
    phone: row?.phone || "",
    store: row?.store || "",
    role: row?.role || "",
  };
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
    throw new Error("A person with this name or email already exists.");
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
