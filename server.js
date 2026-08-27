const express = require("express");
const cors = require("cors");
const mysql = require("mysql2");
require("dotenv").config();

const app = express();

app.use(cors());
app.use(express.json());
app.use(express.static(__dirname));


// ===============================
// MySQL Connection
// ===============================

const db = mysql.createConnection({
    host: process.env.DB_HOST,
    user: process.env.DB_USER,
    password: process.env.DB_PASSWORD,
    database: process.env.DB_NAME
});


// Connect to MySQL
db.connect((err) => {

    if (err) {
        console.log("MySQL connection failed:", err.message);
    } else {
        console.log("MySQL connected successfully");
    }

});


// ===============================
// Test Route
// ===============================

app.get("/", (req, res) => {
    res.sendFile(__dirname + "/index.html");
});


// ===============================
// GET - Get All Students
// ===============================

app.get("/students", (req, res) => {

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
// POST - Add Student
// ===============================

app.post("/students", (req, res) => {

    const { name, email, phone, course, age } = req.body;

    const sql = `
        INSERT INTO students (name, email, phone, course, age)
        VALUES (?, ?, ?, ?, ?)
    `;

    db.query(
        sql,
        [name, email, phone, course, age],
        (err, result) => {

            if (err) {

                // Duplicate name or email
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

    db.query(
        sql,
        [name, email, phone, course, age, id],
        (err, result) => {

            if (err) {

                // Duplicate name or email
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


// ===============================
// Start Server
// ===============================

app.listen(3000, () => {

    console.log("Server running on http://localhost:3000");

});