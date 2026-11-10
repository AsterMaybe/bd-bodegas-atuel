import { clsx } from "clsx";
import { ChevronRight } from "lucide-react";

export function Breadcrumb({ items, className }) {
  return (
    <nav aria-label="Breadcrumb" className={clsx("flex items-center gap-2 text-sm", className)}>
      <ol className="flex items-center gap-2">
        {items.map((item, index) => (
          <li key={item.label} className="flex items-center gap-2">
            {index > 0 && (
              <ChevronRight className="h-3 w-3 text-text-light flex-shrink-0" aria-hidden="true" />
            )}
            {item.href && !item.current ? (
              <a
                href={item.href}
                className={clsx(
                  "transition-colors duration-fast",
                  item.current ? "font-medium text-text" : "text-text-muted hover:text-primary"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </a>
            ) : (
              <span
                className={clsx(
                  item.current ? "font-medium text-text" : "text-text-muted"
                )}
                aria-current={item.current ? "page" : undefined}
              >
                {item.label}
              </span>
            )}
          </li>
        ))}
      </ol>
    </nav>
  );
}
