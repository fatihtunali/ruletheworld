import { Injectable, Inject } from '@nestjs/common';
import { CACHE_MANAGER } from '@nestjs/cache-manager';
import type { Cache } from 'cache-manager';

@Injectable()
export class CacheService {
  constructor(@Inject(CACHE_MANAGER) private cacheManager: Cache) {}

  // Basit get/set
  async get<T>(key: string): Promise<T | undefined> {
    return this.cacheManager.get<T>(key);
  }

  async set<T>(key: string, value: T, ttl?: number): Promise<void> {
    await this.cacheManager.set(key, value, ttl);
  }

  async del(key: string): Promise<void> {
    await this.cacheManager.del(key);
  }

  // Pattern ile silme (prefix) - Redis destegi
  async delByPrefix(prefix: string): Promise<void> {
    const stores = (this.cacheManager as unknown as { stores?: { keys?: (pattern: string) => Promise<string[]> }[] }).stores;
    if (stores && stores[0]?.keys) {
      const keys = await stores[0].keys(`${prefix}*`);
      if (keys.length > 0) {
        await Promise.all(keys.map((key: string) => this.cacheManager.del(key)));
      }
    }
  }

  // Cache-aside pattern helper
  async getOrSet<T>(
    key: string,
    factory: () => Promise<T>,
    ttl?: number,
  ): Promise<T> {
    const cached = await this.get<T>(key);
    if (cached !== undefined && cached !== null) {
      return cached;
    }

    const value = await factory();
    await this.set(key, value, ttl);
    return value;
  }

  // Istatistik cache key'leri
  static readonly KEYS = {
    LIDERLIK: 'liderlik',
    GENEL_ISTATISTIK: 'genel_istatistik',
    SONUC_DAGILIMI: 'sonuc_dagilimi',
    TOPLULUK: (id: string) => `topluluk:${id}`,
    OYUNCU: (id: string) => `oyuncu:${id}`,
    TURNUVA: (id: string) => `turnuva:${id}`,
    AKTIF_TURNUVALAR: 'aktif_turnuvalar',
  };

  // TTL degerleri (milisaniye)
  static readonly TTL = {
    SHORT: 30000, // 30 saniye
    MEDIUM: 60000, // 1 dakika
    LONG: 300000, // 5 dakika
    VERY_LONG: 900000, // 15 dakika
  };
}
