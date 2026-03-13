import { randomBytes, scrypt as scryptCallback, timingSafeEqual, randomInt } from "node:crypto";
import { promisify } from "node:util";
import { prisma } from "@/lib/prisma";
import { AuthUser, Membership, UserProfile } from "@/types/auth";

const scrypt = promisify(scryptCallback);

// SMS Code Store is now managed by Prisma

function sanitizePhone(phone: string) {
  return phone.replace(/\s+/g, "");
}

function validPhone(phone: string) {
  return /^1\d{10}$/.test(phone);
}

function validatePassword(passwordInput: string) {
  const password = passwordInput.trim();
  if (password.length < 6 || password.length > 64) {
    throw new Error("密码长度需在6-64字符");
  }
  return password;
}

// Password Hashing Utils
async function hashPassword(password: string): Promise<string> {
  const salt = randomBytes(16).toString("hex");
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  return `${salt}:${derivedKey.toString("hex")}`;
}

async function verifyPassword(password: string, storedHash: string): Promise<boolean> {
  const [salt, key] = storedHash.split(":");
  if (!salt || !key) return false;
  const derivedKey = (await scrypt(password, salt, 64)) as Buffer;
  const keyBuffer = Buffer.from(key, "hex");
  // timingSafeEqual requires buffers of same length
  if (derivedKey.length !== keyBuffer.length) return false;
  return timingSafeEqual(derivedKey, keyBuffer);
}

// User & Profile Mapping
function resolveMembership(user: { trialEndsAt: Date | null; subscriptionEndsAt: Date | null }): Membership {
  const now = new Date();
  if (user.subscriptionEndsAt && user.subscriptionEndsAt > now) {
    return "subscriber";
  }
  if (user.trialEndsAt && user.trialEndsAt > now) {
    return "trial";
  }
  return "expired";
}

function toAuthUser(user: Record<string, any>): AuthUser {
  const hasProfile = user.name && user.birthDate && user.birthTime && user.birthLocation;
  
  let profile: UserProfile | undefined;
  
  if (hasProfile) {
    profile = {
      name: user.name!,
      gender: user.gender as "男" | "女",
      birthDate: user.birthDate!,
      birthTime: user.birthTime!,
      birthLocation: user.birthLocation!,
      ...(user.currentResidence ? { currentResidence: user.currentResidence } : {}),
      ...(user.pastResidences ? { pastResidences: user.pastResidences } : {}),
      ...(user.experienceNarrative ? { experienceNarrative: user.experienceNarrative } : {}),
      ...(user.currentStatus ? { currentStatus: user.currentStatus } : {}),
      ...(user.futureVision ? { futureVision: user.futureVision } : {}),
    };
  }

  return {
    id: user.id,
    phone: user.phone,
    trialEndsAt: user.trialEndsAt?.toISOString(),
    subscriptionEndsAt: user.subscriptionEndsAt?.toISOString(),
    membership: resolveMembership(user),
    profile,
  };
}

function sanitizeProfile(profileInput: UserProfile): UserProfile {
  const name = profileInput.name.trim();
  const gender = profileInput.gender;
  const birthDate = profileInput.birthDate.trim();
  const birthTime = profileInput.birthTime.trim();
  const birthLocation = profileInput.birthLocation.trim();
  const currentResidence = (profileInput.currentResidence ?? "").trim();
  const pastResidences = (profileInput.pastResidences ?? "").trim();
  const experienceNarrative = (profileInput.experienceNarrative ?? "").trim();
  const currentStatus = (profileInput.currentStatus ?? "").trim();
  const futureVision = (profileInput.futureVision ?? "").trim();

  if (name.length < 2 || name.length > 20) throw new Error("姓名长度需在2-20字符");
  if (gender !== "男" && gender !== "女") throw new Error("性别仅支持男或女");
  if (!/^\d{4}-\d{2}-\d{2}$/.test(birthDate)) throw new Error("出生日期格式错误");
  if (!/^\d{2}:\d{2}$/.test(birthTime)) throw new Error("出生时刻格式错误");
  if (birthLocation.length < 2 || birthLocation.length > 40) throw new Error("出生地长度需在2-40字符");
  if (currentResidence.length > 80) throw new Error("现居住地长度不可超过80字符");
  if (pastResidences.length > 240) throw new Error("过往居住地长度不可超过240字符");
  if (experienceNarrative.length > 2000) throw new Error("过往经历长度不可超过2000字符");
  if (currentStatus.length > 1000) throw new Error("现状描述长度不可超过1000字符");
  if (futureVision.length > 1000) throw new Error("未来愿景长度不可超过1000字符");

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

// SMS Logic
export async function createSmsCode(phoneInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) throw new Error("手机号格式错误");
  
  // Clean up any old invalid codes for this phone
  await prisma.smsCode.deleteMany({
    where: { 
      phone,
      OR: [
        { verified: true },
        { expiresAt: { lt: new Date() } }
      ]
    }
  });

  const code = `${randomInt(100000, 1000000)}`;
  const expiresAt = new Date(Date.now() + 5 * 60 * 1000);
  
  await prisma.smsCode.create({
    data: {
      phone,
      code,
      expiresAt
    }
  });

  return { phone, code };
}

