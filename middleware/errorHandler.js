/**
 * Centralized error handler and 404 middleware
 */

/**
 * Handle 404 Not Found for unmapped routes
 */
function notFoundHandler(req, res) {
    if (req.accepts("html") && !req.path.startsWith("/api/")) {
        return res.status(404).sendFile(require("path").join(__dirname, "../public/index.html"));
    }

    res.status(404).json({
        success: false,
        message: `Route not found: ${req.method} ${req.originalUrl}`
    });
}

/**
 * Centralized application error handling middleware
 */
function errorHandler(err, req, res, next) {
    // Log server-side diagnostic info
    console.error(`[Error] ${req.method} ${req.originalUrl}:`, err.message);

    // Handle Malformed JSON request body
    if (err instanceof SyntaxError && err.status === 400 && "body" in err) {
        return res.status(400).json({
            success: false,
            message: "Malformed JSON payload in request body."
        });
    }

    // Handle MySQL Duplicate Entry error
    if (err.code === "ER_DUP_ENTRY") {
        return res.status(409).json({
            success: false,
            message: "A student with this email address already exists."
        });
    }

    // Handle MySQL Connection Refused
    if (err.code === "ECONNREFUSED" || err.code === "ENOTFOUND" || err.code === "ETIMEDOUT") {
        return res.status(503).json({
            success: false,
            message: "Database service unavailable. Please verify MySQL service is running."
        });
    }

    // Handle MySQL Authentication failure
    if (err.code === "ER_ACCESS_DENIED_ERROR") {
        return res.status(500).json({
            success: false,
            message: "Database authentication failure. Please check database credentials."
        });
    }

    // Default 500 error response (safe, no stack trace)
    const statusCode = err.statusCode || 500;
    res.status(statusCode).json({
        success: false,
        message: err.clientMessage || "An unexpected internal server error occurred."
    });
}

module.exports = {
    notFoundHandler,
    errorHandler
};
