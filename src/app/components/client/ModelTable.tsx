import React from 'react';
import { Search } from 'lucide-react';
import { LLMModel } from './models';
import { FeatureIcon, Tooltip, formatContextLength, getCategoryColor, getProviderColor } from './ModelDisplayHelpers';

type ModelTableProps = {
  models: LLMModel[];
  selectedModel: LLMModel;
  onSelect: (model: LLMModel) => void;
  onClearFilters: () => void;
};

export default function ModelTable({ models, selectedModel, onSelect, onClearFilters }: ModelTableProps) {
  return (
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
        {models.map((model) => (
          <tr
            key={model.id}
            onClick={() => onSelect(model)}
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
                  {model.requiresByok && (
                    <span className="inline-block px-1.5 py-0.5 text-xs bg-blue-500/20 text-blue-300 rounded mt-1 ml-1">
                      Your API key
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

        {models.length === 0 && (
          <tr>
            <td colSpan={6} className="p-8 text-center text-gray-400">
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
            </td>
          </tr>
        )}
      </tbody>
    </table>
  );
}
