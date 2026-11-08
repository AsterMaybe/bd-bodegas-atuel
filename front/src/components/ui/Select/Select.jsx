import { forwardRef } from "react";
import { clsx } from "clsx";
import { ChevronDown } from "lucide-react";

export const Select = forwardRef(
  ({ className, label, error, hint, options, placeholder, disabled, readonly, id, ref: forwardedRef, ...props }, ref) => {
    const selectId = id || label?.toLowerCase().replace(/\s+/g, "-");
    const isDisabled = disabled || readonly;
    // Use forwardedRef (from forwardRef) or ref from props (from register)
    const selectRef = forwardedRef || ref;
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={selectId} className="block text-md font-semibold text-text mb-2">
            {label}
            {props.required && <span className="text-primary ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          <select
            ref={selectRef}
            id={selectId}
            disabled={isDisabled}
            className={clsx(
              "w-full h-11 px-3 pr-10 rounded-lg border appearance-none transition-colors duration-fast",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              isDisabled
                ? "bg-input-readonly border-border text-text-muted cursor-default"
                : "bg-input-bg border-border text-text hover:border-text-light",
              error && "border-error focus-visible:ring-error",
              className
            )}
            {...props}
          >
            {placeholder && (
              <option value="" disabled selected hidden>
                {placeholder}
              </option>
            )}
            {options.map((option) => (
              <option key={option.value} value={option.value}>
                {option.label}
              </option>
            ))}
          </select>
          {!isDisabled && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 pointer-events-none text-text-light">
              <ChevronDown className="h-4 w-4" />
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-text-light">{hint}</p>}
      </div>
    );
  }
);

Select.displayName = "Select";
