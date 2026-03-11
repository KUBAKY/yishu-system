import re

with open('src/lib/auth-store.ts', 'r', encoding='utf-8') as f:
    content = f.read()

# 移除内存 codeStore
content = content.replace('// SMS Code Store (In-memory for MVP, could use Redis/DB later)\nconst codeStore = new Map<string, { code: string; expiresAt: number }>();\n', '')

# 重写 createSmsCode，支持 async
create_pattern = r'export function createSmsCode\(phoneInput: string\) \{.*?return \{ phone, code \};\n\}'

new_create_func = """export async function createSmsCode(phoneInput: string) {
  const phone = sanitizePhone(phoneInput);
  if (!validPhone(phone)) throw new Error("手机号格式错误");
  
  // 删除旧的无效验证码
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
}"""

content = re.sub(create_pattern, new_create_func, content, flags=re.DOTALL)

# 重写 verifySmsCode，支持 async
verify_pattern = r'function verifySmsCode\(phoneInput: string, codeInput: string\) \{.*?return phone;\n\}'

new_verify_func = """async function verifySmsCode(phoneInput: string, codeInput: string) {
  const phone = sanitizePhone(phoneInput);
  const code = codeInput.trim();
  if (!validPhone(phone)) throw new Error("手机号格式错误");
  if (!/^\\d{6}$/.test(code)) throw new Error("验证码格式错误");

  const existing = await prisma.smsCode.findFirst({
    where: { phone, code, verified: false },
    orderBy: { createdAt: 'desc' }
  });

  if (!existing) throw new Error("验证码不存在或错误");
  if (existing.expiresAt.getTime() < Date.now()) {
    await prisma.smsCode.delete({ where: { id: existing.id } });
    throw new Error("验证码已过期，请重新发送");
  }
  
  // 标记验证码已使用，防止重复使用
  await prisma.smsCode.update({
    where: { id: existing.id },
    data: { verified: true }
  });
  
  return phone;
}"""

content = re.sub(verify_pattern, new_verify_func, content, flags=re.DOTALL)

# 修改涉及 verifySmsCode 调用的地方增加 await
content = content.replace(
    'const phone = verifySmsCode(phoneInput, codeInput);',
    'const phone = await verifySmsCode(phoneInput, codeInput);'
)

with open('src/lib/auth-store.ts', 'w', encoding='utf-8') as f:
    f.write(content)

