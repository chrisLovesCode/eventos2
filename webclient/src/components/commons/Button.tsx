"use client";

import { cloneElement, forwardRef, isValidElement } from "react";
import type { ButtonHTMLAttributes, HTMLAttributes, ReactElement } from "react";

type Variant = "primary" | "secondary" | "danger" | "success" | "outline" | "ghost";

type Size = "sm" | "md" | "lg";

interface ButtonProps extends ButtonHTMLAttributes<HTMLButtonElement> {
  variant?: Variant;
  size?: Size;
  asChild?: boolean;
}

const base =
  "inline-flex items-center justify-center gap-2 rounded-[var(--radius-button)] font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed focus:outline-none focus:ring-2 focus:ring-primary/50 active:scale-95";

const variants: Record<Variant, string> = {
  primary: "bg-primary text-primary-foreground hover:bg-primary/90",
  secondary: "bg-card text-card-foreground hover:bg-card/90",
  danger: "bg-danger text-danger-foreground hover:bg-danger/90",
  success: "bg-success text-success-foreground hover:bg-success/90",
  outline: "border border-border bg-surface text-foreground hover:bg-muted",
  ghost: "bg-transparent text-foreground hover:bg-muted",
};

const sizes: Record<Size, string> = {
  sm: "px-3 py-1.5 text-sm",
  md: "px-4 py-2 text-sm",
  lg: "px-5 py-3 text-base",
};

export const Button = forwardRef<HTMLButtonElement, ButtonProps>(
  ({ variant = "primary", size = "md", className = "", asChild = false, children, ...props }, ref) => {
    const classes = `${base} ${variants[variant]} ${sizes[size]} ${className}`.trim();

    if (asChild && isValidElement(children)) {
      const child = children as ReactElement<{ className?: string }>;
      const childClassName = child.props.className ?? "";
      return cloneElement(child, {
        className: `${classes} ${childClassName}`.trim(),
        ...(props as HTMLAttributes<HTMLElement>),
      });
    }

    return (
      <button ref={ref} className={classes} {...props}>
        {children}
      </button>
    );
  }
);

Button.displayName = "Button";
