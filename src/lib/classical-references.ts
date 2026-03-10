import { prisma } from "@/lib/prisma";

export type PublicCitation = {
  title: string;
  chapter: string;
  quote: string;
  source: string;
};

// Fallback data if DB fails or is empty
const CITATIONS_FALLBACK: any[] = [
  {
    title: "周易",
    chapter: "系辞",
    quote: "穷则变，变则通，通则久。",
    source: "易学总纲",
    paradigms: ["bazi", "liuyao", "meihua", "qimen", "fengshui"],
    tags: ["变化", "长期", "趋势", "调整"],
  },
];

export async function retrieveClassicalCitations(params: {
  paradigm: string;
  question: string;
  result?: string;
  limit?: number;
}): Promise<PublicCitation[]> {
  const text = `${params.question} ${params.result ?? ""}`;
  const limit = params.limit ?? 3;
  const paradigm = params.paradigm;

  try {
    // 1. Simple search: find knowledge items where paradigm matches or is general
    // This is a naive implementation. In production, use full-text search or vector search.
    const allKnowledge = await prisma.knowledge.findMany();
    
    const scored = allKnowledge.map(k => {
      let score = 0;
      if (k.paradigm?.includes(paradigm)) score += 5;
      
      // Check tags (stored as JSON string)
      try {
        const tags = JSON.parse(k.tags) as string[];
        for (const tag of tags) {
          if (text.includes(tag)) score += 1;
        }
      } catch {}
      
      return { item: k, score };
    });

    const top = scored
      .filter(x => x.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, limit);

    if (top.length > 0) {
      return top.map(x => {
        // Content format: "Title《Chapter》：Quote"
        // Need to parse it back or just use it. 
        // Our API expects split fields.
        const match = x.item.content.match(/^(.+?)《(.+?)》：(.+)$/);
        if (match) {
          return {
            title: match[1],
            chapter: match[2],
            quote: match[3],
            source: x.item.source
          };
        }
        return {
          title: x.item.title,
          chapter: "篇章",
          quote: x.item.content,
          source: x.item.source
        };
      });
    }
  } catch (e) {
    console.error("Knowledge retrieval failed", e);
  }

  // Fallback
  return CITATIONS_FALLBACK.slice(0, limit).map(c => ({
    title: c.title,
    chapter: c.chapter,
    quote: c.quote,
    source: c.source
  }));
}
