"use client";

import Link from "next/link";
import { useRouter, useSearchParams } from "next/navigation";
import { useCallback, useEffect, useMemo, useState, Suspense } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { YishuCase } from "@/types/case";
import { AuthMeResponse, AuthUser, UserProfile } from "@/types/auth";

type InferenceResponse = {
  result: string;
  meta: {
    paradigm: string;
    paradigmLabel: string;
    analysisMode?: AnalysisMode;
    forecastWindow?: ForecastWindow;
    angles?: string[];
    model: string;
    reference: string;
    citations: Array<{
      title: string;
      chapter: string;
      quote: string;
      source: string;
    }>;
    lunarContext?: {
      solarDate: string;
      lunarDate: string;
      ganzhi: string;
    };
    foundations?: Array<{
      id: string;
      name: string;
      purpose: string;
      kind: "engine" | "data" | "workflow";
      license: string;
      integration: "direct" | "reference";
      confidence: number;
    }>;
    aiEnhancements?: string[];
  };
};

type ResultSections = {
  overview: string;
  evidence: string;
  action: string;
  risk: string;
};

type SendCodeResponse = { ok: true; devCode?: string } | { error: string };
type AuthResponse = { authenticated: true; user: AuthUser } | { error: string };
type SaveProfileResponse = { authenticated: true; user: AuthUser } | { error: string };
type ReportView = "overview" | "evidence" | "action" | "risk" | "full";
type Step = 1 | 2 | 3;
type AnalysisMode = "event" | "natal" | "forecast" | "relationship" | "travel" | "fengshui_space";
type ForecastWindow = "3m" | "1y";
type AuthMode = "register" | "login";

const PARADIGMS = [
  { id: "bazi", label: "八字命理" },
  { id: "liuyao", label: "六爻纳甲" },
  { id: "meihua", label: "梅花易数" },
  { id: "qimen", label: "奇门遁甲" },
  { id: "fengshui", label: "堪舆风水" },
  { id: "zodiac", label: "星座占星" },
  { id: "tarot", label: "塔罗推演" },
  { id: "composite", label: "综合会诊（八字+星座+塔罗）" },
];

const ANGLE_OPTIONS = ["八字", "星座", "塔罗"] as const;

const STEP_CONFIG: Array<{ step: Step; title: string; summary: string }> = [
  { step: 1, title: "个人底盘", summary: "确认身份底盘，决定推演基准" },
  { step: 2, title: "时空锚定", summary: "固定时刻地点，确保起局一致" },
  { step: 3, title: "事件补全", summary: "补足背景与情绪，提升建议命中" },
];

const QUICK_LOCATIONS = ["北京", "上海", "广州", "深圳", "杭州", "成都"];
const DRAFT_KEY = "yishu:start:draft:v1";
const LAST_REPORT_KEY = "yishu:start:last-report:v1";
const EXPERIENCE_TEMPLATE = `建议包含：\n1. 成长背景与关键转折\n2. 学习/职业的重要阶段\n3. 创业或工作中的高低点\n4. 影响你决策风格的事件`;
const STATUS_TEMPLATE = `建议包含：\n1. 收入、负债与现金流压力\n2. 家庭关系与主要责任\n3. 当前最焦虑的现实问题`;
const VISION_TEMPLATE = `建议包含：\n1. 1年内最想达成的结果\n2. 3年内的职业与财富目标\n3. 你愿意持续投入的方向`;

function toInputDateTime(iso: string) {
  const date = new Date(iso);
  if (Number.isNaN(date.getTime())) {
    return "";
  }
  const y = date.getFullYear();
  const m = `${date.getMonth() + 1}`.padStart(2, "0");
  const d = `${date.getDate()}`.padStart(2, "0");
  const h = `${date.getHours()}`.padStart(2, "0");
  const min = `${date.getMinutes()}`.padStart(2, "0");
  return `${y}-${m}-${d}T${h}:${min}`;
}

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

