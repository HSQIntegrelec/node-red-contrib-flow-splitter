const pretty = require('pino-pretty');

const prettyStream = pretty({
  translateTime: true,
  ignore: 'pid,hostname',
  messageFormat: (log, messageKey) => `[node-red-contrib-flow-splitter] ${log[messageKey]}`
});

module.exports = prettyStream;