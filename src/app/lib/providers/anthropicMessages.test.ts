// @vitest-environment node
import { describe, it, expect } from 'vitest';
import { toAnthropicRequest, parseAnthropicSse } from './anthropicMessages';

describe('toAnthropicRequest', () => {
  it('splits system messages out and keeps user/assistant turns', () => {
    const req = toAnthropicRequest('claude-opus-4-8', [
      { role: 'system', content: 'Be brief.' },
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'again' },
    ]);
    expect(req.model).toBe('claude-opus-4-8');
    expect(req.stream).toBe(true);
    expect(req.max_tokens).toBeGreaterThan(0);
    expect(req.system).toBe('Be brief.');
    expect(req.messages).toEqual([
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: 'hello' },
      { role: 'user', content: 'again' },
    ]);
  });

  it('omits system when there is none', () => {
    const req = toAnthropicRequest('m', [{ role: 'user', content: 'hi' }]);
    expect('system' in req).toBe(false);
  });

  it('merges consecutive same-role turns (Anthropic requires alternation)', () => {
    const req = toAnthropicRequest('m', [
      { role: 'user', content: 'a' },
      { role: 'user', content: 'b' },
    ]);
    expect(req.messages).toEqual([{ role: 'user', content: 'a\n\nb' }]);
  });

  it('drops empty turns such as a streaming placeholder', () => {
    const req = toAnthropicRequest('m', [
      { role: 'user', content: 'hi' },
      { role: 'assistant', content: '' },
    ]);
    expect(req.messages).toEqual([{ role: 'user', content: 'hi' }]);
  });
});

describe('parseAnthropicSse', () => {
  const delta = (t: string) => `event: content_block_delta\ndata: ${JSON.stringify({ type: 'content_block_delta', delta: { type: 'text_delta', text: t } })}\n\n`;

  it('extracts text deltas from complete events', () => {
    const buf = `event: message_start\ndata: {"type":"message_start"}\n\n${delta('Hel')}${delta('lo')}`;
    expect(parseAnthropicSse(buf)).toEqual({ texts: ['Hel', 'lo'], rest: '', error: undefined });
  });

  it('keeps an incomplete trailing event in rest for the next chunk', () => {
    const full = delta('Hello');
    const cut = full.slice(0, full.length - 6);
    const first = parseAnthropicSse(delta('A') + cut);
    expect(first.texts).toEqual(['A']);
    const second = parseAnthropicSse(first.rest + full.slice(cut.length));
    expect(second.texts).toEqual(['Hello']);
  });

  it('surfaces upstream error events', () => {
    const buf = `event: error\ndata: {"type":"error","error":{"message":"Error code: 403 - forbidden"}}\n\n`;
    expect(parseAnthropicSse(buf).error).toBe('Error code: 403 - forbidden');
  });

  it('ignores [DONE], pings and non-text deltas', () => {
    const buf = `event: ping\ndata: {"type":"ping"}\n\ndata: {"type":"content_block_delta","delta":{"type":"input_json_delta","partial_json":"{}"}}\n\ndata: [DONE]\n\n`;
    expect(parseAnthropicSse(buf)).toEqual({ texts: [], rest: '', error: undefined });
  });

  it('handles CRLF line endings', () => {
    const buf = delta('x').replace(/\n/g, '\r\n');
    expect(parseAnthropicSse(buf).texts).toEqual(['x']);
  });
});
