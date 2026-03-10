import { prisma } from "@/lib/prisma";
import { YishuCase } from "@/types/case";

export async function readCasesByUser(userId: string): Promise<YishuCase[]> {
  if (!userId) return [];
  
  const cases = await prisma.case.findMany({
    where: { userId },
    orderBy: { createdAt: "desc" },
  });

  return cases.map((c) => {
    let input: any = {};
    try {
      input = JSON.parse(c.inputData);
    } catch (e) {
      console.error("Failed to parse inputData for case", c.id, e);
    }

    let structured: any = {};
    if (c.structuredResult) {
      try {
        structured = JSON.parse(c.structuredResult);
      } catch (e) {
        console.error("Failed to parse structuredResult for case", c.id, e);
      }
    }
    
    return {
      id: c.id,
      userId: c.userId || "",
      paradigm: c.paradigm,
      paradigmLabel: input.paradigmLabel || c.paradigm,
      question: c.question,
      location: input.location || "",
      currentTime: input.currentTime || "",
      result: c.result,
      model: input.model || "AI",
      reference: input.reference || "",
      lunarContext: input.lunarContext,
      foundations: structured.foundations || [],
      aiEnhancements: structured.aiEnhancements || [],
      citations: structured.citations || [],
      createdAt: c.createdAt.toISOString(),
    };
  });
}

export async function appendCase(item: YishuCase): Promise<YishuCase> {
  const { 
    id, userId, paradigm, question, result, createdAt, 
    paradigmLabel, location, currentTime, model, reference, lunarContext,
    foundations, aiEnhancements, citations
  } = item;

  const inputData = JSON.stringify({
    paradigmLabel, location, currentTime, model, reference, lunarContext
  });
  
  const structuredResult = JSON.stringify({
    foundations, aiEnhancements, citations
  });

  await prisma.case.create({
    data: {
      id: id || undefined, // Use provided ID or auto-generate
      userId: userId || null, // Convert empty string to null
      paradigm,
      question,
      inputData,
      result,
      structuredResult,
      createdAt: createdAt ? new Date(createdAt) : undefined,
    },
  });

  return item;
}
