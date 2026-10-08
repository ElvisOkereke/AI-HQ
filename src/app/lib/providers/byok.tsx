import 'server-only';
import { OpenAI } from 'openai';
import { createStreamableValue } from 'ai/rsc';
import { Chat, Message } from '../../types/types';
import { ModelProvider, formatChatHistory } from './index';

// Generic OpenAI-compatible connector for a user's own key/endpoint.
// Constructed per-call (never a singleton) — each call may target a
// different user's connection, so there's nothing to share across requests.
export class BYOKProvider implements ModelProvider {
  name = 'BYOK';
  private client: OpenAI;

  constructor(config: { baseUrl: string; apiKey: string }) {
    this.client = new OpenAI({
      apiKey: config.apiKey,
      baseURL: config.baseUrl,
    });
  }

  private formatMessages(chat: Chat): any[] {
    const messages = formatChatHistory(chat, false);

    return messages.map(msg => ({
      role: msg.role,
      content: msg.content,
    }));
  }

  async sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const streamable = createStreamableValue("");

    (async () => {
      try {
        const messages = this.formatMessages(chat);

        const stream = await this.client.chat.completions.create({
          model: modelId,
          messages,
          max_tokens: 4096,
          temperature: 0.7,
          stream: true,
        });

        for await (const chunk of stream) {
          if (chunk.choices?.[0]?.delta?.content) {
            streamable.update(chunk.choices[0].delta.content);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        streamable.error(errorMessage);
      } finally {
        streamable.done();
      }
    })();

    return { stream: streamable.value };
  }

  async generateTitle(modelId: string, userMessage: Message): Promise<string> {
    const response = await this.client.chat.completions.create({
      model: modelId,
      messages: [
        {
          role: 'user',
          content: `Create a short, descriptive title for a conversation that starts with: "${userMessage.content}". Respond with only the title, no quotes or extra text.`,
        },
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    return response.choices?.[0]?.message?.content?.trim() || 'New Chat';
  }

  supportsImageGeneration(): boolean {
    return false;
  }

  supportsStreaming(): boolean {
    return true;
  }
}
