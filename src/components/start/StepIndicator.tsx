import { Step } from "@/types/inference";

export const STEP_CONFIG: Array<{ step: Step; title: string; summary: string }> = [
  { step: 1, title: "个人底盘", summary: "确认身份底盘，决定推演基准" },
  { step: 2, title: "时空锚定", summary: "固定时刻地点，确保起局一致" },
  { step: 3, title: "事件补全", summary: "补足背景与情绪，提升建议命中" },
];

export const NAMING_STEP_CONFIG: Array<{ step: Step; title: string; summary: string }> = [
  { step: 1, title: "孩子与父母信息", summary: "补齐生辰与父母信息，建立命名底盘" },
  { step: 2, title: "生辰锚定", summary: "以孩子出生时间与地点作为推演锚点" },
  { step: 3, title: "命名偏好", summary: "补充偏好与避讳，优化名字推荐" },
];

export interface StepIndicatorProps {
  currentStep: Step;
  onStepChange: (step: Step) => void;
  steps?: Array<{ step: Step; title: string; summary: string }>;
}

export function StepIndicator({ currentStep, onStepChange, steps }: StepIndicatorProps) {
  const config = steps ?? STEP_CONFIG;
  const activeStepCopy = config.find((s) => s.step === currentStep);

  return (
    <>
      <div className="grid gap-3 md:grid-cols-3">
        {config.map((item) => (
          <button
            key={item.step}
            type="button"
            onClick={() => onStepChange(item.step)}
            className={`rounded-xl border p-3 text-left transition-all ${
              currentStep === item.step
                ? "border-gold-light bg-gold-glow/10 text-gold-light shadow-[0_8px_20px_rgba(168,132,59,0.15)]"
                : "border-gold-line/40 text-xuanpaper/75 hover:border-gold-light/70"
            }`}
          >
            <p className="text-xs tracking-[0.14em] text-xuanpaper/55">STEP {item.step}</p>
            <p className="mt-1 font-song">{item.title}</p>
            <p className="mt-1 text-xs leading-6 text-xuanpaper/65">{item.summary}</p>
            <p className="mt-2 text-xs">
              {currentStep === item.step ? "进行中" : currentStep > item.step ? "已完成" : "待填写"}
            </p>
          </button>
        ))}
      </div>
      {activeStepCopy?.summary ? (
        <p className="mt-3 text-sm text-xuanpaper/70">{activeStepCopy.summary}</p>
      ) : null}
    </>
  );
}
