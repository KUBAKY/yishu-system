export interface NamingProfileFormProps {
  childGender: "男" | "女";
  setChildGender: (v: "男" | "女") => void;
  childBirthDate: string;
  setChildBirthDate: (v: string) => void;
  childBirthTime: string;
  setChildBirthTime: (v: string) => void;
  childBirthLocation: string;
  setChildBirthLocation: (v: string) => void;

  fatherName: string;
  setFatherName: (v: string) => void;
  fatherGender: "男" | "女";
  setFatherGender: (v: "男" | "女") => void;
  fatherBirthDate: string;
  setFatherBirthDate: (v: string) => void;
  fatherBirthTime: string;
  setFatherBirthTime: (v: string) => void;

  motherName: string;
  setMotherName: (v: string) => void;
  motherGender: "男" | "女";
  setMotherGender: (v: "男" | "女") => void;
  motherBirthDate: string;
  setMotherBirthDate: (v: string) => void;
  motherBirthTime: string;
  setMotherBirthTime: (v: string) => void;

  namingReady: boolean;
}

export function NamingProfileForm({
  childGender,
  setChildGender,
  childBirthDate,
  setChildBirthDate,
  childBirthTime,
  setChildBirthTime,
  childBirthLocation,
  setChildBirthLocation,
  fatherName,
  setFatherName,
  fatherGender,
  setFatherGender,
  fatherBirthDate,
  setFatherBirthDate,
  fatherBirthTime,
  setFatherBirthTime,
  motherName,
  setMotherName,
  motherGender,
  setMotherGender,
  motherBirthDate,
  setMotherBirthDate,
  motherBirthTime,
  setMotherBirthTime,
  namingReady,
}: NamingProfileFormProps) {
  return (
    <div className="space-y-5 pt-4 border-t border-gold-line/20 mt-4">
      <div className="rounded-sm border border-gold-line/30 bg-xuangray/60 p-3 space-y-1">
        <p className="text-sm text-gold-light">五行取名只采集生辰信息</p>
        <p className="text-xs text-xuanpaper/70">孩子姓名不采集，父母出生时间可选但建议填写以提高准确度。</p>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-xuanpaper/80">孩子信息</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">性别</span>
            <select
              value={childGender}
              onChange={(event) => setChildGender(event.target.value as "男" | "女")}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            >
              <option value="男">男</option>
              <option value="女">女</option>
            </select>
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">出生日期</span>
            <input
              type="date"
              value={childBirthDate}
              onChange={(event) => setChildBirthDate(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
        </div>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">出生时间（可选）</span>
            <input
              type="time"
              value={childBirthTime}
              onChange={(event) => setChildBirthTime(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">出生地点</span>
            <input
              type="text"
              value={childBirthLocation}
              onChange={(event) => setChildBirthLocation(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
              placeholder="例如：浙江杭州"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-xuanpaper/80">父亲信息</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">姓名</span>
            <input
              type="text"
              value={fatherName}
              onChange={(event) => setFatherName(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">性别</span>
            <select
              value={fatherGender}
              onChange={(event) => setFatherGender(event.target.value as "男" | "女")}
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
              value={fatherBirthDate}
              onChange={(event) => setFatherBirthDate(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">出生时间（可选）</span>
            <input
              type="time"
              value={fatherBirthTime}
              onChange={(event) => setFatherBirthTime(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
        </div>
      </div>

      <div className="space-y-3">
        <p className="text-sm text-xuanpaper/80">母亲信息</p>
        <div className="grid gap-3 md:grid-cols-2">
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">姓名</span>
            <input
              type="text"
              value={motherName}
              onChange={(event) => setMotherName(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">性别</span>
            <select
              value={motherGender}
              onChange={(event) => setMotherGender(event.target.value as "男" | "女")}
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
              value={motherBirthDate}
              onChange={(event) => setMotherBirthDate(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
          <label className="block space-y-2">
            <span className="text-sm text-xuanpaper/80">出生时间（可选）</span>
            <input
              type="time"
              value={motherBirthTime}
              onChange={(event) => setMotherBirthTime(event.target.value)}
              className="w-full min-h-11 rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
          </label>
        </div>
      </div>

      <p className="text-sm text-xuanpaper/70">命名信息完整度：{namingReady ? "已完成" : "未完成"}</p>
    </div>
  );
}
