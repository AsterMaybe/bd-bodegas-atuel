import { forwardRef } from "react";
import { clsx } from "clsx";
import { Check } from "lucide-react";

export const Checkbox = forwardRef(
  ({ className, indeterminate, checked, disabled, id, ...props }, ref) => {
    const checkboxId = id || `checkbox-${Math.random().toString(36).slice(2, 9)}`;
    
    return (
      <label className={clsx("inline-flex items-center cursor-pointer", className)}>
        <input
          ref={ref}
          type="checkbox"
          id={checkboxId}
          checked={checked}
          disabled={disabled}
          className="sr-only peer"
          {...props}
        />
        <div
          className={clsx(
            "relative w-4 h-4 rounded-sm border transition-colors duration-fast",
            "peer-focus-visible:outline-none peer-focus-visible:ring-2 peer-focus-visible:ring-primary peer-focus-visible:ring-offset-2",
            "peer-disabled:opacity-50 peer-disabled:cursor-not-allowed",
            checked
              ? "bg-primary border-primary"
              : indeterminate
              ? "bg-primary border-primary"
              : "border-border hover:border-text-light"
          )}
          aria-hidden="true"
        >
          {checked && (
            <Check className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-3 h-3 text-white" />
          )}
          {indeterminate && !checked && (
            <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-1.5 h-0.5 bg-white rounded" />
          )}
        </div>
      </label>
    );
  }
);

Checkbox.displayName = "Checkbox";
