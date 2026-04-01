const LOG_LEVELS = { debug: 0, info: 1, warn: 2, error: 3 };
const CURRENT_LEVEL = process.env.NODE_ENV === 'production' ? 1 : 0;

function formatMsg(level, module, msg, data) {
    const ts = new Date().toISOString();
    return `[${ts}] [${level.toUpperCase()}] [${module}] ${msg}${data ? ' ' + JSON.stringify(data) : ''}`;
}

function log(level, module, msg, data) {
    if (LOG_LEVELS[level] < CURRENT_LEVEL) return;
    const formatted = formatMsg(level, module, msg, data);
    switch (level) {
        case 'debug': console.debug(formatted); break;
        case 'info': console.info(formatted); break;
        case 'warn': console.warn(formatted); break;
        case 'error': console.error(formatted); break;
    }
}

export const createLogger = (module) => ({
    debug: (msg, data) => log('debug', module, msg, data),
    info: (msg, data) => log('info', module, msg, data),
    warn: (msg, data) => log('warn', module, msg, data),
    error: (msg, data) => log('error', module, msg, data),
});

// Usage in any component:
// import { createLogger } from '../utils/logger';
// const logger = createLogger('Students');
// logger.info('Student created', { id, admission_number });
