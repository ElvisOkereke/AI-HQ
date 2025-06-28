import 'server-only';
import { GoogleGenAI, createUserContent, Modality } from "@google/genai";
import { createStreamableValue } from 'ai/rsc';
import { Chat, Message, MediaItem } from '../../types/types';
import { ModelProvider, formatChatHistory, getContextMedia, getCurrentMedia } from './index';

export class GoogleProvider implements ModelProvider {
  name = 'Google';
  private client: GoogleGenAI;

  constructor() {
    this.client = new GoogleGenAI({ apiKey: process.env.GOOGLE_API_KEY as string });
  }

  private convertMediaToInlineData(mediaItems: MediaItem[]) {
    return mediaItems.map(media => ({
      inlineData: {
        mimeType: media.fileType,
        data: media.fileData,
      },
    }));
  }

  async sendMessage(modelId: string, chat: Chat): Promise<{ stream: any; img?: any }> {
    const streamable = createStreamableValue("");
    const streamableIMG = createStreamableValue("");

    // Get media items for the last message and previous context
    const lastMessage = chat.chatHistory[chat.chatHistory.length - 1];
    const currentMessageMedia = getCurrentMedia(chat, lastMessage.id);
    const previousContextMedia = getContextMedia(chat, lastMessage.id);

    // Convert to inline data format
    const currentInlineData = this.convertMediaToInlineData(currentMessageMedia);
    const previousInlineData = this.convertMediaToInlineData(previousContextMedia);
    const allInlineData = [...currentInlineData, ...previousInlineData];

    console.log(`Google Provider: Sending ${currentInlineData.length} current media items and ${previousInlineData.length} context media items`);

    const isImageGenerationModel = modelId.includes('image-generation');

    // Start the async process
    (async () => {
      try {
        const contextMessage = `This is the context of user and ai assistant conversation. ${JSON.stringify(chat.chatHistory)} The first ${currentInlineData.length} inline data elements are new attachments from the most recent message, the other ${previousInlineData.length} are previous attachments. When the user references attachments in the prompt of the most recent message, they are likely referring to the new set of attachments. Continue the conversation by answering the most recent message.`;

        if (isImageGenerationModel) {
          // Use image generation model
          const response = await this.client.models.generateContent({
            model: modelId,
            contents: createUserContent([
              contextMessage + " (You are an image model so make sure you output images if user asks and cross context from previous prompts unless the user specifically says so)",
              ...allInlineData
            ]),
            config: {
              responseModalities: [Modality.TEXT, Modality.IMAGE],
            },
          });

          if (response.candidates?.[0]?.content?.parts) {
            for (const part of response.candidates[0].content.parts) {
              if (part.text) {
                streamable.update(part.text);
              } else if (part.inlineData?.data) {
                streamableIMG.update(part.inlineData.data);
              }
            }
          }
        } else {
          // Use text/multimodal model with streaming
          const response = await this.client.models.generateContentStream({
            model: modelId,
            contents: createUserContent([contextMessage, ...allInlineData])
          });

          for await (const chunk of response) {
            const text = chunk.text as string;
            streamable.update(text);
          }
        }
      } catch (error) {
        const errorMessage = error instanceof Error ? error.message : String(error);
        streamable.error(errorMessage);
        if (isImageGenerationModel) {
          streamableIMG.error(errorMessage);
        }
      } finally {
        streamable.done();
        if (isImageGenerationModel) {
          streamableIMG.done();
        }
      }
    })();

    return {
      stream: streamable.value,
      img: isImageGenerationModel ? streamableIMG.value : undefined
    };
  }

  async generateTitle(modelId: string, userMessage: Message): Promise<string> {
    const response = await this.client.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: `Using this initial user message "${userMessage.content}" output a singular title for this User to AI chat instance, ONLY RESPOND WITH TITLE`
    });
    return response.text;
  }

  supportsImageGeneration(modelId: string): boolean {
    return modelId.includes('image-generation');
  }

  supportsStreaming(modelId: string): boolean {
    return !modelId.includes('image-generation');
  }
}
