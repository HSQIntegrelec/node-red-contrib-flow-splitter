const { logger } = require('./logger');

function throwNodeError(msg) {
  logger.fatal(`Unexpected exception happened : ${msg}`)
  throw new Error(msg);
}

module.exports = {
  throwNodeError,
}