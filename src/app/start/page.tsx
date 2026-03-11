"use client";

import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AuthMeResponse, UserProfile } from "@/types/auth";
import { InferenceResponse, ResultSections, AnalysisMode, ForecastWindow, Step, ReportView } from "@/types/inference";
import { SaveProfileResponse } from "@/types/api-responses";
import { AuthPanel } from "@/components/auth";
import { DailyFortune, ProfileForm, StepIndicator, ExpertTeam, ReportDisplay, DeductionForm, PARADIGMS, ANGLE_OPTIONS, QUICK_LOCATIONS } from "@/components/start";
import { toInputDateTime } from "@/lib/utils";

const DRAFT_KEY = "yishu:start:draft:v1";
const LAST_REPORT_KEY = "yishu:start:last-report:v1";
const EXPERIENCE_TEMPLATE = `建议包含：\n1. 成长背景与关键转折\n2. 学习/职业的重要阶段\n3. 创业或工作中的高低点\n4. 影响你决策风格的事件`;
const STATUS_TEMPLATE = `建议包含：\n1. 收入、负债与现金流压力\n2. 家庭关系与主要责任\n3. 当前最焦虑的现实问题`;
const VISION_TEMPLATE = `建议包含：\n1. 1年内最想达成的结果\n2. 3年内的职业与财富目标\n3. 你愿意持续投入的方向`;

function parseResultSections(content: string): ResultSections {
  const normalized = content.replace(/\r\n/g, "\n");
  const readSection = (title: string, nextTitles: string[]): string => {
    const titleReg = new RegExp(`【${title}】`);
    const start = normalized.search(titleReg);
    if (start < 0) {
      return "";
    }
    const contentStart = start + `【${title}】`.length;
    const after = normalized.slice(contentStart);
    const nextIndex = nextTitles
      .map((item) => after.search(new RegExp(`【${item}】`)))
      .filter((idx) => idx >= 0)
      .sort((a, b) => a - b)[0];
    return (nextIndex === undefined ? after : after.slice(0, nextIndex)).trim();
  };

  const parsed = {
    overview: readSection("总览结论", ["证据链", "行动建议", "风险提示"]),
    evidence: readSection("证据链", ["行动建议", "风险提示"]),
    action: readSection("行动建议", ["风险提示"]),
    risk: readSection("风险提示", []),
  };

  if (Object.values(parsed).some((value) => value.length > 0)) {
    return parsed;
  }

  return {
    overview: normalized,
    evidence: "",
    action: "",
    risk: "",
  };
}

function detectIntent(question: string) {
  const content = question.trim();
  if (!content) {
    return "未识别";
  }
  if (/工作|晋升|跳槽|offer|项目|合作|创业/.test(content)) {
    return "事业决策";
  }
  if (/感情|恋爱|复合|婚|伴侣|关系/.test(content)) {
    return "关系情感";
  }
  if (/财|投资|买房|买车|收益|债务/.test(content)) {
    return "财务规划";
  }
  if (/健康|睡眠|焦虑|压力|疾病|身体/.test(content)) {
    return "健康状态";
  }
  return "综合咨询";
}

function StartPageContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const nowISO = useMemo(() => new Date().toISOString(), []);
  const [paradigm, setParadigm] = useState<string>("bazi");
  const [analysisMode, setAnalysisMode] = useState<AnalysisMode>("event");
  const [forecastWindow, setForecastWindow] = useState<ForecastWindow>("3m");
  const [angles, setAngles] = useState<string[]>(["八字"]);
  const [step, setStep] = useState<Step>(1);
  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [birthDate, setBirthDate] = useState<string>("");
  const [birthTime, setBirthTime] = useState<string>("");
  const [birthLocation, setBirthLocation] = useState<string>("");
  const [currentResidence, setCurrentResidence] = useState<string>("");
  const [pastResidences, setPastResidences] = useState<string>("");
  const [experienceNarrative, setExperienceNarrative] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [futureVision, setFutureVision] = useState<string>("");
  const [question, setQuestion] = useState<string>("");
  const [eventBackground, setEventBackground] = useState<string>("");
  const [currentTime, setCurrentTime] = useState<string>(toInputDateTime(nowISO));
  const [location, setLocation] = useState<string>("");
  const [urgency, setUrgency] = useState<string>("一般");
  const [horizon, setHorizon] = useState<string>("30天内");
  const [mood, setMood] = useState<string>("平稳");
  
  // Specialized Inputs
  const [partnerName, setPartnerName] = useState<string>("");
  const [partnerGender, setPartnerGender] = useState<"男" | "女">("女");
  const [partnerBirthDate, setPartnerBirthDate] = useState<string>("");
  const [partnerBirthTime, setPartnerBirthTime] = useState<string>("");
  
  const [spaceType, setSpaceType] = useState<string>("住宅");
  const [spaceLayout, setSpaceLayout] = useState<string>("");
  
  const [travelDest, setTravelDest] = useState<string>("");
  const [travelDate, setTravelDate] = useState<string>("");
  const [travelPeers, setTravelPeers] = useState<string>("");

  const [loading, setLoading] = useState<boolean>(false);
  const [error, setError] = useState<string>("");
  const [result, setResult] = useState<InferenceResponse | null>(null);
  const [saveStatus, setSaveStatus] = useState<"idle" | "saving" | "saved" | "error" | "guest" | "expired">("idle");
  const [auth, setAuth] = useState<AuthMeResponse>({ authenticated: false });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [draftLoaded, setDraftLoaded] = useState<boolean>(false);
  const [lastReportSummary, setLastReportSummary] = useState<string>("");
  const [reportView, setReportView] = useState<ReportView>("overview");
  const [copyStatus, setCopyStatus] = useState<string>("");
  const [profileStatus, setProfileStatus] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);
  const [viewMode, setViewMode] = useState<"daily" | "deduction">("deduction");
  const [feedbackScore, setFeedbackScore] = useState<number>(0);

  useEffect(() => {
    if (!authLoading && auth.authenticated && !result) {
      setViewMode("daily");
    }
  }, [authLoading, auth.authenticated, result]);

  const profileReady =
    name.trim().length >= 2 &&
    birthDate.length > 0 &&
    /^\d{2}:\d{2}$/.test(birthTime.trim()) &&
    birthLocation.trim().length >= 2;
  const eventReady = question.trim().length >= 6 && eventBackground.trim().length >= 6;
  const modeReady = analysisMode === "event" ? eventReady : true;
  const canSubmit = profileReady && currentTime.length > 0 && modeReady && !loading;
  const intent = useMemo(() => detectIntent(question), [question]);
  const canNextStep1 = profileReady;
  const canNextStep2 = currentTime.length > 0;
  const completeCount = [profileReady, canNextStep2, modeReady].filter(Boolean).length;
  const completionRate = Math.round((completeCount / 3) * 100);
  const modeLabel = {
    event: "具体事件",
    natal: "整体命盘",
    forecast: "阶段推进",
    relationship: "关系适配",
    travel: "出行规划",
    fengshui_space: "空间风水",
  }[analysisMode];



  useEffect(() => {
    const paradigmParam = searchParams.get("paradigm");
    if (paradigmParam && PARADIGMS.some(p => p.id === paradigmParam)) {
      setParadigm(paradigmParam);
    }
  }, [searchParams]);

  const sections = useMemo<ResultSections | null>(() => {
    if (!result) {
      return null;
    }
    return parseResultSections(result.result);
  }, [result]);

  const applyProfile = useCallback((profile: UserProfile) => {
    setName(profile.name);
    setGender(profile.gender);
    setBirthDate(profile.birthDate);
    setBirthTime(profile.birthTime);
    setBirthLocation(profile.birthLocation);
    setCurrentResidence(profile.currentResidence ?? "");
    setPastResidences(profile.pastResidences ?? "");
    setExperienceNarrative(profile.experienceNarrative ?? "");
    setCurrentStatus(profile.currentStatus ?? "");
    setFutureVision(profile.futureVision ?? "");
  }, []);

  useEffect(() => {
    const raw = localStorage.getItem(DRAFT_KEY);
    if (raw) {
      try {
        const parsed = JSON.parse(raw) as {
          paradigm?: string;
          analysisMode?: AnalysisMode;
          forecastWindow?: ForecastWindow;
          angles?: string[];
          name?: string;
          gender?: "男" | "女";
          birthDate?: string;
          birthTime?: string;
          birthLocation?: string;
          currentResidence?: string;
          pastResidences?: string;
          experienceNarrative?: string;
          currentStatus?: string;
          futureVision?: string;
          question?: string;
          eventBackground?: string;
          currentTime?: string;
          location?: string;
          urgency?: string;
          horizon?: string;
          mood?: string;
        };
        if (parsed.paradigm) {
          setParadigm(parsed.paradigm);
        }
        if (parsed.analysisMode === "event" || parsed.analysisMode === "natal" || parsed.analysisMode === "forecast") {
          setAnalysisMode(parsed.analysisMode);
        }
        if (parsed.forecastWindow === "3m" || parsed.forecastWindow === "1y") {
          setForecastWindow(parsed.forecastWindow);
        }
        if (Array.isArray(parsed.angles) && parsed.angles.length > 0) {
          setAngles(parsed.angles.filter((item) => ANGLE_OPTIONS.includes(item as (typeof ANGLE_OPTIONS)[number])));
        }
        if (parsed.name) {
          setName(parsed.name);
        }
        if (parsed.gender === "男" || parsed.gender === "女") {
          setGender(parsed.gender);
        }
        if (parsed.birthDate) {
          setBirthDate(parsed.birthDate);
        }
        if (parsed.birthTime) {
          setBirthTime(parsed.birthTime);
        }
        if (parsed.birthLocation) {
          setBirthLocation(parsed.birthLocation);
        }
        if (parsed.currentResidence) {
          setCurrentResidence(parsed.currentResidence);
        }
        if (parsed.pastResidences) {
          setPastResidences(parsed.pastResidences);
        }
        if (parsed.experienceNarrative) {
          setExperienceNarrative(parsed.experienceNarrative);
        }
        if (parsed.currentStatus) {
          setCurrentStatus(parsed.currentStatus);
        }
        if (parsed.futureVision) {
          setFutureVision(parsed.futureVision);
        }
        if (parsed.question) {
          setQuestion(parsed.question);
        }
        if (parsed.eventBackground) {
          setEventBackground(parsed.eventBackground);
        }
        if (parsed.currentTime) {
          setCurrentTime(parsed.currentTime);
        }
        if (parsed.location) {
          setLocation(parsed.location);
        }
        if (parsed.urgency) {
          setUrgency(parsed.urgency);
        }
        if (parsed.horizon) {
          setHorizon(parsed.horizon);
        }
        if (parsed.mood) {
          setMood(parsed.mood);
        }
      } catch {
        localStorage.removeItem(DRAFT_KEY);
      }
    }
    const summary = localStorage.getItem(LAST_REPORT_KEY);
    if (summary) {
      setLastReportSummary(summary);
    }
    setDraftLoaded(true);
  }, []);

  useEffect(() => {
    if (!draftLoaded) {
      return;
    }
    localStorage.setItem(
      DRAFT_KEY,
      JSON.stringify({
        paradigm,
        analysisMode,
        forecastWindow,
        angles,
        name,
        gender,
        birthDate,
        birthTime,
        birthLocation,
        currentResidence,
        pastResidences,
        experienceNarrative,
        currentStatus,
        futureVision,
        question,
        eventBackground,
        currentTime,
        location,
        urgency,
        horizon,
        mood,
      }),
    );
  }, [
    paradigm,
    analysisMode,
    forecastWindow,
    angles,
    name,
    gender,
    birthDate,
    birthTime,
    birthLocation,
    currentResidence,
    pastResidences,
    experienceNarrative,
    currentStatus,
    futureVision,
    question,
    eventBackground,
    currentTime,
    location,
    urgency,
    horizon,
    mood,
    draftLoaded,
  ]);

  const loadAuthState = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as AuthMeResponse;
      setAuth(data);
      if (data.authenticated && data.user.profile) {
        applyProfile(data.user.profile);
      }
    } catch {
      setAuth({ authenticated: false });
    } finally {
      setAuthLoading(false);
    }
  }, [applyProfile]);

  useEffect(() => {
    void loadAuthState();
  }, [loadAuthState]);

  async function onSaveProfile() {
    if (!auth.authenticated) {
      setProfileStatus("请先登录再保存档案");
      return;
    }
    if (!profileReady) {
      setProfileStatus("请补全姓名、性别、生辰与出生地");
      return;
    }
    setSavingProfile(true);
    setProfileStatus("");
    const profile: UserProfile = {
      name: name.trim(),
      gender,
      birthDate: birthDate.trim(),
      birthTime: birthTime.trim(),
      birthLocation: birthLocation.trim(),
      ...(currentResidence.trim() ? { currentResidence: currentResidence.trim() } : {}),
      ...(pastResidences.trim() ? { pastResidences: pastResidences.trim() } : {}),
      ...(experienceNarrative.trim() ? { experienceNarrative: experienceNarrative.trim() } : {}),
      ...(currentStatus.trim() ? { currentStatus: currentStatus.trim() } : {}),
      ...(futureVision.trim() ? { futureVision: futureVision.trim() } : {}),
    };
    try {
      const response = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await response.json()) as SaveProfileResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "保存失败");
      }
      setAuth({ authenticated: true, user: data.user });
      setProfileStatus("个人档案已保存");
    } catch (saveError) {
      setProfileStatus(saveError instanceof Error ? saveError.message : "保存失败");
    } finally {
      setSavingProfile(false);
    }
  }

  async function startDeduction() {
    setError("");
    setLoading(true);
    setSaveStatus("idle");
    setCopyStatus("");

    try {
      const baseQuestion =
        question.trim() ||
        (analysisMode === "natal" ? "请给出我的整体命盘画像与长期发展建议" : "请给出最近阶段的命盘推进建议");

      let enrichedBackground = eventBackground.trim();
      if (analysisMode === "relationship") {
        enrichedBackground += `\n【关系对象】姓名：${partnerName}，性别：${partnerGender}，生辰：${partnerBirthDate} ${partnerBirthTime}`;
      } else if (analysisMode === "fengshui_space") {
        enrichedBackground += `\n【空间信息】类型：${spaceType}，布局：${spaceLayout}`;
      } else if (analysisMode === "travel") {
        enrichedBackground += `\n【出行计划】目的地：${travelDest}，时间：${travelDate}，同行：${travelPeers}`;
      }

      const contextBlocks =
        analysisMode === "event"
          ? [
              `意图类型：${intent}`,
              `事件背景：${enrichedBackground}`,
              `紧迫度：${urgency}`,
              `关注周期：${horizon}`,
              `当前心境：${mood}`,
            ]
          : [
              `推演模式：${modeLabel}`,
              `阶段窗口：${analysisMode === "forecast" ? (forecastWindow === "3m" ? "最近三个月" : "最近一年") : "长期基线"}`,
              `会诊视角：${angles.join("、")}`,
              `补充背景：${enrichedBackground}`,
            ];
      const enrichedQuestion = `${baseQuestion}\n\n【情境补全】\n${contextBlocks.join("\n")}`;
      const parsedTime = new Date(currentTime);
      if (Number.isNaN(parsedTime.getTime())) {
        throw new Error("起局时间格式不正确");
      }
      const normalizedCurrentTime = parsedTime.toISOString();
      const response = await fetch("/api/inference/stream", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          paradigm,
          analysisMode,
          forecastWindow,
          angles,
          question: baseQuestion,
          currentTime: normalizedCurrentTime,
          location,
          profile: {
            name: name.trim(),
            gender,
            birthDate: birthDate.trim(),
            birthTime: birthTime.trim(),
            birthLocation: birthLocation.trim(),
            currentResidence: currentResidence.trim(),
            pastResidences: pastResidences.trim(),
            experienceNarrative: experienceNarrative.trim(),
            currentStatus: currentStatus.trim(),
            futureVision: futureVision.trim(),
          },
          eventContext: {
            background: enrichedBackground || `${modeLabel}基础推演`,
            urgency,
            horizon,
            mood,
          },
        }),
      });

      
      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ error: "推演失败" }));
        throw new Error(errorData.error || "推演失败");
      }

      setReportView("overview");
      setResult({
          result: "",
          meta: {
            paradigm,
            paradigmLabel: modeLabel,
            model: "streaming...",
            reference: "",
            citations: []
          }
      });
      
      const reader = response.body?.getReader();
      const decoder = new TextDecoder();
      let streamResult = "";

      if (reader) {
        while (true) {
          const { done, value } = await reader.read();
          if (done) break;
          
          const chunk = decoder.decode(value, { stream: true });
          const lines = chunk.split(/\r?\n/).filter((line) => line.trim() !== "");
          
          for (const line of lines) {
            if (line.startsWith("data: ") && line !== "data: [DONE]") {
              try {
                const parsed = JSON.parse(line.slice(6));
                if (parsed.content) {
                  streamResult += parsed.content;
                  setResult(prev => {
                      if (!prev) return null;
                      return { ...prev, result: streamResult };
                  });
                }
              } catch (e) {
                // Ignore parse errors for partial chunks
              }
            }
          }
        }
      }
      
      const parsed = parseResultSections(streamResult);
      localStorage.setItem(LAST_REPORT_KEY, parsed.overview);
      setLastReportSummary(parsed.overview);
      
      // Update meta to match actual values after completely generated
      const data = {
          result: streamResult,
          meta: {
              paradigm,
              paradigmLabel: modeLabel,
              model: "anthropic/claude-3.5-sonnet",
              reference: "",
              citations: [],
          }
      };
      setResult(data);


      if (!auth.authenticated) {
        setSaveStatus("guest");
        return;
      }
      if (auth.user.membership === "expired") {
        setSaveStatus("expired");
        return;
      }

      setSaveStatus("saving");
      const savePayload: Omit<YishuCase, "id" | "createdAt" | "userId"> = {
        paradigm: data.meta.paradigm,
        paradigmLabel: data.meta.paradigmLabel,
        question: enrichedQuestion,
        location: location.trim(),
        currentTime: normalizedCurrentTime,
        result: data.result,
        model: data.meta.model,
        reference: data.meta.reference,
        citations: data.meta.citations,
        lunarContext: data.meta.lunarContext,
        foundations: data.meta.foundations ?? [],
        aiEnhancements: data.meta.aiEnhancements ?? [],
      };
      const saveResponse = await fetch("/api/cases", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(savePayload),
      });
      if (!saveResponse.ok) {
        setSaveStatus("error");
      } else {
        setSaveStatus("saved");
      }
    } catch (submitError) {
      setError(submitError instanceof Error ? submitError.message : "推演失败，请稍后重试");
      setSaveStatus("idle");
    } finally {
      setLoading(false);
    }
  }

  function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
    void startDeduction();
  }

  function moveStep(next: Step) {
    setStep(next);
  }

  async function copyReport() {
    if (!result) {
      return;
    }
    try {
      await navigator.clipboard.writeText(result.result);
      setCopyStatus("已复制报告");
    } catch {
      setCopyStatus("复制失败");
    }
  }

  function downloadReport() {
    if (!result) {
      return;
    }
    const text = [
      "易枢推演报告",
      `术数范式：${result.meta.paradigmLabel}`,
      `推演模式：${modeLabel}`,
      `会诊视角：${angles.join("、")}`,
      `起局时间：${currentTime}`,
      `地点：${location || "未填写"}`,
      "",
      result.result,
    ].join("\n");
    const blob = new Blob([text], { type: "text/plain;charset=utf-8" });
    const url = URL.createObjectURL(blob);
    const link = document.createElement("a");
    link.href = url;
    link.download = `yishu-report-${Date.now()}.txt`;
    link.click();
    URL.revokeObjectURL(url);
  }

  return (
    <main className="min-h-screen bg-xuanqing text-xuanpaper px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {viewMode === "daily" ? (
          <DailyFortune
            userName={name}
            userPhone={auth.authenticated ? auth.user.phone : undefined}
            authenticated={auth.authenticated}
            onStartDeduction={() => setViewMode("deduction")}
          />
        ) : (
          <>
            <Card glow className="border-gold-line bg-[radial-gradient(circle_at_top_right,rgba(168,132,59,0.18),rgba(23,29,36,0.92)_45%)]">
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.24em] text-xuanpaper/55">YISHU EXPERT TEAM</p>
                    <h1 className="text-3xl md:text-4xl font-song text-gold-light">命盘推演中枢</h1>
                    <p className="text-sm md:text-base text-xuanpaper/80">支持事件、整体命盘、阶段推进三种模式</p>
                  </div>
                  <div className="min-w-44 rounded-xl border border-gold-line/40 bg-xuangray/70 px-4 py-3">
                    <p className="text-xs text-xuanpaper/60">完成度</p>
                    <p className="mt-1 text-2xl font-song text-gold-light">{completionRate}%</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-gold-dark),var(--color-gold-light))]" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    当前阶段：{step}/3
                  </div>
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    推演模式：{modeLabel}
                  </div>
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    目标范式：{PARADIGMS.find((item: {id: string, label: string}) => item.id === paradigm)?.label ?? "未选择"}
                  </div>
                </div>

                <ExpertTeam paradigm={paradigm} angles={angles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">三步问询</h2>
              </CardHeader>
              <CardContent>
                <StepIndicator currentStep={step} onStepChange={moveStep} />
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">参数详情</h2>
              </CardHeader>
              <CardContent>
                <form onSubmit={onSubmit} className="space-y-6">
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">核心术数模型</p>
                        <div className="flex flex-wrap gap-2">
                          {PARADIGMS.map((item: {id: string, label: string}) => (
                            <Button
                              key={item.id}
                              type="button"
                              size="sm"
                              variant={paradigm === item.id ? "primary" : "outline"}
                              onClick={() => setParadigm(item.id)}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">推演模式</p>
                        <div className="flex flex-wrap gap-2">
                          <Button key="event" type="button" size="sm" variant={analysisMode === "event" ? "primary" : "outline"} onClick={() => setAnalysisMode("event")}>具体事件 (单事研判)</Button>
                          <Button key="natal" type="button" size="sm" variant={analysisMode === "natal" ? "primary" : "outline"} onClick={() => setAnalysisMode("natal")}>整体命盘 (长期主线)</Button>
                          <Button key="forecast" type="button" size="sm" variant={analysisMode === "forecast" ? "primary" : "outline"} onClick={() => setAnalysisMode("forecast")}>阶段推进 (周期运势)</Button>
                          <Button key="relationship" type="button" size="sm" variant={analysisMode === "relationship" ? "primary" : "outline"} onClick={() => setAnalysisMode("relationship")}>关系适配 (合盘对看)</Button>
                          <Button key="fengshui_space" type="button" size="sm" variant={analysisMode === "fengshui_space" ? "primary" : "outline"} onClick={() => setAnalysisMode("fengshui_space")}>空间风水 (环境能量)</Button>
                          <Button key="travel" type="button" size="sm" variant={analysisMode === "travel" ? "primary" : "outline"} onClick={() => setAnalysisMode("travel")}>出行规划 (时空选择)</Button>
                        </div>
                      </div>

                      {analysisMode === "forecast" ? (
                        <div className="space-y-2">
                          <p className="text-sm text-xuanpaper/80">预测窗口</p>
                          <div className="flex flex-wrap gap-2">
                            <Button key="3m" type="button" size="sm" variant={forecastWindow === "3m" ? "primary" : "outline"} onClick={() => setForecastWindow("3m")}>近期 (3个月)</Button>
                            <Button key="1y" type="button" size="sm" variant={forecastWindow === "1y" ? "primary" : "outline"} onClick={() => setForecastWindow("1y")}>全年 (12个月)</Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">会诊视角</p>
                        <div className="flex flex-wrap gap-2">
                          {ANGLE_OPTIONS.map((item: string) => {
                            const active = angles.includes(item);
                            return (
                              <Button
                                key={item}
                                type="button"
                                size="sm"
                                variant={active ? "primary" : "outline"}
                                onClick={() =>
                                  setAngles((prev: string[]) =>
                                    prev.includes(item) ? (prev.length === 1 ? prev : prev.filter((value: string) => value !== item)) : [...prev, item],
                                  )
                                }
                              >
                                {item}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <ProfileForm
                        name={name} setName={setName}
                        gender={gender} setGender={setGender}
                        birthDate={birthDate} setBirthDate={setBirthDate}
                        birthTime={birthTime} setBirthTime={setBirthTime}
                        birthLocation={birthLocation} setBirthLocation={setBirthLocation}
                        currentResidence={currentResidence} setCurrentResidence={setCurrentResidence}
                        pastResidences={pastResidences} setPastResidences={setPastResidences}
                        experienceNarrative={experienceNarrative} setExperienceNarrative={setExperienceNarrative}
                        currentStatus={currentStatus} setCurrentStatus={setCurrentStatus}
                        futureVision={futureVision} setFutureVision={setFutureVision}
                        profileReady={profileReady}
                        authenticated={auth.authenticated}
                        onSaveProfile={onSaveProfile}
                        savingProfile={savingProfile}
                        profileStatus={profileStatus}
                      />
                    </div>
                  ) : null}

                  <DeductionForm 
                    step={step} moveStep={moveStep} canNextStep1={canNextStep1} canNextStep2={canNextStep2}
                    canSubmit={canSubmit} loading={loading} startDeduction={startDeduction}
                    paradigm={paradigm} setParadigm={setParadigm} analysisMode={analysisMode} setAnalysisMode={setAnalysisMode}
                    forecastWindow={forecastWindow} setForecastWindow={setForecastWindow} angles={angles} setAngles={setAngles}
                    currentTime={currentTime} setCurrentTime={setCurrentTime} location={location} setLocation={setLocation}
                    question={question} setQuestion={setQuestion} eventBackground={eventBackground} setEventBackground={setEventBackground}
                    urgency={urgency} setUrgency={setUrgency} horizon={horizon} setHorizon={setHorizon} mood={mood} setMood={setMood}
                    partnerName={partnerName} setPartnerName={setPartnerName} partnerGender={partnerGender} setPartnerGender={setPartnerGender}
                    partnerBirthDate={partnerBirthDate} setPartnerBirthDate={setPartnerBirthDate} partnerBirthTime={partnerBirthTime} setPartnerBirthTime={setPartnerBirthTime}
                    spaceType={spaceType} setSpaceType={setSpaceType} spaceLayout={spaceLayout} setSpaceLayout={setSpaceLayout}
                    travelDest={travelDest} setTravelDest={setTravelDest} travelDate={travelDate} setTravelDate={setTravelDate} travelPeers={travelPeers} setTravelPeers={setTravelPeers}
                    name={name} modeLabel={modeLabel}
                  />
                </form>
              </CardContent>
            </Card>

            <Card className="border-gold-line/40 bg-xuangray/70">
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">实时推演预览</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                    <p className="text-xs text-xuanpaper/60">个人底盘</p>
                    <p className="mt-1 text-sm text-gold-light">{profileReady ? `${name} · ${gender}` : "待补全"}</p>
                  </div>
                  <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                    <p className="text-xs text-xuanpaper/60">时空锚点</p>
                    <p className="mt-1 text-sm text-gold-light">{currentTime ? "已设置" : "未设置"} / {location || "未填地点"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                  <p className="text-xs text-xuanpaper/60">推演焦点</p>
                  <p className="mt-1 text-sm leading-7 text-xuanpaper/85">
                    {question.trim() ||
                      (analysisMode === "event"
                        ? "请输入你的核心问题，系统会按范式生成团队会诊报告。"
                        : analysisMode === "natal"
                          ? "整体命盘模式将输出长期结构、优势短板与行动主线。"
                          : "阶段推进模式将输出窗口节奏、阶段机会与风险主题。")}
                  </p>
                </div>
              </CardContent>
            </Card>

          </>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-song text-gold-light">账号状态</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <AuthPanel
              auth={auth}
              authLoading={authLoading}
              onAuthChange={setAuth}
              guestMessage="当前为游客态：可推演，登录后可保存历史记录并启用试用权益。"
              successMessage="登录成功，已自动登录"
              authenticatedActions={
                <Button variant="primary" size="sm" onClick={() => router.push("/account")}>
                  个人中心
                </Button>
              }
            />
            {auth.authenticated && auth.user.trialEndsAt ? (
              <p className="text-sm text-xuanpaper/70 mt-2">
                试用截止：{new Date(auth.user.trialEndsAt).toLocaleDateString("zh-CN")}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardContent className="text-sm text-red-300 pt-5">{error}</CardContent>
          </Card>
        ) : null}

        {result ? (
          <Card glow>
            <CardHeader>
              <h2 className="text-lg font-song text-gold-light">推演结果</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReportDisplay
                result={result}
                reportView={reportView}
                setReportView={setReportView}
                angles={angles}
                saveStatus={saveStatus}
                sections={sections}
                copyReport={copyReport}
                downloadReport={downloadReport}
                feedbackScore={feedbackScore}
                setFeedbackScore={setFeedbackScore}
                copyStatus={copyStatus}
              />
            </CardContent>
          </Card>
        ) : null}

        {!result && lastReportSummary ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-song text-gold-light">上次推演摘要（本地缓存）</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-8 whitespace-pre-wrap">{lastReportSummary}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex gap-3">
          <Link href="/cases">
            <Button variant="primary">查看案例库</Button>
          </Link>
          <Link href="/account">
            <Button variant="outline">账号中心</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-xuanqing text-xuanpaper/50 flex items-center justify-center">Loading...</div>}>
      <StartPageContent />
    </Suspense>
  );
}
