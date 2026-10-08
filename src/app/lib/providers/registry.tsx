import 'server-only';
import { Chat, Message, ModelProvider as ModelProviderType } from '../../types/types';
import { ModelProvider } from './index';
import { FuelixProvider } from './fuelix';

class ProviderRegistry {
  private providers: Map<ModelProviderType, ModelProvider> = new Map();

  constructor() {
    this.providers.set('Fuelix', new FuelixProvider());
  }

  getProvider(providerName: ModelProviderType): ModelProvider {
    const provider = this.providers.get(providerName);
    if (!provider) {
      throw new Error(`Provider ${providerName} not found`);
    }
    return provider;
  }

  async sendMessage(providerName: ModelProviderType, modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    return this.getProvider(providerName).sendMessage(modelId, chat);
  }

  async generateTitle(providerName: ModelProviderType, modelId: string, userMessage: Message): Promise<string> {
    return this.getProvider(providerName).generateTitle!(modelId, userMessage);
  }

  supportsImageGeneration(providerName: ModelProviderType, modelId: string): boolean {
    return this.getProvider(providerName).supportsImageGeneration?.(modelId) || false;
  }

  supportsStreaming(providerName: ModelProviderType, modelId: string): boolean {
    return this.getProvider(providerName).supportsStreaming?.(modelId) || false;
  }

  // Every non-BYOK model is served by FuelIX.
  getProviderFromModelId(modelId: string): { provider: ModelProviderType; actualModelId: string } {
    return { provider: 'Fuelix', actualModelId: modelId };
  }
}

export const providerRegistry = new ProviderRegistry();
