import dotenv from 'dotenv';
import fs from 'fs';
import path from 'path';

export interface KeyStatus {
  key: string;
  cooldownUntil: number;
  failCount: number;
}

export function loadLocalEnv(): void {
  const candidates = [
    path.resolve(process.cwd(), '.env'),
    path.resolve(process.cwd(), 'backend', '.env'),
    path.resolve(process.cwd(), '..', '.env'),
    path.resolve(process.cwd(), '..', 'backend', '.env'),
  ];
  for (const envPath of candidates) {
    try {
      if (fs.existsSync(envPath)) {
        dotenv.config({ path: envPath, override: true });
        const key = (process.env.GEMINI_API_KEY || '').trim();
        if (key && !key.startsWith('your_')) {
          break;
        }
      }
    } catch {
      // Ignore filesystem access errors in serverless environments
    }
  }
}

class GeminiKeyPool {
  private keys: KeyStatus[] = [];
  private lastRefreshed = 0;

  constructor() {
    this.refresh();
  }

  public refresh(force = false): void {
    const now = Date.now();
    // Only refresh from disk every 2 seconds unless forced
    if (!force && now - this.lastRefreshed < 2000 && this.keys.length > 0) {
      return;
    }
    this.lastRefreshed = now;

    loadLocalEnv();

    const raw = (process.env.GEMINI_API_KEYS || process.env.GEMINI_API_KEY || '').trim();
    if (!raw) {
      this.keys = [];
      return;
    }

    // Parse keys separated by comma, semicolon, space or newline
    const parsed = raw
      .split(/[,;\r\n]+/)
      .map((k) => k.trim())
      .filter((k) => k && !k.startsWith('your_') && k.length > 10);

    const uniqueKeys = Array.from(new Set(parsed));

    const existingMap = new Map(this.keys.map((k) => [k.key, k]));
    this.keys = uniqueKeys.map((k) => existingMap.get(k) || { key: k, cooldownUntil: 0, failCount: 0 });
  }

  public getAvailableKeys(): string[] {
    this.refresh();
    const now = Date.now();
    // Prioritize keys not currently in cooldown
    const active = this.keys.filter((k) => k.cooldownUntil <= now);
    const inCooldown = this.keys.filter((k) => k.cooldownUntil > now);

    return [...active, ...inCooldown].map((k) => k.key);
  }

  public markQuotaExceeded(key: string, cooldownSeconds = 60): void {
    const item = this.keys.find((k) => k.key === key);
    if (item) {
      item.failCount += 1;
      item.cooldownUntil = Date.now() + cooldownSeconds * 1000;
    }
  }

  public markSuccess(key: string): void {
    const item = this.keys.find((k) => k.key === key);
    if (item) {
      item.failCount = 0;
      item.cooldownUntil = 0;
    }
  }

  public hasAnyKey(): boolean {
    this.refresh();
    return this.keys.length > 0;
  }

  public getPoolSize(): number {
    this.refresh();
    return this.keys.length;
  }
}

export const keyPool = new GeminiKeyPool();
