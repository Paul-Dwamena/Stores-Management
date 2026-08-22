import React from "react";
import { Package } from "lucide-react";
import { cn } from "../../utils/cn";

const SIZE_MAP = {
  sm: { box: "w-8 h-8", icon: 16, radius: "rounded-lg" },
  md: { box: "w-16 h-16", icon: 28, radius: "rounded-xl" },
  lg: { box: "w-20 h-20", icon: 36, radius: "rounded-2xl" },
};

export default function StoreLogo({ size = "lg", className }) {
  const { box, icon, radius } = SIZE_MAP[size] ?? SIZE_MAP.lg;

  return (
    <div
      className={cn(
        box,
        radius,
        "bg-brand shadow-md flex items-center justify-center text-white",
        className,
      )}
    >
      <Package size={icon} strokeWidth={2.2} />
    </div>
  );
}
