import { UserRound } from "lucide-react";
import { Badge } from "@/components/ui/badge";
import { Card, CardContent, CardHeader, CardTitle } from "@/components/ui/card";
import type { Character } from "@/types";

export function CharacterCard({ character }: { character: Character }) {
  return (
    <Card className="glass-panel border-white/10 bg-white/6 transition hover:-translate-y-1 hover:shadow-[0_20px_50px_rgba(30,41,59,0.26)]">
      <CardHeader>
        <CardTitle className="flex items-center justify-between text-base">
          <span className="flex items-center gap-2">
            <UserRound className="h-4 w-4 text-primary" />
            {character.name}
          </span>
          <Badge className="rounded-full bg-primary/18 text-primary">
            {character.role}
          </Badge>
        </CardTitle>
      </CardHeader>
      <CardContent className="space-y-3 text-sm text-foreground/75">
        <p>{character.background}</p>
        <div className="flex flex-wrap gap-2">
          {character.personality.map((trait) => (
            <Badge
              key={trait}
              variant="secondary"
              className="rounded-full bg-white/8 text-foreground/70"
            >
              {trait}
            </Badge>
          ))}
        </div>
        <p className="text-foreground/55">动机：{character.motivation}</p>
      </CardContent>
    </Card>
  );
}
