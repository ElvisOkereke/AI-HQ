import 'server-only';
import { OpenAI } from 'openai';
import { createStreamableValue } from 'ai/rsc';
import { Chat, Message } from '../../types/types';
import { ModelProvider, formatChatHistory } from './index';
import { isMessagesOnlyError } from './fuelixModels';
import { toAnthropicRequest, parseAnthropicSse } from './anthropicMessages';

const DEFAULT_BASE_URL = 'https://api.fuelix.ai/v1';
const TITLE_MODEL = 'gemini-3.5-flash-lite';

export function getFuelixBaseUrl(): string {
  return (process.env.FUELIX_BASE_URL || DEFAULT_BASE_URL).replace(/\/+$/, '');
}

export function getFuelixApiKey(): string {
  const key = process.env.FUELIX_API_KEY;
  if (!key) throw new Error('FUELIX_API_KEY is not configured on the server.');
  return key;
}

export async function fetchFuelixModelIds(): Promise<string[]> {
  const res = await fetch(`${getFuelixBaseUrl()}/models`, {
    headers: { Authorization: `Bearer ${getFuelixApiKey()}` },
    next: { revalidate: 600 },
  });
  if (!res.ok) throw new Error(`FuelIX /models failed with status ${res.status}`);
  const body = await res.json();
  return (body.data ?? []).map((m: { id: string }) => m.id);
}

export class FuelixProvider implements ModelProvider {
  name = 'Fuelix';

  private client(): OpenAI {
    return new OpenAI({ apiKey: getFuelixApiKey(), baseURL: getFuelixBaseUrl() });
  }

  private formatMessages(chat: Chat) {
    return formatChatHistory(chat, false).map(msg => ({ role: msg.role, content: msg.content }));
  }

  // max_tokens/temperature are omitted on purpose: newer models (gpt-5/6, o-series) reject them.
  private async streamChatCompletions(modelId: string, messages: ReturnType<FuelixProvider['formatMessages']>, onText: (t: string) => void) {
    const stream = await this.client().chat.completions.create({ model: modelId, messages, stream: true });
    for await (const chunk of stream) {
      const text = chunk.choices?.[0]?.delta?.content;
      if (text) onText(text);
    }
  }

  // Premium models (e.g. Opus) are only served on FuelIX's Anthropic-style endpoint.
  private async streamMessages(modelId: string, messages: ReturnType<FuelixProvider['formatMessages']>, onText: (t: string) => void) {
    const res = await fetch(`${getFuelixBaseUrl()}/messages`, {
      method: 'POST',
      headers: {
        Authorization: `Bearer ${getFuelixApiKey()}`,
        'Content-Type': 'application/json',
        'anthropic-version': '2023-06-01',
      },
      body: JSON.stringify(toAnthropicRequest(modelId, messages)),
    });
    if (!res.ok || !res.body) {
      throw new Error(`FuelIX /messages failed with status ${res.status}: ${(await res.text()).slice(0, 300)}`);
    }

    const reader = res.body.getReader();
    const decoder = new TextDecoder();
    let buffer = '';
    for (;;) {
      const { done, value } = await reader.read();
      if (done) break;
      const parsed = parseAnthropicSse(buffer + decoder.decode(value, { stream: true }));
      buffer = parsed.rest;
      parsed.texts.forEach(onText);
      if (parsed.error) throw new Error(parsed.error);
    }
  }

  async sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const streamable = createStreamableValue("");

    (async () => {
      try {
        const messages = this.formatMessages(chat);
        const onText = (t: string) => streamable.update(t);
        try {
          await this.streamChatCompletions(modelId, messages, onText);
        } catch (error) {
          if (!isMessagesOnlyError(error)) throw error;
          await this.streamMessages(modelId, messages, onText);
        }
        streamable.done();
      } catch (error) {
        streamable.error(error instanceof Error ? error.message : String(error));
      }
    })();

    return { stream: streamable.value };
  }

  async generateTitle(_modelId: string, userMessage: Message): Promise<string> {
    try {
      const response = await this.client().chat.completions.create({
        model: TITLE_MODEL,
        messages: [
          {
            role: 'user',
            content: `Create a short, descriptive title for a conversation that starts with: "${userMessage.content}". Respond with only the title, no quotes or extra text.`,
          },
        ],
        max_tokens: 50,
      });
      return response.choices?.[0]?.message?.content?.trim() || 'New Chat';
    } catch {
      return userMessage.content.trim().slice(0, 40) || 'New Chat';
    }
  }

  supportsImageGeneration(): boolean {
    return false;
  }

  supportsStreaming(): boolean {
    return true;
  }
}
