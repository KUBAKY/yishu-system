import re

with open('src/lib/paradigm-engine.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 1. 完善八字数据类型 (BaziData)
bazi_type = """export type BaziData = {
  ganzhi: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  wuxing: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  shishen: {
    year: string;
    month: string;
    day: string;
    time: string;
  };
  dayMaster: string;
  seasons: {
    jieqi: string;
    nextJieqi: string;
  };
  naiveStrength: string;
};"""

content = re.sub(r'export type BaziData = \{.*?\n\};\n?', bazi_type + '\n\n', content, flags=re.DOTALL)


# 2. 完善奇门遁甲数据类型 (QimenBasicInfo) 及其推演逻辑

qimen_type = """import { Lunar, EightChar, LunarUtil } from "lunar-javascript";

export type QimenBasicInfo = {
  jieqi: string;
  yuan: "上元" | "中元" | "下元";
  dun: "阴遁" | "阳遁";
  ju: number;
  ganzhi: string;
  zhifu: string;
  zhishi: string;
  dutyStar: string;
  dutyDoor: string;
};"""

content = re.sub(r'export type QimenBasicInfo = \{.*?\n\};\n?', qimen_type + '\n\n', content, flags=re.DOTALL)
content = content.replace('import { Solar } from "lunar-javascript";\n\nimport { Lunar, EightChar, LunarUtil } from "lunar-javascript";', 'import { Solar, Lunar, EightChar, LunarUtil } from "lunar-javascript";')
content = content.replace('import { Solar } from "lunar-javascript";\nimport { Lunar, EightChar, LunarUtil } from "lunar-javascript";', 'import { Solar, Lunar, EightChar, LunarUtil } from "lunar-javascript";')

if 'import { Solar, Lunar, EightChar, LunarUtil }' not in content:
    content = re.sub(r'import \{ Solar \} from "lunar-javascript";\n?', 'import { Solar, Lunar, EightChar, LunarUtil } from "lunar-javascript";\n', content)

# 3. 提供修改后的 getBaziData 函数

bazi_func = """export function getBaziData(date: Date): BaziData {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  const eightChar = lunar.getEightChar() as EightChar;

  const yearGan = eightChar.getYearGan();
  const yearZhi = eightChar.getYearZhi();
  const monthGan = eightChar.getMonthGan();
  const monthZhi = eightChar.getMonthZhi();
  const dayGan = eightChar.getDayGan();
  const dayZhi = eightChar.getDayZhi();
  const timeGan = eightChar.getTimeGan();
  const timeZhi = eightChar.getTimeZhi();

  return {
    ganzhi: {
      year: eightChar.getYear(),
      month: eightChar.getMonth(),
      day: eightChar.getDay(),
      time: eightChar.getTime(),
    },
    wuxing: {
      year: yearGan.getWuXing() + yearZhi.getWuXing(),
      month: monthGan.getWuXing() + monthZhi.getWuXing(),
      day: dayGan.getWuXing() + dayZhi.getWuXing(),
      time: timeGan.getWuXing() + timeZhi.getWuXing(),
    },
    shishen: {
      year: eightChar.getYearShiShenGan() + eightChar.getYearShiShenZhi()[0],
      month: eightChar.getMonthShiShenGan() + eightChar.getMonthShiShenZhi()[0],
      day: "日主" + eightChar.getDayShiShenZhi()[0], // 日干是日主自己，配日支十神
      time: eightChar.getTimeShiShenGan() + eightChar.getTimeShiShenZhi()[0],
    },
    dayMaster: dayGan.toString(),
    seasons: {
      jieqi: lunar.getJieQi(),
      nextJieqi: lunar.getNextJieQi().getName(),
    },
    naiveStrength: monthZhi.getWuXing() === dayGan.getWuXing() ? "得令" : "失令",
  };
}"""

content = re.sub(r'export function getBaziData\(date: Date\): BaziData \{.*?\n\}\n?', bazi_func + '\n\n', content, flags=re.DOTALL)

# 4. 提供修改后的 getQimenBasicInfo 函数
# (简化计算局数，仅为演示用途，奇门完整算法极其庞大)
qimen_func = """export function getQimenBasicInfo(date: Date): QimenBasicInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  
  const jieqi = lunar.getPrevJieQi(true);
  const jieqiName = jieqi.getName();
  const bazi = lunar.getBaZi();

  // 简易判断：冬至到夏至为阳遁，夏至到冬至为阴遁
  const isYang = ["冬至", "小寒", "大寒", "立春", "雨水", "惊蛰", "春分", "清明", "谷雨", "立夏", "小满", "芒种"].includes(jieqiName);
  const dun: "阴遁" | "阳遁" = isYang ? "阳遁" : "阴遁";

  return {
    jieqi: jieqiName,
    yuan: "上元", 
    dun,
    ju: 1, // 简化的局数，由于没有引入奇门特定库，此处保持一个静态反馈但在 LLM Prompt 里提示用预测大模型的能力
    ganzhi: Array.isArray(bazi) ? bazi.join(" ") : String(bazi),
    zhifu: "天蓬星", // 类似
    zhishi: "休门",
    dutyStar: "天蓬星",
    dutyDoor: "休门"
  };
}"""

content = re.sub(r'export function getQimenBasicInfo\(date: Date\): QimenBasicInfo \{.*?\n\}\n?', qimen_func + '\n\n', content, flags=re.DOTALL)

# 5. 完善六爻获取 (京房八宫世应算法)
# 将原先简单的返回补上世应

liuyao_func = """
// 简易八宫寻世应法则：初一二三四五游归
function getShiYing(lines: number[]): { shi: number, ying: number } {
  // lines 长度为 6，数组 0..5 对应 初爻..上爻
  // 简化的八宫世应判断，主要需要比对内外卦的异同。
  const lower = [lines[0], lines[1], lines[2]];
  const upper = [lines[3], lines[4], lines[5]];
  
  const diffs = [
    lower[0] !== upper[0], // 初与四
    lower[1] !== upper[1], // 二与五
    lower[2] !== upper[2]  // 三与上
  ];
  
  // 八卦本宫（全同） - 世在六（上），应在三
  if (!diffs[0] && !diffs[1] && !diffs[2]) return { shi: 6, ying: 3 };
  
  // 一世卦（初异） - 世在一，应在四
  if (diffs[0] && !diffs[1] && !diffs[2]) return { shi: 1, ying: 4 };
  
  // 二世卦（初二异） - 世在二，应在五
  if (diffs[0] && diffs[1] && !diffs[2]) return { shi: 2, ying: 5 };
  
  // 三世卦（初二三异） - 世在三，应在六
  if (diffs[0] && diffs[1] && diffs[2]) return { shi: 3, ying: 6 };
  
  // 四世卦（初二三四异，即只有五六同） - 世在四，应在一
  if (!diffs[0] && diffs[1] && diffs[2]) return { shi: 4, ying: 1 };
  
  // 五世卦（初二三四五异，即只有六同） - 世在五，应在二
  if (!diffs[0] && !diffs[1] && diffs[2]) return { shi: 5, ying: 2 };
  
  // 游魂卦（初四同，二三五六异） - 世在四，应在一
  if (diffs[0] && !diffs[1] && diffs[2]) return { shi: 4, ying: 1 };
  
  // 归魂卦（初二四五同，三六异） - 世在三，应在六
  if (!diffs[0] && diffs[1] && !diffs[2]) return { shi: 3, ying: 6 };
  
  return { shi: 0, ying: 0 };
}

export function getLiuyaoData(date: Date, yao: string[]): LiuyaoData {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  const bazi = lunar.getBaZi();
  
  const orderedYao = [...yao].reverse();
  
  const benLines: number[] = [];
  const bianLines: number[] = [];
  const movingLines: number[] = [];
  
  orderedYao.forEach((y, i) => {
    let val = 0;
    let bianVal = 0;
    
    if (y.includes("阴")) {
      val = 0;
      if (y === "老阴") {
        bianVal = 1;
        movingLines.push(i + 1); // 1-indexed
      } else {
        bianVal = 0;
      }
    } else {
      val = 1;
      if (y === "老阳") {
        bianVal = 0;
        movingLines.push(i + 1);
      } else {
        bianVal = 1;
      }
    }
    benLines.push(val);
    bianLines.push(bianVal);
  });
  
  const benName = getGuaName(benLines);
  const bianName = movingLines.length > 0 ? getGuaName(bianLines) : undefined;
  
  const { shi, ying } = getShiYing(benLines);
  
  return {
    ben: {
      name: benName,
      lines: orderedYao,
      shi, 
      ying,
    },
    bian: bianName ? {
      name: bianName,
      lines: bianLines.map(v => v === 0 ? "阴" : "阳"),
    } : undefined,
    date: {
      ganzhi: `${bazi[1]}月 ${bazi[2]}日`, // 月建 日辰
      xunkong: lunar.getDayXunKong(),
    },
    movingLines,
  };
}"""

content = re.sub(r'export function getLiuyaoData\(date: Date, yao: string\[\]\): LiuyaoData \{.*?\n\}\n?', liuyao_func + '\n\n', content, flags=re.DOTALL)

with open('src/lib/paradigm-engine.ts', 'w', encoding='utf-8') as f:
    f.write(content)

