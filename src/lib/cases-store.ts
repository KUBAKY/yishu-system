import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { YishuCase } from "@/types/case";

const dataDir = path.join(process.cwd(), "data");
const dataFile = path.join(dataDir, "cases.json");

async function ensureDataFile() {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(dataFile, "utf8");
  } catch {
    await writeFile(dataFile, "[]", "utf8");
  }
}

async function readAllCases(): Promise<YishuCase[]> {
  await ensureDataFile();
  const raw = await readFile(dataFile, "utf8");
  const parsed = JSON.parse(raw) as YishuCase[];
  return parsed
    .filter((item) => item && item.id && item.createdAt && typeof item.userId === "string")
    .map((item) => ({
      ...item,
      userId: item.userId.trim(),
      citations: Array.isArray(item.citations) ? item.citations : [],
    }))
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime());
}

export async function readCasesByUser(userId: string): Promise<YishuCase[]> {
  const normalizedUserId = userId.trim();
  if (!normalizedUserId) {
    return [];
  }
  const list = await readAllCases();
  return list.filter((item) => item.userId === normalizedUserId);
}

export async function appendCase(item: YishuCase): Promise<YishuCase> {
  const list = await readAllCases();
  list.unshift(item);
  const sliced = list.slice(0, 200);
  await writeFile(dataFile, JSON.stringify(sliced, null, 2), "utf8");
  return item;
}
