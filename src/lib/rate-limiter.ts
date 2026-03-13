export interface RateLimitConfig {
  windowMs: number;     // 时间窗口（毫秒）
  maxRequests: number;  // 窗口内最大请求数
}

// TODO: Replace with @upstash/redis or similar for production Vercel Edge/Serverless environments.
// In-memory rate limiting (even with globalThis) only works for a single instance and resets across stateless serverless invocations.

const globalForRateLimit = globalThis as unknown as {
  rateLimitStore: Map<string, { count: number; resetTime: number }> | undefined;
};

export class RateLimiter {
  private store: Map<string, { count: number; resetTime: number }>;

  constructor() {
    if (!globalForRateLimit.rateLimitStore) {
      globalForRateLimit.rateLimitStore = new Map();
    }
    this.store = globalForRateLimit.rateLimitStore;
  }

  check(identifier: string, config: RateLimitConfig): { allowed: boolean; retryAfter: number } {
    const now = Date.now();
    const record = this.store.get(identifier);

    if (!record) {
      this.store.set(identifier, { count: 1, resetTime: now + config.windowMs });
      this.cleanup(); // 偶尔清理避免内存泄漏
      return { allowed: true, retryAfter: 0 };
    }

    if (now > record.resetTime) {
      // 窗口过期，重置
      this.store.set(identifier, { count: 1, resetTime: now + config.windowMs });
      return { allowed: true, retryAfter: 0 };
    }

    if (record.count < config.maxRequests) {
      record.count += 1;
      return { allowed: true, retryAfter: 0 };
    }

    return { allowed: false, retryAfter: record.resetTime - now };
  }

  // 简单的清理机制
  private cleanup() {
    if (this.store.size > 1000) {
      const now = Date.now();
      for (const [key, record] of Array.from(this.store.entries())) {
        if (now > record.resetTime) {
          this.store.delete(key);
        }
      }
    }
  }
}

// 预配置实例
export const inferenceLimit = new RateLimiter();  // 推演 API：每 IP 1分钟10次
export const smsCodeLimit = new RateLimiter();    // 验证码 API：每 IP 1分钟1次，或防暴力破解
export const authLimit = new RateLimiter();       // 登录 API：每 IP 1分钟5次
