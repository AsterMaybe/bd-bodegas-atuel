import { forwardRef } from "react";
import { clsx } from "clsx";

export const Input = forwardRef(
  ({ className, label, error, hint, readonly, leftIcon, rightIcon, id, ...props }, ref) => {
    const inputId = id || label?.toLowerCase().replace(/\s+/g, "-");
    
    return (
      <div className="w-full">
        {label && (
          <label htmlFor={inputId} className="block text-md font-semibold text-text mb-2">
            {label}
            {props.required && <span className="text-primary ml-1" aria-hidden="true">*</span>}
          </label>
        )}
        <div className="relative">
          {leftIcon && (
            <div className="absolute left-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              {leftIcon}
            </div>
          )}
          <input
            ref={ref}
            id={inputId}
            readOnly={readonly}
            className={clsx(
              "w-full h-11 px-3 rounded-lg border transition-colors duration-fast",
              "placeholder:text-text-light",
              "focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2",
              "disabled:opacity-50 disabled:cursor-not-allowed",
              readonly
                ? "bg-input-readonly border-border text-text-muted cursor-default"
                : "bg-input-bg border-border text-text hover:border-text-light",
              error && "border-error focus-visible:ring-error",
              leftIcon && "pl-10",
              rightIcon && "pr-10",
              className
            )}
            {...props}
          />
          {rightIcon && (
            <div className="absolute right-3 top-1/2 -translate-y-1/2 text-text-light pointer-events-none">
              {rightIcon}
            </div>
          )}
        </div>
        {error && <p className="mt-1.5 text-sm text-error" role="alert">{error}</p>}
        {hint && !error && <p className="mt-1.5 text-sm text-text-light">{hint}</p>}
      </div>
    );
  }
);

Input.displayName = "Input";
