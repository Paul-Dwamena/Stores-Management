import React from "react";
import Label from "../base/Label";
import Input from "../base/Input";
import { cn } from "../../../utils/cn";

const InputField = React.forwardRef(
  ({ label, id, error, className, containerClassName, required, ...props }, ref) => {
    return (
      <div className={cn("space-y-1.5", containerClassName)}>
        {label && (
          <Label htmlFor={id} className={error ? "text-red-500" : ""}>
            {label}
            {required ? (
              <span className="normal-case !text-red-500" aria-hidden="true">
                {" "}
                *
              </span>
            ) : null}
          </Label>
        )}
        <Input
          id={id}
          ref={ref}
          className={cn(
            error ? "border-red-500 focus:border-red-500 bg-red-50" : "",
            className,
          )}
          {...props}
        />
        {error && (
          <p className="text-[10px] font-medium text-red-500 mt-1">{error}</p>
        )}
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
