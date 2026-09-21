import { useState, useCallback, useRef, useEffect } from 'react';
import useSound from 'use-sound';

/**
 * Sound asset paths.
 * Place physical .mp3 files into public/sounds/ to use custom audio,
 * or rely on the integrated procedural Web Audio API synthesizer.
 */
export const SOUND_PATHS = {
  footsteps: '/sounds/footsteps.mp3',
  domeLift: '/sounds/dome-lift.mp3',
  crack: '/sounds/candy-crack.mp3',
  scratch: '/sounds/candy-scratch.mp3',
  shatter: '/sounds/candy-shatter.mp3',
  success: '/sounds/celebration.mp3',
  buzzer: '/sounds/buzzer.mp3',
  click: '/sounds/button-click.mp3',
  bgm: '/sounds/squid-game-theme.mp3',
};

/**
 * Web Audio API procedural synthesizer.
 * Includes complete procedural synthesis for:
 * 1. Sound effects: Footsteps, dome ringing, needle scratch, brittle candy cracks, elimination buzzer, celebration chords.
 * 2. Background Music: The iconic Squid Game soundtrack recorder melody ("Way Back Then" / Dalgona Theme) with rhythmic woodblock percussion!
 */
class WebAudioSynth {
  constructor() {
    this.ctx = null;
    this.bgmGain = null;
    this.bgmRunning = false;
    this.bgmTimer = null;
  }

  init() {
    if (!this.ctx && typeof window !== 'undefined') {
      const AudioCtx = window.AudioContext || window.webkitAudioContext;
      if (AudioCtx) {
        this.ctx = new AudioCtx();
      }
    }
    if (this.ctx && this.ctx.state === 'suspended') {
      this.ctx.resume();
    }
  }

  // --- SOUND EFFECTS ---

  playCrack() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    osc.type = 'triangle';
    osc.frequency.setValueAtTime(1400 + Math.random() * 400, now);
    osc.frequency.exponentialRampToValueAtTime(120, now + 0.06);

    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(2200, now);
    filter.Q.setValueAtTime(3, now);

    gain.gain.setValueAtTime(0.45, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.08);

