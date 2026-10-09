/**
 * Database Initialization and Safe Schema Migration Utility
 * Run with: npm run init-db
 */

const path = require("path");
require("dotenv").config({ path: path.resolve(__dirname, "../.env") });
const mysql = require("mysql2/promise");

const host = process.env.DB_HOST || "localhost";
const port = parseInt(process.env.DB_PORT, 10) || 3306;
const user = process.env.DB_USER || "root";
const password = process.env.DB_PASSWORD || "";
const database = process.env.DB_NAME || "student_management";

const seedStudents = [
    {
        name: "Alex Johnson",
        email: "alex.johnson@example.com",
        phone: "+1 555-0142",
        course: "Computer Science",
        age: 21
    },
    {
        name: "Sophia Martinez",
        email: "sophia.martinez@example.com",
        phone: "+1 555-0188",
        course: "Data Science",
        age: 23
    },
    {
        name: "Liam Chen",
        email: "liam.chen@example.com",
        phone: "+1 555-0199",
        course: "Artificial Intelligence",
        age: 20
    },
    {
        name: "Emma Davis",
        email: "emma.davis@example.com",
        phone: "+1 555-0123",
        course: "Information Technology",
        age: 22
    },
    {
        name: "Noah Patel",
        email: "noah.patel@example.com",
        phone: "+1 555-0177",
        course: "Cybersecurity",
        age: 24
    }
];

async function initializeDatabase() {
    console.log("=================================================");
    console.log("  Studify — Database Initialization & Migration  ");
    console.log("=================================================");
    console.log(`Target: ${user}@${host}:${port}/${database}`);

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
    } catch (err) {
        console.error(`\n❌ Failed to connect to MySQL server at ${host}:${port}:`);
        console.error(`   ${err.message}`);
        console.log("\nPlease ensure MySQL is running (e.g. net start MySQL80) and credentials in .env are correct.");
        process.exit(1);
    }

    // Step 1: Create Database
    console.log(`\n[1/4] Ensuring database "${database}" exists...`);
    await serverConn.query(
        `CREATE DATABASE IF NOT EXISTS \`${database}\` CHARACTER SET utf8mb4 COLLATE utf8mb4_unicode_ci`
    );
    console.log(`      Database "${database}" is ready.`);
    await serverConn.end();

    // Step 2: Connect to the specific database
    console.log("\n[2/4] Connecting to database...");
    const dbConn = await mysql.createConnection({
        host,
        port,
        user,
        password,
        database,
        connectTimeout: 5000,
        ssl: process.env.DB_SSL === "true" ? { rejectUnauthorized: true } : undefined
    });

    // Step 3: Create or Migrate Table
    console.log("\n[3/4] Ensuring 'students' table exists with current schema...");
    await dbConn.query(`
        CREATE TABLE IF NOT EXISTS students (
            id INT AUTO_INCREMENT PRIMARY KEY,
            name VARCHAR(100) NOT NULL,
            email VARCHAR(100) NOT NULL UNIQUE,
            phone VARCHAR(20) NOT NULL,
            course VARCHAR(100) NOT NULL,
            age INT NOT NULL,
            created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
            updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP
        ) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci
    `);

    // Check existing columns for safe migration
    const [cols] = await dbConn.query("DESCRIBE students");
    const existingColumns = cols.map(c => c.Field);

    if (!existingColumns.includes("created_at")) {
        console.log("      Adding missing 'created_at' column...");
        await dbConn.query("ALTER TABLE students ADD COLUMN created_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP");
    }

    if (!existingColumns.includes("updated_at")) {
        console.log("      Adding missing 'updated_at' column...");
        await dbConn.query("ALTER TABLE students ADD COLUMN updated_at TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP");
    }

    // Check if name has an unnecessary UNIQUE key (drop it safely)
    const [indexes] = await dbConn.query("SHOW INDEX FROM students WHERE Column_name = 'name' AND Non_unique = 0");
    if (indexes.length > 0) {
        for (const idx of indexes) {
            console.log(`      Removing unintended UNIQUE constraint '${idx.Key_name}' on 'name'...`);
            try {
                await dbConn.query(`ALTER TABLE students DROP INDEX \`${idx.Key_name}\``);
            } catch (dropErr) {
                console.warn(`      Could not drop index: ${dropErr.message}`);
            }
        }
    }

    // Step 4: Seed Initial Data if table is empty
    console.log("\n[4/4] Checking records...");
    const [countRows] = await dbConn.query("SELECT COUNT(*) AS total FROM students");
    const total = countRows[0].total;

    if (total === 0) {
        console.log("      Table is empty. Inserting starter student records...");
        for (const student of seedStudents) {
            await dbConn.query(
                "INSERT INTO students (name, email, phone, course, age) VALUES (?, ?, ?, ?, ?)",
                [student.name, student.email, student.phone, student.course, student.age]
            );
        }
        console.log(`      Seeded ${seedStudents.length} sample students.`);
    } else {
        console.log(`      Found ${total} existing student record(s). Preserving existing data.`);
    }

    console.log("\n=================================================");
    console.log("🎉 Database initialization completed successfully!");
    console.log("=================================================");

    await dbConn.end();
}

initializeDatabase().catch((err) => {
    console.error("Initialization error:", err);
    process.exit(1);
});
