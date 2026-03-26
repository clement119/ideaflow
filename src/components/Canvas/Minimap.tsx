import { useStore } from '../../store/store';

const MM_W = 160;
const MM_H = 100;
const PADDING = 20;

export function Minimap() {
  const nodes = useStore(s => s.nodes);
  const transform = useStore(s => s.canvasTransform);

  const all = Object.values(nodes);
  if (!all.length) return null;

  const minX = Math.min(...all.map(n => n.x)) - PADDING;
  const minY = Math.min(...all.map(n => n.y)) - PADDING;
  const maxX = Math.max(...all.map(n => n.x + n.width)) + PADDING;
  const maxY = Math.max(...all.map(n => n.y + n.height)) + PADDING;
  const worldW = maxX - minX;
  const worldH = maxY - minY;
  const scale = Math.min(MM_W / worldW, MM_H / worldH);

  return (
    <div
      style={{
        position: 'absolute',
        bottom: 16,
        right: 16,
        width: MM_W,
        height: MM_H,
        background: 'rgba(255,255,255,0.9)',
        borderRadius: 8,
        border: '1px solid #e5e7eb',
        boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
        overflow: 'hidden',
        pointerEvents: 'none',
      }}
    >
      <svg width={MM_W} height={MM_H}>
        {all.map(node => (
          <rect
            key={node.id}
            x={(node.x - minX) * scale}
            y={(node.y - minY) * scale}
            width={node.width * scale}
            height={node.height * scale}
            rx={2}
            fill={node.colour}
            stroke="#9ca3af"
            strokeWidth={0.5}
          />
        ))}
        {/* Viewport indicator */}
        <rect
          x={(-transform.x / transform.zoom - minX) * scale}
          y={(-transform.y / transform.zoom - minY) * scale}
          width={(window.innerWidth / transform.zoom) * scale}
          height={(window.innerHeight / transform.zoom) * scale}
          fill="none"
          stroke="#6366f1"
          strokeWidth={1}
          rx={1}
        />
      </svg>
    </div>
  );
}
