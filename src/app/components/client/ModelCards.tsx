import React from 'react';
import { Search } from 'lucide-react';
import { LLMModel } from './models';
import { FeatureIcon, formatContextLength, getCategoryColor, getProviderColor } from './ModelDisplayHelpers';

type ModelCardsProps = {
  models: LLMModel[];
  selectedModel: LLMModel;
  onSelect: (model: LLMModel) => void;
  onClearFilters: () => void;
};

export default function ModelCards({ models, selectedModel, onSelect, onClearFilters }: ModelCardsProps) {
  return (
    <div className="mobile-cards p-2">
      {models.map((model) => (
        <div
          key={model.id}
          onClick={() => onSelect(model)}
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

      {models.length === 0 && (
        <div className="p-8 text-center text-gray-400">
          <div className="flex flex-col items-center gap-2">
            <Search className="w-8 h-8 text-gray-500" />
            <p>No models found matching your criteria.</p>
            <button
              onClick={onClearFilters}
              className="text-purple-400 hover:text-purple-300 text-sm"
            >
              Clear filters
            </button>
          </div>
        </div>
      )}
    </div>
  );
}
