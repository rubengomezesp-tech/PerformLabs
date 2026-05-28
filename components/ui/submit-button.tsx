"use client";

import { useEffect, useRef, type ComponentProps } from "react";
import { useFormStatus } from "react-dom";
import type { ButtonSize, ButtonVariant } from "./button";
import { cx } from "./cx";
import { useToast, type ToastTone } from "./toast";

export type SubmitButtonProps = Omit<ComponentProps<"button">, "className" | "type"> & {
  variant?: ButtonVariant;
  size?: ButtonSize;
  className?: string;
  /** Toast fired when the surrounding form action completes successfully. */
  successToast?: string;
  successTone?: ToastTone;
};

/**
 * Submit button wired to the parent <form> status: shows the loading spinner
 * while pending and (optionally) fires a toast once the action completes.
 * Drop-in replacement for `<button className="btn …" type="submit">`.
 */
export function SubmitButton({
  variant = "secondary",
  size = "md",
  className,
  successToast,
  successTone = "success",
  disabled,
  children,
  ...rest
}: SubmitButtonProps) {
  const { pending } = useFormStatus();
  const toast = useToast();
  const wasPending = useRef(false);

  useEffect(() => {
    if (wasPending.current && !pending && successToast) {
      toast.show(successToast, { tone: successTone });
    }
    wasPending.current = pending;
  }, [pending, successToast, successTone, toast]);

  return (
    <button
      type="submit"
      className={cx("btn", variant !== "secondary" ? variant : null, size !== "md" ? size : null, className)}
      data-loading={pending || undefined}
      disabled={pending || disabled}
      {...rest}
    >
      {children}
    </button>
  );
}
