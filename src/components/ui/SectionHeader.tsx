import type { ReactNode } from "react";
import { cn } from "@/lib/utils";

export function SectionHeader({
  eyebrow,
  title,
  description,
  action,
  className,
}: {
  eyebrow?: string;
  title: ReactNode;
  description?: ReactNode;
  action?: ReactNode;
  className?: string;
}) {
  return (
    <div className={cn("mb-5", className)}>
      <div className="flex items-end justify-between gap-4">
        <div className="min-w-0">
          {eyebrow && <p className="eyebrow mb-2">{eyebrow}</p>}
          <h2 className="display-md text-foreground truncate">{title}</h2>
        </div>
        {action && <div className="shrink-0 pb-1">{action}</div>}
      </div>
      {description && <p className="mt-2 text-sm text-muted-foreground max-w-2xl">{description}</p>}
    </div>
  );
}
