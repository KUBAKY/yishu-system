"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { InferenceOverlay } from "./InferenceOverlay";
import { ImageAttachmentField, type ImageAttachment } from "./ImageAttachmentField";
import { toInputDateTime } from "@/lib/utils";

export function GenericView({
  title,
  desc,
  paradigmId,
}: {
  title: string;
  desc: string;
  paradigmId: string;
}) {
  const [question, setQuestion] = useState("");
  const [name, setName] = useState("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [birthDate, setBirthDate] = useState("");
  const [birthTime, setBirthTime] = useState("");
  const [birthLocation, setBirthLocation] = useState("");
  const [currentTime, setCurrentTime] = useState(() => toInputDateTime(new Date().toISOString()));
  const [location, setLocation] = useState("");
  const [phaseFocus, setPhaseFocus] = useState("关系推进");
  const [objective, setObjective] = useState("");
  const [resources, setResources] = useState("");
  const [opposition, setOpposition] = useState("");
  const [decisionWindow, setDecisionWindow] = useState("14天");
  const [spaceType, setSpaceType] = useState("住宅");
  const [spaceLayout, setSpaceLayout] = useState("");
  const [orientation, setOrientation] = useState("");
  const [issueArea, setIssueArea] = useState("");
  const [occupancy, setOccupancy] = useState("");
  const [attachments, setAttachments] = useState<ImageAttachment[]>([]);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [result, setResult] = useState("");

  const profileReady =
    name.trim().length >= 2 &&
    /^\d{4}-\d{2}-\d{2}$/.test(birthDate) &&
    /^\d{2}:\d{2}$/.test(birthTime) &&
    birthLocation.trim().length >= 2;
  const questionReady = question.trim().length >= 6;
  const requiresImage = paradigmId === "fengshui" || paradigmId === "palmistry" || paradigmId === "physiognomy";
  const imageReady = !requiresImage || attachments.length > 0;
  const specialReady =
    paradigmId === "zodiac"
      ? phaseFocus.trim().length > 0
      : paradigmId === "qimen"
        ? objective.trim().length >= 4 && resources.trim().length >= 4 && opposition.trim().length >= 2
        : paradigmId === "fengshui"
          ? orientation.trim().length >= 2 && issueArea.trim().length >= 4 && occupancy.trim().length >= 2 && spaceLayout.trim().length >= 4
          : true;
  const canSubmit = profileReady && questionReady && specialReady && imageReady && currentTime.length > 0 && !loading;

  const buildContext = () => {
    if (paradigmId === "zodiac") {
      return `星盘基于出生信息自动推导；阶段主题：${phaseFocus}；问题：${question.trim()}。`;
    }
    if (paradigmId === "qimen") {
      return `奇门任务：目标${objective}；可用资源${resources}；外部阻力${opposition}；决策窗口${decisionWindow}；问题：${question.trim()}。`;
    }
    if (paradigmId === "fengshui") {
      return `空间场景：${spaceType}；朝向${orientation}；户型/布局${spaceLayout}；症结区域${issueArea}；常住人数${occupancy}；问题：${question.trim()}。`;
    }
    if (paradigmId === "palmistry") {
      return `手相分析：结合掌纹主线、掌丘起伏、手型比例判断先天倾向与阶段策略；问题：${question.trim()}。`;
    }
    if (paradigmId === "physiognomy") {
      return `面相分析：结合额、眉、眼、鼻、口与气色的结构特征判断风险与机会；问题：${question.trim()}。`;
    }
    return `事件问题：${question.trim()}。`;
  };

  const handleStart = async () => {
    if (!canSubmit) return;
    setLoading(true);
    setResult("");
    setError("");
    try {
      const parsed = new Date(currentTime);
      if (Number.isNaN(parsed.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const analysisMode = paradigmId === "zodiac" ? "forecast" : "event";
      const response = await fetch("/api/inference/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm: paradigmId,
          analysisMode: paradigmId === "palmistry" || paradigmId === "physiognomy" ? "natal" : analysisMode,
          forecastWindow: paradigmId === "zodiac" ? "3m" : undefined,
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
            background: buildContext(),
            urgency: paradigmId === "qimen" ? "高" : "一般",
            horizon: paradigmId === "zodiac" ? "90天" : decisionWindow,
            mood: paradigmId === "fengshui" ? "审慎" : "平稳",
          },
          attachments: attachments.map((item) => ({
            name: item.name,
            type: item.type,
            dataUrl: item.dataUrl,
            note: item.note.trim(),
            category: item.category,
          })),
        }),
      });
      
      if (!response.ok || !response.body) {
        const errorData = await response.json().catch(() => ({}));
        throw new Error(errorData.error || "推演失败");
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
      setError(submitError instanceof Error ? submitError.message : "推演失败");
    } finally {
      setLoading(false);
    }
  };

  const showOverlay = loading && !result;

  return (
    <div className="space-y-8 text-center max-w-3xl mx-auto">
      <InferenceOverlay isVisible={showOverlay} paradigmId={paradigmId} />
      <div className="space-y-2">
        <h2 className="text-2xl font-song text-gold-light">{title}</h2>
        <p className="text-xuanpaper/60">{desc}</p>
      </div>

      <div className="bg-black/20 p-8 rounded-xl border border-gold-line/20 flex flex-col items-center gap-4">
        <div className="w-24 h-24 rounded-full bg-gold-glow/10 flex items-center justify-center border border-gold-line/30">
          <span className="text-4xl">
            {paradigmId === "zodiac"
              ? "🪐"
              : paradigmId === "qimen"
                ? "🧭"
                : paradigmId === "palmistry"
                  ? "🖐️"
                  : paradigmId === "physiognomy"
                    ? "🙂"
                    : "🏠"}
          </span>
        </div>

        <div className="grid gap-3 w-full md:grid-cols-2">
          <input
            value={name}
            onChange={(event) => setName(event.target.value)}
            placeholder="姓名"
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          />
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as "男" | "女")}
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          />
          <input
            type="time"
            value={birthTime}
            onChange={(event) => setBirthTime(event.target.value)}
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          />
          <input
            value={birthLocation}
            onChange={(event) => setBirthLocation(event.target.value)}
            placeholder="出生地"
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none md:col-span-2"
          />
          <input
            type="datetime-local"
            value={currentTime}
            onChange={(event) => setCurrentTime(event.target.value)}
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          />
          <input
            value={location}
            onChange={(event) => setLocation(event.target.value)}
            placeholder="当前地点（选填）"
            className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
          />
        </div>

        {paradigmId === "zodiac" && (
          <div className="grid gap-3 w-full md:grid-cols-3">
            <input
              value={phaseFocus}
              onChange={(event) => setPhaseFocus(event.target.value)}
              placeholder="阶段主题"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none md:col-span-3"
            />
          </div>
        )}

        {paradigmId === "qimen" && (
          <div className="grid gap-3 w-full md:grid-cols-2">
            <input
              value={objective}
              onChange={(event) => setObjective(event.target.value)}
              placeholder="本次目标"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={resources}
              onChange={(event) => setResources(event.target.value)}
              placeholder="可用资源"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={opposition}
              onChange={(event) => setOpposition(event.target.value)}
              placeholder="外部阻力"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={decisionWindow}
              onChange={(event) => setDecisionWindow(event.target.value)}
              placeholder="决策窗口"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
          </div>
        )}

        {paradigmId === "fengshui" && (
          <div className="grid gap-3 w-full md:grid-cols-2">
            <select
              value={spaceType}
              onChange={(event) => setSpaceType(event.target.value)}
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            >
              <option value="住宅">住宅</option>
              <option value="办公室">办公室</option>
              <option value="商铺">商铺</option>
            </select>
            <input
              value={orientation}
              onChange={(event) => setOrientation(event.target.value)}
              placeholder="朝向（如坐北朝南）"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={spaceLayout}
              onChange={(event) => setSpaceLayout(event.target.value)}
              placeholder="户型/布局说明（如三室两厅、动线）"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={issueArea}
              onChange={(event) => setIssueArea(event.target.value)}
              placeholder="问题区域（如卧室、财位）"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={occupancy}
              onChange={(event) => setOccupancy(event.target.value)}
              placeholder="常住人数"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
          </div>
        )}

        {(paradigmId === "palmistry" || paradigmId === "physiognomy") && (
          <div className="grid gap-3 w-full md:grid-cols-2">
            <input
              value={decisionWindow}
              onChange={(event) => setDecisionWindow(event.target.value)}
              placeholder="观察周期（如90天）"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
            <input
              value={location}
              onChange={(event) => setLocation(event.target.value)}
              placeholder="拍摄地点（选填）"
              className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
            />
          </div>
        )}

        {(paradigmId === "fengshui" || paradigmId === "palmistry" || paradigmId === "physiognomy") && (
          <ImageAttachmentField
            attachments={attachments}
            onChange={setAttachments}
            allowCamera={paradigmId === "palmistry" || paradigmId === "physiognomy"}
            defaultCategory={paradigmId === "fengshui" ? "平面图" : paradigmId === "palmistry" ? "手掌照" : "面部照"}
            label="上传图片（至少1张，最多6张，单张≤5MB）"
            onError={setError}
          />
        )}

        <textarea
          value={question}
          onChange={(event) => setQuestion(event.target.value)}
          placeholder="请输入你的核心问题..."
          rows={3}
          className="w-full bg-white/5 border border-gold-line/30 rounded-lg px-4 py-3 text-xuanpaper focus:border-gold-light outline-none"
        />

        <Button variant="primary" size="lg" className="w-full" onClick={handleStart} disabled={!canSubmit}>
          {loading ? "推演中..." : "进入推演"}
        </Button>
      </div>

      {error && <p className="text-sm text-red-300">{error}</p>}
      {result && <pre className="text-left whitespace-pre-wrap bg-black/30 border border-gold-line/20 rounded-lg p-4">{result}</pre>}
    </div>
  );
}
