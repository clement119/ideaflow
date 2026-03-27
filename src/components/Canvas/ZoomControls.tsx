import { createPortal } from 'react-dom';
import { useStore } from '../../store/store';
import { zoomAroundPoint } from '../../utils/viewport';

const MIN_ZOOM = 0.1;
const MAX_ZOOM = 4;

const btn: React.CSSProperties = {
  width: 36, height: 36,
  border: '1.5px solid #e5e7eb',
  borderRadius: 8,
  background: 'white',
  color: '#374151',
  fontSize: 20,
  cursor: 'pointer',
  display: 'flex',
  alignItems: 'center',
  justifyContent: 'center',
  boxShadow: '0 2px 8px rgba(0,0,0,0.08)',
  fontFamily: 'system-ui',
  lineHeight: 1,
  padding: 0,
  userSelect: 'none',
};

export function ZoomControls() {
  const zoom = useStore(s => s.canvasTransform.zoom);

  const adjust = (factor: number) => {
    const t = useStore.getState().canvasTransform;
    const newZoom = Math.max(MIN_ZOOM, Math.min(MAX_ZOOM, t.zoom * factor));
    useStore.setState({
      canvasTransform: zoomAroundPoint(t, { x: window.innerWidth / 2, y: window.innerHeight / 2 }, newZoom),
    });
  };

  return createPortal(
    <div style={{ position: 'fixed', right: 20, bottom: 20, zIndex: 900, display: 'flex', flexDirection: 'column', alignItems: 'center', gap: 4 }}>
      <button style={btn} onClick={() => adjust(1.25)} title="Zoom in" aria-label="Zoom in">+</button>
      <div style={{ fontSize: 10, fontFamily: 'system-ui', color: '#9ca3af', userSelect: 'none', textAlign: 'center', minWidth: 36 }}>
        {Math.round(zoom * 100)}%
      </div>
      <button style={btn} onClick={() => adjust(0.8)} title="Zoom out" aria-label="Zoom out">−</button>
    </div>,
    document.body
  );
}
