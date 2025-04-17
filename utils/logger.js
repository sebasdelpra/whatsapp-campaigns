const { format } = require('date-fns');

const logger = {
  info: (message, ...args) => {
    console.log(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] INFO: ${message}`, ...args);
  },
  error: (message, ...args) => {
    console.error(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] ERROR: ${message}`, ...args);
  },
  warn: (message, ...args) => {
    console.warn(`[${format(new Date(), 'yyyy-MM-dd HH:mm:ss')}] WARN: ${message}`, ...args);
  }
};

module.exports = logger;