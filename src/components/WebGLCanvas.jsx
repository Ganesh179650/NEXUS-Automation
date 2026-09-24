import React, { useState, useEffect, Suspense } from 'react';
import { Canvas } from '@react-three/fiber';

/**
 * Checks if WebGL is supported in the current environment.
 */
function isWebGLAvailable() {
  try {
    const canvas = document.createElement('canvas');
    return !!(window.WebGLRenderingContext && (canvas.getContext('webgl') || canvas.getContext('experimental-webgl')));
  } catch (e) {
    return false;
  }
}

/**
 * Fallback UI when WebGL is unavailable or loading.
 */
function WebGLFallback({ fallbackText = '3D Unavailable' }) {
  return (
    <div className="w-full h-full flex flex-col items-center justify-center bg-slate-900/40 rounded-xl border border-slate-800 p-4 text-center">
      <div className="w-8 h-8 rounded-full border-2 border-slate-700 border-t-cyan-400 animate-spin mb-2" />
      <span className="text-xs text-slate-400 font-medium">{fallbackText}</span>
    </div>
  );
}

/**
 * WebGLCanvas wrapper with error boundary, feature detection, and visibility pause.
 */
export default function WebGLCanvas({
  children,
  className = 'w-full h-full',
  camera = { position: [0, 0, 5], fov: 50 },
  fallbackText = '3D View Loading...',
  reduceMotion = false,
  interactive = true,
}) {
  const [hasWebGL, setHasWebGL] = useState(true);
  const [isVisible, setIsVisible] = useState(true);

  useEffect(() => {
    setHasWebGL(isWebGLAvailable());

    const handleVisibility = () => {
      setIsVisible(!document.hidden);
    };

    document.addEventListener('visibilitychange', handleVisibility);
    return () => document.removeEventListener('visibilitychange', handleVisibility);
  }, []);

  if (!hasWebGL || reduceMotion) {
    return <WebGLFallback fallbackText={reduceMotion ? '3D Disabled (Reduced Motion)' : 'WebGL Unsupported'} />;
  }

  return (
    <div className={`relative ${className} ${!interactive ? 'pointer-events-none' : ''}`}>
      <Suspense fallback={<WebGLFallback fallbackText={fallbackText} />}>
        {isVisible && (
          <Canvas
            camera={camera}
            dpr={[1, Math.min(window.devicePixelRatio, 2)]}
            gl={{ antialias: true, alpha: true, powerPreference: 'high-performance' }}
          >
            {children}
          </Canvas>
        )}
      </Suspense>
    </div>
  );
}
