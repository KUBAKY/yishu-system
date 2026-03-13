"use client";

import { motion } from "framer-motion";
import { useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { 
  Compass, 
  Sparkles, 
  BookText, 
  MoonStar, 
  Wind,
  ScrollText,
  Stars,
  VenetianMask,
  Hand,
  ScanFace,
  Type
} from "lucide-react";
import { Button } from "@/components/ui/Button";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { AuthMeResponse } from "@/types/auth";
import { cn } from "@/lib/utils";

const PARADIGMS = [
  {
    id: "bazi",
    title: "八字命理",
    desc: "子平真诠，洞察先天格局与岁运起伏",
    icon: Sparkles,
    color: "text-amber-400",
    href: "/paradigm/bazi",
  },
  {
    id: "liuyao",
    title: "六爻纳甲",
    desc: "动静之间，卜问人事忧疑与吉凶应期",
    icon: ScrollText,
    color: "text-blue-400",
    href: "/paradigm/liuyao",
  },
  {
    id: "meihua",
    title: "梅花易数",
    desc: "观物起卦，心易神动捕捉天地外应",
    icon: MoonStar,
    color: "text-purple-400",
    href: "/paradigm/meihua",
  },
  {
    id: "qimen",
    title: "奇门遁甲",
    desc: "运筹帷幄，时空博弈下的决胜之道",
    icon: Compass,
    color: "text-red-400",
    href: "/paradigm/qimen",
  },
  {
    id: "fengshui",
    title: "堪舆风水",
    desc: "藏风纳气，调和场域与生命的能量契合",
    icon: Wind,
    color: "text-emerald-400",
    href: "/paradigm/fengshui",
  },
  {
    id: "zodiac",
    title: "星座占星",
    desc: "群星轨迹，映照性格节律与关系成长路径",
    icon: Stars,
    color: "text-cyan-400",
    href: "/paradigm/zodiac",
  },
  {
    id: "tarot",
    title: "塔罗推演",
    desc: "牌阵映心，揭示处境变量与行动选择顺序",
    icon: VenetianMask,
    color: "text-fuchsia-400",
    href: "/paradigm/tarot",
  },
  {
    id: "palmistry",
    title: "手相分析",
    desc: "观掌纹丘象，识别行为节律与决策盲区",
    icon: Hand,
    color: "text-lime-400",
    href: "/paradigm/palmistry",
  },
  {
    id: "physiognomy",
    title: "面相分析",
    desc: "察五官神采，推断风险信号与阶段机会",
    icon: ScanFace,
    color: "text-orange-400",
    href: "/paradigm/physiognomy",
  },
  {
    id: "naming",
    title: "五行取名",
    desc: "结合本命八字与父母八字，提供五行互补的取名建议与数理分析",
    icon: Type,
    color: "text-rose-400",
    href: "/paradigm/naming",
  },
];

export default function Home() {
  const router = useRouter();
  const [authenticated, setAuthenticated] = useState(false);

  useEffect(() => {
    let alive = true;
    async function loadAuth() {
      try {
        const response = await fetch("/api/auth/me", { cache: "no-store" });
        const data = (await response.json()) as AuthMeResponse;
        if (!alive) return;
        setAuthenticated(Boolean(response.ok && data.authenticated));
      } catch {
        if (!alive) return;
        setAuthenticated(false);
      }
    }
    void loadAuth();
    return () => {
      alive = false;
    };
  }, []);

  return (
    <div className="min-h-screen bg-xuanqing selection:bg-gold-dark selection:text-white">
      {/* 背景微光效果 */}
      <div className="fixed inset-0 pointer-events-none overflow-hidden">
        <div className="absolute -top-[10%] -left-[10%] w-[40%] h-[40%] bg-gold-glow blur-[120px] opacity-20" />
        <div className="absolute bottom-[20%] -right-[10%] w-[30%] h-[30%] bg-zhusha blur-[150px] opacity-10" />
      </div>

      <main className="relative z-10 max-w-lg mx-auto px-6 pt-20 pb-32 flex flex-col gap-12">
        {/* 标题区 */}
        <section className="text-center space-y-4">
          <motion.h1 
            initial={{ opacity: 0, filter: "blur(12px)", y: 20 }}
            animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
            transition={{ duration: 1, ease: "easeOut" }}
            className="text-4xl md:text-5xl font-seal text-gold-light tracking-widest drop-shadow-md"
          >
            易 枢
          </motion.h1>
          <motion.p 
            initial={{ opacity: 0, filter: "blur(8px)" }}
            animate={{ opacity: 1, filter: "blur(0px)" }}
            transition={{ delay: 0.4, duration: 1 }}
            className="text-sm font-kai text-xuanpaper/60 tracking-[0.2em] uppercase"
          >
            YiShu Intelligent Deduction
          </motion.p>
          <motion.div 
            initial={{ scaleX: 0 }}
            animate={{ scaleX: 1 }}
            transition={{ delay: 0.7, duration: 0.8 }}
            className="w-16 h-px bg-gold-line mx-auto mt-6"
          />
        </section>

        {/* 核心功能入口 */}
        <section className="grid gap-8">
          {PARADIGMS.map((item, idx) => (
            <motion.div
              key={item.id}
              initial={{ opacity: 0, filter: "blur(10px)", y: 20 }}
              animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
              transition={{ delay: 0.6 + idx * 0.15, duration: 0.8, ease: "easeOut" }}
            >
              <Card
                className="group cursor-pointer hover:border-gold-light/60 active:scale-[0.98]"
                glow
                onClick={() => router.push(item.href)}
              >
                <CardHeader>
                  <div className={cn("p-2 rounded-sm bg-white/5 group-hover:bg-white/10 transition-colors", item.color)}>
                    <item.icon size={24} />
                  </div>
                  <h2 className="text-xl font-song text-gold-light">{item.title}</h2>
                </CardHeader>
                <CardContent>
                  <p className="text-sm font-kai">{item.desc}</p>
                </CardContent>
              </Card>
            </motion.div>
          ))}
        </section>

        {/* 底部功能区 */}
        <motion.section 
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          transition={{ delay: 1.2, duration: 0.8 }}
          className="mt-12 flex flex-col gap-6"
        >
          <Button
            variant="primary"
            size="lg"
            className="w-full font-song tracking-widest group"
            onClick={() => router.push("/start")}
          >
            开始今日推演
            <Sparkles className="ml-2 w-4 h-4 group-hover:animate-pulse" />
          </Button>
          <div className="flex gap-4">
            <Button variant="outline" className="flex-1" onClick={() => router.push("/cases")}>
              <BookText className="mr-2 w-4 h-4" /> 经典案例
            </Button>
            <Button variant="outline" className="flex-1" onClick={() => router.push("/tools/compass")}>
              <Compass className="mr-2 w-4 h-4" /> 罗盘工具
            </Button>
          </div>
          {authenticated ? (
            <Button variant="outline" className="w-full" onClick={() => router.push("/account")}>
              账号中心
            </Button>
          ) : null}
          <div className="flex gap-4">
            <Button
              variant="outline"
              className="flex-1 font-song tracking-widest"
              onClick={() => alert("此功能不可为凡人用，无量天尊")}
            >
              画符施咒
            </Button>
            <Button
              variant="outline"
              className="flex-1 font-song tracking-widest text-[#B22222] border-[#B22222]/30 hover:bg-[#B22222]/5"
              onClick={() => alert("此功能不可为凡人用，无量天尊")}
            >
              破·解·镇
            </Button>
          </div>
        </motion.section>
      </main>

      {/* 极简底部导航/声明 */}
      <footer className="fixed bottom-0 left-0 right-0 p-6 text-center z-20 bg-linear-to-t from-xuanqing to-transparent">
        <p className="text-[10px] text-xuanpaper/30 font-kai">
          易枢 · 遵法古籍 · 智取其枢
        </p>
      </footer>
    </div>
  );
}
