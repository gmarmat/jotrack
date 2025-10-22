'use client';

import { useState, useEffect } from 'react';
import { Play, Pause, RotateCcw, Clock, Mic, MicOff, Volume2, VolumeX } from 'lucide-react';

interface Props {
  stories: any[];
  onClose: () => void;
}

export default function StoryRehearsalMode({ stories, onClose }: Props) {
  const [currentStoryIndex, setCurrentStoryIndex] = useState(0);
  const [isPlaying, setIsPlaying] = useState(false);
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [playbackSpeed, setPlaybackSpeed] = useState(1);
  const [showTimer, setShowTimer] = useState(false);
  const [practiceMode, setPracticeMode] = useState<'read' | 'speak' | 'record'>('read');

  const currentStory = stories[currentStoryIndex];

  // Timer for recording
  useEffect(() => {
    let interval: NodeJS.Timeout;
    if (isRecording) {
      interval = setInterval(() => {
        setRecordingTime(prev => prev + 1);
      }, 1000);
    }
    return () => clearInterval(interval);
  }, [isRecording]);

  const formatTime = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const handleStartRecording = () => {
    setIsRecording(true);
    setRecordingTime(0);
  };

  const handleStopRecording = () => {
    setIsRecording(false);
    // Here you would save the recording
    console.log('Recording saved:', formatTime(recordingTime));
  };

  const handleNextStory = () => {
    if (currentStoryIndex < stories.length - 1) {
      setCurrentStoryIndex(prev => prev + 1);
    }
  };

  const handlePrevStory = () => {
    if (currentStoryIndex > 0) {
      setCurrentStoryIndex(prev => prev - 1);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50">
      <div className="bg-white dark:bg-gray-800 rounded-2xl shadow-2xl w-full max-w-4xl h-[90vh] flex flex-col">
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <h2 className="text-2xl font-bold text-gray-900 dark:text-white">
              🎭 Story Rehearsal Mode
            </h2>
            <div className="flex items-center gap-2 text-sm text-gray-600 dark:text-gray-400">
              <span>Story {currentStoryIndex + 1} of {stories.length}</span>
              {showTimer && (
                <span className="flex items-center gap-1">
                  <Clock className="w-4 h-4" />
                  {formatTime(recordingTime)}
                </span>
              )}
            </div>
          </div>
          <button
            onClick={onClose}
            className="text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            ✕
          </button>
        </div>

        {/* Practice Mode Selector */}
        <div className="p-4 border-b border-gray-200 dark:border-gray-700">
          <div className="flex gap-2">
            {[
              { id: 'read', label: '📖 Read & Study', icon: '📖' },
              { id: 'speak', label: '🗣️ Practice Speaking', icon: '🗣️' },
              { id: 'record', label: '🎤 Record & Review', icon: '🎤' }
            ].map((mode) => (
              <button
                key={mode.id}
                onClick={() => setPracticeMode(mode.id as any)}
                className={`px-4 py-2 rounded-lg font-medium transition-colors ${
                  practiceMode === mode.id
                    ? 'bg-purple-600 text-white'
                    : 'bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 hover:bg-gray-200 dark:hover:bg-gray-600'
                }`}
              >
                {mode.label}
              </button>
            ))}
          </div>
        </div>

        {/* Main Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {currentStory && (
            <div className="space-y-6">
              {/* Story Title */}
              <div className="text-center">
                <h3 className="text-xl font-bold text-gray-900 dark:text-white mb-2">
                  {currentStory.title || `Story ${currentStoryIndex + 1}`}
                </h3>
                <p className="text-gray-600 dark:text-gray-400">
                  {currentStory.category || 'Professional Story'}
                </p>
              </div>

              {/* Story Content */}
              <div className="bg-gray-50 dark:bg-gray-700/50 rounded-lg p-6">
                <div className="space-y-4">
                  {currentStory.situation && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Situation:</h4>
                      <p className="text-gray-700 dark:text-gray-300">{currentStory.situation}</p>
                    </div>
                  )}
                  {currentStory.task && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Task:</h4>
                      <p className="text-gray-700 dark:text-gray-300">{currentStory.task}</p>
                    </div>
                  )}
                  {currentStory.action && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Action:</h4>
                      <p className="text-gray-700 dark:text-gray-300">{currentStory.action}</p>
                    </div>
                  )}
                  {currentStory.result && (
                    <div>
                      <h4 className="font-semibold text-gray-900 dark:text-white mb-2">Result:</h4>
                      <p className="text-gray-700 dark:text-gray-300">{currentStory.result}</p>
                    </div>
                  )}
                </div>
              </div>

              {/* Practice Controls */}
              {practiceMode === 'speak' && (
                <div className="text-center space-y-4">
                  <div className="text-lg text-gray-700 dark:text-gray-300">
                    Practice telling this story out loud. Focus on:
                  </div>
                  <div className="grid grid-cols-2 gap-4 text-sm">
                    <div className="bg-blue-50 dark:bg-blue-900/20 p-3 rounded-lg">
                      <strong>Clarity:</strong> Speak clearly and at a good pace
                    </div>
                    <div className="bg-green-50 dark:bg-green-900/20 p-3 rounded-lg">
                      <strong>Structure:</strong> Follow the STAR format
                    </div>
                    <div className="bg-purple-50 dark:bg-purple-900/20 p-3 rounded-lg">
                      <strong>Engagement:</strong> Use specific details and metrics
                    </div>
                    <div className="bg-orange-50 dark:bg-orange-900/20 p-3 rounded-lg">
                      <strong>Timing:</strong> Aim for 2-3 minutes
                    </div>
                  </div>
                </div>
              )}

              {practiceMode === 'record' && (
                <div className="text-center space-y-4">
                  <div className="text-lg text-gray-700 dark:text-gray-300">
                    Record yourself telling this story
                  </div>
                  <div className="flex items-center justify-center gap-4">
                    {!isRecording ? (
                      <button
                        onClick={handleStartRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-red-600 text-white rounded-lg hover:bg-red-700 transition-colors"
                      >
                        <Mic className="w-5 h-5" />
                        Start Recording
                      </button>
                    ) : (
                      <button
                        onClick={handleStopRecording}
                        className="flex items-center gap-2 px-6 py-3 bg-gray-600 text-white rounded-lg hover:bg-gray-700 transition-colors"
                      >
                        <MicOff className="w-5 h-5" />
                        Stop Recording
                      </button>
                    )}
                  </div>
                  {isRecording && (
                    <div className="text-red-600 dark:text-red-400 font-medium">
                      🔴 Recording: {formatTime(recordingTime)}
                    </div>
                  )}
                </div>
              )}
            </div>
          )}
        </div>

        {/* Footer Controls */}
        <div className="flex items-center justify-between p-6 border-t border-gray-200 dark:border-gray-700">
          <div className="flex items-center gap-4">
            <button
              onClick={handlePrevStory}
              disabled={currentStoryIndex === 0}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              ← Previous
            </button>
            <button
              onClick={handleNextStory}
              disabled={currentStoryIndex === stories.length - 1}
              className="px-4 py-2 bg-gray-100 dark:bg-gray-700 text-gray-700 dark:text-gray-300 rounded-lg hover:bg-gray-200 dark:hover:bg-gray-600 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next →
            </button>
          </div>
          
          <div className="flex items-center gap-4">
            <button
              onClick={() => setShowTimer(!showTimer)}
              className="flex items-center gap-2 px-4 py-2 bg-blue-100 dark:bg-blue-900/30 text-blue-700 dark:text-blue-300 rounded-lg hover:bg-blue-200 dark:hover:bg-blue-900/50"
            >
              <Clock className="w-4 h-4" />
              {showTimer ? 'Hide Timer' : 'Show Timer'}
            </button>
            <button
              onClick={() => setPlaybackSpeed(playbackSpeed === 1 ? 1.5 : 1)}
              className="flex items-center gap-2 px-4 py-2 bg-purple-100 dark:bg-purple-900/30 text-purple-700 dark:text-purple-300 rounded-lg hover:bg-purple-200 dark:hover:bg-purple-900/50"
            >
              <Volume2 className="w-4 h-4" />
              {playbackSpeed}x Speed
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
