const pino = require('pino');
const prettyStream = require('./prettystream');

const logger = pino(prettyStream);

module.exports.logger = logger;