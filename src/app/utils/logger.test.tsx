import { describe, it, expect, vi, beforeEach, afterEach } from 'vitest';
import { logger } from './logger';

describe('logger', () => {
  let logSpy: ReturnType<typeof vi.spyOn>;
  let errorSpy: ReturnType<typeof vi.spyOn>;
  let warnSpy: ReturnType<typeof vi.spyOn>;

  beforeEach(() => {
    logSpy = vi.spyOn(console, 'log').mockImplementation(() => {});
    errorSpy = vi.spyOn(console, 'error').mockImplementation(() => {});
    warnSpy = vi.spyOn(console, 'warn').mockImplementation(() => {});
    logger.toggle(false);
    logSpy.mockClear();
  });

  afterEach(() => {
    logSpy.mockRestore();
    errorSpy.mockRestore();
    warnSpy.mockRestore();
  });

  it('starts disabled and suppresses log output', () => {
    expect(logger.isEnabled()).toBe(false);
    logger.log('hello');
    logger.chat('hi');
    logger.error('boom');
    expect(logSpy).not.toHaveBeenCalled();
    expect(errorSpy).not.toHaveBeenCalled();
  });

  it('toggle(true) enables output for category methods', () => {
    logger.toggle(true);
    logSpy.mockClear();

    logger.chat('message sent');
    logger.db('query ran');
    logger.auth('signed in');

    expect(logSpy).toHaveBeenCalledWith('💬 [CHAT]', 'message sent');
    expect(logSpy).toHaveBeenCalledWith('🗄️ [DB]', 'query ran');
    expect(logSpy).toHaveBeenCalledWith('🔐 [AUTH]', 'signed in');
  });

  it('toggle() with no args flips current state', () => {
    logger.toggle(false);
    const result = logger.toggle();
    expect(result).toBe(true);
    expect(logger.isEnabled()).toBe(true);
  });

  it('error() respects the toggle like other categories', () => {
    logger.toggle(true);
    errorSpy.mockClear();
    logger.error('something broke');
    expect(errorSpy).toHaveBeenCalledWith('❌', 'something broke');

    logger.toggle(false);
    errorSpy.mockClear();
    logger.error('quiet now');
    expect(errorSpy).not.toHaveBeenCalled();
  });
});
