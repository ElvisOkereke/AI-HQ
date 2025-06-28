import React, { useState, useRef, useEffect } from 'react';
import { ChevronDown, WandSparkles, ImagePlus, ImageUp, Paperclip, Globe, Info, Zap, Cpu, Brain, Code, Eye, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LLMModel, ModelFeatures} from "../../types/types"

// Export the LLMModel type so it can be used in the parent component
export type { LLMModel };



export const llmModels: LLMModel[] = [
  // Google Models
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    icon: WandSparkles,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
      streaming: true,
      maxTokens: 8192
    },
    description: 'Google\'s latest multimodal AI with advanced reasoning and real-time capabilities',
    provider: 'Google',
    category: 'multimodal',
    contextLength: 1000000
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
      streaming: true,
      maxTokens: 8192
    },
    description: 'Experimental preview with enhanced speed and performance',
    provider: 'Google',
    category: 'multimodal',
    contextLength: 1000000,
    isExperimental: true
  },
  {
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini 2.0 Flash Image Gen',
    icon: ImagePlus,
    features: {
      imageGeneration: true,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
      streaming: false,
      maxTokens: 8192
    },
    description: 'Gemini with image generation capabilities',
    provider: 'Google',
    category: 'image',
    contextLength: 1000000,
    isExperimental: true
  },
  
  // HuggingFace Models
  {
    id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: 'Llama 4 17B Instruct',
    icon: Brain,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Larger Llama 4 Maverick model with improved performance',
    provider: 'HuggingFace',
    category: 'text',
    contextLength: 128000
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct',
    icon: Zap,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 8192
    },
    description: 'Fast and efficient instruction-following model',
    provider: 'HuggingFace',
    category: 'text',
    contextLength: 8192
  },
  
  // Nvidia NIM Models
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    icon: Cpu,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Meta\'s latest instruction-following model via Nvidia NIM',
    provider: 'Nvidia',
    category: 'text',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    icon: Cpu,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Large-scale Llama model with advanced reasoning',
    provider: 'Nvidia',
    category: 'reasoning',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Vision-capable Llama model for image understanding',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Large vision model with exceptional image analysis',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
  {
    id: 'microsoft/phi-3-vision-128k-instruct',
    name: 'Phi-3 Vision 128k',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Microsoft\'s compact vision model with large context',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
];

type ModelDropdownProps = {
  selectedModel: LLMModel;
  onModelSelect: (model: LLMModel) => void;
};

const featureIconKeys = ['imageGeneration', 'imageUpload', 'fileUpload', 'webSearch'] as const;
type FeatureIconKey = typeof featureIconKeys[number];

