import { WandSparkles, Brain, Zap } from 'lucide-react';
import { LLMModel } from "../../types/types";
import type { FuelixModelInfo } from '../../lib/providers/fuelixModels';

// Export the LLMModel type so it can be used in the parent component
export type { LLMModel };

const textOnly = { imageUpload: false, fileUpload: false, webSearch: false, streaming: true };

// Static fallback shown immediately and whenever the live FuelIX model list can't be loaded.
// The full list comes from FuelIX's /models endpoint (see listFuelixModelsAction).
export const llmModels: LLMModel[] = [
  {
    id: 'gemini-3.6-flash',
    name: 'Gemini 3.6 Flash',
    icon: WandSparkles,
    features: textOnly,
    description: 'Google\'s frontier model with strong agentic and coding performance, via FuelIX',
    provider: 'Fuelix',
    category: 'text',
  },
  {
    id: 'gemini-3.5-flash-lite',
    name: 'Gemini 3.5 Flash Lite',
    icon: Zap,
    features: textOnly,
    description: 'Fastest, lowest-cost Gemini model, via FuelIX',
    provider: 'Fuelix',
    category: 'text',
  },
  {
    id: 'claude-sonnet-5',
    name: 'Claude Sonnet 5',
    icon: WandSparkles,
    features: textOnly,
    description: 'Anthropic\'s balanced model for coding and analysis, via FuelIX',
    provider: 'Fuelix',
    category: 'text',
  },
  {
    id: 'claude-haiku-5',
    name: 'Claude Haiku 5',
    icon: Zap,
    features: textOnly,
    description: 'Anthropic\'s fast, low-cost model, via FuelIX',
    provider: 'Fuelix',
    category: 'text',
  },
  {
    id: 'gpt-5-mini',
    name: 'GPT 5 Mini',
    icon: Zap,
    features: textOnly,
    description: 'Fast, cost-efficient GPT model, via FuelIX',
    provider: 'Fuelix',
    category: 'text',
  },
  {
    id: 'gpt-oss-20b',
    name: 'GPT OSS 20B',
    icon: Brain,
    features: textOnly,
    description: 'Open-weight reasoning model, via FuelIX',
    provider: 'Fuelix',
    category: 'reasoning',
  },
];

function pickIcon(info: FuelixModelInfo) {
  if (info.category === 'reasoning') return Brain;
  if (/(flash|mini|nano|lite|haiku)/i.test(info.id)) return Zap;
  return WandSparkles;
}

// Live FuelIX models that aren't already in the static list, ready for the model picker.
export function toExtraFuelixModels(infos: FuelixModelInfo[]): LLMModel[] {
  const known = new Set(llmModels.map(m => m.id));
  return infos
    .filter(info => !known.has(info.id))
    .map((info): LLMModel => ({
      id: info.id,
      name: info.name,
      icon: pickIcon(info),
      features: textOnly,
      description: info.description,
      provider: 'Fuelix',
      category: info.category,
    }));
}
