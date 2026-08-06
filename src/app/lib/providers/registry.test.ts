// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { providerRegistry } from './registry';

describe('providerRegistry.getProviderFromModelId', () => {
  it('routes gemini models to Google', () => {
    expect(providerRegistry.getProviderFromModelId('gemini-2.0-flash')).toEqual({
      provider: 'Google',
      actualModelId: 'gemini-2.0-flash',
    });
  });

  it('routes org/model style ids to HuggingFace', () => {
    expect(providerRegistry.getProviderFromModelId('mistralai/Mistral-7B-Instruct-v0.2')).toEqual({
      provider: 'HuggingFace',
      actualModelId: 'mistralai/Mistral-7B-Instruct-v0.2',
    });
  });

  it('routes meta/ and microsoft/ prefixed ids to Nvidia despite the slash', () => {
    expect(providerRegistry.getProviderFromModelId('meta/llama-3.1-405b-instruct')).toEqual({
      provider: 'Nvidia',
      actualModelId: 'meta/llama-3.1-405b-instruct',
    });
    expect(providerRegistry.getProviderFromModelId('microsoft/phi-3-medium')).toEqual({
      provider: 'Nvidia',
      actualModelId: 'microsoft/phi-3-medium',
    });
  });

  it('routes ids mentioning nvidia or nim- to Nvidia', () => {
    expect(providerRegistry.getProviderFromModelId('nvidia-nemotron')).toEqual({
      provider: 'Nvidia',
      actualModelId: 'nvidia-nemotron',
    });
    expect(providerRegistry.getProviderFromModelId('nim-llama3')).toEqual({
      provider: 'Nvidia',
      actualModelId: 'nim-llama3',
    });
  });

  it('strips the hf- prefix and routes to HuggingFace', () => {
    expect(providerRegistry.getProviderFromModelId('hf-some-model')).toEqual({
      provider: 'HuggingFace',
      actualModelId: 'some-model',
    });
  });

  it('strips the nv- prefix and routes to Nvidia', () => {
    expect(providerRegistry.getProviderFromModelId('nv-some-model')).toEqual({
      provider: 'Nvidia',
      actualModelId: 'some-model',
    });
  });

  it('defaults unrecognized model ids to Google', () => {
    expect(providerRegistry.getProviderFromModelId('some-unknown-model')).toEqual({
      provider: 'Google',
      actualModelId: 'some-unknown-model',
    });
  });
});

describe('providerRegistry.getProvider', () => {
  it('returns a provider instance for each known provider name', () => {
    expect(providerRegistry.getProvider('Google').name).toBe('Google');
    expect(providerRegistry.getProvider('HuggingFace').name).toBe('HuggingFace');
    expect(providerRegistry.getProvider('Nvidia').name).toBe('Nvidia');
  });

  it('throws for an unregistered provider name', () => {
    expect(() => providerRegistry.getProvider('OpenAI' as any)).toThrow();
  });
});
