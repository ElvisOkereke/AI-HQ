import React, { useState } from 'react';
import { ImageUp, Paperclip, Globe } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';

const featureIconKeys = ['imageUpload', 'fileUpload', 'webSearch'] as const;
export type FeatureIconKey = typeof featureIconKeys[number];

const monokaiFeatureIcons: Record<FeatureIconKey, React.ComponentType<{ className?: string }>> = {
  imageUpload: ImageUp,
  fileUpload: Paperclip,
  webSearch: Globe,
};

const enabledColors: Record<FeatureIconKey, string> = {
  imageUpload: 'text-orange-400',
  fileUpload: 'text-yellow-400',
  webSearch: 'text-green-400',
};

export const FeatureIcon = ({ feature, enabled }: { feature: FeatureIconKey; enabled: boolean }) => {
  const IconComponent = monokaiFeatureIcons[feature];
  return (
    <IconComponent
      className={`w-4 h-4 ${enabled ? enabledColors[feature] : 'text-gray-500'}`}
    />
  );
};

export const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
  const [isVisible, setIsVisible] = useState(false);

  return (
    <div className="relative inline-block">
      <div
        onMouseEnter={() => setIsVisible(true)}
        onMouseLeave={() => setIsVisible(false)}
      >
        {children}
      </div>
      <AnimatePresence>
        {isVisible && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute bottom-full left-1/2 transform -translate-x-1/2 mb-2 px-3 py-2 bg-gray-800 border border-gray-600 rounded-lg shadow-xl z-20 whitespace-nowrap max-w-xs text-sm"
          >
            <div className="text-gray-200">{content}</div>
            <div className="absolute top-full left-1/2 transform -translate-x-1/2 border-4 border-transparent border-t-gray-800"></div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
};

export const formatContextLength = (length?: number) => {
  if (!length) return 'N/A';
  if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
  if (length >= 1000) return `${(length / 1000).toFixed(0)}k`;
  return length.toString();
};

export const getCategoryColor = (category: string) => {
  const colors: Record<string, string> = {
    text: 'bg-blue-500/20 text-blue-300',
    multimodal: 'bg-purple-500/20 text-purple-300',
    code: 'bg-green-500/20 text-green-300',
    reasoning: 'bg-yellow-500/20 text-yellow-300'
  };
  return colors[category] || 'bg-gray-500/20 text-gray-300';
};

export const getProviderColor = (provider: string) => {
  const colors: Record<string, string> = {
    Fuelix: 'bg-orange-500/20 text-orange-300',
    BYOK: 'bg-blue-500/20 text-blue-300'
  };
  return colors[provider] || 'bg-gray-500/20 text-gray-300';
};
