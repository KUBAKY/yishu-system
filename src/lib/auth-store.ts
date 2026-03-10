import { mkdir, readFile, writeFile } from "node:fs/promises";
import path from "node:path";
import { createHash, randomBytes, randomInt, scrypt as scryptCallback, timingSafeEqual } from "node:crypto";
import { promisify } from "node:util";
import { AuthUser, Membership, UserProfile } from "@/types/auth";

type StoredUser = {
  id: string;
  phone: string;
  passwordHash?: string;
  passwordSalt?: string;
  credentials?: {
    passwordHash?: string;
    passwordHashAlgo?: string;
  };
  createdAt: string;
  trialEndsAt: string;
  subscriptionEndsAt?: string;
  profile?: UserProfile;
  extendedProfile?: {
    currentResidence?: string;
    pastResidences?: string[];
    experienceNarrative?: string;
    currentStatus?: string;
    futureVision?: string;
  };
};

type StoredSession = {
  token: string;
  userId: string;
  expiresAt: string;
};

type StoredProfileHistory = {
  id: string;
  userId: string;
  profile: UserProfile;
  createdAt: string;
};

const dataDir = path.join(process.cwd(), "data");
const usersFile = path.join(dataDir, "users.json");
const sessionsFile = path.join(dataDir, "sessions.json");
const profileHistoryFile = path.join(dataDir, "profile-history.json");
const scrypt = promisify(scryptCallback);

const codeStore = new Map<string, { code: string; expiresAt: number }>();

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

async function ensureFile(filePath: string) {
  await mkdir(dataDir, { recursive: true });
  try {
    await readFile(filePath, "utf8");
  } catch {
    await writeFile(filePath, "[]", "utf8");
  }
}

async function readJsonList<T>(filePath: string): Promise<T[]> {
  await ensureFile(filePath);
  const raw = await readFile(filePath, "utf8");
  try {
    const parsed = JSON.parse(raw) as T[];
    return Array.isArray(parsed) ? parsed : [];
  } catch {
    return [];
  }
}

async function writeJsonList<T>(filePath: string, list: T[]) {
  await writeFile(filePath, JSON.stringify(list, null, 2), "utf8");
}

async function hashPassword(password: string, salt?: string) {
  const nextSalt = salt ?? randomBytes(16).toString("hex");
  const key = (await scrypt(password, nextSalt, 64)) as Buffer;
  return {
    passwordSalt: nextSalt,
    passwordHash: key.toString("hex"),
  };
}

async function verifyPassword(password: string, passwordSalt?: string, passwordHash?: string) {
  if (!passwordSalt || !passwordHash) {
    return false;
  }
  const derived = (await scrypt(password, passwordSalt, 64)) as Buffer;
  const expected = Buffer.from(passwordHash, "hex");
  if (derived.length !== expected.length) {
    return false;
  }
  return timingSafeEqual(derived, expected);
}

function verifyLegacyPassword(password: string, user: StoredUser) {
  if (user.credentials?.passwordHashAlgo !== "sha256") {
    return false;
  }
  const legacyHash = user.credentials.passwordHash;
  if (!legacyHash) {
    return false;
  }
  const input = createHash("sha256").update(password).digest("hex");
  return input === legacyHash;
}

function resolveMembership(user: StoredUser): Membership {
  const now = Date.now();
  if (user.subscriptionEndsAt) {
    const subscriptionTime = new Date(user.subscriptionEndsAt).getTime();
    if (Number.isFinite(subscriptionTime) && subscriptionTime > now) {
      return "subscriber";
    }
  }
  const trialTime = new Date(user.trialEndsAt).getTime();
  if (Number.isFinite(trialTime) && trialTime > now) {
    return "trial";
  }
  return "expired";
}

