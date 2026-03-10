type Citation = {
  title: string;
  chapter: string;
  quote: string;
  source: string;
  paradigms: string[];
  tags: string[];
};

const CITATIONS: Citation[] = [
  {
    title: "滴天髓",
    chapter: "通神论",
    quote: "何知其人吉，喜神为辅弼。",
    source: "命学经典",
    paradigms: ["bazi"],
    tags: ["事业", "运势", "吉凶", "机会"],
  },
  {
    title: "增删卜易",
    chapter: "总断千金赋",
    quote: "动则有变，变则通其机。",
    source: "六爻经典",
    paradigms: ["liuyao", "meihua"],
    tags: ["变化", "时机", "决策", "合作"],
  },
  {
    title: "黄金策",
    chapter: "断占总纲",
    quote: "吉凶悔吝，生乎动者也。",
    source: "易占经典",
    paradigms: ["liuyao", "meihua"],
    tags: ["风险", "选择", "行动"],
  },
  {
    title: "御定奇门宝鉴",
    chapter: "开休生三吉门",
    quote: "得三吉门者，谋为多遂。",
    source: "奇门经典",
    paradigms: ["qimen"],
    tags: ["策略", "执行", "机会", "出行"],
  },
  {
    title: "青囊序",
    chapter: "理气纲要",
    quote: "山管人丁水管财。",
    source: "堪舆经典",
    paradigms: ["fengshui"],
    tags: ["方位", "布局", "财运", "住宅"],
  },
  {
    title: "周易",
    chapter: "系辞上传",
    quote: "穷则变，变则通，通则久。",
    source: "易学总纲",
    paradigms: ["bazi", "liuyao", "meihua", "qimen", "fengshui"],
    tags: ["变化", "长期", "趋势", "调整"],
  },
];

function scoreCitation(item: Citation, paradigm: string, text: string): number {
  let score = 0;
  if (item.paradigms.includes(paradigm)) {
    score += 5;
  }
  for (const tag of item.tags) {
    if (text.includes(tag)) {
      score += 1;
    }
  }
  return score;
}

export type PublicCitation = Pick<Citation, "title" | "chapter" | "quote" | "source">;

export function retrieveClassicalCitations(params: {
  paradigm: string;
  question: string;
  result?: string;
  limit?: number;
}): PublicCitation[] {
  const text = `${params.question} ${params.result ?? ""}`;
  const limit = params.limit ?? 3;
  return CITATIONS.map((item) => ({
    item,
    score: scoreCitation(item, params.paradigm, text),
  }))
    .filter((entry) => entry.score > 0)
    .sort((a, b) => b.score - a.score)
    .slice(0, limit)
    .map((entry) => ({
      title: entry.item.title,
      chapter: entry.item.chapter,
      quote: entry.item.quote,
      source: entry.item.source,
    }));
}

