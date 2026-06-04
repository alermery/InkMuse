"use client";

import type { ComponentProps } from "react";
import { Button } from "@/components/ui/button";
import { Tooltip, TooltipContent, TooltipTrigger } from "@/components/ui/tooltip";

type TooltipButtonProps = ComponentProps<typeof Button> & {
  tooltip: string;
};

export function TooltipButton({ tooltip, "aria-label": ariaLabel, ...props }: TooltipButtonProps) {
  return (
    <Tooltip>
      <TooltipTrigger
        render={
          <Button
            aria-label={ariaLabel ?? tooltip}
            title={tooltip}
            {...props}
          />
        }
      />
      <TooltipContent>{tooltip}</TooltipContent>
    </Tooltip>
  );
}
