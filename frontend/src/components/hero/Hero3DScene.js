import { useEffect } from 'react';
import { Canvas, useThree } from '@react-three/fiber';
import { PerspectiveCamera } from '@react-three/drei';
import FlyingTomato from './FlyingTomato';

function ContextGuard({ onFailure }) {
  const gl = useThree((state) => state.gl);
  useEffect(() => {
    const lost = (event) => {
      event.preventDefault();
      onFailure();
    };
    gl.domElement.addEventListener('webglcontextlost', lost);
    return () => gl.domElement.removeEventListener('webglcontextlost', lost);
  }, [gl, onFailure]);
  return null;
}

export default function Hero3DScene(props) {
  return (
    <Canvas
      frameloop="demand"
      dpr={[1, 1.5]}
      gl={{ alpha: true, antialias: true, powerPreference: 'low-power' }}
      fallback={null}
    >
      <PerspectiveCamera makeDefault position={[0, 0, 10]} fov={40} />
      <ambientLight intensity={1.05} />
      <directionalLight position={[-4, 7, 6]} intensity={3.2} color="#fff1d6" />
      <directionalLight position={[4, 1, 3]} intensity={0.7} color="#e4f2ff" />
      <ContextGuard onFailure={props.onFailure} />
      <FlyingTomato {...props} />
    </Canvas>
  );
}
