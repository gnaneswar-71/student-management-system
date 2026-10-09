const StudentModel = require("../models/studentModel");

/**
 * Controller for student CRUD endpoints
 */
const StudentController = {
    /**
     * GET /api/students
     * Fetch all students with optional search, sorting, and pagination
     */
    async getStudents(req, res, next) {
        try {
            const { search, course, sort, order, page, limit } = req.query;

            let parsedLimit = undefined;
            let parsedOffset = undefined;

            if (limit && Number.isInteger(Number(limit)) && Number(limit) > 0) {
                parsedLimit = Math.min(Number(limit), 100); // max 100 per page
                const parsedPage = (page && Number.isInteger(Number(page)) && Number(page) > 0) ? Number(page) : 1;
                parsedOffset = (parsedPage - 1) * parsedLimit;
            }

            const students = await StudentModel.getAll({
                search,
                course,
                sort,
                order,
                limit: parsedLimit,
                offset: parsedOffset
            });

            // Return students array (ensures full backwards-compatibility)
            res.status(200).json(students);
        } catch (err) {
            next(err);
        }
    },

    /**
     * GET /api/students/:id
     * Fetch single student by ID
     */
    async getStudentById(req, res, next) {
        try {
            const id = req.parsedId;
            const student = await StudentModel.getById(id);

            if (!student) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            res.status(200).json(student);
        } catch (err) {
            next(err);
        }
    },

    /**
     * POST /api/students
     * Create a new student record
     */
    async createStudent(req, res, next) {
        try {
            const normalized = req.normalizedBody;

            // Check for duplicate email before insert
            const existing = await StudentModel.getByEmail(normalized.email);
            if (existing) {
                return res.status(409).json({
                    success: false,
                    message: `A student with email "${normalized.email}" already exists.`
                });
            }

            const created = await StudentModel.create(normalized);

            res.status(201).json({
                success: true,
                message: "Student added successfully.",
                id: created.id,
                data: created
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * PUT /api/students/:id
     * Update an existing student record
     */
    async updateStudent(req, res, next) {
        try {
            const id = req.parsedId;
            const normalized = req.normalizedBody;

            // Verify student exists
            const existing = await StudentModel.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            // Check if updated email conflicts with another student
            const emailConflict = await StudentModel.getByEmail(normalized.email, id);
            if (emailConflict) {
                return res.status(409).json({
                    success: false,
                    message: `A student with email "${normalized.email}" already exists.`
                });
            }

            const updated = await StudentModel.update(id, normalized);
            if (!updated) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Student updated successfully.",
                data: { id, ...normalized }
            });
        } catch (err) {
            next(err);
        }
    },

    /**
     * DELETE /api/students/:id
     * Remove a student record
     */
    async deleteStudent(req, res, next) {
        try {
            const id = req.parsedId;

            // Check existence
            const existing = await StudentModel.getById(id);
            if (!existing) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            const deleted = await StudentModel.delete(id);
            if (!deleted) {
                return res.status(404).json({
                    success: false,
                    message: "Student not found."
                });
            }

            res.status(200).json({
                success: true,
                message: "Student deleted successfully.",
                id
            });
        } catch (err) {
            next(err);
        }
    }
};

module.exports = StudentController;
