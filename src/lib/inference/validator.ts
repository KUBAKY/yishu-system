import { InferencePayload } from "./types";

export function validateProfile(profileInput: InferencePayload["profile"]) {
  const name = (profileInput?.name ?? "").trim();
  const gender = profileInput?.gender;
  const birthDate = (profileInput?.birthDate ?? "").trim();
  const birthTime = (profileInput?.birthTime ?? "").trim();
  const birthLocation = (profileInput?.birthLocation ?? "").trim();
  const currentResidence = (profileInput?.currentResidence ?? "").trim();
  const pastResidences = (profileInput?.pastResidences ?? "").trim();
  const experienceNarrative = (profileInput?.experienceNarrative ?? "").trim();
  const currentStatus = (profileInput?.currentStatus ?? "").trim();
  const futureVision = (profileInput?.futureVision ?? "").trim();
  
  if (name.length < 2 || name.length > 20) {
    throw new Error("姓名长度需在2-20字符");
  }
  if (gender !== "男" && gender !== "女") {
    throw new Error("性别仅支持男或女");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) {
    throw new Error("出生日期格式错误");
  }
  if (!/^\d{2}:\d{2}$/.test(birthTime)) {
    throw new Error("出生时刻格式错误");
  }
  if (birthLocation.length < 2 || birthLocation.length > 40) {
    throw new Error("出生地长度需在2-40字符");
  }
  if (currentResidence.length > 80) {
    throw new Error("现居住地长度不可超过80字符");
  }
  if (pastResidences.length > 240) {
    throw new Error("过往居住地长度不可超过240字符");
  }
  if (experienceNarrative.length > 2000) {
    throw new Error("过往经历长度不可超过2000字符");
  }
  if (currentStatus.length > 1000) {
    throw new Error("现状描述长度不可超过1000字符");
  }
  if (futureVision.length > 1000) {
    throw new Error("未来愿景长度不可超过1000字符");
  }
  
  return {
    name,
    gender,
    birthDate,
    birthTime,
    birthLocation,
    ...(currentResidence ? { currentResidence } : {}),
    ...(pastResidences ? { pastResidences } : {}),
    ...(experienceNarrative ? { experienceNarrative } : {}),
    ...(currentStatus ? { currentStatus } : {}),
    ...(futureVision ? { futureVision } : {}),
  };
}

export function validateNamingContext(namingInput: InferencePayload["namingContext"]) {
  const child = namingInput?.child ?? {};
  const father = namingInput?.father ?? {};
  const mother = namingInput?.mother ?? {};
  const preferences = namingInput?.preferences ?? {};

  const childGender = (child.gender ?? "").trim();
  const childBirthDate = (child.birthDate ?? "").trim();
  const childBirthTime = (child.birthTime ?? "").trim();
  const childBirthLocation = (child.birthLocation ?? "").trim();

  if (childGender !== "男" && childGender !== "女") {
    throw new Error("孩子性别仅支持男或女");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(childBirthDate)) {
    throw new Error("孩子出生日期格式错误");
  }
  if (childBirthTime && !/^\d{2}:\d{2}$/.test(childBirthTime)) {
    throw new Error("孩子出生时间格式错误");
  }
  if (childBirthLocation.length < 2 || childBirthLocation.length > 40) {
    throw new Error("孩子出生地长度需在2-40字符");
  }

  const fatherName = (father.name ?? "").trim();
  const fatherGender = (father.gender ?? "").trim();
  const fatherBirthDate = (father.birthDate ?? "").trim();
  const fatherBirthTime = (father.birthTime ?? "").trim();

  if (fatherName.length < 2 || fatherName.length > 20) {
    throw new Error("父亲姓名长度需在2-20字符");
  }
  if (fatherGender !== "男" && fatherGender !== "女") {
    throw new Error("父亲性别仅支持男或女");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(fatherBirthDate)) {
    throw new Error("父亲出生日期格式错误");
  }
  if (fatherBirthTime && !/^\d{2}:\d{2}$/.test(fatherBirthTime)) {
    throw new Error("父亲出生时间格式错误");
  }

  const motherName = (mother.name ?? "").trim();
  const motherGender = (mother.gender ?? "").trim();
  const motherBirthDate = (mother.birthDate ?? "").trim();
  const motherBirthTime = (mother.birthTime ?? "").trim();

  if (motherName.length < 2 || motherName.length > 20) {
    throw new Error("母亲姓名长度需在2-20字符");
  }
  if (motherGender !== "男" && motherGender !== "女") {
    throw new Error("母亲性别仅支持男或女");
  }
  if (!/^\d{4}-\d{2}-\d{2}$/.test(motherBirthDate)) {
    throw new Error("母亲出生日期格式错误");
  }
  if (motherBirthTime && !/^\d{2}:\d{2}$/.test(motherBirthTime)) {
    throw new Error("母亲出生时间格式错误");
  }

  const lengthCandidates = Array.isArray(preferences.nameLengths) ? preferences.nameLengths : [];
  const allowedLengths = lengthCandidates.filter((item) => item === 2 || item === 3);
  const nameLengths = allowedLengths.length > 0 ? Array.from(new Set(allowedLengths)) : [2, 3];

  const allowedStyles = new Set(["传统", "现代", "文雅", "中性", "其他"]);
  const styles = Array.isArray(preferences.styles)
    ? Array.from(new Set(preferences.styles.map((item) => item.trim()).filter((item) => allowedStyles.has(item))))
    : [];
  const otherStyle = (preferences.otherStyle ?? "").trim();
  const mustIncludeChars = (preferences.mustIncludeChars ?? "").trim();
  const avoidChars = (preferences.avoidChars ?? "").trim();
  const notes = (preferences.notes ?? "").trim();

  if (otherStyle.length > 20) {
    throw new Error("其他风格描述不可超过20字符");
  }
  if (mustIncludeChars.length > 20) {
    throw new Error("必用字长度不可超过20字符");
  }
  if (avoidChars.length > 20) {
    throw new Error("禁用字长度不可超过20字符");
  }
  if (notes.length > 200) {
    throw new Error("命名偏好补充不可超过200字符");
  }

  return {
    child: {
      gender: childGender,
      birthDate: childBirthDate,
      birthTime: childBirthTime || undefined,
      birthLocation: childBirthLocation.slice(0, 40),
    },
    father: {
      name: fatherName.slice(0, 20),
      gender: fatherGender,
      birthDate: fatherBirthDate,
      birthTime: fatherBirthTime || undefined,
    },
    mother: {
      name: motherName.slice(0, 20),
      gender: motherGender,
      birthDate: motherBirthDate,
      birthTime: motherBirthTime || undefined,
    },
    preferences: {
      nameLengths,
      styles,
      otherStyle: otherStyle || undefined,
      mustIncludeChars: mustIncludeChars || undefined,
      avoidChars: avoidChars || undefined,
      notes: notes || undefined,
    },
  };
}