function getDailyFortune(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const levels = ["大吉", "中吉", "小吉", "平", "小凶"];
  const quotes = [
    "时来天地皆同力，运去英雄不自由。",
    "君子藏器于身，待时而动。",
    "知者不惑，仁者不忧，勇者不惧。",
    "天行健，君子以自强不息。",
    "祸兮福之所倚，福兮祸之所伏。",
    "道生一，一生二，二生三，三生万物。",
    "人法地，地法天，天法道，道法自然。",
  ];
  const activities = [
    { good: "访友、签约", bad: "争执、远行" },
    { good: "纳财、修造", bad: "开市、动土" },
    { good: "祭祀、祈福", bad: "嫁娶、移徙" },
    { good: "安床、入宅", bad: "出行、词讼" },
    { good: "开仓、出货", bad: "安葬、破土" },
  ];
  const gods = [
    { wealth: "正东", joy: "西北", noble: "正南" },
    { wealth: "正南", joy: "正南", noble: "正东" },
    { wealth: "东北", joy: "东南", noble: "西南" },
    { wealth: "西南", joy: "东北", noble: "正北" },
  ];
  
  const colors = ["赤红", "玄黑", "月白", "松绿", "琥珀", "群青", "黛蓝", "金褐"];
  const workTips = ["今日宜攻坚，处理最难的任务", "适合复盘，整理文档与流程", "忌冲动决策，多听少说", "贵人运旺，多与前辈交流", "效率低谷，适合处理琐事", "灵感爆发，适合头脑风暴"];
  const loveTips = ["宜主动示好，打破僵局", "保持距离，享受独处", "忌翻旧账，通过礼物表达", "桃花运旺，留意职场新人", "适合约会，去安静的地方", "情绪敏感，避免争论"];
  const tarotCards = [
    { name: "愚人", keyword: "新的开始" }, { name: "魔术师", keyword: "创造力" }, { name: "女祭司", keyword: "直觉" }, 
    { name: "皇后", keyword: "丰收" }, { name: "皇帝", keyword: "秩序" }, { name: "教皇", keyword: "指引" }, 
    { name: "恋人", keyword: "选择" }, { name: "战车", keyword: "意志" }, { name: "力量", keyword: "勇气" }, 
    { name: "隐士", keyword: "内省" }, { name: "命运之轮", keyword: "转机" }, { name: "正义", keyword: "平衡" }, 
    { name: "倒吊人", keyword: "换位思考" }, { name: "死神", keyword: "重生" }, { name: "节制", keyword: "调和" }, 
    { name: "恶魔", keyword: "诱惑" }, { name: "塔", keyword: "突变" }, { name: "星星", keyword: "希望" }, 
    { name: "月亮", keyword: "不安" }, { name: "太阳", keyword: "成功" }, { name: "审判", keyword: "觉醒" }, { name: "世界", keyword: "圆满" }
  ];

  const absHash = Math.abs(hash);
  return {
    level: levels[absHash % levels.length],
    quote: quotes[absHash % quotes.length],
    activity: activities[absHash % activities.length],
    gods: gods[absHash % gods.length],
    stars: {
      career: (absHash % 3) + 3, // 3-5 stars
      wealth: ((absHash >> 2) % 3) + 3,
      love: ((absHash >> 4) % 3) + 3,
    },
    lucky: {
      color: colors[absHash % colors.length],
      number: (absHash % 9) + 1,
      workTip: workTips[absHash % workTips.length],
      loveTip: loveTips[absHash % loveTips.length],
      tarot: tarotCards[absHash % tarotCards.length],
    }
  };
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
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState<string>("");
  const [smsCode, setSmsCode] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [registering, setRegistering] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
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
  const canSendCode = phone.trim().length === 11 && !sendingCode;
  const canRegister =
    phone.trim().length === 11 &&
    smsCode.trim().length === 6 &&
    registerPassword.trim().length >= 6 &&
    registerPassword === confirmPassword &&
    !registering;
  const loginBlockedReason =
    phone.trim().length !== 11
      ? "请输入11位手机号"
      : loginPassword.trim().length < 6
        ? "密码至少6位"
          : "";
  const canLogin = loginBlockedReason.length === 0 && !loggingIn;
  const intent = useMemo(() => detectIntent(question), [question]);
  const canNextStep1 = profileReady;
  const canNextStep2 = currentTime.length > 0;
  const completeCount = [profileReady, canNextStep2, modeReady].filter(Boolean).length;
  const completionRate = Math.round((completeCount / 3) * 100);
  const activeStepCopy = STEP_CONFIG.find((item) => item.step === step);
  const modeLabel = {
    event: "具体事件",
    natal: "整体命盘",
    forecast: "阶段推进",
    relationship: "关系适配",
    travel: "出行规划",
    fengshui_space: "空间风水",
  }[analysisMode];

  const activeExperts = useMemo(() => {
    const experts: Array<{ id: string; name: string; icon: string; specialty: string }> = [];
    if (paradigm === "bazi" || angles.includes("八字")) {
      experts.push({ id: "bazi", name: "子平真人", icon: "☯️", specialty: "格局旺衰" });
    }
    if (paradigm === "liuyao") {
      experts.push({ id: "liuyao", name: "野鹤老人", icon: "🐢", specialty: "六爻应期" });
    }
    if (paradigm === "meihua") {
      experts.push({ id: "meihua", name: "邵康节", icon: "🌸", specialty: "体用断事" });
    }
    if (paradigm === "qimen") {
      experts.push({ id: "qimen", name: "诸葛武侯", icon: "🧭", specialty: "奇门筹策" });
    }
    if (paradigm === "fengshui") {
      experts.push({ id: "fengshui", name: "郭璞先师", icon: "⛰️", specialty: "堪舆场域" });
    }
    if (paradigm === "zodiac" || angles.includes("星座")) {
      experts.push({ id: "zodiac", name: "星宫祭司", icon: "🪐", specialty: "西洋占星" });
    }
    if (paradigm === "tarot" || angles.includes("塔罗")) {
      experts.push({ id: "tarot", name: "命运之手", icon: "🃏", specialty: "塔罗心象" });
    }
    if (paradigm === "composite") {
      experts.push({ id: "arbiter", name: "归一仲裁", icon: "⚖️", specialty: "冲突消解" });
    }
    return experts;
  }, [paradigm, angles]);

  const dailyFortune = useMemo(() => {
    const seed = new Date().toDateString() + (auth.authenticated && auth.user ? auth.user.phone : "guest");
    return getDailyFortune(seed);
  }, [auth]);

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

  async function onSendCode() {
    setAuthMessage("");
    setSendingCode(true);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as SendCodeResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "发送失败");
      }
      const message = data.devCode
        ? `验证码已发送（开发环境验证码：${data.devCode}）`
        : "验证码已发送，请查收短信";
      setAuthMessage(message);
    } catch (sendError) {
      setAuthMessage(sendError instanceof Error ? sendError.message : "发送失败");
    } finally {
      setSendingCode(false);
    }
  }

  function switchAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthMessage("");
    setSmsCode("");
    setRegisterPassword("");
    setConfirmPassword("");
    setLoginPassword("");
  }

  async function onRegister() {
    setAuthMessage("");
    setRegistering(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode, password: registerPassword }),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "注册失败");
      }
      setAuth({ authenticated: true, user: data.user });
      if (data.user.profile) {
        applyProfile(data.user.profile);
        setProfileStatus("已加载登录档案");
      }
      setSmsCode("");
      setRegisterPassword("");
      setConfirmPassword("");
      setAuthMessage("注册成功，已自动登录");
    } catch (verifyError) {
      setAuthMessage(verifyError instanceof Error ? verifyError.message : "注册失败");
    } finally {
      setRegistering(false);
    }
  }

  async function onLogin() {
    setAuthMessage("");
    setLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: loginPassword }),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "登录失败");
      }
      setAuth({ authenticated: true, user: data.user });
      if (data.user.profile) {
        applyProfile(data.user.profile);
        setProfileStatus("已加载登录档案");
      }
      setLoginPassword("");
      setAuthMessage("登录成功");
    } catch (loginError) {
      setAuthMessage(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoggingIn(false);
    }
  }

  async function onLogout() {
    setAuthMessage("");
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth({ authenticated: false });
  }

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

  async function onSubmit(event: React.FormEvent<HTMLFormElement>) {
    event.preventDefault();
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
      const response = await fetch("/api/inference", {
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

      const data = (await response.json()) as InferenceResponse | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "推演失败");
      }

      setResult(data);
      setReportView("overview");
      const parsed = parseResultSections(data.result);
      localStorage.setItem(LAST_REPORT_KEY, parsed.overview);
      setLastReportSummary(parsed.overview);

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
    <main className="min-h-screen bg-(--color-xuanqing) text-(--color-xuanpaper) px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {viewMode === "daily" ? (
          <Card glow className="border-(--color-gold-line) bg-[radial-gradient(circle_at_top_right,rgba(168,132,59,0.18),rgba(23,29,36,0.92)_45%)]">
            <CardHeader className="pr-32">
              <div>
                <p className="text-xs tracking-[0.24em] text-xuanpaper/55">DAILY HUB</p>
                <h1 className="text-3xl font-song text-(--color-gold-light)">今日运势 · {name || (auth.authenticated ? auth.user.phone.slice(-4) : "道友")}</h1>
              </div>
            </CardHeader>
            <Button variant="outline" onClick={() => setViewMode("deduction")} className="absolute top-6 right-6">
              发起新推演
            </Button>
            <CardContent className="space-y-6">
              <div className="grid gap-4 md:grid-cols-2">
                <div className="p-5 bg-black/20 rounded-xl border border-gold-line/20 flex flex-col items-center justify-center text-center space-y-2 relative overflow-hidden group hover:border-gold-line/40 transition-colors">
                  <div className="absolute inset-0 bg-gradient-to-br from-gold-glow/5 to-transparent pointer-events-none" />
                  <p className="text-xuanpaper/60 text-xs tracking-widest uppercase">Today&apos;s Energy</p>
                  <p className="text-5xl font-song text-(--color-gold-light) drop-shadow-md group-hover:scale-105 transition-transform duration-500">{dailyFortune.level}</p>
                  <p className="text-sm text-xuanpaper/80 italic font-kai">“{dailyFortune.quote}”</p>
                </div>
                <div className="p-5 bg-black/20 rounded-xl border border-gold-line/20 space-y-4 flex flex-col justify-center">
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 text-green-400/90 font-bold bg-green-900/30 px-2 py-1 rounded text-xs tracking-widest border border-green-500/20">宜 · GOOD</span>
                    <span className="text-sm text-xuanpaper/90 truncate">{dailyFortune.activity.good}</span>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="shrink-0 text-red-400/90 font-bold bg-red-900/30 px-2 py-1 rounded text-xs tracking-widest border border-red-500/20">忌 · BAD</span>
                    <span className="text-sm text-xuanpaper/90 truncate">{dailyFortune.activity.bad}</span>
                  </div>
                  <div className="h-px bg-white/5 w-full my-1" />
                  <div className="flex justify-between text-xs text-xuanpaper/50">
                    <span>财神：{dailyFortune.gods.wealth}</span>
                    <span>喜神：{dailyFortune.gods.joy}</span>
                    <span>贵人：{dailyFortune.gods.noble}</span>
                  </div>
                </div>
              </div>

              <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help" title="今日幸运色与数字">
                  <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest">LUCKY</p>
                  <div className="flex items-center gap-2">
                    <div 
                      className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20" 
                      style={{ 
                        backgroundColor: {
                          "赤红": "#ef4444", "玄黑": "#1f2937", "月白": "#e5e7eb", "松绿": "#10b981", 
                          "琥珀": "#d97706", "群青": "#3b82f6", "黛蓝": "#1e3a8a", "金褐": "#854d0e"
                        }[dailyFortune.lucky.color] || "#888" 
                      }} 
                    />
                    <span className="text-sm font-medium text-xuanpaper/90">{dailyFortune.lucky.color}</span>
                  </div>
                  <span className="text-xs text-gold-line font-mono">NO.{dailyFortune.lucky.number}</span>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help" title="今日塔罗启示">
                  <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest">TAROT</p>
                  <span className="text-lg">🃏</span>
                  <div className="text-center">
                    <p className="text-xs font-bold text-xuanpaper/90">{dailyFortune.lucky.tarot.name}</p>
                    <p className="text-[10px] text-xuanpaper/50">{dailyFortune.lucky.tarot.keyword}</p>
                  </div>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col justify-center gap-1 hover:bg-white/10 transition-colors col-span-1">
                  <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest flex items-center gap-1">
                    <span>💼</span> WORK
                  </p>
                  <p className="text-xs text-xuanpaper/80 leading-relaxed line-clamp-2" title={dailyFortune.lucky.workTip}>{dailyFortune.lucky.workTip}</p>
                </div>

                <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col justify-center gap-1 hover:bg-white/10 transition-colors col-span-1">
                  <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest flex items-center gap-1">
                    <span>❤️</span> LOVE
                  </p>
                  <p className="text-xs text-xuanpaper/80 leading-relaxed line-clamp-2" title={dailyFortune.lucky.loveTip}>{dailyFortune.lucky.loveTip}</p>
                </div>
              </div>

              <div className="grid gap-3 md:grid-cols-3">
                <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
                  <p className="text-xs text-xuanpaper/50">事业指数</p>
                  <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
                    {"★".repeat(dailyFortune.stars.career) + "☆".repeat(5 - dailyFortune.stars.career)}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
                  <p className="text-xs text-xuanpaper/50">财运指数</p>
                  <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
                    {"★".repeat(dailyFortune.stars.wealth) + "☆".repeat(5 - dailyFortune.stars.wealth)}
                  </div>
                </div>
                <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
                  <p className="text-xs text-xuanpaper/50">感情指数</p>
                  <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
                    {"★".repeat(dailyFortune.stars.love) + "☆".repeat(5 - dailyFortune.stars.love)}
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        ) : (
          <>
            <Card glow className="border-(--color-gold-line) bg-[radial-gradient(circle_at_top_right,rgba(168,132,59,0.18),rgba(23,29,36,0.92)_45%)]">
          <CardContent className="space-y-5">
            <div className="flex flex-wrap items-center justify-between gap-3">
              <div className="space-y-2">
                <p className="text-xs tracking-[0.24em] text-xuanpaper/55">YISHU EXPERT TEAM</p>
                <h1 className="text-3xl md:text-4xl font-song text-(--color-gold-light)">命盘推演中枢</h1>
                <p className="text-sm md:text-base text-xuanpaper/80">支持事件、整体命盘、阶段推进三种模式</p>
              </div>
              <div className="min-w-44 rounded-xl border border-gold-line/40 bg-(--color-xuangray)/70 px-4 py-3">
                <p className="text-xs text-xuanpaper/60">完成度</p>
                <p className="mt-1 text-2xl font-song text-(--color-gold-light)">{completionRate}%</p>
              </div>
            </div>
            <div className="h-2 rounded-full bg-black/30">
              <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-gold-dark),var(--color-gold-light))]" style={{ width: `${completionRate}%` }} />
            </div>
            <div className="grid gap-2 md:grid-cols-4">
              <div className="rounded-xl border border-gold-line/35 bg-(--color-xuangray)/60 px-3 py-2 text-sm">
                当前阶段：{step}/3
              </div>
              <div className="rounded-xl border border-gold-line/35 bg-(--color-xuangray)/60 px-3 py-2 text-sm">
                推演模式：{modeLabel}
              </div>
              <div className="rounded-xl border border-gold-line/35 bg-(--color-xuangray)/60 px-3 py-2 text-sm">
                目标范式：{PARADIGMS.find((item) => item.id === paradigm)?.label ?? "未选择"}
              </div>
              <div className="rounded-xl border border-gold-line/35 bg-(--color-xuangray)/60 px-3 py-2 text-sm">
                活跃专家：{activeExperts.length}位
              </div>
            </div>

            {activeExperts.length > 0 && (
              <div className="flex flex-wrap gap-3 pt-2">
                {activeExperts.map((expert) => (
                  <div
                    key={expert.id}
                    className="flex items-center gap-2 rounded-full border border-gold-line/25 bg-white/5 px-3 py-1.5 transition-all hover:border-gold-line/50"
                  >
                    <span className="text-lg">{expert.icon}</span>
                    <div className="flex flex-col">
                      <span className="text-xs font-bold text-(--color-gold-light)">{expert.name}</span>
                      <span className="text-[10px] text-xuanpaper/50">{expert.specialty}</span>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </CardContent>
        </Card>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-song text-(--color-gold-light)">三步问询</h2>
          </CardHeader>
          <CardContent>
            <div className="grid gap-3 md:grid-cols-3">
              {STEP_CONFIG.map((item) => (
                <button
                  key={item.step}
                  type="button"
                  onClick={() => moveStep(item.step)}
                  className={`rounded-xl border p-3 text-left transition-all ${
                    step === item.step
                      ? "border-(--color-gold-light) bg-(--color-gold-glow)/10 text-(--color-gold-light) shadow-[0_8px_20px_rgba(168,132,59,0.15)]"
                      : "border-gold-line/40 text-xuanpaper/75 hover:border-(--color-gold-light)/70"
                  }`}
                >
                  <p className="text-xs tracking-[0.14em] text-xuanpaper/55">STEP {item.step}</p>
                  <p className="mt-1 font-song">{item.title}</p>
                  <p className="mt-1 text-xs leading-6 text-xuanpaper/65">{item.summary}</p>
                  <p className="mt-2 text-xs">{step === item.step ? "进行中" : step > item.step ? "已完成" : "待填写"}</p>
                </button>
              ))}
            </div>
            <p className="mt-3 text-sm text-xuanpaper/70">{activeStepCopy?.summary}</p>
          </CardContent>
        </Card>

        <Card glow>
          <CardHeader>
            <h2 className="text-lg font-song text-(--color-gold-light)">推演输入</h2>
          </CardHeader>
          <CardContent>
            <form className="space-y-4" onSubmit={onSubmit}>
              {step === 1 ? (
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">术数范式</span>
                    <select
                      value={paradigm}
                      onChange={(event) => setParadigm(event.target.value)}
                      className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                    >
                      {PARADIGMS.map((item) => (
                        <option key={item.id} value={item.id}>
                          {item.label}
                        </option>
                      ))}
                    </select>
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">推演模式</span>
                    <select
                      value={analysisMode}
                      onChange={(event) => setAnalysisMode(event.target.value as AnalysisMode)}
                      className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                    >
                      <option value="event">具体事件</option>
                      <option value="natal">整体命盘</option>
                      <option value="forecast">阶段推进</option>
                      <option value="relationship">关系适配</option>
                      <option value="travel">出行规划</option>
                      <option value="fengshui_space">空间风水</option>
                    </select>
                  </label>
                  {analysisMode === "forecast" ? (
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">推进窗口</span>
                      <select
                        value={forecastWindow}
                        onChange={(event) => setForecastWindow(event.target.value as ForecastWindow)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      >
                        <option value="3m">最近三个月</option>
                        <option value="1y">最近一年</option>
                      </select>
                    </label>
                  ) : null}
                  <div className="space-y-2">
                    <p className="text-sm text-xuanpaper/80">会诊视角</p>
                    <div className="flex flex-wrap gap-2">
                      {ANGLE_OPTIONS.map((item) => {
                        const active = angles.includes(item);
                        return (
                          <Button
                            key={item}
                            type="button"
                            size="sm"
                            variant={active ? "primary" : "outline"}
                            onClick={() =>
                              setAngles((prev) =>
                                prev.includes(item) ? (prev.length === 1 ? prev : prev.filter((value) => value !== item)) : [...prev, item],
                              )
                            }
                          >
                            {item}
                          </Button>
                        );
                      })}
                    </div>
                  </div>

                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">姓名</span>
                      <input
                        type="text"
                        value={name}
                        onChange={(event) => setName(event.target.value)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                        placeholder="输入姓名"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">性别</span>
                      <select
                        value={gender}
                        onChange={(event) => setGender(event.target.value as "男" | "女")}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      >
                        <option value="男">男</option>
                        <option value="女">女</option>
                      </select>
                    </label>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">出生日期</span>
                      <input
                        type="date"
                        value={birthDate}
                        onChange={(event) => setBirthDate(event.target.value)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">出生时刻</span>
                      <input
                        type="time"
                        value={birthTime}
                        onChange={(event) => setBirthTime(event.target.value)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">出生地</span>
                    <input
                      type="text"
                      value={birthLocation}
                      onChange={(event) => setBirthLocation(event.target.value)}
                      className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder="例如：浙江杭州"
                    />
                  </label>
                  <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/60 p-3 space-y-1">
                    <p className="text-sm text-(--color-gold-light)">扩展信息（可选）</p>
                    <p className="text-xs text-xuanpaper/70">建议补全居住轨迹、经历、现状与愿景，可显著提升推演上下文质量。</p>
                  </div>
                  <div className="grid gap-3 md:grid-cols-2">
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">现居住地（可选）</span>
                      <input
                        type="text"
                        value={currentResidence}
                        onChange={(event) => setCurrentResidence(event.target.value)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                        placeholder="例如：上海"
                      />
                    </label>
                    <label className="block space-y-2">
                      <span className="text-sm text-xuanpaper/80">过往居住地（可选）</span>
                      <input
                        type="text"
                        value={pastResidences}
                        onChange={(event) => setPastResidences(event.target.value)}
                        className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                        placeholder="例如：河南鹿邑、新乡、天津、深圳"
                      />
                    </label>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">过往经历叙述（可选）</span>
                    <textarea
                      value={experienceNarrative}
                      onChange={(event) => setExperienceNarrative(event.target.value)}
                      className="w-full min-h-36 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder={EXPERIENCE_TEMPLATE}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">现状描述（可选）</span>
                    <textarea
                      value={currentStatus}
                      onChange={(event) => setCurrentStatus(event.target.value)}
                      className="w-full min-h-28 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder={STATUS_TEMPLATE}
                    />
                  </label>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">未来愿景（可选）</span>
                    <textarea
                      value={futureVision}
                      onChange={(event) => setFutureVision(event.target.value)}
                      className="w-full min-h-28 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder={VISION_TEMPLATE}
                    />
                  </label>
                  <p className="text-sm text-xuanpaper/70">个人底盘完整度：{profileReady ? "已完成" : "未完成"}</p>
                  {auth.authenticated ? (
                    <div className="flex flex-wrap gap-2">
                      <Button type="button" variant="outline" onClick={onSaveProfile} disabled={savingProfile || !profileReady}>
                        {savingProfile ? "保存中..." : "保存到我的档案"}
                      </Button>
                      {profileStatus ? <p className="text-sm text-(--color-gold-light)">{profileStatus}</p> : null}
                    </div>
                  ) : null}
                </div>
              ) : null}

              {step === 2 ? (
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">起局时间</span>
                    <input
                      type="datetime-local"
                      value={currentTime}
                      onChange={(event) => setCurrentTime(event.target.value)}
                      className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                    />
                  </label>
                  <div className="flex gap-2">
                    <Button
                      type="button"
                      variant="outline"
                      onClick={() => setCurrentTime(toInputDateTime(new Date().toISOString()))}
                    >
                      使用当前时间
                    </Button>
                  </div>
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">地点（可选）</span>
                    <input
                      type="text"
                      value={location}
                      onChange={(event) => setLocation(event.target.value)}
                      className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder="例如：上海浦东新区"
                    />
                  </label>
                  <div className="flex flex-wrap gap-2">
                    {QUICK_LOCATIONS.map((city) => (
                      <Button key={city} type="button" variant="outline" size="sm" onClick={() => setLocation(city)}>
                        {city}
                      </Button>
                    ))}
                  </div>
                </div>
              ) : null}

              {step === 3 ? (
                <div className="space-y-4">
                  <label className="block space-y-2">
                    <span className="text-sm text-xuanpaper/80">问题描述</span>
                    <textarea
                      value={question}
                      onChange={(event) => setQuestion(event.target.value)}
                      className="w-full min-h-24 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      placeholder={
                        analysisMode === "event"
                          ? "例如：这周是否适合推进换岗谈判？"
                          : analysisMode === "natal"
                            ? "可选：例如我未来5年事业与关系的主线趋势是什么？"
                            : "可选：例如未来一年职业与财务的阶段节奏如何？"
                      }
                    />
                  </label>
                  {analysisMode === "event" ? (
                    <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">⚡️</span>
                        <h3 className="font-song text-(--color-gold-light)">事件参数设定</h3>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-sm text-xuanpaper/80">事件背景</span>
                        <textarea
                          value={eventBackground}
                          onChange={(event) => setEventBackground(event.target.value)}
                          className="w-full min-h-24 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                          placeholder="例如：我已与直属领导沟通一次，对方希望下月复盘再定岗。"
                        />
                      </label>
                      <div className="grid gap-3 md:grid-cols-2">
                        <label className="block space-y-2">
                          <span className="text-sm text-xuanpaper/80">紧迫度</span>
                          <select
                            value={urgency}
                            onChange={(event) => setUrgency(event.target.value)}
                            className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                          >
                            <option value="一般">一般（常规咨询）</option>
                            <option value="紧迫">紧迫（需尽快决策）</option>
                            <option value="极速">极速（火速研判）</option>
                          </select>
                        </label>
                        <label className="block space-y-2">
                          <span className="text-sm text-xuanpaper/80">关注周期</span>
                          <select
                            value={horizon}
                            onChange={(event) => setHorizon(event.target.value)}
                            className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                          >
                            <option value="7天内">7天内（短期爆发）</option>
                            <option value="30天内">30天内（月度运势）</option>
                            <option value="90天内">90天内（季度趋势）</option>
                          </select>
                        </label>
                      </div>
                      <label className="block space-y-2">
                        <span className="text-sm text-xuanpaper/80">当前心境</span>
                        <select
                          value={mood}
                          onChange={(event) => setMood(event.target.value)}
                          className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                        >
                          <option value="平稳">平稳</option>
                          <option value="焦虑">焦虑</option>
                          <option value="期待">期待</option>
                          <option value="迷茫">迷茫</option>
                          <option value="激动">激动</option>
                        </select>
                      </label>
                    </div>
                  ) : null}

                  {analysisMode === "relationship" ? (
                    <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">💕</span>
                        <h3 className="font-song text-(--color-gold-light)">关系对象信息</h3>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">对方姓名</span>
                            <input value={partnerName} onChange={(e) => setPartnerName(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" placeholder="对方姓名" />
                         </label>
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">对方性别</span>
                            <select value={partnerGender} onChange={(e) => setPartnerGender(e.target.value as "男"|"女")} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)">
                                <option value="男">男</option>
                                <option value="女">女</option>
                            </select>
                         </label>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">出生日期（可选）</span>
                            <input type="date" value={partnerBirthDate} onChange={(e) => setPartnerBirthDate(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" />
                         </label>
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">出生时间（可选）</span>
                            <input type="time" value={partnerBirthTime} onChange={(e) => setPartnerBirthTime(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" />
                         </label>
                      </div>
                    </div>
                  ) : null}

                  {analysisMode === "fengshui_space" ? (
                    <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">🏡</span>
                        <h3 className="font-song text-(--color-gold-light)">空间参数</h3>
                      </div>
                      <label className="block space-y-2">
                         <span className="text-sm text-xuanpaper/80">空间类型</span>
                         <select value={spaceType} onChange={(e) => setSpaceType(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)">
                            <option value="住宅">住宅</option>
                            <option value="办公室">办公室</option>
                            <option value="商铺">商铺</option>
                         </select>
                      </label>
                      <label className="block space-y-2">
                         <span className="text-sm text-xuanpaper/80">布局描述/朝向</span>
                         <textarea value={spaceLayout} onChange={(e) => setSpaceLayout(e.target.value)} className="w-full min-h-24 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" placeholder="例如：大门朝南，主卧在西北角，厨房在正东..." />
                      </label>
                    </div>
                  ) : null}

                  {analysisMode === "travel" ? (
                    <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
                      <div className="flex items-center gap-2 mb-2">
                        <span className="text-lg">✈️</span>
                        <h3 className="font-song text-(--color-gold-light)">出行计划</h3>
                      </div>
                      <div className="grid gap-3 md:grid-cols-2">
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">目的地</span>
                            <input value={travelDest} onChange={(e) => setTravelDest(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" />
                         </label>
                         <label className="block space-y-2">
                            <span className="text-sm text-xuanpaper/80">出发日期</span>
                            <input type="date" value={travelDate} onChange={(e) => setTravelDate(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" />
                         </label>
                      </div>
                      <label className="block space-y-2">
                         <span className="text-sm text-xuanpaper/80">同行人员（可选）</span>
                         <input value={travelPeers} onChange={(e) => setTravelPeers(e.target.value)} className="w-full min-h-11 rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)" placeholder="例如：配偶、父母、同事..." />
                      </label>
                    </div>
                  ) : null}
                  <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-3">
                    <p className="text-sm text-xuanpaper/70">将提交的结构化上下文：</p>
                    <p className="text-sm mt-1 text-(--color-gold-light)">
                      {name || "未填姓名"} / {modeLabel} / {angles.join("、")}
                      {analysisMode === "forecast" ? ` / ${forecastWindow === "3m" ? "最近三个月" : "最近一年"}` : null}
                      {analysisMode === "event" ? ` / ${urgency} / ${horizon} / ${mood}` : null}
                    </p>
                  </div>
                </div>
              ) : null}

              <div className="flex gap-3">
                <Button type="button" variant="outline" className="flex-1" disabled={step === 1} onClick={() => moveStep((step - 1) as Step)}>
                  上一步
                </Button>
                {step < 3 ? (
                  <Button
                    type="button"
                    variant="primary"
                    className="flex-1"
                    disabled={(step === 1 && !canNextStep1) || (step === 2 && !canNextStep2)}
                    onClick={() => moveStep((step + 1) as Step)}
                  >
                    下一步
                  </Button>
                ) : (
                  <Button variant="primary" size="lg" className="flex-1" disabled={!canSubmit}>
                    {loading ? "推演中..." : "开始推演"}
                  </Button>
                )}
              </div>
            </form>
          </CardContent>
        </Card>

        <Card className="border-gold-line/40 bg-(--color-xuangray)/70">
          <CardHeader>
            <h2 className="text-lg font-song text-(--color-gold-light)">实时推演预览</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <div className="grid gap-2 md:grid-cols-2">
              <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                <p className="text-xs text-xuanpaper/60">个人底盘</p>
                <p className="mt-1 text-sm text-(--color-gold-light)">{profileReady ? `${name} · ${gender}` : "待补全"}</p>
              </div>
              <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                <p className="text-xs text-xuanpaper/60">时空锚点</p>
                <p className="mt-1 text-sm text-(--color-gold-light)">{currentTime ? "已设置" : "未设置"} / {location || "未填地点"}</p>
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
            <h2 className="text-lg font-song text-(--color-gold-light)">账号状态</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {authLoading ? <p className="text-sm text-xuanpaper/70">状态加载中...</p> : null}
            {!authLoading && !auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">当前为游客态：可推演，登录后可保存历史记录并启用试用权益。</p>
                <div className="flex gap-2">
                  <Button
                    variant={authMode === "login" ? "primary" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => switchAuthMode("login")}
                  >
                    密码登录
                  </Button>
                  <Button
                    variant={authMode === "register" ? "primary" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => switchAuthMode("register")}
                  >
                    注册账号
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.trim())}
                    placeholder="输入手机号"
                    className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                  />
                  {authMode === "login" ? (
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="登录密码"
                      className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={smsCode}
                        onChange={(event) => setSmsCode(event.target.value.trim())}
                        placeholder="短信验证码"
                        className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                      <Button variant="outline" onClick={onSendCode} disabled={!canSendCode}>
                        {sendingCode ? "发送中" : "发码"}
                      </Button>
                    </div>
                  )}
                </div>
                {authMode === "register" ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(event) => setRegisterPassword(event.target.value)}
                        placeholder="设置登录密码（6-64位）"
                        className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="确认登录密码"
                        className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                    </div>
                    <p className="text-xs text-xuanpaper/60">开发期短信验证码为占位验证，线上可接真实短信网关。</p>
                    <Button variant="primary" onClick={onRegister} disabled={!canRegister}>
                      {registering ? "注册中..." : "注册并登录"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" onClick={onLogin} disabled={!canLogin}>
                      {loggingIn ? "登录中..." : "手机号密码登录"}
                    </Button>
                    {loginBlockedReason ? <p className="text-xs text-xuanpaper/60">{loginBlockedReason}</p> : null}
                  </>
                )}
              </>
            ) : null}
            {!authLoading && auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">手机号：{auth.user.phone}</p>
                <p className="text-sm text-xuanpaper/70">
                  权限：{auth.user.membership === "trial" ? "试用中" : null}
                  {auth.user.membership === "subscriber" ? "订阅中" : null}
                  {auth.user.membership === "expired" ? "试用已结束" : null}
                </p>
                <p className="text-sm text-xuanpaper/70">
                  试用截止：{auth.user.trialEndsAt ? new Date(auth.user.trialEndsAt).toLocaleDateString("zh-CN") : "未设置"}
                </p>
                <div className="flex gap-2 pt-2">
                  <Button variant="primary" size="sm" onClick={() => router.push("/account")}>
                    个人中心
                  </Button>
                  <Button variant="outline" size="sm" onClick={onLogout}>
                    退出登录
                  </Button>
                </div>
              </>
            ) : null}
            {authMessage ? <p className="text-sm text-(--color-gold-light)">{authMessage}</p> : null}
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
              <h2 className="text-lg font-song text-(--color-gold-light)">推演结果</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex flex-wrap gap-2">
                <Button type="button" size="sm" variant={reportView === "overview" ? "primary" : "outline"} onClick={() => setReportView("overview")}>
                  总览
                </Button>
                <Button type="button" size="sm" variant={reportView === "evidence" ? "primary" : "outline"} onClick={() => setReportView("evidence")}>
                  证据
                </Button>
                <Button type="button" size="sm" variant={reportView === "action" ? "primary" : "outline"} onClick={() => setReportView("action")}>
                  建议
                </Button>
                <Button type="button" size="sm" variant={reportView === "risk" ? "primary" : "outline"} onClick={() => setReportView("risk")}>
                  风险
                </Button>
                <Button type="button" size="sm" variant={reportView === "full" ? "primary" : "outline"} onClick={() => setReportView("full")}>
                  全文
                </Button>
              </div>
              <p className="text-sm text-xuanpaper/70">范式：{result.meta.paradigmLabel}</p>
              <p className="text-sm text-xuanpaper/70">
                模式：
                {result.meta.analysisMode === "event"
                  ? "具体事件"
                  : result.meta.analysisMode === "natal"
                    ? "整体命盘"
                    : result.meta.analysisMode === "forecast"
                      ? "阶段推进"
                      : "未标注"}
              </p>
              <p className="text-sm text-xuanpaper/70">视角：{(result.meta.angles ?? angles).join("、")}</p>
              {result.meta.forecastWindow ? (
                <p className="text-sm text-xuanpaper/70">窗口：{result.meta.forecastWindow === "3m" ? "最近三个月" : "最近一年"}</p>
              ) : null}
              <p className="text-sm text-xuanpaper/70">模型：{result.meta.model}</p>
              <p className="text-sm text-xuanpaper/70">参考实现：{result.meta.reference}</p>
              <p className="text-sm text-xuanpaper/70">
                保存状态：
                {saveStatus === "saving" ? "保存中" : null}
                {saveStatus === "saved" ? "已保存至案例库" : null}
                {saveStatus === "error" ? "保存失败" : null}
                {saveStatus === "idle" ? "未保存" : null}
                {saveStatus === "guest" ? "游客态不保存，登录后可沉淀历史记录" : null}
                {saveStatus === "expired" ? "试用已结束，续费后可新增记录" : null}
              </p>
              {result.meta.lunarContext ? (
                <p className="text-sm text-xuanpaper/70">
                  历法：{result.meta.lunarContext.solarDate} / {result.meta.lunarContext.lunarDate} / {result.meta.lunarContext.ganzhi}
                </p>
              ) : null}
              {result.meta.citations.length > 0 ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                  <h3 className="font-song text-(--color-gold-light)">古籍引证</h3>
                  {result.meta.citations.map((item) => (
                    <p key={`${item.title}-${item.chapter}`} className="text-sm leading-7 text-xuanpaper/80">
                      《{item.title}》{item.chapter}：{item.quote}
                    </p>
                  ))}
                </div>
              ) : null}
              {result.meta.foundations && result.meta.foundations.length > 0 ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                  <h3 className="font-song text-(--color-gold-light)">开源能力底座</h3>
                  {result.meta.foundations.map((item) => (
                    <p key={item.id} className="text-sm leading-7 text-xuanpaper/80">
                      {item.name} · {item.purpose} · {item.integration === "direct" ? "直接集成" : "参考转译"} · 置信{item.confidence}
                    </p>
                  ))}
                </div>
              ) : null}
              {result.meta.aiEnhancements && result.meta.aiEnhancements.length > 0 ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                  <h3 className="font-song text-(--color-gold-light)">AI增强能力</h3>
                  <p className="text-sm leading-7 text-xuanpaper/80">{result.meta.aiEnhancements.join("、")}</p>
                </div>
              ) : null}

              {(reportView === "overview" || reportView === "full") && sections?.overview ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                  <h3 className="font-song text-(--color-gold-light)">总览结论</h3>
                  <p className="leading-8 whitespace-pre-wrap mt-2">{sections.overview}</p>
                </div>
              ) : null}

              {(reportView === "evidence" || reportView === "full") && sections?.evidence ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                  <h3 className="font-song text-(--color-gold-light)">证据链</h3>
                  <p className="leading-8 whitespace-pre-wrap mt-2">{sections.evidence}</p>
                </div>
              ) : null}

              {(reportView === "action" || reportView === "full") && sections?.action ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                  <h3 className="font-song text-(--color-gold-light)">行动建议</h3>
                  <p className="leading-8 whitespace-pre-wrap mt-2">{sections.action}</p>
                </div>
              ) : null}

              {(reportView === "risk" || reportView === "full") && sections?.risk ? (
                <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                  <h3 className="font-song text-(--color-gold-light)">风险提示</h3>
                  <p className="leading-8 whitespace-pre-wrap mt-2">{sections.risk}</p>
                </div>
              ) : null}

              <div className="flex flex-wrap gap-2">
                <Button type="button" variant="outline" onClick={copyReport}>
                  复制报告
                </Button>
                <Button type="button" variant="outline" onClick={downloadReport}>
                  下载TXT
                </Button>
              </div>
              <div className="pt-4 border-t border-gold-line/20">
                <p className="text-sm text-xuanpaper/70 mb-2">本次推演准吗？</p>
                <div className="flex gap-2">
                  {[1, 2, 3, 4, 5].map((score) => (
                    <button
                      key={score}
                      type="button"
                      onClick={() => setFeedbackScore(score)}
                      className={`w-8 h-8 rounded-full border transition-all ${
                        feedbackScore >= score
                          ? "bg-(--color-gold-light) text-black border-(--color-gold-light)"
                          : "border-gold-line/40 text-xuanpaper/60 hover:border-gold-line"
                      }`}
                    >
                      {score}
                    </button>
                  ))}
                </div>
                {feedbackScore > 0 && <p className="text-xs text-(--color-gold-light) mt-2">感谢反馈！已记录。</p>}
              </div>
              {copyStatus ? <p className="text-sm text-(--color-gold-light)">{copyStatus}</p> : null}
            </CardContent>
          </Card>
        ) : null}

        {!result && lastReportSummary ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-song text-(--color-gold-light)">上次推演摘要（本地缓存）</h2>
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
    <Suspense fallback={<div className="min-h-screen bg-(--color-xuanqing) text-xuanpaper/50 flex items-center justify-center">Loading...</div>}>
      <StartPageContent />
    </Suspense>
  );
}
