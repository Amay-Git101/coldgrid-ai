import React, { useEffect, useState, Component } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { WebSocketProvider, useWebSocket } from './contexts/WebSocketContext';
import { LayerProvider, useLayer } from './contexts/LayerContext';
import { getRoads } from './constants/worldData';

import GlobeLayer from './layers/GlobeLayer';
import NationalMapLayer from './layers/NationalMapLayer';
import CorridorLayer from './layers/CorridorLayer';
import ColdStoreLayer from './layers/ColdStoreLayer';

// ── Error Boundary ───────────────────────────────────────────
class ErrorBoundary extends Component {
  constructor(props) {
    super(props);
    this.state = { hasError: false, error: null };
  }
  static getDerivedStateFromError(error) {
    return { hasError: true, error };
  }
  render() {
    if (this.state.hasError) {
      return (
        <div className="w-full h-full flex items-center justify-center bg-[var(--bg-base)] flex-col gap-4">
          <div className="font-mono text-[var(--critical)] text-sm uppercase tracking-widest">Layer Error</div>
          <div className="font-body text-[var(--text-secondary)] text-xs max-w-[320px] text-center">
            {this.state.error?.message || 'An unexpected rendering error occurred.'}
          </div>
          <button
            onClick={() => this.setState({ hasError: false, error: null })}
            className="font-mono text-[11px] px-4 py-2 bg-[var(--navy)] text-white rounded hover:opacity-80"
          >
            RETRY
          </button>
        </div>
      );
    }
    return this.props.children;
  }
}

const ReconnectingBanner = () => {
  const { isConnected } = useWebSocket();
  return (
    <AnimatePresence>
      {!isConnected && (
        <motion.div
          initial={{ opacity: 0, y: -20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: -20 }}
          className="fixed top-[52px] left-0 w-full bg-[var(--critical)] text-white py-1 flex items-center justify-center gap-2 z-[9999] font-mono text-xs uppercase tracking-wider shadow-md"
        >
          <div className="w-2 h-2 rounded-full bg-white animate-pulse" />
          Reconnecting to live network...
        </motion.div>
      )}
    </AnimatePresence>
  );
};

const LayerOrchestrator = () => {
  const { currentLayer, selectedCorridor, selectedCsId } = useLayer();
  const [roadsLoaded, setRoadsLoaded] = useState(false);

  useEffect(() => {
    getRoads().then(() => setRoadsLoaded(true));
  }, []);

  if (!roadsLoaded) {
    return (
      <div className="w-full h-full flex items-center justify-center bg-[var(--bg-base)]">
        <motion.div
          className="flex flex-col items-center gap-6"
          initial={{ opacity: 0, y: 8 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ duration: 0.5 }}
        >
          {/* Animated hexagon logo */}
          <motion.div
            className="text-[var(--amber)] text-[48px] leading-none"
            animate={{ rotate: [0, 30, 0, -30, 0] }}
            transition={{ duration: 3, repeat: Infinity, ease: 'easeInOut' }}
          >
            ⬡
          </motion.div>
          <div className="font-display text-2xl text-[var(--navy)] tracking-tight">COLDGRID AI</div>
          <div className="flex items-center gap-3 font-mono text-[11px] text-[var(--text-secondary)] uppercase tracking-widest">
            <div className="w-2 h-2 rounded-full bg-[var(--amber)] animate-pulse" />
            Initializing Network...
          </div>
          {/* Progress dots */}
          <div className="flex gap-2 mt-2">
            {[0, 1, 2].map(i => (
              <motion.div
                key={i}
                className="w-1.5 h-1.5 rounded-full bg-[var(--navy)]"
                animate={{ opacity: [0.2, 1, 0.2] }}
                transition={{ duration: 1.2, repeat: Infinity, delay: i * 0.3 }}
              />
            ))}
          </div>
        </motion.div>
      </div>
    );
  }

  // Determine layer states
  const isGlobeActive = currentLayer === 'globe';
  const isNationalActive = currentLayer === 'national' || currentLayer === 'corridor' || currentLayer === 'coldstore';
  const isCorridorActive = currentLayer === 'corridor';
  const isColdStoreActive = currentLayer === 'coldstore';

  // National Map is the base for layers 1, 2, 3
  // It dims when 2 or 3 are active
  const nationalOpacity = currentLayer === 'national' ? 1 : 
                          currentLayer === 'corridor' ? 0.2 : 
                          currentLayer === 'coldstore' ? 0.7 : 0;
  
  const nationalScale = currentLayer === 'national' ? 1 : 0.97;
  const nationalWidth = currentLayer === 'coldstore' ? '40%' : '100%'; // map shrinks to 40% on cold store

  return (
    <div className="w-full h-full relative overflow-hidden bg-[var(--bg-base)]">
      <ReconnectingBanner />
      
      {/* Globe Layer */}
      <AnimatePresence>
        {isGlobeActive && (
          <motion.div
            key="globe"
            className="absolute inset-0 z-50"
            initial={{ opacity: 1 }}
            exit={{ opacity: 0, transition: { duration: 0.8 } }}
          >
            <ErrorBoundary>
              <GlobeLayer />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* National Map Layer (Stays mounted once loaded) */}
      <motion.div
        className="absolute inset-0 z-10 origin-left"
        initial={{ opacity: 0, scale: 1 }}
        animate={{ 
          opacity: isNationalActive ? nationalOpacity : 0, 
          scale: nationalScale,
          width: nationalWidth
        }}
        transition={{ duration: 0.4, ease: "easeOut" }}
        style={{ pointerEvents: currentLayer === 'national' ? 'auto' : 'none' }}
      >
        <ErrorBoundary>
          <NationalMapLayer />
        </ErrorBoundary>
      </motion.div>

      {/* Corridor Layer Panel */}
      <AnimatePresence>
        {isCorridorActive && (
          <motion.div
            key="corridor"
            className="absolute inset-0 z-20 pointer-events-none"
          >
            <ErrorBoundary>
              <CorridorLayer />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

      {/* Cold Store Layer Panel */}
      <AnimatePresence>
        {isColdStoreActive && (
          <motion.div
            key="coldstore"
            className="absolute inset-0 z-30 pointer-events-none"
          >
            <ErrorBoundary>
              <ColdStoreLayer />
            </ErrorBoundary>
          </motion.div>
        )}
      </AnimatePresence>

    </div>
  );
};

export default function App() {
  return (
    <WebSocketProvider>
      <LayerProvider>
        <LayerOrchestrator />
      </LayerProvider>
    </WebSocketProvider>
  );
}