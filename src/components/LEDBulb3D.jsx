import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function LEDMesh({ state = 0, color = '#06b6d4' }) {
  const bulbRef = useRef();
  const glowRef = useRef();

  const isON = state === 1 || state === true || state === '1';
  const targetIntensity = isON ? 2.5 : 0.05;
  const targetScale = isON ? 1.15 : 1.0;

  useFrame((rState) => {
    if (bulbRef.current) {
      // Interpolate emissive intensity
      const mat = bulbRef.current.material;
      mat.emissiveIntensity = THREE.MathUtils.lerp(
        mat.emissiveIntensity,
        targetIntensity + (isON ? Math.sin(rState.clock.elapsedTime * 4) * 0.3 : 0),
        0.1
      );
    }

    if (glowRef.current) {
      const scale = THREE.MathUtils.lerp(
        glowRef.current.scale.x,
        targetScale + (isON ? Math.sin(rState.clock.elapsedTime * 4) * 0.05 : 0),
        0.1
      );
      glowRef.current.scale.set(scale, scale, scale);
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Base Metallic Collar */}
      <mesh position={[0, -0.6, 0]}>
        <cylinderGeometry args={[0.45, 0.45, 0.4, 32]} />
        <meshStandardMaterial color="#64748b" roughness={0.3} metalness={0.8} />
      </mesh>

      {/* Main Glass Bulb Dome */}
      <mesh ref={bulbRef} position={[0, 0.1, 0]}>
        <sphereGeometry args={[0.75, 32, 32]} />
        <meshStandardMaterial
          color={isON ? color : '#334155'}
          emissive={color}
          emissiveIntensity={isON ? 2.0 : 0.05}
          roughness={0.1}
          transparent
          opacity={0.9}
        />
      </mesh>

      {/* Outer Soft Ambient Glow Mesh (When ON) */}
      {isON && (
        <mesh ref={glowRef} position={[0, 0.1, 0]}>
          <sphereGeometry args={[0.9, 24, 24]} />
          <meshBasicMaterial
            color={color}
            transparent
            opacity={0.25}
            side={THREE.BackSide}
          />
        </mesh>
      )}
    </group>
  );
}

export default function LEDBulb3D({ state = 0, color = '#06b6d4' }) {
  return (
    <>
      <ambientLight intensity={0.5} />
      <directionalLight position={[3, 5, 4]} intensity={1} />
      <LEDMesh state={state} color={color} />
    </>
  );
}
