import { useEffect, useMemo, useRef, useState } from 'react';
import { useThree } from '@react-three/fiber';
import { gsap } from 'gsap';
import {
  Color,
  DataTexture,
  Float32BufferAttribute,
  SphereGeometry,
  Shape,
  ShapeGeometry,
} from 'three';
import ImpactParticles from './ImpactParticles';
import { arcPoint, heroComposition } from './heroMotion';

function tomatoGeometry() {
  const geometry = new SphereGeometry(1, 48, 32);
  const positions = geometry.attributes.position;
  const colors = [];
  const color = new Color();
  for (let index = 0; index < positions.count; index += 1) {
    const x = positions.getX(index),
      y = positions.getY(index),
      z = positions.getZ(index);
    const angle = Math.atan2(z, x);
    const lobes = 1 + 0.035 * Math.cos(angle * 7) * (1 - y * y);
    const dimple = Math.sign(y) * 0.11 * Math.pow(Math.abs(y), 12);
    positions.setXYZ(index, x * lobes, y * 0.9 - dimple, z * lobes);
    const variation = Math.sin(x * 37 + z * 29) * Math.sin(y * 43 + x * 17) * 0.012;
    color.setHSL(0.012 + variation * 0.2, 0.85, 0.36 + variation + (y > 0.7 ? 0.015 : 0));
    color.convertSRGBToLinear();
    colors.push(color.r, color.g, color.b);
  }
  geometry.setAttribute('color', new Float32BufferAttribute(colors, 3));
  geometry.computeVertexNormals();
  return geometry;
}

function TomatoModel() {
  const body = useMemo(tomatoGeometry, []);
  const leaf = useMemo(() => {
    const shape = new Shape();
    shape.moveTo(0, 0);
    shape.bezierCurveTo(-0.2, 0.2, -0.14, 0.48, 0, 0.67);
    shape.bezierCurveTo(0.09, 0.4, 0.2, 0.18, 0, 0);
    return new ShapeGeometry(shape, 10);
  }, []);
  useEffect(
    () => () => {
      body.dispose();
      leaf.dispose();
    },
    [body, leaf],
  );
  return (
    <group>
      <mesh geometry={body}>
        <meshPhysicalMaterial
          vertexColors
          roughness={0.31}
          metalness={0}
          clearcoat={0.2}
          clearcoatRoughness={0.35}
        />
      </mesh>
      <group position={[0, 0.77, 0]} rotation={[0.14, 0, -0.12]}>
        <mesh position={[0, 0.14, 0]} rotation={[0, 0, -0.22]}>
          <cylinderGeometry args={[0.035, 0.065, 0.4, 10]} />
          <meshStandardMaterial color="#426120" roughness={0.85} />
        </mesh>
        {Array.from({ length: 6 }, (_, index) => (
          <group key={index} rotation={[0, (index * Math.PI) / 3, 0]}>
            <mesh geometry={leaf} rotation={[-1.23, 0, 0]}>
              <meshStandardMaterial
                color={index % 2 ? '#466a22' : '#557b29'}
                roughness={0.8}
                side={2}
              />
            </mesh>
          </group>
        ))}
      </group>
    </group>
  );
}

