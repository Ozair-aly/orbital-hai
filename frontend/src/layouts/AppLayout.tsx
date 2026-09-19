// AppLayout.tsx — The persistent shell wrapping every page.
// Contains: Sidebar (left) + main content area (right).

import { useState } from 'react';
import type { ReactNode } from 'react';
import { Sidebar } from './Sidebar';
import { Topbar } from './Topbar';
import { VoiceAssistant } from '../components/VoiceAssistant';

interface Props { children: ReactNode }

export function AppLayout({ children }: Props) {
  const [sidebarOpen, setSidebarOpen] = useState(true);

  return (
    <div className="flex h-screen overflow-hidden" style={{ background: '#F7F9FC' }}>
      {/* Sidebar */}
      <Sidebar open={sidebarOpen} />

      {/* Main area */}
      <div className="flex flex-col flex-1 min-w-0 overflow-hidden">
        <Topbar onMenuToggle={() => setSidebarOpen(!sidebarOpen)} />

        {/* Scrollable page content */}
        <main className="flex-1 overflow-y-auto p-6">
          {children}
        </main>
      </div>

      {/* Floating voice assistant */}
      <VoiceAssistant />
    </div>
  );
}
