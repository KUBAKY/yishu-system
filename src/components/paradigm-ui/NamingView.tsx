"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InferenceOverlay } from "./InferenceOverlay";

export function NamingView() {
  const [childGender, setChildGender] = useState<"男" | "女">("男");
  const [childBirthDate, setChildBirthDate] = useState("");
  const [childBirthTime, setChildBirthTime] = useState("");
  const [childBirthLocation, setChildBirthLocation] = useState("");

  const [fatherName, setFatherName] = useState("");
  const [fatherGender, setFatherGender] = useState<"男" | "女">("男");
  const [fatherBirthDate, setFatherBirthDate] = useState("");
  const [fatherBirthTime, setFatherBirthTime] = useState("");

  const [motherName, setMotherName] = useState("");
  const [motherGender, setMotherGender] = useState<"男" | "女">("女");
  const [motherBirthDate, setMotherBirthDate] = useState("");
  const [motherBirthTime, setMotherBirthTime] = useState("");

  const [preference, setPreference] = useState("");
  const [nameLengths, setNameLengths] = useState<number[]>([2, 3]);
  const [stylePrefs, setStylePrefs] = useState<string[]>([]);
  const [otherStyle, setOtherStyle] = useState("");
  const [mustIncludeChars, setMustIncludeChars] = useState("");
  const [avoidChars, setAvoidChars] = useState("");

  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const childReady =
    /^\d{4}-\d{2}-\d{2}$/.test(childBirthDate) &&
    childBirthLocation.trim().length >= 2;
  const fatherReady =
    fatherName.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(fatherBirthDate);
  const motherReady =
    motherName.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(motherBirthDate);
  const canSubmit = childReady && fatherReady && motherReady && !loading;

  const toggleLength = (value: number) => {
    setNameLengths((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const toggleStyle = (value: string) => {
    setStylePrefs((prev) => (prev.includes(value) ? prev.filter((item) => item !== value) : [...prev, value]));
  };

  const handleSubmit = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setError("");
    setResult("");

    try {
      const timePart = /^\d{2}:\d{2}$/.test(childBirthTime) ? childBirthTime : "00:00";
      const anchor = new Date(`${childBirthDate}T${timePart}:00`);
      if (Number.isNaN(anchor.getTime())) {
        throw new Error("出生时间格式不正确");
      }

      const question = preference.trim() || "请依据五行取名并推荐姓氏";

      const response = await fetch("/api/inference/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: "naming",
          analysisMode: "naming",
          question,
          currentTime: anchor.toISOString(),
          location: childBirthLocation.trim(),
          namingContext: {
            child: {
              gender: childGender,
              birthDate: childBirthDate,
              birthTime: childBirthTime.trim(),
              birthLocation: childBirthLocation.trim(),
            },
            father: {
              name: fatherName.trim(),
              gender: fatherGender,
              birthDate: fatherBirthDate,
              birthTime: fatherBirthTime.trim(),
            },
            mother: {
              name: motherName.trim(),
              gender: motherGender,
              birthDate: motherBirthDate,
              birthTime: motherBirthTime.trim(),
            },
            preferences: {
              nameLengths: nameLengths.length > 0 ? nameLengths : [2, 3],
              styles: stylePrefs,
              otherStyle: otherStyle.trim(),
              mustIncludeChars: mustIncludeChars.trim(),
              avoidChars: avoidChars.trim(),
              notes: preference.trim(),
            },
          },
          eventContext: {
            background: "五行取名",
            urgency: "一般",
            horizon: "长期",
            mood: "平稳",
          },
        }),
      });

      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "取名推演失败");
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let buffer = "";

      while (true) {
        const { done, value } = await reader.read();
        if (done) {
          if (buffer) {
            const lines = buffer.split("\n").filter(line => line.trim() !== "");
            for (const line of lines) {
              if (line === "data: [DONE]") continue;
              if (line.startsWith("data: ")) {
                try {
                  const data = JSON.parse(line.slice(6));
                  if (data.error) throw new Error(data.error);
                  if (data.type === "status") {
                    setResult(prev => prev + `\n➤ ${data.content}\n`);
                  } else if (data.content) {
                    setResult(prev => prev + data.content);
                  }
                } catch {}
              }
            }
          }
          break;
        }

        buffer += decoder.decode(value, { stream: true });
        const lines = buffer.split("\n");
        buffer = lines.pop() || "";

        for (const line of lines) {
          const trimmedLine = line.trim();
          if (!trimmedLine || trimmedLine === "data: [DONE]") continue;
          if (trimmedLine.startsWith("data: ")) {
            try {
              const data = JSON.parse(trimmedLine.slice(6));
              if (data.error) throw new Error(data.error);
              if (data.type === "status") {
                setResult(prev => prev + `\n➤ ${data.content}\n`);
              } else if (data.content) {
                setResult(prev => prev + data.content);
              }
            } catch {}
          }
        }
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "取名推演失败");
    } finally {
      setLoading(false);
    }
  };

  const showOverlay = loading && !result;

  return (
    <div className="space-y-8 max-w-3xl mx-auto">
      <InferenceOverlay isVisible={showOverlay} paradigmId="naming" />
      <div className="text-center space-y-2">
        <h2 className="text-2xl font-song text-gold-light">五行取名</h2>
        <p className="text-xuanpaper/60">不采集孩子姓名，根据生辰与父母信息给出取名建议</p>
      </div>

      <div className="space-y-6 bg-black/20 p-6 rounded-xl border border-gold-line/20">
        <div className="space-y-3">
          <h3 className="text-lg font-song text-gold-light">孩子信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">性别</span>
              <select
                value={childGender}
                onChange={(e) => setChildGender(e.target.value as "男" | "女")}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生日期</span>
              <input
                type="date"
                value={childBirthDate}
                onChange={(e) => setChildBirthDate(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生时间（可选）</span>
              <input
                type="time"
                value={childBirthTime}
                onChange={(e) => setChildBirthTime(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生地点</span>
              <input
                value={childBirthLocation}
                onChange={(e) => setChildBirthLocation(e.target.value)}
                placeholder="例如：上海浦东"
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-song text-gold-light">父亲信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">姓名</span>
              <input
                value={fatherName}
                onChange={(e) => setFatherName(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">性别</span>
              <select
                value={fatherGender}
                onChange={(e) => setFatherGender(e.target.value as "男" | "女")}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生日期</span>
              <input
                type="date"
                value={fatherBirthDate}
                onChange={(e) => setFatherBirthDate(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生时间（可选）</span>
              <input
                type="time"
                value={fatherBirthTime}
                onChange={(e) => setFatherBirthTime(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-song text-gold-light">母亲信息</h3>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">姓名</span>
              <input
                value={motherName}
                onChange={(e) => setMotherName(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">性别</span>
              <select
                value={motherGender}
                onChange={(e) => setMotherGender(e.target.value as "男" | "女")}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              >
                <option value="男">男</option>
                <option value="女">女</option>
              </select>
            </label>
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生日期</span>
              <input
                type="date"
                value={motherBirthDate}
                onChange={(e) => setMotherBirthDate(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">出生时间（可选）</span>
              <input
                type="time"
                value={motherBirthTime}
                onChange={(e) => setMotherBirthTime(e.target.value)}
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
          </div>
        </div>

        <div className="space-y-3">
          <h3 className="text-lg font-song text-gold-light">命名偏好</h3>
          <div className="space-y-2">
            <span className="text-sm text-xuanpaper/70">名字长度（可多选）</span>
            <div className="flex flex-wrap gap-2">
              {[2, 3].map((len) => (
                <button
                  key={len}
                  type="button"
                  className={`rounded-sm border px-3 py-1 text-sm ${nameLengths.includes(len) ? "border-gold-light text-gold-light" : "border-gold-line/40 text-xuanpaper/70"}`}
                  onClick={() => toggleLength(len)}
                >
                  {len}字名
                </button>
              ))}
            </div>
          </div>
          <div className="space-y-2">
            <span className="text-sm text-xuanpaper/70">风格偏好（可多选）</span>
            <div className="flex flex-wrap gap-2">
              {["传统", "现代", "文雅", "中性", "其他"].map((style) => (
                <button
                  key={style}
                  type="button"
                  className={`rounded-sm border px-3 py-1 text-sm ${stylePrefs.includes(style) ? "border-gold-light text-gold-light" : "border-gold-line/40 text-xuanpaper/70"}`}
                  onClick={() => toggleStyle(style)}
                >
                  {style}
                </button>
              ))}
            </div>
            {stylePrefs.includes("其他") ? (
              <input
                type="text"
                value={otherStyle}
                onChange={(e) => setOtherStyle(e.target.value)}
                placeholder="补充描述其他风格"
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            ) : null}
          </div>
          <div className="grid gap-4 md:grid-cols-2">
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">必用字（可选）</span>
              <input
                value={mustIncludeChars}
                onChange={(e) => setMustIncludeChars(e.target.value)}
                placeholder="例如：宸、安"
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
            <label className="space-y-1">
              <span className="text-sm text-xuanpaper/70">禁用字（可选）</span>
              <input
                value={avoidChars}
                onChange={(e) => setAvoidChars(e.target.value)}
                placeholder="例如：伟、强"
                className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
              />
            </label>
          </div>
          <label className="block space-y-1">
            <span className="text-sm text-xuanpaper/70">补充偏好（可选）</span>
            <textarea
              value={preference}
              onChange={(e) => setPreference(e.target.value)}
              rows={3}
              placeholder="例如：偏好两字名、寓意稳重、避免生僻字"
              className="w-full bg-white/5 border border-gold-line/30 rounded px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
        </div>

        <div className="pt-2">
          <Button variant="primary" size="lg" className="w-full" onClick={handleSubmit} disabled={!canSubmit}>
            {loading ? "推演中..." : "开始取名推演"}
          </Button>
        </div>
      </div>

      {error && <p className="text-sm text-red-300 text-center">{error}</p>}

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
