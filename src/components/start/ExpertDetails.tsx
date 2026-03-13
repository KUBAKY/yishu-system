import { InferenceResponse } from "@/types/inference";

export function ExpertDetails({ result }: { result: InferenceResponse }) {
  const expertMap: Record<string, string> = {
    "八字": "子平命理大宗师",
    "奇门": "遁甲局式研究员",
    "六爻": "易经占卜师",
    "梅花": "邵子神数传人",
    "占星": "现代占星咨询师",
    "风水": "堪舆地理讲师",
    "面相": "观人学专家"
  };

  if (!result.meta.foundations || result.meta.foundations.length === 0) {
    return null;
  }

  return (
    <div className="space-y-4">
      {result.meta.foundations.map((f) => (
        <div key={f.id} className="bg-xuangray/20 rounded-sm border border-gold-line/5 p-4 overflow-hidden relative group">
          <div className="absolute right-0 top-0 opacity-5 text-[40px] font-bold select-none group-hover:opacity-10 transition-opacity">
            {f.expert[0]}
          </div>
          <div className="flex items-center justify-between mb-3">
             <div className="flex items-center gap-2">
                <span className="w-1.5 h-1.5 rounded-full bg-gold-deep" />
                <span className="text-xs font-bold text-gold-light tracking-wide">{expertMap[f.expert] || f.expert}</span>
             </div>
             <div className="text-[10px] text-xuanpaper/30 font-mono">
                Confidence: <span className="text-gold-line">{f.confidence * 100}%</span>
             </div>
          </div>
          <div className="pl-3 border-l border-gold-line/20">
             <p className="text-xs text-xuanpaper/70 leading-relaxed italic whitespace-pre-wrap font-serif">
                {f.reasoning}
             </p>
          </div>
          {f.evidence && (
            <div className="mt-3 text-[10px] bg-black/40 p-2 rounded-xs font-mono text-gold-line/60">
               <span className="text-xuanpaper/30 mr-2">[DEBUG_LOG]</span>
               {f.evidence}
            </div>
          )}
        </div>
      ))}
    </div>
  );
}
