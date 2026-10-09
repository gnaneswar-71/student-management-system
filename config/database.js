const mysql = require("mysql2");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });

/**
 * Parse and validate MySQL configuration from environment variables
 */
const dbConfig = {
    host: process.env.DB_HOST || "localhost",
    port: parseInt(process.env.DB_PORT, 10) || 3306,
    user: process.env.DB_USER || "root",
    password: process.env.DB_PASSWORD || "",
    database: process.env.DB_NAME || "student_management",
    waitForConnections: true,
    connectionLimit: 10,
    queueLimit: 0,
    connectTimeout: 5000,
    // Enable SSL if explicitly requested or running on cloud providers
    ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
};

// Create the connection pool
const pool = mysql.createPool(dbConfig);

// Create promise-wrapped pool for modern async/await
const promisePool = pool.promise();

/**
 * Diagnostic helper to test database connectivity
 * @returns {Promise<{connected: boolean, message: string, details?: object}>}
 */
async function testConnection() {
    try {
        const [rows] = await promisePool.query("SELECT 1 AS health_check");
        return {
            connected: true,
            message: "Database connection healthy",
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database,
            details: rows[0]
        };
    } catch (err) {
        return {
            connected: false,
            message: err.message,
            code: err.code || "UNKNOWN_ERROR",
            host: dbConfig.host,
            port: dbConfig.port,
            database: dbConfig.database
        };
    }
}

module.exports = {
    pool,
    promisePool,
    dbConfig,
    testConnection
};
