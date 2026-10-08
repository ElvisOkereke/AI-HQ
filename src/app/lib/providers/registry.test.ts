// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { providerRegistry } from './registry';

describe('providerRegistry.getProviderFromModelId', () => {
  it('routes every model id to FuelIX unchanged', () => {
    for (const id of ['gemini-3.6-flash', 'gpt-5-mini', 'claude-opus-4-8', 'gpt-oss-20b', 'some-unknown-model']) {
      expect(providerRegistry.getProviderFromModelId(id)).toEqual({
        provider: 'Fuelix',
        actualModelId: id,
      });
    }
  });
});

describe('providerRegistry.getProvider', () => {
  it('returns the FuelIX provider', () => {
    expect(providerRegistry.getProvider('Fuelix').name).toBe('Fuelix');
  });

  it('throws for an unregistered provider name', () => {
    expect(() => providerRegistry.getProvider('Google' as any)).toThrow();
    expect(() => providerRegistry.getProvider('Groq' as any)).toThrow();
  });
});