const FeatureIcon = ({ feature, enabled }: { feature: FeatureIconKey; enabled: boolean }) => {
  const icons: Record<FeatureIconKey, React.ComponentType<{ className?: string }>> = {
    imageGeneration: ImagePlus,
    imageUpload: ImageUp,
    fileUpload: Paperclip,
    webSearch: Globe,
  };

  const enabledColors: Record<FeatureIconKey, string> = {
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
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const dropdownRef = useRef<HTMLDivElement>(null);
  const searchInputRef = useRef<HTMLInputElement>(null);
  
  // Get unique providers and categories
  const providers = ['all', ...Array.from(new Set(llmModels.map(m => m.provider)))];
  const categories = ['all', ...Array.from(new Set(llmModels.map(m => m.category)))];
  
  // Filter models based on search and filters
  const filteredModels = llmModels.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || model.provider === filterProvider;
    const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
    return matchesSearch && matchesProvider && matchesCategory;
  });
  
  // Focus search input when dropdown opens
  useEffect(() => {
    if (isDropdownOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isDropdownOpen]);
  
  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setDropdownOpen(false);
        setSearchTerm('');
        setFilterProvider('all');
        setFilterCategory('all');
      }
    };
    
    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }
    
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, [isDropdownOpen]);
  
  // Handle keyboard navigation
  const handleKeyDown = (event: KeyboardEvent) => {
    if (event.key === 'Escape') {
      setDropdownOpen(false);
      setSearchTerm('');
      setFilterProvider('all');
      setFilterCategory('all');
    }
  };
  
  useEffect(() => {
    if (isDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
  }, [isDropdownOpen]);
  
  const formatContextLength = (length?: number) => {
    if (!length) return 'N/A';
    if (length >= 1000000) return `${(length / 1000000).toFixed(1)}M`;
    if (length >= 1000) return `${(length / 1000).toFixed(0)}k`;
    return length.toString();
  };
  
  const getCategoryColor = (category: string) => {
    const colors: Record<string, string> = {
      text: 'bg-blue-500/20 text-blue-300',
      multimodal: 'bg-purple-500/20 text-purple-300',
      image: 'bg-pink-500/20 text-pink-300',
      code: 'bg-green-500/20 text-green-300',
      reasoning: 'bg-yellow-500/20 text-yellow-300'
    };
    return colors[category] || 'bg-gray-500/20 text-gray-300';
  };
  
  const getProviderColor = (provider: string) => {
    const colors: Record<string, string> = {
      Google: 'bg-red-500/20 text-red-300',
      HuggingFace: 'bg-orange-500/20 text-orange-300',
      Nvidia: 'bg-green-500/20 text-green-300',
      OpenAI: 'bg-teal-500/20 text-teal-300',
      Anthropic: 'bg-indigo-500/20 text-indigo-300'
    };
    return colors[provider] || 'bg-gray-500/20 text-gray-300';
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => setDropdownOpen(!isDropdownOpen)}
        className="flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg hover:bg-gray-700 transition-colors border border-gray-700"
      >
        <selectedModel.icon className="w-5 h-5 text-purple-400" />
        <span className="text-white text-sm font-medium">{selectedModel.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>
      
      <AnimatePresence>
        {isDropdownOpen && (
          <motion.div
            initial={{ opacity: 0, y: -10, scale: 0.95 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            exit={{ opacity: 0, y: -10, scale: 0.95 }}
            className="absolute right-0 mt-2 bg-gray-800 border border-gray-700 rounded-xl shadow-2xl z-50 overflow-hidden"
            style={{
              width: 'max(800px, 90vw)',
              maxWidth: '95vw',
              maxHeight: '80vh'
            }}
          >
            {/* Header with search and filters */}
            <div className="p-4 border-b border-gray-700 bg-gray-900/50">
              <div className="flex flex-col gap-3">
                <div className="flex items-center justify-between">
                  <h3 className="text-lg font-semibold text-white">Select AI Model</h3>
                  <button
                    onClick={() => {
                      setDropdownOpen(false);
                      setSearchTerm('');
                      setFilterProvider('all');
                      setFilterCategory('all');
                    }}
                    className="p-1 text-gray-400 hover:text-white transition-colors"
                  >
                    <X className="w-5 h-5" />
                  </button>
                </div>
                
                {/* Search */}
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 w-4 h-4 text-gray-400" />
                  <input
                    ref={searchInputRef}
                    type="text"
                    placeholder="Search models..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="w-full pl-10 pr-4 py-2 bg-gray-700 border border-gray-600 rounded-lg text-white placeholder-gray-400 focus:outline-none focus:border-purple-500 transition-colors"
                  />
                </div>
                
                {/* Filters */}
                <div className="flex flex-wrap gap-2">
                  <select
                    value={filterProvider}
                    onChange={(e) => setFilterProvider(e.target.value)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    {providers.map(provider => (
                      <option key={provider} value={provider}>
                        {provider === 'all' ? 'All Providers' : provider}
                      </option>
                    ))}
                  </select>
                  
                  <select
                    value={filterCategory}
                    onChange={(e) => setFilterCategory(e.target.value)}
                    className="px-3 py-1 bg-gray-700 border border-gray-600 rounded-md text-white text-sm focus:outline-none focus:border-purple-500"
                  >
                    {categories.map(category => (
                      <option key={category} value={category}>
                        {category === 'all' ? 'All Categories' : category.charAt(0).toUpperCase() + category.slice(1)}
                      </option>
                    ))}
                  </select>
                  
                  <div className="text-sm text-gray-400 px-2 py-1">
                    {filteredModels.length} model{filteredModels.length !== 1 ? 's' : ''}
                  </div>
                </div>
              </div>
            </div>
            
            {/* Content - Table for desktop, Cards for mobile */}
            <div className="overflow-auto custom-scrollbar" style={{ maxHeight: 'calc(80vh - 140px)' }}>
              <style jsx>{`
                .custom-scrollbar::-webkit-scrollbar {
                  width: 8px;
                  height: 8px;
                }
                .custom-scrollbar::-webkit-scrollbar-track {
                  background: #374151;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb {
                  background: #6b7280;
                  border-radius: 4px;
                }
                .custom-scrollbar::-webkit-scrollbar-thumb:hover {
                  background: #9ca3af;
                }
                .line-clamp-2 {
                  display: -webkit-box;
                  -webkit-line-clamp: 2;
                  -webkit-box-orient: vertical;
                  overflow: hidden;
                }
                .mobile-cards {
                  display: none;
                }
                .desktop-table {
                  display: table;
                }
                @media (max-width: 768px) {
                  .mobile-cards {
                    display: block;
                  }
                  .desktop-table {
                    display: none;
                  }
                }
              `}</style>
              
              {/* Desktop Table */}
              <table className="w-full desktop-table">
                <thead className="bg-gray-900/50 sticky top-0 z-10">
                  <tr className="border-b border-gray-700">
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[200px]">Model</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]">Provider</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[100px]">Category</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[70px]">Context</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[120px]">Features</th>
                    <th className="text-left p-3 text-xs font-medium text-gray-400 uppercase tracking-wider min-w-[250px]">Description</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredModels.map((model) => (
                    <tr
                      key={model.id}
                      onClick={() => {
                        onModelSelect(model);
                        setDropdownOpen(false);
                        setSearchTerm('');
                        setFilterProvider('all');
                        setFilterCategory('all');
                      }}
                      className={`border-b border-gray-700/50 cursor-pointer transition-colors hover:bg-gray-700/50 ${
                        selectedModel.id === model.id ? 'bg-purple-500/10 border-purple-500/30' : ''
                      }`}
                    >
                      {/* Model */}
                      <td className="p-3">
                        <div className="flex items-center gap-3">
                          <model.icon className="w-5 h-5 text-purple-400 flex-shrink-0" />
                          <div className="min-w-0">
                            <div className="font-medium text-white text-sm truncate">{model.name}</div>
                            {model.isExperimental && (
                              <span className="inline-block px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded mt-1">
                                Experimental
                              </span>
                            )}
                          </div>
                        </div>
                      </td>
                      
                      {/* Provider */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getProviderColor(model.provider)}`}>
                          {model.provider}
                        </span>
                      </td>
                      
                      {/* Category */}
                      <td className="p-3">
                        <span className={`inline-block px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(model.category)}`}>
                          {model.category}
                        </span>
                      </td>
                      
                      {/* Context Length */}
                      <td className="p-3">
                        <span className="text-sm text-gray-300">
                          {formatContextLength(model.contextLength)}
                        </span>
                      </td>
                      
                      {/* Features */}
                      <td className="p-3">
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
                          {model.features.streaming && (
                            <Tooltip content="Supports real-time streaming">
                              <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                              </div>
                            </Tooltip>
                          )}
                        </div>
                      </td>
                      
                      {/* Description */}
                      <td className="p-3">
                        <div className="text-sm text-gray-400 max-w-xs">
                          <div className="line-clamp-2">{model.description}</div>
                        </div>
                      </td>
                    </tr>
                  ))}
                  
                  {filteredModels.length === 0 && (
                    <tr>
                      <td colSpan={6} className="p-8 text-center text-gray-400">
                        <div className="flex flex-col items-center gap-2">
                          <Search className="w-8 h-8 text-gray-500" />
                          <p>No models found matching your criteria.</p>
                          <button
                            onClick={() => {
                              setSearchTerm('');
                              setFilterProvider('all');
                              setFilterCategory('all');
                            }}
                            className="text-purple-400 hover:text-purple-300 text-sm"
                          >
                            Clear filters
                          </button>
                        </div>
                      </td>
                    </tr>
                  )}
                </tbody>
              </table>
              
              {/* Mobile Cards */}
              <div className="mobile-cards p-2">
                {filteredModels.map((model) => (
                  <div
                    key={model.id}
                    onClick={() => {
                      onModelSelect(model);
                      setDropdownOpen(false);
                      setSearchTerm('');
                      setFilterProvider('all');
                      setFilterCategory('all');
                    }}
                    className={`mb-3 p-4 border border-gray-700 rounded-lg cursor-pointer transition-colors hover:bg-gray-700/50 ${
                      selectedModel.id === model.id ? 'bg-purple-500/10 border-purple-500/30' : ''
                    }`}
                  >
                    <div className="flex items-start gap-3 mb-3">
                      <model.icon className="w-6 h-6 text-purple-400 flex-shrink-0 mt-0.5" />
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center gap-2 mb-1">
                          <h4 className="font-medium text-white text-sm truncate">{model.name}</h4>
                          {model.isExperimental && (
                            <span className="px-1.5 py-0.5 text-xs bg-yellow-500/20 text-yellow-300 rounded">
                              Experimental
                            </span>
                          )}
                        </div>
                        <div className="flex items-center gap-2 mb-2">
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getProviderColor(model.provider)}`}>
                            {model.provider}
                          </span>
                          <span className={`px-2 py-1 text-xs rounded-full font-medium ${getCategoryColor(model.category)}`}>
                            {model.category}
                          </span>
                          <span className="text-xs text-gray-400">
                            {formatContextLength(model.contextLength)} ctx
                          </span>
                        </div>
                        <p className="text-sm text-gray-400 line-clamp-2 mb-3">{model.description}</p>
                        
                        {/* Features */}
                        <div className="flex items-center gap-2">
                          <span className="text-xs text-gray-500">Features:</span>
                          <div className="flex items-center gap-1">
                            <FeatureIcon feature="imageGeneration" enabled={!!model.features.imageGeneration} />
                            <FeatureIcon feature="imageUpload" enabled={!!model.features.imageUpload} />
                            <FeatureIcon feature="fileUpload" enabled={!!model.features.fileUpload} />
                            <FeatureIcon feature="webSearch" enabled={!!model.features.webSearch} />
                            {model.features.streaming && (
                              <div className="w-4 h-4 rounded-full bg-green-500/20 border border-green-500/30 flex items-center justify-center">
                                <div className="w-1.5 h-1.5 rounded-full bg-green-400"></div>
                              </div>
                            )}
                          </div>
                        </div>
                      </div>
                    </div>
                  </div>
                ))}
                
                {filteredModels.length === 0 && (
                  <div className="p-8 text-center text-gray-400">
                    <div className="flex flex-col items-center gap-2">
                      <Search className="w-8 h-8 text-gray-500" />
                      <p>No models found matching your criteria.</p>
                      <button
                        onClick={() => {
                          setSearchTerm('');
                          setFilterProvider('all');
                          setFilterCategory('all');
                        }}
                        className="text-purple-400 hover:text-purple-300 text-sm"
                      >
                        Clear filters
                      </button>
                    </div>
                  </div>
                )}
              </div>
            </div>
            
            {/* Footer */}
            <div className="p-3 border-t border-gray-700 bg-gray-900/50">
              <div className="flex items-center justify-between text-xs text-gray-400">
                <span>Press ESC to close</span>
                <span>Click a model to select</span>
              </div>
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}
