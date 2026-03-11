"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { BaziData } from "@/lib/paradigm-engine";

export function BaziView() {
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [currentResidence, setCurrentResidence] = useState("");
  const [question, setQuestion] = useState("请给出我的整体命盘画像与长期发展建议");
  const [currentTime, setCurrentTime] = useState(() => new Date().toISOString().slice(0, 16));
  const [location, setLocation] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");
  const [engineData, setEngineData] = useState<BaziData | null>(null);

  const canSubmit =
    name.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    /^\d{2}:\d{2}$/.test(birthTime) &&
    birthLocation.trim().length >= 2 &&
    currentTime.length > 0 &&
    !loading;

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");
    setEngineData(null);
    try {
      const parsed = new Date(currentTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const response = await fetch("/api/inference", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: "bazi",
          analysisMode: "natal",
          question: question.trim(),
          currentTime: parsed.toISOString(),
          location: location.trim(),
          profile: {
            name: name.trim(),
            gender,
            birthDate,
            birthTime,
            birthLocation: birthLocation.trim(),
            currentResidence: currentResidence.trim(),
            pastResidences: "",
            experienceNarrative: "",
            currentStatus: "",
            futureVision: "",
          },
          eventContext: {
            background: "命盘级分析",
            urgency: "一般",
            horizon: "长期",
            mood: "平稳",
          },
        }),
      });
      const data = (await response.json()) as { 
        result?: string; 
        error?: string;
        meta?: {
          engineData?: {
            bazi?: BaziData;
          }
        }
      };
      if (!response.ok || !data.result) {
        throw new Error(data.error ?? "八字推演失败");
      }
      setResult(data.result);
      if (data.meta?.engineData?.bazi) {
        setEngineData(data.meta.engineData.bazi);
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "八字推演失败");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-8 max-w-md mx-auto">
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-song text-gold-light">八字排盘</h2>
        <p className="text-xuanpaper/60">输入生辰八字，洞察先天格局与岁运起伏</p>
      </div>

      <div className="space-y-4 bg-black/20 p-6 rounded-xl border border-gold-line/20">
        <div className="grid gap-4 grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-xuanpaper/70">姓名</span>
            <input
              value={name}
              onChange={(e) => setName(e.target.value)}
              className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-xuanpaper/70">性别</span>
            <select
              value={gender}
              onChange={(e) => setGender(e.target.value as "男" | "女")}
              className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
        </div>

        <div className="grid gap-4 grid-cols-2">
          <label className="space-y-1">
            <span className="text-sm text-xuanpaper/70">出生日期</span>
            <input
              type="date"
              value={birthDate}
              onChange={(e) => setBirthDate(e.target.value)}
              className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="space-y-1">
            <span className="text-sm text-xuanpaper/70">出生时间</span>
            <input
              type="time"
              value={birthTime}
              onChange={(e) => setBirthTime(e.target.value)}
              className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
        </div>

        <label className="block space-y-1">
          <span className="text-sm text-xuanpaper/70">出生地点</span>
          <input
            value={birthLocation}
            onChange={(e) => setBirthLocation(e.target.value)}
            placeholder="例如：北京海淀"
            className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-xuanpaper/70">现居地（选填）</span>
          <input
            value={currentResidence}
            onChange={(e) => setCurrentResidence(e.target.value)}
            placeholder="例如：上海浦东"
            className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
          />
        </label>

        <label className="block space-y-1">
          <span className="text-sm text-xuanpaper/70">关注问题</span>
          <textarea
            value={question}
            onChange={(e) => setQuestion(e.target.value)}
            rows={3}
            className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
          />
        </label>

        <div className="pt-4">
          <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? "推演中..." : "排盘推演"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300 text-center">{error}</p>}

      {engineData && (
        <div className="space-y-4">
          <div className="grid grid-cols-4 gap-2 text-center bg-black/40 p-4 rounded-lg border border-gold-line/30">
             <div className="space-y-2">
               <div className="text-xs text-xuanpaper/50">年柱</div>
               <div className="text-xl font-song text-gold-light">{engineData.ganzhi.year}</div>
               <div className="text-xs text-xuanpaper/50">{engineData.wuxing.year}</div>
             </div>
             <div className="space-y-2">
               <div className="text-xs text-xuanpaper/50">月柱</div>
               <div className="text-xl font-song text-gold-light">{engineData.ganzhi.month}</div>
               <div className="text-xs text-xuanpaper/50">{engineData.wuxing.month}</div>
             </div>
             <div className="space-y-2">
               <div className="text-xs text-xuanpaper/50">日柱</div>
               <div className="text-xl font-song text-gold-light">{engineData.ganzhi.day}</div>
               <div className="text-xs text-xuanpaper/50">{engineData.wuxing.day}</div>
             </div>
             <div className="space-y-2">
               <div className="text-xs text-xuanpaper/50">时柱</div>
               <div className="text-xl font-song text-gold-light">{engineData.ganzhi.time}</div>
               <div className="text-xs text-xuanpaper/50">{engineData.wuxing.time}</div>
             </div>
          </div>
          <div className="flex justify-between text-sm px-2">
            <span className="text-xuanpaper/70">节气：{engineData.seasons.jieqi}</span>
            <span className="text-xuanpaper/70">日主：{engineData.dayMaster} ({engineData.naiveStrength})</span>
          </div>
        </div>
      )}

      {result && (
        <div className="space-y-4">
          <h3 className="text-lg font-song text-gold-light text-center border-b border-gold-line/20 pb-2">推演结论</h3>
          <div className="prose prose-invert prose-gold max-w-none text-xuanpaper/90 text-justify leading-relaxed">
            <pre className="whitespace-pre-wrap font-sans text-sm">{result}</pre>
          </div>
        </div>
      )}
    </div>
  );
}