function toAuthUser(user: StoredUser): AuthUser {
  const normalizedProfile: UserProfile | undefined = user.profile
    ? user.profile
    : user.extendedProfile
      ? ({
          name: "",
          gender: "男",
          birthDate: "",
          birthTime: "",
          birthLocation: "",
          ...(user.extendedProfile.currentResidence ? { currentResidence: user.extendedProfile.currentResidence } : {}),
          ...(Array.isArray(user.extendedProfile.pastResidences) && user.extendedProfile.pastResidences.length > 0
            ? { pastResidences: user.extendedProfile.pastResidences.join("、") }
            : {}),
          ...(user.extendedProfile.experienceNarrative
            ? { experienceNarrative: user.extendedProfile.experienceNarrative }
            : {}),
          ...(user.extendedProfile.currentStatus ? { currentStatus: user.extendedProfile.currentStatus } : {}),
          ...(user.extendedProfile.futureVision ? { futureVision: user.extendedProfile.futureVision } : {}),
        } as UserProfile)
      : undefined;
  return {
    id: user.id,
    phone: user.phone,
    trialEndsAt: user.trialEndsAt,
    subscriptionEndsAt: user.subscriptionEndsAt,
    membership: resolveMembership(user),
    profile: normalizedProfile,
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

export function createSmsCode(phoneInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) {
    throw new Error("手机号格式错误");
  }
  const code = `${randomInt(100000, 1000000)}`;
  const expiresAt = Date.now() + 5 * 60 * 1000;
  codeStore.set(phone, { code, expiresAt });
  return { phone, code };
}

function verifySmsCode(phoneInput: string, codeInput: string) {
  const phone = sanitizePhone(phoneInput);
  const code = codeInput.trim();
  if (!validPhone(phone)) {
    throw new Error("手机号格式错误");
  }
  if (!/^\d{6}$/.test(code)) {
    throw new Error("验证码格式错误");
  }
  const existing = codeStore.get(phone);
  if (!existing) {
    throw new Error("验证码不存在，请重新发送");
  }
  if (existing.expiresAt < Date.now()) {
    codeStore.delete(phone);
    throw new Error("验证码已过期，请重新发送");
  }
  if (existing.code !== code) {
    throw new Error("验证码错误");
  }
  codeStore.delete(phone);
  return phone;
}

async function findOrCreateUserByPhone(phone: string): Promise<StoredUser> {
  const users = await readJsonList<StoredUser>(usersFile);
  const existing = users.find((item) => item.phone === phone);
  if (existing) {
    return existing;
  }
  const now = Date.now();
  const created: StoredUser = {
    id: crypto.randomUUID(),
    phone,
    createdAt: new Date(now).toISOString(),
    trialEndsAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
  users.unshift(created);
  await writeJsonList(usersFile, users);
  return created;
}

async function createSessionByUser(user: StoredUser) {
  const token = crypto.randomUUID();
  const sessions = await readJsonList<StoredSession>(sessionsFile);
  const now = Date.now();
  const activeSessions = sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
  activeSessions.push({
    token,
    userId: user.id,
    expiresAt: new Date(now + 30 * 24 * 60 * 60 * 1000).toISOString(),
  });
  await writeJsonList(sessionsFile, activeSessions);
  return {
    token,
    user: toAuthUser(user),
  };
}

export async function registerByCodeAndPassword(phoneInput: string, codeInput: string, passwordInput: string) {
  const phone = verifySmsCode(phoneInput, codeInput);
  const password = validatePassword(passwordInput);
  const users = await readJsonList<StoredUser>(usersFile);
  const index = users.findIndex((item) => item.phone === phone);
  if (index >= 0 && users[index].passwordHash && users[index].passwordSalt) {
    throw new Error("手机号已注册，请直接登录");
  }
  const credentials = await hashPassword(password);
  const now = Date.now();
  if (index >= 0) {
    const next = {
      ...users[index],
      ...credentials,
    };
    users[index] = next;
    await writeJsonList(usersFile, users);
    return createSessionByUser(next);
  }
  const created: StoredUser = {
    id: crypto.randomUUID(),
    phone,
    ...credentials,
    createdAt: new Date(now).toISOString(),
    trialEndsAt: new Date(now + 90 * 24 * 60 * 60 * 1000).toISOString(),
  };
  users.unshift(created);
  await writeJsonList(usersFile, users);
  return createSessionByUser(created);
}

export async function createSessionByPassword(phoneInput: string, passwordInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) {
    throw new Error("手机号格式错误");
  }
  const password = validatePassword(passwordInput);
  const users = await readJsonList<StoredUser>(usersFile);
  const index = users.findIndex((item) => item.phone === phone);
  if (index < 0) {
    throw new Error("账号不存在，请先注册");
  }
  const user = users[index];
  const matched = await verifyPassword(password, user.passwordSalt, user.passwordHash);
  if (matched) {
    return createSessionByUser(user);
  }
  const legacyMatched = verifyLegacyPassword(password, user);
  if (legacyMatched) {
    const nextCredentials = await hashPassword(password);
    const next = {
      ...user,
      ...nextCredentials,
    };
    users[index] = next;
    await writeJsonList(usersFile, users);
    return createSessionByUser(next);
  }
  if (!legacyMatched) {
    throw new Error("手机号或密码错误");
  }
  return createSessionByUser(user);
}

export async function createSessionByCode(phoneInput: string, codeInput: string) {
  const phone = verifySmsCode(phoneInput, codeInput);
  const user = await findOrCreateUserByPhone(phone);
  return createSessionByUser(user);
}

export async function removeSession(token: string) {
  if (!token) {
    return;
  }
  const sessions = await readJsonList<StoredSession>(sessionsFile);
  const next = sessions.filter((item) => item.token !== token);
  await writeJsonList(sessionsFile, next);
}

export async function resolveSession(token: string): Promise<AuthUser | null> {
  if (!token) {
    return null;
  }
  const sessions = await readJsonList<StoredSession>(sessionsFile);
  const now = Date.now();
  const active = sessions.filter((item) => new Date(item.expiresAt).getTime() > now);
  if (active.length !== sessions.length) {
    await writeJsonList(sessionsFile, active);
  }
  const session = active.find((item) => item.token === token);
  if (!session) {
    return null;
  }
  const users = await readJsonList<StoredUser>(usersFile);
  const user = users.find((item) => item.id === session.userId);
  return user ? toAuthUser(user) : null;
}

export async function upsertUserProfile(userId: string, profileInput: UserProfile): Promise<AuthUser> {
  const profile = sanitizeProfile(profileInput);
  const users = await readJsonList<StoredUser>(usersFile);
  const index = users.findIndex((item) => item.id === userId);
  if (index < 0) {
    throw new Error("用户不存在");
  }
  const next = {
    ...users[index],
    profile,
  };
  users[index] = next;
  await writeJsonList(usersFile, users);
  const historyList = await readJsonList<StoredProfileHistory>(profileHistoryFile);
  historyList.unshift({
    id: crypto.randomUUID(),
    userId,
    profile,
    createdAt: new Date().toISOString(),
  });
  const slicedHistory = historyList.slice(0, 200);
  await writeJsonList(profileHistoryFile, slicedHistory);
  return toAuthUser(next);
}

export async function readProfileHistory(userId: string): Promise<StoredProfileHistory[]> {
  const historyList = await readJsonList<StoredProfileHistory>(profileHistoryFile);
  return historyList
    .filter((item) => item.userId === userId && item.profile)
    .sort((a, b) => new Date(b.createdAt).getTime() - new Date(a.createdAt).getTime())
    .slice(0, 50);
}
