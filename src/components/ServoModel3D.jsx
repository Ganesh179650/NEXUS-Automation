import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function ServoMesh({ angle = 90 }) {
  const armRef = useRef();
  // Target angle in radians: 0 deg = -PI/2, 180 deg = +PI/2
  const targetRad = THREE.MathUtils.degToRad(angle - 90);

  useFrame((state, delta) => {
    if (armRef.current) {
      // Lerp rotation smoothly
      armRef.current.rotation.y = THREE.MathUtils.lerp(
        armRef.current.rotation.y,
        targetRad,
        Math.min(delta * 8, 0.2)
      );
    }
  });

  return (
    <group position={[0, -0.4, 0]}>
      {/* Servo Main Blue Chassis Box */}
      <mesh position={[0, 0, 0]}>
        <boxGeometry args={[1.8, 1.4, 1.0]} />
        <meshStandardMaterial
          color="#0284c7"
          roughness={0.2}
          metalness={0.6}
          clearcoat={0.8}
        />
      </mesh>

      {/* Side Mounting Tabs */}
      <mesh position={[0, 0.4, 0]}>
        <boxGeometry args={[2.4, 0.15, 1.0]} />
        <meshStandardMaterial color="#0369a1" roughness={0.3} metalness={0.5} />
      </mesh>

      {/* Gear Tower Shaft */}
      <mesh position={[0.4, 0.9, 0]}>
        <cylinderGeometry args={[0.35, 0.35, 0.4, 32]} />
        <meshStandardMaterial color="#e2e8f0" roughness={0.2} metalness={0.8} />
      </mesh>

      {/* Rotating Servo Horn Arm (Parented for rotation) */}
      <group position={[0.4, 1.15, 0]} ref={armRef}>
        {/* Center Shaft Cap */}
        <mesh position={[0, 0.05, 0]}>
          <cylinderGeometry args={[0.2, 0.2, 0.1, 24]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} />
        </mesh>

        {/* Main Servo Cross Arm Horn */}
        <mesh position={[0, 0.05, 0]}>
          <boxGeometry args={[1.6, 0.08, 0.3]} />
          <meshStandardMaterial color="#f8fafc" roughness={0.1} />
        </mesh>

        {/* Arm Indicator Pointer Pin */}
        <mesh position={[0.7, 0.15, 0]}>
          <coneGeometry args={[0.08, 0.2, 16]} />
          <meshStandardMaterial color="#06b6d4" emissive="#06b6d4" emissiveIntensity={0.8} />
        </mesh>
      </group>

      {/* Wiring Cable (3 wires: Red, Brown, Yellow) */}
      <mesh position={[-0.9, -0.4, 0]}>
        <boxGeometry args={[0.2, 0.3, 0.6]} />
        <meshStandardMaterial color="#1e293b" />
      </mesh>
    </group>
  );
}

export default function ServoModel3D({ angle = 90 }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[5, 8, 5]} intensity={1.2} />
      <pointLight position={[-3, -3, 2]} intensity={0.5} color="#06b6d4" />
      <ServoMesh angle={angle} />
      <OrbitControls
        enableZoom={false}
        enablePan={false}
        minPolarAngle={Math.PI / 4}
        maxPolarAngle={Math.PI / 2}
        rotateSpeed={0.8}
      />
    </>
  );
}
