import React, { useState } from "react";
import { Link } from "react-router-dom";
import { AlertCircle, ArrowLeft, CheckCircle2, Phone } from "lucide-react";
import StoreLogo from "../../components/common/StoreLogo";
import InputField from "../../components/common/fields/InputField";
import { confirmPasswordReset, requestPasswordReset } from "../../services/authService";

const ForgotPassword = () => {
  const [step, setStep] = useState("request");
  const [phone, setPhone] = useState("");
  const [email, setEmail] = useState("");
  const [otp, setOtp] = useState("");
  const [newPassword, setNewPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [message, setMessage] = useState("");
  const [error, setError] = useState("");
  const [loading, setLoading] = useState(false);

  const requestOtp = async (e) => {
    e.preventDefault();
    setError("");
    const trimmed = phone.trim();
    if (!trimmed) {
      setError("Enter the phone number on your account.");
      return;
    }
    setLoading(true);
    try {
      const data = await requestPasswordReset(trimmed);
      setPhone(trimmed);
      setMessage(data?.message || "If an account exists, an OTP has been sent.");
      setStep("confirm");
    } catch (err) {
      setError(err.message || "Unable to request password reset.");
    } finally {
      setLoading(false);
    }
  };

  const confirmReset = async (e) => {
    e.preventDefault();
    setError("");
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email.trim())) {
      setError("Enter a valid email address.");
      return;
    }
    if (otp.trim().length !== 6) {
      setError("Enter the 6-character OTP sent to you.");
      return;
    }
    if (newPassword.length < 8) {
      setError("Password should have at least 8 characters");
      return;
    }
    if (newPassword !== confirmPassword) {
      setError("New password and confirmation do not match.");
      return;
    }
    setLoading(true);
    try {
      const data = await confirmPasswordReset({
        email: email.trim(),
        otp: otp.trim(),
        new_password: newPassword,
      });
      setMessage(data?.message || "Password reset successfully.");
      setStep("done");
    } catch (err) {
      setError(err.message || "Unable to reset password.");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-app flex flex-col justify-center py-12 sm:px-6 lg:px-8">
      <div className="sm:mx-auto sm:w-full sm:max-w-md text-center">
        <div className="flex justify-center mb-8">
          <StoreLogo size="lg" />
        </div>
        <h1 className="text-3xl font-black text-text tracking-tight">Reset password</h1>
        <p className="mt-2 text-sm text-muted">
          {step === "confirm"
            ? "Enter your email, the OTP, and choose a new password."
            : step === "done"
              ? "Your password has been updated."
              : "We'll send a reset OTP if the account exists."}
        </p>
      </div>

      <div className="mt-8 sm:mx-auto sm:w-full sm:max-w-md">
        <div className="bg-surface py-8 px-4 shadow sm:rounded-lg sm:px-10 border border-border">
          {step === "done" ? (
            <div className="text-center space-y-3">
              <CheckCircle2 className="mx-auto text-brand" size={32} />
              <p className="text-sm text-muted">{message}</p>
              <Link to="/login" className="inline-flex items-center gap-1 text-sm font-medium text-brand">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </div>
          ) : step === "confirm" ? (
            <form className="space-y-5" onSubmit={confirmReset}>
              {message ? <p className="text-sm text-muted">{message}</p> : null}
              {error ? (
                <div className="bg-danger-muted border border-danger/20 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle size={16} className="text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              ) : null}
              <InputField
                id="confirmResetPhone"
                label="Phone number"
                readOnly
                value={phone}
                className="bg-slate-100 cursor-not-allowed"
              />
              <InputField
                id="confirmResetEmail"
                label="Email address"
                type="email"
                required
                placeholder="you@example.com"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
              />
              <InputField
                id="confirmResetOtp"
                label="OTP"
                required
                maxLength={6}
                placeholder="6-character OTP"
                value={otp}
                onChange={(e) => setOtp(e.target.value)}
              />
              <InputField
                id="confirmResetPassword"
                label="New password"
                type="password"
                required
                placeholder="At least 8 characters"
                value={newPassword}
                onChange={(e) => setNewPassword(e.target.value)}
              />
              <InputField
                id="confirmResetPasswordRepeat"
                label="Confirm new password"
                type="password"
                required
                placeholder="Repeat new password"
                value={confirmPassword}
                onChange={(e) => setConfirmPassword(e.target.value)}
              />
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50"
              >
                {loading ? "Resetting…" : "Reset password"}
              </button>
              <button
                type="button"
                onClick={() => {
                  setError("");
                  setStep("request");
                }}
                className="w-full text-sm font-medium text-muted"
              >
                Use a different phone number
              </button>
            </form>
          ) : (
            <form className="space-y-6" onSubmit={requestOtp}>
              {error ? (
                <div className="bg-danger-muted border border-danger/20 p-3 rounded-md flex items-center gap-2">
                  <AlertCircle size={16} className="text-danger shrink-0" />
                  <p className="text-sm text-danger">{error}</p>
                </div>
              ) : null}
              <div>
                <label className="block text-sm font-medium text-muted">Phone number</label>
                <div className="relative mt-1">
                  <Phone size={14} className="absolute left-3 top-1/2 -translate-y-1/2 text-subtle" />
                  <input
                    type="tel"
                    required
                    value={phone}
                    onChange={(e) => setPhone(e.target.value)}
                    placeholder="024 000 0000"
                    className="block w-full border border-border rounded-lg py-2.5 pl-9 pr-3 placeholder:text-subtle focus:outline-none focus:ring-2 focus:ring-brand sm:text-sm"
                  />
                </div>
              </div>
              <button
                type="submit"
                disabled={loading}
                className="w-full py-2 px-4 rounded-md text-sm font-medium text-white bg-brand hover:bg-brand-hover disabled:opacity-50"
              >
                {loading ? "Sending…" : "Send reset OTP"}
              </button>
              <Link to="/login" className="flex items-center justify-center gap-1 text-sm font-medium text-muted">
                <ArrowLeft size={14} /> Back to sign in
              </Link>
            </form>
          )}
        </div>
      </div>
    </div>
  );
};

export default ForgotPassword;
