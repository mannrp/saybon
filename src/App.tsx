import { useState } from 'react';
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { AnimatePresence, motion } from 'framer-motion';
import { DashboardPage } from './components/dashboard/DashboardPage';
import { VocabPracticePage } from './components/vocabulary/VocabPracticePage';
import { ExplorePage } from './components/explore/ExplorePage';
import { HeatmapPage } from './components/vocabulary/HeatmapPage';
import { SettingsPage } from './components/settings/SettingsPage';
import { ThemeToggle } from './components/shared/ThemeToggle';
import { InstallButton } from './components/shared/InstallButton';

function NavigationBar({ onOpenSettings }: { onOpenSettings: () => void }) {
  const location = useLocation();

  const isActive = (path: string) => {
    if (path === '/') {
      return location.pathname === '/' || location.pathname === '/dashboard';
    }
    return location.pathname.startsWith(path);
  };

  const navItems = [
    {
      path: '/',
      label: 'Home',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M3 12l2-2m0 0l7-7 7 7M5 10v10a1 1 0 001 1h3m10-11l2 2m-2-2v10a1 1 0 01-1 1h-3m-6 0a1 1 0 001-1v-4a1 1 0 011-1h2a1 1 0 011 1v4a1 1 0 001 1m-6 0h6" />
        </svg>
      ),
    },
    {
      path: '/practice',
      label: 'Practice',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2m-6 9l2 2 4-4" />
        </svg>
      ),
    },
    {
      path: '/explore',
      label: 'Explore',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M12 6.253v13m0-13C10.832 5.477 9.246 5 7.5 5S4.168 5.477 3 6.253v13C4.168 18.477 5.754 18 7.5 18s3.332.477 4.5 1.253m0-13C13.168 5.477 14.754 5 16.5 5c1.747 0 3.332.477 4.5 1.253v13C19.832 18.477 18.247 18 16.5 18c-1.746 0-3.332.477-4.5 1.253" />
        </svg>
      ),
    },
    {
      path: '/progress',
      label: 'Progress',
      icon: (
        <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" d="M11.049 2.927c.3-.921 1.603-.921 1.902 0l1.519 4.674a1 1 0 00.95.69h4.907c.961 0 1.36 1.248.588 1.81l-3.97 2.883a1 1 0 00-.364 1.118l1.518 4.674c.3.922-.755 1.688-1.538 1.118l-3.971-2.883a1 1 0 00-1.18 0l-3.97 2.883c-.783.57-1.838-.197-1.538-1.118l1.518-4.674a1 1 0 00-.364-1.118L2.49 10.1c-.773-.562-.373-1.81.588-1.81h4.907a1 1 0 00.95-.69l1.52-4.674z" />
        </svg>
      ),
    },
  ];

  return (
    <>
      {/* Top Header Navigation (Desktop/Brand) */}
      <nav className="sticky top-0 bg-[var(--color-bg-card)] border-b border-[var(--color-border)] z-40">
        <div className="max-w-4xl mx-auto px-4 h-16 flex items-center justify-between">
          <Link to="/" className="flex items-center space-x-2">
            <h1 className="text-2xl font-bold tracking-tight text-[var(--color-primary)]" style={{ fontFamily: 'Georgia, serif' }}>
              SayBon
            </h1>
          </Link>

          {/* Desktop Nav Items */}
          <div className="hidden md:flex space-x-6">
            {navItems.map((item) => (
              <Link
                key={item.path}
                to={item.path}
                className={`text-sm font-semibold tracking-wider uppercase transition-colors px-1 py-2 border-b-2 ${
                  isActive(item.path)
                    ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                {item.label}
              </Link>
            ))}
          </div>

          {/* Right Header utilities */}
          <div className="flex items-center space-x-3">
            <InstallButton />
            <ThemeToggle />
            <button
              onClick={onOpenSettings}
              className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)] hover:text-[var(--color-text-primary)] transition-all"
              aria-label="Settings"
            >
              <svg className="w-5 h-5" fill="none" stroke="currentColor" strokeWidth={2} viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" d="M10.325 4.317c.426-1.756 2.924-1.756 3.35 0a1.724 1.724 0 002.573 1.066c1.543-.94 3.31.826 2.37 2.37a1.724 1.724 0 001.065 2.572c1.756.426 1.756 2.924 0 3.35a1.724 1.724 0 00-1.066 2.573c.94 1.543-.826 3.31-2.37 2.37a1.724 1.724 0 00-2.572 1.065c-.426 1.756-2.924 1.756-3.35 0a1.724 1.724 0 00-2.573-1.066c-1.543.94-3.31-.826-2.37-2.37a1.724 1.724 0 00-1.065-2.572c-1.756-.426-1.756-2.924 0-3.35a1.724 1.724 0 001.066-2.573c-.94-1.543.826-3.31 2.37-2.37.996.608 2.296.07 2.572-1.065z" />
                <path strokeLinecap="round" strokeLinejoin="round" d="M15 12a3 3 0 11-6 0 3 3 0 016 0z" />
              </svg>
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Bottom Tab Bar */}
      <div className="md:hidden fixed bottom-0 left-0 right-0 bg-[var(--color-bg-card)] border-t border-[var(--color-border)] z-40 px-2 pb-safe shadow-lg">
        <div className="flex justify-around items-center h-16">
          {navItems.map((item) => (
            <Link
              key={item.path}
              to={item.path}
              className={`flex flex-col items-center justify-center flex-1 h-full py-1 transition-all ${
                isActive(item.path)
                  ? 'text-[var(--color-primary)] font-bold'
                  : 'text-[var(--color-text-secondary)]'
              }`}
            >
              {item.icon}
              <span className="text-[10px] uppercase tracking-wider font-semibold mt-1">
                {item.label}
              </span>
            </Link>
          ))}
        </div>
      </div>
    </>
  );
}

function App() {
  const [settingsOpen, setSettingsOpen] = useState(false);

  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg-primary)] flex flex-col">
        <NavigationBar onOpenSettings={() => setSettingsOpen(true)} />
        
        <main className="flex-1 w-full max-w-4xl mx-auto px-0 md:px-4">
          <Routes>
            <Route path="/" element={<DashboardPage />} />
            <Route path="/dashboard" element={<DashboardPage />} />
            <Route path="/practice" element={<VocabPracticePage />} />
            <Route path="/explore" element={<ExplorePage />} />
            <Route path="/progress" element={<HeatmapPage />} />
          </Routes>
        </main>

        {/* Global Settings Modal Drawer */}
        <AnimatePresence>
          {settingsOpen && (
            <div className="fixed inset-0 bg-black/40 backdrop-blur-sm z-50 flex items-center justify-end">
              <motion.div
                initial={{ x: '100%' }}
                animate={{ x: 0 }}
                exit={{ x: '100%' }}
                transition={{ type: 'spring', damping: 25, stiffness: 220 }}
                className="w-full max-w-lg bg-[var(--color-bg-primary)] h-full overflow-y-auto border-l border-[var(--color-border)] shadow-2xl relative"
              >
                <div className="sticky top-0 bg-[var(--color-bg-primary)] border-b border-[var(--color-border)] z-10 px-6 py-4 flex items-center justify-between">
                  <h3 className="text-xl font-bold" style={{ fontFamily: 'Georgia, serif' }}>Studio Settings</h3>
                  <button
                    onClick={() => setSettingsOpen(false)}
                    className="p-2 rounded-full hover:bg-[var(--color-bg-secondary)] border border-[var(--color-border)] text-[var(--color-text-secondary)]"
                  >
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="p-2">
                  <SettingsPage />
                </div>
              </motion.div>
            </div>
          )}
        </AnimatePresence>
      </div>
    </BrowserRouter>
  );
}

export default App;

