-- 전역 메타데이터 캐시 테이블
-- 사용자별이 아닌, 외부 API의 메타데이터(아티스트 장르, 게임 장르 등)를 캐싱
-- 모든 사용자가 공유 → 한 번 가져오면 다른 사용자들도 hit
--
-- 현재 사용처:
--   source = 'lastfm_artist_tags', cache_key = 아티스트 이름(lowercase)
--   source = 'steam_app_genres',  cache_key = appid (string)

CREATE TABLE metadata_cache (
  source TEXT NOT NULL,
  cache_key TEXT NOT NULL,
  data JSONB NOT NULL,
  fetched_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  PRIMARY KEY (source, cache_key)
);

CREATE INDEX idx_metadata_cache_fetched_at ON metadata_cache (fetched_at);

ALTER TABLE metadata_cache ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (메타데이터는 공개 정보, 사용자 정보 없음)
CREATE POLICY "Anyone can read metadata cache" ON metadata_cache FOR SELECT USING (true);

-- 쓰기는 service-role만 (admin client) — 일반 인증 사용자는 못 씀
-- (정책 안 만들면 service-role도 막힐 수 있는데, service-role은 RLS 우회하니까 OK)
