import { Solar, Lunar, EightChar, LunarUtil } from "lunar-javascript";

export type BaziData = {
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
};


import { Lunar, EightChar, LunarUtil } from "lunar-javascript";

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
};


export type LiuyaoData = {
  ben: {
    name: string;
    lines: string[]; // 六爻纳甲，从初爻到上爻
    shi: number; // 世爻位置 1-6
    ying: number; // 应爻位置 1-6
  };
  bian?: {
    name: string;
    lines: string[];
  };
  date: {
    ganzhi: string; // 月日干支
    xunkong: string; // 旬空
  };
  movingLines: number[]; // 动爻位置 1-6
};

// 简易六爻排盘（硬编码部分逻辑，完整排盘极其复杂，建议后续引入专业库）
// 这里仅实现 64 卦名映射和基础世应
const GUA_64 = [
  "乾为天", "坤为地", "水雷屯", "山水蒙", "水天需", "天水讼", "地水师", "水地比",
  "风天小畜", "天泽履", "地天泰", "天地否", "天火同人", "火天大有", "地山谦", "雷地豫",
  "泽雷随", "山风蛊", "地泽临", "风地观", "火雷噬嗑", "山火贲", "山地剥", "地雷复",
  "天雷无妄", "山天大畜", "山雷颐", "泽风大过", "坎为水", "离为火", "泽山咸", "雷风恒",
  "天山遁", "雷天大壮", "火地晋", "地火明夷", "风火家人", "火泽睽", "水山蹇", "雷水解",
  "山泽损", "风雷益", "泽天夬", "天风姤", "泽地萃", "地风升", "泽水困", "水风井",
  "泽火革", "火风鼎", "震为雷", "艮为山", "风山渐", "雷泽归妹", "雷火丰", "火山旅",
  "巽为风", "兑为泽", "风水涣", "水泽节", "风泽中孚", "雷山小过", "水火既济", "火水未济"
];

// 8经卦二进制 (初爻在低位)
// 乾111(7), 兑011(3), 离101(5), 震001(1), 巽110(6), 坎010(2), 艮100(4), 坤000(0)
// 注意：通常二进制是高位在左，这里我们定义：上爻-中爻-初爻
// 比如 乾: 1,1,1 -> 7
// 坤: 0,0,0 -> 0
// 这里的顺序是：
// 乾(111), 兑(011), 离(101), 震(001), 巽(110), 坎(010), 艮(100), 坤(000)
// 对应数字：7, 3, 5, 1, 6, 2, 4, 0
// 为了方便查表，我们需要把 64 卦按 上卦+下卦 索引
const GUA_MAP: Record<string, string> = {
  "77": "乾为天", "00": "坤为地", "21": "水雷屯", "42": "山水蒙", "27": "水天需", "72": "天水讼",
  "02": "地水师", "20": "水地比", "67": "风天小畜", "73": "天泽履", "07": "地天泰", "70": "天地否",
  "75": "天火同人", "57": "火天大有", "04": "地山谦", "10": "雷地豫", "31": "泽雷随", "46": "山风蛊",
  "03": "地泽临", "60": "风地观", "51": "火雷噬嗑", "45": "山火贲", "40": "山地剥", "01": "地雷复",
  "71": "天雷无妄", "47": "山天大畜", "41": "山雷颐", "36": "泽风大过", "22": "坎为水", "55": "离为火",
  "34": "泽山咸", "16": "雷风恒", "74": "天山遁", "17": "雷天大壮", "50": "火地晋", "05": "地火明夷",
  "65": "风火家人", "53": "火泽睽", "24": "水山蹇", "12": "雷水解", "43": "山泽损", "61": "风雷益",
  "37": "泽天夬", "76": "天风姤", "30": "泽地萃", "06": "地风升", "32": "泽水困", "26": "水风井",
  "35": "泽火革", "56": "火风鼎", "11": "震为雷", "44": "艮为山", "64": "风山渐", "13": "雷泽归妹",
  "15": "雷火丰", "54": "火山旅", "66": "巽为风", "33": "兑为泽", "62": "风水涣", "23": "水泽节",
  "63": "风泽中孚", "14": "雷山小过", "25": "水火既济", "52": "火水未济"
};

// 爻象转换：老阴(6)->阴(8), 老阳(9)->阳(7), 少阴(8)->阴(8), 少阳(7)->阳(7)
// 输入是 6个数字的数组，顺序：初爻 -> 上爻
// 比如 [9, 8, 7, 6, 8, 8] (初->上)
// 9(老阳) -> 变阴
// 8(少阴) -> 不变
// ...

function getGuaName(lines: number[]): string {
  // lines: 6个 0或1，顺序 初->上
  // 下卦：lines[0], lines[1], lines[2]
  // 上卦：lines[3], lines[4], lines[5]
  
  const lower = (lines[2] << 2) | (lines[1] << 1) | lines[0];
  const upper = (lines[5] << 2) | (lines[4] << 1) | lines[3];
  
  const key = `${upper}${lower}`;
  return GUA_MAP[key] || "未知卦";
}

export function getBaziData(date: Date): BaziData {
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
}



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
}




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
}

