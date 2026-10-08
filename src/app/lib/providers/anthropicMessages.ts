type Turn = { role: 'user' | 'assistant' | 'system'; content: string };

export type AnthropicRequest = {
  model: string;
  max_tokens: number;
  stream: true;
  system?: string;
  messages: { role: 'user' | 'assistant'; content: string }[];
};

export function toAnthropicRequest(model: string, turns: Turn[], maxTokens = 8192): AnthropicRequest {
  const system = turns.filter(t => t.role === 'system' && t.content).map(t => t.content).join('\n\n');
  const messages: AnthropicRequest['messages'] = [];

  for (const turn of turns) {
    if (turn.role === 'system' || !turn.content) continue;
    const last = messages[messages.length - 1];
    if (last && last.role === turn.role) {
      last.content += `\n\n${turn.content}`;
    } else {
      messages.push({ role: turn.role, content: turn.content });
    }
  }

  return { model, max_tokens: maxTokens, stream: true, ...(system ? { system } : {}), messages };
}

export function parseAnthropicSse(buffer: string): { texts: string[]; rest: string; error: string | undefined } {
  const blocks = buffer.replace(/\r\n/g, '\n').split('\n\n');
  const rest = blocks.pop() ?? '';
  const texts: string[] = [];
  let error: string | undefined;

  for (const block of blocks) {
    const data = block
      .split('\n')
      .filter(line => line.startsWith('data:'))
      .map(line => line.slice(5).trim())
      .join('\n');
    if (!data || data === '[DONE]') continue;

    let event: any;
    try {
      event = JSON.parse(data);
    } catch {
      continue;
    }

    if (event.type === 'content_block_delta' && event.delta?.type === 'text_delta') {
      texts.push(event.delta.text);
    } else if (event.type === 'error') {
      error = event.error?.message ?? 'Unknown upstream error';
    }
  }

  return { texts, rest, error };
}
