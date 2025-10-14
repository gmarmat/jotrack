'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import GlobalSettingsModal from './GlobalSettingsModal';
import ThemeToggle from './ThemeToggle';

export default function GlobalSettingsButton() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      {/* Theme and Settings Buttons */}
      <div className="fixed top-4 right-4 z-40 flex items-center gap-2">
        <ThemeToggle />
        
        <button
          onClick={() => setShowSettings(true)}
          className="p-3 bg-white dark:bg-gray-800 rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 dark:border-gray-700 hover:bg-gray-50 dark:hover:bg-gray-700"
          title="Settings"
          data-testid="global-settings-button"
        >
          <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
        </button>
      </div>

      <GlobalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

