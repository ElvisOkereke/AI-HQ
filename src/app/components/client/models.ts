import { WandSparkles, ImagePlus, Brain, Zap, Cpu, Eye } from 'lucide-react';
import { LLMModel } from "../../types/types";

// Export the LLMModel type so it can be used in the parent component
export type { LLMModel };

export const llmModels: LLMModel[] = [
  // Google Models
  {
    id: 'gemini-2.0-flash',
    name: 'Gemini 2.0 Flash',
    icon: WandSparkles,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
      streaming: true,
      maxTokens: 8192
    },
    description: 'Google\'s latest multimodal AI with advanced reasoning and real-time capabilities',
    provider: 'Google',
    category: 'multimodal',
    contextLength: 1000000
  },
  {
    id: 'gemini-2.5-flash-lite-preview-06-17',
    name: 'Gemini 2.5 Flash Preview',
    icon: WandSparkles,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: true,
      webSearch: true,
      streaming: true,
      maxTokens: 8192
    },
    description: 'Enhanced preview with Google Search grounding for real-time information and current data',
    provider: 'Google',
    category: 'multimodal',
    contextLength: 1000000,
    isExperimental: true
  },
  {
    id: 'gemini-2.0-flash-preview-image-generation',
    name: 'Gemini 2.0 Flash Image Gen',
    icon: ImagePlus,
    features: {
      imageGeneration: true,
      imageUpload: true,
      fileUpload: true,
      webSearch: false,
      streaming: false,
      maxTokens: 8192
    },
    description: 'Gemini with image generation capabilities',
    provider: 'Google',
    category: 'image',
    contextLength: 1000000,
    isExperimental: true
  },

  // HuggingFace Models
  {
    id: 'meta-llama/Llama-4-Maverick-17B-128E-Instruct-FP8',
    name: 'Llama 4 17B Instruct',
    icon: Brain,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Larger Llama 4 Maverick model with improved performance',
    provider: 'HuggingFace',
    category: 'text',
    contextLength: 128000
  },
  {
    id: 'mistralai/Mistral-7B-Instruct-v0.3',
    name: 'Mistral 7B Instruct',
    icon: Zap,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 8192
    },
    description: 'Fast and efficient instruction-following model',
    provider: 'HuggingFace',
    category: 'text',
    contextLength: 8192
  },

  // Nvidia NIM Models
  {
    id: 'meta/llama-3.1-8b-instruct',
    name: 'Llama 3.1 8B Instruct',
    icon: Cpu,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Meta\'s latest instruction-following model via Nvidia NIM',
    provider: 'Nvidia',
    category: 'text',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.1-70b-instruct',
    name: 'Llama 3.1 70B Instruct',
    icon: Cpu,
    features: {
      imageGeneration: false,
      imageUpload: false,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Large-scale Llama model with advanced reasoning',
    provider: 'Nvidia',
    category: 'reasoning',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.2-11b-vision-instruct',
    name: 'Llama 3.2 11B Vision',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Vision-capable Llama model for image understanding',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
  {
    id: 'meta/llama-3.2-90b-vision-instruct',
    name: 'Llama 3.2 90B Vision',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Large vision model with exceptional image analysis',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
  {
    id: 'microsoft/phi-3-vision-128k-instruct',
    name: 'Phi-3 Vision 128k',
    icon: Eye,
    features: {
      imageGeneration: false,
      imageUpload: true,
      fileUpload: false,
      webSearch: false,
      streaming: true,
      maxTokens: 4096
    },
    description: 'Microsoft\'s compact vision model with large context',
    provider: 'Nvidia',
    category: 'multimodal',
    contextLength: 128000
  },
];
