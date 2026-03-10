"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AuthUser, UserProfile } from "@/types/auth";
import { YishuCase } from "@/types/case";

type ProfileHistoryItem = {
  id: string;
  userId: string;
  profile: UserProfile;
  createdAt: string;
};

type AuthWithHistoryResponse =
  | { authenticated: false }
  | { authenticated: true; user: AuthUser; profileHistory?: ProfileHistoryItem[] };

type CasesResponse = { cases: YishuCase[] } | { error: string };
type SaveProfileResponse = { authenticated: true; user: AuthUser } | { error: string };

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

export default function AccountPage() {
  const [auth, setAuth] = useState<AuthWithHistoryResponse>({ authenticated: false });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [cases, setCases] = useState<YishuCase[]>([]);
  const [casesLoading, setCasesLoading] = useState<boolean>(true);
  const [message, setMessage] = useState<string>("");
  const [savingProfile, setSavingProfile] = useState<boolean>(false);

  const [name, setName] = useState<string>("");
  const [gender, setGender] = useState<"男" | "女">("男");
  const [birthDate, setBirthDate] = useState<string>("");
  const [birthTime, setBirthTime] = useState<string>("");
  const [birthLocation, setBirthLocation] = useState<string>("");
  const [currentResidence, setCurrentResidence] = useState<string>("");
  const [pastResidences, setPastResidences] = useState<string>("");
  const [experienceNarrative, setExperienceNarrative] = useState<string>("");
  const [currentStatus, setCurrentStatus] = useState<string>("");
  const [futureVision, setFutureVision] = useState<string>("");

  const profileReady =
    name.trim().length >= 2 &&
    birthDate.length > 0 &&
    /^\d{2}:\d{2}$/.test(birthTime.trim()) &&
    birthLocation.trim().length >= 2;

  const profileHistory = auth.authenticated ? auth.profileHistory ?? [] : [];

  const caseStats = useMemo(() => {
    const total = cases.length;
    const paradigmMap = new Map<string, number>();
    for (const item of cases) {
      paradigmMap.set(item.paradigmLabel, (paradigmMap.get(item.paradigmLabel) ?? 0) + 1);
    }
    const topParadigm = [...paradigmMap.entries()].sort((a, b) => b[1] - a[1])[0]?.[0] ?? "暂无";
    return { total, topParadigm };
  }, [cases]);

  const applyProfile = useCallback((profile: UserProfile) => {
    setName(profile.name);
    setGender(profile.gender);
    setBirthDate(profile.birthDate);
    setBirthTime(profile.birthTime);
    setBirthLocation(profile.birthLocation);
    setCurrentResidence(profile.currentResidence ?? "");
    setPastResidences(profile.pastResidences ?? "");
    setExperienceNarrative(profile.experienceNarrative ?? "");
    setCurrentStatus(profile.currentStatus ?? "");
    setFutureVision(profile.futureVision ?? "");
  }, []);

  const loadAuth = useCallback(async () => {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/me?history=1", { cache: "no-store" });
      const data = (await response.json()) as AuthWithHistoryResponse;
      setAuth(data);
      if (data.authenticated && data.user.profile) {
        applyProfile(data.user.profile);
      }
    } catch {
      setAuth({ authenticated: false });
    } finally {
      setAuthLoading(false);
    }
  }, [applyProfile]);

  const loadCases = useCallback(async () => {
    setCasesLoading(true);
    try {
      const response = await fetch("/api/cases", { cache: "no-store" });
      const data = (await response.json()) as CasesResponse;
      if (!response.ok || "error" in data) {
        setCases([]);
        return;
      }
      setCases(data.cases);
    } catch {
      setCases([]);
    } finally {
      setCasesLoading(false);
    }
  }, []);

  useEffect(() => {
    void loadAuth();
    void loadCases();
  }, [loadAuth, loadCases]);

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth({ authenticated: false });
    setCases([]);
    setMessage("");
  }

  async function onSaveProfile() {
    setMessage("");
    if (!auth.authenticated) {
      setMessage("请先登录");
      return;
    }
    if (!profileReady) {
      setMessage("请补全姓名、生辰与出生地");
      return;
    }
    setSavingProfile(true);
    const profile: UserProfile = {
      name: name.trim(),
      gender,
      birthDate: birthDate.trim(),
      birthTime: birthTime.trim(),
      birthLocation: birthLocation.trim(),
      ...(currentResidence.trim() ? { currentResidence: currentResidence.trim() } : {}),
      ...(pastResidences.trim() ? { pastResidences: pastResidences.trim() } : {}),
      ...(experienceNarrative.trim() ? { experienceNarrative: experienceNarrative.trim() } : {}),
      ...(currentStatus.trim() ? { currentStatus: currentStatus.trim() } : {}),
      ...(futureVision.trim() ? { futureVision: futureVision.trim() } : {}),
    };
    try {
      const response = await fetch("/api/auth/me", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ profile }),
      });
      const data = (await response.json()) as SaveProfileResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "保存失败");
      }
      setAuth((prev) => (prev.authenticated ? { ...prev, user: data.user } : prev));
      setMessage("档案已保存");
      await loadAuth();
    } catch (error) {
      setMessage(error instanceof Error ? error.message : "保存失败");
    } finally {
      setSavingProfile(false);
    }
  }

  return (
    <main className="min-h-screen bg-(--color-xuanqing) text-(--color-xuanpaper) px-6 py-12">
      <div className="max-w-6xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-song text-(--color-gold-light)">账号中心</h1>
          <div className="flex gap-2">
            <Link href="/start">
              <Button variant="outline">今日推演</Button>
            </Link>
            <Link href="/cases">
              <Button variant="outline">案例库</Button>
            </Link>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-song text-(--color-gold-light)">登录状态</h2>
          </CardHeader>
          <CardContent className="space-y-2">
            {authLoading ? <p className="text-sm text-xuanpaper/70">加载中...</p> : null}
            {!authLoading && !auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">未登录，暂不可查看账号数据。</p>
                <div className="flex gap-2">
                  <Link href="/start">
                    <Button variant="primary">去登录</Button>
                  </Link>
                  <Link href="/cases">
                    <Button variant="outline">去案例库</Button>
                  </Link>
                </div>
              </>
            ) : null}
            {!authLoading && auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">手机号：{auth.user.phone}</p>
                <p className="text-sm text-xuanpaper/70">
                  权限：{auth.user.membership === "trial" ? "试用中" : auth.user.membership === "subscriber" ? "订阅中" : "已过期"}
                </p>
                <p className="text-sm text-xuanpaper/70">最近推演：{caseStats.total} 条</p>
                <p className="text-sm text-xuanpaper/70">常用范式：{caseStats.topParadigm}</p>
                <div className="pt-2 flex gap-3">
                  <Link href="/start">
                    <Button variant="primary" size="sm">以此档案发起新推演</Button>
                  </Link>
                  <Button variant="outline" size="sm" onClick={onLogout}>退出登录</Button>
                </div>
              </>
            ) : null}
          </CardContent>
        </Card>

        <div className="grid gap-6 lg:grid-cols-[1.4fr_1fr]">
          <Card glow>
            <CardHeader>
              <h2 className="text-lg font-song text-(--color-gold-light)">个人档案</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="grid gap-3 md:grid-cols-2">
                <input
                  type="text"
                  value={name}
                  onChange={(event) => setName(event.target.value)}
                  placeholder="姓名"
                  className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                />
                <select
                  value={gender}
                  onChange={(event) => setGender(event.target.value as "男" | "女")}
                  className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                >
                  <option value="男">男</option>
                  <option value="女">女</option>
                </select>
              </div>
              <div className="grid gap-3 md:grid-cols-3">
                <input
                  type="date"
                  value={birthDate}
                  onChange={(event) => setBirthDate(event.target.value)}
                  className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                />
                <input
                  type="time"
                  value={birthTime}
                  onChange={(event) => setBirthTime(event.target.value)}
                  className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                />
                <input
                  type="text"
                  value={birthLocation}
                  onChange={(event) => setBirthLocation(event.target.value)}
                  placeholder="出生地"
                  className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                />
              </div>
              <input
                type="text"
                value={currentResidence}
                onChange={(event) => setCurrentResidence(event.target.value)}
                placeholder="现居住地"
                className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
              />
              <input
                type="text"
                value={pastResidences}
                onChange={(event) => setPastResidences(event.target.value)}
                placeholder="过往居住地（逗号分隔）"
                className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
              />
              <textarea
                value={experienceNarrative}
                onChange={(event) => setExperienceNarrative(event.target.value)}
                placeholder="过往经历"
                rows={4}
                className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
              />
              <textarea
                value={currentStatus}
                onChange={(event) => setCurrentStatus(event.target.value)}
                placeholder="当前状态"
                rows={3}
                className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
              />
              <textarea
                value={futureVision}
                onChange={(event) => setFutureVision(event.target.value)}
                placeholder="未来愿景"
                rows={3}
                className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
              />
              <div className="flex items-center justify-between">
                <p className="text-xs text-xuanpaper/60">{profileReady ? "档案已达可保存标准" : "请补全必填档案"}</p>
                <Button variant="primary" onClick={onSaveProfile} disabled={savingProfile || !auth.authenticated}>
                  {savingProfile ? "保存中..." : "保存档案"}
                </Button>
              </div>
              {message ? <p className="text-sm text-(--color-gold-light)">{message}</p> : null}
            </CardContent>
          </Card>

          <div className="space-y-6">
            <Card glow>
              <CardHeader>
                <h2 className="text-lg font-song text-(--color-gold-light)">档案版本记录</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                {profileHistory.length === 0 ? <p className="text-sm text-xuanpaper/70">暂无版本记录</p> : null}
                {profileHistory.map((item) => (
                  <button
                    key={item.id}
                    type="button"
                    onClick={() => applyProfile(item.profile)}
                    className="w-full text-left rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 px-3 py-3 hover:border-gold-line/60"
                  >
                    <p className="text-sm text-(--color-gold-light)">{formatTime(item.createdAt)}</p>
                    <p className="text-xs text-xuanpaper/70 mt-1">
                      {item.profile.name || "未命名"} · {item.profile.birthDate || "未知日期"} {item.profile.birthTime || ""}
                    </p>
                  </button>
                ))}
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <h2 className="text-lg font-song text-(--color-gold-light)">最近推演</h2>
              </CardHeader>
              <CardContent className="space-y-2">
                {casesLoading ? <p className="text-sm text-xuanpaper/70">加载中...</p> : null}
                {!casesLoading && cases.length === 0 ? <p className="text-sm text-xuanpaper/70">暂无推演记录</p> : null}
                {cases.slice(0, 8).map((item) => (
                  <Link key={item.id} href="/cases" className="block rounded-sm border border-gold-line/30 px-3 py-2 hover:border-gold-line/60">
                    <p className="text-sm text-(--color-gold-light)">{item.paradigmLabel}</p>
                    <p className="text-xs text-xuanpaper/70 line-clamp-2">{item.question}</p>
                    <p className="text-xs text-xuanpaper/50 mt-1">{formatTime(item.createdAt)}</p>
                  </Link>
                ))}
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </main>
  );
}
