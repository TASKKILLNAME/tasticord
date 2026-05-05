import Sidebar from '@/components/layout/Sidebar';
import MobileNav from '@/components/layout/MobileNav';
import ActivityTrackerMount from '@/components/layout/ActivityTrackerMount';

export default function MainLayout({ children }: { children: React.ReactNode }) {
  return (
    <div className="flex h-screen overflow-hidden">
      {/* 활동 상태를 Presence에 자동 반영 (백그라운드 폴링) */}
      <ActivityTrackerMount />
      <Sidebar />
      <main className="flex-1 overflow-y-auto pb-16 md:pb-0">
        {children}
      </main>
      <MobileNav />
    </div>
  );
}
