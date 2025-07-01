'use client';
import React, { useState, useEffect } from 'react';
import { X, Sparkles, CheckCircle } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { updateUserLastSeenUpdateAction } from '../actions/dbActions';
import { User } from '../../types/types';

// Define the current app version or update ID
const CURRENT_UPDATE_VERSION = '2025-07-01-v1'; // Update this when you have new features

// Define the update content
const UPDATE_CONTENT = {
  version: CURRENT_UPDATE_VERSION,
  title: 'Google Search Grounding Now Available! 🔍',
  features: [
    {
      icon: '🔍',
      title: 'Google Search Grounding',
      description: 'Gemini 2.5 Flash now has real-time Google Search access for up-to-date information'
    },
    {
      icon: '🌐',
      title: 'Real-time Information',
      description: 'Get current news, facts, and data directly integrated into AI responses'
    },
    {
      icon: '⚡',
      title: 'Enhanced Accuracy',
      description: 'AI responses now include verified, current information from Google Search'
    },
    {
      icon: '🎯',
      title: 'Smart Context',
      description: 'AI automatically determines when to search for additional information'
    }
  ],
  improvements: [
    'Gemini 2.5 Flash Preview now supports Google Search grounding',
    'Dynamic search threshold for optimal performance',
    'Seamless integration of web search results into conversations',
    'More accurate and up-to-date responses'
  ]
};

type UpdateAlertProps = {
  user: User;
  onDismiss?: () => void;
};

export default function UpdateAlert({ user, onDismiss }: UpdateAlertProps) {
  const [isVisible, setIsVisible] = useState(false);
  const [isLoading, setIsLoading] = useState(false);

  useEffect(() => {
    // Check if user has seen this update
    const hasSeenUpdate = user.lastSeenUpdate === CURRENT_UPDATE_VERSION;
    setIsVisible(!hasSeenUpdate);
  }, [user.lastSeenUpdate]);

  const handleDismiss = async () => {
    if (!user.email) return;
    
    setIsLoading(true);
    try {
      const result = await updateUserLastSeenUpdateAction(user.email, CURRENT_UPDATE_VERSION);
      if (result.success) {
        setIsVisible(false);
        onDismiss?.();
      }
    } catch (error) {
      console.error('Failed to update last seen update:', error);
    } finally {
      setIsLoading(false);
    }
  };

  if (!isVisible) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-50 flex items-center justify-center p-4"
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9, y: 20 }}
          animate={{ opacity: 1, scale: 1, y: 0 }}
          exit={{ opacity: 0, scale: 0.9, y: 20 }}
          className="bg-gradient-to-br from-gray-800 to-gray-900 border border-gray-700 rounded-xl p-6 max-w-lg w-full max-h-[90vh] overflow-y-auto shadow-2xl"
        >
          {/* Header */}
          <div className="flex items-start justify-between mb-6">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-full bg-gradient-to-r from-purple-500 to-blue-500">
                <Sparkles className="w-6 h-6 text-white" />
              </div>
              <div>
                <h2 className="text-xl font-bold text-white">{UPDATE_CONTENT.title}</h2>
                <p className="text-sm text-gray-400">Version {UPDATE_CONTENT.version}</p>
              </div>
            </div>
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="p-2 text-gray-400 hover:text-white hover:bg-gray-700 rounded-lg transition-colors disabled:opacity-50"
              title="Dismiss"
            >
              <X className="w-5 h-5" />
            </button>
          </div>

          {/* New Features */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <span className="text-green-400">✨</span>
              New Features
            </h3>
            <div className="space-y-3">
              {UPDATE_CONTENT.features.map((feature, index) => (
                <motion.div
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: index * 0.1 }}
                  className="flex gap-3 p-3 bg-gray-700/50 rounded-lg border border-gray-600"
                >
                  <span className="text-2xl">{feature.icon}</span>
                  <div>
                    <h4 className="font-medium text-white">{feature.title}</h4>
                    <p className="text-sm text-gray-300">{feature.description}</p>
                  </div>
                </motion.div>
              ))}
            </div>
          </div>

          {/* Improvements */}
          <div className="mb-6">
            <h3 className="text-lg font-semibold text-white mb-4 flex items-center gap-2">
              <CheckCircle className="w-5 h-5 text-blue-400" />
              Improvements
            </h3>
            <ul className="space-y-2">
              {UPDATE_CONTENT.improvements.map((improvement, index) => (
                <motion.li
                  key={index}
                  initial={{ opacity: 0, x: -20 }}
                  animate={{ opacity: 1, x: 0 }}
                  transition={{ delay: (UPDATE_CONTENT.features.length + index) * 0.1 }}
                  className="flex items-center gap-2 text-gray-300"
                >
                  <div className="w-2 h-2 bg-blue-400 rounded-full"></div>
                  {improvement}
                </motion.li>
              ))}
            </ul>
          </div>

          {/* Footer */}
          <div className="flex justify-end">
            <button
              onClick={handleDismiss}
              disabled={isLoading}
              className="px-6 py-2 bg-gradient-to-r from-purple-600 to-blue-600 hover:from-purple-500 hover:to-blue-500 text-white rounded-lg font-medium transition-all duration-200 transform hover:scale-105 disabled:opacity-50 disabled:transform-none flex items-center gap-2"
            >
              {isLoading ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>
                  Updating...
                </>
              ) : (
                <>
                  <CheckCircle className="w-4 h-4" />
                  Got it!
                </>
              )}
            </button>
          </div>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
