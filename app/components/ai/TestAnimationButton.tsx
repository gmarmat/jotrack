'use client';

import { Sparkles, Play, Pause, RefreshCw } from 'lucide-react';
import { useState, useEffect } from 'react';

type AnimationStyle = 'sparkler' | 'gradient-sweep' | 'rotating-border' | 'pulse-glow' | 'neon-pulse' | 'shimmer';

export default function TestAnimationButton() {
  const [isAnimating, setIsAnimating] = useState(false);
  const [selectedStyle, setSelectedStyle] = useState<AnimationStyle>('sparkler');
  const [countdown, setCountdown] = useState(20);
  const [elapsedSeconds, setElapsedSeconds] = useState(0);

  // Simulate countdown
  useEffect(() => {
    if (!isAnimating) {
      setElapsedSeconds(0);
      return;
    }

    const interval = setInterval(() => {
      setElapsedSeconds(prev => {
        if (prev >= countdown) {
          setIsAnimating(false);
          return 0;
        }
        return prev + 1;
      });
    }, 1000);

    return () => clearInterval(interval);
  }, [isAnimating, countdown]);

  const remainingSeconds = countdown - elapsedSeconds;
  const progress = (elapsedSeconds / countdown) * 100;

  const animationStyles = {
    sparkler: {
      name: '✨ Sparkler Border',
      description: 'Animated sparkles around border',
      className: isAnimating ? 'animate-sparkler-border' : '',
    },
    'gradient-sweep': {
      name: '🌈 Gradient Sweep',
      description: 'Rotating gradient border',
      className: isAnimating ? 'animate-gradient-sweep' : '',
    },
    'rotating-border': {
      name: '🔄 Rotating Border',
      description: 'Spinning border with gaps',
      className: isAnimating ? 'animate-rotating-border' : '',
    },
    'pulse-glow': {
      name: '💫 Pulse Glow',
      description: 'Pulsing glow effect',
      className: isAnimating ? 'animate-pulse-glow' : '',
    },
    'neon-pulse': {
      name: '🎆 Neon Pulse',
      description: 'Neon border pulse',
      className: isAnimating ? 'animate-neon-pulse' : '',
    },
    shimmer: {
      name: '✨ Shimmer Wave',
      description: 'Shimmering light wave',
      className: isAnimating ? 'animate-shimmer' : '',
    },
  };

  return (
    <div className="relative w-full bg-white dark:bg-gray-800 border-2 border-purple-500 rounded-2xl shadow-2xl p-4 sm:p-6">
      <div className="flex items-center justify-between mb-4">
        <h3 className="text-lg font-bold text-gray-900 dark:text-gray-100">
          🎨 Animation Playground
        </h3>
        <button
          onClick={() => setIsAnimating(false)}
          className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          title="Reset"
        >
          <RefreshCw size={16} />
        </button>
      </div>

      {/* Animation Style Selector */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Select Animation Style:
        </label>
        <div className="grid grid-cols-2 gap-2">
          {(Object.keys(animationStyles) as AnimationStyle[]).map(style => (
            <button
              key={style}
              onClick={() => {
                setSelectedStyle(style);
                setIsAnimating(false);
                setElapsedSeconds(0);
              }}
              className={`text-xs px-3 py-2 rounded-lg border-2 transition-all ${
                selectedStyle === style
                  ? 'bg-purple-100 dark:bg-purple-900/30 border-purple-500 text-purple-900 dark:text-purple-300 font-bold'
                  : 'bg-gray-50 dark:bg-gray-700 border-gray-300 dark:border-gray-600 text-gray-700 dark:text-gray-300 hover:border-purple-400'
              }`}
            >
              {animationStyles[style].name}
            </button>
          ))}
        </div>
        <p className="text-xs text-gray-500 dark:text-gray-400 mt-2 italic">
          {animationStyles[selectedStyle].description}
        </p>
      </div>

      {/* Duration Slider */}
      <div className="mb-4">
        <label className="text-xs font-semibold text-gray-700 dark:text-gray-300 mb-2 block">
          Duration: {countdown}s
        </label>
        <input
          type="range"
          min="5"
          max="60"
          value={countdown}
          onChange={e => setCountdown(Number(e.target.value))}
          disabled={isAnimating}
          className="w-full"
        />
      </div>

      {/* Test Button */}
      <div className="mb-4 flex items-center justify-center">
        <div className="relative">
          {/* The actual button with animation */}
          <button
            onClick={() => setIsAnimating(!isAnimating)}
            className={`relative p-4 rounded-lg bg-blue-600 hover:bg-blue-700 text-white transition-all disabled:opacity-50 ${animationStyles[selectedStyle].className}`}
            style={{
              minWidth: '120px',
            }}
          >
            <div className="flex flex-col items-center justify-center gap-1">
              {isAnimating ? (
                <>
                  <span className="text-2xl font-bold tabular-nums">{remainingSeconds}s</span>
                  <span className="text-xs">Analyzing...</span>
                  <div className="w-full bg-white/20 rounded-full h-1 mt-1">
                    <div
                      className="bg-white h-1 rounded-full transition-all duration-1000"
                      style={{ width: `${progress}%` }}
                    />
                  </div>
                </>
              ) : (
                <>
                  <Sparkles className="w-6 h-6" />
                  <span className="text-xs">Test Animation</span>
                </>
              )}
            </div>
          </button>
        </div>
      </div>

      {/* Controls */}
      <div className="flex gap-2">
        <button
          onClick={() => setIsAnimating(!isAnimating)}
          className="flex-1 flex items-center justify-center gap-2 px-4 py-2 bg-purple-600 hover:bg-purple-700 text-white rounded-lg font-medium transition-colors"
        >
          {isAnimating ? (
            <>
              <Pause size={16} />
              Stop
            </>
          ) : (
            <>
              <Play size={16} />
              Start
            </>
          )}
        </button>
        <button
          onClick={() => {
            setIsAnimating(false);
            setElapsedSeconds(0);
          }}
          className="px-4 py-2 bg-gray-200 dark:bg-gray-700 hover:bg-gray-300 dark:hover:bg-gray-600 text-gray-700 dark:text-gray-300 rounded-lg font-medium transition-colors"
        >
          Reset
        </button>
      </div>

      <p className="text-xs text-gray-500 dark:text-gray-400 mt-4 text-center italic">
        No tokens wasted! 🎉 Test animations here before applying to real buttons.
      </p>

      <style jsx>{`
        /* Sparkler Border Animation */
        @keyframes sparkler-border {
          0%, 100% {
            box-shadow: 
              0 0 5px rgba(147, 51, 234, 0.5),
              0 0 10px rgba(147, 51, 234, 0.3),
              inset 0 0 10px rgba(147, 51, 234, 0.1);
          }
          25% {
            box-shadow: 
              5px 0 8px rgba(147, 51, 234, 0.6),
              0 5px 12px rgba(147, 51, 234, 0.4),
              inset 2px 2px 12px rgba(147, 51, 234, 0.15);
          }
          50% {
            box-shadow: 
              0 5px 10px rgba(147, 51, 234, 0.7),
              -5px 0 15px rgba(147, 51, 234, 0.5),
              inset -2px 0 15px rgba(147, 51, 234, 0.2);
          }
          75% {
            box-shadow: 
              -5px 0 8px rgba(147, 51, 234, 0.6),
              0 -5px 12px rgba(147, 51, 234, 0.4),
              inset 0 -2px 12px rgba(147, 51, 234, 0.15);
          }
        }
        .animate-sparkler-border {
          animation: sparkler-border 2s ease-in-out infinite;
        }

        /* Gradient Sweep Animation */
        @keyframes gradient-sweep {
          0% {
            border-image: linear-gradient(0deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          }
          25% {
            border-image: linear-gradient(90deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          }
          50% {
            border-image: linear-gradient(180deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          }
          75% {
            border-image: linear-gradient(270deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          }
          100% {
            border-image: linear-gradient(360deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          }
        }
        .animate-gradient-sweep {
          border: 3px solid;
          border-image: linear-gradient(45deg, rgba(147, 51, 234, 0.8), rgba(59, 130, 246, 0.8)) 1;
          animation: gradient-sweep 3s linear infinite;
        }

        /* Rotating Border Animation */
        @keyframes rotating-border {
          0% {
            background: conic-gradient(from 0deg, 
              transparent 0deg 60deg,
              rgba(147, 51, 234, 0.8) 60deg 120deg,
              transparent 120deg 360deg);
          }
          100% {
            background: conic-gradient(from 360deg, 
              transparent 0deg 60deg,
              rgba(147, 51, 234, 0.8) 60deg 120deg,
              transparent 120deg 360deg);
          }
        }
        .animate-rotating-border {
          position: relative;
          overflow: visible !important;
        }
        .animate-rotating-border::before {
          content: '';
          position: absolute;
          inset: -3px;
          border-radius: inherit;
          background: conic-gradient(from 0deg, 
            transparent 0deg 60deg,
            rgba(147, 51, 234, 0.8) 60deg 120deg,
            transparent 120deg 360deg);
          animation: rotating-border 2s linear infinite;
          z-index: -1;
        }

        /* Pulse Glow Animation */
        @keyframes pulse-glow {
          0%, 100% {
            box-shadow: 0 0 10px rgba(147, 51, 234, 0.5);
          }
          50% {
            box-shadow: 0 0 25px rgba(147, 51, 234, 0.9), 0 0 50px rgba(147, 51, 234, 0.5);
          }
        }
        .animate-pulse-glow {
          animation: pulse-glow 2s ease-in-out infinite;
        }

        /* Neon Pulse Animation */
        @keyframes neon-pulse {
          0%, 100% {
            border-color: rgba(147, 51, 234, 0.5);
            box-shadow: 0 0 5px rgba(147, 51, 234, 0.5);
          }
          50% {
            border-color: rgba(147, 51, 234, 1);
            box-shadow: 
              0 0 10px rgba(147, 51, 234, 0.8),
              0 0 20px rgba(147, 51, 234, 0.6),
              0 0 30px rgba(147, 51, 234, 0.4);
          }
        }
        .animate-neon-pulse {
          border: 2px solid rgba(147, 51, 234, 0.5);
          animation: neon-pulse 1.5s ease-in-out infinite;
        }

        /* Shimmer Wave Animation */
        @keyframes shimmer {
          0% {
            background-position: -200% center;
          }
          100% {
            background-position: 200% center;
          }
        }
        .animate-shimmer {
          position: relative;
          overflow: hidden;
        }
        .animate-shimmer::before {
          content: '';
          position: absolute;
          inset: -2px;
          border-radius: inherit;
          background: linear-gradient(
            90deg,
            transparent 0%,
            rgba(147, 51, 234, 0.1) 25%,
            rgba(147, 51, 234, 0.5) 50%,
            rgba(147, 51, 234, 0.1) 75%,
            transparent 100%
          );
          background-size: 200% 100%;
          animation: shimmer 2s linear infinite;
          z-index: -1;
        }
      `}</style>
    </div>
  );
}

