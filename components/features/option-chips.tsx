"use client";

import { Check } from "lucide-react";
import { Button } from "@/components/ui/button";
import { cn } from "@/lib/utils";

export function OptionChips({
  options,
  value,
  onChange,
  multi = false,
}: {
  options: string[];
  value: string[];
  onChange: (value: string[]) => void;
  multi?: boolean;
}) {
  function toggle(option: string) {
    if (multi) {
      onChange(
        value.includes(option)
          ? value.filter((item) => item !== option)
          : [...value, option],
      );
      return;
    }

    onChange([option]);
  }

  return (
    <div className="flex flex-wrap gap-2">
      {options.map((option) => {
        const selected = value.includes(option);

        return (
          <Button
            key={option}
            type="button"
            size="sm"
            variant={selected ? "default" : "outline"}
            className={cn(
              "h-8 rounded-full border-white/10",
              selected && "shadow-[0_0_20px_rgba(139,92,246,0.16)]",
            )}
            onClick={() => toggle(option)}
          >
            {selected ? <Check className="h-3.5 w-3.5" /> : null}
            {option}
          </Button>
        );
      })}
    </div>
  );
}
