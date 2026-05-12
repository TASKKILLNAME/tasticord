-- Wrapped 카드 5·6·7 데이터 컬럼 추가
-- Supabase SQL Editor에서 실행
--
-- 카드 5: Artist Loyalty (Top 50 중 한 아티스트의 곡이 몇 개인지)
-- 카드 6: Top Album      (Top 50에서 가장 많이 등장한 앨범)
-- 카드 7: Taste Shift    (최근 4주 vs 평생 비교)
--
-- 마이그 전에 생성된 행은 NULL로 남고, 카드 재생성 시 채워짐.

ALTER TABLE wrapped_reports
  ADD COLUMN IF NOT EXISTS top_loyalty JSONB,
  ADD COLUMN IF NOT EXISTS top_album JSONB,
  ADD COLUMN IF NOT EXISTS taste_shift JSONB;
