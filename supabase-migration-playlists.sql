-- 플레이리스트 기능 확장 마이그레이션
-- 역할(방장/편집자/뷰어), 곡 메타데이터, 커버 이미지, 스토리지 버킷

-- 플레이리스트 권한 (방장/편집자/뷰어)
ALTER TABLE playlist_members ADD COLUMN IF NOT EXISTS role TEXT NOT NULL DEFAULT 'viewer' CHECK (role IN ('owner', 'editor', 'viewer'));
UPDATE playlist_members pm SET role = 'owner' FROM shared_playlists sp WHERE pm.playlist_id = sp.id AND pm.user_id = sp.created_by AND pm.role = 'viewer';

-- 곡 메타데이터
ALTER TABLE playlist_songs ADD COLUMN IF NOT EXISTS preview_url TEXT;
ALTER TABLE playlist_songs ADD COLUMN IF NOT EXISTS external_url TEXT;
ALTER TABLE playlist_songs ADD COLUMN IF NOT EXISTS genre TEXT;
ALTER TABLE playlist_songs ADD COLUMN IF NOT EXISTS links JSONB DEFAULT '{}';

-- 플레이리스트 커버
ALTER TABLE shared_playlists ADD COLUMN IF NOT EXISTS cover_url TEXT;

-- 스토리지 버킷
INSERT INTO storage.buckets (id, name, public) VALUES ('playlist-covers', 'playlist-covers', true) ON CONFLICT DO NOTHING;

DROP POLICY IF EXISTS "Authenticated users can upload covers" ON storage.objects;
CREATE POLICY "Authenticated users can upload covers" ON storage.objects FOR INSERT TO authenticated WITH CHECK (bucket_id = 'playlist-covers');
DROP POLICY IF EXISTS "Anyone can view covers" ON storage.objects;
CREATE POLICY "Anyone can view covers" ON storage.objects FOR SELECT TO public USING (bucket_id = 'playlist-covers');
