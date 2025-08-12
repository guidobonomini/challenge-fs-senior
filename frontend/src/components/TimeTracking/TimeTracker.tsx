import React, { useState, useEffect } from 'react';
import { PlayIcon, PauseIcon, StopIcon, ClockIcon } from '@heroicons/react/24/outline';
import { toast } from 'react-hot-toast';

interface TimeTrackerProps {
  taskId: string;
  taskTitle: string;
  onTimeUpdate?: (timeSpent: number) => void;
  className?: string;
}

interface TimeEntry {
  startTime: number;
  description?: string;
}

const TimeTracker: React.FC<TimeTrackerProps> = ({
  taskId,
  taskTitle,
  onTimeUpdate,
  className = ''
}) => {
  const [isRunning, setIsRunning] = useState(false);
  const [currentEntry, setCurrentEntry] = useState<TimeEntry | null>(null);
  const [totalTime, setTotalTime] = useState(0);
  const [elapsedTime, setElapsedTime] = useState(0);
  const [description, setDescription] = useState('');

  // Load saved state from localStorage on mount
  useEffect(() => {
    const savedEntry = localStorage.getItem(`timeEntry_${taskId}`);
    const savedTotalTime = localStorage.getItem(`totalTime_${taskId}`);
    
    if (savedEntry) {
      const entry = JSON.parse(savedEntry);
      setCurrentEntry(entry);
      setIsRunning(true);
      setElapsedTime(Date.now() - entry.startTime);
    }
    
    if (savedTotalTime) {
      setTotalTime(parseInt(savedTotalTime, 10));
    }
  }, [taskId]);

  // Update elapsed time every second when running
  useEffect(() => {
    let interval: NodeJS.Timeout;
    
    if (isRunning && currentEntry) {
      interval = setInterval(() => {
        setElapsedTime(Date.now() - currentEntry.startTime);
      }, 1000);
    }
    
    return () => clearInterval(interval);
  }, [isRunning, currentEntry]);

  // Save state to localStorage
  const saveState = (entry: TimeEntry | null, total: number) => {
    if (entry) {
      localStorage.setItem(`timeEntry_${taskId}`, JSON.stringify(entry));
    } else {
      localStorage.removeItem(`timeEntry_${taskId}`);
    }
    localStorage.setItem(`totalTime_${taskId}`, total.toString());
  };

  const startTimer = () => {
    const entry: TimeEntry = {
      startTime: Date.now(),
      description: description.trim() || undefined,
    };
    
    setCurrentEntry(entry);
    setIsRunning(true);
    setElapsedTime(0);
    saveState(entry, totalTime);
    
    toast.success(`Started tracking time for "${taskTitle}"`);
  };

  const pauseTimer = () => {
    if (currentEntry) {
      const sessionTime = Date.now() - currentEntry.startTime;
      const newTotal = totalTime + sessionTime;
      
      setTotalTime(newTotal);
      setCurrentEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      
      saveState(null, newTotal);
      onTimeUpdate?.(newTotal);
      
      toast.success(`Paused timer. Session: ${formatDuration(sessionTime)}`);
    }
  };

  const stopTimer = () => {
    if (currentEntry) {
      const sessionTime = Date.now() - currentEntry.startTime;
      const newTotal = totalTime + sessionTime;
      
      setTotalTime(newTotal);
      setCurrentEntry(null);
      setIsRunning(false);
      setElapsedTime(0);
      
      // Clear saved state
      localStorage.removeItem(`timeEntry_${taskId}`);
      localStorage.removeItem(`totalTime_${taskId}`);
      
      onTimeUpdate?.(newTotal);
      
      toast.success(`Stopped timer. Total time: ${formatDuration(newTotal)}`);
      
      // Here you would typically save to the backend
      saveTimeEntry(taskId, newTotal, currentEntry.description);
    }
  };

  const resetTimer = () => {
    setTotalTime(0);
    setCurrentEntry(null);
    setIsRunning(false);
    setElapsedTime(0);
    setDescription('');
    
    // Clear saved state
    localStorage.removeItem(`timeEntry_${taskId}`);
    localStorage.removeItem(`totalTime_${taskId}`);
    
    onTimeUpdate?.(0);
    toast.success('Timer reset');
  };

  const saveTimeEntry = async (taskId: string, duration: number, description?: string) => {
    try {
      // This would be an API call to save the time entry
      console.log('Saving time entry:', { taskId, duration, description });
      // await timeTrackingService.createTimeEntry({ taskId, duration, description });
    } catch (error) {
      toast.error('Failed to save time entry');
    }
  };

  const formatDuration = (milliseconds: number): string => {
    const seconds = Math.floor(milliseconds / 1000);
    const hours = Math.floor(seconds / 3600);
    const minutes = Math.floor((seconds % 3600) / 60);
    const remainingSeconds = seconds % 60;

    if (hours > 0) {
      return `${hours}:${minutes.toString().padStart(2, '0')}:${remainingSeconds.toString().padStart(2, '0')}`;
    }
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  const currentDisplayTime = totalTime + elapsedTime;

  return (
    <div className={`bg-white dark:bg-gray-800 border border-gray-200 dark:border-gray-600 rounded-lg p-4 ${className}`}>
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center">
          <ClockIcon className="h-5 w-5 text-gray-500 dark:text-gray-400 mr-2" />
          <h3 className="text-sm font-medium text-gray-900 dark:text-white">Time Tracker</h3>
        </div>
        {totalTime > 0 && !isRunning && (
          <button
            onClick={resetTimer}
            className="text-xs text-gray-500 hover:text-gray-700 dark:text-gray-400 dark:hover:text-gray-200"
          >
            Reset
          </button>
        )}
      </div>

      {/* Time Display */}
      <div className="text-center mb-4">
        <div className="text-2xl font-mono font-bold text-gray-900 dark:text-white">
          {formatDuration(currentDisplayTime)}
        </div>
        {isRunning && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Current session: {formatDuration(elapsedTime)}
          </div>
        )}
        {totalTime > 0 && (
          <div className="text-sm text-gray-500 dark:text-gray-400">
            Total tracked: {formatDuration(totalTime)}
          </div>
        )}
      </div>

      {/* Description Input */}
      {!isRunning && (
        <div className="mb-4">
          <input
            type="text"
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            placeholder="What are you working on?"
            className="w-full px-3 py-2 text-sm border border-gray-300 rounded-md focus:outline-none focus:ring-2 focus:ring-primary-500 focus:border-primary-500 dark:bg-gray-700 dark:border-gray-600 dark:text-white dark:placeholder-gray-400"
          />
        </div>
      )}

      {/* Controls */}
      <div className="flex justify-center space-x-2">
        {!isRunning ? (
          <button
            onClick={startTimer}
            className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-green-600 hover:bg-green-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-green-500"
          >
            <PlayIcon className="h-4 w-4 mr-2" />
            Start
          </button>
        ) : (
          <>
            <button
              onClick={pauseTimer}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-yellow-600 hover:bg-yellow-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-yellow-500"
            >
              <PauseIcon className="h-4 w-4 mr-2" />
              Pause
            </button>
            <button
              onClick={stopTimer}
              className="inline-flex items-center px-4 py-2 border border-transparent text-sm font-medium rounded-md text-white bg-red-600 hover:bg-red-700 focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-red-500"
            >
              <StopIcon className="h-4 w-4 mr-2" />
              Stop
            </button>
          </>
        )}
      </div>
    </div>
  );
};

export default TimeTracker;