import React from "react";
import { cn } from "../../../utils/cn";

export default function TableRowActions({ children, className }) {
  return (
    <div className={cn("flex justify-end gap-1", className)}>{children}</div>
  );
}
