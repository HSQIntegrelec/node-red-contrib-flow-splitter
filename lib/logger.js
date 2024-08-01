const pino = require('pino');
const prettyStream = require('./prettystream');

const baseLogger = pino(prettyStream);

// Extend the base logger with a custom critical method
const logger = Object.create(baseLogger);

logger.critical = (msg) => {
  baseLogger.error(msg);
  throw new Error(msg);
};

module.exports.logger = logger;