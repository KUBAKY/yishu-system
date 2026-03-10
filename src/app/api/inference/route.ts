import { NextRequest, NextResponse } from "next/server";
import { Solar } from "lunar-javascript";
import { retrieveClassicalCitations } from "@/lib/classical-references";

type InferencePayload = {
  paradigm?: string;
  analysisMode?: "event" | "natal" | "forecast";
  forecastWindow?: "3m" | "1y";
  angles?: string[];
  question?: string;
  currentTime?: string;
  location?: string;
  profile?: {
    name?: string;
    gender?: string;
    birthDate?: string;
    birthTime?: string;
    birthLocation?: string;
    currentResidence?: string;
    pastResidences?: string;
    experienceNarrative?: string;
    currentStatus?: string;
    futureVision?: string;
  };
  eventContext?: {
    background?: string;
    urgency?: string;
    horizon?: string;
    mood?: string;
  };
  attachments?: Array<{
    name?: string;
    type?: string;
    dataUrl?: string;
    note?: string;
    category?: string;
  }>;
};

type ParadigmSpec = {
  label: string;
  reasoningFrame: string;
  reference: string;
};

type OpenRouterChoice = {
  message?: {
    content?: string | Array<{ type?: string; text?: string; image_url?: { url: string } }>;
  };
};

type OpenRouterResponse = {
  choices?: OpenRouterChoice[];
  model?: string;
  error?: {
    message?: string;
  };
};

type FoundationModule = {
  id: string;
  name: string;
  purpose: string;
  kind: "engine" | "data" | "workflow";
  license: string;
  integration: "direct" | "reference";
  confidence: number;
};

function hasInstitutionalStructure(text: string): boolean {
  const requiredHeadings = ["【总览结论】", "【证据链】", "【行动建议】", "【风险提示】"];
  const hasHeadings = requiredHeadings.every((item) => text.includes(item));
  const hasTable = /\|?\s*证据项\s*\|/.test(text) && /\|?\s*置信度/.test(text);
  const hasActionLayers = text.includes("90天") && text.includes("1年") && text.includes("3-10年");
  const hasRiskGroups = text.includes("财务") && text.includes("关系") && text.includes("健康") && text.includes("决策偏差");
  return hasHeadings && hasTable && hasActionLayers && hasRiskGroups;
}

function buildFoundationModules(paradigm: string, angles: string[]): FoundationModule[] {
  const modules: FoundationModule[] = [
    {
      id: "lunar-js",
      name: "6tail/lunar-javascript",
      purpose: "历法、干支与四柱统一计算",
      kind: "engine",
      license: "MIT",
      integration: "direct",
      confidence: 96,
    },
  ];

  if (paradigm === "zodiac" || paradigm === "composite" || angles.includes("星座")) {
    modules.push({
      id: "immanuel",
      name: "theriftlab/immanuel-python",
      purpose: "西方星盘宫位与相位高精度计算",
      kind: "engine",
      license: "MIT",
      integration: "reference",
      confidence: 84,
    });
  }

  if (paradigm === "tarot" || paradigm === "composite" || angles.includes("塔罗")) {
    modules.push({
      id: "tarot-api",
      name: "ekelen/tarot-api",
      purpose: "塔罗78牌语义与抽牌数据源",
      kind: "data",
      license: "MIT",
      integration: "reference",
      confidence: 90,
    });
  }

  if (paradigm === "liuyao") {
    modules.push({
      id: "mcp-liuyao",
      name: "NortonHuang-SUFE/MCP-Liuyao",
      purpose: "六爻工具协议与对话式起卦流程",
      kind: "workflow",
      license: "MIT",
      integration: "reference",
      confidence: 82,
    });
  }

  if (paradigm === "bazi" || paradigm === "composite") {
    modules.push({
      id: "lunar-mcp",
      name: "AngusHsu/lunar-mcp-server",
      purpose: "八字工具化编排与AI调用范式",
      kind: "workflow",
      license: "MIT",
      integration: "reference",
      confidence: 81,
    });
  }

  if (paradigm === "qimen") {
    modules.push({
      id: "qimen-ref",
      name: "Yvainovski/QiMenDunJia",
      purpose: "奇门算法步骤对照与边界校验",
      kind: "engine",
      license: "未明确",
      integration: "reference",
      confidence: 70,
    });
  }

  if (paradigm === "palmistry" || paradigm === "physiognomy") {
    modules.push({
      id: "vision-ocr",
      name: "multimodal-vision",
      purpose: "图像特征提取与标注理解",
      kind: "engine",
      license: "模型服务条款",
      integration: "direct",
      confidence: 78,
    });
  }

  return modules;
}

