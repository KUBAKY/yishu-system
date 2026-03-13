import Link from "next/link";
import { notFound } from "next/navigation";
import { Button } from "@/components/ui/Button";
import { TarotView } from "@/components/paradigm-ui/TarotView";
import { LiuyaoView } from "@/components/paradigm-ui/LiuyaoView";
import { MeihuaView } from "@/components/paradigm-ui/MeihuaView";
import { BaziView } from "@/components/paradigm-ui/BaziView";
import { GenericView } from "@/components/paradigm-ui/GenericView";
import { NamingView } from "@/components/paradigm-ui/NamingView";

const PARADIGM_CONTENT: Record<string, { title: string; desc: string }> = {
  bazi: {
    title: "八字命理",
    desc: "聚焦四柱结构、十神关系与大运流年的阶段推演。",
  },
  liuyao: {
    title: "六爻纳甲",
    desc: "围绕世应、六亲、动爻变化提供问事决策框架。",
  },
  meihua: {
    title: "梅花易数",
    desc: "基于体用、互卦、变卦分析当下事件演化趋势。",
  },
  qimen: {
    title: "奇门遁甲",
    desc: "结合时空九宫信息进行策略评估与时机判断。",
  },
  fengshui: {
    title: "堪舆风水",
    desc: "从方位、动线与气场角度给出环境优化方向。",
  },
  zodiac: {
    title: "星座占星",
    desc: "以星座人格倾向与阶段情绪节律推演关系、事业与自我成长路径。",
  },
  tarot: {
    title: "塔罗推演",
    desc: "仅使用大阿尔卡那三牌阵，通过牌义结构与情境变量给出可执行的行动建议。",
  },
  palmistry: {
    title: "手相分析",
    desc: "结合掌纹主线、掌丘与手型比例进行趋势判断与策略建议。",
  },
  physiognomy: {
    title: "面相分析",
    desc: "结合五官比例与神态特征进行结构化风险识别与行动建议。",
  },
  naming: {
    title: "五行取名",
    desc: "结合本命八字与父母生辰，提供五行互补的起名框架与数理建议。",
  },
};

export default async function ParadigmPage({
  params,
}: {
  params: Promise<{ id: string }>;
}) {
  const { id } = await params;
  const paradigm = PARADIGM_CONTENT[id];

  if (!paradigm) {
    notFound();
  }

  return (
    <main className="min-h-screen bg-xuanqing text-xuanpaper px-6 py-12 flex flex-col justify-between">
      <div className="flex-1 flex flex-col items-center justify-center w-full">
        {id === "tarot" ? (
          <TarotView />
        ) : id === "liuyao" ? (
          <LiuyaoView />
        ) : id === "meihua" ? (
          <MeihuaView />
        ) : id === "bazi" ? (
          <BaziView />
        ) : id === "naming" ? (
          <NamingView />
        ) : (
          <GenericView title={paradigm.title} desc={paradigm.desc} paradigmId={id} />
        )}
      </div>
      
      <div className="mt-12 text-center">
        <Link href="/">
          <Button variant="ghost" className="text-xs text-xuanpaper/40 hover:text-xuanpaper">
            返回首页
          </Button>
        </Link>
      </div>
    </main>
  );
}
