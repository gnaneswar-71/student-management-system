const express = require("express");
const StudentController = require("../controllers/studentController");
const { studentValidationMiddleware, validateIdParam } = require("../middleware/validator");

const router = express.Router();

// List students with optional search/filtering/pagination
router.get("/", StudentController.getStudents);

// Get a single student by ID
router.get("/:id", validateIdParam, StudentController.getStudentById);

// Create a new student
router.post("/", studentValidationMiddleware, StudentController.createStudent);

// Update a student
router.put("/:id", validateIdParam, studentValidationMiddleware, StudentController.updateStudent);

// Delete a student
router.delete("/:id", validateIdParam, StudentController.deleteStudent);

module.exports = router;