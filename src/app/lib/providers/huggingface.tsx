import 'server-only';
import {  InferenceClient } from '@huggingface/inference';
import { createStreamableValue } from 'ai/rsc';
import { Chat, Message, MediaItem } from '../../types/types';
import { ModelProvider, formatChatHistory, getContextMedia, getCurrentMedia } from './index';

export class HuggingFaceProvider implements ModelProvider {
  name = 'HuggingFace';
  private client: InferenceClient;

  constructor() {
    this.client = new InferenceClient(process.env.HUGGINGFACE_API_TOKEN);
  }

  private formatMessagesForHF(chat: Chat): any[] {
    const messages = formatChatHistory(chat, false); // Don't include media for now
    
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  async sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const streamable = createStreamableValue("");
    
    // Get media items for context
    const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
    const currentMessageMedia = getCurrentMedia(chat, lastMessage.id);
    const previousContextMedia = getContextMedia(chat, lastMessage.id);

    console.log(`HuggingFace Provider: Processing ${currentMessageMedia.length} current media items and ${previousContextMedia.length} context media items`);

    // Start the async process
    (async () => {
      try {
        const messages = this.formatMessagesForHF(chat);
        
        // Add context about media if present
        if (currentMessageMedia.length > 0 || previousContextMedia.length > 0) {
          const contextNote = `[Note: User has ${currentMessageMedia.length} new attachments and ${previousContextMedia.length} previous attachments in this conversation, but this model cannot process them directly.]`;
          messages[messages.length - 1].content += `\n\n${contextNote}`;
        }

        if (this.supportsStreaming(modelId)) {
          // Use streaming for supported models
          const stream = this.client.chatCompletionStream({
            model: modelId,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
          });

          for await (const chunk of stream) {
            if (chunk.choices?.[0]?.delta?.content) {
              streamable.update(chunk.choices[0].delta.content);
            }
          }
        } else {
          // Use non-streaming for models that don't support it
          const response = await this.client.chatCompletion({
            model: modelId,
            messages: messages,
            max_tokens: 1000,
            temperature: 0.7,
          });

          if (response.choices?.[0]?.message?.content) {
            streamable.update(response.choices[0].message.content);
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
    const response = await this.client.chatCompletion({
      model: 'microsoft/DialoGPT-medium',
      messages: [
        {
          role: 'user',
          content: `Create a short, descriptive title for a conversation that starts with: "${userMessage.content}". Respond with only the title, no quotes or extra text.`
        }
      ],
      max_tokens: 50,
      temperature: 0.3,
    });

    return response.choices?.[0]?.message?.content?.trim() || 'New Chat';
  }

  supportsImageGeneration(modelId: string): boolean {
    // Some HF models support image generation
    const imageModels = [
      'stabilityai/stable-diffusion-2-1',
      'stabilityai/stable-diffusion-xl-base-1.0',
      'runwayml/stable-diffusion-v1-5'
    ];
    return imageModels.includes(modelId);
  }

  supportsStreaming(modelId: string): boolean {
    // Most chat models support streaming
    const streamingModels = [
      'meta-llama/Llama-2-7b-chat-hf',
      'meta-llama/Llama-2-13b-chat-hf',
      'meta-llama/Llama-2-70b-chat-hf',
      'microsoft/DialoGPT-medium',
      'microsoft/DialoGPT-large',
      'HuggingFaceH4/zephyr-7b-beta',
      'mistralai/Mistral-7B-Instruct-v0.1',
      'mistralai/Mixtral-8x7B-Instruct-v0.1'
    ];
    return streamingModels.includes(modelId);
  }
}
