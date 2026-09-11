import React from "react";
import { KeyRound, ShieldCheck } from "lucide-react";
import TabbedPageHub from "../../components/common/TabbedPageHub";
import PasswordResetsList from "./PasswordResetsList";
import VerificationsList from "./VerificationsList";

const SMS_TABS = [
  {
    id: "password-resets",
    label: "Password resets",
    icon: KeyRound,
    description: "SMS OTP codes sent for password reset requests.",
    element: <PasswordResetsList />,
  },
  {
    id: "verifications",
    label: "OTP verifications",
    icon: ShieldCheck,
    description: "SMS OTP codes sent for delivery and other verification flows.",
    element: <VerificationsList />,
  },
];

export default function SmsHub() {
  return (
    <TabbedPageHub
      title="SMS"
      description="Audit trail of SMS OTP messages for password resets and verifications."
      defaultTab="password-resets"
      tabs={SMS_TABS}
    />
  );
}
