"use client";

import Link from "next/link";
import { useCallback, useEffect, useMemo, useState } from "react";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { YishuCase } from "@/types/case";
import { Button } from "@/components/ui/Button";
import { AuthMeResponse } from "@/types/auth";
import { AuthPanel } from "@/components/auth";

type CasesResponse = {
  cases: YishuCase[];
};

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
  const [keyword, setKeyword] = useState<string>("");
  const [paradigmFilter, setParadigmFilter] = useState<string>("all");
  const [timeFilter, setTimeFilter] = useState<string>("all");

  function handleAuthChange(newAuth: AuthMeResponse) {
    setAuth(newAuth);
    if (!newAuth.authenticated) {
      setCases([]);
      setSelectedId("");
    }
  }

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
    <main className="min-h-screen bg-xuanqing text-xuanpaper px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        <div className="flex items-center justify-between gap-3">
          <h1 className="text-3xl font-song text-gold-light">推演案例库</h1>
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
            <h2 className="text-lg font-song text-gold-light">账号状态</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <AuthPanel
              auth={auth}
              authLoading={authLoading}
              onAuthChange={handleAuthChange}
              guestMessage="当前为游客态：请登录后查看和沉淀个人推演历史。"
              successMessage="登录成功，历史记录已解锁"
            />
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
              <h2 className="text-lg font-song text-gold-light">最近推演</h2>
            </CardHeader>
            <CardContent className="space-y-3">
              <div className="space-y-2">
                <input
                  type="text"
                  value={keyword}
                  onChange={(event) => setKeyword(event.target.value)}
                  placeholder="搜索关键词"
                  className="w-full rounded-sm bg-xuangray border border-gold-line/30 px-3 py-2 outline-none focus:border-gold-light"
                />
                <select
                  value={paradigmFilter}
                  onChange={(event) => setParadigmFilter(event.target.value)}
                  className="w-full rounded-sm bg-xuangray border border-gold-line/30 px-3 py-2 outline-none focus:border-gold-light"
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
                  className="w-full rounded-sm bg-xuangray border border-gold-line/30 px-3 py-2 outline-none focus:border-gold-light"
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
                      ? "border-gold-light bg-gold-glow/10"
                      : "border-gold-line/30 hover:border-gold-line/60"
                  }`}
                >
                  <p className="text-sm text-gold-light">{item.paradigmLabel}</p>
                  <p className="text-sm line-clamp-2 mt-1">{item.question}</p>
                  <p className="text-xs text-xuanpaper/60 mt-2">{formatTime(item.createdAt)}</p>
                </button>
              ))}
            </CardContent>
          </Card>

          <Card glow>
            <CardHeader>
              <h2 className="text-lg font-song text-gold-light">案例详情</h2>
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
                    <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
                      <h3 className="font-song text-gold-light">古籍引证</h3>
                      {selected.citations.map((item) => (
                        <p key={`${item.title}-${item.chapter}`} className="text-sm leading-7 text-xuanpaper/80">
                          《{item.title}》{item.chapter}：{item.quote}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {selected.foundations && selected.foundations.length > 0 ? (
                    <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
                      <h3 className="font-song text-gold-light">开源能力底座</h3>
                      {selected.foundations.map((item) => (
                        <p key={item.id} className="text-sm leading-7 text-xuanpaper/80">
                          {item.name} · {item.purpose} · {item.integration === "direct" ? "直接集成" : "参考转译"} · 置信{item.confidence}
                        </p>
                      ))}
                    </div>
                  ) : null}
                  {selected.aiEnhancements && selected.aiEnhancements.length > 0 ? (
                    <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4 space-y-2">
                      <h3 className="font-song text-gold-light">AI增强能力</h3>
                      <p className="text-sm leading-7 text-xuanpaper/80">{selected.aiEnhancements.join("、")}</p>
                    </div>
                  ) : null}
                  <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
                    <h3 className="font-song text-gold-light">提问</h3>
                    <p className="leading-8 whitespace-pre-wrap mt-2">{selected.question}</p>
                  </div>
                  <div className="rounded-sm border border-gold-line/30 bg-xuangray/70 p-4">
                    <h3 className="font-song text-gold-light">推演输出</h3>
                    <div className="mt-4 space-y-6">
                      {selected.result.split(/(?=【)/).map((section, idx) => {
                        const titleMatch = section.match(/^【(.*?)】/);
                        if (titleMatch) {
                          const title = titleMatch[1];
                          const content = section.replace(/^【.*?】/, "").trim();
                          return (
                            <div key={idx} className="space-y-2">
                              <div className="flex items-center gap-2 mb-3 bg-xuangray/70 p-2 rounded-lg border border-white/5">
                                <div className="h-6 w-1 rounded-full bg-gold-light/60" />
                                {title}
                              </div>
                              <div className="rounded-full bg-xuangray/70 p-2 border border-white/5 group-hover:border-[var(--color-gold-line)]/30 transition-colors">
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
