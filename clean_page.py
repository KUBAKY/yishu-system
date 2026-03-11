import re

with open('src/app/start/page.tsx', 'r', encoding='utf-8') as f:
    text = f.read()

# 1. Replace imports and types
new_imports = """import { useState, useEffect, Suspense, useMemo, useCallback } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import Link from "next/link";
import { Card, CardHeader, CardContent } from "@/components/ui/Card";
import { Button } from "@/components/ui/Button";
import { AuthMeResponse, UserProfile } from "@/types/auth";
import { InferenceResponse, ResultSections, AnalysisMode, ForecastWindow, Step, ReportView } from "@/types/inference";
import { SaveProfileResponse, AuthResponse, SendCodeResponse, AuthMode } from "@/types/api-responses";
import { AuthPanel } from "@/components/auth";
import { DailyFortune, ProfileForm, StepIndicator, ExpertTeam, ReportDisplay, DeductionForm, PARADIGMS, ANGLE_OPTIONS, QUICK_LOCATIONS } from "@/components/start";
"""
text = re.sub(r'import \{ useState[\s\S]*?(?=const DRAFT_KEY)', new_imports + '\n', text)

# 2. Remove getDailyFortune
text = re.sub(r'function getDailyFortune\([^)]*\) \{[\s\S]*?\}\n\n', '', text)

# 3. Replace dailyFortune useMemo
text = re.sub(r'  const dailyFortune = useMemo\(\(\) => \{[\s\S]*?\}, \[auth\]\);\n', '', text)

# 4. Remove activeExperts
text = re.sub(r'  const activeExperts = useMemo\(\(\) => \{[\s\S]*?\}, \[paradigm, angles\]\);\n', '', text)

# 5. Remove STEP_CONFIG
text = re.sub(r'const STEP_CONFIG: Array.*?\];\n\n', '', text)

