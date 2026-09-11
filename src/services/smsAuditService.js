import api from "./api";
import {
  EMPTY_DISPLAY,
  extractApiErrorDetail,
  formatApiDateTime,
  formatStatusLabel,
} from "../utils/apiResponseHelpers";
import { formatAuditWhen } from "./auditService";

export const SMS_PAGE_SIZE = 10;

export { formatAuditWhen };

const userDisplayName = (user) => {
  if (!user) return EMPTY_DISPLAY;
  const name = [user.first_name, user.last_name].filter(Boolean).join(" ").trim();
  return name || user.email || EMPTY_DISPLAY;
};

const toSmsUser = (user) => {
  if (!user) return null;
  return {
    id: user.id,
    firstName: user.first_name,
    lastName: user.last_name,
    email: user.email || "",
    phone: user.phone || "",
    name: userDisplayName(user),
  };
};

const asList = (data) => {
  if (Array.isArray(data)) return data;
  if (Array.isArray(data?.items)) return data.items;
  if (Array.isArray(data?.results)) return data.results;
  if (Array.isArray(data?.data)) return data.data;
  return [];
};

/** Password-reset SMS OTP rows from GET /audit/sms/password-resets */
export const toPasswordResetOtp = (row = {}) => {
  const user = toSmsUser(row.user);
  return {
    id: row.id,
    userId: row.user_id ?? user?.id ?? null,
    otp: row.otp != null ? String(row.otp) : "",
    attempts: row.attempts ?? 0,
    expiresAt: row.expires_at || null,
    usedAt: row.used_at || null,
    createdAt: row.created_at || null,
    user,
    status: row.used_at ? "Used" : "Unused",
  };
};

/**
 * OTP verification SMS rows from GET /audit/sms/verifications.
 * { id, otp, phone, otp_type, is_verified, expires_at, verified_at, created_at }
 */
export const toSmsVerification = (row = {}) => {
  const otpType = row.otp_type || "";
  const isVerified = Boolean(row.is_verified);
  return {
    id: row.id,
    phone: row.phone || "",
    otp: row.otp != null ? String(row.otp) : "",
    otpType,
    otpTypeLabel: otpType ? formatStatusLabel(otpType) : EMPTY_DISPLAY,
    expiresAt: row.expires_at || null,
    verifiedAt: row.verified_at || null,
    createdAt: row.created_at || null,
    isVerified,
    status: isVerified ? "Verified" : "Pending",
  };
};

export const formatSmsWhen = (iso) => {
  if (!iso) return EMPTY_DISPLAY;
  const formatted = formatApiDateTime(iso);
  if (formatted !== EMPTY_DISPLAY) return formatted;
  return formatAuditWhen(iso);
};

export const listSmsPasswordResets = async () => {
  try {
    const { data } = await api.get("/audit/sms/password-resets");
    return asList(data).map(toPasswordResetOtp);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load password-reset SMS audit."));
    error.status = err?.response?.status;
    throw error;
  }
};

export const listSmsVerifications = async () => {
  try {
    const { data } = await api.get("/audit/sms/verifications");
    return asList(data).map(toSmsVerification);
  } catch (err) {
    const error = new Error(extractApiErrorDetail(err, "Unable to load OTP verification SMS audit."));
    error.status = err?.response?.status;
    throw error;
  }
};
