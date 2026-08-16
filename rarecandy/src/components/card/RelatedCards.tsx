import { CardTile } from "@/components/ui/CardTile";
import type { Card } from "@/lib/types";

interface RelatedCardsProps {
  cards: Card[];
}

export function RelatedCards({ cards }: RelatedCardsProps) {
  if (!cards.length) return null;

  return (
    <div className="grid grid-cols-2 sm:grid-cols-4 gap-4">
      {cards.map((card) => (
        <CardTile key={card.id} card={card} variant="compact" />
      ))}
    </div>
  );
}
