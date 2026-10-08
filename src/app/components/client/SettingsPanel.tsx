'use client';
import React, { useState, useEffect } from 'react';
import { KeyRound, Eye, EyeOff, X, Trash2, Plus, Loader2 } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';
import { BYOKConnectionMeta } from '../../types/types';
import { listByokConnectionsAction, addByokConnectionAction, deleteByokConnectionAction } from '../actions/byokActions';

type SettingsPanelProps = {
  isOpen: boolean;
  onClose: () => void;
};

const BASE_URL_PRESETS = [
  { label: 'OpenAI', value: 'https://api.openai.com/v1' },
  { label: 'Groq', value: 'https://api.groq.com/openai/v1' },
  { label: 'OpenRouter', value: 'https://openrouter.ai/api/v1' },
  { label: 'Together AI', value: 'https://api.together.xyz/v1' },
  { label: 'Nvidia NIM', value: 'https://integrate.api.nvidia.com/v1' },
  { label: 'Custom', value: '' },
];

export default function SettingsPanel({ isOpen, onClose }: SettingsPanelProps) {
  const [connections, setConnections] = useState<BYOKConnectionMeta[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [deletingId, setDeletingId] = useState<string | null>(null);
  const [error, setError] = useState('');
  const [successMessage, setSuccessMessage] = useState('');

  const [label, setLabel] = useState('');
  const [preset, setPreset] = useState(BASE_URL_PRESETS[0].value);
  const [baseUrl, setBaseUrl] = useState(BASE_URL_PRESETS[0].value);
  const [modelId, setModelId] = useState('');
  const [apiKey, setApiKey] = useState('');
  const [showApiKey, setShowApiKey] = useState(false);
  const [isSaving, setIsSaving] = useState(false);

  const loadConnections = async () => {
    setIsLoading(true);
    setError('');
    try {
      const result = await listByokConnectionsAction();
      if (result.success && result.data) {
        setConnections(result.data);
      } else {
        setError(result.error || 'Failed to load connections');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to load connections');
    } finally {
      setIsLoading(false);
    }
  };

  useEffect(() => {
    if (isOpen) {
      loadConnections();
    }
  }, [isOpen]);

  const handlePresetChange = (value: string) => {
    setPreset(value);
    setBaseUrl(value);
  };

  const handleAddConnection = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setSuccessMessage('');
    setIsSaving(true);

    try {
      const result = await addByokConnectionAction({ label, baseUrl, modelId, apiKey });
      if (result.success) {
        setSuccessMessage('Connection added');
        setLabel('');
        setModelId('');
        setApiKey('');
        setPreset(BASE_URL_PRESETS[0].value);
        setBaseUrl(BASE_URL_PRESETS[0].value);
        await loadConnections();
      } else {
        setError(result.error || 'Failed to add connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to add connection');
    } finally {
      setIsSaving(false);
    }
  };

  const handleDelete = async (connectionId: string) => {
    setError('');
    setDeletingId(connectionId);
    try {
      const result = await deleteByokConnectionAction(connectionId);
      if (result.success) {
        setConnections(prev => prev.filter(c => c.id !== connectionId));
      } else {
        setError(result.error || 'Failed to delete connection');
      }
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Failed to delete connection');
    } finally {
      setDeletingId(null);
    }
  };

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        className="fixed inset-0 bg-black/50 backdrop-blur-sm z-40 flex items-center justify-center sm:items-start sm:justify-end p-4"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, y: 20 }}
          animate={{ opacity: 1, y: 0 }}
          exit={{ opacity: 0, y: 20 }}
          className="bg-gray-800 border border-gray-700 rounded-xl p-6 w-full max-w-md sm:w-96 shadow-2xl max-h-[85vh] overflow-y-auto"
          onClick={(e) => e.stopPropagation()}
        >
          {/* Header */}
          <div className="flex items-center justify-between mb-4">
            <div className="flex items-center gap-2">
              <KeyRound className="w-5 h-5 text-purple-400" />
              <h3 className="text-lg font-semibold text-white">API Keys</h3>
            </div>
            <button
              onClick={onClose}
              className="p-1 text-gray-400 hover:text-white hover:bg-gray-700 rounded transition-colors"
            >
              <X className="w-4 h-4" />
            </button>
          </div>

          <p className="text-sm text-gray-400 mb-4">
            Connect any OpenAI-compatible provider with your own API key. Keys are encrypted at rest.
          </p>

          {error && (
            <div className="mb-4 p-3 bg-red-900/50 border border-red-700 rounded-lg text-red-300 text-sm">
              {error}
            </div>
          )}
          {successMessage && (
            <div className="mb-4 p-3 bg-green-900/50 border border-green-700 rounded-lg text-green-300 text-sm">
              {successMessage}
            </div>
          )}

          {/* Existing connections */}
          <div className="space-y-2 mb-6">
            {isLoading ? (
              <div className="flex items-center justify-center py-4 text-gray-400">
                <Loader2 className="w-5 h-5 animate-spin" />
              </div>
            ) : connections.length === 0 ? (
              <p className="text-sm text-gray-500 italic">No connections yet.</p>
            ) : (
              connections.map((connection) => (
                <div
                  key={connection.id}
                  className="flex items-center justify-between gap-2 p-3 bg-gray-700/50 rounded-lg"
                >
                  <div className="min-w-0">
                    <div className="text-sm font-medium text-white truncate">{connection.label}</div>
                    <div className="text-xs text-gray-400 truncate">{connection.baseUrl}</div>
                    <div className="text-xs text-gray-500 truncate">{connection.modelId}</div>
                  </div>
                  <button
                    onClick={() => handleDelete(connection.id)}
                    disabled={deletingId === connection.id}
                    className="p-2 text-gray-400 hover:text-red-400 hover:bg-gray-600 rounded-md transition-colors disabled:opacity-50 flex-shrink-0"
                    title="Delete connection"
                  >
                    {deletingId === connection.id ? (
                      <Loader2 className="w-4 h-4 animate-spin" />
                    ) : (
                      <Trash2 className="w-4 h-4" />
                    )}
                  </button>
                </div>
              ))
            )}
          </div>

          {/* Add connection form */}
          <form onSubmit={handleAddConnection} className="space-y-3 border-t border-gray-700 pt-4">
            <h4 className="text-sm font-semibold text-gray-300">Add Connection</h4>

            <input
              type="text"
              placeholder="Label (e.g. My OpenAI key)"
              value={label}
              onChange={(e) => setLabel(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSaving}
            />

            <select
              value={preset}
              onChange={(e) => handlePresetChange(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500"
              disabled={isSaving}
            >
              {BASE_URL_PRESETS.map((p) => (
                <option key={p.label} value={p.value}>{p.label}</option>
              ))}
            </select>

            <input
              type="url"
              placeholder="Base URL"
              value={baseUrl}
              onChange={(e) => setBaseUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSaving}
            />

            <input
              type="text"
              placeholder="Model ID (e.g. gpt-4o-mini)"
              value={modelId}
              onChange={(e) => setModelId(e.target.value)}
              className="w-full px-3 py-2 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
              required
              disabled={isSaving}
            />

            <div className="relative">
              <input
                type={showApiKey ? 'text' : 'password'}
                placeholder="API key"
                value={apiKey}
                onChange={(e) => setApiKey(e.target.value)}
                className="w-full px-3 py-2 pr-10 rounded-lg bg-gray-900 text-white border border-gray-700 text-sm focus:outline-none focus:ring-2 focus:ring-purple-500 focus:border-transparent"
                required
                disabled={isSaving}
                autoComplete="off"
              />
              <button
                type="button"
                onClick={() => setShowApiKey(!showApiKey)}
                className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400 hover:text-white transition-colors"
                disabled={isSaving}
              >
                {showApiKey ? <EyeOff className="w-4 h-4" /> : <Eye className="w-4 h-4" />}
              </button>
            </div>

            <button
              type="submit"
              disabled={isSaving || !label || !baseUrl || !modelId || !apiKey}
              className="w-full py-2 bg-purple-600 rounded-lg font-semibold hover:bg-purple-500 transition-colors disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2 text-sm"
            >
              {isSaving ? (
                <>
                  <Loader2 className="w-4 h-4 animate-spin" />
                  Adding...
                </>
              ) : (
                <>
                  <Plus className="w-4 h-4" />
                  Add Connection
                </>
              )}
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
}
