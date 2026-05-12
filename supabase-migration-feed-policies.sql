-- 활동 피드 RLS 정책 정정 + 본인 게시물 삭제 권한 추가
--
-- 문제 1: activity_comments / activity_likes의 기존 정책은 FOR ALL USING (...)만 있고
--         WITH CHECK이 없어 INSERT가 거부됨 (42501 RLS violation)
-- 문제 2: activities 테이블에 DELETE 정책이 없어 본인 게시물 삭제 불가

-- 1. activity_comments: USING + WITH CHECK 모두 명시
DROP POLICY IF EXISTS "Users can manage own comments" ON activity_comments;
CREATE POLICY "Users can manage own comments" ON activity_comments
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 2. activity_likes: 동일하게 WITH CHECK 추가
DROP POLICY IF EXISTS "Users can manage own likes" ON activity_likes;
CREATE POLICY "Users can manage own likes" ON activity_likes
  FOR ALL USING (auth.uid() = user_id) WITH CHECK (auth.uid() = user_id);

-- 3. activities: 본인 게시물 삭제 정책 추가 (없으면)
DROP POLICY IF EXISTS "Users can delete own activities" ON activities;
CREATE POLICY "Users can delete own activities" ON activities
  FOR DELETE USING (auth.uid() = user_id);
