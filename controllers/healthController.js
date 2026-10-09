const { testConnection } = require("../config/database");

/**
 * Controller for application and database health checks
 */
const HealthController = {
    /**
     * GET /api/health
     * Returns application status and true database connectivity report
     */
    async checkHealth(req, res) {
        const uptimeSeconds = Math.floor(process.uptime());
        const dbStatus = await testConnection();

        const responsePayload = {
            status: dbStatus.connected ? "healthy" : "degraded",
            timestamp: new Date().toISOString(),
            uptime: `${uptimeSeconds}s`,
            database: {
                connected: dbStatus.connected,
                message: dbStatus.connected ? "Connected to MySQL successfully" : dbStatus.message,
                host: dbStatus.host,
                port: dbStatus.port,
                name: dbStatus.database
            },
            environment: process.env.NODE_ENV || "development"
        };

        // If DB is not connected, return 503 Service Unavailable so health monitors detect it
        const httpStatus = dbStatus.connected ? 200 : 503;
        res.status(httpStatus).json(responsePayload);
    }
};

module.exports = HealthController;
