-- Tasticord Wrapped (취향 카드) 테이블 마이그레이션
-- Supabase SQL Editor에서 실행

-- 사용자별 1행 저장 (재생성 시 upsert로 덮어씀)
-- 공유 URL: /wrapped/[userId] → 비로그인자도 조회 가능
CREATE TABLE wrapped_reports (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'A' CHECK (tone IN ('A', 'B', 'C')),
  -- top_artists: [{ rank, name, image_url, color, initials, genres: [] }, ...]
  top_artists JSONB NOT NULL DEFAULT '[]',
  -- top_tracks: [{ rank, name, artist, image_url, color }, ...]
  top_tracks JSONB NOT NULL DEFAULT '[]',
  -- top_genres: [{ name, pct, color }, ...]  (pct 합 = 100)
  top_genres JSONB NOT NULL DEFAULT '[]',
  -- 푸터에 박힐 캐시 (생성 시점의 닉네임/아바타)
  nickname TEXT,
  avatar_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wrapped_reports ENABLE ROW LEVEL SECURITY;

-- 모두 읽기 가능 (공유 링크는 공개)
CREATE POLICY "Anyone can read wrapped" ON wrapped_reports FOR SELECT USING (true);

-- 본인만 생성/수정/삭제
CREATE POLICY "Users can manage own wrapped" ON wrapped_reports FOR ALL USING (auth.uid() = user_id);