    osc.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.08);

    // Noise burst for crunchy sugar fracture
    const bufferSize = this.ctx.sampleRate * 0.04;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = Math.random() * 2 - 1;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const noiseFilter = this.ctx.createBiquadFilter();
    noiseFilter.type = 'highpass';
    noiseFilter.frequency.setValueAtTime(3000, now);

    const noiseGain = this.ctx.createGain();
    noiseGain.gain.setValueAtTime(0.3, now);
    noiseGain.gain.exponentialRampToValueAtTime(0.001, now + 0.05);

    noise.connect(noiseFilter);
    noiseFilter.connect(noiseGain);
    noiseGain.connect(this.ctx.destination);

    noise.start(now);
  }

  playScratch(intensity = 1) {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = Math.floor(this.ctx.sampleRate * 0.045);
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * 0.75;
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'bandpass';
    filter.frequency.setValueAtTime(3400 + Math.random() * 700, now);
    filter.Q.setValueAtTime(4.5, now);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(Math.min(0.3, 0.16 * intensity), now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.042);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playShatter() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const bufferSize = this.ctx.sampleRate * 0.35;
    const buffer = this.ctx.createBuffer(1, bufferSize, this.ctx.sampleRate);
    const data = buffer.getChannelData(0);
    for (let i = 0; i < bufferSize; i++) {
      data[i] = (Math.random() * 2 - 1) * Math.exp(-i / (this.ctx.sampleRate * 0.09));
    }

    const noise = this.ctx.createBufferSource();
    noise.buffer = buffer;

    const filter = this.ctx.createBiquadFilter();
    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2800, now);
    filter.frequency.exponentialRampToValueAtTime(400, now + 0.3);

    const gain = this.ctx.createGain();
    gain.gain.setValueAtTime(0.7, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.35);

    noise.connect(filter);
    filter.connect(gain);
    gain.connect(this.ctx.destination);

    noise.start(now);
  }

  playDomeLift() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const freqs = [660, 990, 1320];
    freqs.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      osc.type = 'sine';
      osc.frequency.setValueAtTime(freq, now);
      osc.frequency.linearRampToValueAtTime(freq + 40, now + 0.4);

      gain.gain.setValueAtTime(0.18 / (idx + 1), now);
      gain.gain.exponentialRampToValueAtTime(0.001, now + 0.9);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(now);
      osc.stop(now + 0.9);
    });
  }

  playFootstep() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(90, now);
    osc.frequency.exponentialRampToValueAtTime(35, now + 0.12);

    gain.gain.setValueAtTime(0.35, now);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.12);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.13);
  }

  playBuzzer() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sawtooth';
    osc.frequency.setValueAtTime(130, now);

    gain.gain.setValueAtTime(0.5, now);
    gain.gain.setValueAtTime(0, now + 0.2);
    gain.gain.setValueAtTime(0.5, now + 0.26);
    gain.gain.exponentialRampToValueAtTime(0.01, now + 0.65);

    osc.connect(gain);
    gain.connect(this.ctx.destination);

    osc.start(now);
    osc.stop(now + 0.65);
  }

  playSuccess() {
    this.init();
    if (!this.ctx) return;
    const now = this.ctx.currentTime;

    const notes = [523.25, 659.25, 783.99, 1046.5];
    notes.forEach((freq, idx) => {
      const osc = this.ctx.createOscillator();
      const gain = this.ctx.createGain();
      const noteTime = now + idx * 0.12;

      osc.type = 'triangle';
      osc.frequency.setValueAtTime(freq, noteTime);

      gain.gain.setValueAtTime(0, now);
      gain.gain.setValueAtTime(0.3, noteTime);
      gain.gain.exponentialRampToValueAtTime(0.001, noteTime + 0.8);

      osc.connect(gain);
      gain.connect(this.ctx.destination);

      osc.start(noteTime);
      osc.stop(noteTime + 0.8);
    });
  }

  // --- SQUID GAME BACKGROUND MUSIC (BGM) SEQUENCER ---

  startBgm() {
    this.init();
    if (!this.ctx) return;
    if (this.bgmRunning) return;
    this.bgmRunning = true;

    if (!this.bgmGain) {
      this.bgmGain = this.ctx.createGain();
      this.bgmGain.connect(this.ctx.destination);
    }
    this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
    this.bgmGain.gain.setValueAtTime(0.22, this.ctx.currentTime);

    // Iconic Squid Game Recorder melody ("Way Back Then" / Dalgona Theme)
    // E-G-A-B-D-E pentatonic motif with authentic rhythmic rests
    const melody = [
      // Measure 1
      { f: 493.88, d: 0.26 }, // B4
      { f: 493.88, d: 0.26 }, // B4
      { f: 587.33, d: 0.26 }, // D5
      { f: 493.88, d: 0.26 }, // B4
      { f: 440.0, d: 0.26 },  // A4
      { f: 392.0, d: 0.26 },  // G4
      { f: 329.63, d: 0.52 }, // E4
      { r: true, d: 0.26 },   // rest

      // Measure 2
      { f: 392.0, d: 0.26 },  // G4
      { f: 440.0, d: 0.26 },  // A4
      { f: 493.88, d: 0.26 }, // B4
      { f: 440.0, d: 0.26 },  // A4
      { f: 392.0, d: 0.26 },  // G4
      { f: 329.63, d: 0.52 }, // E4
      { r: true, d: 0.26 },   // rest

      // Measure 3
      { f: 493.88, d: 0.26 }, // B4
      { f: 587.33, d: 0.26 }, // D5
      { f: 659.25, d: 0.36 }, // E5
      { f: 587.33, d: 0.26 }, // D5
      { f: 493.88, d: 0.26 }, // B4
      { f: 440.0, d: 0.26 },  // A4
      { f: 392.0, d: 0.26 },  // G4
      { f: 329.63, d: 0.52 }, // E4

      // Measure 4 (Playful cadence)
      { f: 392.0, d: 0.26 },  // G4
      { f: 329.63, d: 0.26 }, // E4
      { f: 392.0, d: 0.26 },  // G4
      { f: 329.63, d: 0.52 }, // E4
      { r: true, d: 0.52 },   // rest
    ];

    let step = 0;
    const tick = () => {
      if (!this.bgmRunning || !this.ctx) return;
      const cur = melody[step % melody.length];
      const now = this.ctx.currentTime;

      // Ominous rhythmic woodblock ticking
      if (step % 2 === 0) {
        this.playWoodblock(now);
      }

      // Eerie recorder flute note
      if (!cur.r && cur.f) {
        this.playRecorder(cur.f, cur.d, now);
      }

      step++;
      const nextDelay = (cur.d || 0.26) * 1000;
      this.bgmTimer = setTimeout(tick, nextDelay);
    };

    this.bgmTimer = setTimeout(tick, 100);
  }

  playRecorder(freq, duration, now) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const oscTri = this.ctx.createOscillator();
    const noteGain = this.ctx.createGain();
    const filter = this.ctx.createBiquadFilter();

    // Subtle recorder vibrato LFO (5.6 Hz)
    const lfo = this.ctx.createOscillator();
    const lfoGain = this.ctx.createGain();
    lfo.frequency.setValueAtTime(5.6, now);
    lfoGain.gain.setValueAtTime(5.2, now);
    lfo.connect(osc.frequency);
    lfo.connect(oscTri.frequency);
    lfo.start(now);
    lfo.stop(now + duration);

    osc.type = 'sine';
    osc.frequency.setValueAtTime(freq, now);

    oscTri.type = 'triangle';
    oscTri.frequency.setValueAtTime(freq * 2, now); // soft 2nd harmonic

    filter.type = 'lowpass';
    filter.frequency.setValueAtTime(2600, now);

    // Breath envelope
    noteGain.gain.setValueAtTime(0.001, now);
    noteGain.gain.linearRampToValueAtTime(0.18, now + 0.035);
    noteGain.gain.setValueAtTime(0.15, now + duration - 0.04);
    noteGain.gain.exponentialRampToValueAtTime(0.001, now + duration);

    osc.connect(filter);
    oscTri.connect(filter);
    filter.connect(noteGain);
    noteGain.connect(this.bgmGain);

    osc.start(now);
    oscTri.start(now);
    osc.stop(now + duration);
    oscTri.stop(now + duration);
  }

  playWoodblock(now) {
    if (!this.ctx || !this.bgmGain) return;

    const osc = this.ctx.createOscillator();
    const gain = this.ctx.createGain();

    osc.type = 'sine';
    osc.frequency.setValueAtTime(820, now);
    osc.frequency.exponentialRampToValueAtTime(140, now + 0.035);

    gain.gain.setValueAtTime(0.12, now);
    gain.gain.exponentialRampToValueAtTime(0.001, now + 0.035);

    osc.connect(gain);
    gain.connect(this.bgmGain);

    osc.start(now);
    osc.stop(now + 0.04);
  }

  stopBgm() {
    this.bgmRunning = false;
    if (this.bgmTimer) {
      clearTimeout(this.bgmTimer);
      this.bgmTimer = null;
    }
    if (this.bgmGain && this.ctx) {
      this.bgmGain.gain.cancelScheduledValues(this.ctx.currentTime);
      this.bgmGain.gain.linearRampToValueAtTime(0.001, this.ctx.currentTime + 0.25);
    }
  }
}

