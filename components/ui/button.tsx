import Link from "next/link";
import type { ComponentProps } from "react";
import { cx } from "./cx";

export type ButtonVariant = "primary" | "secondary" | "ghost" | "danger";
export type ButtonSize = "md" | "sm" | "lg";

type SharedProps = {
  variant?: ButtonVariant;
  size?: ButtonSize;
  /** Shows a spinner and blocks interaction (maps to CSS [data-loading]). */
  loading?: boolean;
  className?: string;
};

function buttonClass({ variant, size, className }: SharedProps) {
  return cx(
    "btn",
    variant && variant !== "secondary" ? variant : null,
    size && size !== "md" ? size : null,
    className,
  );
}

type ButtonAsButton = SharedProps &
  Omit<ComponentProps<"button">, "className"> & { href?: undefined };

type ButtonAsLink = SharedProps &
  Omit<ComponentProps<typeof Link>, "className"> & { href: ComponentProps<typeof Link>["href"] };

export type ButtonProps = ButtonAsButton | ButtonAsLink;

/**
 * Canonical button primitive. Renders a Next.js <Link> when `href` is set,
 * otherwise a native <button>. Variants/sizes/loading map to the design-token
 * button styles in globals.css.
 */
export function Button(props: ButtonProps) {
  const { variant = "secondary", size = "md", loading = false, className, ...rest } = props;
  const cls = buttonClass({ variant, size, className });

  if ("href" in props && props.href !== undefined) {
    const { href, children, ...linkRest } = rest as ButtonAsLink;
    return (
      <Link href={href} className={cls} data-loading={loading || undefined} {...linkRest}>
        {children}
      </Link>
    );
  }

  const { children, disabled, ...buttonRest } = rest as ButtonAsButton;
  return (
    <button
      className={cls}
      data-loading={loading || undefined}
      disabled={disabled || loading}
      {...buttonRest}
    >
      {children}
    </button>
  );
}
