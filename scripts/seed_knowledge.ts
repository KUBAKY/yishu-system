import 'dotenv/config';
import { prisma } from "../src/lib/prisma";

const CITATIONS = [
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

async function main() {
  console.log("Seeding Knowledge...");
  
  for (const item of CITATIONS) {
    const paradigm = item.paradigms.join(","); // Store as comma separated for now
    const tags = JSON.stringify(item.tags);
    const content = `${item.title}《${item.chapter}》：${item.quote}`;
    
    await prisma.knowledge.create({
      data: {
        title: item.title,
        content, // We store the full quote as content
        source: item.source,
        paradigm,
        tags,
      }
    });
  }
  
  console.log("Seeding complete.");
}

main()
  .catch(e => {
    console.error(e);
    process.exit(1);
  })
  .finally(async () => {
    await prisma.$disconnect();
  });
