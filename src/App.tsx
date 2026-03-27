import { Canvas } from './components/Canvas/Canvas';
import { ZoomControls } from './components/Canvas/ZoomControls';
import { NPCGuide } from './components/Onboarding/NPCGuide';
import { useKeyboard } from './hooks/useKeyboard';

export function App() {
  useKeyboard();
  return (
    <>
      <Canvas />
      <ZoomControls />
      <NPCGuide />
    </>
  );
}

export default App;
