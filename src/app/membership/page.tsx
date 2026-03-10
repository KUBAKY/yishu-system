"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { Button } from "@/components/ui/Button";
import { Card, CardContent, CardHeader } from "@/components/ui/Card";
import { AuthMeResponse } from "@/types/auth";

export default function MembershipPage() {
  const [auth, setAuth] = useState<AuthMeResponse>({ authenticated: false });
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    fetch("/api/auth/me")
      .then((res) => res.json())
      .then((data) => setAuth(data as AuthMeResponse))
      .catch(() => setAuth({ authenticated: false }))
      .finally(() => setLoading(false));
  }, []);

  const plans = [
    {
      id: "guest",
      title: "游客体验",
      price: "免费",
      features: [
        "每日基础运势",
        "八字/六爻/梅花单次推演",
        "基础AI断语",
        "无历史记录保存",
      ],
      active: !loading && !auth.authenticated,
      buttonText: "当前状态",
      buttonVariant: "outline" as const,
      disabled: true,
    },
    {
      id: "trial",
      title: "新客试用",
      price: "0元 / 3个月",
      features: [
        "全部推演范式（含奇门/风水）",
        "个人档案自动复用",
        "推演历史云端永久保存",
        "每日专属运势日报",
        "专家团多维会诊",
      ],
      active: !loading && auth.authenticated && auth.user.membership === "trial",
      buttonText: auth.authenticated ? (auth.user.membership === "trial" ? "当前生效中" : "仅限新注册") : "注册即送",
      buttonVariant: "primary" as const,
      disabled: auth.authenticated, // If logged in, trial is auto-activated or used
      link: auth.authenticated ? undefined : "/start", // Link to register
    },
    {
      id: "subscriber",
      title: "年度会员",
      price: "¥99 / 年",
      features: [
        "包含试用版全部权益",
        "优先使用高阶推理模型 (o1/R1)",
        "解锁3D风水与相术分析（即将上线）",
        "专属客服支持",
      ],
      active: !loading && auth.authenticated && auth.user.membership === "subscriber",
      buttonText: "立即升级",
      buttonVariant: "primary" as const,
      disabled: false,
      onClick: () => alert("支付网关接入中..."),
    },
  ];

  return (
    <main className="min-h-screen bg-(--color-xuanqing) text-(--color-xuanpaper) px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-8">
        <div className="flex items-center justify-between">
          <h1 className="text-3xl font-song text-(--color-gold-light)">会员权益</h1>
          <Link href="/account">
            <Button variant="outline">返回账号</Button>
          </Link>
        </div>

        <div className="grid gap-6 md:grid-cols-3">
          {plans.map((plan) => (
            <Card 
              key={plan.id} 
              glow={plan.active} 
              className={`relative flex flex-col ${plan.active ? "border-(--color-gold-light) bg-(--color-gold-glow)/5" : ""}`}
            >
              {plan.active && (
                <div className="absolute -top-3 left-1/2 -translate-x-1/2 bg-(--color-gold-light) text-black text-xs px-3 py-1 rounded-full font-bold">
                  当前生效
                </div>
              )}
              <CardHeader>
                <h2 className="text-xl font-song text-(--color-gold-light)">{plan.title}</h2>
                <p className="text-2xl mt-2 font-mono">{plan.price}</p>
              </CardHeader>
              <CardContent className="flex-1 flex flex-col justify-between space-y-6">
                <ul className="space-y-3">
                  {plan.features.map((feature, idx) => (
                    <li key={idx} className="flex items-start gap-2 text-sm text-xuanpaper/80">
                      <span className="text-(--color-gold-light)">✓</span>
                      {feature}
                    </li>
                  ))}
                </ul>
                {plan.link ? (
                  <Link href={plan.link} className="w-full">
                    <Button variant={plan.buttonVariant} className="w-full" disabled={plan.disabled}>
                      {plan.buttonText}
                    </Button>
                  </Link>
                ) : (
                  <Button 
                    variant={plan.buttonVariant} 
                    className="w-full" 
                    disabled={plan.disabled}
                    onClick={plan.onClick}
                  >
                    {plan.buttonText}
                  </Button>
                )}
              </CardContent>
            </Card>
          ))}
        </div>

        <Card>
          <CardContent className="p-6">
            <h3 className="font-song text-(--color-gold-light) mb-2">说明</h3>
            <ul className="list-disc list-inside text-sm text-xuanpaper/70 space-y-1">
              <li>新用户注册即自动激活3个月试用会员。</li>
              <li>试用期结束后，账户将转为“到期态”，可查看历史记录但无法新增推演。</li>
              <li>付费订阅后有效期延长365天，支持无限次推演。</li>
            </ul>
          </CardContent>
        </Card>
      </div>
    </main>
  );
}
