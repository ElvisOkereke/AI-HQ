import { describe, it, expect } from 'vitest';
import { llmModels, toExtraFuelixModels } from './models';

describe('llmModels (static fallback)', () => {
  it('only contains FuelIX models with unique ids', () => {
    expect(llmModels.length).toBeGreaterThan(0);
    expect(llmModels.every(m => m.provider === 'Fuelix')).toBe(true);
    expect(new Set(llmModels.map(m => m.id)).size).toBe(llmModels.length);
  });

  it('keeps the guest-locked model available', () => {
    expect(llmModels.some(m => m.id === 'gemini-3.5-flash-lite')).toBe(true);
  });
});

describe('toExtraFuelixModels', () => {
  const infos = [
    { id: 'gpt-5-mini', name: 'GPT 5 Mini', category: 'text' as const, description: 'GPT 5 Mini via FuelIX' },
    { id: 'o4-mini', name: 'O4 Mini', category: 'reasoning' as const, description: 'O4 Mini via FuelIX' },
    { id: 'claude-opus-4-8', name: 'Claude Opus 4.8', category: 'text' as const, description: 'Claude Opus 4.8 via FuelIX' },
  ];

  it('excludes models already in the static list', () => {
    const ids = toExtraFuelixModels(infos).map(m => m.id);
    expect(ids).not.toContain('gpt-5-mini');
    expect(ids).toContain('o4-mini');
    expect(ids).toContain('claude-opus-4-8');
  });

  it('maps to renderable LLMModel entries', () => {
    for (const m of toExtraFuelixModels(infos)) {
      expect(m.provider).toBe('Fuelix');
      expect(m.icon).toBeTruthy();
      expect(m.features.streaming).toBe(true);
      expect(m.features.imageUpload).toBe(false);
    }
  });

  it('returns an empty list for no input', () => {
    expect(toExtraFuelixModels([])).toEqual([]);
  });
});
