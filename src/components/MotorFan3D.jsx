import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import * as THREE from 'three';

function FanRotorMesh({ state = 0 }) {
  const fanRef = useRef();
  const speedRef = useRef(0);

  const isON = state === 1 || state === true || state === '1';

  useFrame((rState, delta) => {
    // Target rotation speed (rad/s)
    const targetSpeed = isON ? 12 : 0;
    speedRef.current = THREE.MathUtils.lerp(speedRef.current, targetSpeed, Math.min(delta * 3, 0.1));

    if (fanRef.current && speedRef.current > 0.01) {
      fanRef.current.rotation.z += speedRef.current * delta;
    }
  });

  return (
    <group position={[0, 0, 0]}>
      {/* Motor Main Cylindrical Stator Base */}
      <mesh position={[0, 0, -0.4]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.9, 0.9, 0.8, 32]} />
        <meshStandardMaterial color="#334155" roughness={0.4} metalness={0.7} />
      </mesh>

      {/* Front Shaft Hub */}
      <mesh position={[0, 0, 0.05]} rotation={[Math.PI / 2, 0, 0]}>
        <cylinderGeometry args={[0.2, 0.2, 0.3, 24]} />
        <meshStandardMaterial color="#94a3b8" roughness={0.2} metalness={0.9} />
      </mesh>

      {/* Rotating Fan Blades (Parented for Z-axis rotation) */}
      <group ref={fanRef} position={[0, 0, 0.2]}>
        {/* Central Fan Cap */}
        <mesh position={[0, 0, 0]}>
          <cylinderGeometry args={[0.3, 0.3, 0.15, 24]} rotation={[Math.PI / 2, 0, 0]} />
          <meshStandardMaterial color="#06b6d4" roughness={0.2} />
        </mesh>

        {/* 4 Fan Blades */}
        {[0, Math.PI / 2, Math.PI, (3 * Math.PI) / 2].map((angle, idx) => (
          <group key={idx} rotation={[0, 0, angle]}>
            <mesh position={[0, 0.65, 0]} rotation={[0.2, 0, 0]}>
              <boxGeometry args={[0.25, 0.9, 0.04]} />
              <meshStandardMaterial
                color={isON ? '#06b6d4' : '#64748b'}
                emissive={isON ? '#06b6d4' : '#000'}
                emissiveIntensity={isON ? 0.3 : 0}
                roughness={0.3}
              />
            </mesh>
          </group>
        ))}
      </group>

      {/* Outer Protective Ring */}
      <mesh position={[0, 0, 0.2]}>
        <torusGeometry args={[1.2, 0.05, 16, 48]} />
        <meshStandardMaterial color="#475569" roughness={0.3} metalness={0.8} />
      </mesh>
    </group>
  );
}

export default function MotorFan3D({ state = 0 }) {
  return (
    <>
      <ambientLight intensity={0.6} />
      <directionalLight position={[4, 4, 5]} intensity={1.1} />
      <pointLight position={[-2, 2, 2]} intensity={0.6} color="#06b6d4" />
      <FanRotorMesh state={state} />
    </>
  );
}
