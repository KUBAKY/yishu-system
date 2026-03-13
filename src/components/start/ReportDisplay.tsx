import { Button } from "@/components/ui/Button";
import { InferenceResponse, ResultSections, ReportView } from "@/types/inference";
import { ExpertDetails } from "./ExpertDetails";

export interface ReportDisplayProps {
  result: InferenceResponse;
  reportView: ReportView;
  setReportView: (v: ReportView) => void;
  angles: string[];
  saveStatus: string;
  sections?: ResultSections | null;
  copyReport: () => void;
  downloadReport: () => void;
  feedbackScore: number;
  setFeedbackScore: (v: number) => void;
  copyStatus: string;
}

export function ReportDisplay({
  result,
  reportView,
  setReportView,
  angles,
  sections,
  copyReport,
  downloadReport,
  feedbackScore,
  setFeedbackScore,
  copyStatus,
}: ReportDisplayProps) {
  const expertMap: Record<string, string> = {
    "八字": "子平命理大宗师",
    "奇门": "遁甲局式研究员",
    "六爻": "易经占卜师",
    "梅花": "邵子神数传人",
    "占星": "现代占星咨询师",
    "风水": "堪舆地理讲师",
    "面相": "观人学专家"
  };

  return (
    <div className="space-y-6">
      {/* 专家团队状态 */}
      <div className="flex items-center justify-between p-3 rounded-md bg-gold-line/5 border border-gold-line/20">
        <div className="flex items-center gap-3">
          <div className="relative">
             <div className="w-10 h-10 rounded-full bg-linear-to-tr from-gold-deep to-gold-light flex items-center justify-center text-black font-bold shadow-lg">
                壹
             </div>
             <div className="absolute -bottom-1 -right-1 w-4 h-4 rounded-full bg-green-500 border-2 border-black animate-pulse" />
          </div>
          <div>
            <h3 className="text-sm font-bold text-gold-light">意数虚拟专家组已入驻</h3>
            <p className="text-xs text-xuanpaper/50">当前共 {(result.meta.angles ?? angles).length} 位核心研究员参与推演</p>
          </div>
        </div>
        <div className="text-right">
          <div className="text-[10px] text-gold-line/60 uppercase tracking-widest">Trust Score</div>
          <div className="text-lg font-mono text-gold-light">98.2%</div>
        </div>
      </div>

      {/* 推演进度条/路径 (Real Engine 视觉) */}
      <div className="px-1">
        <div className="flex justify-between text-[10px] text-xuanpaper/40 mb-1">
          <span>意图解析</span>
          <span>数据汇聚</span>
          <span>矩阵推演</span>
          <span>报告生成</span>
        </div>
        <div className="h-1 bg-xuangray/50 rounded-full overflow-hidden flex">
          <div className="w-1/4 h-full bg-gold-deep/60" />
          <div className="w-1/4 h-full bg-gold-deep/80" />
          <div className="w-1/4 h-full bg-gold-light" />
          <div className="w-1/4 h-full bg-gold-light/40 animate-pulse" />
        </div>
      </div>

      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={reportView === "overview" ? "primary" : "outline"} onClick={() => setReportView("overview")}>
          核心结论
        </Button>
        <Button type="button" size="sm" variant={reportView === "evidence" ? "primary" : "outline"} onClick={() => setReportView("evidence")}>
          推演示踪
        </Button>
        <Button type="button" size="sm" variant={reportView === "action" ? "primary" : "outline"} onClick={() => setReportView("action")}>
          行动锦囊
        </Button>
        <Button type="button" size="sm" variant={reportView === "risk" ? "primary" : "outline"} onClick={() => setReportView("risk")}>
          风险边界
        </Button>
        <Button type="button" size="sm" variant={reportView === "full" ? "primary" : "outline"} onClick={() => setReportView("full")}>
          完整报告书
        </Button>
      </div>

      <div className="grid grid-cols-2 gap-2 p-3 rounded-sm border border-gold-line/10 bg-black/20">
        <div className="space-y-1">
           <span className="text-[10px] text-xuanpaper/40 block uppercase">Paradigm</span>
           <span className="text-sm text-gold-light/90">{result.meta.paradigmLabel}</span>
        </div>
        <div className="space-y-1">
           <span className="text-[10px] text-xuanpaper/40 block uppercase">Mode</span>
           <span className="text-sm text-xuanpaper/80">
            {result.meta.analysisMode === "event" ? "具体事件" : result.meta.analysisMode === "natal" ? "整体命盘" : "阶段推进"}
           </span>
        </div>
      </div>

      {/* 专家背景墙 - 展示参会专家 */}
      <div className="flex -space-x-2 overflow-hidden py-1">
        {(result.meta.angles ?? angles).map((angle) => (
          <div 
            key={angle} 
            title={expertMap[angle] || "特邀咨询专家"}
            className="w-8 h-8 rounded-full border border-black bg-xuangray flex items-center justify-center text-[10px] text-gold-light shadow-md hover:z-10 cursor-help transition-transform hover:scale-110"
          >
            {angle[0]}
          </div>
        ))}
        <div className="text-xs text-xuanpaper/40 self-center ml-4">
          由 {(result.meta.angles ?? angles).map(a => expertMap[a] || a).join(", ")} 联合会诊
        </div>
      </div>

      {result.meta.lunarContext ? (
        <div className="text-xs text-xuanpaper/50 font-mono py-1 border-y border-gold-line/5 flex justify-between">
           <span>{result.meta.lunarContext.solarDate}</span>
           <span>{result.meta.lunarContext.ganzhi}</span>
           <span>{result.meta.lunarContext.lunarDate}</span>
        </div>
      ) : null}

      {result.meta.citations.length > 0 && reportView === "evidence" && (
        <div className="rounded-sm border-l-2 border-gold-line/40 bg-gold-line/5 p-4 space-y-2">
          <div className="flex items-center gap-2 mb-2">
            <div className="w-1 h-1 rounded-full bg-gold-light" />
            <h3 className="text-xs font-bold text-gold-light tracking-widest uppercase">Classic Authorities</h3>
          </div>
          {result.meta.citations.map((item) => (
            <div key={`${item.title}-${item.chapter}`} className="text-sm leading-7 text-xuanpaper/80 italic">
              「{item.quote}」——《{item.title}》{item.chapter}
            </div>
          ))}
        </div>
      )}

      {(reportView === "overview" || reportView === "full") && sections?.overview ? (
        <div className="relative group">
          <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-linear-to-b from-transparent via-gold-line/40 to-transparent" />
          <div className="p-4 bg-xuangray/30 rounded-sm">
            <h3 className="font-song text-gold-light flex items-center gap-2">
              <span className="text-xs opacity-50">#01</span> 总览结论
            </h3>
            <p className="leading-8 text-xuanpaper/90 whitespace-pre-wrap mt-3 text-[15px] font-serif tracking-wide">{sections.overview}</p>
          </div>
        </div>
      ) : null}

      {(reportView === "evidence" || reportView === "full") && sections?.evidence ? (
        <div className="relative group">
           <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-linear-to-b from-transparent via-blue-400/20 to-transparent" />
           <div className="p-4 bg-xuangray/30 rounded-sm">
            <h3 className="font-song text-blue-300/80 flex items-center gap-2">
              <span className="text-xs opacity-50">#02</span> 推演示踪（逻辑透视）
            </h3>
            <p className="leading-8 text-xuanpaper/80 whitespace-pre-wrap mt-3 text-sm font-mono opacity-90">{sections.evidence}</p>
            {result.meta.foundations && result.meta.foundations.length > 0 && (
              <div className="mt-4 pt-4 border-t border-white/5 flex flex-wrap gap-x-6 gap-y-2">
                {result.meta.foundations.map(f => (
                  <div key={f.id} className="text-[10px] text-xuanpaper/40">
                    <span className="text-gold-line/60">●</span> {f.name} (Conf: {f.confidence})
                  </div>
                ))}
              </div>
            )}
          </div>
        </div>
      ) : null}

      {(reportView === "action" || reportView === "full") && sections?.action ? (
        <div className="relative group">
           <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-linear-to-b from-transparent via-green-400/20 to-transparent" />
           <div className="p-4 bg-green-950/10 rounded-sm border border-green-500/10">
            <h3 className="font-song text-green-400/80 flex items-center gap-2">
              <span className="text-xs opacity-50">#03</span> 行动锦囊
            </h3>
            <p className="leading-8 text-xuanpaper/90 whitespace-pre-wrap mt-3 font-medium text-[15px]">{sections.action}</p>
          </div>
        </div>
      ) : null}

      {(reportView === "risk" || reportView === "full") && sections?.risk ? (
        <div className="relative group">
           <div className="absolute -left-1 top-0 bottom-0 w-[2px] bg-linear-to-b from-transparent via-red-400/20 to-transparent" />
           <div className="p-4 bg-red-950/10 rounded-sm border border-red-500/10">
            <h3 className="font-song text-red-400/80 flex items-center gap-2">
              <span className="text-xs opacity-50">#04</span> 风险边界
            </h3>
            <p className="leading-8 text-red-100/70 whitespace-pre-wrap mt-3 text-sm italic">{sections.risk}</p>
          </div>
        </div>
      ) : null}

      {/* 专家会诊详考 - 仅在完整报告或推演示踪中显示 */}
      {(reportView === "evidence" || reportView === "full") && (
        <div className="pt-6 border-t border-gold-line/10">
          <h3 className="text-sm font-bold text-gold-light mb-4 flex items-center gap-2">
             <span className="w-1.5 h-1.5 rounded-full bg-gold-light" />
             专家组详考笔谈 (Technical Appendices)
          </h3>
          <div className="space-y-4">
            <ExpertDetails result={result} />
          </div>
        </div>
      )}

      <div className="flex flex-wrap gap-3 pt-4">
        <Button type="button" variant="outline" size="sm" className="flex-1 border-gold-line/30 text-gold-light hover:bg-gold-line/10" onClick={copyReport}>
          {copyStatus || "复制此卷副本"}
        </Button>
        <Button type="button" variant="outline" size="sm" className="flex-1 border-gold-line/30 text-gold-light" onClick={downloadReport}>
          结册下载
        </Button>
      </div>

      <div className="pt-6 mt-6 border-t border-gold-line/20">
        <div className="flex items-center justify-between mb-4">
          <p className="text-xs text-xuanpaper/50">专家会诊准度评价</p>
          <div className="flex gap-1">
            {[1, 2, 3, 4, 5].map((score) => (
              <button
                key={score}
                type="button"
                onClick={() => setFeedbackScore(score)}
                className={`w-6 h-6 rounded-sm border text-[10px] transition-all ${
                  feedbackScore >= score
                    ? "bg-gold-light text-black border-gold-light"
                    : "border-gold-line/20 text-xuanpaper/30 hover:border-gold-line/50"
                }`}
              >
                {score}
              </button>
            ))}
          </div>
        </div>
        {feedbackScore > 0 && <p className="text-[10px] text-center text-gold-light/60 animate-bounce">反馈已送达专家组，感谢阁下支持。</p>}
      </div>
    </div>
  );
}

