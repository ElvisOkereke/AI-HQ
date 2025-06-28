'use client';
import React, { useState, useEffect } from 'react';
import { Settings, Terminal, Eye, EyeOff, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { logger } from '../../utils/logger';

type DebugPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

export default function DebugPanel({ isOpen, onClose }: DebugPanelProps) {
  const [loggingEnabled, setLoggingEnabled] = useState(false);
  const [isVisible, setIsVisible] = useState(false);

  useEffect(() => {
    setLoggingEnabled(logger.isEnabled());
  }, []);

  const toggleLogging = () => {
    const newState = logger.toggle();
    setLoggingEnabled(newState);
    logger.log('Logging toggled via Debug Panel:', newState ? 'ON' : 'OFF');
  };

  const clearConsole = () => {
    console.clear();
    logger.log('Console cleared');
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-start justify-end p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, x: 300 }}
          animate={{ opacity: 1, x: 0 }}
          exit={{ opacity: 0, x: 300 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-80 shadow-2xl"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <Terminal className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">Debug Panel</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Logging Control */}
          <div className="space-y-4">
            <div className="flex items-center justify-between p-3 bg-gray-700/50 rounded-lg">
              <div className="flex items-center gap-2">
                {loggingEnabled ? (
                  <Eye className="w-4 h-4 text-green-400" />
                ) : (
                  <EyeOff className="w-4 h-4 text-gray-400" />
                )}
                <span className="text-white">Console Logging</span>
              </div>
              <button
                onClick={toggleLogging}
                className={`relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-purple-500 focus:ring-offset-2 focus:ring-offset-gray-800 ${
                  loggingEnabled ? 'bg-purple-600' : 'bg-gray-600'
                }`}
              >
                <span
                  className={`${
                    loggingEnabled ? 'translate-x-6' : 'translate-x-1'
                  } inline-block h-4 w-4 transform rounded-full bg-white transition-transform`}
                />
              </button>
            </div>

            {/* Console Actions */}
            <div className="space-y-2">
              <button
                onClick={clearConsole}
                className="w-full px-3 py-2 bg-red-600/20 hover:bg-red-600/30 text-red-400 rounded-lg transition-colors text-sm"
              >
                Clear Console
              </button>
              
              <button
                onClick={() => {
                  logger.log('Test log message');
                  logger.info('Test info message');
                  logger.warn('Test warning message');
                  logger.error('Test error message');
                  logger.debug('Test debug message');
                  logger.db('Test database message');
                  logger.ai('Test AI message');
                  logger.auth('Test auth message');
                  logger.chat('Test chat message');
                }}
                className="w-full px-3 py-2 bg-blue-600/20 hover:bg-blue-600/30 text-blue-400 rounded-lg transition-colors text-sm"
              >
                Test Log Messages
              </button>
            </div>

            {/* Status */}
            <div className="p-3 bg-gray-700/30 rounded-lg">
              <div className="text-xs text-gray-400 space-y-1">
                <div className="flex justify-between">
                  <span>Logging:</span>
                  <span className={loggingEnabled ? 'text-green-400' : 'text-red-400'}>
                    {loggingEnabled ? 'Enabled' : 'Disabled'}
                  </span>
                </div>
                <div className="flex justify-between">
                  <span>Console Access:</span>
                  <span className="text-blue-400">window.logger</span>
                </div>
              </div>
            </div>

            {/* Instructions */}
            <div className="p-3 bg-yellow-600/10 border border-yellow-600/20 rounded-lg">
              <p className="text-xs text-yellow-400">
                💡 <strong>Tip:</strong> You can also use <code className="bg-gray-700 px-1 rounded">window.logger.toggle()</code> in the browser console to control logging.
              </p>
            </div>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
