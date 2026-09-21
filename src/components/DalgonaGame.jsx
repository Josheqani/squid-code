import React, { useRef, useEffect, useState, useCallback, useMemo } from 'react';
import { QRCodeSVG } from 'qrcode.react';
import confetti from 'canvas-confetti';
import { motion, AnimatePresence } from 'framer-motion';
import {
  AlertTriangle,
  CheckCircle2,
  RotateCcw,
  ExternalLink,
  Download,
  Sparkles,
  Copy,
  Check,
  Flame,
  Scissors,
} from 'lucide-react';

// Canvas & Puck geometry
const CANVAS_SIZE = 360;
const CENTER = CANVAS_SIZE / 2;
const PUCK_RADIUS = 160;

// Fine Needle Carving Brush Size (scaled down from 16px to 6.0px for precise line tracing)
const NEEDLE_CARVE_RADIUS = 6.0;

// Maximum safe carving drag velocity (px/ms)
const SAFE_SPEED_LIMIT = 0.65;

/**
 * Generate contour checkpoints along the stamped shape outline.
 * Once ~88% of these points are carved/traced, the shape is successfully extracted!
 */
function getShapeCheckpoints(shape) {
  const points = [];

  if (shape === 'triangle') {
    const size = 58;
    const v0 = { x: CENTER, y: CENTER - size };
    const v1 = { x: CENTER + size * 0.92, y: CENTER + size * 0.6 };
    const v2 = { x: CENTER - size * 0.92, y: CENTER + size * 0.6 };

    const edges = [
      [v0, v1],
      [v1, v2],
      [v2, v0],
    ];

    edges.forEach(([pA, pB]) => {
      const steps = 14;
      for (let i = 0; i < steps; i++) {
        const t = i / steps;
        points.push({
          x: pA.x + (pB.x - pA.x) * t,
          y: pA.y + (pB.y - pA.y) * t,
        });
      }
    });
  } else if (shape === 'star') {
    const spikes = 5;
    const outerR = 60;
    const innerR = 28;
    const starVertices = [];
    const step = Math.PI / spikes;
    let rot = (Math.PI / 2) * 3;

    for (let i = 0; i < spikes; i++) {
      starVertices.push({
        x: CENTER + Math.cos(rot) * outerR,
        y: CENTER + Math.sin(rot) * outerR,
      });
      rot += step;
      starVertices.push({
        x: CENTER + Math.cos(rot) * innerR,
        y: CENTER + Math.sin(rot) * innerR,
      });
      rot += step;
    }

    for (let i = 0; i < starVertices.length; i++) {
      const pA = starVertices[i];
      const pB = starVertices[(i + 1) % starVertices.length];
      const steps = 4;
      for (let s = 0; s < steps; s++) {
        const t = s / steps;
        points.push({
          x: pA.x + (pB.x - pA.x) * t,
          y: pA.y + (pB.y - pA.y) * t,
        });
      }
    }
  } else if (shape === 'umbrella') {
    // Canopy top half-circle
    const arcSteps = 22;
    for (let i = 0; i <= arcSteps; i++) {
      const angle = Math.PI + (i / arcSteps) * Math.PI;
      points.push({
        x: CENTER + Math.cos(angle) * 48,
        y: CENTER - 8 + Math.sin(angle) * 48,
      });
    }
    // Bottom scallops
    for (let s = 1; s <= 4; s++) {
      const sx = CENTER + 48 - s * 24;
      for (let i = 0; i < 3; i++) {
        const angle = (i / 3) * Math.PI;
        points.push({
          x: sx + 12 + Math.cos(angle) * 12,
          y: CENTER - 8 - Math.sin(angle) * 12,
        });
      }
    }
    // Handle stem
    for (let i = 0; i <= 8; i++) {
      points.push({
        x: CENTER,
        y: CENTER - 8 + (58 * i) / 8,
      });
    }
  } else {
    // Circle default
    const steps = 36;
    for (let i = 0; i < steps; i++) {
      const angle = (i / steps) * Math.PI * 2;
      points.push({
        x: CENTER + Math.cos(angle) * 52,
        y: CENTER + Math.sin(angle) * 52,
      });
    }
  }

  return points;
}

/**
 * Realistic 3D Handheld Needle Overlay
 * Precise pivot at the sharp needle tip (0, 15). Follows pointer in real-time.
 */
