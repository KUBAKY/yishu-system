"use client";

import { useState } from "react";
import { motion, AnimatePresence } from "framer-motion";
import { Button } from "@/components/ui/Button";

const TAROT_CARDS = [
  { id: "fool", name: "愚人", desc: "新的开始，冒险，纯真", img: "🤹" },
  { id: "magician", name: "魔术师", desc: "创造力，资源，意志", img: "🪄" },
  { id: "priestess", name: "女祭司", desc: "直觉，潜意识，神秘", img: "🌙" },
  { id: "empress", name: "皇后", desc: "丰饶，母性，感官", img: "👑" },
  { id: "emperor", name: "皇帝", desc: "权威，结构，秩序", img: "🏰" },
  { id: "hierophant", name: "教皇", desc: "传统，信仰，指引", img: "📜" },
  { id: "lovers", name: "恋人", desc: "选择，结合，价值观", img: "❤️" },
  { id: "chariot", name: "战车", desc: "意志，胜利，控制", img: "🛡️" },
  { id: "strength", name: "力量", desc: "勇气，耐心，柔韧", img: "🦁" },
  { id: "hermit", name: "隐士", desc: "内省，孤独，智慧", img: "🕯️" },
  { id: "wheel", name: "命运之轮", desc: "循环，机遇，宿命", img: "🎡" },
  { id: "justice", name: "正义", desc: "平衡，因果，真理", img: "⚖️" },
  { id: "hanged", name: "倒吊人", desc: "牺牲，新视角，停滞", img: "🙃" },
  { id: "death", name: "死神", desc: "结束，转变，放下", img: "💀" },
  { id: "temperance", name: "节制", desc: "调和，耐心，平衡", img: "💧" },
  { id: "devil", name: "恶魔", desc: "束缚，欲望，物质", img: "😈" },
  { id: "tower", name: "高塔", desc: "剧变，觉醒，崩塌", img: "⚡" },
  { id: "star", name: "星星", desc: "希望，灵感，疗愈", img: "⭐" },
  { id: "moon", name: "月亮", desc: "不安，幻象，潜意识", img: "🌑" },
  { id: "sun", name: "太阳", desc: "成功，活力，喜悦", img: "☀️" },
  { id: "judgement", name: "审判", desc: "重生，召唤，觉醒", img: "🎺" },
  { id: "world", name: "世界", desc: "完成，整合，圆满", img: "🌍" },
];

