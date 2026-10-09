/**
 * Input validation helpers and middleware for student data
 */

const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
const PHONE_REGEX = /^\+?[0-9\s\-().]{7,25}$/;

/**
 * Validate student payload fields
 * @param {object} data
 * @returns {{isValid: boolean, errors: string[], normalized: object}}
 */
function validateStudentData(data = {}) {
    const errors = [];
    const normalized = {};

    // Validate Name
    if (!data.name || typeof data.name !== "string" || data.name.trim().length === 0) {
        errors.push("Full name is required.");
    } else {
        const trimmedName = data.name.trim();
        if (trimmedName.length < 2 || trimmedName.length > 100) {
            errors.push("Name must be between 2 and 100 characters.");
        }
        normalized.name = trimmedName;
    }

    // Validate Email
    if (!data.email || typeof data.email !== "string" || data.email.trim().length === 0) {
        errors.push("Email address is required.");
    } else {
        const trimmedEmail = data.email.trim().toLowerCase();
        if (!EMAIL_REGEX.test(trimmedEmail) || trimmedEmail.length > 100) {
            errors.push("Please provide a valid email address (e.g., student@example.com).");
        }
        normalized.email = trimmedEmail;
    }

    // Validate Phone
    if (!data.phone || typeof data.phone !== "string" || data.phone.trim().length === 0) {
        errors.push("Phone number is required.");
    } else {
        const trimmedPhone = data.phone.trim();
        if (!PHONE_REGEX.test(trimmedPhone)) {
            errors.push("Please provide a valid phone number (min 7 digits).");
        }
        normalized.phone = trimmedPhone;
    }

    // Validate Course
    if (!data.course || typeof data.course !== "string" || data.course.trim().length === 0) {
        errors.push("Course name is required.");
    } else {
        const trimmedCourse = data.course.trim();
        if (trimmedCourse.length < 2 || trimmedCourse.length > 100) {
            errors.push("Course name must be between 2 and 100 characters.");
        }
        normalized.course = trimmedCourse;
    }

    // Validate Age
    if (data.age === undefined || data.age === null || String(data.age).trim() === "") {
        errors.push("Age is required.");
    } else {
        const parsedAge = Number(data.age);
        if (!Number.isInteger(parsedAge) || parsedAge < 1 || parsedAge > 120) {
            errors.push("Age must be a valid whole number between 1 and 120.");
        }
        normalized.age = parsedAge;
    }

    return {
        isValid: errors.length === 0,
        errors,
        normalized
    };
}

/**
 * Express middleware to validate request body for POST/PUT students
 */
function studentValidationMiddleware(req, res, next) {
    const { isValid, errors, normalized } = validateStudentData(req.body);

    if (!isValid) {
        return res.status(400).json({
            success: false,
            message: errors[0],
            errors
        });
    }

    // Attach normalized data to request
    req.normalizedBody = normalized;
    next();
}

/**
 * Validate numeric ID in params
 */
function validateIdParam(req, res, next) {
    const id = Number(req.params.id);
    if (!Number.isInteger(id) || id <= 0) {
        return res.status(400).json({
            success: false,
            message: "Invalid student ID. ID must be a positive integer."
        });
    }
    req.parsedId = id;
    next();
}

module.exports = {
    validateStudentData,
    studentValidationMiddleware,
    validateIdParam
};
