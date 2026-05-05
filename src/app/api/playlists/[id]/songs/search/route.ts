import { NextResponse } from 'next/server';
import { createClient } from '@/lib/supabase/server';

// iTunes Search API로 곡 검색 — 별도 API 키 불필요
// 미리 듣기 URL과 각 플랫폼 링크 힌트를 제공
export async function GET(request: Request, { params }: { params: Promise<{ id: string }> }) {
  try {
    await params; // playlist id는 사용하지 않지만 라우트 패턴 유지
    const supabase = await createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });

    const { searchParams } = new URL(request.url);
    const q = searchParams.get('q')?.trim() || '';
    if (!q) return NextResponse.json({ results: [] });

    const res = await fetch(
      `https://itunes.apple.com/search?term=${encodeURIComponent(q)}&media=music&entity=song&limit=15&country=KR`,
      { headers: { Accept: 'application/json' } }
    );

    if (!res.ok) return NextResponse.json({ results: [] });
    const json = await res.json();

    interface ITunesTrack {
      trackId?: number;
      trackName?: string;
      artistName?: string;
      collectionName?: string;
      artworkUrl100?: string;
      trackTimeMillis?: number;
      previewUrl?: string;
      trackViewUrl?: string;
      primaryGenreName?: string;
    }

    const results = ((json?.results || []) as ITunesTrack[])
      .filter((r) => r.trackName && r.artistName)
      .map((r) => ({
        trackId: r.trackId,
        title: r.trackName,
        artist: r.artistName,
        album: r.collectionName || null,
        // 100x100 → 300x300 고해상도로 치환
        image_url: (r.artworkUrl100 || '').replace('100x100bb', '300x300bb') || null,
        duration_ms: r.trackTimeMillis || null,
        preview_url: r.previewUrl || null,
        external_url: r.trackViewUrl || null,
        genre: r.primaryGenreName || null,
      }));

    return NextResponse.json(
      { results },
      { headers: { 'Cache-Control': 'private, max-age=300' } }
    );
  } catch {
    return NextResponse.json({ results: [] });
  }
}
