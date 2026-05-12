-- Tasticord Wrapped Games (게임 취향 카드) 테이블 마이그레이션
-- Supabase SQL Editor에서 실행
--
-- 음악 Wrapped(wrapped_reports)와 평행 구조. 데이터 모델이 달라서 별도 테이블.
-- 공유 URL: /wrapped-games/[userId] — 비로그인자도 조회 가능
--
-- 카드 구성 (7장):
--   1. recent_top_games   : 최근 2주 Top 5 게임
--   2. recent_obsession   : 최근 2주 1위 1개 (큰 화면)
--   3. now_vs_forever     : 최근 1위 vs 누적 1위 비교
--   4. all_time_top_games : 누적 Top 5 게임
--   5. genre_mix          : 장르 도넛 (Steam Store API 기반)
--   6. total_hours        : 누적 플레이타임 + 일 환산
--   7. library_stats      : 보유 게임 수 + Backlog (안 켜본 게임)

CREATE TABLE wrapped_games_reports (
  user_id UUID PRIMARY KEY REFERENCES profiles(id) ON DELETE CASCADE,
  tone TEXT NOT NULL DEFAULT 'A' CHECK (tone IN ('A', 'B', 'C')),
  recent_top_games JSONB NOT NULL DEFAULT '[]',
  recent_obsession JSONB,
  now_vs_forever JSONB,
  all_time_top_games JSONB NOT NULL DEFAULT '[]',
  genre_mix JSONB NOT NULL DEFAULT '[]',
  total_hours JSONB,
  library_stats JSONB,
  -- 푸터 캐시 (생성 시점 닉네임/아바타)
  nickname TEXT,
  avatar_url TEXT,
  generated_at TIMESTAMPTZ NOT NULL DEFAULT NOW()
);

ALTER TABLE wrapped_games_reports ENABLE ROW LEVEL SECURITY;

-- 누구나 읽기 가능 (공유 링크)
CREATE POLICY "Anyone can read wrapped games" ON wrapped_games_reports FOR SELECT USING (true);

-- 본인만 생성/수정/삭제
CREATE POLICY "Users can manage own wrapped games" ON wrapped_games_reports FOR ALL USING (auth.uid() = user_id);
