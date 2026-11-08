import { clsx } from "clsx";

const variantStyles = {
  default: "bg-border text-text-muted",
  success: "bg-success-light text-success",
  warning: "bg-warning-light text-warning",
  error: "bg-error-light text-error",
  primary: "bg-primary-light text-primary",
};

export function Badge({ children, variant = "default", className, dot = false }) {
  return (
    <span
      className={clsx(
        "inline-flex items-center gap-1.5 px-2.5 py-1 rounded-full text-xs font-medium",
        variantStyles[variant],
        className
      )}
    >
      {dot && (
        <span
          className={clsx(
            "w-1.5 h-1.5 rounded-full",
            variant === "success" && "bg-success",
            variant === "warning" && "bg-warning",
            variant === "error" && "bg-error",
            variant === "primary" && "bg-primary",
            variant === "default" && "bg-text-light"
          )}
        />
      )}
      {children}
    </span>
  );
}
