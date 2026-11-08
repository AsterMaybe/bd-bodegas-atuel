import { forwardRef } from "react";
import { clsx } from "clsx";

export const Card = forwardRef(
  ({ className, variant = "default", padding = "md", children, ...props }, ref) => {
    const variants = {
      default: "bg-card",
      bordered: "bg-card border border-border",
      elevated: "bg-card shadow-md",
    };
    
    const paddings = {
      none: "",
      sm: "p-4",
      md: "p-5",
      lg: "p-6",
    };

    return (
      <div
        ref={ref}
        className={clsx("rounded-2xl", variants[variant], paddings[padding], className)}
        {...props}
      >
        {children}
      </div>
    );
  }
);

Card.displayName = "Card";

export const CardHeader = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("mb-4", className)} {...props}>
      {children}
    </div>
  )
);
CardHeader.displayName = "CardHeader";

export const CardTitle = forwardRef(
  ({ className, children, ...props }, ref) => (
    <h3 ref={ref} className={clsx("text-lg font-semibold text-text", className)} {...props}>
      {children}
    </h3>
  )
);
CardTitle.displayName = "CardTitle";

export const CardDescription = forwardRef(
  ({ className, children, ...props }, ref) => (
    <p ref={ref} className={clsx("text-sm text-text-muted mt-1", className)} {...props}>
      {children}
    </p>
  )
);
CardDescription.displayName = "CardDescription";

export const CardContent = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx(className)} {...props}>
      {children}
    </div>
  )
);
CardContent.displayName = "CardContent";

export const CardFooter = forwardRef(
  ({ className, children, ...props }, ref) => (
    <div ref={ref} className={clsx("mt-4 pt-4 border-t border-border", className)} {...props}>
      {children}
    </div>
  )
);
CardFooter.displayName = "CardFooter";