export function TarotView() {
  const [selected, setSelected] = useState<typeof TAROT_CARDS>([]);
  const [isShuffling, setIsShuffling] = useState(false);
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"男" | "女">("女");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [currentTime, setCurrentTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const drawCards = () => {
    setIsShuffling(true);
    setTimeout(() => {
      const shuffled = [...TAROT_CARDS].sort(() => Math.random() - 0.5);
      setSelected(shuffled.slice(0, 3));
      setIsShuffling(false);
    }, 1500);
  };

  const canSubmit =
    selected.length === 3 &&
    question.trim().length >= 6 &&
    name.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    /^\d{2}:\d{2}$/.test(birthTime) &&
    birthLocation.trim().length >= 2 &&
    currentTime.length > 0 &&
    !loading;

  const handleInterpret = async () => {
    if (selected.length < 3) return;
    setLoading(true);
    setError("");
    try {
      const parsed = new Date(currentTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const cardBlock = selected
        .map((card, index) => `${["现状", "挑战", "建议"][index]}：${card.name}（${card.desc}）`)
        .join("；");
      const background = `塔罗三牌阵。${cardBlock}。咨询主题：${question.trim()}。`;
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: "tarot",
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
            urgency: "一般",
            horizon: "30天内",
            mood: "平稳",
          },
        }),
      });
      const data = (await response.json()) as { result?: string; error?: string };
      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "塔罗推演失败");
      }
      setResult(data.result);
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "塔罗推演失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 text-center">
      <div className="space-y-2">
        <h2 className="text-2xl font-song text-gold-light">塔罗三牌阵</h2>
        <p className="text-xuanpaper/60">默念心中困惑，抽取三张牌指引方向</p>
      </div>

      <div className="max-w-md mx-auto">
        <input
          type="text"
          value={question}
          onChange={(e) => setQuestion(e.target.value)}
          placeholder="请输入你的问题（例如：这份工作适合我吗？）"
          className="w-full bg-black/20 border border-gold-line/30 rounded-lg px-4 py-3 text-center text-xuanpaper focus:border-gold-light outline-none transition-colors"
        />
      </div>

      <div className="h-64 flex items-center justify-center gap-4 relative perspective-[1000px]">
        <AnimatePresence mode="wait">
          {selected.length === 0 ? (
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              className="relative w-40 h-56 cursor-pointer"
              onClick={question ? drawCards : undefined}
            >
              {[0, 1, 2].map((i) => (
                <motion.div
                  key={i}
                  className="absolute inset-0 bg-gradient-to-br from-purple-900 to-black border-2 border-gold-line/50 rounded-xl shadow-xl flex items-center justify-center"
                  style={{ zIndex: 3 - i }}
                  animate={
                    isShuffling
                      ? {
                          x: [0, 20, -20, 0],
                          y: [0, -10, 10, 0],
                          rotate: [0, 5, -5, 0],
                        }
                      : {
                          x: i * 4,
                          y: i * 4,
                          rotate: i * 2,
                        }
                  }
                  transition={{ duration: 0.5, repeat: isShuffling ? Infinity : 0 }}
                >
                  <span className="text-4xl opacity-20">🔮</span>
                </motion.div>
              ))}
              {!isShuffling && (
                <div className="absolute inset-0 flex items-center justify-center z-10">
                  <p className="bg-black/60 px-4 py-2 rounded-full text-gold-light text-sm backdrop-blur-sm">
                    {question ? "点击抽牌" : "先输入问题"}
                  </p>
                </div>
              )}
            </motion.div>
          ) : (
            <div className="flex gap-4 justify-center">
              {selected.map((card, index) => (
                <motion.div
                  key={card.id}
                  initial={{ opacity: 0, y: 50, rotateY: 90 }}
                  animate={{ opacity: 1, y: 0, rotateY: 0 }}
                  transition={{ delay: index * 0.2 }}
                  className="w-28 h-44 bg-gradient-to-b from-slate-800 to-black border border-gold-line/40 rounded-lg p-3 flex flex-col items-center justify-between shadow-lg"
                >
                  <span className="text-xs text-xuanpaper/50 uppercase tracking-widest">
                    {["现状", "挑战", "建议"][index]}
                  </span>
                  <span className="text-4xl">{card.img}</span>
                  <div className="text-center">
                    <p className="text-gold-light font-bold text-sm">{card.name}</p>
                    <p className="text-[10px] text-xuanpaper/60 mt-1">{card.desc}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          )}
        </AnimatePresence>
      </div>

      <div className="grid gap-3 max-w-2xl mx-auto md:grid-cols-2">
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
          <option value="女">女</option>
          <option value="男">男</option>
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

      {selected.length > 0 && (
        <motion.div initial={{ opacity: 0 }} animate={{ opacity: 1 }} className="pt-4">
          <Button variant="primary" size="lg" onClick={handleInterpret} className="w-full max-w-xs" disabled={!canSubmit}>
            {loading ? "推演中..." : "开始解读牌阵"}
          </Button>
          <p className="mt-4 text-xs text-xuanpaper/40 cursor-pointer hover:text-gold-light" onClick={() => setSelected([])}>
            重新抽牌
          </p>
        </motion.div>
      )}

      {error && <p className="text-sm text-red-300">{error}</p>}
      {result && <pre className="text-left whitespace-pre-wrap bg-black/30 border border-gold-line/20 rounded-lg p-4">{result}</pre>}
    </div>
  );
}
