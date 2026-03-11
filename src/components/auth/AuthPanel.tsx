"use client";

import { useState } from "react";
import { Button } from "@/components/ui/Button";
import { AuthMeResponse } from "@/types/auth";
import { SendCodeResponse, AuthResponse, AuthMode } from "@/types/api-responses";

interface AuthPanelProps {
  auth: AuthMeResponse;
  authLoading?: boolean;
  onAuthChange: (auth: AuthMeResponse) => void;
  guestMessage?: string;
  successMessage?: string;
  authenticatedActions?: React.ReactNode;
}

export function AuthPanel({
  auth,
  authLoading = false,
  onAuthChange,
  guestMessage = "当前为游客态：请登录后以获取完整功能。",
  successMessage = "登录成功",
  authenticatedActions,
}: AuthPanelProps) {
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

  const smsDisabled = process.env.NODE_ENV !== "production";
  const canSendCode = !smsDisabled && phone.trim().length === 11 && !sendingCode;
  const canRegister =
    phone.trim().length === 11 &&
    registerPassword.trim().length >= 6 &&
    registerPassword === confirmPassword &&
    (smsDisabled || smsCode.trim().length === 6) &&
    !registering;
  const loginBlockedReason =
    phone.trim().length !== 11
      ? "请输入11位手机号"
      : loginPassword.trim().length < 6
        ? "密码至少6位"
          : "";
  const canLogin = loginBlockedReason.length === 0 && !loggingIn;

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
        body: JSON.stringify(smsDisabled ? { phone, password: registerPassword } : { phone, code: smsCode, password: registerPassword }),
      });
      const data = (await response.json()) as AuthResponse;
      if (!response.ok || "error" in data) {
        throw new Error("error" in data ? data.error : "注册失败");
      }
      onAuthChange({ authenticated: true, user: data.user });
      setSmsCode("");
      setRegisterPassword("");
      setConfirmPassword("");
      setAuthMessage(successMessage);
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
      onAuthChange({ authenticated: true, user: data.user });
      setLoginPassword("");
      setAuthMessage(successMessage);
    } catch (loginError) {
      setAuthMessage(loginError instanceof Error ? loginError.message : "登录失败");
    } finally {
      setLoggingIn(false);
    }
  }

  async function onLogout() {
    await fetch("/api/auth/logout", { method: "POST" });
    onAuthChange({ authenticated: false });
    setAuthMessage("");
  }

  if (authLoading) {
    return <p className="text-sm text-xuanpaper/70">状态加载中...</p>;
  }

  return (
    <div className="space-y-3">
      {!auth.authenticated ? (
        <>
          <p className="text-sm text-xuanpaper/70">{guestMessage}</p>
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
              className="rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
            />
            {authMode === "login" ? (
              <input
                type="password"
                value={loginPassword}
                onChange={(event) => setLoginPassword(event.target.value)}
                placeholder="登录密码"
                className="w-full rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
              />
            ) : smsDisabled ? null : (
              <div className="flex gap-2">
                <input
                  type="text"
                  value={smsCode}
                  onChange={(event) => setSmsCode(event.target.value.trim())}
                  placeholder="短信验证码"
                  className="w-full rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
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
                  className="rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                />
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={(event) => setConfirmPassword(event.target.value)}
                  placeholder="确认登录密码"
                  className="rounded-sm bg-xuangray border border-gold-line/40 px-3 py-2 outline-none focus:border-gold-light"
                />
              </div>
              <p className="text-xs text-xuanpaper/60">
                {smsDisabled ? "开发阶段免短信验证码。" : "短信验证码用于校验手机号。"}
              </p>
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
      ) : (
        <>
          <p className="text-sm text-xuanpaper/70">手机号：{auth.user.phone}</p>
          <p className="text-sm text-xuanpaper/70">
            权限：{auth.user.membership === "trial" ? "试用中" : null}
            {auth.user.membership === "subscriber" ? "订阅中" : null}
            {auth.user.membership === "expired" ? "试用已结束（可查看历史，不可新增）" : null}
          </p>
          <div className="flex gap-2 pt-2">
            {authenticatedActions}
            <Button variant="outline" size="sm" onClick={onLogout}>
              退出登录
            </Button>
          </div>
        </>
      )}
      {authMessage ? <p className="text-sm text-gold-light">{authMessage}</p> : null}
    </div>
  );
}
