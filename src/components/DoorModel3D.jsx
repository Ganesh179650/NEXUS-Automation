import React, { useRef } from 'react';
import { useFrame } from '@react-three/fiber';
import { OrbitControls } from '@react-three/drei';
import * as THREE from 'three';

function DoorMesh({ angle = 0 }) {
  const hingeRef = useRef();

  // Map 0–180 degrees to hinge rotation radians (0 = Closed, 180 = Fully Open 110 deg)
  const targetRad = THREE.MathUtils.degToRad((angle / 180) * 110);

  useFrame((state, delta) => {
    if (hingeRef.current) {
      hingeRef.current.rotation.y = THREE.MathUtils.lerp(
        hingeRef.current.rotation.y,
        targetRad,
        Math.min(delta * 7, 0.2)
      );
    }
  });

  const isOpen = angle > 45;

  return (
    <group position={[0, -0.2, 0]}>
      {/* Door Outer Architectural Frame (Dark Metal) */}
      <group position={[0, 0, 0]}>
        {/* Left Frame Post */}
        <mesh position={[-0.85, 0, 0]}>
          <boxGeometry args={[0.1, 2.2, 0.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Right Frame Post */}
        <mesh position={[0.85, 0, 0]}>
          <boxGeometry args={[0.1, 2.2, 0.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Top Frame Header */}
        <mesh position={[0, 1.1, 0]}>
          <boxGeometry args={[1.8, 0.1, 0.15]} />
          <meshStandardMaterial color="#1e293b" roughness={0.3} metalness={0.8} />
        </mesh>
        {/* Threshold Base */}
        <mesh position={[0, -1.1, 0]}>
          <boxGeometry args={[1.8, 0.08, 0.3]} />
          <meshStandardMaterial color="#0f172a" roughness={0.5} />
        </mesh>
      </group>

      {/* Rotating Door Panel Assembly (Hinged on the Left Frame) */}
      <group position={[-0.8, 0, 0]} ref={hingeRef}>
        {/* Main Door Slab (Offset so pivot is at hinge) */}
        <mesh position={[0.8, 0, 0]}>
          <boxGeometry args={[1.55, 2.1, 0.08]} />
          <meshStandardMaterial
            color={isOpen ? '#06b6d4' : '#1e293b'}
            emissive={isOpen ? '#06b6d4' : '#000000'}
            emissiveIntensity={isOpen ? 0.25 : 0}
            roughness={0.2}
            metalness={0.5}
          />
        </mesh>

        {/* Decorative Door Panels */}
        <mesh position={[0.8, 0.45, 0.05]}>
          <boxGeometry args={[1.2, 0.7, 0.02]} />
          <meshStandardMaterial color={isOpen ? '#0284c7' : '#334155'} roughness={0.3} />
        </mesh>
        <mesh position={[0.8, -0.45, 0.05]}>
          <boxGeometry args={[1.2, 0.7, 0.02]} />
          <meshStandardMaterial color={isOpen ? '#0284c7' : '#334155'} roughness={0.3} />
        </mesh>

        {/* Shiny Brass Metallic Door Handle Knob */}
        <mesh position={[1.4, 0, 0.08]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
        <mesh position={[1.4, 0, -0.08]}>
          <sphereGeometry args={[0.07, 16, 16]} />
          <meshStandardMaterial color="#fbbf24" metalness={0.9} roughness={0.1} />
        </mesh>
      </group>
    </group>
  );
}

export default function DoorModel3D({ angle = 0 }) {
  return (
    <>
      <ambientLight intensity={0.7} />
      <directionalLight position={[4, 6, 5]} intensity={1.2} />
      <pointLight position={[-2, 2, 3]} intensity={0.8} color="#06b6d4" />
      <DoorMesh angle={angle} />
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
