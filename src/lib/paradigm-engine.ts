import { Solar } from "lunar-javascript";

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
  dayMaster: string;
  seasons: {
    jieqi: string;
    nextJieqi: string;
  };
  naiveStrength: string;
};

export type QimenBasicInfo = {
  jieqi: string;
  yuan: "上元" | "中元" | "下元";
  dun: "阴遁" | "阳遁";
  ju: number;
  ganzhi: string;
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
  const eightChar = lunar.getEightChar();

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
    dayMaster: dayGan.toString(),
    seasons: {
      jieqi: lunar.getJieQi(),
      nextJieqi: lunar.getNextJieQi().getName(),
    },
    naiveStrength: monthZhi.getWuXing() === dayGan.getWuXing() ? "得令" : "失令",
  };
}

export function getQimenBasicInfo(date: Date): QimenBasicInfo {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  
  const jieqi = lunar.getPrevJieQi(true);
  const jieqiName = jieqi.getName();
  const bazi = lunar.getBaZi();

  return {
    jieqi: jieqiName,
    yuan: "上元", 
    dun: "阳遁",
    ju: 1,
    ganzhi: Array.isArray(bazi) ? bazi.join(" ") : String(bazi),
  };
}

export function getLiuyaoData(date: Date, yao: string[]): LiuyaoData {
  const solar = Solar.fromDate(date);
  const lunar = solar.getLunar() as any;
  const bazi = lunar.getBaZi(); // [年, 月, 日, 时]
  
  // yao input: ["老阴", "阳", "阴", ...] (假设顺序是 初爻 -> 上爻，根据前端 LiuyaoView 实现确认)
  // 前端 LiuyaoView 中：setYao((prev) => [result, ...prev]);
  // 摇第一次：放在数组末尾 -> [爻1]
  // 摇第二次：放在数组开头 -> [爻2, 爻1] ... 
  // 等等，前端代码是 `setYao((prev) => [result, ...prev])`
  // 这意味着最后一次摇的（上爻）在数组 index 0
  // 第一次摇的（初爻）在数组 index 5
  // 我们需要 reverse 一下变成 [初, 二, 三, 四, 五, 上]
  
  const orderedYao = [...yao].reverse();
  
  const benLines: number[] = [];
  const bianLines: number[] = [];
  const movingLines: number[] = [];
  
  orderedYao.forEach((y, i) => {
    // 阴/老阴 -> 0, 阳/老阳 -> 1
    // 变卦：老阴->1, 老阳->0, 少阴->0, 少阳->1
    let val = 0;
    let bianVal = 0;
    
    if (y.includes("阴")) {
      val = 0;
      if (y === "老阴") {
        bianVal = 1;
        movingLines.push(i + 1);
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
  
  // 世应简单计算 (需要查宫位表，这里简化处理，LLM 会自己推，我们提供硬数据：卦名)
  // 为了不给错误信息，这里暂时留空 shi/ying，让 LLM 依靠卦名去推
  // 或者实现京房八宫逻辑（工作量大）
  
  return {
    ben: {
      name: benName,
      lines: orderedYao,
      shi: 0, 
      ying: 0,
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