function NeedleOverlay({ x, y, visible, isCarving, stress }) {
  if (!visible) return null;

  const isOverheating = stress > 65;
  const isCritical = stress > 85;

  return (
    <div
      className="pointer-events-none absolute inset-0 overflow-visible z-30"
      style={{
        transform: `translate3d(${x}px, ${y}px, 0)`,
        transition: isCarving ? 'none' : 'transform 0.03s ease-out',
      }}
    >
      {/* Dynamic Needle Drop Shadow */}
      <div
        className="absolute w-24 h-1.5 rounded-full bg-black/40 blur-[2px] -rotate-38 origin-left pointer-events-none"
        style={{
          transform: isCarving
            ? 'translate(2px, 3px) rotate(-32deg) scale(0.95)'
            : 'translate(6px, 10px) rotate(-40deg) scale(1.05)',
          opacity: isCarving ? 0.7 : 0.35,
          transition: 'all 0.12s ease-out',
        }}
      />

      {/* The Needle Graphic */}
      <div
        className={`relative -left-0 -top-[15px] w-32 h-32 pointer-events-none ${
          isCarving ? 'animate-[needle-wiggle_0.08s_infinite]' : ''
        }`}
        style={{
          transform: isCarving
            ? 'rotate(-34deg) translateY(-1px)'
            : 'rotate(-44deg) translateY(-5px)',
          transformOrigin: '0px 15px', // Exact tip position
          transition: 'transform 0.14s cubic-bezier(0.34, 1.56, 0.64, 1)',
        }}
      >
        <svg
          viewBox="0 0 140 30"
          className="w-32 h-7 drop-shadow-[0_2px_4px_rgba(0,0,0,0.6)]"
        >
          <defs>
            <linearGradient id="needleSteel" x1="0%" y1="0%" x2="0%" y2="100%">
              <stop offset="0%" stopColor="#ffffff" />
              <stop offset="25%" stopColor="#cbd5e1" />
              <stop offset="55%" stopColor="#64748b" />
              <stop offset="85%" stopColor="#334155" />
              <stop offset="100%" stopColor="#1e293b" />
            </linearGradient>

            <linearGradient id="needleHeat" x1="0%" y1="0%" x2="100%" y2="0%">
              <stop offset="0%" stopColor="#ff0044" />
              <stop offset="40%" stopColor="#ff7700" />
              <stop offset="100%" stopColor="#cbd5e1" />
            </linearGradient>
          </defs>

          {/* Sharp Needle Tip */}
          <polygon
            points="0,15 28,12 28,18"
            fill={isOverheating ? 'url(#needleHeat)' : 'url(#needleSteel)'}
          />

          {/* Needle Shaft */}
          <rect
            x="28"
            y="12.5"
            width="88"
            height="5"
            rx="1.5"
            fill="url(#needleSteel)"
          />

          {/* Needle Eye End */}
          <ellipse cx="122" cy="15" rx="8" ry="5.5" fill="url(#needleSteel)" />
          <ellipse cx="122" cy="15" rx="4.5" ry="1.8" fill="#0b0c10" />

          {/* Overheating Heat Glow */}
          {isOverheating && (
            <circle
              cx="2"
              cy="15"
              r={isCritical ? 9 : 5}
              fill="#ff1100"
              className="animate-ping opacity-75"
            />
          )}
        </svg>

        {/* Tip Contact Light when carving */}
        {isCarving && (
          <div className="absolute left-0 top-[14px] w-2 h-2 -translate-x-1 -translate-y-1 bg-amber-300 rounded-full blur-[1.5px] opacity-90" />
        )}
      </div>
    </div>
  );
}

/**
 * Main DalgonaGame Component
 */
