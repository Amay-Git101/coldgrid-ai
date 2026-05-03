import React from 'react';
import { motion } from 'framer-motion';
import { useWebSocket } from '../contexts/WebSocketContext';

export default function BottomTicker() {
  const { decisions } = useWebSocket();
  const recentDecisions = (decisions || []).slice(0, 8); // Capped at 8 items

  if (recentDecisions.length === 0) return null;

  return (
    <div className="fixed bottom-0 left-0 w-full h-[32px] bg-[#0A192F] border-t border-[#1e293b] overflow-hidden flex items-center z-[50]">
      <div className="flex whitespace-nowrap overflow-hidden w-full">
        <motion.div
          className="flex items-center gap-16 shrink-0 px-8"
          animate={{ x: [0, -2000] }}
          transition={{
            repeat: Infinity,
            ease: "linear",
            duration: 60 // Slowed down significantly!
          }}
        >
          {recentDecisions.map((d, i) => {
            if (!d) return null;
            let agentColor = 'text-gray-400';
            if (d.agent_type === 'inventory')       agentColor = 'text-[#64B5F6]';
            if (d.agent_type === 'supplier')        agentColor = 'text-[#BA68C8]';
            if (d.agent_type === 'transportation')  agentColor = 'text-[#FFB74D]';
            if (d.agent_type === 'lateral_transfer') agentColor = 'text-[#ffb703]';
            if (d.agent_type === 'alert')           agentColor = 'text-[#ef233c]';

            return (
              <div key={d.id || i} className="flex items-center gap-3 font-mono text-[11px]">
                <span className={`font-bold uppercase tracking-wider ${agentColor}`}>
                  [{d.agent_type || 'SYSTEM'}]
                </span>
                <span className="text-white">
                  {d.action || d.decision}
                </span>
                <span className="text-gray-400">
                  {d.reasoning}
                </span>
              </div>
            );
          })}
          
          {/* Duplicated for infinite seamless scroll */}
          {recentDecisions.map((d, i) => {
            if (!d) return null;
            let agentColor = 'text-gray-400';
            if (d.agent_type === 'inventory')       agentColor = 'text-[#64B5F6]';
            if (d.agent_type === 'supplier')        agentColor = 'text-[#BA68C8]';
            if (d.agent_type === 'transportation')  agentColor = 'text-[#FFB74D]';
            if (d.agent_type === 'lateral_transfer') agentColor = 'text-[#ffb703]';
            if (d.agent_type === 'alert')           agentColor = 'text-[#ef233c]';

            return (
              <div key={`dup-${d.id || i}`} className="flex items-center gap-3 font-mono text-[11px]">
                <span className={`font-bold uppercase tracking-wider ${agentColor}`}>
                  [{d.agent_type || 'SYSTEM'}]
                </span>
                <span className="text-white">
                  {d.action || d.decision}
                </span>
                <span className="text-gray-400">
                  {d.reasoning}
                </span>
              </div>
            );
          })}
        </motion.div>
      </div>
    </div>
  );
}
