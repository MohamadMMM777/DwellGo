/**
 * Centralized API error helper — keeps response format consistent across all controllers.
 */

class ApiError extends Error {
    constructor(statusCode, message) {
        super(message);
        this.statusCode = statusCode;
    }
}

/**
 * Send a standardized error response.
 * @param {object} res - Express response object
 * @param {number} statusCode
 * @param {string} message
 */
const sendError = (res, statusCode, message) => {
    return res.status(statusCode).json({ error: message });
};

/**
 * Express global error handler middleware — attach at bottom of index.js.
 */
const globalErrorHandler = (err, req, res, next) => {
    const status = err.statusCode || 500;
    const message = err.message || 'Internal Server Error';
    console.error(`[ERROR] ${req.method} ${req.url} → ${status}: ${message}`);
    res.status(status).json({ error: message });
};

module.exports = { ApiError, sendError, globalErrorHandler };
