import * as React from "react";
import { cn } from "@/lib/utils";

/**
 * Native select styled to match the design system — deliberately native for
 * the wilaya/commune pickers: faster on low-end Android devices (the
 * majority of Algerian mobile traffic) and better for long option lists.
 */
const Select = React.forwardRef<HTMLSelectElement, React.SelectHTMLAttributes<HTMLSelectElement>>(
  ({ className, children, ...props }, ref) => (
    <select
      ref={ref}
      className={cn(
        "flex h-10 w-full rounded-xl border bg-white px-3 py-2 text-sm focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-gold disabled:opacity-50",
        className
      )}
      {...props}
    >
      {children}
    </select>
  )
);
Select.displayName = "Select";

export { Select };
