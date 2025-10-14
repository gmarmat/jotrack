'use client';

import { useState } from 'react';
import { Settings } from 'lucide-react';
import GlobalSettingsModal from './GlobalSettingsModal';

export default function GlobalSettingsButton() {
  const [showSettings, setShowSettings] = useState(false);

  return (
    <>
      <button
        onClick={() => setShowSettings(true)}
        className="fixed top-4 right-4 z-40 p-3 bg-white rounded-full shadow-lg hover:shadow-xl transition-shadow border border-gray-200 hover:bg-gray-50"
        title="Settings"
        data-testid="global-settings-button"
      >
        <Settings className="w-5 h-5 text-gray-700" />
      </button>

      <GlobalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </>
  );
}

