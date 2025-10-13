'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import GlobalSettingsModal from './GlobalSettingsModal';

export default function AppHeader() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <div className="sticky top-0 z-30 bg-white border-b border-gray-200 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            {/* Logo/Title */}
            <div className="flex items-center gap-3">
              <h1 className="text-xl font-bold text-gray-900">🎯 JoTrack</h1>
            </div>

            {/* Settings Icon */}
            <button
              onClick={() => setShowSettings(true)}
              className="p-2 hover:bg-gray-100 rounded-lg transition-colors"
              title="Settings"
              data-testid="global-settings-button"
            >
              <Settings size={20} className="text-gray-600" />
            </button>
          </div>
        </div>
      </div>

      {/* Global Settings Modal */}
      <GlobalSettingsModal 
        isOpen={showSettings} 
        onClose={() => setShowSettings(false)} 
      />
    </>
  );
}