# 6. Replace return JSX... this needs careful boundary matching.
# Let's replace the whole `return (` block. Wait, there are functions above return
# startDeduction, moveStep, copyReport, downloadReport
# We keep those.
# The `return (...)` block starts with `return (` and ends at the end of the function.
# Let's find index of "  return ("
idx = text.find('  return (\n    <main className="min-h-screen')
if idx != -1:
    new_return = """  return (
    <main className="min-h-screen bg-(--color-xuanqing) text-xuanpaper px-6 py-12">
      <div className="max-w-5xl mx-auto space-y-6">
        {viewMode === "daily" ? (
          <DailyFortune
            userName={name}
            userPhone={auth.authenticated ? auth.user.phone : undefined}
            authenticated={auth.authenticated}
            onStartDeduction={() => setViewMode("deduction")}
          />
        ) : (
          <>
            <Card glow className="border-gold-line bg-[radial-gradient(circle_at_top_right,rgba(168,132,59,0.18),rgba(23,29,36,0.92)_45%)]">
              <CardContent className="space-y-5">
                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="space-y-2">
                    <p className="text-xs tracking-[0.24em] text-xuanpaper/55">YISHU EXPERT TEAM</p>
                    <h1 className="text-3xl md:text-4xl font-song text-gold-light">命盘推演中枢</h1>
                    <p className="text-sm md:text-base text-xuanpaper/80">支持事件、整体命盘、阶段推进三种模式</p>
                  </div>
                  <div className="min-w-44 rounded-xl border border-gold-line/40 bg-xuangray/70 px-4 py-3">
                    <p className="text-xs text-xuanpaper/60">完成度</p>
                    <p className="mt-1 text-2xl font-song text-gold-light">{completionRate}%</p>
                  </div>
                </div>
                <div className="h-2 rounded-full bg-black/30">
                  <div className="h-full rounded-full bg-[linear-gradient(90deg,var(--color-gold-dark),var(--color-gold-light))]" style={{ width: `${completionRate}%` }} />
                </div>
                <div className="grid gap-2 md:grid-cols-4">
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    当前阶段：{step}/3
                  </div>
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    推演模式：{modeLabel}
                  </div>
                  <div className="rounded-xl border border-gold-line/35 bg-xuangray/60 px-3 py-2 text-sm">
                    目标范式：{PARADIGMS.find((item: {id: string, label: string}) => item.id === paradigm)?.label ?? "未选择"}
                  </div>
                </div>

                <ExpertTeam paradigm={paradigm} angles={angles} />
              </CardContent>
            </Card>

            <Card>
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">三步问询</h2>
              </CardHeader>
              <CardContent>
                <StepIndicator currentStep={step} onStepChange={moveStep} />
              </CardContent>
            </Card>

            <Card glow>
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">参数详情</h2>
              </CardHeader>
              <CardContent>
                <form
                  onSubmit={(e) => {
                    e.preventDefault();
                    startDeduction();
                  }}
                  className="space-y-6"
                >
                  {step === 1 ? (
                    <div className="space-y-4">
                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">核心术数模型</p>
                        <div className="flex flex-wrap gap-2">
                          {PARADIGMS.map((item: {id: string, label: string}) => (
                            <Button
                              key={item.id}
                              type="button"
                              size="sm"
                              variant={paradigm === item.id ? "primary" : "outline"}
                              onClick={() => setParadigm(item.id)}
                            >
                              {item.label}
                            </Button>
                          ))}
                        </div>
                      </div>

                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">推演模式</p>
                        <div className="flex flex-wrap gap-2">
                          <Button key="event" type="button" size="sm" variant={analysisMode === "event" ? "primary" : "outline"} onClick={() => setAnalysisMode("event")}>具体事件 (单事研判)</Button>
                          <Button key="natal" type="button" size="sm" variant={analysisMode === "natal" ? "primary" : "outline"} onClick={() => setAnalysisMode("natal")}>整体命盘 (长期主线)</Button>
                          <Button key="forecast" type="button" size="sm" variant={analysisMode === "forecast" ? "primary" : "outline"} onClick={() => setAnalysisMode("forecast")}>阶段推进 (周期运势)</Button>
                          <Button key="relationship" type="button" size="sm" variant={analysisMode === "relationship" ? "primary" : "outline"} onClick={() => setAnalysisMode("relationship")}>关系适配 (合盘对看)</Button>
                          <Button key="fengshui_space" type="button" size="sm" variant={analysisMode === "fengshui_space" ? "primary" : "outline"} onClick={() => setAnalysisMode("fengshui_space")}>空间风水 (环境能量)</Button>
                          <Button key="travel" type="button" size="sm" variant={analysisMode === "travel" ? "primary" : "outline"} onClick={() => setAnalysisMode("travel")}>出行规划 (时空选择)</Button>
                        </div>
                      </div>

                      {analysisMode === "forecast" ? (
                        <div className="space-y-2">
                          <p className="text-sm text-xuanpaper/80">预测窗口</p>
                          <div className="flex flex-wrap gap-2">
                            <Button key="3m" type="button" size="sm" variant={forecastWindow === "3m" ? "primary" : "outline"} onClick={() => setForecastWindow("3m")}>近期 (3个月)</Button>
                            <Button key="1y" type="button" size="sm" variant={forecastWindow === "1y" ? "primary" : "outline"} onClick={() => setForecastWindow("1y")}>全年 (12个月)</Button>
                          </div>
                        </div>
                      ) : null}

                      <div className="space-y-2">
                        <p className="text-sm text-xuanpaper/80">会诊视角</p>
                        <div className="flex flex-wrap gap-2">
                          {ANGLE_OPTIONS.map((item: string) => {
                            const active = angles.includes(item);
                            return (
                              <Button
                                key={item}
                                type="button"
                                size="sm"
                                variant={active ? "primary" : "outline"}
                                onClick={() =>
                                  setAngles((prev: string[]) =>
                                    prev.includes(item) ? (prev.length === 1 ? prev : prev.filter((value: string) => value !== item)) : [...prev, item],
                                  )
                                }
                              >
                                {item}
                              </Button>
                            );
                          })}
                        </div>
                      </div>

                      <ProfileForm
                        name={name} setName={setName}
                        gender={gender} setGender={setGender}
                        birthDate={birthDate} setBirthDate={setBirthDate}
                        birthTime={birthTime} setBirthTime={setBirthTime}
                        birthLocation={birthLocation} setBirthLocation={setBirthLocation}
                        currentResidence={currentResidence} setCurrentResidence={setCurrentResidence}
                        pastResidences={pastResidences} setPastResidences={setPastResidences}
                        experienceNarrative={experienceNarrative} setExperienceNarrative={setExperienceNarrative}
                        currentStatus={currentStatus} setCurrentStatus={setCurrentStatus}
                        futureVision={futureVision} setFutureVision={setFutureVision}
                        profileReady={profileReady}
                        authenticated={auth.authenticated}
                        onSaveProfile={onSaveProfile}
                        savingProfile={savingProfile}
                        profileStatus={profileStatus}
                      />
                    </div>
                  ) : null}

                  <DeductionForm 
                    step={step} moveStep={moveStep} canNextStep1={canNextStep1} canNextStep2={canNextStep2}
                    canSubmit={canSubmit} loading={loading} startDeduction={startDeduction}
                    paradigm={paradigm} setParadigm={setParadigm} analysisMode={analysisMode} setAnalysisMode={setAnalysisMode}
                    forecastWindow={forecastWindow} setForecastWindow={setForecastWindow} angles={angles} setAngles={setAngles}
                    currentTime={currentTime} setCurrentTime={setCurrentTime} location={location} setLocation={setLocation}
                    question={question} setQuestion={setQuestion} eventBackground={eventBackground} setEventBackground={setEventBackground}
                    urgency={urgency} setUrgency={setUrgency} horizon={horizon} setHorizon={setHorizon} mood={mood} setMood={setMood}
                    partnerName={partnerName} setPartnerName={setPartnerName} partnerGender={partnerGender} setPartnerGender={setPartnerGender}
                    partnerBirthDate={partnerBirthDate} setPartnerBirthDate={setPartnerBirthDate} partnerBirthTime={partnerBirthTime} setPartnerBirthTime={setPartnerBirthTime}
                    spaceType={spaceType} setSpaceType={setSpaceType} spaceLayout={spaceLayout} setSpaceLayout={setSpaceLayout}
                    travelDest={travelDest} setTravelDest={setTravelDest} travelDate={travelDate} setTravelDate={setTravelDate} travelPeers={travelPeers} setTravelPeers={setTravelPeers}
                    name={name} modeLabel={modeLabel}
                  />
                </form>
              </CardContent>
            </Card>

            <Card className="border-gold-line/40 bg-xuangray/70">
              <CardHeader>
                <h2 className="text-lg font-song text-gold-light">实时推演预览</h2>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="grid gap-2 md:grid-cols-2">
                  <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                    <p className="text-xs text-xuanpaper/60">个人底盘</p>
                    <p className="mt-1 text-sm text-gold-light">{profileReady ? `${name} · ${gender}` : "待补全"}</p>
                  </div>
                  <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                    <p className="text-xs text-xuanpaper/60">时空锚点</p>
                    <p className="mt-1 text-sm text-gold-light">{currentTime ? "已设置" : "未设置"} / {location || "未填地点"}</p>
                  </div>
                </div>
                <div className="rounded-xl border border-gold-line/30 bg-black/10 p-3">
                  <p className="text-xs text-xuanpaper/60">推演焦点</p>
                  <p className="mt-1 text-sm leading-7 text-xuanpaper/85">
                    {question.trim() ||
                      (analysisMode === "event"
                        ? "请输入你的核心问题，系统会按范式生成团队会诊报告。"
                        : analysisMode === "natal"
                          ? "整体命盘模式将输出长期结构、优势短板与行动主线。"
                          : "阶段推进模式将输出窗口节奏、阶段机会与风险主题。")}
                  </p>
                </div>
              </CardContent>
            </Card>

          </>
        )}

        <Card>
          <CardHeader>
            <h2 className="text-lg font-song text-gold-light">账号状态</h2>
          </CardHeader>
          <CardContent className="space-y-3">
            <AuthPanel
              auth={auth}
              authLoading={authLoading}
              onAuthChange={setAuth}
              guestMessage="当前为游客态：可推演，登录后可保存历史记录并启用试用权益。"
              successMessage="登录成功，已自动登录"
              authenticatedActions={
                <Button variant="primary" size="sm" onClick={() => router.push("/account")}>
                  个人中心
                </Button>
              }
            />
            {auth.authenticated && auth.user.trialEndsAt ? (
              <p className="text-sm text-xuanpaper/70 mt-2">
                试用截止：{new Date(auth.user.trialEndsAt).toLocaleDateString("zh-CN")}
              </p>
            ) : null}
          </CardContent>
        </Card>

        {error ? (
          <Card>
            <CardContent className="text-sm text-red-300 pt-5">{error}</CardContent>
          </Card>
        ) : null}

        {result ? (
          <Card glow>
            <CardHeader>
              <h2 className="text-lg font-song text-gold-light">推演结果</h2>
            </CardHeader>
            <CardContent className="space-y-4">
              <ReportDisplay
                result={result}
                reportView={reportView}
                setReportView={setReportView}
                angles={angles}
                saveStatus={saveStatus}
                sections={sections}
                copyReport={copyReport}
                downloadReport={downloadReport}
                feedbackScore={feedbackScore}
                setFeedbackScore={setFeedbackScore}
                copyStatus={copyStatus}
              />
            </CardContent>
          </Card>
        ) : null}

        {!result && lastReportSummary ? (
          <Card>
            <CardHeader>
              <h2 className="text-lg font-song text-gold-light">上次推演摘要（本地缓存）</h2>
            </CardHeader>
            <CardContent>
              <p className="leading-8 whitespace-pre-wrap">{lastReportSummary}</p>
            </CardContent>
          </Card>
        ) : null}

        <div className="flex gap-3">
          <Link href="/cases">
            <Button variant="primary">查看案例库</Button>
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

export default function StartPage() {
  return (
    <Suspense fallback={<div className="min-h-screen bg-(--color-xuanqing) text-xuanpaper/50 flex items-center justify-center">Loading...</div>}>
      <StartPageContent />
    </Suspense>
  );
}
"""
    # Replace from `  return (` to the end of the file with `new_return`
    text = text[:idx] + new_return

