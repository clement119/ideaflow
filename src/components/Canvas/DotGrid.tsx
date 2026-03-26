import type { CanvasTransform } from '../../store/types';

interface Props {
  transform: CanvasTransform;
}

export function DotGrid({ transform }: Props) {
  const spacing = 24 * transform.zoom;
  const dotR = Math.max(0.5, transform.zoom * 0.8);
  const offsetX = transform.x % spacing;
  const offsetY = transform.y % spacing;

  return (
    <defs>
      <pattern
        id="dot-grid"
        x={offsetX}
        y={offsetY}
        width={spacing}
        height={spacing}
        patternUnits="userSpaceOnUse"
      >
        <circle cx={spacing / 2} cy={spacing / 2} r={dotR} fill="#d1d5db" />
      </pattern>
    </defs>
  );
}
