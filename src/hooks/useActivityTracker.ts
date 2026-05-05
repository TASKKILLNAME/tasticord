'use client';

import { useEffect, useRef } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useTrackActivity } from '@/hooks/useActivityPresence';

const POLL_INTERVAL_MS = 30_000;

/**
 * 로그인된 유저의 현재 활동을 30초 간격으로 폴링해서 Presence에 반영.
 * 우선순위: 게임(현재 플레이 중) > 음악(현재 재생 중)
 * 둘 다 없으면 untrack.
 *
 * (main) 레이아웃에서 1번만 마운트.
 */
export function useActivityTracker() {
  const { currentUser } = useAuth();
  const { setActivity, clearActivity } = useTrackActivity();
  const lastSignatureRef = useRef<string | null>(null);

  useEffect(() => {
    if (!currentUser) return;

    let cancelled = false;

    async function poll() {
      if (cancelled || !currentUser) return;

      try {
        // 두 API 병렬 호출 (각자 fetch 실패해도 다른 쪽은 시도)
        const [steamRes, spotifyRes] = await Promise.allSettled([
          fetch('/api/steam/currently-playing').then((r) => (r.ok ? r.json() : null)),
          fetch('/api/spotify/now-playing').then((r) => (r.ok ? r.json() : null)),
        ]);

        const steam = steamRes.status === 'fulfilled' ? steamRes.value : null;
        const spotify = spotifyRes.status === 'fulfilled' ? spotifyRes.value : null;

        // 1) 게임 우선
        if (steam?.isPlaying && steam?.gameName) {
          const sig = `steam:${steam.gameId}:${steam.gameName}`;
          if (sig !== lastSignatureRef.current) {
            lastSignatureRef.current = sig;
            await setActivity({
              user_id: currentUser.id,
              username: currentUser.nickname,
              avatar_url: currentUser.avatar_url,
              type: 'gaming',
              platform: 'steam',
              title: steam.gameName,
              detail: steam.steamLevel ? `Lv.${steam.steamLevel}` : undefined,
              image_url: steam.gameId
                ? `https://cdn.cloudflare.steamstatic.com/steam/apps/${steam.gameId}/header.jpg`
                : null,
              external_url: steam.gameId
                ? `https://store.steampowered.com/app/${steam.gameId}`
                : null,
            });
          }
          return;
        }

        // 2) 음악
        if (spotify?.is_playing && spotify?.item) {
          const item = spotify.item as {
            id?: string;
            name?: string;
            artists?: { name: string }[];
            album?: { images?: { url: string }[] };
            external_urls?: { spotify?: string };
          };
          const trackName = item.name;
          if (trackName) {
            const sig = `spotify:${item.id}:${trackName}`;
            if (sig !== lastSignatureRef.current) {
              lastSignatureRef.current = sig;
              await setActivity({
                user_id: currentUser.id,
                username: currentUser.nickname,
                avatar_url: currentUser.avatar_url,
                type: 'listening',
                platform: 'spotify',
                title: trackName,
                detail: item.artists?.map((a) => a.name).join(', ') || undefined,
                image_url: item.album?.images?.[0]?.url || null,
                external_url: item.external_urls?.spotify || null,
              });
            }
            return;
          }
        }

        // 3) 활동 없음 → untrack (이전에 track한 상태였다면)
        if (lastSignatureRef.current !== null) {
          lastSignatureRef.current = null;
          await clearActivity();
        }
      } catch (e) {
        console.error('[ActivityTracker] poll failed:', e);
      }
    }

    poll();
    const interval = setInterval(poll, POLL_INTERVAL_MS);

    return () => {
      cancelled = true;
      clearInterval(interval);
      lastSignatureRef.current = null;
      clearActivity();
    };
  }, [currentUser, setActivity, clearActivity]);
}
