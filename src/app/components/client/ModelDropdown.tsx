import React, { useRef, useState, useEffect } from 'react';
import { ChevronDown, Search, X } from 'lucide-react';
import { AnimatePresence, motion } from 'motion/react';
import { LLMModel, llmModels } from './models';
import { useModelFilter } from './useModelFilter';
import ModelTable from './ModelTable';
import ModelCards from './ModelCards';

export type { LLMModel };
export { llmModels };

type ModelDropdownProps = {
  selectedModel: LLMModel;
  onModelSelect: (model: LLMModel) => void;
  disabled?: boolean;
};

export default function ModelDropdown({ selectedModel, onModelSelect, disabled }: ModelDropdownProps) {
  const [isDropdownOpen, setDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  const {
    searchTerm,
    setSearchTerm,
    filterProvider,
    setFilterProvider,
    filterCategory,
    setFilterCategory,
    providers,
    categories,
    filteredModels,
    resetFilters,
    searchInputRef,
  } = useModelFilter(llmModels, isDropdownOpen);

  const closeDropdown = () => {
    setDropdownOpen(false);
    resetFilters();
  };

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('mousedown', handleClickOutside);
    }

    return () => document.removeEventListener('mousedown', handleClickOutside);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  // Handle keyboard navigation
  useEffect(() => {
    const handleKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') {
        closeDropdown();
      }
    };

    if (isDropdownOpen) {
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => document.removeEventListener('keydown', handleKeyDown);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [isDropdownOpen]);

  const handleSelect = (model: LLMModel) => {
    onModelSelect(model);
    closeDropdown();
  };

  return (
    <div className="relative" ref={dropdownRef}>
      <button
        onClick={() => !disabled && setDropdownOpen(!isDropdownOpen)}
        disabled={disabled}
        title={disabled ? 'Sign up to switch models' : undefined}
        className={`flex items-center gap-2 px-3 py-2 bg-gray-800 rounded-lg border border-gray-700 transition-colors ${
          disabled ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-700'
        }`}
      >
        <selectedModel.icon className="w-5 h-5 text-purple-400" />
        <span className="text-white text-sm font-medium">{selectedModel.name}</span>
        <ChevronDown className={`w-4 h-4 text-gray-400 transition-transform ${isDropdownOpen ? 'rotate-180' : ''}`} />
      </button>

      <AnimatePresence>
        {isDropdownOpen && !disabled && (
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
                    onClick={closeDropdown}
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

              <ModelTable
                models={filteredModels}
                selectedModel={selectedModel}
                onSelect={handleSelect}
                onClearFilters={resetFilters}
              />
              <ModelCards
                models={filteredModels}
                selectedModel={selectedModel}
                onSelect={handleSelect}
                onClearFilters={resetFilters}
              />
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