const PARADIGM_SPECS: Record<string, ParadigmSpec> = {
  bazi: {
    label: "八字命理",
    reasoningFrame: "以四柱、十神、旺衰与大运流年关系组织判断，强调阶段性变化。",
    reference: "6tail/lunar-javascript",
  },
  liuyao: {
    label: "六爻纳甲",
    reasoningFrame: "以世应、六亲、动爻与变爻构建证据链，关注应期与触发条件。",
    reference: "NortonHuang-SUFE/MCP-Liuyao",
  },
  meihua: {
    label: "梅花易数",
    reasoningFrame: "以体用、互卦、变卦关系分析事件主次，输出趋势与行动窗口。",
    reference: "自研主线（参考开源术数项目清单）",
  },
  qimen: {
    label: "奇门遁甲",
    reasoningFrame: "以时空九宫、门星神信息推断策略得失，给出先后手建议。",
    reference: "自研主线（参考 QiMenDunJia 算法思路）",
  },
  fengshui: {
    label: "堪舆风水",
    reasoningFrame: "以方位、动线与场域影响拆解问题，先给可执行微调动作。",
    reference: "自研主线（参考开源术数项目清单）",
  },
  zodiac: {
    label: "星座占星",
    reasoningFrame: "以太阳星座性格主线结合阶段情绪周期，输出关系、事业与习惯建议。",
    reference: "占星语义框架提示词",
  },
  tarot: {
    label: "塔罗推演",
    reasoningFrame: "以牌义组合、顺逆位语义与问题结构做情境解读，强调行动选择。",
    reference: "塔罗语义框架提示词",
  },
  palmistry: {
    label: "手相分析",
    reasoningFrame: "以掌纹主线、掌丘与手型结构进行趋势研判，强调行为修正。",
    reference: "图像+术数语义联合提示词",
  },
  physiognomy: {
    label: "面相分析",
    reasoningFrame: "以五官比例、气色与动态神态进行结构化解读，强调风险预警。",
    reference: "图像+术数语义联合提示词",
  },
  composite: {
    label: "综合会诊",
    reasoningFrame: "以八字主线融合星座与塔罗视角做交叉校验，强调一致结论与分歧提示。",
    reference: "多模型会诊提示词编排",
  },
};

type OpenRouterMessageContent =
  | string
  | Array<{ type?: string; text?: string; image_url?: { url: string } }>
  | undefined;

function normalizeResponseContent(content: OpenRouterMessageContent): string {
  if (typeof content === "string") {
    return content.trim();
  }

  if (Array.isArray(content)) {
    return content
      .map((item) => item.text ?? "")
      .join("")
      .trim();
  }

  return "";
}

function getParadigmSpec(paradigm: string): ParadigmSpec | null {
  return PARADIGM_SPECS[paradigm] ?? null;
}

