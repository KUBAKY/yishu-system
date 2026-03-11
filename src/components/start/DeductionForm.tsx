import { Dispatch, SetStateAction } from "react";
import { Button } from "@/components/ui/Button";
import { Step, AnalysisMode, ForecastWindow } from "@/types/inference";
import { PARADIGMS, ANGLE_OPTIONS, QUICK_LOCATIONS } from "./constants";
import { toInputDateTime } from "@/lib/utils";

export interface DeductionFormProps {
  step: Step;
  moveStep: (step: Step) => void;
  canNextStep1: boolean;
  canNextStep2: boolean;
  canSubmit: boolean;
  loading: boolean;
  startDeduction: () => void;

  paradigm: string;
  setParadigm: Dispatch<SetStateAction<string>>;
  analysisMode: AnalysisMode;
  setAnalysisMode: Dispatch<SetStateAction<AnalysisMode>>;
  forecastWindow: ForecastWindow;
  setForecastWindow: Dispatch<SetStateAction<ForecastWindow>>;
  angles: string[];
  setAngles: Dispatch<SetStateAction<string[]>>;

  currentTime: string;
  setCurrentTime: Dispatch<SetStateAction<string>>;
  location: string;
  setLocation: Dispatch<SetStateAction<string>>;

  question: string;
  setQuestion: Dispatch<SetStateAction<string>>;
  eventBackground: string;
  setEventBackground: Dispatch<SetStateAction<string>>;
  urgency: string;
  setUrgency: Dispatch<SetStateAction<string>>;
  horizon: string;
  setHorizon: Dispatch<SetStateAction<string>>;
  mood: string;
  setMood: Dispatch<SetStateAction<string>>;

  partnerName: string;
  setPartnerName: Dispatch<SetStateAction<string>>;
  partnerGender: string;
  setPartnerGender: Dispatch<SetStateAction<string>>;
  partnerBirthDate: string;
  setPartnerBirthDate: Dispatch<SetStateAction<string>>;
  partnerBirthTime: string;
  setPartnerBirthTime: Dispatch<SetStateAction<string>>;

  spaceType: string;
  setSpaceType: Dispatch<SetStateAction<string>>;
  spaceLayout: string;
  setSpaceLayout: Dispatch<SetStateAction<string>>;

  travelDest: string;
  setTravelDest: Dispatch<SetStateAction<string>>;
  travelDate: string;
  setTravelDate: Dispatch<SetStateAction<string>>;
  travelPeers: string;
  setTravelPeers: Dispatch<SetStateAction<string>>;

  name: string;
  modeLabel: string;
}

