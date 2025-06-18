import React, { useState } from 'react';
import { ChevronDown, WandSparkles, ImagePlus, ImageUp, Paperclip, Globe, Info } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LLMModel, ModelFeatures} from "../../types/types"

// Export the LLMModel type so it can be used in the parent component
export type { LLMModel };



export const llmModels: LLMModel[] = [
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    icon: WandSparkles,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
    },
    description: 'Google\'s latest multimodal AI with advanced reasoning and real-time capabilities',
    provider: 'Google'
  },
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Preview',
    icon: WandSparkles,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: true,
      webSearch: true,
    },
    description: 'Experimental preview with enhanced speed and performance',
    provider: 'Google'
  },{
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini 2.0 Flash Preview Image Generation',
    icon: WandSparkles,
    features: {
      imageGeneration: true,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
    },
    description: 'Experimental preview with enhanced speed and performance',
    provider: 'Google'
  },
 /* {
    id: 'gpt-4o',
    name: 'GPT-4o (DOESNT WORK YET)',
    icon: WandSparkles,
    features: {
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
    },
    description: 'OpenAI\'s flagship model with strong reasoning and multimodal capabilities',
    provider: 'OpenAI'
  },
  {
    id: 'claude-3-opus',
    name: 'Claude 3 Opus',
    icon: WandSparkles,
    features: {
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
    },
    description: 'Anthropic\'s most capable model for complex tasks and analysis',
    provider: 'Anthropic'
  },*/
];

type ModelDropdownProps = {
  selectedModel: LLMModel;
  onModelSelect: (model: LLMModel) => void;
};

const FeatureIcon = ({ feature, enabled }: { feature: keyof ModelFeatures; enabled: boolean }) => {
  const icons = {
    imageGeneration: ImagePlus,
    imageUpload: ImageUp,
    fileUpload: Paperclip,
    webSearch: Globe,
  };

  const enabledColors: Record<keyof ModelFeatures, string> = {
    imageGeneration: 'text-pink-400',
    imageUpload: 'text-orange-400',
    fileUpload: 'text-yellow-400',
    webSearch: 'text-green-400',
  };

  const IconComponent = icons[feature];
  return (
    <IconComponent
      className={`w-4 h-4 ${enabled ? enabledColors[feature] : 'text-gray-500'}`}
    />
  );
};

const Tooltip = ({ content, children }: { content: string; children: React.ReactNode }) => {
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

export default function ModelDropdown({ selectedModel, onModelSelect }: ModelDropdownProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  
  // Close dropdown when clicking outside
  React.useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      const target = event.target as Element;
      if (!target.closest('[data-dropdown="model-selector"]')) {
        setDropdownOpen(false);
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);

  return (
    <div className="relative" data-dropdown="model-selector">
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors"
      >
        <selectedModel.icon className="w-5 h-5 text-purple-400" />
        <span className="text-white">{selectedModel.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            className="absolute right-0 mt-2 w-80 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-10 overflow-hidden"
          >
            <div className="p-2">
              <div className="text-xs font-medium text-gray-400 px-3 py-2 border-b border-gray-700">
                Available Models
              </div>
              
              {llmModels.map((model) => (
                <div
                  key={model.id}
                  onClick={() => {
                    onModelSelect(model);
                    setDropdownOpen(false);
                  }}
                  className={`flex items-start gap-3 p-3 rounded-lg cursor-pointer transition-colors hover:bg-gray-700 ${
                    selectedModel.id === model.id ? 'bg-gray-700/50 border border-purple-500/30' : ''
                  }`}
                >
                  <div className="flex-shrink-0">
                    <model.icon className="w-6 h-6 text-purple-400 mt-0.5" />
                  </div>
                  
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center justify-between">
                      <div>
                        <h3 className="text-sm font-medium text-white">{model.name}</h3>
                        <p className="text-xs text-gray-400">{model.provider}</p>
                      </div>
                      
                      <Tooltip content={`${model.provider}: ${model.description}`}>
                        <button className="flex-shrink-0 p-1 text-gray-500 hover:text-gray-300 transition-colors">
                          <Info className="w-4 h-4" />
                        </button>
                      </Tooltip>
                    </div>
                    
                    <p className="text-xs text-gray-500 mt-1 line-clamp-2">
                      {model.description}
                    </p>
                    
                    <div className="flex items-center gap-2 mt-2">
                      <span className="text-xs text-gray-400">Features:</span>
                      <div className="flex items-center gap-1">
                        <Tooltip content={model.features.imageGeneration ? "Can generate images" : "No image generation"}>
                          <div>
                            <FeatureIcon feature="imageGeneration" enabled={!!model.features.imageGeneration} />
                          </div>
                        </Tooltip>
                        <Tooltip content={model.features.imageUpload ? "Can analyze uploaded images" : "No image upload"}>
                          <div>
                            <FeatureIcon feature="imageUpload" enabled={!!model.features.imageUpload} />
                          </div>
                        </Tooltip>
                        <Tooltip content={model.features.fileUpload ? "Can process uploaded files" : "No file upload"}>
                          <div>
                            <FeatureIcon feature="fileUpload" enabled={!!model.features.fileUpload} />
                          </div>
                        </Tooltip>
                        <Tooltip content={model.features.webSearch ? "Can search the web" : "No web search"}>
                          <div>
                            <FeatureIcon feature="webSearch" enabled={!!model.features.webSearch} />
                          </div>
                        </Tooltip>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}