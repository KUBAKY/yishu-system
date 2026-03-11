import { Button } from "@/components/ui/Button";
import { EXPERIENCE_TEMPLATE, STATUS_TEMPLATE, VISION_TEMPLATE } from "./constants";

export interface ProfileFormProps {
  name: string;
  setName: (v: string) => void;
  gender: "男" | "女";
  setGender: (v: "男" | "女") => void;
  birthDate: string;
  setBirthDate: (v: string) => void;
  birthTime: string;
  setBirthTime: (v: string) => void;
  birthLocation: string;
  setBirthLocation: (v: string) => void;
  currentResidence: string;
  setCurrentResidence: (v: string) => void;
  pastResidences: string;
  setPastResidences: (v: string) => void;
  experienceNarrative: string;
  setExperienceNarrative: (v: string) => void;
  currentStatus: string;
  setCurrentStatus: (v: string) => void;
  futureVision: string;
  setFutureVision: (v: string) => void;
  profileReady: boolean;
  authenticated: boolean;
  onSaveProfile: () => void;
  savingProfile: boolean;
  profileStatus: string;
}

export function ProfileForm({
  name, setName,
  gender, setGender,
  birthDate, setBirthDate,
  birthTime, setBirthTime,
  birthLocation, setBirthLocation,
  currentResidence, setCurrentResidence,
  pastResidences, setPastResidences,
  experienceNarrative, setExperienceNarrative,
  currentStatus, setCurrentStatus,
  futureVision, setFutureVision,
  profileReady,
  authenticated,
  onSaveProfile,
  savingProfile,
  profileStatus
}: ProfileFormProps) {
  return (
    <div className="space-y-4 pt-4 border-t border-gold-line/20 mt-4">
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">姓名</span>
          <input
            type="text"
            value={name}
            onChange={(event) => setName(event.target.value)}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            placeholder="输入姓名"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">性别</span>
          <select
            value={gender}
            onChange={(event) => setGender(event.target.value as "男" | "女")}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          >
            <option value="男">男</option>
            <option value="女">女</option>
          </select>
        </label>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">出生日期</span>
          <input
            type="date"
            value={birthDate}
            onChange={(event) => setBirthDate(event.target.value)}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">出生时刻</span>
          <input
            type="time"
            value={birthTime}
            onChange={(event) => setBirthTime(event.target.value)}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm text-xuanpaper/80">出生地</span>
        <input
          type="text"
          value={birthLocation}
          onChange={(event) => setBirthLocation(event.target.value)}
          className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          placeholder="例如：浙江杭州"
        />
      </label>
      <div className="rounded-sm border border-gold-line/30 bg-xuangray/60 p-3 space-y-1">
        <p className="text-sm text-gold-light">扩展信息（可选）</p>
        <p className="text-xs text-xuanpaper/70">建议补全居住轨迹、经历、现状与愿景，可显著提升推演上下文质量。</p>
      </div>
      <div className="grid gap-3 md:grid-cols-2">
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">现居住地（可选）</span>
          <input
            type="text"
            value={currentResidence}
            onChange={(event) => setCurrentResidence(event.target.value)}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            placeholder="例如：上海"
          />
        </label>
        <label className="block space-y-2">
          <span className="text-sm text-xuanpaper/80">过往居住地（可选）</span>
          <input
            type="text"
            value={pastResidences}
            onChange={(event) => setPastResidences(event.target.value)}
            className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            placeholder="例如：河南鹿邑、新乡、天津、深圳"
          />
        </label>
      </div>
      <label className="block space-y-2">
        <span className="text-sm text-xuanpaper/80">过往经历叙述（可选）</span>
        <textarea
          value={experienceNarrative}
          onChange={(event) => setExperienceNarrative(event.target.value)}
          className="w-full min-h-36 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          placeholder={EXPERIENCE_TEMPLATE}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-xuanpaper/80">现状描述（可选）</span>
        <textarea
          value={currentStatus}
          onChange={(event) => setCurrentStatus(event.target.value)}
          className="w-full min-h-28 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          placeholder={STATUS_TEMPLATE}
        />
      </label>
      <label className="block space-y-2">
        <span className="text-sm text-xuanpaper/80">未来愿景（可选）</span>
        <textarea
          value={futureVision}
          onChange={(event) => setFutureVision(event.target.value)}
          className="w-full min-h-28 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
          placeholder={VISION_TEMPLATE}
        />
      </label>
      <p className="text-sm text-xuanpaper/70">个人底盘完整度：{profileReady ? "已完成" : "未完成"}</p>
      {authenticated ? (
        <div className="flex flex-wrap gap-2">
          <Button type="button" variant="outline" onClick={onSaveProfile} disabled={savingProfile || !profileReady}>
            {savingProfile ? "保存中..." : "保存到我的档案"}
          </Button>
          {profileStatus ? <p className="text-sm text-gold-light">{profileStatus}</p> : null}
        </div>
      ) : null}
    </div>
  );
}
