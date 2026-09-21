import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Volume2, VolumeX, Music } from 'lucide-react';
import InputScreen from './components/InputScreen';
import GuardLoader from './components/GuardLoader';
import DalgonaGame from './components/DalgonaGame';
import { useGameAudio } from './hooks/useGameAudio';

/**
 * App Component
 * State manager orchestrating the transition between:
 * 1. 'input' phase: Minimalist, ominous URL input & Dalgona stamp selection
 * 2. 'loading' phase: GuardLoader animation of pink guard carrying cloche dome
 * 3. 'game' phase: Dalgona honeycomb carving game over scannable QR code
 */
export default function App() {
  // Phase state machine: 'input' | 'loading' | 'game'
  const [phase, setPhase] = useState('input');
  const [gameData, setGameData] = useState({
    url: 'https://netflix.com',
    shape: 'triangle',
  });

  // Global game audio system
  const audio = useGameAudio();

  /**
   * Transition 1: Input submitted -> Start Loading (Guard Enters)
   */
  const handleStartLoading = ({ url, shape }) => {
    setGameData({ url, shape });
    setPhase('loading');
  };

  /**
   * Transition 2: Guard finishes presenting cloche -> Start Dalgona Game
   */
  const handleLoadingComplete = () => {
    setPhase('game');
  };

  /**
   * Transition 3: Reset back to Input phase
   */
  const handleReset = () => {
    audio.stopBgm();
    setPhase('input');
  };

  return (
    <div className="min-h-screen w-full bg-[#090a0d] text-zinc-100 flex flex-col items-center justify-between relative overflow-hidden font-sans select-none scanlines">
      {/* Background Ambience & Dystopian Vignette */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div className="absolute top-0 left-1/4 w-96 h-96 bg-[#ff007a]/5 blur-[120px] rounded-full" />
        <div className="absolute bottom-0 right-1/4 w-96 h-96 bg-[#037a4b]/5 blur-[120px] rounded-full" />
        <div className="absolute inset-0 bg-[radial-gradient(ellipse_at_center,transparent_0%,rgba(0,0,0,0.75)_100%)]" />
      </div>

      {/* Top Global Navigation Bar */}
      <header className="w-full max-w-5xl px-6 py-5 flex items-center justify-between z-10 border-b border-zinc-800/60 backdrop-blur-xs">
        {/* Squid Game Brand / Geometric Identity */}
        <div className="flex items-center gap-3">
          <div className="flex items-center gap-1.5 text-[#ff007a] font-squid text-lg tracking-widest font-black">
            <span>○</span>
            <span>△</span>
            <span>□</span>
          </div>
          <div className="h-4 w-px bg-zinc-800" />
          <span className="text-xs font-mono tracking-widest text-zinc-400 font-semibold">
            SQUID CODE // DALGONA QR
          </span>
        </div>

        {/* Status Badges & Sound Controller */}
        <div className="flex items-center gap-2.5">
          {/* Player Badge */}
          <div className="hidden sm:flex items-center gap-2 px-3 py-1 bg-zinc-900 border border-zinc-800 rounded-full text-xs font-mono text-zinc-400">
            <span className="w-2 h-2 rounded-full bg-emerald-500 animate-pulse" />
            <span>PLAYER 456</span>
          </div>

          {/* Squid Game Soundtrack Toggle */}
          <button
            onClick={audio.toggleBgm}
            aria-label={audio.isBgmEnabled ? 'Disable Soundtrack' : 'Enable Soundtrack'}
            className={`px-2.5 py-1.5 rounded-lg border text-xs font-mono flex items-center gap-1.5 transition-colors cursor-pointer ${
              audio.isBgmEnabled && !audio.isMuted
                ? 'bg-pink-950/40 border-pink-500/50 text-pink-400 pink-glow-sm'
                : 'bg-zinc-900 border-zinc-800 text-zinc-500 hover:text-zinc-300'
            }`}
            title={audio.isBgmEnabled ? 'Turn Squid Game soundtrack OFF' : 'Turn Squid Game soundtrack ON'}
          >
            <Music className="w-3.5 h-3.5" />
            <span className="hidden sm:inline">OST {audio.isBgmEnabled && !audio.isMuted ? 'ON' : 'OFF'}</span>
          </button>

          {/* Audio Mute Toggle Button */}
          <button
            onClick={audio.toggleMute}
            aria-label={audio.isMuted ? 'Unmute Audio' : 'Mute Audio'}
            className="p-2 rounded-lg bg-zinc-900/90 hover:bg-zinc-800 text-zinc-300 hover:text-white border border-zinc-800 transition-colors cursor-pointer"
            title={audio.isMuted ? 'Unmute sound effects' : 'Mute sound effects'}
          >
            {audio.isMuted ? (
              <VolumeX className="w-4 h-4 text-zinc-500" />
            ) : (
              <Volume2 className="w-4 h-4 text-[#ff007a]" />
            )}
          </button>
        </div>
      </header>

      {/* Main Interactive Stage Container */}
      <main className="w-full flex-1 flex flex-col items-center justify-center p-4 sm:p-6 z-10">
        <AnimatePresence mode="wait">
          {phase === 'input' && (
            <motion.div
              key="input-screen"
              initial={{ opacity: 0, scale: 0.96 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.96 }}
              transition={{ duration: 0.35 }}
              className="w-full flex justify-center"
            >
              <InputScreen
                initialUrl={gameData.url}
                onGenerate={handleStartLoading}
              />
            </motion.div>
          )}

          {phase === 'loading' && (
            <motion.div
              key="guard-loader"
              initial={{ opacity: 0, y: 10 }}
              animate={{ opacity: 1, y: 0 }}
              exit={{ opacity: 0, y: -10 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <GuardLoader
                audio={audio}
                shape={gameData.shape}
                onComplete={handleLoadingComplete}
              />
            </motion.div>
          )}

          {phase === 'game' && (
            <motion.div
              key="dalgona-game"
              initial={{ opacity: 0, scale: 0.94 }}
              animate={{ opacity: 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.94 }}
              transition={{ duration: 0.4 }}
              className="w-full flex justify-center"
            >
              <DalgonaGame
                url={gameData.url}
                shape={gameData.shape}
                audio={audio}
                onReset={handleReset}
              />
            </motion.div>
          )}
        </AnimatePresence>
      </main>

      {/* Footer Details */}
      <footer className="w-full max-w-5xl px-6 py-4 flex flex-col sm:flex-row items-center justify-between text-[11px] font-mono text-zinc-600 border-t border-zinc-900 z-10">
        <div className="flex items-center gap-2">
          <span>ROUND 2: SUGAR HONEYCOMBS</span>
          <span>•</span>
          <span className="text-zinc-500">REACT + TAILWIND + FRAMER-MOTION + QRCODE</span>
        </div>
        <div className="mt-2 sm:mt-0 flex items-center gap-3">
          <span>CAUTION: CLICK CADENCE MONITORED</span>
        </div>
      </footer>
    </div>
  );
}
