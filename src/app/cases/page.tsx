"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { YishuCase } from "@/types/case";
import { AuthMeResponse, AuthUser } from "@/types/auth";

type CasesResponse = {
  cases: YishuCase[];
};

type SendCodeResponse = { ok: true; devCode?: string } | { error: string };
type AuthResponse = { authenticated: true; user: AuthUser } | { error: string };
type AuthMode = "register" | "login";

function formatTime(value: string) {
  const date = new Date(value);
  if (Number.isNaN(date.getTime())) {
    return value;
  }
  return date.toLocaleString("zh-CN", { hour12: false });
}

export default function CasesPage() {
  const [cases, setCases] = useState<YishuCase[]>([]);
  const [selectedId, setSelectedId] = useState<string>("");
  const [loading, setLoading] = useState<boolean>(true);
  const [error, setError] = useState<string>("");
  const [auth, setAuth] = useState<AuthMeResponse>({ authenticated: false });
  const [authLoading, setAuthLoading] = useState<boolean>(true);
  const [authMode, setAuthMode] = useState<AuthMode>("login");
  const [phone, setPhone] = useState<string>("");
  const [smsCode, setSmsCode] = useState<string>("");
  const [registerPassword, setRegisterPassword] = useState<string>("");
  const [confirmPassword, setConfirmPassword] = useState<string>("");
  const [loginPassword, setLoginPassword] = useState<string>("");
  const [authMessage, setAuthMessage] = useState<string>("");
  const [sendingCode, setSendingCode] = useState<boolean>(false);
  const [registering, setRegistering] = useState<boolean>(false);
  const [loggingIn, setLoggingIn] = useState<boolean>(false);
  const [keyword, setKeyword] = useState<string>("");
  const [paradigmFilter, setParadigmFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  const canSendCode = phone.trim().length === 11 && !sendingCode;
  const canRegister =
    phone.trim().length === 11 &&
    smsCode.trim().length === 6 &&
    registerPassword.trim().length >= 6 &&
    registerPassword === confirmPassword &&
    !registering;
  const loginBlockedReason =
    phone.trim().length !== 11
      ? "请输入11位手机号"
      : loginPassword.trim().length < 6
        ? "密码至少6位"
          : "";
  const canLogin = loginBlockedReason.length === 0 && !loggingIn;

  async function loadAuthState() {
    setAuthLoading(true);
    try {
      const response = await fetch("/api/auth/me", { cache: "no-store" });
      const data = (await response.json()) as AuthMeResponse;
      setAuth(data);
    } catch {
      setAuth({ authenticated: false });
    } finally {
      setAuthLoading(false);
    }
  }

  const loadCases = useCallback(async () => {
    if (!auth.authenticated) {
      setCases([]);
      setSelectedId("");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError("");
    try {
      const response = await fetch("/api/cases", { cache: "no-store" });
      const data = (await response.json()) as CasesResponse | { error: string };
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "加载失败");
      }
      setCases(data.cases);
      setSelectedId((prev) => prev || data.cases[0]?.id || "");
    } catch (loadError) {
      setError(loadError instanceof Error ? loadError.message : "加载失败");
    } finally {
      setLoading(false);
    }
  }, [auth.authenticated]);

  useEffect(() => {
    void loadAuthState();
  }, []);

  useEffect(() => {
    if (!authLoading) {
      void loadCases();
    }
  }, [authLoading, loadCases]);

  async function onSendCode() {
    setAuthMessage("");
    setSendingCode(true);
    try {
      const response = await fetch("/api/auth/send-code", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone }),
      });
      const data = (await response.json()) as SendCodeResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "发送失败");
      }
      const message = data.devCode
        ? `验证码已发送（开发环境验证码：${data.devCode}）`
        : "验证码已发送，请查收短信";
      setAuthMessage(message);
    } catch (sendError) {
      setAuthMessage(sendError instanceof Error ? sendError.message : "发送失败");
    } finally {
      setSendingCode(false);
    }
  }

  function switchAuthMode(mode: AuthMode) {
    setAuthMode(mode);
    setAuthMessage("");
    setSmsCode("");
    setRegisterPassword("");
    setConfirmPassword("");
    setLoginPassword("");
  }

  async function onRegister() {
    setAuthMessage("");
    setRegistering(true);
    try {
      const response = await fetch("/api/auth/register", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, code: smsCode, password: registerPassword }),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "注册失败");
      }
      setAuth({ authenticated: true, user: data.user });
      setSmsCode("");
      setRegisterPassword("");
      setConfirmPassword("");
      setAuthMessage("注册成功，历史记录已解锁");
    } catch (verifyError) {
      setAuthMessage(verifyError instanceof Error ? verifyError.message : "注册失败");
    } finally {
      setRegistering(false);
    }
  }

  async function onLogin() {
    setAuthMessage("");
    setLoggingIn(true);
    try {
      const response = await fetch("/api/auth/login", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ phone, password: loginPassword }),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "登录失败");
      }
      setAuth({ authenticated: true, user: data.user });
      setLoginPassword("");
      setAuthMessage("登录成功，历史记录已解锁");
    } catch (loginError) {
      setAuthMessage(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoggingIn(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    setAuth({ authenticated: false });
    setCases([]);
    setSelectedId("");
    setAuthMessage("");
  }

  const paradigmOptions = useMemo(() => {
    const names = new Set<string>();
    for (const item of cases) {
      names.add(item.paradigmLabel);
    }
    return ["all", ...Array.from(names)];
  }, [cases]);

  const filteredCases = useMemo(() => {
    const query = keyword.trim().toLowerCase();
    const now = Date.now();
    return cases.filter((item) => {
      if (paradigmFilter !== "all" && item.paradigmLabel !== paradigmFilter) {
        return false;
      }
      if (timeFilter !== "all") {
        const diff = now - new Date(item.createdAt).getTime();
        const oneDay = 24 * 60 * 60 * 1000;
        if (timeFilter === "7d" && diff > oneDay * 7) {
          return false;
        }
        if (timeFilter === "30d" && diff > oneDay * 30) {
          return false;
        }
      }
      if (!query) {
        return true;
      }
      return `${item.question}\n${item.result}\n${item.paradigmLabel}`.toLowerCase().includes(query);
    });
  }, [cases, keyword, paradigmFilter, timeFilter]);

  const selected = useMemo(
    () => filteredCases.find((item) => item.id === selectedId) ?? filteredCases[0] ?? null,
    [filteredCases, selectedId],
  );

  useEffect(() => {
    if (!selected) {
      setSelectedId("");
      return;
    }
    if (selected.id !== selectedId) {
      setSelectedId(selected.id);
    }
  }, [selected, selectedId]);

  return (
    <main className="min-h-screen bg-(--color-xuanqing) text-(--color-xuanpaper) px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-song text-(--color-gold-light)">推演案例库</h1>
          <div className="flex gap-2">
            <Link href="/account">
              <Button variant="outline">账号中心</Button>
            </Link>
            <Button
              variant="outline"
              onClick={() => void loadCases()}
              disabled={loading || authLoading || !auth.authenticated}
            >
              {loading ? "刷新中..." : "刷新"}
            </Button>
          </div>
        </div>

        <Card>
          <CardHeader>
            <h2 className="text-lg font-song text-(--color-gold-light)">账号状态</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            {authLoading ? <p className="text-sm text-xuanpaper/70">状态加载中...</p> : null}
            {!authLoading && !auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">当前为游客态：请登录后查看和沉淀个人推演历史。</p>
                <div className="flex gap-2">
                  <Button
                    variant={authMode === "login" ? "primary" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => switchAuthMode("login")}
                  >
                    密码登录
                  </Button>
                  <Button
                    variant={authMode === "register" ? "primary" : "outline"}
                    size="sm"
                    type="button"
                    onClick={() => switchAuthMode("register")}
                  >
                    注册账号
                  </Button>
                </div>
                <div className="grid gap-3 md:grid-cols-2">
                  <input
                    type="text"
                    value={phone}
                    onChange={(event) => setPhone(event.target.value.trim())}
                    placeholder="输入手机号"
                    className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                  />
                  {authMode === "login" ? (
                    <input
                      type="password"
                      value={loginPassword}
                      onChange={(event) => setLoginPassword(event.target.value)}
                      placeholder="登录密码"
                      className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                    />
                  ) : (
                    <div className="flex gap-2">
                      <input
                        type="text"
                        value={smsCode}
                        onChange={(event) => setSmsCode(event.target.value.trim())}
                        placeholder="短信验证码"
                        className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                      <Button variant="outline" onClick={onSendCode} disabled={!canSendCode}>
                        {sendingCode ? "发送中" : "发码"}
                      </Button>
                    </div>
                  )}
                </div>
                {authMode === "register" ? (
                  <>
                    <div className="grid gap-3 md:grid-cols-2">
                      <input
                        type="password"
                        value={registerPassword}
                        onChange={(event) => setRegisterPassword(event.target.value)}
                        placeholder="设置登录密码（6-64位）"
                        className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                      <input
                        type="password"
                        value={confirmPassword}
                        onChange={(event) => setConfirmPassword(event.target.value)}
                        placeholder="确认登录密码"
                        className="rounded-sm bg-(--color-xuangray) border border-gold-line/40 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                      />
                    </div>
                    <p className="text-xs text-xuanpaper/60">开发期短信验证码为占位验证，线上可接真实短信网关。</p>
                    <Button variant="primary" onClick={onRegister} disabled={!canRegister}>
                      {registering ? "注册中..." : "注册并登录"}
                    </Button>
                  </>
                ) : (
                  <>
                    <Button variant="primary" onClick={onLogin} disabled={!canLogin}>
                      {loggingIn ? "登录中..." : "手机号密码登录"}
                    </Button>
                    {loginBlockedReason ? <p className="text-xs text-xuanpaper/60">{loginBlockedReason}</p> : null}
                  </>
                )}
              </>
            ) : null}
            {!authLoading && auth.authenticated ? (
              <>
                <p className="text-sm text-xuanpaper/70">手机号：{auth.user.phone}</p>
                <p className="text-sm text-xuanpaper/70">
                  权限：{auth.user.membership === "trial" ? "试用中" : null}
                  {auth.user.membership === "subscriber" ? "订阅中" : null}
                  {auth.user.membership === "expired" ? "试用已结束（可查看历史，不可新增）" : null}
                </p>
                <Button variant="outline" onClick={onLogout}>
                  退出登录
                </Button>
              </>
            ) : null}
            {authMessage ? <p className="text-sm text-(--color-gold-light)">{authMessage}</p> : null}
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardContent className="text-sm text-red-300 pt-5">{error}</CardContent>
          </Card>
        ) : null}

        <div className="grid gap-6 md:grid-cols-[320px_1fr]">
          <Card glow className="h-fit">
            <CardHeader>
              <h2 className="text-lg font-song text-(--color-gold-light)">最近推演</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索关键词"
                  className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/30 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                />
                <select
                  value={paradigmFilter}
                  onChange={(event) => setParadigmFilter(event.target.value)}
                  className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/30 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                >
                  {paradigmOptions.map((item) => (
                    <option key={item} value={item}>
                      {item === "all" ? "全部范式" : item}
                    </option>
                  ))}
                </select>
                <select
                  value={timeFilter}
                  onChange={(event) => setTimeFilter(event.target.value)}
                  className="w-full rounded-sm bg-(--color-xuangray) border border-gold-line/30 px-3 py-2 outline-none focus:border-(--color-gold-light)"
                >
                  <option value="all">全部时间</option>
                  <option value="7d">近7天</option>
                  <option value="30d">近30天</option>
                </select>
              </div>
              {!loading && filteredCases.length === 0 ? (
                <p className="text-sm text-xuanpaper/70">
                  {auth.authenticated ? "暂无匹配案例，请调整筛选条件。" : "请先登录后查看个人案例。"}
                </p>
              ) : null}
              {filteredCases.map((item) => (
                <button
                  key={item.id}
                  type="button"
                  onClick={() => setSelectedId(item.id)}
                  className={`w-full text-left rounded-sm border px-3 py-3 transition-colors ${
                    selected?.id === item.id
                      ? "border-(--color-gold-light) bg-(--color-gold-glow)/10"
                      : "border-gold-line/30 hover:border-gold-line/60"
                  }`}
                >
                  <p className="text-sm text-(--color-gold-light)">{item.paradigmLabel}</p>
                  <p className="text-sm line-clamp-2 mt-1">{item.question}</p>
                  <p className="text-xs text-xuanpaper/60 mt-2">{formatTime(item.createdAt)}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader>
              <h2 className="text-lg font-song text-(--color-gold-light)">案例详情</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              {!selected ? (
                <p className="text-sm text-xuanpaper/70">请选择左侧案例查看详情。</p>
              ) : (
                <>
                  <p className="text-sm text-xuanpaper/70">范式：{selected.paradigmLabel}</p>
                  <p className="text-sm text-xuanpaper/70">时间：{formatTime(selected.currentTime)}</p>
                  <p className="text-sm text-xuanpaper/70">地点：{selected.location || "未填写"}</p>
                  <p className="text-sm text-xuanpaper/70">模型：{selected.model}</p>
                  <p className="text-sm text-xuanpaper/70">参考实现：{selected.reference}</p>
                  {selected.lunarContext ? (
                    <p className="text-sm text-xuanpaper/70">
                      历法：{selected.lunarContext.solarDate} / {selected.lunarContext.lunarDate} /{" "}
                      {selected.lunarContext.ganzhi}
                    </p>
                  ) : null}
                  {selected.citations.length > 0 ? (
                    <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                      <h3 className="font-song text-(--color-gold-light)">古籍引证</h3>
                      {selected.citations.map((item) => (
                        <p key={`${item.title}-${item.chapter}`} className="text-sm leading-7 text-xuanpaper/80">
                          《{item.title}》{item.chapter}：{item.quote}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {selected.foundations && selected.foundations.length > 0 ? (
                    <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                      <h3 className="font-song text-(--color-gold-light)">开源能力底座</h3>
                      {selected.foundations.map((item) => (
                        <p key={item.id} className="text-sm leading-7 text-xuanpaper/80">
                          {item.name} · {item.purpose} · {item.integration === "direct" ? "直接集成" : "参考转译"} · 置信{item.confidence}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {selected.aiEnhancements && selected.aiEnhancements.length > 0 ? (
                    <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4 space-y-2">
                      <h3 className="font-song text-(--color-gold-light)">AI增强能力</h3>
                      <p className="text-sm leading-7 text-xuanpaper/80">{selected.aiEnhancements.join("、")}</p>
                    </div>
                  ) : null}
                  <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                    <h3 className="font-song text-(--color-gold-light)">提问</h3>
                    <p className="leading-8 whitespace-pre-wrap mt-2">{selected.question}</p>
                  </div>
                  <div className="rounded-sm border border-gold-line/30 bg-(--color-xuangray)/70 p-4">
                    <h3 className="font-song text-(--color-gold-light)">推演输出</h3>
                    <div className="mt-4 space-y-6">
                      {selected.result.split(/(?=【)/).map((section, idx) => {
                        const titleMatch = section.match(/^【(.*?)】/);
                        if (titleMatch) {
                          const title = titleMatch[1];
                          const content = section.replace(/^【.*?】/, "").trim();
                          return (
                            <div key={idx} className="space-y-2">
                              <h4 className="flex items-center gap-2 text-sm font-bold text-(--color-gold-light)">
                                <span className="h-1.5 w-1.5 rounded-full bg-(--color-gold-light)/60" />
                                {title}
                              </h4>
                              <div className="pl-3.5 text-sm leading-7 text-xuanpaper/85 whitespace-pre-wrap border-l border-gold-line/10">
                                {content}
                              </div>
                            </div>
                          );
                        }
                        return (
                          <p key={idx} className="text-sm leading-7 text-xuanpaper/85 whitespace-pre-wrap">
                            {section}
                          </p>
                        );
                      })}
                    </div>
                  </div>
                </>
              )}
            </CardContent>
          </Card>
        </div>

        <div className="flex gap-3">
          <Link href="/start">
            <Button variant="primary">去做新推演</Button>
          </Link>
          <Link href="/account">
            <Button variant="outline">账号中心</Button>
          </Link>
          <Link href="/">
            <Button variant="outline">返回首页</Button>
          </Link>
        </div>
      </div>
    </main>
  );
}
