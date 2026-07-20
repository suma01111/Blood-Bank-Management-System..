const levels = ['debug', 'info', 'warn', 'error'];

function formatMeta(meta) {
  if (!meta || !Object.keys(meta).length) return '';
  return ` ${JSON.stringify(meta)}`;
}

function write(level, message, meta = {}) {
  if (!levels.includes(level)) level = 'info';
  const line = `[${new Date().toISOString()}] [${level.toUpperCase()}] ${message}${formatMeta(meta)}`;
  if (level === 'error') console.error(line);
  else if (level === 'warn') console.warn(line);
  else console.log(line);
}

export const logger = {
  debug: (message, meta) => write('debug', message, meta),
  info: (message, meta) => write('info', message, meta),
  warn: (message, meta) => write('warn', message, meta),
  error: (message, meta) => write('error', message, meta),
  requestError(req, error, context = '') {
    this.error(context || 'Request failed', {
      method: req.method,
      path: req.originalUrl,
      origin: req.headers.origin || null,
      ip: req.ip,
      message: error.message,
      name: error.name,
      code: error.code,
      stack: error.stack
    });
  }
};
