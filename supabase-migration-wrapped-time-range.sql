-- Tasticord Wrapped: time_range 컬럼 추가
-- 카드를 만들 때 사용자가 선택한 기간을 저장 (Spotify time_range)
-- short_term ~4주, medium_term ~6개월, long_term 전체 기간(~12개월+)
-- 기존 행은 long_term 디폴트
ALTER TABLE wrapped_reports
  ADD COLUMN time_range TEXT NOT NULL DEFAULT 'long_term'
    CHECK (time_range IN ('short_term', 'medium_term', 'long_term'));