export function DeductionForm(props: DeductionFormProps) {
  return (
    <>
      {props.step === 2 ? (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">起局时间</span>
            <input
              type="datetime-local"
              value={props.currentTime}
              onChange={(e) => props.setCurrentTime(e.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <div className="flex gap-2">
            <Button
              type="button"
              variant="outline"
              onClick={() => props.setCurrentTime(toInputDateTime(new Date().toISOString()))}
            >
              使用当前时间
            </Button>
          </div>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">地点（可选）</span>
            <input
              type="text"
              value={props.location}
              onChange={(e) => props.setLocation(e.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
              placeholder="例如：上海浦东新区"
            />
          </label>
          <div className="flex flex-wrap gap-2">
            {QUICK_LOCATIONS.map((city: string) => (
              <Button key={city} type="button" variant="outline" size="sm" onClick={() => props.setLocation(city)}>
                {city}
              </Button>
            ))}
          </div>
        </div>
      ) : null}

      {props.step === 3 ? (
        <div className="space-y-4">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">问题描述</span>
            <textarea
              value={props.question}
              onChange={(e) => props.setQuestion(e.target.value)}
              className="w-full min-h-24 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
              placeholder={
                props.analysisMode === "event"
                  ? "例如：这周是否适合推进换岗谈判？"
                  : props.analysisMode === "natal"
                    ? "可选：例如我未来5年事业与关系的主线趋势是什么？"
                    : "可选：例如未来一年职业与财务的阶段节奏如何？"
              }
            />
          </label>

          {props.analysisMode === "event" && (
            <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">⚡️</span>
                <h3 className="font-song text-gold-light">事件参数设定</h3>
              </div>
              <label className="block space-y-2">
                <span className="text-sm text-xuanpaper/80">事件背景</span>
                <textarea
                  value={props.eventBackground}
                  onChange={(e) => props.setEventBackground(e.target.value)}
                  className="w-full min-h-24 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  placeholder="例如：我已与直属领导沟通一次，对方希望下月复盘再定岗。"
                />
              </label>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">紧迫度</span>
                  <select
                    value={props.urgency}
                    onChange={(e) => props.setUrgency(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  >
                    <option value="一般">一般（常规咨询）</option>
                    <option value="紧迫">紧迫（需尽快决策）</option>
                    <option value="极速">极速（火速研判）</option>
                  </select>
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">关注周期</span>
                  <select
                    value={props.horizon}
                    onChange={(e) => props.setHorizon(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  >
                    <option value="7天内">7天内（短期爆发）</option>
                    <option value="30天内">30天内（月度运势）</option>
                    <option value="90天内">90天内（季度趋势）</option>
                  </select>
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm text-xuanpaper/80">当前心境</span>
                <select
                  value={props.mood}
                  onChange={(e) => props.setMood(e.target.value)}
                  className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                >
                  <option value="平稳">平稳</option>
                  <option value="焦虑">焦虑</option>
                  <option value="期待">期待</option>
                  <option value="迷茫">迷茫</option>
                  <option value="激动">激动</option>
                </select>
              </label>
            </div>
          )}

          {props.analysisMode === "relationship" && (
            <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">💕</span>
                <h3 className="font-song text-gold-light">关系对象信息</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">对方姓名</span>
                  <input
                    value={props.partnerName}
                    onChange={(e) => props.setPartnerName(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                    placeholder="对方姓名"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">对方性别</span>
                  <select
                    value={props.partnerGender}
                    onChange={(e) => props.setPartnerGender(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  >
                    <option value="男">男</option>
                    <option value="女">女</option>
                  </select>
                </label>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">出生日期（可选）</span>
                  <input
                    type="date"
                    value={props.partnerBirthDate}
                    onChange={(e) => props.setPartnerBirthDate(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">出生时间（可选）</span>
                  <input
                    type="time"
                    value={props.partnerBirthTime}
                    onChange={(e) => props.setPartnerBirthTime(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  />
                </label>
              </div>
            </div>
          )}

          {props.analysisMode === "fengshui_space" && (
            <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">🏡</span>
                <h3 className="font-song text-gold-light">空间参数</h3>
              </div>
              <label className="block space-y-2">
                <span className="text-sm text-xuanpaper/80">空间类型</span>
                <select
                  value={props.spaceType}
                  onChange={(e) => props.setSpaceType(e.target.value)}
                  className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                >
                  <option value="住宅">住宅</option>
                  <option value="办公室">办公室</option>
                  <option value="商铺">商铺</option>
                </select>
              </label>
              <label className="block space-y-2">
                <span className="text-sm text-xuanpaper/80">布局描述/朝向</span>
                <textarea
                  value={props.spaceLayout}
                  onChange={(e) => props.setSpaceLayout(e.target.value)}
                  className="w-full min-h-24 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  placeholder="例如：大门朝南，主卧在西北角，厨房在正东..."
                />
              </label>
            </div>
          )}

          {props.analysisMode === "travel" && (
            <div className="rounded-sm border border-gold-line/20 bg-black/10 p-4 space-y-4">
              <div className="flex items-center gap-2 mb-2">
                <span className="text-lg">✈️</span>
                <h3 className="font-song text-gold-light">出行计划</h3>
              </div>
              <div className="grid gap-3 md:grid-cols-2">
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">目的地</span>
                  <input
                    value={props.travelDest}
                    onChange={(e) => props.setTravelDest(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  />
                </label>
                <label className="block space-y-2">
                  <span className="text-sm text-xuanpaper/80">出发日期</span>
                  <input
                    type="date"
                    value={props.travelDate}
                    onChange={(e) => props.setTravelDate(e.target.value)}
                    className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  />
                </label>
              </div>
              <label className="block space-y-2">
                <span className="text-sm text-xuanpaper/80">同行人员（可选）</span>
                <input
                  value={props.travelPeers}
                  onChange={(e) => props.setTravelPeers(e.target.value)}
                  className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                  placeholder="例如：配偶、父母、同事..."
                />
              </label>
            </div>
          )}

          <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-3">
            <p className="text-sm text-xuanpaper/70">将提交的结构化上下文：</p>
            <p className="text-sm mt-1 text-gold-light">
              {props.name || "未填姓名"} / {props.modeLabel} / {props.angles.join("、")}
              {props.analysisMode === "forecast" ? ` / ${props.forecastWindow === "3m" ? "最近三个月" : "最近一年"}` : null}
              {props.analysisMode === "event" ? ` / ${props.urgency} / ${props.horizon} / ${props.mood}` : null}
            </p>
          </div>
        </div>
      ) : null}

      <div className="flex gap-3 mt-6">
        <Button
          type="button"
          variant="outline"
          className="flex-1"
          disabled={props.step === 1}
          onClick={() => props.moveStep((props.step - 1) as Step)}
        >
          上一步
        </Button>
        {props.step < 3 ? (
          <Button
            type="button"
            variant="primary"
            className="flex-1"
            disabled={(props.step === 1 && !props.canNextStep1) || (props.step === 2 && !props.canNextStep2)}
            onClick={() => props.moveStep((props.step + 1) as Step)}
          >
            下一步
          </Button>
        ) : (
          <Button variant="primary" size="lg" className="flex-1" disabled={!props.canSubmit} onClick={() => props.startDeduction()}>
            {props.loading ? "推演中..." : "开始推演"}
          </Button>
        )}
      </div>
    </>
  );
}
