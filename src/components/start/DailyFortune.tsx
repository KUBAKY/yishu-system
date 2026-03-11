import { useMemo } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";

interface DailyFortuneProps {
  userName: string;
  userPhone?: string;
  authenticated: boolean;
  onStartDeduction: () => void;
}

function getDailyFortune(seed: string) {
  let hash = 0;
  for (let i = 0; i < seed.length; i++) {
    hash = (hash << 5) - hash + seed.charCodeAt(i);
    hash |= 0;
  }
  const levels = ["大吉", "中吉", "小吉", "平", "小凶"];
  const quotes = [
    "时来天地皆同力，运去英雄不自由。",
    "君子藏器于身，待时而动。",
    "知者不惑，仁者不忧，勇者不惧。",
    "天行健，君子以自强不息。",
    "祸兮福之所倚，福兮祸之所伏。",
    "道生一，一生二，二生三，三生万物。",
    "人法地，地法天，天法道，道法自然。",
  ];
  const activities = [
    { good: "访友、签约", bad: "争执、远行" },
    { good: "纳财、修造", bad: "开市、动土" },
    { good: "祭祀、祈福", bad: "嫁娶、移徙" },
    { good: "安床、入宅", bad: "出行、词讼" },
    { good: "开仓、出货", bad: "安葬、破土" },
  ];
  const gods = [
    { wealth: "正东", joy: "西北", noble: "正南" },
    { wealth: "正南", joy: "正南", noble: "正东" },
    { wealth: "东北", joy: "东南", noble: "西南" },
    { wealth: "西南", joy: "东北", noble: "正北" },
  ];
  
  const colors = ["赤红", "玄黑", "月白", "松绿", "琥珀", "群青", "黛蓝", "金褐"];
  const workTips = ["今日宜攻坚，处理最难的任务", "适合复盘，整理文档与流程", "忌冲动决策，多听少说", "贵人运旺，多与前辈交流", "效率低谷，适合处理琐事", "灵感爆发，适合头脑风暴"];
  const loveTips = ["宜主动示好，打破僵局", "保持距离，享受独处", "忌翻旧账，通过礼物表达", "桃花运旺，留意职场新人", "适合约会，去安静的地方", "情绪敏感，避免争论"];
  const tarotCards = [
    { name: "愚人", keyword: "新的开始" }, { name: "魔术师", keyword: "创造力" }, { name: "女祭司", keyword: "直觉" }, 
    { name: "皇后", keyword: "丰收" }, { name: "皇帝", keyword: "秩序" }, { name: "教皇", keyword: "指引" }, 
    { name: "恋人", keyword: "选择" }, { name: "战车", keyword: "意志" }, { name: "力量", keyword: "勇气" }, 
    { name: "隐士", keyword: "内省" }, { name: "命运之轮", keyword: "转机" }, { name: "正义", keyword: "平衡" }, 
    { name: "倒吊人", keyword: "换位思考" }, { name: "死神", keyword: "重生" }, { name: "节制", keyword: "调和" }, 
    { name: "恶魔", keyword: "诱惑" }, { name: "塔", keyword: "突变" }, { name: "星星", keyword: "希望" }, 
    { name: "月亮", keyword: "不安" }, { name: "太阳", keyword: "成功" }, { name: "审判", keyword: "觉醒" }, { name: "世界", keyword: "圆满" }
  ];

  const absHash = Math.abs(hash);
  return {
    level: levels[absHash % levels.length],
    quote: quotes[absHash % quotes.length],
    activity: activities[absHash % activities.length],
    gods: gods[absHash % gods.length],
    stars: {
      career: (absHash % 3) + 3, // 3-5 stars
      wealth: ((absHash >> 2) % 3) + 3,
      love: ((absHash >> 4) % 3) + 3,
    },
    lucky: {
      color: colors[absHash % colors.length],
      number: (absHash % 9) + 1,
      workTip: workTips[absHash % workTips.length],
      loveTip: loveTips[absHash % loveTips.length],
      tarot: tarotCards[absHash % tarotCards.length],
    }
  };
}

