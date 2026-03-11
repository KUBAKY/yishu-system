import { getTenGod } from "@/lib/bazi/ten-gods";

describe('getTenGod - 十神计算核心算法', () => {
  it('同性相克（阳克阳） -> 偏官/七杀', () => {
    // 庚木（阳金）克 甲木（阳木）
    expect(getTenGod("甲", "庚")).toBe("七杀"); 
    // 壬水（阳水）克 丙火（阳火）
    expect(getTenGod("丙", "壬")).toBe("七杀");
  });

  it('异性相克（阴克阳，阳克阴） -> 正官', () => {
    // 辛金（阴金）克 甲木（阳木）
    expect(getTenGod("甲", "辛")).toBe("正官");
  });

  it('同性相生（阳生阳） -> 偏印/枭神', () => {
    // 壬水（阳水）生 甲木（阳木）
    expect(getTenGod("甲", "壬")).toBe("偏印");
  });

  it('异性相生（阴生阳，阳生阴） -> 正印', () => {
    // 癸水（阴水）生 甲木（阳木）
    expect(getTenGod("甲", "癸")).toBe("正印");
  });

  it('同性相同（阳遇阳，阴遇阴） -> 比肩', () => {
    expect(getTenGod("甲", "甲")).toBe("比肩");
    expect(getTenGod("乙", "乙")).toBe("比肩");
  });

  it('异性相同（阳遇阴，阴遇阳） -> 劫财', () => {
    expect(getTenGod("甲", "乙")).toBe("劫财");
    expect(getTenGod("丙", "丁")).toBe("劫财");
  });

  it('我生同性（阳生阳，阴生阴） -> 食神', () => {
    // 甲木（阳木）生 丙火（阳火）
    expect(getTenGod("甲", "丙")).toBe("食神");
  });

  it('我生异性（阳生阴，阴生阳） -> 伤官', () => {
    // 甲木（阳木）生 丁火（阴火）
    expect(getTenGod("甲", "丁")).toBe("伤官");
  });
  
  it('我克同性（阳克阳，阴克阴） -> 偏财', () => {
    // 甲木（阳木）克 戊土（阳土）
    expect(getTenGod("甲", "戊")).toBe("偏财");
  });

  it('我克异性（阳克阴，阴克阳） -> 正财', () => {
    // 甲木（阳木）克 己土（阴土）
    expect(getTenGod("甲", "己")).toBe("正财");
  });
});
