import { cn } from "@/lib/utils";
import { HTMLAttributes } from "react";

type BadgeVariant = "purple" | "orange" | "green" | "red" | "gray";

interface BadgeProps extends HTMLAttributes<HTMLSpanElement> {
  variant?: BadgeVariant;
}

const variants: Record<BadgeVariant, string> = {
  purple: "bg-brand-100 text-brand-700",
  orange: "bg-peach-100 text-peach-500",
  green: "bg-emerald-100 text-emerald-700",
  red: "bg-red-100 text-red-600",
  gray: "bg-gray-100 text-gray-600",
};

export default function Badge({ variant = "gray", className, children, ...props }: BadgeProps) {
  return (
    <span
      className={cn(
        "inline-flex items-center gap-1 rounded-full px-2.5 py-0.5 text-xs font-semibold",
        variants[variant],
        className
      )}
      {...props}
    >
      {children}
    </span>
  );
}