export function validateEventContext(eventInput: InferencePayload["eventContext"], question: string) {
  const background = (eventInput?.background ?? "").trim();
  const urgency = (eventInput?.urgency ?? "").trim();
  const horizon = (eventInput?.horizon ?? "").trim();
  const mood = (eventInput?.mood ?? "").trim();
  if (question.length < 6) {
    throw new Error("问题描述至少6个字符");
  }
  if (background.length < 6) {
    throw new Error("事件背景至少6个字符");
  }
  if (!urgency) {
    throw new Error("紧迫度不能为空");
  }
  if (!horizon) {
    throw new Error("关注周期不能为空");
  }
  if (!mood) {
    throw new Error("当前心境不能为空");
  }
  return {
    background,
    urgency,
    horizon,
    mood,
  };
}

export function validateMode(modeInput: InferencePayload["analysisMode"]) {
  if (modeInput === "event" || modeInput === "natal" || modeInput === "forecast" || modeInput === "relationship" || modeInput === "travel" || modeInput === "fengshui_space" || modeInput === "naming") {
    return modeInput as "event" | "natal" | "forecast" | "relationship" | "travel" | "fengshui_space" | "naming";
  }
  return "event" as const;
}

export function validateForecastWindow(windowInput: InferencePayload["forecastWindow"], mode: ReturnType<typeof validateMode>) {
  if (mode !== "forecast") {
    return null;
  }
  if (windowInput === "3m" || windowInput === "1y") {
    return windowInput;
  }
  throw new Error("阶段窗口仅支持3m或1y");
}

export function validateAngles(anglesInput: InferencePayload["angles"]) {
  const allowed = new Set(["八字", "六爻", "梅花", "奇门", "风水", "星座", "塔罗", "手相", "面相"]);
  const normalized = (anglesInput ?? []).map((item) => item.trim()).filter((item) => allowed.has(item));
  return normalized;
}

export function defaultAnglesForParadigm(paradigm: string): string[] {
  if (paradigm === "bazi") return ["八字"];
  if (paradigm === "liuyao") return ["六爻"];
  if (paradigm === "meihua") return ["梅花"];
  if (paradigm === "qimen") return ["奇门"];
  if (paradigm === "fengshui") return ["风水"];
  if (paradigm === "zodiac") return ["星座"];
  if (paradigm === "tarot") return ["塔罗"];
  if (paradigm === "palmistry") return ["手相"];
  if (paradigm === "physiognomy") return ["面相"];
  if (paradigm === "naming") return ["八字"];
  if (paradigm === "composite") return ["八字", "星座", "塔罗"];
  return ["八字"];
}

export function resolveAngles(paradigm: string, anglesInput: InferencePayload["angles"]) {
  const normalized = validateAngles(anglesInput);
  if (normalized.length > 0) {
    return normalized;
  }
  return defaultAnglesForParadigm(paradigm);
}

export function validateAttachments(attachmentsInput: InferencePayload["attachments"]) {
  const entries = (attachmentsInput ?? []).slice(0, 6);
  return entries
    .map((item) => {
      const name = (item.name ?? "").trim();
      const type = (item.type ?? "").trim();
      const dataUrl = (item.dataUrl ?? "").trim();
      const note = (item.note ?? "").trim();
      const category = (item.category ?? "").trim();
      if (!dataUrl.startsWith("data:image/")) {
        return null;
      }
      if (dataUrl.length > 7_000_000) {
        throw new Error("图片数据过大，请压缩后重试");
      }
      return {
        name: name || "image",
        type: type || "image/jpeg",
        dataUrl,
        note: note.slice(0, 200),
        category: category.slice(0, 30) || "未分类",
      };
    })
    .filter((item): item is NonNullable<typeof item> => Boolean(item));
}
