import 'server-only';
import { Chat, Message, ModelProvider as ModelProviderType } from '../../types/types';
import { ModelProvider } from './index';
import { GoogleProvider } from './google';
import { HuggingFaceProvider } from './huggingface';
import { NvidiaProvider } from './nvidia';

class ProviderRegistry {
  private providers: Map<ModelProviderType, ModelProvider> = new Map();

  constructor() {
    this.providers.set('Google', new GoogleProvider());
    this.providers.set('HuggingFace', new HuggingFaceProvider());
    this.providers.set('Nvidia', new NvidiaProvider());
  }

  getProvider(providerName: ModelProviderType): ModelProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider;
  }

  async sendMessage(providerName: ModelProviderType, modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const provider = this.getProvider(providerName);
    return provider.sendMessage(modelId, chat);
  }

  async generateTitle(providerName: ModelProviderType, modelId: string, userMessage: Message): Promise<string> {
    const provider = this.getProvider(providerName);
    if (provider.generateTitle) {
      return provider.generateTitle(modelId, userMessage);
    }
    
    // Fallback to default provider for title generation
    const defaultProvider = this.getProvider('Google');
    return defaultProvider.generateTitle!(modelId, userMessage);
  }

  supportsImageGeneration(providerName: ModelProviderType, modelId: string): boolean {
    const provider = this.getProvider(providerName);
    return provider.supportsImageGeneration?.(modelId) || false;
  }

  supportsStreaming(providerName: ModelProviderType, modelId: string): boolean {
    const provider = this.getProvider(providerName);
    return provider.supportsStreaming?.(modelId) || false;
  }

  // Get provider from model ID
  getProviderFromModelId(modelId: string): { provider: ModelProviderType; actualModelId: string } {
    // Google models
    if (modelId.startsWith('gemini')) {
      return { provider: 'Google', actualModelId: modelId };
    }
    
    // HuggingFace models (usually have format "org/model")
    if (modelId.includes('/') && !modelId.startsWith('meta/') && !modelId.startsWith('microsoft/') && !modelId.startsWith('stabilityai/')) {
      return { provider: 'HuggingFace', actualModelId: modelId };
    }
    
    // Nvidia models (usually start with org name or are specific nvidia models)
    if (modelId.startsWith('meta/') || modelId.startsWith('microsoft/') || modelId.includes('nvidia') || modelId.includes('nim-')) {
      return { provider: 'Nvidia', actualModelId: modelId };
    }
    
    // Special cases for known providers
    if (modelId.startsWith('hf-')) {
      return { provider: 'HuggingFace', actualModelId: modelId.replace('hf-', '') };
    }
    
    if (modelId.startsWith('nv-')) {
      return { provider: 'Nvidia', actualModelId: modelId.replace('nv-', '') };
    }
    
    // Default to Google
    return { provider: 'Google', actualModelId: modelId };
  }
}

// Export a singleton instance
export const providerRegistry = new ProviderRegistry();
