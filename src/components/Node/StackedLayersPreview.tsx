interface Props {
  nodeWidth: number;
  nodeHeight: number;
  count: number;        // number of cards hidden
  nodeColour: string;
  rx?: number;
}

/** Two peeking layers below the bubble to signal hidden cards */
export function StackedLayersPreview({ nodeWidth, nodeHeight, count, nodeColour, rx = 12 }: Props) {
  if (count === 0) return null;

  // Darken the node colour slightly for the peeking layers
  const layer1Fill = nodeColour;
  const layer2Fill = nodeColour;

  return (
    <g style={{ pointerEvents: 'none' }}>
      {/* Deepest layer */}
      <rect
        x={-6}
        y={nodeHeight + 5}
        width={nodeWidth + 12}
        height={10}
        rx={rx}
        fill={layer2Fill}
        stroke="#c4b5fd"
        strokeWidth={1}
        opacity={0.45}
        style={{ filter: 'brightness(0.88)' }}
      />
      {/* Middle layer */}
      <rect
        x={-3}
        y={nodeHeight + 2}
        width={nodeWidth + 6}
        height={10}
        rx={rx}
        fill={layer1Fill}
        stroke="#c4b5fd"
        strokeWidth={1}
        opacity={0.65}
        style={{ filter: 'brightness(0.93)' }}
      />
      {/* Card count badge */}
      {count > 0 && (
        <g>
          <circle
            cx={nodeWidth - 2}
            cy={nodeHeight + 7}
            r={8}
            fill="#6366f1"
          />
          <text
            x={nodeWidth - 2}
            y={nodeHeight + 7}
            textAnchor="middle"
            dominantBaseline="middle"
            fontSize={9}
            fontFamily="system-ui"
            fontWeight="700"
            fill="white"
            style={{ pointerEvents: 'none', userSelect: 'none' }}
          >
            {count > 9 ? '9+' : count}
          </text>
        </g>
      )}
    </g>
  );
}
