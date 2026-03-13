import { useMemo } from "react";

export interface ExpertTeamProps {
  paradigm: string;
  angles: string[];
}

export function ExpertTeam({ paradigm, angles }: ExpertTeamProps) {
  const activeExperts = useMemo(() => {
    const list = [];
    if (["bazi", "ziwei", "composite", "naming"].includes(paradigm) || angles.includes("八字")) {
      list.push({ id: "e1", name: "天机老叟", specialty: "命理构架与大运断语", icon: "🧙‍♂️" });
    }
    if (["liuyao", "meihua", "composite"].includes(paradigm)) {
      list.push({ id: "e2", name: "玄微真君", specialty: "卦象流转与吉凶研判", icon: "🪭" });
    }
    if (["qimen", "fengshui_space"].includes(paradigm) || angles.includes("风水")) {
      list.push({ id: "e3", name: "遁甲星官", specialty: "时空象意与战略指导", icon: "🧭" });
    }
    if (angles.includes("星座") || paradigm === "zodiac" || paradigm === "composite") {
      list.push({ id: "e4", name: "星盘法师", specialty: "星体相位与心理动机", icon: "✨" });
    }
    if (angles.includes("塔罗") || paradigm === "tarot" || paradigm === "composite") {
      list.push({ id: "e5", name: "高塔隐士", specialty: "潜意识投影与事件细节", icon: "🃏" });
    }
    return list;
  }, [paradigm, angles]);

  if (activeExperts.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-3 pt-2">
      {activeExperts.map((expert) => (
        <div
          key={expert.id}
          className="flex items-center gap-2 rounded-full border border-gold-line/25 bg-white/5 px-3 py-1.5 transition-all hover:border-gold-line/50"
        >
          <span className="text-lg">{expert.icon}</span>
          <div className="flex flex-col">
            <span className="text-xs font-bold text-gold-light">{expert.name}</span>
            <span className="text-[10px] text-xuanpaper/50">{expert.specialty}</span>
          </div>
        </div>
      ))}
    </div>
  );
}
