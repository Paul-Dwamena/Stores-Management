import React, { useState } from "react";
import { Eye, EyeOff } from "lucide-react";
import Label from "../base/Label";
import Input from "../base/Input";
import { cn } from "../../../utils/cn";

const InputField = React.forwardRef(
  ({ label, id, error, className, containerClassName, required, type, ...props }, ref) => {
    const [passwordVisible, setPasswordVisible] = useState(false);
    const isPassword = type === "password";

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
        <div className="relative">
          <Input
            id={id}
            ref={ref}
            type={isPassword && passwordVisible ? "text" : type}
            className={cn(
              error ? "border-red-500 focus:border-red-500 bg-red-50" : "",
              isPassword && "pr-10",
              className,
            )}
            {...props}
          />
          {isPassword ? (
            <button
              type="button"
              onClick={() => setPasswordVisible((visible) => !visible)}
              className="absolute right-2 top-1/2 -translate-y-1/2 p-1 text-slate-400 hover:text-slate-600"
              aria-label={passwordVisible ? "Hide password" : "Show password"}
            >
              {passwordVisible ? <EyeOff size={16} /> : <Eye size={16} />}
            </button>
          ) : null}
        </div>
        <p
          className={cn(
            "mt-1 min-h-[14px] text-[10px] font-medium leading-[14px]",
            error ? "text-red-500" : "invisible",
          )}
          aria-live="polite"
        >
          {error || "\u00A0"}
        </p>
      </div>
    );
  },
);

InputField.displayName = "InputField";

export default InputField;
