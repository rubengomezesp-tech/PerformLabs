import { useId, type ComponentProps, type ReactNode } from "react";
import { cx } from "./cx";

type BaseFieldProps = {
  label: ReactNode;
  hint?: ReactNode;
  error?: ReactNode;
  className?: string;
};

function FieldShell({
  label,
  hint,
  error,
  className,
  controlId,
  describedBy,
  children,
}: BaseFieldProps & {
  controlId: string;
  describedBy?: string;
  children: ReactNode;
}) {
  return (
    <div className={cx("field", Boolean(error) && "field-error", className)}>
      <label htmlFor={controlId}>{label}</label>
      {children}
      {hint && !error ? (
        <small className="muted" id={describedBy}>
          {hint}
        </small>
      ) : null}
      {error ? (
        <small className="fieldError" id={describedBy}>
          {error}
        </small>
      ) : null}
    </div>
  );
}

export type InputFieldProps = BaseFieldProps &
  Omit<ComponentProps<"input">, "className" | "id">;

/** Labelled text input with hint/error + aria-invalid wiring. */
export function InputField({ label, hint, error, className, ...rest }: InputFieldProps) {
  const id = useId();
  const describedBy = hint || error ? `${id}-desc` : undefined;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      className={className}
      controlId={id}
      describedBy={describedBy}
    >
      <input id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
    </FieldShell>
  );
}

export type TextareaFieldProps = BaseFieldProps &
  Omit<ComponentProps<"textarea">, "className" | "id">;

/** Labelled textarea with hint/error + aria-invalid wiring. */
export function TextareaField({ label, hint, error, className, ...rest }: TextareaFieldProps) {
  const id = useId();
  const describedBy = hint || error ? `${id}-desc` : undefined;
  return (
    <FieldShell
      label={label}
      hint={hint}
      error={error}
      className={className}
      controlId={id}
      describedBy={describedBy}
    >
      <textarea id={id} aria-invalid={error ? true : undefined} aria-describedby={describedBy} {...rest} />
    </FieldShell>
  );
}
