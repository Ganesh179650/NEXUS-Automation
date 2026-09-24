import React, { useRef, useMemo } from 'react';
import { useFrame } from '@react-three/fiber';
import { MeshDistortMaterial } from '@react-three/drei';
import * as THREE from 'three';

function OrbMesh({ temperature = 25, gas = 150 }) {
  const meshRef = useRef();

  // Compute color based on temperature
  const orbColor = useMemo(() => {
    const temp = parseFloat(temperature) || 25;
    if (temp < 22) return '#06b6d4'; // Cool Cyan
    if (temp < 28) return '#3b82f6'; // Deep Electric Blue
    if (temp < 34) return '#f59e0b'; // Amber Warning
    return '#ef4444'; // Hot Red
  }, [temperature]);

  // Compute distortion based on gas raw ADC reading
  const distortAmount = useMemo(() => {
    const rawGas = parseFloat(gas) || 100;
    // Map gas 0 - 1000 to distortion range 0.2 - 0.85
    const clamped = Math.max(0, Math.min(1000, rawGas));
    return 0.2 + (clamped / 1000) * 0.65;
  }, [gas]);

  useFrame((state, delta) => {
    if (meshRef.current) {
      meshRef.current.rotation.x += delta * 0.15;
      meshRef.current.rotation.y += delta * 0.2;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      <mesh ref={meshRef}>
        <sphereGeometry args={[1.3, 64, 64]} />
        <MeshDistortMaterial
          color={orbColor}
          emissive={orbColor}
          emissiveIntensity={0.35}
          roughness={0.1}
          metalness={0.2}
          distort={distortAmount}
          speed={2.5}
          clearcoat={0.9}
        />
      </mesh>
      {/* Inner Emissive Core */}
      <pointLight color={orbColor} intensity={2.0} distance={5} />
    </group>
  );
}

export default function EnvironmentOrb3D({ temperature = 25, gas = 150 }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 6, 4]} intensity={1.2} />
      <OrbMesh temperature={temperature} gas={gas} />
    </>
  );
}
