export const DEMO_TOKEN = "fake_token";

export const isDemoToken = (token) => token === DEMO_TOKEN;

export const isDemoSession = () => {
  try {
    const raw = localStorage.getItem("userInfo");
    if (!raw) return false;
    const { token } = JSON.parse(raw);
    return isDemoToken(token);
  } catch {
    return false;
  }
};

export const buildDemoStoreSession = (email) => ({
  _id: "demo-store-admin",
  id: "demo-store-admin",
  name: "Store Administrator",
  email: email?.trim() || "admin@stores.local",
  role: "admin",
  token: DEMO_TOKEN,
});

export const normalizeStoreLoginResponse = (data, email) => {
  if (!data) return buildDemoStoreSession(email);
  if (data.token && data.user) {
    const user = data.user;
    return {
      ...user,
      _id: user.id ?? user._id ?? "store-user",
      id: user.id ?? user._id,
      email: user.email ?? email,
      name:
        user.name ??
        user.fullName ??
        ([user.firstName, user.lastName].filter(Boolean).join(" ") || "Store Administrator"),
      role: user.role ?? "admin",
      token: data.token,
    };
  }
  if (data.token) {
    return {
      ...data,
      _id: data._id ?? data.id ?? "store-user",
      email: data.email ?? email,
      role: data.role ?? "admin",
    };
  }
  return data;
};