const synthInstance = new WebAudioSynth();

/**
 * Main game audio hook.
 * Integrates both use-sound (for mp3 assets) and WebAudio procedural synthesis.
 */
export function useGameAudio() {
  const [isMuted, setIsMuted] = useState(false);
  const [isBgmEnabled, setIsBgmEnabled] = useState(true);
  const [isBgmPlaying, setIsBgmPlaying] = useState(false);
  const footstepIntervalRef = useRef(null);
  const hasMp3LoadedRef = useRef(false);

  // use-sound hooks
  const [playRawFootsteps, { stop: stopRawFootsteps }] = useSound(SOUND_PATHS.footsteps, {
    volume: 0.5,
    soundEnabled: !isMuted,
  });

  const [playRawDomeLift] = useSound(SOUND_PATHS.domeLift, {
    volume: 0.7,
    soundEnabled: !isMuted,
  });

  const [playRawCrack] = useSound(SOUND_PATHS.crack, {
    volume: 0.6,
    soundEnabled: !isMuted,
  });

  const [playRawScratch] = useSound(SOUND_PATHS.scratch, {
    volume: 0.4,
    soundEnabled: !isMuted,
  });

  const [playRawShatter] = useSound(SOUND_PATHS.shatter, {
    volume: 0.8,
    soundEnabled: !isMuted,
  });

  const [playRawSuccess] = useSound(SOUND_PATHS.success, {
    volume: 0.7,
    soundEnabled: !isMuted,
  });

  const [playRawBuzzer] = useSound(SOUND_PATHS.buzzer, {
    volume: 0.8,
    soundEnabled: !isMuted,
  });

  const [playRawBgm, { stop: stopRawBgm }] = useSound(SOUND_PATHS.bgm, {
    volume: 0.45,
    loop: true,
    soundEnabled: !isMuted && isBgmEnabled,
    onload: () => {
      hasMp3LoadedRef.current = true;
    },
    onloaderror: () => {
      hasMp3LoadedRef.current = false;
    },
  });

  // Sound effect triggers
  const playCrack = useCallback(() => {
    if (isMuted) return;
    try {
      playRawCrack();
    } catch {
      // Ignored
    }
    synthInstance.playCrack();
  }, [isMuted, playRawCrack]);

  const playScratch = useCallback((intensity = 1) => {
    if (isMuted) return;
    try {
      playRawScratch();
    } catch {
      // Ignored
    }
    synthInstance.playScratch(intensity);
  }, [isMuted, playRawScratch]);

  const playShatter = useCallback(() => {
    if (isMuted) return;
    try {
      playRawShatter();
    } catch {
      // Ignored
    }
    synthInstance.playShatter();
  }, [isMuted, playRawShatter]);

  const playDomeLift = useCallback(() => {
    if (isMuted) return;
    try {
      playRawDomeLift();
    } catch {
      // Ignored
    }
    synthInstance.playDomeLift();
  }, [isMuted, playRawDomeLift]);

  const playFootstep = useCallback(() => {
    if (isMuted) return;
    try {
      playRawFootsteps();
    } catch {
      // Ignored
    }
    synthInstance.playFootstep();
  }, [isMuted, playRawFootsteps]);

  const playBuzzer = useCallback(() => {
    if (isMuted) return;
    try {
      playRawBuzzer();
    } catch {
      // Ignored
    }
    synthInstance.playBuzzer();
  }, [isMuted, playRawBuzzer]);

  const playSuccess = useCallback(() => {
    if (isMuted) return;
    try {
      playRawSuccess();
    } catch {
      // Ignored
    }
    synthInstance.playSuccess();
  }, [isMuted, playRawSuccess]);

  // Background Music (BGM) Controls
  const startBgm = useCallback(() => {
    if (isMuted || !isBgmEnabled) return;
    setIsBgmPlaying(true);
    try {
      playRawBgm();
    } catch {
      // Ignored if file not found
    }
    if (!hasMp3LoadedRef.current) {
      synthInstance.startBgm();
    }
  }, [isMuted, isBgmEnabled, playRawBgm]);

  const stopBgm = useCallback(() => {
    setIsBgmPlaying(false);
    try {
      stopRawBgm();
    } catch {
      // Ignored
    }
    synthInstance.stopBgm();
  }, [stopRawBgm]);

  const toggleBgm = useCallback(() => {
    setIsBgmEnabled((prev) => {
      const next = !prev;
      if (!next) {
        setIsBgmPlaying(false);
        try {
          stopRawBgm();
        } catch {
          // Ignored
        }
        synthInstance.stopBgm();
      }
      return next;
    });
  }, [stopRawBgm]);

  // Continuous footstep loop for walking guard
  const startFootstepLoop = useCallback((intervalMs = 450) => {
    if (footstepIntervalRef.current) return;
    playFootstep();
    footstepIntervalRef.current = setInterval(() => {
      playFootstep();
    }, intervalMs);
  }, [playFootstep]);

  const stopFootstepLoop = useCallback(() => {
    if (footstepIntervalRef.current) {
      clearInterval(footstepIntervalRef.current);
      footstepIntervalRef.current = null;
    }
    try {
      stopRawFootsteps();
    } catch {
      // Ignored
    }
  }, [stopRawFootsteps]);

  const toggleMute = useCallback(() => {
    setIsMuted((prev) => {
      const next = !prev;
      if (next) {
        synthInstance.stopBgm();
        try {
          stopRawBgm();
        } catch {
          // Ignored
        }
      }
      return next;
    });
  }, [stopRawBgm]);

  // Cleanup on unmount
  useEffect(() => {
    return () => {
      synthInstance.stopBgm();
    };
  }, []);

  return {
    isMuted,
    toggleMute,
    isBgmEnabled,
    isBgmPlaying,
    startBgm,
    stopBgm,
    toggleBgm,
    playCrack,
    playScratch,
    playShatter,
    playDomeLift,
    playFootstep,
    playBuzzer,
    playSuccess,
    startFootstepLoop,
    stopFootstepLoop,
  };
}
