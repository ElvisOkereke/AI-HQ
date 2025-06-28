'use client';

// Global logging configuration
let LOGGING_ENABLED = false;

export const logger = {
  // Toggle logging on/off
  toggle: (enabled?: boolean) => {
    LOGGING_ENABLED = enabled !== undefined ? enabled : !LOGGING_ENABLED;
    console.log(`🔧 Logging ${LOGGING_ENABLED ? 'ENABLED' : 'DISABLED'}`);
    return LOGGING_ENABLED;
  },

  // Check if logging is enabled
  isEnabled: () => LOGGING_ENABLED,

  // Log methods that respect the toggle
  log: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.log('📝', ...args);
    }
  },

  info: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.info('ℹ️', ...args);
    }
  },

  warn: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.warn('⚠️', ...args);
    }
  },

  error: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.error('❌', ...args);
    }
  },

  debug: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.debug('🐛', ...args);
    }
  },

  // Logging for specific areas
  db: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.log('🗄️ [DB]', ...args);
    }
  },

  ai: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.log('🤖 [AI]', ...args);
    }
  },

  auth: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.log('🔐 [AUTH]', ...args);
    }
  },

  chat: (...args: any[]) => {
    if (LOGGING_ENABLED) {
      console.log('💬 [CHAT]', ...args);
    }
  }
};

// Initialize logging as disabled
logger.toggle(false);

// Make logger available globally for dev console access
if (typeof window !== 'undefined') {
  (window as any).logger = logger;
}
