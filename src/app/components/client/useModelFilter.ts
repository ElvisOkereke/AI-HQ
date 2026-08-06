import { useEffect, useRef, useState } from 'react';
import { LLMModel } from './models';

export function useModelFilter(models: LLMModel[], isOpen: boolean) {
  const [searchTerm, setSearchTerm] = useState('');
  const [filterProvider, setFilterProvider] = useState<string>('all');
  const [filterCategory, setFilterCategory] = useState<string>('all');
  const searchInputRef = useRef<HTMLInputElement>(null);

  const providers = ['all', ...Array.from(new Set(models.map(m => m.provider)))];
  const categories = ['all', ...Array.from(new Set(models.map(m => m.category)))];

  const filteredModels = models.filter(model => {
    const matchesSearch = model.name.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.description.toLowerCase().includes(searchTerm.toLowerCase()) ||
                         model.provider.toLowerCase().includes(searchTerm.toLowerCase());
    const matchesProvider = filterProvider === 'all' || model.provider === filterProvider;
    const matchesCategory = filterCategory === 'all' || model.category === filterCategory;
    return matchesSearch && matchesProvider && matchesCategory;
  });

  const resetFilters = () => {
    setSearchTerm('');
    setFilterProvider('all');
    setFilterCategory('all');
  };

  // Focus search input when dropdown opens
  useEffect(() => {
    if (isOpen && searchInputRef.current) {
      setTimeout(() => searchInputRef.current?.focus(), 100);
    }
  }, [isOpen]);

  return {
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
  };
}
