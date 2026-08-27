const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");

const app = express();

app.use(cors());
app.use(express.json());


// ===============================
// MySQL Connection
// ===============================

const db = mysql.createConnection({
    host: process.env.DB_HOST || process.env.MYSQLHOST,
    port: process.env.DB_PORT || process.env.MYSQLPORT || 3306,
    user: process.env.DB_USER || process.env.MYSQLUSER,
    password: process.env.DB_PASSWORD || process.env.MYSQLPASSWORD,
    database: process.env.DB_NAME || process.env.MYSQLDATABASE
});


// ===============================
// Connect MySQL
// ===============================

db.connect((err) => {
    if (err) {
        console.log("MySQL connection failed:", err.message);
    } else {
        console.log("MySQL connected successfully");
    }
});


// ===============================
// Test API
// ===============================

app.get("/api", (req, res) => {
    res.send("Student Management System Backend Running");
});


// ===============================
// GET Students
// ===============================

app.get("/api/students", (req, res) => {

    const sql = "SELECT * FROM students";

    db.query(sql, (err, result) => {

        if (err) {
            return res.status(500).json({
                error: err.message
            });
        }

        res.json(result);
    });
});


// ===============================
// ADD Student
// ===============================

app.post("/api/students", (req, res) => {

    const { name, email, phone, course, age } = req.body;

    const sql = `
        INSERT INTO students
        (name, email, phone, course, age)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
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
// UPDATE Student
// ===============================

app.put("/api/students/:id", (req, res) => {

    const { id } = req.params;

    const { name, email, phone, course, age } = req.body;

    const sql = `
        UPDATE students
        SET name = ?, email = ?, phone = ?, course = ?, age = ?
        WHERE id = ?
    `;

    db.query(
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
// DELETE Student
// ===============================

app.delete("/api/students/:id", (req, res) => {

    const { id } = req.params;

    const sql = "DELETE FROM students WHERE id = ?";

    db.query(sql, [id], (err, result) => {

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


module.exports = app;