import { AnimatePresence } from 'framer-motion';
import type { ICard, IComment } from '../../store/types';
import { CardItem } from './CardItem';
import { PhotoCardItem } from './PhotoCardItem';

interface Props {
  cards: ICard[];
  nodeWidth: number;
  nodeHeight: number;
  nodeColour: string;
  /** Canvas-space X of the parent node (for portal positioning) */
  nodeCanvasX: number;
  /** Canvas-space Y of the parent node (for portal positioning) */
  nodeCanvasY: number;
  svgRef: React.RefObject<SVGSVGElement | null>;
  onEditCard: (cardId: string, from: Partial<ICard>, to: Partial<ICard>) => void;
  onDeleteCard: (cardId: string, card: ICard) => void;
  onAddComment: (cardId: string, c: IComment) => void;
  onDeleteComment: (cardId: string, commentId: string) => void;
  onEditComment: (cardId: string, commentId: string, text: string) => void;
}

const CARD_GAP = 20;
const STACK_TOP_OFFSET = 32;  // gap between bubble bottom and first card

function estimateCardHeight(card: ICard, nodeWidth: number): number {
  if (card.type === 'photo') {
    const w = card.cardWidth ?? nodeWidth;
    const imgH = Math.round((w - 20) / (card.imageAspectRatio ?? 4 / 3));
    const capH = card.caption ? Math.max(32, Math.ceil(card.caption.length / 28) * 20 + 16) : 32;
    return 32 + 8 + imgH + 14 + capH; // TITLE_H + TOP_PAD + imgH + BOT_PAD + capH
  }
  return 68;
}

export function CardStack({
  cards, nodeWidth, nodeHeight, nodeColour,
  nodeCanvasX, nodeCanvasY, svgRef,
  onEditCard, onDeleteCard, onAddComment, onDeleteComment, onEditComment,
}: Props) {
  return (
    <AnimatePresence>
      {cards.map((card, i) => {
        const yOffset = nodeHeight + STACK_TOP_OFFSET
          + cards.slice(0, i).reduce((acc, c) => acc + estimateCardHeight(c, nodeWidth) + CARD_GAP, 0);

        return (
          <g key={card.id} transform={`translate(0, ${yOffset})`}>
            {card.type === 'photo' ? (
              <PhotoCardItem
                card={card}
                nodeWidth={nodeWidth}
                colour={nodeColour}
                svgRef={svgRef}
                cardCanvasX={nodeCanvasX}
                cardCanvasY={nodeCanvasY + yOffset}
                onEditCard={(from, to) => onEditCard(card.id, from, to)}
                onDeleteCard={() => onDeleteCard(card.id, card)}
                onAddComment={c => onAddComment(card.id, c)}
                onDeleteComment={id => onDeleteComment(card.id, id)}
                onEditComment={(id, text) => onEditComment(card.id, id, text)}
              />
            ) : (
              <CardItem
                card={card}
                nodeWidth={nodeWidth}
                colour={nodeColour}
                svgRef={svgRef}
                cardCanvasX={nodeCanvasX}
                cardCanvasY={nodeCanvasY + yOffset}
                onEditCard={(from, to) => onEditCard(card.id, from, to)}
                onDeleteCard={() => onDeleteCard(card.id, card)}
                onAddComment={c => onAddComment(card.id, c)}
                onDeleteComment={id => onDeleteComment(card.id, id)}
                onEditComment={(id, text) => onEditComment(card.id, id, text)}
              />
            )}
          </g>
        );
      })}
    </AnimatePresence>
  );
}
