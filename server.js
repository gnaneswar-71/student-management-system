const express = require("express");
const cors = require("cors");
const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, ".env") });

const { pool, testConnection } = require("./config/database");
const studentRoutes = require("./routes/studentRoutes");
const dashboardRoutes = require("./routes/dashboardRoutes");
const healthRoutes = require("./routes/healthRoutes");
const { notFoundHandler, errorHandler } = require("./middleware/errorHandler");

const app = express();

// ======================================
// 1. GLOBAL MIDDLEWARES
// ======================================
app.use(cors());
app.use(express.json({ limit: "100kb" }));
app.use(express.urlencoded({ extended: true, limit: "100kb" }));

// Serve frontend static assets from public/
app.use(express.static(path.join(__dirname, "public")));

// ======================================
// 2. ROOT & STATIC ROUTING
// ======================================
app.get("/", (req, res) => {
    res.sendFile(path.join(__dirname, "public", "index.html"));
});

// ======================================
// 3. REST API ENDPOINTS
// ======================================
// Health Check: /api/health
app.use("/api/health", healthRoutes);

// Dashboard Analytics: /api/dashboard/stats
app.use("/api/dashboard", dashboardRoutes);

// Students CRUD: /api/students
app.use("/api/students", studentRoutes);

// Backward-compatibility alias: /students
app.use("/students", studentRoutes);

// ======================================
// 4. ERROR HANDLING MIDDLEWARE
// ======================================
// 404 Not Found
app.use(notFoundHandler);

// Centralized error handler
app.use(errorHandler);

// ======================================
// 5. SERVER STARTUP & GRACEFUL SHUTDOWN
// ======================================
const PORT = parseInt(process.env.PORT, 10) || 3000;

if (require.main === module) {
    const server = app.listen(PORT, async () => {
        console.log("==================================================");
        console.log(`🚀 Studify Server running on http://localhost:${PORT}`);
        console.log(`🌐 Dashboard UI:      http://localhost:${PORT}`);
        console.log(`🩺 Health Endpoint:   http://localhost:${PORT}/api/health`);
        console.log(`👥 Students API:      http://localhost:${PORT}/api/students`);
        console.log(`📊 Stats API:         http://localhost:${PORT}/api/dashboard/stats`);
        console.log("==================================================");

        // Run non-blocking database connection check on startup
        const dbHealth = await testConnection();
        if (dbHealth.connected) {
            console.log(`✅ Connected to MySQL database "${dbHealth.database}" at ${dbHealth.host}:${dbHealth.port}`);
        } else {
            console.warn(`⚠️  MySQL connection warning: ${dbHealth.message}`);
            console.warn("   Run 'npm run check-db' for interactive diagnostics.");
        }
    });

    // Graceful shutdown
    function shutdown(signal) {
        console.log(`\nReceived ${signal}. Shutting down gracefully...`);
        server.close(() => {
            console.log("HTTP server closed.");
            pool.end((err) => {
                if (err) console.error("Error closing MySQL pool:", err.message);
                else console.log("MySQL connection pool closed.");
                process.exit(0);
            });
        });

        // Force close if graceful fails within 5s
        setTimeout(() => {
            console.error("Forcing shutdown after timeout.");
            process.exit(1);
        }, 5000).unref();
    }

    process.on("SIGINT", () => shutdown("SIGINT"));
    process.on("SIGTERM", () => shutdown("SIGTERM"));
}

// Export app for Vercel serverless and supertest integration
module.exports = app;