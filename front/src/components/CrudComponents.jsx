import { useState } from "react";
import { clsx } from "clsx";
import { Select, Input, Button } from "./ui";

export function CrudForm({
  title,
  description,
  fields,
  onSubmit,
  onCancel,
  isLoading,
  isSubmitting,
  error,
  className,
}) {
  return (
    <form onSubmit={onSubmit} className={clsx("space-y-6", className)}>
      {description && <p className="text-md text-text-muted">{description}</p>}

      {fields.map((field) => (
        <div key={field.name} className={clsx(field.className, field.grid ? `grid grid-cols-1 ${field.grid}` : "")}>
          {field.type === "select" ? (
            <Select
              label={field.label}
              options={field.options}
              placeholder={field.placeholder}
              error={field.error}
              required={field.required}
              value={field.value}
              onChange={field.onChange}
            />
          ) : field.type === "textarea" ? (
            <div className="w-full">
              <label className="block text-md font-semibold text-text mb-2">{field.label}{field.required && <span className="text-primary ml-1">*</span>}</label>
              <textarea
                value={field.value}
                onChange={field.onChange}
                rows={field.rows || 4}
                className="w-full px-3 rounded-lg border border-border bg-white text-text placeholder:text-text-light focus-visible:ring-2 focus-visible:ring-primary focus-visible:ring-offset-2"
                placeholder={field.placeholder}
              />
            </div>
          ) : field.type === "checkbox" ? (
            <label className="flex items-center gap-2 cursor-pointer">
              <input
                type="checkbox"
                checked={field.value}
                onChange={field.onChange}
                className="w-4 h-4 rounded border-border text-primary focus:ring-primary"
              />
              <span className="text-sm font-normal text-text">{field.label}</span>
            </label>
          ) : (
            <Input
              label={field.label}
              type={field.type || "text"}
              placeholder={field.placeholder}
              error={field.error}
              required={field.required}
              value={field.value}
              onChange={field.onChange}
              leftIcon={field.leftIcon}
              rightIcon={field.rightIcon}
              readOnly={field.readOnly}
            />
          )}
        </div>
      ))}

      <div className="flex items-center justify-end gap-3 border-t border-border pt-5">
        <Button type="button" variant="secondary" onClick={onCancel} disabled={isSubmitting}>
          Cancelar
        </Button>
        <Button
          type="submit"
          loading={isSubmitting}
          rightIcon={<svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 10l7-7m0 0l7 7m-7 7l-7 7"/></svg>}
        >
          {isSubmitting ? "Guardando..." : "Guardar"}
        </Button>
      </div>
    </form>
  );
}