function buildPrompt(params: {
  paradigm: string;
  analysisMode: "event" | "natal" | "forecast";
  forecastWindow: "3m" | "1y" | null;
  angles: string[];
  question: string;
  currentTime: string;
  location: string;
  profile: {
    name: string;
    gender: "男" | "女";
    birthDate: string;
    birthTime: string;
    birthLocation: string;
    currentResidence?: string;
    pastResidences?: string;
    experienceNarrative?: string;
    currentStatus?: string;
    futureVision?: string;
  };
  eventContext: {
    background: string;
    urgency: string;
    horizon: string;
    mood: string;
  };
  lunarContext: ReturnType<typeof buildLunarContext>;
  spec: ParadigmSpec;
  foundationModules: FoundationModule[];
  imageContext: Array<{
    name: string;
    note: string;
    category: string;
  }>;
}): string {
  const { paradigm, analysisMode, forecastWindow, angles, question, currentTime, location, profile, eventContext, lunarContext, spec, foundationModules, imageContext } = params;
  const paradigmDirectiveMap: Record<string, string[]> = {
    bazi: [
      "必须显式拆解：日主强弱、十神结构、喜忌取用、大运流年触发点。",
      "至少给出6个时间节点，注明机会、风险与可执行动作。",
    ],
    liuyao: [
      "必须显式拆解：世应、六亲、动爻与变爻，识别主客关系。",
      "必须给出应期判断及触发条件，并给反例情境。",
    ],
    meihua: [
      "必须显式拆解：体卦、用卦、互卦、变卦，区分主因与外因。",
      "必须给出短中期趋势转折点及行动窗口。",
    ],
    qimen: [
      "必须显式拆解：值符值使、门星神关系、宫位得失与时机先后。",
      "必须输出先手/后手策略，并给资源分配建议。",
    ],
    fengshui: [
      "必须显式拆解：方位、动线、采光、噪声、功能区冲突。",
      "必须给出可落地的空间整改清单，分为低成本和中成本两档。",
    ],
    zodiac: [
      "必须显式拆解：太阳/月亮/上升对行为模式的影响与冲突点。",
      "必须输出关系、事业、习惯三个面向的阶段行动计划。",
    ],
    tarot: [
      "必须显式拆解：牌阵位次、象征意义、心理投射与现实约束。",
      "必须给出可验证的下一步行动与撤退条件。",
    ],
    palmistry: [
      "必须显式拆解：生命线、智慧线、感情线、事业线及掌丘特征。",
      "必须给出图片可见证据与文字推断的边界说明。",
    ],
    physiognomy: [
      "必须显式拆解：额、眉、眼、鼻、口、下庭比例与气色特征。",
      "必须给出图片可见证据、风险信号与修正建议。",
    ],
  };
  const paradigmDirectives = paradigmDirectiveMap[paradigm] ?? [];
  const citations = retrieveClassicalCitations({
    paradigm: paradigm === "composite" ? "bazi" : paradigm,
    question,
    limit: 2,
  });
  const citationBlock =
    citations.length > 0
      ? citations.map((item) => `- ${item.title}《${item.chapter}》：${item.quote}`).join("\n")
      : "无";
  const methodBlock = [
    "1) 历法与排盘底座：6tail/lunar-javascript（阳历/农历/干支上下文）",
    "2) 古籍证据检索：classical-references（渊海子平、三命通会、子平真诠等片段）",
    "3) 多范式语义层：八字/星座/塔罗/综合会诊提示词框架",
    "4) 生成增强：大模型负责归纳、冲突消解与行动建议分层",
  ].join("\n");
  const foundationBlock =
    foundationModules.length > 0
      ? foundationModules
          .map(
            (item) =>
              `- ${item.name}｜${item.purpose}｜许可证:${item.license}｜接入:${item.integration === "direct" ? "直接集成" : "参考转译"}｜置信:${item.confidence}`,
          )
          .join("\n")
      : "- 无";
  const modeLabel = analysisMode === "event" ? "具体事件推演" : analysisMode === "natal" ? "整体命盘推演" : "阶段命盘推进";
  const forecastLabel = forecastWindow === "3m" ? "最近三个月" : forecastWindow === "1y" ? "最近一年" : "不适用";
  const angleLabel = angles.length > 0 ? angles.join("、") : "八字";
  const targetLength = analysisMode === "event" ? "900-1400字" : "1500-2600字";
  const modeGoal =
    analysisMode === "event"
      ? "围绕当前问题给出决策建议与风险边界。"
      : analysisMode === "natal"
        ? "输出用户整体命盘结构、长期优势短板与人生主线提醒。"
        : "输出所选时间窗口的阶段机会、风险主题与行动节奏。";
  const expertConsultationBlock =
    angles.length > 0
      ? [
          "【专家团会诊要求】",
          `请模拟以下领域的专家进行多维度会诊：${angleLabel}。`,
          "1. 若包含“八字”，请从格局旺衰与大运流年分析。",
          "2. 若包含“六爻”或“梅花”，请建立起卦模型（如模拟卦象）并分析动变。",
          "3. 若包含“塔罗”或“星座”，请引入心理原型与潜意识投射视角。",
          "4. 若包含“奇门”或“风水”，请引入时空方位策略。",
          "在输出中，请显式标记不同视角的独特见解（如“【八字视角】...”）。",
        ]
      : [];

  const eventBlock =
    analysisMode === "event"
      ? [`事件背景：${eventContext.background}`, `事件参数：紧迫度${eventContext.urgency}，关注周期${eventContext.horizon}，当前心境${eventContext.mood}`]
      : ["事件背景：本次为命盘级推演，不以单一事件为核心。", `阶段窗口：${forecastLabel}`];
  const profileContextBlock = [
    profile.currentResidence ? `现居住地：${profile.currentResidence}` : "",
    profile.pastResidences ? `过往居住地：${profile.pastResidences}` : "",
    profile.experienceNarrative ? `过往经历：${profile.experienceNarrative}` : "",
    profile.currentStatus ? `现状描述：${profile.currentStatus}` : "",
    profile.futureVision ? `未来愿景：${profile.futureVision}` : "",
  ].filter(Boolean);
  const imageContextBlock =
    imageContext.length > 0
      ? [
          "图片输入：",
          ...imageContext.map((item, index) => `- 图${index + 1}｜类别:${item.category}｜文件:${item.name}｜标注:${item.note || "无"}`),
          "要求：将图片信息与文字问题交叉验证，明确图片证据与推论边界。",
        ]
      : ["图片输入：无"];

  return [
    `术数范式：${paradigm}（${spec.label}）`,
    `推演模式：${modeLabel}`,
    `多角度会诊：${angleLabel}`,
    `模式目标：${modeGoal}`,
    `目标长度：${targetLength}`,
    `范式推演框架：${spec.reasoningFrame}`,
    ...(paradigmDirectives.length > 0 ? ["范式专项要求：", ...paradigmDirectives.map((item) => `- ${item}`)] : []),
    ...expertConsultationBlock,
    `问题：${question}`,
    `咨询者：${profile.name}（${profile.gender}）`,
    `出生生辰：${profile.birthDate} ${profile.birthTime}（请基于此准确时间排八字时柱），出生地：${profile.birthLocation}`,
    ...(profileContextBlock.length > 0 ? ["个人补充档案：", ...profileContextBlock] : []),
    ...imageContextBlock,
    ...eventBlock,
    `起局时间：${currentTime}`,
    `地点：${location || "未提供"}`,
    lunarContext
      ? `历法上下文：阳历${lunarContext.solarDate}，农历${lunarContext.lunarDate}，干支${lunarContext.ganzhi}`
      : "历法上下文：无有效时间，忽略历法推演",
    "方法与依据：",
    methodBlock,
    "开源能力底座：",
    foundationBlock,
    "输出必须使用以下四个标题并分别给出内容：",
    "【总览结论】",
    "- 必须包含：结构总评、阶段结论、一句总策略（先守/先攻）。",
    "- 必须包含：3条以上高置信判断，每条给出触发条件。",
    "【证据链】",
    "- 必须包含：命盘结构证据、时间线证据、跨范式交叉证据。",
    "- 必须输出一张Markdown表格，列为：证据项 | 来源(开源/古籍/模型) | 结论指向 | 置信度(0-100)。",
    "- 来源为“开源”时，优先引用上方“开源能力底座”中的模块名。",
    "- 必须给出关键年份/阶段清单，至少6条，格式“年份/区间：机会-风险-动作”。",
    "【行动建议】",
    "- 必须分三层：90天、1年、3-10年。",
    "- 每层至少3条动作，动作需可执行、可衡量、可复盘。",
    "- 必须给出“止损线”与“升级条件”。",
    "【风险提示】",
    "- 必须分：财务、关系、健康、决策偏差四类。",
    "- 每类至少2条风险，并给出监控信号与缓解动作。",
    "- 最后追加“反证条件”：哪些现实信号出现时，应下调本次判断。",
    "古籍参考：",
    citationBlock,
    "表达要求：",
    "- 使用机构化、审慎、非宿命论表达；",
    "- 结论要先证据后判断，避免空泛形容；",
    "- 在不确定处明确给出不确定性来源；",
    "- 保持中文输出，结构完整，标题不可缺失。",
  ].join("\n");
}

