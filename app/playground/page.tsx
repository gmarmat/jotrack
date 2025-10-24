'use client';

import { useState } from 'react';
import TestAnimationButton from '@/app/components/ai/TestAnimationButton';
import { Sparkles, Beaker, Palette, Zap } from 'lucide-react';

export default function PlaygroundPage() {
  const [activeTab, setActiveTab] = useState<'animations' | 'buttons' | 'colors' | 'layouts'>('animations');

  return (
    <div className="min-h-screen bg-gradient-to-br from-purple-50 via-blue-50 to-indigo-50 dark:from-gray-900 dark:via-gray-800 dark:to-gray-900 overflow-x-hidden">
      {/* Header */}
      <div className="bg-white dark:bg-gray-800 border-b border-gray-200 dark:border-gray-700 shadow-sm">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4">
          <div className="flex items-center justify-between">
            <div className="flex items-center gap-3">
              <div className="p-2 bg-purple-600 rounded-lg">
                <Beaker className="w-6 h-6 text-white" />
              </div>
              <div>
                <h1 className="text-2xl font-bold text-gray-900 dark:text-gray-100">
                  🎨 UI Playground
                </h1>
                <p className="text-sm text-gray-600 dark:text-gray-400">
                  Experiment with animations, colors, and layouts - No tokens wasted!
                </p>
              </div>
            </div>
            <a
              href="/"
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 hover:bg-gray-200 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
            >
              ← Back to App
            </a>
          </div>
        </div>
      </div>

      {/* Tabs */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-4 sm:py-6">
        <div className="bg-white dark:bg-gray-800 rounded-xl border border-gray-200 dark:border-gray-700 shadow-lg overflow-hidden">
          <div className="border-b border-gray-200 dark:border-gray-700">
            <div className="flex gap-2 p-2">
              <button
                onClick={() => setActiveTab('animations')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'animations'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Sparkles size={18} />
                Animations
              </button>
              <button
                onClick={() => setActiveTab('buttons')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'buttons'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Zap size={18} />
                Buttons
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                  Soon
                </span>
              </button>
              <button
                onClick={() => setActiveTab('colors')}
                className={`flex items-center gap-2 px-4 py-2 rounded-lg font-medium transition-all ${
                  activeTab === 'colors'
                    ? 'bg-purple-600 text-white shadow-md'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                <Palette size={18} />
                Colors
                <span className="text-xs bg-yellow-400 text-yellow-900 px-2 py-0.5 rounded-full font-bold">
                  Soon
                </span>
              </button>
            </div>
          </div>

          {/* Content */}
          <div className="p-8">
            {activeTab === 'animations' && (
              <div className="space-y-6">
                <div>
                  <h2 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                    Animation Testing
                  </h2>
                  <p className="text-gray-600 dark:text-gray-400 mb-6">
                    Test different animation styles for the AI Analyze buttons. 
                    Pick your favorite, then we&apos;ll apply it to the real buttons!
                  </p>
                </div>

                {/* Centered Animation Tester */}
                <div className="flex items-center justify-center min-h-[500px] sm:min-h-[600px] py-8 overflow-auto">
                  <div className="w-full max-w-md">
                    <TestAnimationButton />
                  </div>
                </div>

                {/* Instructions */}
                <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-6 mt-8">
                  <h3 className="text-lg font-bold text-blue-900 dark:text-blue-300 mb-3">
                    📚 How to Use
                  </h3>
                  <ol className="space-y-2 text-sm text-blue-800 dark:text-blue-400">
                    <li><strong>1.</strong> Select an animation style from the grid (6 options)</li>
                    <li><strong>2.</strong> Adjust the duration slider to match your typical analysis time</li>
                    <li><strong>3.</strong> Click &quot;Start&quot; to see the animation in action</li>
                    <li><strong>4.</strong> Watch how the border animates during the countdown</li>
                    <li><strong>5.</strong> Try all 6 styles and pick your favorite!</li>
                    <li><strong>6.</strong> Tell me which one you like, and I&apos;ll apply it to the real buttons</li>
                  </ol>
                </div>

                {/* Animation Descriptions */}
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4 mt-6">
                  <div className="bg-purple-50 dark:bg-purple-900/20 border border-purple-200 dark:border-purple-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-purple-900 dark:text-purple-300 mb-2">
                      ✨ Sparkler Border (Recommended)
                    </h4>
                    <p className="text-xs text-purple-800 dark:text-purple-400">
                      Elegant sparkles that dance around the border. Subtle, tasteful, and premium feeling.
                    </p>
                  </div>
                  
                  <div className="bg-blue-50 dark:bg-blue-900/20 border border-blue-200 dark:border-blue-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-blue-900 dark:text-blue-300 mb-2">
                      🌈 Gradient Sweep
                    </h4>
                    <p className="text-xs text-blue-800 dark:text-blue-400">
                      Rotating purple→blue gradient. Smooth, modern, and dynamic.
                    </p>
                  </div>

                  <div className="bg-indigo-50 dark:bg-indigo-900/20 border border-indigo-200 dark:border-indigo-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-indigo-900 dark:text-indigo-300 mb-2">
                      🔄 Rotating Border
                    </h4>
                    <p className="text-xs text-indigo-800 dark:text-indigo-400">
                      Spinning border with gaps (conic gradient). Active and engaging.
                    </p>
                  </div>

                  <div className="bg-pink-50 dark:bg-pink-900/20 border border-pink-200 dark:border-pink-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-pink-900 dark:text-pink-300 mb-2">
                      💫 Pulse Glow
                    </h4>
                    <p className="text-xs text-pink-800 dark:text-pink-400">
                      Gentle pulsing glow. Calm, non-distracting, and soothing.
                    </p>
                  </div>

                  <div className="bg-amber-50 dark:bg-amber-900/20 border border-amber-200 dark:border-amber-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-amber-900 dark:text-amber-300 mb-2">
                      🎆 Neon Pulse
                    </h4>
                    <p className="text-xs text-amber-800 dark:text-amber-400">
                      Bright neon border pulse. High energy and impossible to miss.
                    </p>
                  </div>

                  <div className="bg-green-50 dark:bg-green-900/20 border border-green-200 dark:border-green-800 rounded-lg p-4">
                    <h4 className="text-sm font-bold text-green-900 dark:text-green-300 mb-2">
                      ✨ Shimmer Wave (Recommended)
                    </h4>
                    <p className="text-xs text-green-800 dark:text-green-400">
                      iOS-like shimmering light wave. Polished, premium, Apple-style.
                    </p>
                  </div>
                </div>
              </div>
            )}

            {activeTab === 'buttons' && (
              <div className="text-center py-16">
                <Zap className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Button Experiments Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Test different button styles, sizes, and interactions
                </p>
              </div>
            )}

            {activeTab === 'colors' && (
              <div className="text-center py-16">
                <Palette className="w-16 h-16 text-gray-400 dark:text-gray-600 mx-auto mb-4" />
                <h3 className="text-xl font-bold text-gray-900 dark:text-gray-100 mb-2">
                  Color Palette Testing Coming Soon
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  Experiment with different color schemes and themes
                </p>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* Footer Info */}
      <div className="max-w-7xl mx-auto px-4 sm:px-6 py-6 sm:py-8">
        <div className="bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-700 rounded-lg p-4 sm:p-6 shadow-lg">
          <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100 mb-3">
            💡 Why This Playground?
          </h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-sm text-gray-600 dark:text-gray-400">
            <div>
              <div className="text-2xl mb-2">🎯</div>
              <strong className="text-gray-900 dark:text-gray-100">Test Without Risk</strong>
              <p className="mt-1">
                Experiment with UI changes without affecting your real data or wasting AI tokens.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">⚡</div>
              <strong className="text-gray-900 dark:text-gray-100">Instant Feedback</strong>
              <p className="mt-1">
                See changes immediately. No need to run full analyses just to test animations.
              </p>
            </div>
            <div>
              <div className="text-2xl mb-2">🚀</div>
              <strong className="text-gray-900 dark:text-gray-100">Faster Iteration</strong>
              <p className="mt-1">
                Try dozens of variations quickly, then apply the perfect one to your app.
              </p>
            </div>
          </div>
        </div>
      </div>

      {/* Quick Access Hint */}
      <div className="hidden sm:block fixed bottom-6 left-6 bg-purple-600 text-white px-4 py-2 rounded-lg shadow-lg text-sm z-50">
        💡 Bookmark this page: <code className="bg-purple-700 px-2 py-1 rounded">/playground</code>
      </div>
    </div>
  );
}

