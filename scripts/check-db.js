/**
 * Standalone Database Diagnostic Utility
 * Run with: npm run check-db
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");
const net = require("net");

const host = process.env.DB_HOST || "localhost";
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "";
const database = process.env.DB_NAME || "student_management";

async function checkTcpPort(host, port, timeout = 3000) {
    return new Promise((resolve) => {
        const socket = new net.Socket();
        socket.setTimeout(timeout);

        socket.on("connect", () => {
            socket.destroy();
            resolve({ open: true });
        });

        socket.on("timeout", () => {
            socket.destroy();
            resolve({ open: false, error: "Connection timed out" });
        });

        socket.on("error", (err) => {
            socket.destroy();
            resolve({ open: false, error: err.code || err.message });
        });

        socket.connect(port, host);
    });
}

async function runCheck() {
    console.log("=================================================");
    console.log("  Studify — MySQL Database Diagnostic Check     ");
    console.log("=================================================");
    console.log(`Target Host:     ${host}`);
    console.log(`Target Port:     ${port}`);
    console.log(`Database User:   ${user}`);
    console.log(`Database Name:   ${database}`);
    console.log(`Password Set:    ${password ? "Yes (hidden)" : "No (empty)"}`);
    console.log("-------------------------------------------------");

    // 1. TCP Port Check
    process.stdout.write("[1/4] Checking TCP connection to host/port... ");
    const tcp = await checkTcpPort(host, port);
    if (!tcp.open) {
        console.log("FAILED ❌");
        console.error(`\n⚠️  Cannot reach MySQL server at ${host}:${port} (${tcp.error}).`);
        console.log("\nPossible causes & solutions:");
        console.log("  1. The MySQL service is stopped.");
        console.log("     👉 In Windows: Open PowerShell / CMD as Administrator and run:");
        console.log("        net start MySQL80");
        console.log("        (or Start-Service MySQL80)");
        console.log("     👉 Or press Win+R -> type 'services.msc' -> find 'MySQL80' -> click Start.");
        console.log("  2. MySQL is listening on another port (e.g. 3307). Check your MySQL installation.");
        console.log("  3. Check that DB_HOST and DB_PORT in your .env file are correct.");
        process.exit(1);
    }
    console.log("OK ✅");

    // 2. MySQL Authentication Check (Connect to Server)
    process.stdout.write("[2/4] Testing MySQL authentication... ");
    let serverConn;
    try {
        serverConn = await mysql.createConnection({
            host,
            port,
            user,
            password,
            connectTimeout: 5000,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
        });
        console.log("OK ✅");
    } catch (err) {
        console.log("FAILED ❌");
        console.error(`\n⚠️  Authentication failed: ${err.message} (${err.code})`);
        if (err.code === "ER_ACCESS_DENIED_ERROR") {
            console.log("\nSolution:");
            console.log("  Verify the DB_USER and DB_PASSWORD values in your .env file.");
            console.log("  Ensure that the MySQL user has privileges to log in from this host.");
        }
        process.exit(1);
    }

    // 3. Database Existence Check
    process.stdout.write(`[3/4] Checking database "${database}"... `);
    try {
        const [dbs] = await serverConn.query("SHOW DATABASES LIKE ?", [database]);
        if (dbs.length === 0) {
            console.log("NOT FOUND ⚠️");
            console.log(`\nDatabase "${database}" does not exist yet.`);
            console.log("Run the following command to initialize it:");
            console.log("  npm run init-db");
            await serverConn.end();
            process.exit(1);
        }
        console.log("EXISTS ✅");
    } catch (err) {
        console.log("ERROR ❌");
        console.error(err.message);
        await serverConn.end();
        process.exit(1);
    }

    await serverConn.end();

    // 4. Schema & Table Verification
    process.stdout.write("[4/4] Verifying 'students' table and schema... ");
    let dbConn;
    try {
        dbConn = await mysql.createConnection({
            host,
            port,
            user,
            password,
            database,
            connectTimeout: 5000,
            ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
        });

        const [tables] = await dbConn.query("SHOW TABLES LIKE 'students'");
        if (tables.length === 0) {
            console.log("TABLE MISSING ⚠️");
            console.log("\nTable 'students' does not exist yet.");
            console.log("Run: npm run init-db");
            await dbConn.end();
            process.exit(1);
        }

        const [columns] = await dbConn.query("DESCRIBE students");
        const colNames = columns.map(c => c.Field);
        const [counts] = await dbConn.query("SELECT COUNT(*) AS total FROM students");

        console.log("READY ✅");
        console.log("-------------------------------------------------");
        console.log(`Table:           students`);
        console.log(`Columns:         ${colNames.join(", ")}`);
        console.log(`Total Records:   ${counts[0].total}`);
        console.log("=================================================");
        console.log("🎉 Database is fully operational and connected!");
        console.log("=================================================");

        await dbConn.end();
        process.exit(0);
    } catch (err) {
        console.log("FAILED ❌");
        console.error(`\n⚠️  Database error: ${err.message}`);
        if (dbConn) await dbConn.end();
        process.exit(1);
    }
}

runCheck().catch((err) => {
    console.error("Diagnostic script error:", err);
    process.exit(1);
});
