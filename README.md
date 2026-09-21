# 🦑 Squid Code // Dalgona QR Generator

An interactive, Squid Game-themed single-page application built with **React**, **Vite**, **Tailwind CSS**, **Framer Motion**, **qrcode.react**, **use-sound**, and **canvas-confetti**. Managed with **Bun**.

---

## 🎮 Game Mechanics & Features

1. **Input Screen**:
   - Minimalist, ominous interface styled with iconic Squid Game geometric markers (`○ △ □`).
   - Destination URL input with quick presets (`Netflix`, `YouTube`, `GitHub`).
   - Honeycomb Stamp selector: Circle (Standard), Triangle (Soldier), Star (Advanced), or Umbrella (Hardcore).
2. **Guard Delivery Loader (`framer-motion`)**:
   - Pink-suited guard walks in carrying a silver serving platter with an authentic cloche dome.
   - Synchronized footstep audio and atmospheric spotlight.
   - Guard presents the platter and lifts the cloche dome with a metallic sound effect, revealing the Dalgona challenge.
3. **Interactive Dalgona Honeycomb Game (`HTML5 Canvas` + `qrcode.react`)**:
   - High-contrast, scannable QR code generated using `qrcode.react`.
   - Procedural HTML5 `<canvas>` caramel puck overlaid directly on top with authentic bubbly texture and stamped shape.
   - Needle tapping mechanic using `ctx.globalCompositeOperation = 'destination-out'` to chip away candy with brittle cracks and flying sugar fragments.
   - **Tension & Cadence Logic**: Rapid clicking spikes the needle tension bar. If stress reaches 100%, the confection fractures catastrophically ("ELIMINATED"). Clicking at a steady, measured pace safely uncovers the QR code.
   - **Confetti Celebration**: Clearing the candy triggers `canvas-confetti` bursts in Squid Game colors (Hot Pink, Player Teal, Gold) and unlocks download/visit controls.
4. **Tactile Sound System (`use-sound` + Web Audio API Fallback)**:
   - Configured with `use-sound` hooks pointing to placeholder paths in `public/sounds/`.
   - Embedded procedural Web Audio synthesizer provides instant realistic audio feedback (footsteps, dome ringing, snappy candy chips, buzzer, victory chime) even without physical `.mp3` files present.

---

## 🚀 Quickstart with Bun

### 1. Install Dependencies
```bash
bun install
```

### 2. Start Development Server
```bash
bun dev
```

### 3. Build for Production
```bash
bun run build
```

### 4. Preview Production Build
```bash
bun run preview
```
