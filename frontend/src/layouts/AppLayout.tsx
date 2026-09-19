// AppLayout.tsx — Persistent responsive shell wrapping every page.

import { useState, useEffect } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VoiceAssistant } from '../components/VoiceAssistant';

interface Props { children: ReactNode }

export function AppLayout({ children }: Props) {
  // Desktop sidebar visibility
  const [sidebarOpen, setSidebarOpen] = useState(true);
  // Mobile drawer visibility
  const [mobileMenuOpen, setMobileMenuOpen] = useState(false);

  // Close mobile menu on resize to desktop
  useEffect(() => {
    const handleResize = () => {
      if (window.innerWidth >= 1024) {
        setMobileMenuOpen(false);
      }
    };
    window.addEventListener('resize', handleResize);
    return () => window.removeEventListener('resize', handleResize);
  }, []);

  const handleToggleMenu = () => {
    if (window.innerWidth < 1024) {
      setMobileMenuOpen((prev) => !prev);
    } else {
      setSidebarOpen((prev) => !prev);
    }
  };

  return (
    <div className="flex h-screen overflow-hidden bg-[#F7F9FC]">
      {/* Sidebar: handles both desktop static dock and mobile slide-over drawer */}
      <Sidebar
        desktopOpen={sidebarOpen}
        mobileOpen={mobileMenuOpen}
        onMobileClose={() => setMobileMenuOpen(false)}
      />

      {/* Main viewport area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={handleToggleMenu} />

        {/* Scrollable page container with responsive padding */}
        <main className="flex-1 overflow-y-auto p-3 sm:p-6">
          {children}
        </main>
      </div>

      {/* Floating voice assistant */}
      <VoiceAssistant />
    </div>
  );
}
