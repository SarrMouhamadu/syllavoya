import { AppError } from "../../errors/AppError.js";

export class LoginRateLimiter {
  private failedAttempts: Map<string, number[]> = new Map();
  private readonly maxFailures: number;
  private readonly windowMs: number;

  constructor(maxFailures = 5, windowMs = 15 * 60 * 1000) {
    this.maxFailures = maxFailures;
    this.windowMs = windowMs;
  }

  private getKey(ip: string, email?: string): string {
    const cleanIp = (ip || "unknown").trim().toLowerCase();
    const cleanEmail = (email || "").trim().toLowerCase();
    return `${cleanIp}:${cleanEmail}`;
  }

  isRateLimited(ip: string, email?: string): boolean {
    const key = this.getKey(ip, email);
    const attempts = this.failedAttempts.get(key);
    if (!attempts || attempts.length === 0) return false;

    const now = Date.now();
    const recentAttempts = attempts.filter((t) => now - t < this.windowMs);

    if (recentAttempts.length !== attempts.length) {
      if (recentAttempts.length === 0) {
        this.failedAttempts.delete(key);
        return false;
      }
      this.failedAttempts.set(key, recentAttempts);
    }

    return recentAttempts.length >= this.maxFailures;
  }

  recordFailedAttempt(ip: string, email?: string): void {
    const key = this.getKey(ip, email);
    const now = Date.now();
    const attempts = (this.failedAttempts.get(key) || []).filter((t) => now - t < this.windowMs);
    attempts.push(now);
    this.failedAttempts.set(key, attempts);
  }

  reset(ip: string, email?: string): void {
    const key = this.getKey(ip, email);
    this.failedAttempts.delete(key);
  }

  clear(): void {
    this.failedAttempts.clear();
  }
}

export const loginRateLimiter = new LoginRateLimiter(5, 15 * 60 * 1000);