export default function DailyFortune({ userName, userPhone, authenticated, onStartDeduction }: DailyFortuneProps) {
  const seed = userName || (authenticated && userPhone ? userPhone : "道友");
  const dailyFortune = useMemo(() => {
    return getDailyFortune(seed + new Date().toLocaleDateString("zh-CN"));
  }, [seed]);

  return (
    <Card glow className="border-gold-line bg-[radial-gradient(circle_at_top_right,rgba(168,132,59,0.18),rgba(23,29,36,0.92)_45%)]">
      <CardHeader className="pr-32">
        <div>
          <p className="text-xs tracking-[0.24em] text-xuanpaper/55">DAILY HUB</p>
          <h1 className="text-3xl font-song text-gold-light">
            今日运势 · {userName || (authenticated && userPhone ? userPhone.slice(-4) : "道友")}
          </h1>
        </div>
      </CardHeader>
      <Button variant="outline" onClick={onStartDeduction} className="absolute top-6 right-6">
        发起新推演
      </Button>
      <CardContent className="space-y-6">
        <div className="grid gap-4 md:grid-cols-2">
          <div className="relative mb-12 overflow-hidden rounded-2xl bg-linear-to-br from-blue-900 via-indigo-900 to-purple-900 p-8 shadow-2xl">
            <p className="text-xuanpaper/60 text-xs tracking-widest uppercase">Today&apos;s Energy</p>
            <p className="text-5xl font-song text-gold-light drop-shadow-md group-hover:scale-105 transition-transform duration-500">{dailyFortune.level}</p>
            <p className="text-sm text-xuanpaper/80 italic font-kai">“{dailyFortune.quote}”</p>
          </div>
          <div className="p-5 bg-black/20 rounded-xl border border-gold-line/20 space-y-4 flex flex-col justify-center">
            <div className="flex items-center gap-4">
              <span className="shrink-0 text-green-400/90 font-bold bg-green-900/30 px-2 py-1 rounded text-xs tracking-widest border border-green-500/20">宜 · GOOD</span>
              <span className="text-sm text-xuanpaper/90 truncate">{dailyFortune.activity.good}</span>
            </div>
            <div className="flex items-center gap-4">
              <span className="shrink-0 text-red-400/90 font-bold bg-red-900/30 px-2 py-1 rounded text-xs tracking-widest border border-red-500/20">忌 · BAD</span>
              <span className="text-sm text-xuanpaper/90 truncate">{dailyFortune.activity.bad}</span>
            </div>
            <div className="h-px bg-white/5 w-full my-1" />
            <div className="flex justify-between text-xs text-xuanpaper/50">
              <span>财神：{dailyFortune.gods.wealth}</span>
              <span>喜神：{dailyFortune.gods.joy}</span>
              <span>贵人：{dailyFortune.gods.noble}</span>
            </div>
          </div>
        </div>

        <div className="grid gap-3 grid-cols-2 md:grid-cols-4">
          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help" title="今日幸运色与数字">
            <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest">LUCKY</p>
            <div className="flex items-center gap-2">
              <div 
                className="w-3 h-3 rounded-full shadow-sm ring-1 ring-white/20" 
                style={{ 
                  backgroundColor: {
                    "赤红": "#ef4444", "玄黑": "#1f2937", "月白": "#e5e7eb", "松绿": "#10b981", 
                    "琥珀": "#d97706", "群青": "#3b82f6", "黛蓝": "#1e3a8a", "金褐": "#854d0e"
                  }[dailyFortune.lucky.color as string] || "#888" 
                }} 
              />
              <span className="text-sm font-medium text-xuanpaper/90">{dailyFortune.lucky.color}</span>
            </div>
            <span className="text-xs text-gold-line font-mono">NO.{dailyFortune.lucky.number}</span>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col items-center justify-center gap-1 hover:bg-white/10 transition-colors cursor-help" title="今日塔罗启示">
            <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest">TAROT</p>
            <span className="text-lg">🃏</span>
            <div className="text-center">
              <p className="text-xs font-bold text-xuanpaper/90">{dailyFortune.lucky.tarot.name}</p>
              <p className="text-[10px] text-xuanpaper/50">{dailyFortune.lucky.tarot.keyword}</p>
            </div>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col justify-center gap-1 hover:bg-white/10 transition-colors col-span-1">
            <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest flex items-center gap-1">
              <span>💼</span> WORK
            </p>
            <p className="text-xs text-xuanpaper/80 leading-relaxed line-clamp-2" title={dailyFortune.lucky.workTip}>{dailyFortune.lucky.workTip}</p>
          </div>

          <div className="p-3 bg-white/5 rounded-lg border border-white/10 flex flex-col justify-center gap-1 hover:bg-white/10 transition-colors col-span-1">
            <p className="text-[10px] text-xuanpaper/40 uppercase tracking-widest flex items-center gap-1">
              <span>❤️</span> LOVE
            </p>
            <p className="text-xs text-xuanpaper/80 leading-relaxed line-clamp-2" title={dailyFortune.lucky.loveTip}>{dailyFortune.lucky.loveTip}</p>
          </div>
        </div>

        <div className="grid gap-3 md:grid-cols-3">
          <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
            <p className="text-xs text-xuanpaper/50">事业指数</p>
            <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
              {"★".repeat(dailyFortune.stars.career) + "☆".repeat(5 - dailyFortune.stars.career)}
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
            <p className="text-xs text-xuanpaper/50">财运指数</p>
            <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
              {"★".repeat(dailyFortune.stars.wealth) + "☆".repeat(5 - dailyFortune.stars.wealth)}
            </div>
          </div>
          <div className="p-3 bg-white/5 rounded border border-white/10 text-center">
            <p className="text-xs text-xuanpaper/50">感情指数</p>
            <div className="flex justify-center gap-1 mt-1 text-gold-line text-xs">
              {"★".repeat(dailyFortune.stars.love) + "☆".repeat(5 - dailyFortune.stars.love)}
            </div>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
