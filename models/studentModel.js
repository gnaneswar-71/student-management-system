const { promisePool } = require("../config/database");

/**
 * Student Repository/Model for MySQL operations
 */
const StudentModel = {
    /**
     * Fetch all students with optional search, sorting, and pagination
     */
    async getAll({ search = "", course = "", sort = "id", order = "DESC", limit, offset } = {}) {
        let query = "SELECT id, name, email, phone, course, age, created_at, updated_at FROM students";
        const params = [];
        const conditions = [];

        if (search && search.trim() !== "") {
            const searchTerm = `%${search.trim()}%`;
            conditions.push("(name LIKE ? OR email LIKE ? OR phone LIKE ? OR course LIKE ?)");
            params.push(searchTerm, searchTerm, searchTerm, searchTerm);
        }

        if (course && course.trim() !== "") {
            conditions.push("course = ?");
            params.push(course.trim());
        }

        if (conditions.length > 0) {
            query += " WHERE " + conditions.join(" AND ");
        }

        // Whitelist allowed sort columns to avoid SQL injection
        const allowedSortCols = ["id", "name", "email", "course", "age", "created_at"];
        const sortColumn = allowedSortCols.includes(sort) ? sort : "id";
        const sortDirection = (order && order.toUpperCase() === "ASC") ? "ASC" : "DESC";

        query += ` ORDER BY ${sortColumn} ${sortDirection}`;

        if (Number.isInteger(limit) && limit > 0) {
            query += " LIMIT ?";
            params.push(limit);
            if (Number.isInteger(offset) && offset >= 0) {
                query += " OFFSET ?";
                params.push(offset);
            }
        }

        const [rows] = await promisePool.query(query, params);
        return rows;
    },

    /**
     * Get single student by ID
     */
    async getById(id) {
        const query = "SELECT id, name, email, phone, course, age, created_at, updated_at FROM students WHERE id = ?";
        const [rows] = await promisePool.query(query, [id]);
        return rows[0] || null;
    },

    /**
     * Find a student by email (optionally excluding a specific student ID for updates)
     */
    async getByEmail(email, excludeId = null) {
        let query = "SELECT id, email FROM students WHERE email = ?";
        const params = [email];

        if (excludeId) {
            query += " AND id != ?";
            params.push(excludeId);
        }

        const [rows] = await promisePool.query(query, params);
        return rows[0] || null;
    },

    /**
     * Create a new student
     */
    async create({ name, email, phone, course, age }) {
        const query = `
            INSERT INTO students (name, email, phone, course, age)
            VALUES (?, ?, ?, ?, ?)
        `;
        const [result] = await promisePool.query(query, [
            name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            course.trim(),
            parseInt(age, 10)
        ]);

        return {
            id: result.insertId,
            name: name.trim(),
            email: email.trim().toLowerCase(),
            phone: phone.trim(),
            course: course.trim(),
            age: parseInt(age, 10)
        };
    },

    /**
     * Update an existing student by ID
     */
    async update(id, { name, email, phone, course, age }) {
        const query = `
            UPDATE students
            SET name = ?, email = ?, phone = ?, course = ?, age = ?
            WHERE id = ?
        `;
        const [result] = await promisePool.query(query, [
            name.trim(),
            email.trim().toLowerCase(),
            phone.trim(),
            course.trim(),
            parseInt(age, 10),
            id
        ]);

        return result.affectedRows > 0;
    },

    /**
     * Delete student by ID
     */
    async delete(id) {
        const query = "DELETE FROM students WHERE id = ?";
        const [result] = await promisePool.query(query, [id]);
        return result.affectedRows > 0;
    },

    /**
     * Get computed dashboard statistics
     */
    async getStats() {
        // Query aggregate numbers
        const statsQuery = `
            SELECT 
                COUNT(*) AS totalStudents,
                COUNT(DISTINCT course) AS totalCourses,
                ROUND(COALESCE(AVG(age), 0), 1) AS averageAge
            FROM students
        `;
        const [statsRows] = await promisePool.query(statsQuery);

        // Query 5 most recently created students
        const recentQuery = `
            SELECT id, name, email, course, age, created_at
            FROM students
            ORDER BY id DESC
            LIMIT 5
        `;
        const [recentRows] = await promisePool.query(recentQuery);

        const stats = statsRows[0] || { totalStudents: 0, totalCourses: 0, averageAge: 0 };

        return {
            totalStudents: Number(stats.totalStudents) || 0,
            totalCourses: Number(stats.totalCourses) || 0,
            averageAge: Number(stats.averageAge) || 0,
            recentStudents: recentRows || []
        };
    }
};

module.exports = StudentModel;
