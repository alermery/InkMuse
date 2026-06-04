import { GitBranchPlus, ListTree } from "lucide-react";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Chapter } from "@/types";

export function OutlineTree({ chapters }: { chapters: Chapter[] }) {
  return (
    <Card className="glass-panel border-white/10 bg-white/6">
      <CardHeader>
        <CardTitle className="flex items-center gap-2 text-base">
          <ListTree className="h-4 w-4 text-primary" />
          章节结构
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3">
        {chapters.map((chapter) => (
          <div
            key={chapter.id}
            className="rounded-2xl border border-white/10 bg-black/10 p-4"
          >
            <div className="flex items-center justify-between gap-3">
              <div>
                <p className="text-sm font-medium">{chapter.title}</p>
                <p className="mt-1 text-xs text-foreground/50">
                  第 {chapter.order} 章 · {chapter.status}
                </p>
              </div>
              <GitBranchPlus className="h-4 w-4 text-primary" />
            </div>
          </div>
        ))}
      </CardContent>
    </Card>
  );
}