# Remove Auth variables (loginPassword, etc) block
# The easiest way: delete the block of `const [phone, setPhone]` until `const [loggingIn, setLoggingIn]`
# Since there are so many, let's just find and replace the Auth state block.
text = re.sub(r'  const \[phone, setPhone\].*?  const \[loggingIn, setLoggingIn\] = useState<boolean>\(false\);\n', '', text, flags=re.DOTALL)
text = re.sub(r'  const \[authMode, setAuthMode\].*?;\n', '', text)
text = re.sub(r'  const \[authMessage, setAuthMessage\].*?;\n', '', text)
text = re.sub(r'  const \[sendingCode, setSendingCode\].*?;\n', '', text)
text = re.sub(r'  const \[registerPassword, setRegisterPassword\].*?;\n', '', text)
text = re.sub(r'  const \[confirmPassword, setConfirmPassword\].*?;\n', '', text)
text = re.sub(r'  const \[loginPassword, setLoginPassword\].*?;\n', '', text)
text = re.sub(r'  const \[registering, setRegistering\].*?;\n', '', text)
text = re.sub(r'  const \[smsCode, setSmsCode\].*?;\n', '', text)

# Now remove the onSendCode, switchAuthMode, onRegister, onLogin, onLogout
text = re.sub(r'  async function onSendCode\(\) \{[\s\S]*?\}\n\n  function switchAuthMode\(\) \{[\s\S]*?\}\n\n  async function onRegister\(\) \{[\s\S]*?\}\n\n  async function onLogin\(\) \{[\s\S]*?\}\n\n  function onLogout\(\) \{[\s\S]*?\}', '', text)

# Finally, write it out
with open('src/app/start/page.tsx', 'w', encoding='utf-8') as f:
    f.write(text)

