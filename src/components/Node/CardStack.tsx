import { AnimatePresence } from 'framer-motion';
import type { ICard, IComment } from '../../store/types';
import { CardItem } from './CardItem';

interface Props {
  cards: ICard[];
  nodeId: string;
  nodeWidth: number;
  nodeHeight: number;
  nodeColour: string;
  onEditCard: (cardId: string, from: Partial<ICard>, to: Partial<ICard>) => void;
  onDeleteCard: (cardId: string, card: ICard) => void;
  onAddComment: (cardId: string, c: IComment) => void;
  onDeleteComment: (cardId: string, commentId: string) => void;
  onEditComment: (cardId: string, commentId: string, text: string) => void;
  onEditNote: (cardId: string, newNote: string, oldNote: string) => void;
}

const CARD_GAP = 10;
const STACK_TOP_OFFSET = 16;  // gap between bubble bottom and first card

export function CardStack({
  cards, nodeId, nodeWidth, nodeHeight, nodeColour,
  onEditCard, onDeleteCard, onAddComment, onDeleteComment, onEditComment, onEditNote,
}: Props) {
  return (
    <AnimatePresence>
      {cards.map((card, i) => {
        // Each card is stacked below the previous; approximate height for layout
        const APPROX_CARD_H = 68 + (card.comments?.length ?? 0) * 52;
        const yOffset = nodeHeight + STACK_TOP_OFFSET
          + cards.slice(0, i).reduce((acc, c) => acc + 68 + ((c.comments?.length ?? 0) * 0) + CARD_GAP, 0);

        return (
          <g key={card.id} transform={`translate(0, ${yOffset})`}>
            <CardItem
              card={card}
              nodeId={nodeId}
              nodeWidth={nodeWidth}
              colour={nodeColour}
              onEditCard={(from, to) => onEditCard(card.id, from, to)}
              onDeleteCard={() => onDeleteCard(card.id, card)}
              onAddComment={c => onAddComment(card.id, c)}
              onDeleteComment={id => onDeleteComment(card.id, id)}
              onEditComment={(id, text) => onEditComment(card.id, id, text)}
              onEditNote={(newNote, oldNote) => onEditNote(card.id, newNote, oldNote)}
            />
            {/* stagger delay via the motion.g inside CardItem — index carries the delay */}
            <rect x={0} y={0} width={1} height={APPROX_CARD_H} fill="transparent" style={{ pointerEvents: 'none' }} />
          </g>
        );
      })}
    </AnimatePresence>
  );
}
