'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@/lib/supabase/client';
import type { Profile } from '@/types';
import { getAvatarColor } from '@/lib/utils/helpers';
import { RefreshCw } from 'lucide-react';

interface FriendWithProfile {
  friend_id: string;
  friend: Profile;
}

export default function FriendsPage() {
  const router = useRouter();
  const [search, setSearch] = useState('');
  const [friends, setFriends] = useState<FriendWithProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [syncing, setSyncing] = useState(false);
  const [toast, setToast] = useState<string | null>(null);

  async function fetchFriends() {
    const supabase = createClient();
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;

    const { data } = await supabase
      .from('friendships')
      .select('friend_id, friend:profiles!friendships_friend_id_fkey(*)')
      .eq('user_id', user.id);

    setFriends((data || []) as unknown as FriendWithProfile[]);
    setLoading(false);
  }

  useEffect(() => {
    fetchFriends();
  }, []);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(null), 2500);
  };

  const handleSync = async () => {
    if (syncing) return;
    setSyncing(true);
    try {
      const res = await fetch('/api/kakao/sync', { method: 'POST' });
      const data = await res.json();
      if (res.ok) {
        showToast(`${data.newFriends ?? 0}명 동기화됨`);
        await fetchFriends();
      } else {
        showToast(data.error || '동기화에 실패했습니다');
      }
    } catch {
      showToast('동기화에 실패했습니다');
    } finally {
      setSyncing(false);
    }
  };

  const filtered = friends.filter((f) =>
    f.friend?.nickname?.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="max-w-3xl mx-auto p-8 animate-fade-up">
      <h2 className="text-2xl font-bold mb-6">친구</h2>

      <input
        type="text"
        value={search}
        onChange={(e) => setSearch(e.target.value)}
        className="w-full p-3 px-5 rounded-full bg-zinc-900 border border-zinc-800 text-sm placeholder-zinc-600 outline-none focus:border-zinc-600 transition mb-6"
        placeholder="친구 검색..."
      />

      <div className="flex items-center justify-between mb-4">
        <h3 className="text-xs font-bold text-zinc-500 uppercase tracking-widest">
          카카오톡 친구 · {filtered.length}명
        </h3>
        <button
          onClick={handleSync}
          disabled={syncing}
          title="카카오 친구 동기화"
          className="p-2 rounded-lg text-zinc-500 hover:text-zinc-200 hover:bg-zinc-800/60 transition disabled:opacity-50 disabled:cursor-not-allowed"
        >
          <RefreshCw className={`w-4 h-4 ${syncing ? 'animate-spin' : ''}`} />
        </button>
      </div>

      {loading ? (
        <div className="space-y-2">
          {[1, 2, 3].map((i) => (
            <div key={i} className="bg-zinc-900/50 border border-zinc-800/35 rounded-xl p-4 animate-pulse flex items-center gap-4">
              <div className="w-12 h-12 rounded-full bg-zinc-800" />
              <div className="space-y-2 flex-1">
                <div className="w-20 h-4 bg-zinc-800 rounded" />
                <div className="w-32 h-3 bg-zinc-800 rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : filtered.length === 0 ? (
        <div className="text-center py-20">
          <div className="text-zinc-600 text-lg">아직 친구가 없습니다</div>
          <p className="text-zinc-700 text-sm mt-2">카카오톡 친구가 가입하면 자동으로 추가됩니다</p>
        </div>
      ) : (
        <div className="space-y-1">
          {filtered.map((item) => {
            const friend = item.friend;
            const colorClass = getAvatarColor(friend.nickname);
            return (
              <div
                key={item.friend_id}
                onClick={() => router.push(`/friends/${item.friend_id}`)}
                className="bg-zinc-900/50 backdrop-blur-xl border border-zinc-800/35 rounded-xl p-4 flex items-center gap-4 cursor-pointer hover:bg-zinc-800/60 hover:border-zinc-700/50 transition-all"
              >
                {friend.avatar_url ? (
                  <img src={friend.avatar_url} alt={friend.nickname} className="w-12 h-12 rounded-full object-cover flex-shrink-0" />
                ) : (
                  <div className={`w-12 h-12 rounded-full ${colorClass} flex items-center justify-center font-bold text-sm flex-shrink-0`}>
                    {friend.nickname.slice(0, 2)}
                  </div>
                )}
                <div className="flex-1 min-w-0">
                  <div className="font-medium">{friend.nickname}</div>
                </div>
                <svg className="w-4 h-4 text-zinc-600 flex-shrink-0" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
                  <path d="M9 18l6-6-6-6" strokeLinecap="round" strokeLinejoin="round" />
                </svg>
              </div>
            );
          })}
        </div>
      )}

      {toast && (
        <div className="fixed bottom-24 md:bottom-8 left-1/2 -translate-x-1/2 bg-zinc-800 text-white text-sm px-4 py-2 rounded-lg shadow-lg z-50 animate-fade-up">
          {toast}
        </div>
      )}
    </div>
  );
}
