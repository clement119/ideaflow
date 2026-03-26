import { Canvas } from './components/Canvas/Canvas';
import { useKeyboard } from './hooks/useKeyboard';

export function App() {
  useKeyboard();
  return <Canvas />;
}

export default App;
