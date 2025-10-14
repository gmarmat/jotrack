'use client';

import { useState, useEffect } from 'react';
import { Moon, Sun } from 'lucide-react';
import { useTheme } from 'next-themes';

export default function ThemeToggle() {
  const [mounted, setMounted] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();

  // useEffect only runs on the client, so now we can safely show the UI
  useEffect(() => {
    setMounted(true);
  }, []);

  if (!mounted) {
    return (
      <button
        className="p-2 rounded-lg border border-gray-300 bg-white"
        disabled
      >
        <div className="w-5 h-5" />
      </button>
    );
  }

  // Use resolvedTheme to properly detect current theme (handles 'system' theme)
  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  return (
    <button
      onClick={() => {
        const newTheme = isDark ? 'light' : 'dark';
        setTheme(newTheme);
      }}
      className="p-2 rounded-lg border border-gray-300 bg-white dark:bg-gray-800 dark:border-gray-600 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      data-testid="theme-toggle"
    >
      {isDark ? (
        <Sun className="w-5 h-5 text-yellow-500" />
      ) : (
        <Moon className="w-5 h-5 text-gray-700" />
      )}
    </button>
  );
}

