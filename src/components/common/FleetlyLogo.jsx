import React from "react";
import { cn } from "../../utils/cn";
import FleetlyCarMark from "./FleetlyCarMark";

const SIZE_MAP = {
  sm: { box: "w-8 h-8", svg: 20, border: "border" },
  md: { box: "w-16 h-16", svg: 32, border: "border-2" },
  lg: { box: "w-20 h-20", svg: 40, border: "border-4" },
};

const FleetlyLogo = ({ size = "lg", className }) => {
  const { box, svg, border } = SIZE_MAP[size] ?? SIZE_MAP.lg;

  return (
    <div
      className={cn(
        box,
        "bg-brand rounded-2xl shadow-xl flex items-center justify-center relative overflow-hidden border-white/20 text-white",
        border,
        size === "sm" && "rounded-lg shadow-md",
        className,
      )}
    >
      <FleetlyCarMark size={svg} animate="loop" brandStyle />

      <div className="absolute inset-0 opacity-10 pointer-events-none">
        <div className="absolute top-1/2 left-0 w-full h-px bg-white animate-[speed-line_3s_linear_infinite]" />
      </div>
    </div>
  );
};

export default FleetlyLogo;