async function verifySmsCode(phoneInput: string, codeInput: string) {
  const phone = sanitizePhone(phoneInput);
  const code = codeInput.trim();
  if (!validPhone(phone)) throw new Error("手机号格式错误");
  if (!/^\d{6}$/.test(code)) throw new Error("验证码格式错误");

  const existing = await prisma.smsCode.findFirst({
    where: { phone, code, verified: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!existing) throw new Error("验证码不存在，请重新发送");
  if (existing.expiresAt.getTime() < Date.now()) {
    await prisma.smsCode.delete({ where: { id: existing.id } });
    throw new Error("验证码已过期，请重新发送");
  }
  
  // Mark as verified to prevent reuse
  await prisma.smsCode.update({
    where: { id: existing.id },
    data: { verified: true }
  });
  
  return phone;
}

// Session Logic
async function createSessionByUser(user: Record<string, any>) {
  // Clean up expired sessions for this user (optional but good practice)
  await prisma.session.deleteMany({
    where: {
      userId: user.id,
      expires: { lt: new Date() }
    }
  });

  const token = crypto.randomUUID();
  const expires = new Date(Date.now() + 30 * 24 * 60 * 60 * 1000); // 30 days

  await prisma.session.create({
    data: {
      sessionToken: token,
      userId: user.id,
      expires,
    },
  });

  return {
    token,
    user: toAuthUser(user),
  };
}

// Main Auth Functions
export async function registerByCodeAndPassword(phoneInput: string, codeInput: string, passwordInput: string) {
  const phone = await verifySmsCode(phoneInput, codeInput);
  const password = validatePassword(passwordInput);

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("手机号已注册，请直接登录");
  }

  const hashedPassword = await hashPassword(password);
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days trial

  const newUser = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      trialEndsAt,
      createdAt: now,
    },
  });

  return createSessionByUser(newUser);
}

export async function registerByPassword(phoneInput: string, passwordInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) throw new Error("手机号格式错误");

  const password = validatePassword(passwordInput);

  const existingUser = await prisma.user.findUnique({ where: { phone } });
  if (existingUser) {
    throw new Error("手机号已注册，请直接登录");
  }

  const hashedPassword = await hashPassword(password);
  const now = new Date();
  const trialEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000); // 90 days trial

  const newUser = await prisma.user.create({
    data: {
      phone,
      password: hashedPassword,
      trialEndsAt,
      createdAt: now,
    },
  });

  return createSessionByUser(newUser);
}

export async function createSessionByPassword(phoneInput: string, passwordInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) throw new Error("手机号格式错误");
  
  const password = validatePassword(passwordInput);
  
  const user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    throw new Error("账号不存在，请先注册");
  }

  const matched = await verifyPassword(password, user.password);
  if (!matched) {
    throw new Error("手机号或密码错误");
  }

  return createSessionByUser(user);
}

export async function createSessionByCode(phoneInput: string, codeInput: string) {
  const phone = await verifySmsCode(phoneInput, codeInput);
  
  let user = await prisma.user.findUnique({ where: { phone } });
  if (!user) {
    // If user doesn't exist, create one with random password (since logged in via code)
    // But better to force registration or set a temporary password?
    // PRD says "Guest -> Register", usually implies registration flow.
    // Here we auto-register if login by code? Let's assume yes for simplicity, 
    // but generate a random password so password login won't work until reset.
    const now = new Date();
    const trialEndsAt = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000);
    const randomPwd = await hashPassword(crypto.randomUUID());
    
    user = await prisma.user.create({
      data: {
        phone,
        password: randomPwd, 
        trialEndsAt,
        createdAt: now,
      },
    });
  }

  return createSessionByUser(user);
}

export async function removeSession(token: string) {
  if (!token) return;
  try {
    await prisma.session.delete({
      where: { sessionToken: token },
    });
  } catch {
    // Ignore if session not found
  }
}

export async function resolveSession(token: string): Promise<AuthUser | null> {
  try {
    if (!token) return null;

    const session = await prisma.session.findUnique({
      where: { sessionToken: token },
      include: { user: true },
    });
    if (!session) return null;

    if (session.expires < new Date()) {
      await prisma.session.delete({ where: { id: session.id } });
      return null;
    }

    return toAuthUser(session.user);
  } catch (error) {
    if (process.env.NODE_ENV !== "production") {
      console.warn("[auth] resolveSession failed:", error);
      return null;
    }
    throw error;
  }
}

export async function upsertUserProfile(userId: string, profileInput: UserProfile): Promise<AuthUser> {
  const profile = sanitizeProfile(profileInput);
  
  const user = await prisma.user.update({
    where: { id: userId },
    data: {
      name: profile.name,
      gender: profile.gender,
      birthDate: profile.birthDate,
      birthTime: profile.birthTime,
      birthLocation: profile.birthLocation,
      currentResidence: profile.currentResidence,
      pastResidences: profile.pastResidences, // Now stored as string directly if it's string in type
      experienceNarrative: profile.experienceNarrative,
      currentStatus: profile.currentStatus,
      futureVision: profile.futureVision,
    },
  });

  // Note: Profile history is currently not implemented in DB schema for simplicity in this MVP step,
  // but we could add a ProfileHistory model if needed. 
  // For now, we focus on the main profile update.
  
  return toAuthUser(user);
}

export async function readProfileHistory(_userId: string): Promise<Record<string, any>[]> {
  // Not implemented in DB yet. Return empty array or implement if schema added.
  return [];
}
