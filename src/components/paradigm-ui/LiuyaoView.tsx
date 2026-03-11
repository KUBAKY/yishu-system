"use client";

import { useState } from "react";
import { motion } from "framer-motion";
import { Button } from "@/components/ui/Button";

const COIN_SIDES = {
  YIN: "阴",
  YANG: "阳",
  OLD_YIN: "老阴",
  OLD_YANG: "老阳",
};

export function LiuyaoView() {
  const [yao, setYao] = useState<string[]>([]);
  const [isShaking, setIsShaking] = useState(false);
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

  const toss = () => {
    setIsShaking(true);
    setTimeout(() => {
      const sum = [0, 1, 2].reduce((acc) => acc + (Math.random() > 0.5 ? 3 : 2), 0);
      let result = "";
      if (sum === 6) result = COIN_SIDES.OLD_YIN;
      if (sum === 7) result = COIN_SIDES.YANG;
      if (sum === 8) result = COIN_SIDES.YIN;
      if (sum === 9) result = COIN_SIDES.OLD_YANG;

      setYao((prev) => [result, ...prev]);
      setIsShaking(false);
    }, 1000);
  };

  const reset = () => {
    setYao([]);
    setQuestion("");
    setResult("");
    setError("");
  };

  const canSubmit =
    yao.length === 6 &&
    question.trim().length >= 6 &&
    name.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    /^\d{2}:\d{2}$/.test(birthTime) &&
    birthLocation.trim().length >= 2 &&
    currentTime.length > 0 &&
    !loading;

  const handleInterpret = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    try {
      const parsed = new Date(currentTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const ordered = [...yao].reverse();
      const moving = ordered
        .map((item, index) => (item.includes("老") ? index + 1 : 0))
        .filter((item) => item > 0);
      const background = [
        `六爻卦象（初至上）：${ordered.join("、")}`,
        `动爻位置：${moving.length > 0 ? moving.join("、") : "无动爻"}`,
        `问题：${question.trim()}`,
      ].join("；");
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: "liuyao",
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
            background,
            urgency: "高",
            horizon: "30天内",
            mood: "谨慎",
          },
        }),
      });
      const data = (await response.json()) as { result?: string; error?: string };
      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "六爻推演失败");
      }
      setResult(data.result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "六爻推演失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-center max-w-md mx-auto">
      <div className="space-y-2">
        <h2 className="text-2xl font-song text-gold-light">六爻金钱课</h2>
        <p className="text-xuanpaper/60">诚心摇卦六次，生成本卦与变卦</p>
      </div>

      <input
        type="text"
        value={question}
        onChange={(e) => setQuestion(e.target.value)}
        placeholder="请输入所测之事（例如：今日财运如何？）"
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

      <div className="h-64 border-2 border-dashed border-gold-line/20 rounded-xl flex items-center justify-center relative overflow-hidden">
        {yao.length < 6 ? (
          <motion.div
            animate={isShaking ? { rotate: [0, 10, -10, 0], scale: [1, 1.1, 1] } : {}}
            transition={{ duration: 0.5, repeat: isShaking ? Infinity : 0 }}
            className="cursor-pointer"
            onClick={!isShaking && question ? toss : undefined}
          >
            <div className="w-24 h-24 rounded-full bg-gradient-to-br from-yellow-600 to-yellow-800 shadow-lg flex items-center justify-center border-4 border-yellow-400">
              <span className="text-4xl font-serif text-yellow-100 font-bold">通宝</span>
            </div>
            <p className="mt-4 text-sm text-gold-light/80">
              {question ? (isShaking ? "摇卦中..." : `点击摇第 ${yao.length + 1} 爻`) : "先输入问题"}
            </p>
          </motion.div>
        ) : (
          <div className="flex flex-col gap-2 w-full px-8">
            {yao.map((line, index) => (
              <motion.div
                key={index}
                initial={{ opacity: 0, x: -20 }}
                animate={{ opacity: 1, x: 0 }}
                transition={{ delay: index * 0.1 }}
                className="flex items-center justify-between border-b border-gold-line/10 pb-1"
              >
                <span className="text-xs text-xuanpaper/40">第{6 - index}爻</span>
                <div className="flex gap-1 items-center">
                  <span className={`font-bold ${line.includes("老") ? "text-red-400" : "text-xuanpaper"}`}>{line}</span>
                  <div className="w-12 h-1 bg-current opacity-50 rounded-full" />
                </div>
              </motion.div>
            ))}
          </div>
        )}
      </div>

      {yao.length === 6 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }}>
          <Button variant="primary" size="lg" onClick={handleInterpret} className="w-full" disabled={!canSubmit}>
            {loading ? "解卦中..." : "解卦"}
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
