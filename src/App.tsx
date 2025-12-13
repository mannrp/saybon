// Main App component with routing
import { BrowserRouter, Routes, Route, Link, useLocation } from 'react-router-dom';
import { SettingsPage } from './components/settings/SettingsPage';
import { VocabPracticePage } from './components/vocabulary/VocabPracticePage';
import { HeatmapPage } from './components/vocabulary/HeatmapPage';
import { ThemeToggle } from './components/shared/ThemeToggle';
import { InstallButton } from './components/shared/InstallButton';

function Navigation() {
  const location = useLocation();

  const isActive = (path: string) => location.pathname === path;

  return (
    <nav className="bg-[var(--color-bg-card)] shadow-sm border-b border-[var(--color-border)]">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between h-16">
          <div className="flex">
            <div className="flex-shrink-0 flex items-center">
              <h1 className="text-2xl font-bold text-[var(--color-primary)]">SayBon</h1>
            </div>
            <div className="ml-6 flex space-x-8">
              <Link
                to="/"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/')
                    ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Practice
              </Link>
              <Link
                to="/heatmap"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/heatmap')
                    ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Heatmap
              </Link>
              <Link
                to="/settings"
                className={`inline-flex items-center px-1 pt-1 border-b-2 text-sm font-medium ${
                  isActive('/settings')
                    ? 'border-[var(--color-primary)] text-[var(--color-text-primary)]'
                    : 'border-transparent text-[var(--color-text-secondary)] hover:border-[var(--color-border)] hover:text-[var(--color-text-primary)]'
                }`}
              >
                Settings
              </Link>
            </div>
          </div>
          <div className="flex items-center">
            <InstallButton />
            <ThemeToggle />
          </div>
        </div>
      </div>
    </nav>
  );
}

function App() {
  return (
    <BrowserRouter>
      <div className="min-h-screen bg-[var(--color-bg-primary)]">
        <Navigation />
        <Routes>
          <Route path="/" element={<VocabPracticePage />} />
          <Route path="/heatmap" element={<HeatmapPage />} />
          <Route path="/settings" element={<SettingsPage />} />
        </Routes>
      </div>
    </BrowserRouter>
  );
}

export default App;