function buildLunarContext(currentTime: string) {
  const date = new Date(currentTime);
  if (Number.isNaN(date.getTime())) {
    return null;
  }

  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar();

  return {
    solarDate: `${solar.getYear()}-${String(solar.getMonth()).padStart(2, "0")}-${String(solar.getDay()).padStart(2, "0")}`,
    lunarDate: `${lunar.getMonthInChinese()}月${lunar.getDayInChinese()}`,
    ganzhi: `${lunar.getYearInGanZhi()}年 ${lunar.getMonthInGanZhi()}月 ${lunar.getDayInGanZhi()}日`,
  };
}

function validateProfile(profileInput: InferencePayload["profile"]) {
  const name = (profileInput?.name ?? "").trim();
  const gender = profileInput?.gender;
  const birthDate = (profileInput?.birthDate ?? "").trim();
  const birthTime = (profileInput?.birthTime ?? "").trim();
  const birthLocation = (profileInput?.birthLocation ?? "").trim();
  const currentResidence = (profileInput?.currentResidence ?? "").trim();
  const pastResidences = (profileInput?.pastResidences ?? "").trim();
  const experienceNarrative = (profileInput?.experienceNarrative ?? "").trim();
  const currentStatus = (profileInput?.currentStatus ?? "").trim();
  const futureVision = (profileInput?.futureVision ?? "").trim();
  if (name.length < 2 || name.length > 20) {
    throw new Error("姓名长度需在2-20字符");
  }
  if (gender !== "男" && gender !== "女") {
    throw new Error("性别仅支持男或女");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("出生日期格式错误");
  }
  if (!/^\d{2}:\d{2}$/.test(birthTime)) {
    throw new Error("出生时刻格式错误");
  }
  if (birthLocation.length < 2 || birthLocation.length > 40) {
    throw new Error("出生地长度需在2-40字符");
  }
  if (currentResidence.length > 80) {
    throw new Error("现居住地长度不可超过80字符");
  }
  if (pastResidences.length > 240) {
    throw new Error("过往居住地长度不可超过240字符");
  }
  if (experienceNarrative.length > 2000) {
    throw new Error("过往经历长度不可超过2000字符");
  }
  if (currentStatus.length > 1000) {
    throw new Error("现状描述长度不可超过1000字符");
  }
  if (futureVision.length > 1000) {
    throw new Error("未来愿景长度不可超过1000字符");
  }
  return {
    name,
    gender,
    birthDate,
    birthTime,
    birthLocation,
    ...(currentResidence ? { currentResidence } : {}),
    ...(pastResidences ? { pastResidences } : {}),
    ...(experienceNarrative ? { experienceNarrative } : {}),
    ...(currentStatus ? { currentStatus } : {}),
    ...(futureVision ? { futureVision } : {}),
  } as const;
}

