// utils/logger.js

const winston = require('winston'); // Import winston for logging

// Configure the logger
const logger = winston.createLogger({
    level: 'info', // Set the default log level
    format: winston.format.json(), // Log format
    transports: [
        new winston.transports.Console(), // Log to console
        new winston.transports.File({ filename: 'error.log', level: 'error' }), // Log errors to a file
        new winston.transports.File({ filename: 'combined.log' }) // Log all messages to a file
    ]
});

// Export the logger
module.exports = logger;
