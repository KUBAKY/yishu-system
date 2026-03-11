"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const TRIGRAMS = [
  { name: "乾", symbol: "☰", nature: "天" },
  { name: "兑", symbol: "☱", nature: "泽" },
  { name: "离", symbol: "☲", nature: "火" },
  { name: "震", symbol: "☳", nature: "雷" },
  { name: "巽", symbol: "☴", nature: "风" },
  { name: "坎", symbol: "☵", nature: "水" },
  { name: "艮", symbol: "☶", nature: "山" },
  { name: "坤", symbol: "☷", nature: "地" },
];

export function MeihuaView() {
  const [upper, setUpper] = useState<number | null>(null);
  const [lower, setLower] = useState<number | null>(null);
  const [moving, setMoving] = useState<number | null>(null);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const generateHexagram = () => {
    const u = Math.floor(Math.random() * 8);
    const l = Math.floor(Math.random() * 8);
    const m = Math.floor(Math.random() * 6) + 1;
    
    setUpper(u);
    setLower(l);
    setMoving(m);
  };

  const reset = () => {
    setUpper(null);
    setLower(null);
    setMoving(null);
    setQuestion("");
    setResult("");
    setError("");
  };

  const canSubmit =
    upper !== null &&
    lower !== null &&
    moving !== null &&
    question.trim().length >= 6 &&
    name.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    /^\d{2}:\d{2}$/.test(birthTime) &&
    birthLocation.trim().length >= 2 &&
    currentTime.length > 0 &&
    !loading;

  const handleInterpret = async () => {
    if (!canSubmit) return;
    if (upper === null || lower === null || moving === null) return;
    setLoading(true);
    setError("");
    try {
      const parsed = new Date(currentTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const context = `梅花易数：上卦为${TRIGRAMS[upper].name}(${TRIGRAMS[upper].nature})，下卦为${TRIGRAMS[lower].name}(${TRIGRAMS[lower].nature})，动爻在第${moving}爻。问题：${question.trim()}。`;
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: "meihua",
          analysisMode: "event",
          question: question.trim(),
          currentTime: parsed.toISOString(),
          location: location.trim(),
          profile: {
            name: name.trim(),
            gender,
            birthDate,
            birthTime,
            birthLocation: birthLocation.trim(),
          },
          eventContext: {
            background: context,
            urgency: "一般",
            horizon: "30天内",
            mood: "平稳",
          },
        }),
      });
      const data = (await response.json()) as { result?: string; error?: string };
      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "梅花推演失败");
      }
      setResult(data.result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "梅花推演失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-center max-w-md mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-song text-gold-light">梅花易数</h2>
        <p className="text-xuanpaper/60">观物起卦，心易神动，捕捉天地外应</p>
      </div>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="请输入所测之事（例如：此事成否？）"
        className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-center text-xuanpaper focus:border-gold-light outline-none transition-colors"
      />

      <div className="grid gap-3 md:grid-cols-2">
        <input
          value={name}
          onChange={(event) => setName(event.target.value)}
          placeholder="姓名"
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />
        <select
          value={gender}
          onChange={(event) => setGender(event.target.value as "男" | "女")}
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        >
          <option value="男">男</option>
          <option value="女">女</option>
        </select>
        <input
          type="date"
          value={birthDate}
          onChange={(event) => setBirthDate(event.target.value)}
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />
        <input
          type="time"
          value={birthTime}
          onChange={(event) => setBirthTime(event.target.value)}
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />
        <input
          value={birthLocation}
          onChange={(event) => setBirthLocation(event.target.value)}
          placeholder="出生地"
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none md:col-span-2"
        />
        <input
          type="datetime-local"
          value={currentTime}
          onChange={(event) => setCurrentTime(event.target.value)}
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />
        <input
          value={location}
          onChange={(event) => setLocation(event.target.value)}
          placeholder="当前地点（选填）"
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />
      </div>

      <div className="h-64 border border-gold-line/20 rounded-xl flex items-center justify-center relative bg-gradient-to-b from-black/20 to-transparent">
        {upper === null ? (
          <motion.div
            whileHover={{ scale: 1.05 }}
            className="cursor-pointer group"
            onClick={question ? generateHexagram : undefined}
          >
            <div className="w-32 h-32 rounded-lg border-2 border-gold-line/40 flex items-center justify-center bg-black/40 group-hover:border-gold-light transition-colors">
              <span className="text-5xl text-gold-light opacity-50 group-hover:opacity-100 transition-opacity">易</span>
            </div>
            <p className="mt-4 text-sm text-gold-light/80">
              {question ? "点击起卦" : "先输入问题"}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col items-center gap-4">
            <div className="flex flex-col gap-1 items-center">
               <span className="text-xs text-xuanpaper/40">上卦：{upper !== null ? TRIGRAMS[upper].nature : ""}</span>
               <span className="text-6xl text-gold-light leading-none">{upper !== null ? TRIGRAMS[upper].symbol : ""}</span>
               <span className="text-lg font-bold">{upper !== null ? TRIGRAMS[upper].name : ""}</span>
            </div>
            <div className="w-16 h-px bg-gold-line/30" />
            <div className="flex flex-col gap-1 items-center">
               <span className="text-xs text-xuanpaper/40">下卦：{lower !== null ? TRIGRAMS[lower].nature : ""}</span>
               <span className="text-6xl text-gold-light leading-none">{lower !== null ? TRIGRAMS[lower].symbol : ""}</span>
               <span className="text-lg font-bold">{lower !== null ? TRIGRAMS[lower].name : ""}</span>
            </div>
            <p className="text-sm text-red-400 font-bold mt-2">动爻：第{moving}爻</p>
          </div>
        )}
      </div>

      {upper !== null && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="primary" size="lg" onClick={handleInterpret} className="w-full" disabled={!canSubmit}>
            {loading ? "推演中..." : "推演变局"}
          </Button>
          <p className="mt-4 text-xs text-xuanpaper/40 cursor-pointer hover:text-gold-light" onClick={reset}>
            重新起卦
          </p>
        </motion.div>
      )}
      {error && <p className="text-sm text-red-300">{error}</p>}
      {result && <pre className="text-left whitespace-pre-wrap bg-black/30 border border-gold-line/20 rounded-lg p-4">{result}</pre>}
    </div>
  );
}