function validateEventContext(eventInput: InferencePayload["eventContext"], question: string) {
  const background = (eventInput?.background ?? "").trim();
  const urgency = (eventInput?.urgency ?? "").trim();
  const horizon = (eventInput?.horizon ?? "").trim();
  const mood = (eventInput?.mood ?? "").trim();
  if (question.length < 6) {
    throw new Error("问题描述至少6个字符");
  }
  if (background.length < 6) {
    throw new Error("事件背景至少6个字符");
  }
  if (!urgency) {
    throw new Error("紧迫度不能为空");
  }
  if (!horizon) {
    throw new Error("关注周期不能为空");
  }
  if (!mood) {
    throw new Error("当前心境不能为空");
  }
  return {
    background,
    urgency,
    horizon,
    mood,
  };
}

function validateMode(modeInput: InferencePayload["analysisMode"]) {
  if (modeInput === "event" || modeInput === "natal" || modeInput === "forecast") {
    return modeInput;
  }
  return "event" as const;
}

function validateForecastWindow(windowInput: InferencePayload["forecastWindow"], mode: ReturnType<typeof validateMode>) {
  if (mode !== "forecast") {
    return null;
  }
  if (windowInput === "3m" || windowInput === "1y") {
    return windowInput;
  }
  throw new Error("阶段窗口仅支持3m或1y");
}

function validateAngles(anglesInput: InferencePayload["angles"]) {
  const allowed = new Set(["八字", "六爻", "梅花", "奇门", "风水", "星座", "塔罗", "手相", "面相"]);
  const normalized = (anglesInput ?? []).map((item) => item.trim()).filter((item) => allowed.has(item));
  return normalized;
}

function defaultAnglesForParadigm(paradigm: string): string[] {
  if (paradigm === "bazi") return ["八字"];
  if (paradigm === "liuyao") return ["六爻"];
  if (paradigm === "meihua") return ["梅花"];
  if (paradigm === "qimen") return ["奇门"];
  if (paradigm === "fengshui") return ["风水"];
  if (paradigm === "zodiac") return ["星座"];
  if (paradigm === "tarot") return ["塔罗"];
  if (paradigm === "palmistry") return ["手相"];
  if (paradigm === "physiognomy") return ["面相"];
  if (paradigm === "composite") return ["八字", "星座", "塔罗"];
  return ["八字"];
}

