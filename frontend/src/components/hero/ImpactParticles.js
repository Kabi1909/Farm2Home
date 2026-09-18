import { useEffect, useRef } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';

export default function ImpactParticles({ position, radius, count, onComplete }) {
  const group = useRef();
  const invalidate = useThree((state) => state.invalidate);
  const done = useRef(onComplete);
  done.current = onComplete;
  useEffect(() => {
    const timeline = gsap.timeline({ onUpdate: invalidate, onComplete: () => done.current() });
    group.current.children.forEach((particle, index) => {
      const angle = (index / (count + 4)) * Math.PI * 2;
      const targetX = Math.cos(angle) * radius * (1.4 + (index % 3) * 0.3);
      const targetY = radius * (0.4 + (index % 4) * 0.25);
      timeline.to(particle.position, { x: targetX, duration: 0.75, ease: 'power1.out' }, 0);
      timeline.to(particle.position, { y: targetY, duration: 0.28, ease: 'power2.out' }, 0);
      timeline.to(
        particle.position,
        { y: -radius * 0.25, duration: 0.47, ease: 'power1.in' },
        0.28,
      );
      timeline.to(particle.rotation, { z: angle + 1.4, x: 0.8, duration: 0.75 }, 0);
      timeline.to(particle.material, { opacity: 0, duration: 0.45 }, 0.3);
    });
    return () => timeline.kill();
  }, [count, radius, invalidate]);
  return (
    <group ref={group} position={position}>
      {Array.from({ length: count + 4 }, (_, index) => (
        <mesh
          key={index}
          scale={
            index < count
              ? [radius * 0.15, radius * 0.065, radius * 0.035]
              : [radius * 0.025, radius * 0.025, radius * 0.025]
          }
        >
          <sphereGeometry args={[1, 8, 6]} />
          <meshStandardMaterial
            color={index < count ? (index % 2 ? '#426d23' : '#6b8731') : '#695039'}
            transparent
            roughness={0.9}
          />
        </mesh>
      ))}
    </group>
  );
}
