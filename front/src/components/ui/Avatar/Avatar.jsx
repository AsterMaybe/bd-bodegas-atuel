import { clsx } from "clsx";

const sizeClasses = {
  sm: "w-6 h-6 text-xs",
  md: "w-8 h-8 text-sm",
  lg: "w-10 h-10 text-base",
};

export function Avatar({ user, size = "md", className }) {
  const initials = user?.initials || user?.nombre?.split(" ").map((n) => n[0]).join("").toUpperCase() || "?";
  const bgColor = user ? "bg-primary-light text-primary" : "bg-border text-text-light";
  
  return (
    <div
      className={clsx(
        "flex-center rounded-full font-medium",
        sizeClasses[size],
        bgColor,
        className
      )}
      aria-label={user?.nombre || "Usuario"}
    >
      {initials}
    </div>
  );
}
