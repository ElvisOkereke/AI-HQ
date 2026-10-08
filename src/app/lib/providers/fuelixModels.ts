export type FuelixModelInfo = {
  id: string;
  name: string;
  category: 'text' | 'reasoning';
  description: string;
};

// Not conversational: embeddings, speech, and image generation.
const NON_CHAT = /(embedding|tts|whisper|transcribe|dall-e|imagen|image)/i;

// Listed by FuelIX's /models but unusable for chat: codex is responses-API only,
// the rest were denied (403/401) or retired (404) for the app's API key.
const UNUSABLE_PATTERNS = [/codex/i];
const UNUSABLE_IDS = new Set([
  'claude-3-5-haiku',
  'claude-3-5-haiku-20241022',
  'claude-3-7-sonnet',
  'claude-3-7-sonnet-20250219',
  'cursor-c-3-7-sonnet',
  'claude-sonnet-4-legacy',
  'claude-opus',
  'claude-opus-5',
  'claude-opus-5-5',
  'llama-3.2-90b',
  'mistral-large-24.11',
  'translategemma-27b',
  'wasikan-llama-3-3-70b',
  'luminate-np-gpt-5.4-nano',
  'luminate-gemma-4-saif',
]);

export function isUsableChatModel(id: string): boolean {
  if (!id || NON_CHAT.test(id)) return false;
  if (UNUSABLE_IDS.has(id)) return false;
  return !UNUSABLE_PATTERNS.some(p => p.test(id));
}

const ACRONYMS: Record<string, string> = { gpt: 'GPT', oss: 'OSS' };

export function formatModelName(id: string): string {
  if (!id) return '';

  let base = id;
  let date = '';
  const dashed = base.match(/-(\d{4})-(\d{2})-(\d{2})$/);
  const compact = base.match(/-(\d{4})(\d{2})(\d{2})$/);
  const m = dashed || compact;
  if (m) {
    date = ` (${m[1]}-${m[2]}-${m[3]})`;
    base = base.slice(0, base.length - m[0].length);
  }

  const parts: string[] = [];
  for (const token of base.split('-')) {
    const prev = parts[parts.length - 1];
    if (/^\d{1,2}$/.test(token) && prev && /^\d{1,2}$/.test(prev)) {
      parts[parts.length - 1] = `${prev}.${token}`;
    } else {
      parts.push(token);
    }
  }

  const words = parts.map(token => {
    if (ACRONYMS[token]) return ACRONYMS[token];
    if (/^(\d+|[a-z]\d+)b$/.test(token)) return token.toUpperCase();
    return token.charAt(0).toUpperCase() + token.slice(1);
  });

  return words.join(' ') + date;
}

export function buildFuelixModelList(ids: string[]): FuelixModelInfo[] {
  const seen = new Set<string>();
  const models: FuelixModelInfo[] = [];

  for (const id of ids) {
    if (seen.has(id) || !isUsableChatModel(id)) continue;
    seen.add(id);
    const name = formatModelName(id);
    models.push({
      id,
      name,
      category: /^o\d/.test(id) ? 'reasoning' : 'text',
      description: `${name} via FuelIX`,
    });
  }

  return models.sort((a, b) => a.name.localeCompare(b.name));
}

export function isMessagesOnlyError(error: unknown): boolean {
  const message = typeof error === 'string' ? error : error instanceof Error ? error.message : '';
  return /\/v1\/messages endpoint/i.test(message);
}
