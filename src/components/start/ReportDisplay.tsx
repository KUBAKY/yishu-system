import { Button } from "@/components/ui/Button";
import { InferenceResponse, ResultSections, ReportView } from "@/types/inference";

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
  saveStatus,
  sections,
  copyReport,
  downloadReport,
  feedbackScore,
  setFeedbackScore,
  copyStatus,
}: ReportDisplayProps) {
  return (
    <div className="space-y-4">
      <div className="flex flex-wrap gap-2">
        <Button type="button" size="sm" variant={reportView === "overview" ? "primary" : "outline"} onClick={() => setReportView("overview")}>
          总览
        </Button>
        <Button type="button" size="sm" variant={reportView === "evidence" ? "primary" : "outline"} onClick={() => setReportView("evidence")}>
          证据
        </Button>
        <Button type="button" size="sm" variant={reportView === "action" ? "primary" : "outline"} onClick={() => setReportView("action")}>
          建议
        </Button>
        <Button type="button" size="sm" variant={reportView === "risk" ? "primary" : "outline"} onClick={() => setReportView("risk")}>
          风险
        </Button>
        <Button type="button" size="sm" variant={reportView === "full" ? "primary" : "outline"} onClick={() => setReportView("full")}>
          全文
        </Button>
      </div>
      <p className="text-sm text-xuanpaper/70">范式：{result.meta.paradigmLabel}</p>
      <p className="text-sm text-xuanpaper/70">
        模式：
        {result.meta.analysisMode === "event"
          ? "具体事件"
          : result.meta.analysisMode === "natal"
            ? "整体命盘"
            : result.meta.analysisMode === "forecast"
              ? "阶段推进"
              : "未标注"}
      </p>
      <p className="text-sm text-xuanpaper/70">视角：{(result.meta.angles ?? angles).join("、")}</p>
      {result.meta.forecastWindow ? (
        <p className="text-sm text-xuanpaper/70">窗口：{result.meta.forecastWindow === "3m" ? "最近三个月" : "最近一年"}</p>
      ) : null}
      <p className="text-sm text-xuanpaper/70">模型：{result.meta.model}</p>
      <p className="text-sm text-xuanpaper/70">参考实现：{result.meta.reference}</p>
      <p className="text-sm text-xuanpaper/70">
        保存状态：
        {saveStatus === "saving" ? "保存中" : null}
        {saveStatus === "saved" ? "已保存至案例库" : null}
        {saveStatus === "error" ? "保存失败" : null}
        {saveStatus === "idle" ? "未保存" : null}
        {saveStatus === "guest" ? "游客态不保存，登录后可沉淀历史记录" : null}
        {saveStatus === "expired" ? "试用已结束，续费后可新增记录" : null}
      </p>
      {result.meta.lunarContext ? (
        <p className="text-sm text-xuanpaper/70">
          历法：{result.meta.lunarContext.solarDate} / {result.meta.lunarContext.lunarDate} / {result.meta.lunarContext.ganzhi}
        </p>
      ) : null}
      {result.meta.citations.length > 0 ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
          <h3 className="font-song text-gold-light">古籍引证</h3>
          {result.meta.citations.map((item) => (
            <p key={`${item.title}-${item.chapter}`} className="text-sm leading-7 text-xuanpaper/80">
              《{item.title}》{item.chapter}：{item.quote}
            </p>
          ))}
        </div>
      ) : null}
      {result.meta.foundations && result.meta.foundations.length > 0 ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
          <h3 className="font-song text-gold-light">开源能力底座</h3>
          {result.meta.foundations.map((item) => (
            <p key={item.id} className="text-sm leading-7 text-xuanpaper/80">
              {item.name} · {item.purpose} · {item.integration === "direct" ? "直接集成" : "参考转译"} · 置信{item.confidence}
            </p>
          ))}
        </div>
      ) : null}
      {result.meta.aiEnhancements && result.meta.aiEnhancements.length > 0 ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
          <h3 className="font-song text-gold-light">AI增强能力</h3>
          <p className="text-sm leading-7 text-xuanpaper/80">{result.meta.aiEnhancements.join("、")}</p>
        </div>
      ) : null}

      {(reportView === "overview" || reportView === "full") && sections?.overview ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
          <h3 className="font-song text-gold-light">总览结论</h3>
          <p className="leading-8 whitespace-pre-wrap mt-2">{sections.overview}</p>
        </div>
      ) : null}

      {(reportView === "evidence" || reportView === "full") && sections?.evidence ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
          <h3 className="font-song text-gold-light">证据链</h3>
          <p className="leading-8 whitespace-pre-wrap mt-2">{sections.evidence}</p>
        </div>
      ) : null}

      {(reportView === "action" || reportView === "full") && sections?.action ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
          <h3 className="font-song text-gold-light">行动建议</h3>
          <p className="leading-8 whitespace-pre-wrap mt-2">{sections.action}</p>
        </div>
      ) : null}

      {(reportView === "risk" || reportView === "full") && sections?.risk ? (
        <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
          <h3 className="font-song text-gold-light">风险提示</h3>
          <p className="leading-8 whitespace-pre-wrap mt-2">{sections.risk}</p>
        </div>
      ) : null}

      <div className="flex flex-wrap gap-2">
        <Button type="button" variant="outline" onClick={copyReport}>
          复制报告
        </Button>
        <Button type="button" variant="outline" onClick={downloadReport}>
          下载TXT
        </Button>
      </div>
      <div className="pt-4 border-t border-gold-line/20">
        <p className="text-sm text-xuanpaper/70 mb-2">本次推演准吗？</p>
        <div className="flex gap-2">
          {[1, 2, 3, 4, 5].map((score) => (
            <button
              key={score}
              type="button"
              onClick={() => setFeedbackScore(score)}
              className={`w-8 h-8 rounded-full border transition-all ${
                feedbackScore >= score
                  ? "bg-gold-light text-black border-gold-light"
                  : "border-gold-line/40 text-xuanpaper/60 hover:border-gold-line"
              }`}
            >
              {score}
            </button>
          ))}
        </div>
        {feedbackScore > 0 && <p className="text-xs text-gold-light mt-2">感谢反馈！已记录。</p>}
      </div>
      {copyStatus ? <p className="text-sm text-gold-light">{copyStatus}</p> : null}
    </div>
  );
}
