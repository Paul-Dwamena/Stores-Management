import api from "./api";

export const loginUser = (email, password) =>
  api.post("/auth/login", { email, password, userType: "COMPANY" }).then((r) => r.data);

export const registerUser = (userData) =>
  api.post("/auth/register", userData).then((r) => r.data);
