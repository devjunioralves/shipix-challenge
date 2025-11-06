import path from 'path';
import winston from 'winston';

const { combine, timestamp, printf, colorize, errors } = winston.format;

const logFormat = printf(({ level, message, timestamp: ts, stack, ...metadata }) => {
  let msg = `${String(ts)} [${String(level)}]: ${String(message)}`;

  if (stack) {
    msg += `\n${String(stack)}`;
  }

  if (Object.keys(metadata).length > 0) {
    msg += `\n${JSON.stringify(metadata, null, 2)}`;
  }

  return msg;
});

const logLevel = process.env.LOG_LEVEL || 'info';

const logDir = process.env.LOG_FILE_PATH || './logs';

const logger = winston.createLogger({
  level: logLevel,
  format: combine(errors({ stack: true }), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
  transports: [
    new winston.transports.Console({
      format: combine(colorize(), timestamp({ format: 'YYYY-MM-DD HH:mm:ss' }), logFormat),
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'error.log'),
      level: 'error',
      maxsize: 10485760, // 10MB
      maxFiles: 5,
    }),

    new winston.transports.File({
      filename: path.join(logDir, 'combined.log'),
      maxsize: 10485760, // 10MB
      maxFiles: 10,
    }),
  ],
  exitOnError: false,
});

logger.exceptions.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'exceptions.log'),
    maxsize: 10485760,
    maxFiles: 3,
  })
);

logger.rejections.handle(
  new winston.transports.File({
    filename: path.join(logDir, 'rejections.log'),
    maxsize: 10485760,
    maxFiles: 3,
  })
);

export const log = {
  info: (message: string, meta?: Record<string, unknown>): void => {
    logger.info(message, meta);
  },

  warn: (message: string, meta?: Record<string, unknown>): void => {
    logger.warn(message, meta);
  },

  error: (message: string, error?: Error, meta?: Record<string, unknown>): void => {
    if (error instanceof Error) {
      logger.error(message, { ...meta, error: error.message, stack: error.stack });
    } else if (error) {
      logger.error(message, { ...meta, error: String(error) });
    } else {
      logger.error(message, meta);
    }
  },

  debug: (message: string, meta?: Record<string, unknown>): void => {
    logger.debug(message, meta);
  },

  http: (message: string, meta?: Record<string, unknown>): void => {
    logger.http(message, meta);
  },
};

export { logger };

export default log;