export default function FlyingTomato({ play, onReady, onSettled }) {
  const tomato = useRef();
  const shadow = useRef();
  const callbacks = useRef({ onReady, onSettled });
  callbacks.current = { onReady, onSettled };
  const [particles, setParticles] = useState(false);
  const shadowTexture = useMemo(() => {
    const pixels = new Uint8Array(64 * 64 * 4);
    for (let y = 0; y < 64; y += 1) {
      for (let x = 0; x < 64; x += 1) {
        const offset = (y * 64 + x) * 4;
        const distance = Math.hypot((x - 31.5) / 31.5, (y - 31.5) / 31.5);
        pixels[offset] = pixels[offset + 1] = pixels[offset + 2] = 255;
        pixels[offset + 3] = Math.round(Math.max(0, 1 - distance) ** 1.6 * 255);
      }
    }
    const texture = new DataTexture(pixels, 64, 64);
    texture.needsUpdate = true;
    return texture;
  }, []);
  useEffect(() => () => shadowTexture.dispose(), [shadowTexture]);
  const { size, viewport, invalidate } = useThree();
  const composition = heroComposition(size.width, size.height);
  const worldWidth = viewport.width,
    worldHeight = viewport.height;
  const radius = (composition.radius / size.height) * worldHeight;
  const landing = [
    (composition.landing.x - 0.5) * worldWidth,
    (0.5 - composition.landing.y) * worldHeight + radius * 0.8,
    0,
  ];
  const previousSize = useRef(null);

  useEffect(() => {
    const resized = previousSize.current && previousSize.current !== `${size.width}:${size.height}`;
    previousSize.current = `${size.width}:${size.height}`;
    const model = tomato.current;
    const shade = shadow.current;
    const rest = () => {
      model.position.set(...landing);
      model.rotation.set(0.12, 0.4, -0.12);
      model.scale.setScalar(radius);
      shade.scale.set(radius * 1.05, radius * 0.22, 1);
      shade.material.opacity = 0.19;
      invalidate();
    };
    rest();
    callbacks.current.onReady(play && !resized);
    if (!play || resized) {
      setParticles(false);
      callbacks.current.onSettled();
      return;
    }
    const motion = { progress: 0 };
    const update = () => {
      const point = arcPoint(
        composition.start,
        composition.control,
        composition.landing,
        motion.progress,
      );
      model.position.set(
        (point.x - 0.5) * worldWidth,
        (0.5 - point.y) * worldHeight + radius * 0.8,
        Math.sin(Math.PI * motion.progress) * 0.65,
      );
      model.scale.setScalar(radius * (0.7 + 0.3 * motion.progress));
      shade.material.opacity = 0.03 + 0.16 * Math.pow(motion.progress, 3);
      shade.scale.set(
        radius * (1.7 - 0.65 * motion.progress),
        radius * (0.32 - 0.1 * motion.progress),
        1,
      );
      invalidate();
    };
    model.rotation.set(-0.6, -1.5, -0.85);
    update();
    const timeline = gsap.timeline({
      onUpdate: invalidate,
      onComplete: () => {
        rest();
        callbacks.current.onSettled();
      },
    });
    timeline.to(
      motion,
      { progress: 1, duration: 1.5, ease: 'power2.inOut', onUpdate: update },
      0.2,
    );
    timeline.to(
      model.rotation,
      { x: 0.12, y: 0.4, z: -0.12, duration: 1.5, ease: 'power2.out' },
      0.2,
    );
    timeline.call(() => setParticles(true), [], 1.7);
    timeline.to(
      model.scale,
      { x: radius * 1.06, y: radius * 0.91, z: radius * 1.04, duration: 0.09 },
      1.7,
    );
    timeline.to(
      model.position,
      { y: landing[1] + radius * 0.2, duration: 0.13, ease: 'power2.out' },
      1.79,
    );
    timeline.to(model.scale, { x: radius, y: radius, z: radius, duration: 0.16 }, 1.79);
    timeline.to(model.position, { y: landing[1], duration: 0.18, ease: 'power2.in' }, 1.92);
    timeline.call(() => {}, [], 3);
    return () => timeline.kill();
  }, [play, size.width, size.height, worldWidth, worldHeight, radius, invalidate]);

  return (
    <>
      <mesh ref={shadow} position={[landing[0], landing[1] - radius * 0.8, -0.2]}>
        <planeGeometry args={[2, 2]} />
        <meshBasicMaterial
          map={shadowTexture}
          color="#35200e"
          transparent
          opacity={0.19}
          depthWrite={false}
        />
      </mesh>
      <group ref={tomato}>
        <TomatoModel />
      </group>
      {particles && (
        <ImpactParticles
          position={[landing[0], landing[1] - radius * 0.6, 0.2]}
          radius={radius}
          count={composition.leaves}
          onComplete={() => setParticles(false)}
        />
      )}
    </>
  );
}
