import { Lightbulb, Tags } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { InspirationEntry } from "@/types";

export function InspirationCard({ entry }: { entry: InspirationEntry }) {
  return (
    <Card className="glass-panel border-white/10 bg-white/6 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(30,41,59,0.26)]">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <Lightbulb className="h-4 w-4 text-primary" />
          {entry.type}
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-4">
        <p className="serif-body text-sm leading-7 text-foreground/78">
          {entry.content}
        </p>
        <div className="flex flex-wrap gap-2">
          <span className="flex items-center gap-1 text-xs text-foreground/45">
            <Tags className="h-3.5 w-3.5" />
            标签
          </span>
          {entry.tags.map((tag) => (
            <Badge
              key={tag}
              variant="secondary"
              className="rounded-full bg-white/8 text-foreground/70"
            >
              {tag}
            </Badge>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}
