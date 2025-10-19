"use client";

import { ExternalLink, FileText, Settings, Moon, Sun, User, ChevronDown, ChevronUp } from "lucide-react";
import { calculateDelta, formatDateTime } from "@/lib/timeDelta";
import { useState, useEffect } from "react";
import { useTheme } from "next-themes";
import GlobalSettingsModal from "../GlobalSettingsModal";

interface CollapsibleHeaderMetaProps {
  postingUrl?: string | null;
  createdAt: number;
  updatedAt: number;
  currentStatusEnteredAt?: number;
  jdAttachmentId?: string | null;
  onViewJd?: () => void;
}

export default function CollapsibleHeaderMeta({
  postingUrl,
  createdAt,
  updatedAt,
  currentStatusEnteredAt,
  jdAttachmentId,
  onViewJd,
}: CollapsibleHeaderMetaProps) {
  const [showSettings, setShowSettings] = useState(false);
  const [mounted, setMounted] = useState(false);
  const [isCollapsed, setIsCollapsed] = useState(false);
  const { theme, setTheme, resolvedTheme } = useTheme();
  
  const delta = currentStatusEnteredAt
    ? calculateDelta(currentStatusEnteredAt)
    : null;

  // Handle theme toggle on client only
  useEffect(() => {
    setMounted(true);
  }, []);

  // Auto-collapse on scroll (same as timeline)
  useEffect(() => {
    const handleScroll = () => {
      const scrolled = window.scrollY > 100;
      setIsCollapsed(scrolled);
    };

    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const currentTheme = resolvedTheme || theme;
  const isDark = currentTheme === 'dark';

  // Compact version (collapsed) - floats alongside timeline
  if (isCollapsed) {
    return (
      <div className="fixed top-4 left-4 z-40">
        <div className="bg-gradient-to-r from-purple-100 to-blue-100 dark:from-purple-950/65 dark:to-blue-950/65 border border-purple-200 dark:border-purple-800 rounded-xl p-3 shadow-md transition-all duration-300 backdrop-blur-sm">
          <div className="flex items-center gap-3">
            {/* Quick Actions */}
            <div className="flex items-center gap-2">
              {jdAttachmentId && onViewJd && (
                <button
                  onClick={onViewJd}
                  className="p-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors"
                  title="View JD"
                >
                  <FileText size={14} />
                </button>
              )}
              
              {postingUrl && (
                <a
                  href={postingUrl}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="p-2 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                  title="View Posting"
                >
                  <ExternalLink size={14} />
                </a>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Metadata */}
            <div className="flex items-center gap-2 text-xs text-gray-600 dark:text-gray-400">
              <span className="font-medium">{formatDateTime(createdAt)}</span>
              <span>•</span>
              <span className="font-medium">{formatDateTime(updatedAt)}</span>
              
              {/* Delta Chip */}
              {delta && (
                <div 
                  className={`px-2 py-0.5 rounded-full font-semibold text-xs ${
                    delta.isStale
                      ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                      : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
                  }`}
                  title={`In current status for ${delta.days} days`}
                >
                  {delta.label}
                </div>
              )}
            </div>

            {/* Divider */}
            <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

            {/* Action Buttons */}
            <div className="flex items-center gap-1">
              {/* User Profile Button */}
              <button
                onClick={() => {
                  alert('User Profile - Coming soon!');
                }}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="User Profile"
              >
                <User className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>

              {/* Theme Toggle */}
              {mounted && (
                <button
                  onClick={() => {
                    const newTheme = isDark ? 'light' : 'dark';
                    setTheme(newTheme);
                  }}
                  className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                  title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
                >
                  {isDark ? (
                    <Sun className="w-4 h-4 text-yellow-500" />
                  ) : (
                    <Moon className="w-4 h-4 text-gray-700" />
                  )}
                </button>
              )}

              {/* Settings Button */}
              <button
                onClick={() => setShowSettings(true)}
                className="p-2 rounded-lg bg-white/80 dark:bg-gray-800/80 hover:bg-white dark:hover:bg-gray-800 transition-colors"
                title="Settings"
              >
                <Settings className="w-4 h-4 text-gray-700 dark:text-gray-300" />
              </button>
            </div>

            {/* Expand Button */}
            <button
              onClick={() => setIsCollapsed(false)}
              className="p-1 hover:bg-purple-100 dark:hover:bg-purple-800/30 rounded transition-colors"
              title="Expand header"
            >
              <ChevronDown className="text-purple-600 dark:text-purple-400" size={16} />
            </button>
          </div>
        </div>
      </div>
    );
  }

  // Full version (expanded)
  return (
    <div 
      className="bg-gradient-to-r from-gray-50 to-white dark:from-gray-800 dark:to-gray-700 border border-gray-200 dark:border-gray-700 rounded-lg px-6 py-3 transition-all duration-300"
      data-testid="header-meta"
    >
      {/* Collapse Button */}
      <div className="flex justify-end mb-2">
        <button
          onClick={() => setIsCollapsed(true)}
          className="p-1 hover:bg-gray-100 dark:hover:bg-gray-600 rounded transition-colors"
          title="Collapse header"
        >
          <ChevronUp className="text-gray-600 dark:text-gray-400" size={16} />
        </button>
      </div>

      <div className="flex items-center justify-between max-w-7xl mx-auto flex-wrap gap-3">
        {/* Left: Quick Links */}
        <div className="flex items-center gap-3">
          {jdAttachmentId && onViewJd && (
            <button
              onClick={onViewJd}
              className="flex items-center gap-1.5 px-3 py-1.5 bg-blue-600 text-white rounded-lg hover:bg-blue-700 text-sm font-medium transition-colors"
              data-testid="view-jd-link"
            >
              <FileText size={14} />
              View JD
            </button>
          )}
          
          {postingUrl && (
            <a
              href={postingUrl}
              target="_blank"
              rel="noopener noreferrer"
              className="flex items-center gap-1.5 px-3 py-1.5 bg-gray-600 text-white rounded-lg hover:bg-gray-700 text-sm font-medium transition-colors"
              data-testid="posting-link"
            >
              <ExternalLink size={14} />
              View Posting
            </a>
          )}
        </div>

        {/* Right: Metadata + Action Buttons */}
        <div className="flex items-center gap-4 text-xs text-gray-600 dark:text-gray-400">
          <div title={formatDateTime(createdAt)}>
            <span className="font-medium">Created:</span> {formatDateTime(createdAt)}
          </div>
          <div title={formatDateTime(updatedAt)}>
            <span className="font-medium">Updated:</span> {formatDateTime(updatedAt)}
          </div>

          {/* Delta Chip */}
          {delta && (
            <div 
              className={`px-2.5 py-1 rounded-full font-semibold ${
                delta.isStale
                  ? "bg-amber-100 text-amber-700 dark:bg-amber-900/30 dark:text-amber-300"
                  : "bg-blue-100 text-blue-700 dark:bg-blue-900/30 dark:text-blue-300"
              }`}
              data-testid="timeline-current-delta"
              title={`In current status for ${delta.days} days`}
            >
              {delta.label}
            </div>
          )}

          {/* Stale Badge */}
          {delta && delta.isStale && (
            <div 
              className="px-2.5 py-1 bg-red-100 text-red-700 dark:bg-red-900/30 dark:text-red-300 rounded-full text-[10px] font-bold"
              data-testid="stale-badge"
            >
              ⏳ STALE
            </div>
          )}

          {/* Divider */}
          <div className="w-px h-6 bg-gray-300 dark:bg-gray-600" />

          {/* User Profile Button */}
          <button
            onClick={() => {
              alert('User Profile - Coming soon!');
            }}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="View User Profile"
            data-testid="user-profile-button"
          >
            <User className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>

          {/* Theme Toggle */}
          {mounted && (
            <button
              onClick={() => {
                const newTheme = isDark ? 'light' : 'dark';
                setTheme(newTheme);
              }}
              className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
              title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
              data-testid="theme-toggle"
            >
              {isDark ? (
                <Sun className="w-5 h-5 text-yellow-500" />
              ) : (
                <Moon className="w-5 h-5 text-gray-700" />
              )}
            </button>
          )}

          {/* Settings Button */}
          <button
            onClick={() => setShowSettings(true)}
            className="p-2 rounded-lg border border-gray-300 dark:border-gray-600 bg-white dark:bg-gray-800 hover:bg-gray-50 dark:hover:bg-gray-700 transition-colors"
            title="Settings"
            data-testid="global-settings-button"
          >
            <Settings className="w-5 h-5 text-gray-700 dark:text-gray-300" />
          </button>
        </div>
      </div>

      {/* Global Settings Modal */}
      <GlobalSettingsModal
        isOpen={showSettings}
        onClose={() => setShowSettings(false)}
      />
    </div>
  );
}