export default function DalgonaGame({
  url = 'https://netflix.com',
  shape = 'triangle',
  audio,
  onReset,
}) {
  const canvasRef = useRef(null);
  const containerRef = useRef(null);
  const qrContainerRef = useRef(null);

  // Carving drag & physics tracking
  const isCarvingRef = useRef(false);
  const lastPointRef = useRef(null);
  const smoothedVelocityRef = useRef(0);
  const lastSoundTimeRef = useRef(0);

  // Shape checkpoints & progress tracking
  const checkpoints = useMemo(() => getShapeCheckpoints(shape), [shape]);
  const tracedCheckpointsRef = useRef(new Set());

  // Game states: 'playing' | 'shattered' | 'cleared'
  const [gameState, setGameState] = useState('playing');
  const [stress, setStress] = useState(0); // 0 to 100
  const [shapeProgress, setShapeProgress] = useState(0); // 0 to 100% of the shape traced
  const [isCopied, setIsCopied] = useState(false);

  // Needle live position
  const [needle, setNeedle] = useState({
    x: CENTER,
    y: CENTER,
    visible: false,
    isCarving: false,
  });

  // Sugar dust particle sparks
  const [particles, setParticles] = useState([]);

  /**
   * Draw the initial textured Dalgona honeycomb puck
   */
  const drawDalgonaPuck = useCallback(() => {
    const canvas = canvasRef.current;
    if (!canvas) return;
    const ctx = canvas.getContext('2d');
    if (!ctx) return;

    ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
    ctx.save();

    // 1. Caramel Puck Base
    const gradient = ctx.createRadialGradient(
      CENTER - 25,
      CENTER - 25,
      12,
      CENTER,
      CENTER,
      PUCK_RADIUS
    );
    gradient.addColorStop(0, '#fbb040');
    gradient.addColorStop(0.35, '#e59a3b');
    gradient.addColorStop(0.72, '#c66914');
    gradient.addColorStop(0.92, '#9a4708');
    gradient.addColorStop(1, '#662803');

    ctx.beginPath();
    ctx.arc(CENTER, CENTER, PUCK_RADIUS, 0, Math.PI * 2);
    ctx.fillStyle = gradient;
    ctx.fill();

    // Rim shadow
    ctx.lineWidth = 4.5;
    ctx.strokeStyle = 'rgba(75, 29, 3, 0.7)';
    ctx.stroke();

    // 2. Porous micro-craters
    for (let i = 0; i < 320; i++) {
      const angle = (i * 137.5 * Math.PI) / 180;
      const dist = Math.sqrt(i / 320) * (PUCK_RADIUS - 10);
      const bx = CENTER + Math.cos(angle) * dist;
      const by = CENTER + Math.sin(angle) * dist;
      const size = 0.8 + ((i * 19) % 7) * 0.4;

      ctx.beginPath();
      ctx.arc(bx, by, size, 0, Math.PI * 2);
      ctx.fillStyle = i % 3 === 0 ? 'rgba(74, 28, 4, 0.45)' : 'rgba(255, 230, 160, 0.25)';
      ctx.fill();

      if (i % 4 === 0) {
        ctx.beginPath();
        ctx.arc(bx - 0.5, by - 0.5, size * 0.5, 0, Math.PI * 2);
        ctx.fillStyle = 'rgba(255, 255, 255, 0.45)';
        ctx.fill();
      }
    }

    // 3. Stamped center shape groove
    ctx.save();
    ctx.lineWidth = 3.5;
    ctx.strokeStyle = 'rgba(56, 20, 3, 0.85)';
    ctx.shadowColor = 'rgba(255, 225, 160, 0.75)';
    ctx.shadowOffsetX = 1.2;
    ctx.shadowOffsetY = 1.2;
    ctx.shadowBlur = 1;

    if (shape === 'triangle') {
      const size = 58;
      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER - size);
      ctx.lineTo(CENTER + size * 0.92, CENTER + size * 0.6);
      ctx.lineTo(CENTER - size * 0.92, CENTER + size * 0.6);
      ctx.closePath();
      ctx.stroke();
    } else if (shape === 'star') {
      const spikes = 5;
      const outerR = 60;
      const innerR = 28;
      let rot = (Math.PI / 2) * 3;
      let x = CENTER;
      let y = CENTER;
      const step = Math.PI / spikes;

      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER - outerR);
      for (let i = 0; i < spikes; i++) {
        x = CENTER + Math.cos(rot) * outerR;
        y = CENTER + Math.sin(rot) * outerR;
        ctx.lineTo(x, y);
        rot += step;

        x = CENTER + Math.cos(rot) * innerR;
        y = CENTER + Math.sin(rot) * innerR;
        ctx.lineTo(x, y);
        rot += step;
      }
      ctx.lineTo(CENTER, CENTER - outerR);
      ctx.closePath();
      ctx.stroke();
    } else if (shape === 'umbrella') {
      ctx.beginPath();
      ctx.arc(CENTER, CENTER - 8, 48, Math.PI, 0, false);
      for (let s = 1; s <= 4; s++) {
        const sx = CENTER + 48 - s * 24;
        ctx.arc(sx + 12, CENTER - 8, 12, 0, Math.PI, true);
      }
      ctx.stroke();

      ctx.beginPath();
      ctx.moveTo(CENTER, CENTER - 8);
      ctx.lineTo(CENTER, CENTER + 50);
      ctx.arc(CENTER - 9, CENTER + 50, 9, 0, Math.PI, false);
      ctx.stroke();
    } else {
      ctx.beginPath();
      ctx.arc(CENTER, CENTER, 52, 0, Math.PI * 2);
      ctx.stroke();
    }

    // Outer guide indentation
    ctx.lineWidth = 1.6;
    ctx.strokeStyle = 'rgba(60, 24, 4, 0.4)';
    ctx.setLineDash([4, 6]);
    ctx.beginPath();
    ctx.arc(CENTER, CENTER, PUCK_RADIUS - 18, 0, Math.PI * 2);
    ctx.stroke();

    ctx.restore();
    ctx.restore();
  }, [shape]);

  useEffect(() => {
    drawDalgonaPuck();
  }, [drawDalgonaPuck]);

  /**
   * Background music lifecycle for the Dalgona game
   */
  useEffect(() => {
    if (gameState === 'playing') {
      audio?.startBgm();
    } else {
      audio?.stopBgm();
    }
    return () => {
      audio?.stopBgm();
    };
  }, [audio, gameState]);

  /**
   * Continuous stress cooling loop (Patience rewards the player)
   */
  useEffect(() => {
    if (gameState !== 'playing') return;

    const interval = setInterval(() => {
      setStress((prev) => {
        if (prev <= 0) return 0;
        const coolingRate = isCarvingRef.current ? 3 : 6;
        return Math.max(0, prev - coolingRate);
      });
    }, 80);

    return () => clearInterval(interval);
  }, [gameState]);

  /**
   * Particle animation loop for flying sugar dust
   */
  useEffect(() => {
    if (particles.length === 0) return;

    const animId = requestAnimationFrame(() => {
      setParticles((prev) =>
        prev
          .map((p) => ({
            ...p,
            x: p.x + p.vx,
            y: p.y + p.vy,
            vy: p.vy + 0.35,
            alpha: p.alpha - 0.06,
            size: p.size * 0.94,
          }))
          .filter((p) => p.alpha > 0.05)
      );
    });

    return () => cancelAnimationFrame(animId);
  }, [particles]);

  /**
   * Trigger Confetti Victory: The stamped shape is completed and extracted!
   */
  const triggerSuccess = useCallback(() => {
    setGameState('cleared');
    isCarvingRef.current = false;
    audio?.stopBgm();
    audio?.playSuccess();

    const colors = ['#ff007a', '#037a4b', '#f59e0b', '#ffffff'];

    // Left cannon
    confetti({
      particleCount: 80,
      angle: 60,
      spread: 65,
      origin: { x: 0.15, y: 0.65 },
      colors,
    });

    // Right cannon
    confetti({
      particleCount: 80,
      angle: 120,
      spread: 65,
      origin: { x: 0.85, y: 0.65 },
      colors,
    });

    // Center celebratory blast
    setTimeout(() => {
      confetti({
        particleCount: 100,
        spread: 110,
        origin: { x: 0.5, y: 0.5 },
        colors,
      });
    }, 240);

    // Outer honeycomb falls away cleanly, revealing the complete QR code
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        ctx.clearRect(0, 0, CANVAS_SIZE, CANVAS_SIZE);
      }
    }
  }, [audio]);

  /**
   * Trigger the catastrophic fracture failure state
   */
  const triggerShatter = useCallback(
    (originX, originY) => {
      setGameState('shattered');
      isCarvingRef.current = false;
      audio?.stopBgm();
      audio?.playShatter();
      audio?.playBuzzer();

      const canvas = canvasRef.current;
      if (!canvas) return;
      const ctx = canvas.getContext('2d');
      if (!ctx) return;

      // Heavy fracture lines across the candy
      ctx.save();
      ctx.lineWidth = 3.8;
      ctx.strokeStyle = 'rgba(25, 8, 2, 0.98)';
      ctx.shadowColor = 'rgba(255, 255, 255, 0.5)';
      ctx.shadowBlur = 3;

      const branches = 10;
      for (let b = 0; b < branches; b++) {
        const baseAngle = (b * (Math.PI * 2)) / branches + (Math.random() * 0.4 - 0.2);
        let currX = originX;
        let currY = originY;

        ctx.beginPath();
        ctx.moveTo(currX, currY);

        const steps = 16;
        for (let s = 0; s < steps; s++) {
          const segDist = 10 + Math.random() * 16;
          const jitter = (Math.random() - 0.5) * 0.8;
          currX += Math.cos(baseAngle + jitter) * segDist;
          currY += Math.sin(baseAngle + jitter) * segDist;
          ctx.lineTo(currX, currY);

          if (Math.random() > 0.6) {
            ctx.stroke();
            ctx.beginPath();
            ctx.moveTo(currX, currY);
            ctx.lineTo(
              currX + (Math.random() - 0.5) * 36,
              currY + (Math.random() - 0.5) * 36
            );
          }
        }
        ctx.stroke();
      }

      ctx.restore();
    },
    [audio]
  );

  /**
   * Check if the needle carved close to any shape checkpoints.
   * Completing the shape outline is enough to win!
   */
  const checkCheckpoints = useCallback(
    (px, py) => {
      const traceDistance = NEEDLE_CARVE_RADIUS + 7.5; // ~13.5px detection threshold
      let newlyTraced = false;

      checkpoints.forEach((cp, idx) => {
        if (!tracedCheckpointsRef.current.has(idx)) {
          const d = Math.hypot(px - cp.x, py - cp.y);
          if (d <= traceDistance) {
            tracedCheckpointsRef.current.add(idx);
            newlyTraced = true;
          }
        }
      });

      if (newlyTraced) {
        const currentCount = tracedCheckpointsRef.current.size;
        const total = checkpoints.length;
        const percent = Math.round((currentCount / total) * 100);
        setShapeProgress(percent);

        // Once ~88% of the shape contour is traced, extract the shape!
        if (percent >= 88) {
          triggerSuccess();
        }
      }
    },
    [checkpoints, triggerSuccess]
  );

  /**
   * Carve fine needle groove at specific coordinates
   */
  const carvePoint = (ctx, x, y, radius = NEEDLE_CARVE_RADIUS) => {
    ctx.save();
    ctx.globalCompositeOperation = 'destination-out';

    ctx.beginPath();
    const vertices = 6;
    for (let v = 0; v < vertices; v++) {
      const angle = (v * Math.PI * 2) / vertices;
      const r = radius * (0.85 + Math.random() * 0.3);
      const vx = x + Math.cos(angle) * r;
      const vy = y + Math.sin(angle) * r;
      if (v === 0) ctx.moveTo(vx, vy);
      else ctx.lineTo(vx, vy);
    }
    ctx.closePath();
    ctx.fill();

    ctx.restore();
  };

  /**
   * Spawn flying sugar crumbs
   */
  const spawnDust = (x, y, count = 1) => {
    const newP = [];
    for (let i = 0; i < count; i++) {
      const angle = Math.random() * Math.PI * 2;
      const speed = 1.0 + Math.random() * 2.8;
      newP.push({
        id: Math.random(),
        x,
        y,
        vx: Math.cos(angle) * speed,
        vy: Math.sin(angle) * speed - 1.2,
        alpha: 1,
        size: 1.5 + Math.random() * 2.2,
        color: Math.random() > 0.5 ? '#f59e0b' : '#fde68a',
      });
    }
    setParticles((prev) => [...prev.slice(-35), ...newP]);
  };

  /**
   * Get canvas-scaled coordinates
   */
  const getCanvasCoords = (e) => {
    const canvas = canvasRef.current;
    if (!canvas) return { x: 0, y: 0 };
    const rect = canvas.getBoundingClientRect();
    const scaleX = canvas.width / rect.width;
    const scaleY = canvas.height / rect.height;
    return {
      x: (e.clientX - rect.left) * scaleX,
      y: (e.clientY - rect.top) * scaleY,
    };
  };

  // --- POINTER EVENT HANDLERS (HOLD & BRUSH PAINTING) ---

  const handlePointerDown = (e) => {
    if (gameState !== 'playing') return;
    const { x, y } = getCanvasCoords(e);

    const dx = x - CENTER;
    const dy = y - CENTER;
    if (Math.hypot(dx, dy) > PUCK_RADIUS + 8) return;

    try {
      e.currentTarget.setPointerCapture(e.pointerId);
    } catch {
      // Ignored
    }

    isCarvingRef.current = true;
    lastPointRef.current = { x, y, time: performance.now() };
    smoothedVelocityRef.current = 0;

    audio?.startBgm();
    setNeedle({ x, y, visible: true, isCarving: true });

    // Initial needle impact chip
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        carvePoint(ctx, x, y, NEEDLE_CARVE_RADIUS);
        checkCheckpoints(x, y);
        spawnDust(x, y, 3);
      }
    }

    audio?.playCrack();
  };

  const handlePointerMove = (e) => {
    if (gameState !== 'playing') return;
    const { x, y } = getCanvasCoords(e);

    setNeedle((prev) => ({
      ...prev,
      x,
      y,
      visible: true,
      isCarving: isCarvingRef.current,
    }));

    if (!isCarvingRef.current || !lastPointRef.current) return;

    const now = performance.now();
    const last = lastPointRef.current;
    const dt = Math.max(1, now - last.time);
    const dist = Math.hypot(x - last.x, y - last.y);
    const instantVelocity = dist / dt; // px/ms

    // Smoothed brush velocity
    smoothedVelocityRef.current =
      smoothedVelocityRef.current * 0.45 + instantVelocity * 0.55;

    const distFromCenter = Math.hypot(x - CENTER, y - CENTER);
    if (distFromCenter > PUCK_RADIUS + 10) {
      lastPointRef.current = { x, y, time: now };
      return;
    }

    // --- SPEED & TENSION LOGIC ---
    let currentStress = stress;
    if (smoothedVelocityRef.current > SAFE_SPEED_LIMIT) {
      const speedOverhead = (smoothedVelocityRef.current - SAFE_SPEED_LIMIT) * 48;
      currentStress += speedOverhead;
    } else {
      currentStress = Math.max(0, currentStress - 1) + 0.6;
    }

    if (currentStress >= 100) {
      setStress(100);
      triggerShatter(x, y);
      return;
    }

    setStress(Math.min(99, Math.round(currentStress)));

    // --- FINE NEEDLE LINE CARVING (INTERPOLATED STROKE) ---
    const canvas = canvasRef.current;
    if (canvas) {
      const ctx = canvas.getContext('2d');
      if (ctx) {
        const stepSize = 2.4; // fine step for continuous crisp line
        const steps = Math.max(1, Math.floor(dist / stepSize));

        for (let s = 1; s <= steps; s++) {
          const px = last.x + ((x - last.x) * s) / steps;
          const py = last.y + ((y - last.y) * s) / steps;
          carvePoint(ctx, px, py, NEEDLE_CARVE_RADIUS);
          checkCheckpoints(px, py);
        }

        if (Math.random() > 0.6) {
          spawnDust(x, y, 1);
        }
      }
    }

    // Continuous scratch audio
    if (now - lastSoundTimeRef.current > 48) {
      audio?.playScratch(Math.min(1.4, smoothedVelocityRef.current * 2));
      lastSoundTimeRef.current = now;
    }

    lastPointRef.current = { x, y, time: now };
  };

  const handlePointerUp = (e) => {
    isCarvingRef.current = false;
    lastPointRef.current = null;
    smoothedVelocityRef.current = 0;
    setNeedle((prev) => ({ ...prev, isCarving: false }));

    try {
      e.currentTarget.releasePointerCapture(e.pointerId);
    } catch {
      // Ignored
    }
  };

  const handlePointerLeave = () => {
    if (!isCarvingRef.current) {
      setNeedle((prev) => ({ ...prev, visible: false }));
    }
  };

  const handleRetry = () => {
    setGameState('playing');
    setStress(0);
    setShapeProgress(0);
    tracedCheckpointsRef.current.clear();
    isCarvingRef.current = false;
    lastPointRef.current = null;
    drawDalgonaPuck();
    audio?.startBgm();
  };

  const handleCopy = () => {
    navigator.clipboard.writeText(url);
    setIsCopied(true);
    setTimeout(() => setIsCopied(false), 2000);
  };

  const handleDownloadQR = () => {
    const svgEl = qrContainerRef.current?.querySelector('svg');
    if (!svgEl) return;

    const svgData = new XMLSerializer().serializeToString(svgEl);
    const canvas = document.createElement('canvas');
    const ctx = canvas.getContext('2d');
    const img = new Image();

    canvas.width = 512;
    canvas.height = 512;

    img.onload = () => {
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, canvas.width, canvas.height);
      ctx.drawImage(img, 32, 32, 448, 448);
      const pngFile = canvas.toDataURL('image/png');
      const dlLink = document.createElement('a');
      dlLink.download = `squid-qr-${shape}.png`;
      dlLink.href = pngFile;
      dlLink.click();
    };
    img.src = `data:image/svg+xml;base64,${btoa(svgData)}`;
  };

  return (
    <div className="relative w-full max-w-xl flex flex-col items-center select-none">
      {/* HUD: Needle Speed & Shape Extraction Progress */}
      <div className="w-full bg-zinc-950/85 border border-zinc-800/80 rounded-xl p-4 mb-5 backdrop-blur-md shadow-xl">
        <div className="flex items-center justify-between text-xs font-mono mb-2">
          <div className="flex items-center gap-2">
            <span className="text-zinc-400">NEEDLE STRESS:</span>
            <span
              className={`font-bold transition-colors flex items-center gap-1 ${
                stress > 75
                  ? 'text-red-500 animate-pulse'
                  : stress > 45
                  ? 'text-amber-400'
                  : 'text-emerald-400'
              }`}
            >
              {stress > 75 && <Flame className="w-3.5 h-3.5" />}
              {stress}% {stress > 75 ? 'DANGER - BRITTLE!' : stress > 45 ? 'CAUTION' : 'SAFE'}
            </span>
          </div>

          {/* Primary Shape Completion Progress */}
          <div className="flex items-center gap-1.5 text-zinc-300">
            <Scissors className="w-3.5 h-3.5 text-pink-500" />
            <span className="text-zinc-400 uppercase">{shape} OUTLINE:</span>
            <span className="text-pink-500 font-bold">{shapeProgress}%</span>
          </div>
        </div>

        {/* Dual Meter: Stress and Shape Completion */}
        <div className="grid grid-cols-2 gap-2">
          {/* Tension Bar */}
          <div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <motion.div
                className={`h-full rounded-full transition-all duration-100 ${
                  stress > 75
                    ? 'bg-gradient-to-r from-amber-500 via-rose-500 to-red-600'
                    : stress > 45
                    ? 'bg-gradient-to-r from-emerald-500 to-amber-500'
                    : 'bg-emerald-500'
                }`}
                style={{ width: `${stress}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-500 mt-1">CADENCE METER</div>
          </div>

          {/* Shape Progress Bar */}
          <div>
            <div className="w-full h-2 bg-zinc-900 rounded-full overflow-hidden p-0.5 border border-zinc-800">
              <motion.div
                className="h-full rounded-full bg-gradient-to-r from-pink-500 to-amber-400 transition-all duration-150"
                style={{ width: `${shapeProgress}%` }}
              />
            </div>
            <div className="text-[10px] font-mono text-zinc-400 mt-1 flex justify-between">
              <span>TRACING LINE</span>
              <span className="text-pink-400">{shapeProgress >= 88 ? 'EXTRACTED!' : `${shapeProgress}%`}</span>
            </div>
          </div>
        </div>

        {/* Direct instructions: trace the shape line! */}
        <div className="mt-2.5 flex items-center justify-between text-[11px] font-mono text-zinc-400">
          <span className="flex items-center gap-1 text-pink-400">
            <Sparkles className="w-3 h-3" />
            TRACE THE {shape.toUpperCase()} LINE WITH THE NEEDLE TO EXTRACT
          </span>
          <span className="text-zinc-500">HOLD & DRAG</span>
        </div>
      </div>

      {/* Main Arena: The Tin Container with Needle Cursor */}
      <div
        ref={containerRef}
        className="relative flex items-center justify-center p-3.5 rounded-full bg-gradient-to-br from-zinc-400 via-zinc-700 to-zinc-950 shadow-[0_25px_60px_rgba(0,0,0,0.9)] border-4 border-zinc-600/60 touch-none"
      >
        <div className="relative w-[360px] h-[360px] rounded-full overflow-hidden bg-white shadow-inner flex items-center justify-center">
          {/* LAYER 1: The Scannable QR Code */}
          <div
            ref={qrContainerRef}
            className="absolute inset-0 flex flex-col items-center justify-center p-8 bg-white z-0"
          >
            <QRCodeSVG
              value={url}
              size={250}
              level="Q"
              bgColor="#ffffff"
              fgColor="#090a0f"
              includeMargin={false}
            />
            <div className="mt-2 flex items-center gap-1.5 text-[10px] font-mono text-zinc-500 tracking-wider">
              <span>○ △ □</span>
              <span>DALGONA EXTRACTED QR</span>
            </div>
          </div>

          {/* LAYER 2: Dalgona Canvas (Needle Target) */}
          <canvas
            ref={canvasRef}
            width={CANVAS_SIZE}
            height={CANVAS_SIZE}
            onPointerDown={handlePointerDown}
            onPointerMove={handlePointerMove}
            onPointerUp={handlePointerUp}
            onPointerCancel={handlePointerUp}
            onPointerLeave={handlePointerLeave}
            className="absolute inset-0 z-10 cursor-none touch-none select-none"
          />

          {/* LAYER 3: Sugar Dust Particles */}
          <div className="absolute inset-0 pointer-events-none z-20 overflow-hidden">
            {particles.map((p) => (
              <div
                key={p.id}
                className="absolute rounded-full pointer-events-none"
                style={{
                  left: p.x,
                  top: p.y,
                  width: p.size,
                  height: p.size,
                  backgroundColor: p.color,
                  opacity: p.alpha,
                  transform: 'translate(-50%, -50%)',
                }}
              />
            ))}
          </div>

          {/* LAYER 4: The 3D Handheld Needle Tool */}
          {gameState === 'playing' && (
            <NeedleOverlay
              x={needle.x}
              y={needle.y}
              visible={needle.visible}
              isCarving={needle.isCarving}
              stress={stress}
            />
          )}

          {/* LAYER 5: Shattered Failure State Overlay */}
          <AnimatePresence>
            {gameState === 'shattered' && (
              <motion.div
                initial={{ opacity: 0, scale: 0.9 }}
                animate={{ opacity: 1, scale: 1 }}
                exit={{ opacity: 0 }}
                className="absolute inset-0 z-40 bg-black/85 backdrop-blur-xs flex flex-col items-center justify-center text-center p-6"
              >
                <div className="w-14 h-14 rounded-full bg-red-950/80 border-2 border-red-500 flex items-center justify-center mb-3 animate-bounce">
                  <AlertTriangle className="w-7 h-7 text-red-500" />
                </div>
                <h3 className="text-2xl font-extrabold text-red-500 font-squid tracking-wider uppercase">
                  ELIMINATED
                </h3>
                <p className="text-xs font-mono text-zinc-400 mt-1 mb-5 max-w-[220px]">
                  CANDY SHATTERED! You rushed the needle. Follow the line slowly!
                </p>
                <button
                  onClick={handleRetry}
                  className="px-5 py-2.5 bg-red-600 hover:bg-red-500 active:bg-red-700 text-white font-mono text-xs font-bold rounded-lg tracking-wider flex items-center gap-2 shadow-lg shadow-red-900/50 transition-colors cursor-pointer"
                >
                  <RotateCcw className="w-4 h-4" /> RETRY NEEDLE CARVE
                </button>
              </motion.div>
            )}
          </AnimatePresence>

          {/* LAYER 6: Cleared Success Highlight Ring */}
          {gameState === 'cleared' && (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              className="absolute inset-0 z-40 pointer-events-none rounded-full border-4 border-emerald-500 teal-glow"
            />
          )}
        </div>
      </div>

      {/* Post-Game HUD / Controls */}
      <div className="w-full mt-7">
        {gameState === 'cleared' ? (
          <motion.div
            initial={{ opacity: 0, y: 12 }}
            animate={{ opacity: 1, y: 0 }}
            className="w-full bg-emerald-950/40 border border-emerald-500/40 rounded-xl p-5 text-center shadow-xl"
          >
            <div className="inline-flex items-center gap-2 text-emerald-400 text-sm font-mono font-bold uppercase tracking-wider mb-2">
              <CheckCircle2 className="w-5 h-5" /> {shape.toUpperCase()} EXTRACTED // ROUND 2 CLEARED!
            </div>
            <p className="text-xs text-zinc-400 font-mono mb-4 break-all">
              TARGET URL: <span className="text-zinc-200 underline">{url}</span>
            </p>

            <div className="flex flex-wrap items-center justify-center gap-3">
              <button
                onClick={handleCopy}
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700 cursor-pointer"
              >
                {isCopied ? (
                  <>
                    <Check className="w-4 h-4 text-emerald-400" /> COPIED!
                  </>
                ) : (
                  <>
                    <Copy className="w-4 h-4" /> COPY LINK
                  </>
                )}
              </button>

              <button
                onClick={handleDownloadQR}
                className="px-4 py-2 bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Download className="w-4 h-4" /> DOWNLOAD QR
              </button>

              <a
                href={url}
                target="_blank"
                rel="noopener noreferrer"
                className="px-4 py-2 bg-zinc-800 hover:bg-zinc-700 text-zinc-200 text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors border border-zinc-700 cursor-pointer"
              >
                <ExternalLink className="w-4 h-4" /> VISIT URL
              </a>

              <button
                onClick={onReset}
                className="px-4 py-2 bg-[#ff007a] hover:bg-[#ff2a8d] text-white text-xs font-mono rounded-lg flex items-center gap-1.5 transition-colors shadow-md cursor-pointer"
              >
                <Sparkles className="w-4 h-4" /> NEW TARGET
              </button>
            </div>
          </motion.div>
        ) : (
          <div className="flex items-center justify-between text-xs font-mono text-zinc-500 px-2">
            <span>TRACE THE {shape.toUpperCase()} LINE</span>
            <button
              onClick={onReset}
              className="hover:text-zinc-300 underline transition-colors cursor-pointer"
            >
              CANCEL & RETURN TO INPUT
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
