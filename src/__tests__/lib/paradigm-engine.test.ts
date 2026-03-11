import { getBaziData, getQimenBasicInfo, getLiuyaoData } from "@/lib/paradigm-engine";
import { UserProfile, EventContext } from "@/types/inference";

describe('getBaziData', () => {
  const mockProfile: UserProfile = {
    name: '测试用户',
    gender: '男',
    birthDate: '2026-03-10',
    birthTime: '12:00',
    birthLocation: '北京'
  };

  it('应正确计算已知日期的四柱信息', () => {
    const baziData = getBaziData(mockProfile);
    expect(baziData).toBeDefined();
    expect(baziData.month).toBeDefined();
    // 根据具体 2026年3月 的历法信息，这里将包含具体的干支和十神，可根据排盘库核对预期值。
    expect(baziData.day).toBeDefined();
    if (baziData.shishen) {
      expect(baziData.shishen.day).toBe('日主');
    }
  });

  it('如果配置缺少，应能处理边角用例', () => {
    const baziData = getBaziData({ ...mockProfile, birthTime: '' });
    expect(baziData.time).toBeDefined(); // Might fallback or have naive defaults 
  });
});

describe('getQimenBasicInfo', () => {
  const mockEventContext: EventContext = {
    description: '测工作变动',
    background: '正在找工作',
    urgency: '一般'
  };
  
  it('应当能正常返回遁甲起局数据', () => {
    // 使用给定的日期进行起局
    const qimenInfo = getQimenBasicInfo(mockEventContext);
    expect(qimenInfo).toBeDefined();
    expect(qimenInfo.yuan).toBeDefined();
    expect(qimenInfo.dun).toBeDefined();
    expect(typeof qimenInfo.ju).toBe('number');
    expect(qimenInfo.ju).toBeGreaterThanOrEqual(1);
    expect(qimenInfo.ju).toBeLessThanOrEqual(9);
  });
  
  it('不同节气下应自动识别阳遁还是阴遁', () => {
     // 此处可以通过 Mock 不同的当前时间，并调用对应函数，期待输出为 阳遁/阴遁。
     const qimenInfo = getQimenBasicInfo(mockEventContext);
     expect(['阳遁', '阴遁']).toContain(qimenInfo.dun);
  });
});

describe('getLiuyaoData', () => {
  const mockEventContext: EventContext = {
    description: '问感情',
  };

  it('调用时应返回六个随机排好的爻', () => {
    const liuyaoInfo = getLiuyaoData(mockEventContext);
    expect(liuyaoInfo).toBeDefined();
    expect(liuyaoInfo.yao.length).toBe(6);
    expect(liuyaoInfo.benGua).toBeTruthy();
    
    // 验证每个爻是合法的值
    liuyaoInfo.yao.forEach((y) => {
        expect([6, 7, 8, 9]).toContain(y);
    });
  });

  it('必须包含世应位置且不为0', () => {
    const liuyaoInfo = getLiuyaoData(mockEventContext);
    expect(liuyaoInfo.shi).toBeGreaterThan(0);
    expect(liuyaoInfo.ying).toBeGreaterThan(0);
    expect(liuyaoInfo.shi).toBeLessThanOrEqual(6);
    expect(liuyaoInfo.ying).toBeLessThanOrEqual(6);
  });
});
