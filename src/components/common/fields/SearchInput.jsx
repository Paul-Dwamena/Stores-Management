import React from "react";
import { Search } from "lucide-react";
import Input from "../base/Input";
import { cn } from "../../../utils/cn";

const SearchInput = React.forwardRef(
  (
    { className, containerClassName, placeholder = "Search...", ...props },
    ref,
  ) => {
    return (
      <div className={cn("relative w-full max-w-sm", containerClassName)}>
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400 h-4 w-4 inline-flex pointer-events-none" />
        <Input
          ref={ref}
          type="text"
          placeholder={placeholder}
          className={cn(
            "pl-10 py-1.5 focus:bg-white bg-transparent",
            className,
          )}
          {...props}
        />
      </div>
    );
  },
);

SearchInput.displayName = "SearchInput";

export default SearchInput;
