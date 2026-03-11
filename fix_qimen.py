import re

with open('src/lib/paradigm-engine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

replacement = """
// 阳遁局数表
const YANG_JU: Record<string, [number, number, number]> = {
  "冬至": [1, 7, 4], "小寒": [2, 8, 5], "大寒": [3, 9, 6],
  "立春": [8, 5, 2], "雨水": [9, 6, 3], "惊蛰": [1, 7, 4],
  "春分": [3, 9, 6], "清明": [4, 1, 7], "谷雨": [5, 2, 8],
  "立夏": [4, 1, 7], "小满": [5, 2, 8], "芒种": [6, 3, 9],
};
// 阴遁局数表
const YIN_JU: Record<string, [number, number, number]> = {
  "夏至": [9, 3, 6], "小暑": [8, 2, 5], "大暑": [7, 1, 4],
  "立秋": [2, 5, 8], "处暑": [1, 4, 7], "白露": [9, 3, 6],
  "秋分": [7, 1, 4], "寒露": [6, 9, 3], "霜降": [5, 8, 2],
  "立冬": [6, 9, 3], "小雪": [5, 8, 2], "大雪": [4, 7, 1],
};

function getQimenJu(jieqi: string, yuan: "上元"|"中元"|"下元", dun: "阳遁"|"阴遁"): number {
  const table = dun === "阳遁" ? YANG_JU : YIN_JU;
  const row = table[jieqi];
  if (!row) return 1; // fallback
  const idx = yuan === "上元" ? 0 : yuan === "中元" ? 1 : 2;
  return row[idx];
}

export function getQimenBasicInfo(date: Date): QimenBasicInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  
  const jieqi = lunar.getPrevJieQi(true);
  const jieqiName = jieqi.getName();
  const bazi = lunar.getBaZi();

  // 1. 正确判断阳遁/阴遁
  const YANG_DUN_JIEQI = ["冬至","小寒","大寒","立春","雨水","惊蛰","春分","清明","谷雨","立夏","小满","芒种"];
  const dun: "阴遁" | "阳遁" = YANG_DUN_JIEQI.includes(jieqiName) ? "阳遁" : "阴遁";

  // 2. 正确判断上中下元
  const jieqiDate = new Date(jieqi.getSolar().toYmd()); // 节气日期
  const dayDiff = Math.floor((date.getTime() - jieqiDate.getTime()) / 86400000);
  let yuan: "上元"|"中元"|"下元" = "上元";
  if (dayDiff >= 10) yuan = "下元";
  else if (dayDiff >= 5) yuan = "中元";

  // 3. 正确计算局数
  const ju = getQimenJu(jieqiName, yuan, dun);

  return {
    jieqi: jieqiName,
    yuan, 
    dun,
    ju,
    ganzhi: Array.isArray(bazi) ? bazi.join(" ") : String(bazi),
    zhifu: "天蓬星", // 此部分继续由于无需精细实现而在提示词补充
    zhishi: "休门",
    dutyStar: "天蓬星",
    dutyDoor: "休门"
  };
}"""

content = re.sub(r'export function getQimenBasicInfo\(date: Date\): QimenBasicInfo \{.*?\n\}\n?', replacement + '\n\n', content, flags=re.DOTALL)

with open('src/lib/paradigm-engine.ts', 'w', encoding='utf-8') as f:
    f.write(content)

