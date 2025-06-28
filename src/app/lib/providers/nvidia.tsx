import 'server-only';
import { OpenAI } from 'openai';
import { createStreamableValue } from 'ai/rsc';
import { Chat, Message, MediaItem } from '../../types/types';
import { ModelProvider, formatChatHistory, getContextMedia, getCurrentMedia } from './index';

export class NvidiaProvider implements ModelProvider {
  name = 'Nvidia';
  private client: OpenAI;

  constructor() {
    // Nvidia NIM uses OpenAI-compatible API
    this.client = new OpenAI({
      apiKey: process.env.NVIDIA_API_KEY || 'nvapi-key',
      baseURL: 'https://integrate.api.nvidia.com/v1',
    });
  }

  private formatMessagesForNvidia(chat: Chat): any[] {
    const messages = formatChatHistory(chat, false);
    
    return messages.map(msg => ({
      role: msg.role,
      content: msg.content
    }));
  }

  private convertMediaToContent(mediaItems: MediaItem[]): any[] {
    return mediaItems
      .filter(media => media.mediaType === 'image') // Only process images for now
      .map(media => ({
        type: 'image_url',
        image_url: {
          url: `data:${media.fileType};base64,${media.fileData}`
        }
      }));
  }

  async sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const streamable = createStreamableValue("");
    
    // Get media items for context
    const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
    const currentMessageMedia = getCurrentMedia(chat, lastMessage.id);
    const previousContextMedia = getContextMedia(chat, lastMessage.id);

    console.log(`Nvidia Provider: Processing ${currentMessageMedia.length} current media items and ${previousContextMedia.length} context media items`);

    // Start the async process
    (async () => {
      try {
        const messages = this.formatMessagesForNvidia(chat);
        
        // For vision models, add image content to the last message
        if (this.supportsVision(modelId) && currentMessageMedia.length > 0) {
          const lastMsg = messages[messages.length - 1];
          const imageContent = this.convertMediaToContent(currentMessageMedia);
          
          if (imageContent.length > 0) {
            lastMsg.content = [
              { type: 'text', text: lastMsg.content },
              ...imageContent
            ];
          }
        }

        if (this.supportsStreaming(modelId)) {
          // Use streaming
          const stream = await this.client.chat.completions.create({
            model: modelId,
            messages: messages,
            max_tokens: 1024,
            temperature: 0.7,
            stream: true,
          });

          for await (const chunk of stream) {
            if (chunk.choices?.[0]?.delta?.content) {
              streamable.update(chunk.choices[0].delta.content);
            }
          }
        } else {
          // Use non-streaming
          const response = await this.client.chat.completions.create({
            model: modelId,
            messages: messages,
            max_tokens: 1024,
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
    const response = await this.client.chat.completions.create({
      model: 'meta/llama-3.1-8b-instruct',
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
    // Nvidia has some image generation models
    const imageModels = [
      'stabilityai/stable-diffusion-xl',
      'stabilityai/stable-diffusion-3-medium'
    ];
    return imageModels.includes(modelId);
  }

  supportsVision(modelId: string): boolean {
    // Vision models that can process images
    const visionModels = [
      'meta/llama-3.2-11b-vision-instruct',
      'meta/llama-3.2-90b-vision-instruct',
      'microsoft/phi-3-vision-128k-instruct'
    ];
    return visionModels.includes(modelId);
  }

  supportsStreaming(modelId: string): boolean {
    // Most chat models support streaming
    return !this.supportsImageGeneration(modelId);
  }
}
