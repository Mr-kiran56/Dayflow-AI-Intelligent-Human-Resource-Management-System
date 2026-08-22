import React, { useState } from 'react';
import { useLocation } from 'react-router-dom';
import { Sidebar } from './Sidebar';
import { Header } from './Header';
import { CommandPalette } from './CommandPalette';

export const AppShell: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const [mobileSidebarOpen, setMobileSidebarOpen] = useState(false);
  const [commandPaletteOpen, setCommandPaletteOpen] = useState(false);
  const location = useLocation();
  const isAiPage = location.pathname === '/ai';

  return (
    <div className="h-screen h-[100dvh] bg-slate-50/90 flex overflow-hidden relative selection:bg-indigo-600 selection:text-white">

      {/* Google Material 3 Ambient Floating Gradient Mesh Background */}
      <div className="fixed top-0 left-1/4 w-[600px] h-[600px] bg-blue-400/15 rounded-full blur-[140px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-0 right-1/4 w-[650px] h-[650px] bg-indigo-500/12 rounded-full blur-[160px] pointer-events-none" />
      <div className="fixed top-1/3 right-10 w-[450px] h-[450px] bg-purple-400/12 rounded-full blur-[120px] pointer-events-none animate-pulse" />
      <div className="fixed bottom-10 left-10 w-[500px] h-[500px] bg-emerald-400/12 rounded-full blur-[130px] pointer-events-none" />

      {/* Fixed Left Sidebar */}
      <Sidebar mobileOpen={mobileSidebarOpen} setMobileOpen={setMobileSidebarOpen} />

      {/* Content Viewport */}
      <div className="flex-1 flex flex-col min-w-0 lg:pl-64 h-full overflow-hidden relative z-10">

        {/* Fixed Top Header */}
        <Header
          onOpenMobileSidebar={() => setMobileSidebarOpen(true)}
          onOpenCommandPalette={() => setCommandPaletteOpen(true)}
        />

        {/* Viewport: Static for /ai page, Scrollable for standard pages */}
        <main
          className={`flex-1 max-w-7xl w-full mx-auto ${
            isAiPage
              ? 'overflow-hidden p-3 sm:p-4 flex flex-col h-[calc(100vh-4rem)]'
              : 'overflow-y-auto p-4 sm:p-6 lg:p-8 custom-scrollbar'
          }`}
        >
          {children}
        </main>
      </div>

      <CommandPalette isOpen={commandPaletteOpen} onClose={() => setCommandPaletteOpen(false)} />
    </div>
  );
};
