-- 홈 피드: 현재 듣는/플레이하는 활동 캐시
-- 유저 1인당 종류(kind)별 1행 upsert. 4분 이내 = 지금 활동 중 / 3시간 이내 = 피드 노출
-- kind = 'music' (Spotify 등) | 'game' (Steam 등)
-- 동일 유저가 음악과 게임을 동시에 캐싱 가능 (각 kind별 1행)

CREATE TABLE IF NOT EXISTS user_now_playing (
  user_id UUID NOT NULL REFERENCES profiles(id) ON DELETE CASCADE,
  kind TEXT NOT NULL DEFAULT 'music' CHECK (kind IN ('music', 'game')),
  platform TEXT NOT NULL,
  track_id TEXT,
  title TEXT NOT NULL,
  artist TEXT,
  album_image_url TEXT,
  external_url TEXT,
  played_at TIMESTAMPTZ NOT NULL DEFAULT NOW(),
  updated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

-- 이전에 user_id 단독 PK로 만든 테이블이 이미 있는 경우 컬럼/제약 마이그레이션
ALTER TABLE user_now_playing ADD COLUMN IF NOT EXISTS kind TEXT NOT NULL DEFAULT 'music';
ALTER TABLE user_now_playing DROP CONSTRAINT IF EXISTS user_now_playing_pkey;
ALTER TABLE user_now_playing ADD CONSTRAINT user_now_playing_pkey PRIMARY KEY (user_id, kind);
ALTER TABLE user_now_playing DROP CONSTRAINT IF EXISTS user_now_playing_kind_check;
ALTER TABLE user_now_playing ADD CONSTRAINT user_now_playing_kind_check CHECK (kind IN ('music', 'game'));

ALTER TABLE user_now_playing ENABLE ROW LEVEL SECURITY;

DROP POLICY IF EXISTS "Users can read friend now_playing" ON user_now_playing;
CREATE POLICY "Users can read friend now_playing" ON user_now_playing FOR SELECT USING (
  auth.uid() = user_id OR
  user_id IN (SELECT friend_id FROM friendships WHERE user_id = auth.uid())
);

DROP POLICY IF EXISTS "Users can manage own now_playing" ON user_now_playing;
CREATE POLICY "Users can manage own now_playing" ON user_now_playing FOR ALL USING (auth.uid() = user_id);

CREATE INDEX IF NOT EXISTS idx_user_now_playing_played_at ON user_now_playing(played_at DESC);
