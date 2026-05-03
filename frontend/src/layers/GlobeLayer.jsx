import React, { useRef, useState, useEffect } from 'react';
import { Canvas, useFrame } from '@react-three/fiber';
import { Sphere, useTexture, OrbitControls } from '@react-three/drei';
import { motion, useSpring, useAnimation } from 'framer-motion';
import { useLayer } from '../contexts/LayerContext';
import { useWebSocket } from '../contexts/WebSocketContext';
import * as THREE from 'three';

// 3D Globe Component
const Earth = ({ isZooming }) => {
  const earthRef = useRef();
  const initializedRef = useRef(false);
  
  // A warm, parchment-toned earth texture map
  const colorMap = useTexture('https://unpkg.com/three-globe/example/img/earth-blue-marble.jpg');

  // Convert lat/lng to 3D position
  const latLngToVector3 = (lat, lng, radius) => {
    const phi = (90 - lat) * (Math.PI / 180);
    const theta = (lng + 180) * (Math.PI / 180);
    return new THREE.Vector3(
      -(radius * Math.sin(phi) * Math.cos(theta)),
      radius * Math.cos(phi),
      radius * Math.sin(phi) * Math.sin(theta)
    );
  };

  // Target coordinates for India
  const targetPos = latLngToVector3(20.5937, 78.9629, 2);

  useFrame((state, delta) => {
    if (earthRef.current) {
      // On the very first frame, snap globe to face India (~78°E longitude)
      if (!initializedRef.current) {
        earthRef.current.rotation.y = -(78.9629 * Math.PI) / 180;
        initializedRef.current = true;
      }

      if (!isZooming) {
        // Slow auto-rotation
        earthRef.current.rotation.y += 0.002;
      } else {
        // Zoom and decelerate rotation logic
        earthRef.current.rotation.y += (0 - earthRef.current.rotation.y) * 0.05;
        
        // Tilt towards India
        state.camera.position.lerp(targetPos, 0.03);
        state.camera.lookAt(0, 0, 0);
      }
    }
  });

  return (
    <group ref={earthRef}>
      <Sphere args={[2, 64, 64]}>
        {/* We use MeshStandardMaterial to apply a warm tint via color property */}
        <meshStandardMaterial 
          map={colorMap}
          color="#E8E0D4" // parchment tone tint
          emissive="#2A1B0A"
          emissiveIntensity={0.1}
          roughness={0.7}
        />
      </Sphere>
    </group>
  );
};

export default function GlobeLayer() {
  const { navigateToNational } = useLayer();
  const { coldStores, hqStocks, isConnected } = useWebSocket();
  const [isZooming, setIsZooming] = useState(false);
  const [dropdownOpen, setDropdownOpen] = useState(false);

  // Derived counts from websocket
  const coldStoreCount = Object.keys(coldStores).length || 15;
  const hqCount = Object.keys(hqStocks).length || 4;

  const handleSelectIndia = () => {
    setDropdownOpen(false);
    setIsZooming(true);
    
    // Zoom for 1.5s then navigate
    setTimeout(() => {
      navigateToNational();
    }, 1500);
  };

  return (
    <div className="w-full h-full flex bg-[var(--bg-base)]">
      
      {/* Left 65% - 3D Globe */}
      <div className="w-[65%] h-full relative">
        <Canvas camera={{ position: [0, 0, 5], fov: 45 }}>
          {/* Subtle directional light from upper-left */}
          <directionalLight position={[-5, 5, 5]} intensity={1.5} color="#F7F5F2" />
          <ambientLight intensity={0.4} color="#E8E0D4" />
          
          <Earth isZooming={isZooming} />
          
          {/* Allow user to drag around but disable zoom until selection */}
          <OrbitControls 
            enableZoom={false} 
            enablePan={false}
            autoRotate={false}
          />
        </Canvas>
      </div>

      {/* Right 35% - Identity Panel */}
      <div className="w-[35%] h-full flex items-center justify-center p-12 relative z-10">
        <motion.div 
          className="w-full max-w-md bg-[var(--bg-surface)] p-10 rounded shadow-[0_10px_40px_-15px_rgba(26,60,94,0.1)] border border-[var(--border)]"
          initial={{ opacity: 0, x: 20 }}
          animate={{ opacity: isZooming ? 0 : 1, x: isZooming ? 20 : 0 }}
          transition={{ duration: 0.6, ease: "easeOut" }}
        >
          {/* Header */}
          <h1 className="font-display text-[28px] text-[var(--navy)] leading-tight tracking-tight" style={{ whiteSpace: 'nowrap' }}>
            <span className="text-[var(--amber)]">⬡</span> COLDGRID AI
          </h1>
          <p className="font-body text-[var(--text-secondary)] mt-2 mb-8">
            Autonomous Supply Chain Command Network
          </p>
          
          <div className="w-full h-[1px] bg-[var(--border)] mb-8"></div>

          {/* Stats */}
          <div className="space-y-4 mb-10 font-mono text-sm text-[var(--navy)]">
            <div className="flex items-center justify-between">
              <span>Cold Stores</span>
              <span className="text-[var(--text-secondary)]">{coldStoreCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Headquarters</span>
              <span className="text-[var(--text-secondary)]">{hqCount}</span>
            </div>
            <div className="flex items-center justify-between">
              <span>Agents</span>
              <div className="flex items-center gap-2">
                {isConnected ? (
                  <>
                    <span className="text-[var(--success)]">●</span> 
                    <span className="text-[var(--text-secondary)] tracking-wider">ACTIVE</span>
                  </>
                ) : (
                  <>
                    <span className="text-[var(--warning)]">●</span> 
                    <span className="text-[var(--text-secondary)] tracking-wider">CONNECTING</span>
                  </>
                )}
              </div>
            </div>
          </div>

          {/* Dropdown Section */}
          <div className="flex flex-col gap-3">
            <label className="font-mono text-[11px] uppercase tracking-[0.2em] text-[var(--text-secondary)]">
              Select Network Region
            </label>
            
            <div className="relative">
              <button 
                onClick={() => setDropdownOpen(!dropdownOpen)}
                className="w-full flex items-center justify-between px-4 py-3 bg-[var(--bg-elevated)] border border-[var(--border)] text-[var(--navy)] font-body text-left hover:bg-[var(--map-base)] transition-colors"
              >
                <span>Select region...</span>
                <span className="font-mono text-[var(--text-secondary)] opacity-50">▼</span>
              </button>

              {dropdownOpen && (
                <div className="absolute top-full left-0 w-full mt-1 bg-[var(--bg-surface)] border border-[var(--border)] shadow-lg z-20">
                  <button 
                    onClick={handleSelectIndia}
                    className="w-full flex items-center gap-3 px-4 py-3 text-left hover:bg-[var(--bg-elevated)] transition-colors text-[var(--navy)] font-body"
                  >
                    <span>●</span> 
                    <span>India</span>
                    <span className="ml-auto">🇮🇳</span>
                  </button>
                </div>
              )}
            </div>

            <p className="font-body italic text-[13px] text-[var(--text-secondary)] mt-2">
              The system is already running. Select a region to observe.
            </p>
          </div>

        </motion.div>
      </div>

    </div>
  );
}
