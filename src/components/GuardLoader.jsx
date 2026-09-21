import React, { useEffect, useState } from 'react';
import { motion } from 'framer-motion';

/**
 * GuardLoader component
 * Uses Framer Motion to animate a pink-suited Squid Game guard walking in,
 * carrying a silver cloche dome on a platter, and lifting it to reveal the Dalgona challenge.
 */
export default function GuardLoader({ onComplete, audio, shape = 'circle' }) {
  // Animation phases: 'walking' -> 'presenting' -> 'lifting' -> 'ready'
  const [phase, setPhase] = useState('walking');

  useEffect(() => {
    // 1. Start footsteps loop as guard walks in
    audio?.startFootstepLoop(420);

    // 2. Guard arrives at center platter position
    const arriveTimer = setTimeout(() => {
      audio?.stopFootstepLoop();
      setPhase('presenting');
    }, 2200);

    // 3. Cloche dome lifts up
    const liftTimer = setTimeout(() => {
      setPhase('lifting');
      audio?.playDomeLift();
    }, 3200);

    // 4. Transition to actual game
    const completeTimer = setTimeout(() => {
      setPhase('ready');
      onComplete?.();
    }, 4800);

    return () => {
      clearTimeout(arriveTimer);
      clearTimeout(liftTimer);
      clearTimeout(completeTimer);
      audio?.stopFootstepLoop();
    };
  }, [audio, onComplete]);

  return (
    <div className="relative w-full max-w-2xl min-h-[520px] flex flex-col items-center justify-center overflow-hidden rounded-2xl bg-gradient-to-b from-[#111319] to-[#07080b] border border-pink-900/30 p-8 shadow-2xl">
      {/* Top Status & Skip */}
      <div className="absolute top-4 left-6 right-6 flex items-center justify-between text-xs tracking-widest font-mono text-zinc-500 uppercase z-20">
        <div className="flex items-center gap-2">
          <span className="inline-block w-2 h-2 rounded-full bg-[#ff007a] animate-ping" />
          <span className="text-pink-500 font-semibold">ROUND 02 // DELIVERY PROTOCOL</span>
        </div>
        <button
          onClick={() => {
            audio?.stopFootstepLoop();
            onComplete?.();
          }}
          className="px-3 py-1 bg-zinc-800/80 hover:bg-zinc-700 text-zinc-300 rounded border border-zinc-700/60 transition-colors"
        >
          SKIP INTRO [ESC]
        </button>
      </div>

      {/* Atmospheric Stage Lighting */}
      <div className="absolute inset-0 pointer-events-none">
        {/* Overhead dramatic spotlight */}
        <div className="absolute top-0 left-1/2 -translate-x-1/2 w-72 h-96 bg-gradient-to-b from-pink-500/15 via-pink-500/5 to-transparent blur-2xl rounded-full" />
        {/* Floor shadow */}
        <div className="absolute bottom-16 left-1/2 -translate-x-1/2 w-80 h-10 bg-black/70 blur-md rounded-[100%]" />
      </div>

      {/* Guard & Platter Scene */}
      <div className="relative w-full flex flex-col items-center justify-center pt-8">
        {/* Walking & Standing Guard Figure */}
        <motion.div
          initial={{ x: -260, opacity: 0 }}
          animate={
            phase === 'walking'
              ? {
                  x: 0,
                  opacity: 1,
                  y: [0, -10, 0],
                  transition: {
                    x: { duration: 2.2, ease: 'easeOut' },
                    y: { repeat: Infinity, duration: 0.44, ease: 'easeInOut' },
                  },
                }
              : {
                  x: 0,
                  opacity: 1,
                  y: 0,
                  transition: { duration: 0.3 },
                }
          }
          className="relative flex flex-col items-center"
        >
          {/* Guard SVG Character */}
          <div className="relative w-48 h-64 flex items-center justify-center select-none">
            <svg
              viewBox="0 0 200 280"
              className="w-full h-full drop-shadow-[0_15px_25px_rgba(0,0,0,0.8)]"
            >
              {/* Pink Hood / Body */}
              {/* Hood */}
              <path
                d="M 60 90 C 55 30, 145 30, 140 90 C 140 120, 60 120, 60 90 Z"
                fill="#ff007a"
              />
              <path
                d="M 68 85 C 64 40, 136 40, 132 85 C 132 110, 68 110, 68 85 Z"
                fill="#121316"
              />

              {/* Mask Face mesh */}
              <ellipse cx="100" cy="80" rx="30" ry="34" fill="#090a0d" stroke="#27272a" strokeWidth="2" />
              {/* Mask Symbol (Triangle Guard by default) */}
              <polygon
                points="100,60 120,95 80,95"
                fill="none"
                stroke="#ffffff"
                strokeWidth="4"
                strokeLinejoin="round"
                className="drop-shadow-[0_0_6px_rgba(255,255,255,0.9)]"
              />

              {/* Suit Shoulders & Torso */}
              <path
                d="M 40 130 C 45 105, 75 105, 100 110 C 125 105, 155 105, 160 130 L 168 230 L 32 230 Z"
                fill="#e11d48"
              />
              {/* Center Zipper */}
              <line x1="100" y1="110" x2="100" y2="230" stroke="#18181b" strokeWidth="4" />

              {/* Black Tactical Harness Belts */}
              <path d="M 65 110 L 85 230" stroke="#18181b" strokeWidth="6" />
              <path d="M 135 110 L 115 230" stroke="#18181b" strokeWidth="6" />
              <line x1="45" y1="185" x2="155" y2="185" stroke="#18181b" strokeWidth="8" />
              <rect x="92" y="180" width="16" height="10" fill="#71717a" rx="2" />

              {/* Left & Right Arms Holding Platter */}
              <path
                d="M 45 130 C 35 170, 50 195, 70 200"
                fill="none"
                stroke="#e11d48"
                strokeWidth="18"
                strokeLinecap="round"
              />
              <path
                d="M 155 130 C 165 170, 150 195, 130 200"
                fill="none"
                stroke="#e11d48"
                strokeWidth="18"
                strokeLinecap="round"
              />

              {/* Black Gloved Hands */}
              <ellipse cx="68" cy="202" rx="10" ry="8" fill="#18181b" />
              <ellipse cx="132" cy="202" rx="10" ry="8" fill="#18181b" />
            </svg>
          </div>

          {/* Platter & Cloche Dome Container */}
          <div className="relative -mt-16 z-10 flex flex-col items-center">
            {/* The Silver Cloche Dome */}
            <motion.div
              className="relative z-20 cursor-pointer"
              initial={{ y: 0, opacity: 1, scale: 1 }}
              animate={
                phase === 'lifting' || phase === 'ready'
                  ? {
                      y: -140,
                      opacity: 0,
                      scale: 1.15,
                      rotate: -4,
                      transition: { duration: 1.4, ease: [0.22, 1, 0.36, 1] },
                    }
                  : { y: 0, opacity: 1 }
              }
            >
              {/* Cloche Handle Knob */}
              <div className="w-5 h-5 mx-auto bg-gradient-to-t from-zinc-400 to-zinc-100 rounded-full border border-zinc-300 shadow-md" />
              {/* Dome Body */}
              <div className="w-48 h-24 bg-gradient-to-b from-zinc-200 via-zinc-400 to-zinc-600 rounded-t-full relative overflow-hidden border-t border-zinc-100 shadow-[0_12px_24px_rgba(0,0,0,0.6)]">
                {/* Metallic Highlight Reflection */}
                <div className="absolute top-1 left-6 w-8 h-18 bg-white/40 blur-xs rounded-full transform -rotate-25" />
                <div className="absolute bottom-0 inset-x-0 h-3 bg-gradient-to-r from-zinc-600 via-zinc-200 to-zinc-600 border-t border-zinc-400/50" />
              </div>
            </motion.div>

            {/* Revealed Dalgona Tin (appears as cloche lifts) */}
            <motion.div
              initial={{ opacity: 0, scale: 0.8 }}
              animate={
                phase === 'lifting' || phase === 'ready'
                  ? { opacity: 1, scale: 1, transition: { delay: 0.3, duration: 0.8 } }
                  : { opacity: 0 }
              }
              className="absolute -top-6 z-10 flex flex-col items-center"
            >
              {/* Golden Radiance */}
              <div className="absolute -inset-4 bg-amber-500/30 blur-xl rounded-full animate-pulse" />
              
              {/* Vintage Tin Container */}
              <div className="w-36 h-36 rounded-full bg-gradient-to-br from-zinc-300 via-zinc-500 to-zinc-800 p-2 shadow-2xl flex items-center justify-center border-2 border-zinc-400/80">
                {/* Honeycomb Candy Puck Preview */}
                <div className="w-30 h-30 rounded-full bg-gradient-to-br from-[#f59e0b] via-[#d97706] to-[#92400e] border border-amber-300/40 flex items-center justify-center relative shadow-inner">
                  {/* Stamped Center Shape */}
                  {shape === 'triangle' && (
                    <div className="w-10 h-10 border-2 border-amber-950/80 rotate-0 [clip-path:polygon(50%_0%,0%_100%,100%_100%)] bg-amber-600/40" />
                  )}
                  {shape === 'star' && (
                    <span className="text-2xl text-amber-950/80 font-bold select-none">★</span>
                  )}
                  {shape === 'umbrella' && (
                    <span className="text-2xl text-amber-950/80 font-bold select-none">☂</span>
                  )}
                  {shape === 'circle' && (
                    <div className="w-12 h-12 rounded-full border-2 border-amber-950/80 border-dashed" />
                  )}
                </div>
              </div>
            </motion.div>

            {/* Silver Serving Platter Tray */}
            <div className="w-64 h-7 bg-gradient-to-r from-zinc-500 via-zinc-200 to-zinc-500 rounded-[100%] shadow-[0_15px_30px_rgba(0,0,0,0.8)] border border-zinc-300 flex items-center justify-center relative">
              <div className="w-56 h-4 bg-gradient-to-r from-zinc-400 via-zinc-100 to-zinc-400 rounded-[100%] border border-zinc-300/60" />
            </div>
          </div>
        </motion.div>
      </div>

      {/* Atmospheric Subtitle & Instructions */}
      <div className="mt-8 text-center z-10 space-y-1">
        <motion.p
          key={phase}
          initial={{ opacity: 0, y: 6 }}
          animate={{ opacity: 1, y: 0 }}
          className="text-sm font-mono tracking-wider font-semibold"
        >
          {phase === 'walking' && (
            <span className="text-zinc-400">THE GUARD APPROACHES WITH YOUR DALGONA...</span>
          )}
          {phase === 'presenting' && (
            <span className="text-pink-400">TIN CONTAINER PLACED UPON THE TABLE</span>
          )}
          {phase === 'lifting' && (
            <span className="text-amber-400">LIFTING CLOCHE DOME // INSPECT CANDY</span>
          )}
          {phase === 'ready' && (
            <span className="text-emerald-400">PREPARE YOUR NEEDLE. DO NOT CRACK THE QR CODE.</span>
          )}
        </motion.p>
        <p className="text-xs text-zinc-600 font-mono">
          {phase !== 'ready' ? 'DO NOT MAKE SUDDEN MOVEMENTS' : 'COMMENCING ROUND 2'}
        </p>
      </div>
    </div>
  );
}
