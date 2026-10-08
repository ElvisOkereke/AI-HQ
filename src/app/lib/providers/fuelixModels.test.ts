// @vitest-environment node
import { describe, it, expect } from 'vitest';
import {
  isUsableChatModel,
  formatModelName,
  buildFuelixModelList,
  isMessagesOnlyError,
} from './fuelixModels';

describe('isUsableChatModel', () => {
  it('accepts normal chat models', () => {
    for (const id of ['gpt-5-mini', 'claude-sonnet-5', 'gemini-3.6-flash', 'o4-mini', 'gpt-oss-20b', 'claude-opus-4-8']) {
      expect(isUsableChatModel(id), id).toBe(true);
    }
  });

  it('rejects embedding, audio, and image-generation models', () => {
    for (const id of [
      'text-embedding-3-large',
      'text-embedding-ada-002',
      'tts-1',
      'tts-1-hd',
      'whisper-1',
      'gpt-4o-transcribe',
      'dall-e-3',
      'imagen-4',
      'imagen-3-fast',
      'gemini-3.1-flash-image',
    ]) {
      expect(isUsableChatModel(id), id).toBe(false);
    }
  });

  it('rejects responses-only codex models', () => {
    expect(isUsableChatModel('gpt-5.3-codex')).toBe(false);
    expect(isUsableChatModel('gpt-5.3-codex-2026-02-24')).toBe(false);
  });

  it('rejects models known to be denied or retired for the app key', () => {
    for (const id of ['claude-3-7-sonnet', 'claude-3-5-haiku', 'llama-3.2-90b', 'translategemma-27b', 'claude-opus-5', 'claude-sonnet-4-legacy']) {
      expect(isUsableChatModel(id), id).toBe(false);
    }
  });
});

describe('formatModelName', () => {
  it('formats common ids into readable names', () => {
    expect(formatModelName('gpt-5-mini')).toBe('GPT 5 Mini');
    expect(formatModelName('claude-sonnet-5')).toBe('Claude Sonnet 5');
    expect(formatModelName('gemini-3.5-flash-lite')).toBe('Gemini 3.5 Flash Lite');
    expect(formatModelName('gpt-oss-20b')).toBe('GPT OSS 20B');
  });

  it('joins adjacent version digits with a dot', () => {
    expect(formatModelName('claude-sonnet-4-5')).toBe('Claude Sonnet 4.5');
    expect(formatModelName('claude-opus-4-8')).toBe('Claude Opus 4.8');
  });

  it('keeps dated snapshots distinguishable', () => {
    expect(formatModelName('claude-sonnet-4-5-20250929')).toBe('Claude Sonnet 4.5 (2025-09-29)');
    expect(formatModelName('gpt-5-2025-08-07')).toBe('GPT 5 (2025-08-07)');
  });

  it('falls back to the raw id for odd input', () => {
    expect(formatModelName('')).toBe('');
  });
});

describe('buildFuelixModelList', () => {
  const ids = [
    'gpt-5-mini',
    'text-embedding-3-small',
    'claude-opus-4-8',
    'gpt-5-mini', // duplicate
    'gpt-5.3-codex',
    'o4-mini',
    'whisper-1',
  ];

  it('keeps only usable chat models, deduplicated', () => {
    expect(buildFuelixModelList(ids).map(m => m.id).sort()).toEqual(['claude-opus-4-8', 'gpt-5-mini', 'o4-mini']);
  });

  it('assigns a readable name, category and description', () => {
    const byId = Object.fromEntries(buildFuelixModelList(ids).map(m => [m.id, m]));
    expect(byId['gpt-5-mini'].name).toBe('GPT 5 Mini');
    expect(byId['gpt-5-mini'].category).toBe('text');
    expect(byId['o4-mini'].category).toBe('reasoning');
    expect(byId['gpt-5-mini'].description).toMatch(/FuelIX/);
  });

  it('returns plain serializable data (no functions / components)', () => {
    const list = buildFuelixModelList(ids);
    expect(JSON.parse(JSON.stringify(list))).toEqual(list);
  });

  it('is sorted by name so the dropdown order is stable', () => {
    const names = buildFuelixModelList(ids).map(m => m.name);
    expect(names).toEqual([...names].sort((a, b) => a.localeCompare(b)));
  });
});

describe('isMessagesOnlyError', () => {
  it('detects the FuelIX premium-model error', () => {
    const msg = "400 Model 'claude-opus-4-8' is only available via the /v1/messages endpoint, not '/v1/chat/completions'.";
    expect(isMessagesOnlyError(new Error(msg))).toBe(true);
    expect(isMessagesOnlyError(msg)).toBe(true);
  });

  it('ignores unrelated errors', () => {
    expect(isMessagesOnlyError(new Error('403 Authorization failed for model'))).toBe(false);
    expect(isMessagesOnlyError(undefined)).toBe(false);
  });
});
