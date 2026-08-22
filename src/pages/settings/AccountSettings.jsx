import React, { useEffect, useState } from "react";
import { Key, Save, User } from "lucide-react";
import PageHeader from "../../components/common/PageHeader";
import Button from "../../components/common/base/Button";
import InputField from "../../components/common/fields/InputField";
import { toast } from "../../components/common/ToastNotification";
import { useAuth } from "../../context/useAuth";
import { joinFullName, splitFullName } from "../../mockdata/org/users";

function profileFromUser(user) {
  const split = splitFullName(user?.name);
  return {
    firstName: user?.firstName || split.firstName,
    lastName: user?.lastName || split.lastName,
    email: user?.email || "",
    phone: user?.phone || "",
  };
}

export default function AccountSettings() {
  const { user, updateProfile } = useAuth();
  const [profile, setProfile] = useState(() => profileFromUser(user));
  const [security, setSecurity] = useState({
    currentPassword: "",
    newPassword: "",
    confirmPassword: "",
  });

  useEffect(() => {
    setProfile(profileFromUser(user));
  }, [user]);

  const saveProfile = (event) => {
    event.preventDefault();
    if (!profile.firstName.trim()) {
      toast.warning("Enter your first name.");
      return;
    }
    if (!profile.lastName.trim()) {
      toast.warning("Enter your last name.");
      return;
    }
    if (!profile.email.trim() || !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(profile.email)) {
      toast.warning("Enter a valid email address.");
      return;
    }
    updateProfile?.({
      firstName: profile.firstName.trim(),
      lastName: profile.lastName.trim(),
      name: joinFullName(profile.firstName, profile.lastName),
      email: profile.email.trim(),
      phone: profile.phone.trim(),
    });
    toast.success("Account details saved.");
  };

  const savePassword = (event) => {
    event.preventDefault();
    if (!security.currentPassword || !security.newPassword) {
      toast.warning("Enter your current and new password.");
      return;
    }
    if (security.newPassword.length < 8) {
      toast.warning("New password must be at least 8 characters.");
      return;
    }
    if (security.newPassword !== security.confirmPassword) {
      toast.warning("New password and confirmation do not match.");
      return;
    }
    setSecurity({ currentPassword: "", newPassword: "", confirmPassword: "" });
    toast.success("Password updated.");
  };

  return (
    <div className="space-y-6 pb-8">
      <PageHeader
        title="Settings"
        description="Manage your account profile and password."
      />

      <form onSubmit={saveProfile} className="card p-6 space-y-5">
        <div className="flex items-center gap-3 pb-4 border-b border-slate-100">
          <div className="h-12 w-12 rounded-lg bg-brand-muted text-brand flex items-center justify-center font-bold">
            {(profile.firstName || "A").charAt(0).toUpperCase()}
          </div>
          <div>
            <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
              <User size={14} className="text-slate-400" />
              Account profile
            </h2>
            <p className="text-[11px] text-slate-500 mt-0.5">
              {user?.role || "Staff"}
            </p>
          </div>
        </div>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <InputField
            id="settingsFirstName"
            label="First name"
            required
            placeholder="Jane"
            value={profile.firstName}
            onChange={(e) => setProfile((current) => ({ ...current, firstName: e.target.value }))}
          />
          <InputField
            id="settingsLastName"
            label="Last name"
            required
            placeholder="Mensah"
            value={profile.lastName}
            onChange={(e) => setProfile((current) => ({ ...current, lastName: e.target.value }))}
          />
          <InputField
            id="settingsEmail"
            label="Email"
            type="email"
            required
            placeholder="you@example.com"
            value={profile.email}
            onChange={(e) => setProfile((current) => ({ ...current, email: e.target.value }))}
          />
          <InputField
            id="settingsPhone"
            label="Phone"
            placeholder="024 000 0000"
            value={profile.phone}
            onChange={(e) => setProfile((current) => ({ ...current, phone: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">
            <Save size={14} />
            Save profile
          </Button>
        </div>
      </form>

      <form onSubmit={savePassword} className="card p-6 space-y-5">
        <h2 className="text-[13px] font-bold text-slate-900 flex items-center gap-2">
          <Key size={14} className="text-slate-400" />
          Password
        </h2>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-4 max-w-2xl">
          <InputField
            id="currentPassword"
            label="Current password"
            type="password"
            required
            placeholder="Enter current password"
            value={security.currentPassword}
            onChange={(e) => setSecurity((current) => ({ ...current, currentPassword: e.target.value }))}
          />
          <div />
          <InputField
            id="newPassword"
            label="New password"
            type="password"
            required
            placeholder="At least 8 characters"
            value={security.newPassword}
            onChange={(e) => setSecurity((current) => ({ ...current, newPassword: e.target.value }))}
          />
          <InputField
            id="confirmPassword"
            label="Confirm new password"
            type="password"
            required
            placeholder="Repeat new password"
            value={security.confirmPassword}
            onChange={(e) => setSecurity((current) => ({ ...current, confirmPassword: e.target.value }))}
          />
        </div>
        <div className="flex justify-end">
          <Button type="submit">Update password</Button>
        </div>
      </form>
    </div>
  );
}
