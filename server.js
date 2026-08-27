const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// MySQL Connection Pool
// ===============================
// A POOL (not a single createConnection) is required here because
// this file runs as a serverless function on Vercel: each cold
// start / invocation can spin up a fresh instance, and a pool
// handles reconnecting automatically instead of failing on a
// stale single connection.
//
// These values MUST come from an external MySQL host (Vercel does
// not provide a database). Set them in:
// Vercel Dashboard -> Project -> Settings -> Environment Variables

const pool = mysql.createPool({
    host: process.env.DB_HOST,
    port: process.env.DB_PORT || 3306,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME,
    waitForConnections: true,
    connectionLimit: 5,
    queueLimit: 0
});


// ===============================
// GET - Get All Students
// ===============================

app.get("/students", (req, res) => {

    const sql = "SELECT * FROM students";

    pool.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);

    });

});


// ===============================
// POST - Add Student
// ===============================

app.post("/students", (req, res) => {

    const { name, email, phone, course, age } = req.body;

    const sql = `
        INSERT INTO students (name, email, phone, course, age)
        VALUES (?, ?, ?, ?, ?)
    `;

    pool.query(
        sql,
        [name, email, phone, course, age],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message: "Name or Email already exists"
                    });

                }

                return res.status(500).json({
                    message: err.message
                });

            }

            res.status(201).json({
                message: "Student added successfully",
                id: result.insertId
            });

        }
    );

});


// ===============================
// PUT - Update Student
// ===============================

app.put("/students/:id", (req, res) => {

    const { id } = req.params;

    const { name, email, phone, course, age } = req.body;

    const sql = `
        UPDATE students
        SET name = ?, email = ?, phone = ?, course = ?, age = ?
        WHERE id = ?
    `;

    pool.query(
        sql,
        [name, email, phone, course, age, id],
        (err, result) => {

            if (err) {

                if (err.code === "ER_DUP_ENTRY") {

                    return res.status(400).json({
                        message: "Name or Email already exists"
                    });

                }

                return res.status(500).json({
                    message: err.message
                });

            }

            if (result.affectedRows === 0) {

                return res.status(404).json({
                    message: "Student not found"
                });

            }

            res.json({
                message: "Student updated successfully"
            });

        }
    );

});


// ===============================
// DELETE - Delete Student
// ===============================

app.delete("/students/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM students WHERE id = ?";

    pool.query(sql, [id], (err, result) => {

        if (err) {

            return res.status(500).json({
                error: err.message
            });

        }

        if (result.affectedRows === 0) {

            return res.status(404).json({
                message: "Student not found"
            });

        }

        res.json({
            message: "Student deleted successfully"
        });

    });

});


// ===============================
// Export for Vercel / run locally
// ===============================
// On Vercel this file is loaded as a serverless function — Vercel
// itself calls the exported "app" on each request, so app.listen()
// must NOT run there. Running "node backend/server.js" locally
// still works normally for testing.

if (require.main === module) {

    const PORT = process.env.PORT || 3000;

    app.listen(PORT, () => {
        console.log(`Server running locally on port ${PORT}`);
    });

}

module.exports = app;