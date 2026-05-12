-- activities 테이블에 'recommend' 타입 추가
-- 홈 피드에서 사용자가 직접 음악/게임/영화 추천 카드를 올릴 수 있게 함
-- 기존 활동(listening/playing 등)과 같은 테이블 사용 → 좋아요/댓글 인프라 자동 재활용

-- 1. 기존 CHECK 제약 삭제
ALTER TABLE activities DROP CONSTRAINT IF EXISTS activities_activity_type_check;

-- 2. 새 CHECK 제약 — 'recommend' 추가
ALTER TABLE activities
  ADD CONSTRAINT activities_activity_type_check
  CHECK (activity_type IN ('listening', 'playing', 'watching', 'exercising', 'liked', 'playlist_add', 'recommend'));

-- 3. 추천 정렬 빠르게 — created_at desc 인덱스 (없으면 생성)
CREATE INDEX IF NOT EXISTS idx_activities_recommend_created
  ON activities (created_at DESC)
  WHERE activity_type = 'recommend';
