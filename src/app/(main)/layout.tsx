import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import NowPlayingSyncMount from '@/components/layout/NowPlayingSyncMount';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* Spotify 현재 재생곡을 3분마다 user_now_playing 캐시에 반영 */}
      <NowPlayingSyncMount />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
