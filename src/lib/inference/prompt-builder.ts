import { FoundationModule } from "@/types/inference";
import { ParadigmSpec } from "./types";
import { Solar } from "lunar-javascript";

export function buildFoundationModules(paradigm: string, angles: string[]): FoundationModule[] {
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

export const PARADIGM_SPECS: Record<string, ParadigmSpec> = {
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
  naming: {
    label: "五行取名",
    reasoningFrame: "以孩子八字五行强弱为核心，结合父母五行互补关系，给出姓氏选择与名字方案。",
    reference: "五行取名语义框架提示词",
  },
  composite: {
    label: "综合会诊",
    reasoningFrame: "以八字主线融合星座与塔罗视角做交叉校验，强调一致结论与分歧提示。",
    reference: "多模型会诊提示词编排",
  },
};

export function getParadigmSpec(paradigm: string): ParadigmSpec | null {
  return PARADIGM_SPECS[paradigm] ?? null;
}

export function buildLunarContext(currentTime: string) {
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

export function buildPrompt(params: {
  paradigm: string;
  analysisMode: string;
  forecastWindow: string | null;
  angles: string[];
  question: string;
  currentTime: string;
  location: string;
  namingContext?: {
    child?: {
      gender?: string;
      birthDate?: string;
      birthTime?: string;
      birthLocation?: string;
    };
    father?: {
      name?: string;
      gender?: string;
      birthDate?: string;
      birthTime?: string;
    };
    mother?: {
      name?: string;
      gender?: string;
      birthDate?: string;
      birthTime?: string;
    };
  };
  profile: {
    name: string;
    gender: string;
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
  citations: Array<{
    title: string;
    chapter: string;
    quote: string;
    source: string;
  }>;
  engineContext?: string;
}): string {
  const { paradigm, analysisMode, forecastWindow, angles, question, currentTime, location, namingContext, profile, eventContext, lunarContext, spec, foundationModules, imageContext, engineContext, citations: providedCitations } = params;
  
  const paradigmDirectiveMap: Record<string, string[]> = {
    bazi: [
      "必须显式拆解：日主强弱、十神结构、喜忌取用、大运流年触发点。",
      "至少给出6个时间节点，注明机会、风险与可执行动作。",
    ],
    liuyao: [
      "必须显式拆解：世应、六亲、动爻与变爻，识别主客关系。",
      "必须给出应期判断及触发条件，并给反例情境。",
      "请根据【六爻排盘】数据中的本卦、变卦、动爻，结合【问题】进行具体断卦。",
      "第一步：取用神。根据问题类型（财运取妻财、事业取官鬼等）确定用神。",
      "第二步：看旺衰。分析用神在月建、日辰的旺衰。",
      "第三步：看生克。分析动爻、变爻对用神的生克冲合。",
      "第四步：定吉凶。综合判断吉凶，并给出应期。",
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
    naming: [
      "必须显式拆解：孩子五行强弱、父母五行互补关系与需要补足的元素。",
      "必须给出推荐姓氏（父姓或母姓）及理由。",
      "必须输出候选名字清单并标注五行归属与含义。",
      "必须强制避开生僻字、多音字、谐音不雅、读音拗口的名字。",
    ],
  };

  const paradigmDirectives = paradigmDirectiveMap[paradigm] ?? [];
  const citations = providedCitations;
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
  const isNaming = paradigm === "naming" || analysisMode === "naming";
  const modeLabel = isNaming
    ? "五行取名"
    : analysisMode === "event"
      ? "具体事件推演"
      : analysisMode === "natal"
        ? "整体命盘推演"
        : "阶段命盘推进";
  const forecastLabel = forecastWindow === "3m" ? "最近三个月" : forecastWindow === "1y" ? "最近一年" : "不适用";
  const angleLabel = angles.length > 0 ? angles.join("、") : "八字";
  const targetLength = isNaming ? "1200-2000字" : analysisMode === "event" ? "900-1400字" : "1500-2600字";
  const modeGoal = isNaming
    ? "输出姓氏选择、五行补益方向与规范化命名清单。"
    : analysisMode === "event"
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

  const namingBlock = isNaming
    ? [
        "起名信息：",
        `- 孩子：性别${namingContext?.child?.gender || "未知"}，出生${namingContext?.child?.birthDate || "未知"} ${namingContext?.child?.birthTime || "未知"}，出生地${namingContext?.child?.birthLocation || "未知"}`,
        `- 父亲：姓名${namingContext?.father?.name || "未知"}，性别${namingContext?.father?.gender || "未知"}，生辰${namingContext?.father?.birthDate || "未知"} ${namingContext?.father?.birthTime || "未知"}`,
        `- 母亲：姓名${namingContext?.mother?.name || "未知"}，性别${namingContext?.mother?.gender || "未知"}，生辰${namingContext?.mother?.birthDate || "未知"} ${namingContext?.mother?.birthTime || "未知"}`,
        `- 名字长度偏好：${namingContext?.preferences?.nameLengths && namingContext.preferences.nameLengths.length > 0 ? namingContext.preferences.nameLengths.map((n) => `${n}字名`).join(" / ") : "不限"}`,
        `- 风格偏好：${namingContext?.preferences?.styles && namingContext.preferences.styles.length > 0 ? namingContext.preferences.styles.join(" / ") : "不限"}${namingContext?.preferences?.otherStyle ? `（${namingContext.preferences.otherStyle}）` : ""}`,
        `- 必用字：${namingContext?.preferences?.mustIncludeChars || "无"}`,
        `- 禁用字：${namingContext?.preferences?.avoidChars || "无"}`,
        `- 额外偏好：${namingContext?.preferences?.notes || "无"}`,
      ]
    : [];
  const eventBlock =
    isNaming
      ? ["事件背景：本次为命名推演，不以单一事件为核心。"]
      : analysisMode === "event"
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

  const outputBlock = isNaming
    ? [
        "输出必须使用以下四个标题并分别给出内容：",
        "【总览结论】",
        "- 必须包含：推荐姓氏（父姓/母姓）+ 取名方向（五行补益、音形义策略）。",
        "- 必须说明：姓氏选择的逻辑依据与置信度。",
        "【证据链】",
        "- 必须包含：孩子五行结构证据、父母五行互补证据、姓氏选择证据。",
        "- 必须输出一张Markdown表格，列为：证据项 | 来源(开源/古籍/模型) | 结论指向 | 置信度(0-100)。",
        "【行动建议】",
        "- 必须分为两组：首选3个 + 备选3个。",
        "- 首选与备选必须清晰标注分组标题。",
        "- 每个候选名必须使用格式：姓名｜五行归属｜含义｜适配理由。",
        "- 必须符合名字长度偏好与必用/禁用字要求。",
        "- 需给出命名偏好落地建议与可执行筛选方法。",
        "【风险提示】",
        "- 必须覆盖：读音歧义、文化禁忌、字形复杂度、五行偏差四类风险。",
        "- 每类给出监控信号与修正动作。",
        "- 若父母或孩子出生时间缺失，必须明确不确定性来源与影响。",
      ]
    : [
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
      ];

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
    ...(namingBlock.length > 0 ? namingBlock : []),
    ...(profileContextBlock.length > 0 ? ["个人补充档案：", ...profileContextBlock] : []),
    ...imageContextBlock,
    ...eventBlock,
    `起局时间：${currentTime}`,
    `地点：${location || "未提供"}`,
    lunarContext
      ? `历法上下文：阳历${lunarContext.solarDate}，农历${lunarContext.lunarDate}，干支${lunarContext.ganzhi}`
      : "历法上下文：无有效时间，忽略历法推演",
    engineContext ? `算法排盘数据：${engineContext}` : "",
    "方法与依据：",
    methodBlock,
    "开源能力底座：",
    foundationBlock,
    ...outputBlock,
    "古籍参考：",
    citationBlock,
    "表达要求：",
    "- 使用机构化、审慎、非宿命论表达；",
    "- 结论要先证据后判断，避免空泛形容；",
    "- 在不确定处明确给出不确定性来源；",
    "- 保持中文输出，结构完整，标题不可缺失。",
  ].join("\n");
}
