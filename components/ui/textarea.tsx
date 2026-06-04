import * as React from "react";

import { cn } from "@/lib/utils";
import { countChineseWords } from "@/lib/word-count";

function Textarea({
  className,
  value,
  defaultValue,
  showCount = true,
  ...props
}: React.ComponentProps<"textarea"> & { showCount?: boolean }) {
  const countSource =
    typeof value === "string"
      ? value
      : typeof defaultValue === "string"
        ? defaultValue
        : "";

  return (
    <div className="relative">
      <textarea
        data-slot="textarea"
        value={value}
        defaultValue={defaultValue}
        className={cn(
          "flex field-sizing-content min-h-16 w-full rounded-lg border border-input bg-transparent px-2.5 py-2 text-base transition-colors outline-none placeholder:text-muted-foreground focus-visible:border-ring focus-visible:ring-3 focus-visible:ring-ring/50 disabled:cursor-not-allowed disabled:bg-input/50 disabled:opacity-50 aria-invalid:border-destructive aria-invalid:ring-3 aria-invalid:ring-destructive/20 md:text-sm dark:bg-input/30 dark:disabled:bg-input/80 dark:aria-invalid:border-destructive/50 dark:aria-invalid:ring-destructive/40",
          showCount && "pb-7",
          className,
        )}
        {...props}
      />
      {showCount ? (
        <span className="pointer-events-none absolute bottom-2 right-3 rounded-full bg-background/75 px-2 py-0.5 text-[11px] text-muted-foreground backdrop-blur">
          约 {countChineseWords(countSource).toLocaleString()} 字
        </span>
      ) : null}
    </div>
  );
}

export { Textarea };
