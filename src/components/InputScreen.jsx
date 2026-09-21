import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { ArrowRight, Link as LinkIcon, ShieldAlert } from 'lucide-react';

/**
 * InputScreen component
 * Minimalist, ominous UI where the user inputs a target URL,
 * picks a honeycomb shape, and clicks "Generate".
 */
export default function InputScreen({ onGenerate, initialUrl = 'https://netflix.com' }) {
  const [url, setUrl] = useState(initialUrl);
  const [shape, setShape] = useState('triangle');
  const [error, setError] = useState('');

  const shapes = [
    { id: 'circle', label: 'Circle', symbol: '○', desc: 'Standard' },
    { id: 'triangle', label: 'Triangle', symbol: '△', desc: 'Soldier' },
    { id: 'star', label: 'Star', symbol: '★', desc: 'Advanced' },
    { id: 'umbrella', label: 'Umbrella', symbol: '☂', desc: 'Hardcore' },
  ];

  const presets = [
    { label: 'Netflix', url: 'https://netflix.com' },
    { label: 'YouTube', url: 'https://youtube.com' },
    { label: 'GitHub', url: 'https://github.com' },
  ];

  const handleSubmit = (e) => {
    e.preventDefault();
    if (!url.trim()) {
      setError('A destination URL is required to begin.');
      return;
    }

    let finalUrl = url.trim();
    if (!/^https?:\/\//i.test(finalUrl)) {
      finalUrl = 'https://' + finalUrl;
    }

    try {
      new URL(finalUrl);
      setError('');
      onGenerate({ url: finalUrl, shape });
    } catch {
      setError('Please provide a valid web URL.');
    }
  };

  return (
    <div className="relative w-full max-w-xl flex flex-col items-center">
      {/* Ominous Calling Card Container */}
      <motion.div
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.6 }}
        className="w-full bg-[#111319]/90 border border-zinc-800/90 rounded-2xl p-8 backdrop-blur-xl shadow-2xl relative overflow-hidden"
      >
        {/* Subtle Ambient Pink Glow */}
        <div className="absolute -top-24 -right-24 w-56 h-56 bg-[#ff007a]/10 blur-3xl rounded-full pointer-events-none" />

        {/* Top Squid Game Geometric Symbols */}
        <div className="flex items-center justify-center gap-6 mb-6">
          <div className="w-9 h-9 rounded-full border-2 border-pink-500/80 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,122,0.4)]">
            <span className="text-pink-500 text-xs font-mono">01</span>
          </div>
          <div className="w-9 h-9 border-2 border-pink-500/80 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,122,0.4)] [clip-path:polygon(50%_0%,0%_100%,100%_100%)] bg-pink-500/20">
            <span className="text-pink-500 text-[10px] font-mono mt-2">02</span>
          </div>
          <div className="w-9 h-9 border-2 border-pink-500/80 flex items-center justify-center shadow-[0_0_10px_rgba(255,0,122,0.4)]">
            <span className="text-pink-500 text-xs font-mono">03</span>
          </div>
        </div>

        {/* Title */}
        <div className="text-center mb-8">
          <h2 className="text-2xl sm:text-3xl font-black tracking-wider text-white uppercase font-squid">
            DALGONA QR GENERATOR
          </h2>
          <p className="text-xs font-mono text-zinc-400 mt-2 tracking-widest uppercase">
            ROUND 2 // HONEYCOMB EXTRACTION PROTOCOL
          </p>
        </div>

        {/* Form */}
        <form onSubmit={handleSubmit} className="space-y-6">
          {/* Target URL Input */}
          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-widest text-zinc-400 uppercase">
              TARGET DESTINATION URL
            </label>
            <div className="relative flex items-center">
              <div className="absolute left-3.5 text-zinc-500 pointer-events-none">
                <LinkIcon className="w-4 h-4" />
              </div>
              <input
                type="text"
                value={url}
                onChange={(e) => {
                  setUrl(e.target.value);
                  if (error) setError('');
                }}
                placeholder="https://example.com"
                className="w-full bg-[#08090c] border border-zinc-700/80 focus:border-[#ff007a] focus:ring-1 focus:ring-[#ff007a] text-zinc-100 text-sm font-mono pl-10 pr-4 py-3 rounded-xl outline-hidden transition-all placeholder:text-zinc-600"
              />
            </div>
            {error && (
              <p className="text-xs font-mono text-rose-500 flex items-center gap-1.5 mt-1">
                <ShieldAlert className="w-3.5 h-3.5" /> {error}
              </p>
            )}

            {/* URL Presets */}
            <div className="flex items-center gap-2 pt-1">
              <span className="text-[11px] font-mono text-zinc-600">PRESETS:</span>
              {presets.map((p) => (
                <button
                  type="button"
                  key={p.label}
                  onClick={() => setUrl(p.url)}
                  className="text-[11px] font-mono px-2 py-0.5 rounded bg-zinc-800/80 hover:bg-zinc-700 text-zinc-400 hover:text-zinc-200 transition-colors border border-zinc-700/50"
                >
                  {p.label}
                </button>
              ))}
            </div>
          </div>

          {/* Honeycomb Shape Selector */}
          <div className="space-y-2">
            <label className="block text-xs font-mono tracking-widest text-zinc-400 uppercase">
              SELECT HONEYCOMB STAMP
            </label>
            <div className="grid grid-cols-4 gap-2.5">
              {shapes.map((s) => {
                const isSelected = shape === s.id;
                return (
                  <button
                    type="button"
                    key={s.id}
                    onClick={() => setShape(s.id)}
                    className={`flex flex-col items-center justify-center p-3 rounded-xl border transition-all ${
                      isSelected
                        ? 'border-[#ff007a] bg-[#ff007a]/15 text-pink-400 pink-glow-sm scale-[1.02]'
                        : 'border-zinc-800 bg-[#0c0d12] hover:border-zinc-700 text-zinc-400 hover:text-zinc-200'
                    }`}
                  >
                    <span className="text-2xl mb-1 select-none">{s.symbol}</span>
                    <span className="text-[11px] font-mono font-semibold uppercase">{s.label}</span>
                    <span className="text-[9px] font-mono text-zinc-500">{s.desc}</span>
                  </button>
                );
              })}
            </div>
          </div>

          {/* Ominous Warning Quote */}
          <div className="p-3 bg-zinc-950/60 border border-zinc-800/60 rounded-xl text-center">
            <p className="text-[11px] font-mono text-zinc-400 italic">
              "The candy will be poured over your QR code. Carve it with a steady hand, or be eliminated."
            </p>
          </div>

          {/* Submit / Generate Button */}
          <motion.button
            whileHover={{ scale: 1.02 }}
            whileTap={{ scale: 0.98 }}
            type="submit"
            className="w-full bg-[#ff007a] hover:bg-[#ff1b87] text-white py-4 px-6 rounded-xl font-squid font-bold text-sm tracking-wider uppercase flex items-center justify-center gap-3 transition-all shadow-[0_0_20px_rgba(255,0,122,0.4)] cursor-pointer"
          >
            <span>GENERATE & SUMMON GUARD</span>
            <ArrowRight className="w-4 h-4" />
          </motion.button>
        </form>
      </motion.div>
    </div>
  );
}
