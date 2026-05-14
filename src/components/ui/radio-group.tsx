"use client";

import * as React from "react";
import * as RadioGroupPrimitive from "@radix-ui/react-radio-group";
import { Check } from "lucide-react";
import { cn } from "@/lib/utils";

export const RadioGroup = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Root>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Root>
>(({ className, ...props }, ref) => (
  <RadioGroupPrimitive.Root
    ref={ref}
    className={cn("grid gap-2", className)}
    {...props}
  />
));
RadioGroup.displayName = "RadioGroup";

export const RadioGroupItem = React.forwardRef<
  React.ElementRef<typeof RadioGroupPrimitive.Item>,
  React.ComponentPropsWithoutRef<typeof RadioGroupPrimitive.Item> & { label: string; hint?: string }
>(({ className, label, hint, ...props }, ref) => (
  <label
    className={cn(
      "flex items-center gap-3 rounded-lg border border-[var(--border)] bg-[var(--card)] px-4 py-3 cursor-pointer transition-colors hover:bg-[var(--muted)] has-[[data-state=checked]]:border-[var(--primary)] has-[[data-state=checked]]:bg-[var(--primary)]/10",
      className
    )}
  >
    <RadioGroupPrimitive.Item
      ref={ref}
      {...props}
      className="aspect-square h-5 w-5 rounded-full border border-[var(--border)] data-[state=checked]:border-[var(--primary)] data-[state=checked]:bg-[var(--primary)] flex items-center justify-center focus-visible:outline-none focus-visible:ring-2 focus-visible:ring-[var(--ring)]"
    >
      <RadioGroupPrimitive.Indicator className="flex items-center justify-center">
        <Check className="h-3 w-3 text-white" strokeWidth={3} />
      </RadioGroupPrimitive.Indicator>
    </RadioGroupPrimitive.Item>
    <div className="flex flex-col leading-tight">
      <span className="text-sm font-medium text-[var(--foreground)]">{label}</span>
      {hint && <span className="text-xs text-[var(--muted-foreground)]">{hint}</span>}
    </div>
  </label>
));
RadioGroupItem.displayName = "RadioGroupItem";
