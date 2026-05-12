// 전역 메타데이터 캐시 헬퍼
// metadata_cache 테이블 사용 — (source, cache_key) 복합 PK
// service-role 통해서만 쓰기 (admin client)
import { createAdminClient } from '@/lib/supabase/admin';

interface CacheRow {
  data: unknown;
  fetched_at: string;
}

// TTL 이내면 캐시 데이터 반환, 만료/없으면 null
export async function getCachedMetadata<T>(
  source: string,
  cacheKey: string,
  ttlMs: number
): Promise<T | null> {
  try {
    const admin = createAdminClient();
    const { data } = await admin
      .from('metadata_cache')
      .select('data, fetched_at')
      .eq('source', source)
      .eq('cache_key', cacheKey)
      .maybeSingle<CacheRow>();
    if (!data) return null;
    const age = Date.now() - new Date(data.fetched_at).getTime();
    if (age >= ttlMs) return null;
    return data.data as T;
  } catch {
    // 캐시 lookup 실패해도 일반 흐름은 계속 — 외부 API fallback
    return null;
  }
}

// 캐시 저장 (upsert). 실패해도 throw 안 함 (캐시 못 써도 데이터는 이미 받았으니 OK)
export async function setCachedMetadata<T>(
  source: string,
  cacheKey: string,
  data: T
): Promise<void> {
  try {
    const admin = createAdminClient();
    await admin.from('metadata_cache').upsert(
      {
        source,
        cache_key: cacheKey,
        data: data as object,
        fetched_at: new Date().toISOString(),
      },
      { onConflict: 'source,cache_key' }
    );
  } catch {
    // 무시 — 다음 호출에서 다시 시도
  }
}
