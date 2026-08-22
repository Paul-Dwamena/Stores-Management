import React from "react";
import { cn } from "../../../utils/cn";

const Label = React.forwardRef(({ className, children, ...props }, ref) => {
  return (
    <label
      ref={ref}
      className={cn(
        "block text-[10px] font-bold text-slate-500 uppercase tracking-wider ",
        className,
      )}
      {...props}
    >
      {children}
    </label>
  );
});

Label.displayName = "Label";

export default Label;
