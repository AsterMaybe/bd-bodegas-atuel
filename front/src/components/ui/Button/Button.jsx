import { forwardRef } from "react";
import { clsx } from "clsx";

export const Button = forwardRef(
  ({ className, variant = "primary", size = "md", loading, leftIcon, rightIcon, disabled, children, ...props }, ref) => {
    const baseStyles = "inline-flex items-center justify-center font-semibold transition-colors duration-fast rounded-lg focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2 disabled:opacity-50 disabled:cursor-not-allowed";
    
    const variants = {
      primary: "bg-primary text-white hover:bg-primary/90 active:bg-primary/80",
      secondary: "bg-white border border-border text-text hover:bg-hover active:bg-active",
      ghost: "text-text-muted hover:bg-hover hover:text-text active:bg-active",
      danger: "bg-error text-white hover:bg-error/90 active:bg-error/80",
    };
    
    const sizes = {
      sm: "px-4 py-2 text-sm gap-2",
      md: "px-5 py-2.5 text-md gap-2",
      lg: "px-6 py-3 text-lg gap-3",
    };

    return (
      <button
        ref={ref}
        className={clsx(baseStyles, variants[variant], sizes[size], className)}
        disabled={disabled || loading}
        {...props}
      >
        {loading && (
          <svg className="animate-spin h-4 w-4" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
            <circle className="opacity-25" cx="12" cy="12" r="10" strokeWidth="4" />
            <path className="opacity-75" d="M12 2a10 10 0 0 1 10 10" />
          </svg>
        )}
        {!loading && leftIcon && <span className="flex-shrink-0">{leftIcon}</span>}
        <span>{children}</span>
        {!loading && rightIcon && <span className="flex-shrink-0">{rightIcon}</span>}
      </button>
    );
  }
);

Button.displayName = "Button";
