"use client";

import { useEffect, useState } from "react";
import { motion, AnimatePresence } from "framer-motion";

const PHRASES = [
  "接引天地之气...",
  "排布星辰宫位...",
  "推演前尘因果...",
  "解析多维矩阵...",
  "洞察命运轨迹...",
  "通灵中...",
  "起卦中..."
];

export function InferenceOverlay({ isVisible, paradigmId }: { isVisible: boolean; paradigmId: string }) {
  const [phraseIndex, setPhraseIndex] = useState(0);

  useEffect(() => {
    if (!isVisible) return;
    const interval = setInterval(() => {
      setPhraseIndex((prev) => (prev + 1) % PHRASES.length);
    }, 2500);
    return () => clearInterval(interval);
  }, [isVisible]);

  return (
    <AnimatePresence>
      {isVisible && (
        <motion.div
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
          className="fixed inset-0 z-50 flex flex-col items-center justify-center bg-black/85 backdrop-blur-md"
        >
          {/* Animated rings */}
          <div className="relative w-48 h-48 flex items-center justify-center mb-8 drop-shadow-[0_0_15px_rgba(212,175,55,0.4)]">
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 12, ease: "linear" }}
              className="absolute inset-0 border-2 border-transparent rounded-full border-t-gold-light border-r-gold-light/50"
            />
            <motion.div
              animate={{ rotate: -360 }}
              transition={{ repeat: Infinity, duration: 18, ease: "linear" }}
              className="absolute inset-4 border border-transparent rounded-full border-b-gold-light border-l-gold-light/40"
            />
            <motion.div
              animate={{ rotate: 360 }}
              transition={{ repeat: Infinity, duration: 8, ease: "linear" }}
              className="absolute inset-8 border-2 border-gold-line/20 rounded-full border-t-gold-light/30 border-l-gold-light/30 border-dashed"
            />
            {/* Center Icon based on Paradigm */}
            <span className="text-5xl absolute">
              {paradigmId === "zodiac"
                ? "🪐"
                : paradigmId === "qimen"
                  ? "🧭"
                  : paradigmId === "palmistry"
                    ? "🖐️"
                    : paradigmId === "physiognomy"
                      ? "🙂"
                      : "☯️"}
            </span>
          </div>

          {/* Texts */}
          <div className="relative h-12 w-full flex justify-center overflow-hidden">
             <AnimatePresence mode="wait">
               <motion.span
                 key={phraseIndex}
                 initial={{ y: 20, opacity: 0 }}
                 animate={{ y: 0, opacity: 1 }}
                 exit={{ y: -20, opacity: 0 }}
                 transition={{ duration: 0.5 }}
                 className="absolute font-song text-2xl text-gold-light tracking-widest drop-shadow-[0_0_8px_rgba(212,175,55,0.6)]"
               >
                 {PHRASES[phraseIndex]}
               </motion.span>
             </AnimatePresence>
          </div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