function resolveAngles(paradigm: string, anglesInput: InferencePayload["angles"]) {
  const normalized = validateAngles(anglesInput);
  if (normalized.length > 0) {
    return normalized;
  }
  return defaultAnglesForParadigm(paradigm);
}

function validateAttachments(attachmentsInput: InferencePayload["attachments"]) {
  const entries = (attachmentsInput ?? []).slice(0, 6);
  return entries
    .map((item) => {
      const name = (item.name ?? "").trim();
      const type = (item.type ?? "").trim();
      const dataUrl = (item.dataUrl ?? "").trim();
      const note = (item.note ?? "").trim();
      const category = (item.category ?? "").trim();
      if (!dataUrl.startsWith("data:image/")) {
        return null;
      }
      if (dataUrl.length > 7_000_000) {
        throw new Error("图片数据过大，请压缩后重试");
      }
      return {
        name: name || "image",
        type: type || "image/jpeg",
        dataUrl,
        note: note.slice(0, 200),
        category: category.slice(0, 30) || "未分类",
      };
    })
    .filter((item): item is { name: string; type: string; dataUrl: string; note: string; category: string } => Boolean(item));
}

export async function POST(request: NextRequest) {
  const key = process.env.OPENROUTER_API_KEY;
  if (!key) {
    return NextResponse.json({ error: "OPENROUTER_API_KEY 未配置" }, { status: 500 });
  }

  let payload: InferencePayload;
  try {
    payload = (await request.json()) as InferencePayload;
  } catch {
    return NextResponse.json({ error: "请求体格式错误" }, { status: 400 });
  }

  const paradigm = (payload.paradigm ?? "").trim().toLowerCase();
  const question = (payload.question ?? "").trim();
  const currentTime = (payload.currentTime ?? new Date().toISOString()).trim();
  const location = (payload.location ?? "").trim();
  const analysisMode = validateMode(payload.analysisMode);

  const spec = getParadigmSpec(paradigm);
  if (!spec) {
    return NextResponse.json({ error: "术数范式不支持" }, { status: 400 });
  }

  let profile: ReturnType<typeof validateProfile>;
  let eventContext = { background: "", urgency: "", horizon: "", mood: "" };
  let forecastWindow: ReturnType<typeof validateForecastWindow>;
  let angles: ReturnType<typeof validateAngles>;
  let attachments: ReturnType<typeof validateAttachments> = [];
  const normalizedQuestion =
    question || (analysisMode === "natal" ? "请给出我的整体命盘画像与长期指引" : "请给出阶段命盘推进建议");
  try {
    profile = validateProfile(payload.profile);
    forecastWindow = validateForecastWindow(payload.forecastWindow, analysisMode);
    angles = resolveAngles(paradigm, payload.angles);
    attachments = validateAttachments(payload.attachments);
    if (analysisMode === "event") {
      eventContext = validateEventContext(payload.eventContext, normalizedQuestion);
    }
  } catch (error) {
    return NextResponse.json(
      { error: error instanceof Error ? error.message : "输入参数错误" },
      { status: 400 },
    );
  }

  const lunarContext = buildLunarContext(currentTime);
  const foundationModules = buildFoundationModules(paradigm, angles);
  const model = process.env.OPENROUTER_MODEL ?? "openrouter/auto";

  const prompt = buildPrompt({
    paradigm,
    analysisMode,
    forecastWindow,
    angles,
    question: normalizedQuestion,
    currentTime,
    location,
    profile,
    eventContext,
    lunarContext,
    spec,
    foundationModules,
    imageContext: attachments.map((item) => ({
      name: item.name,
      note: item.note,
      category: item.category,
    })),
  });

  const controller = new AbortController();
  const timeoutId = setTimeout(() => {
    controller.abort();
  }, 45000);

  const userMessageContent: Array<{ type: "text"; text: string } | { type: "image_url"; image_url: { url: string } }> = [
    { type: "text", text: prompt },
    ...attachments.map((item) => ({ type: "image_url" as const, image_url: { url: item.dataUrl } })),
  ];

  let response: Response;
  try {
    response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
      method: "POST",
      headers: {
        "Content-Type": "application/json",
        Authorization: `Bearer ${key}`,
      },
      body: JSON.stringify({
        model,
        temperature: 0.6,
        max_tokens: 3200,
        messages: [
          {
            role: "system",
            content:
              "你是易枢术数分析助手。你的职责是给出可解释的结构化判断，强调行动建议与风险边界。",
          },
          { role: "user", content: userMessageContent },
        ],
      }),
      signal: controller.signal,
    });
  } catch {
    return NextResponse.json({ error: "模型服务不可达或请求超时" }, { status: 502 });
  } finally {
    clearTimeout(timeoutId);
  }

  let data: OpenRouterResponse = {};
  let fallbackError = "";
  const contentType = response.headers.get("content-type") ?? "";
  if (contentType.includes("application/json")) {
    try {
      data = (await response.json()) as OpenRouterResponse;
    } catch {
      fallbackError = "模型返回JSON解析失败";
    }
  } else {
    try {
      const text = await response.text();
      fallbackError = text.slice(0, 160) || "模型返回非JSON响应";
    } catch {
      fallbackError = "模型响应读取失败";
    }
  }

  if (!response.ok) {
    return NextResponse.json(
      { error: data.error?.message ?? (fallbackError || "模型调用失败") },
      { status: response.status >= 400 && response.status < 500 ? 400 : 502 },
    );
  }

  const result = normalizeResponseContent(data.choices?.[0]?.message?.content);
  if (!result) {
    return NextResponse.json({ error: "模型未返回有效结果" }, { status: 502 });
  }
  let finalResult = result;
  let finalModel = data.model ?? model;
  if (!hasInstitutionalStructure(result)) {
    const formatterController = new AbortController();
    const formatterTimeoutId = setTimeout(() => {
      formatterController.abort();
    }, 30000);
    try {
      const formatterResponse = await fetch("https://openrouter.ai/api/v1/chat/completions", {
        method: "POST",
        headers: {
          "Content-Type": "application/json",
          Authorization: `Bearer ${key}`,
        },
        body: JSON.stringify({
          model,
          temperature: 0.2,
          max_tokens: 3200,
          messages: [
            {
              role: "system",
              content:
                "你是报告结构修复器。你的任务是把既有推演内容重排并补全为固定机构化结构，保持原判断方向，不得改成宿命论。",
            },
            {
              role: "user",
              content: [
                "请将下面报告重写为固定结构，必须完整输出四个标题：",
                "【总览结论】、【证据链】、【行动建议】、【风险提示】。",
                "强制要求：",
                "1) 【证据链】包含Markdown表格，表头为：证据项 | 来源(开源/古籍/模型) | 结论指向 | 置信度(0-100)。",
                "2) 【行动建议】必须分为：90天、1年、3-10年，并给止损线和升级条件。",
                "3) 【风险提示】必须分为：财务、关系、健康、决策偏差，并给监控信号和缓解动作。",
                "4) 若原文信息不足，可做审慎补全，但要写明不确定性。",
                "原报告如下：",
                result,
              ].join("\n"),
            },
          ],
        }),
        signal: formatterController.signal,
      });
      const formatterContentType = formatterResponse.headers.get("content-type") ?? "";
      if (formatterResponse.ok && formatterContentType.includes("application/json")) {
        const formatterData = (await formatterResponse.json()) as OpenRouterResponse;
        const formatted = normalizeResponseContent(formatterData.choices?.[0]?.message?.content);
        if (formatted && hasInstitutionalStructure(formatted)) {
          finalResult = formatted;
          finalModel = formatterData.model ?? finalModel;
        }
      }
    } catch {
    } finally {
      clearTimeout(formatterTimeoutId);
    }
  }
  const citations = retrieveClassicalCitations({
    paradigm: paradigm === "composite" ? "bazi" : paradigm,
    question: normalizedQuestion,
    result: finalResult,
    limit: 3,
  });

  return NextResponse.json({
    result: finalResult,
    meta: {
      paradigm,
      paradigmLabel: spec.label,
      analysisMode,
      forecastWindow: forecastWindow ?? undefined,
      angles,
      model: finalModel,
      reference: spec.reference,
      citations,
      lunarContext: lunarContext ?? undefined,
      foundations: foundationModules,
      aiEnhancements: [
        "多范式交叉校验",
        "证据链机构化重排",
        "分阶段行动建议生成",
      ],
    },
  });
}
