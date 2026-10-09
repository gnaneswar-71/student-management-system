-- ===================================================
-- Studify — Student Management System Database Schema
-- Database: student_management
-- ===================================================

-- Create the database if it doesn't already exist
CREATE DATABASE IF NOT EXISTS `student_management`
CHARACTER SET utf8mb4
COLLATE utf8mb4_unicode_ci;

USE `student_management`;

-- Create students table with all required fields & timestamps
CREATE TABLE IF NOT EXISTS `students` (
    `id` INT AUTO_INCREMENT PRIMARY KEY,
    `name` VARCHAR(100) NOT NULL,
    `email` VARCHAR(100) NOT NULL UNIQUE,
    `phone` VARCHAR(20) NOT NULL,
    `course` VARCHAR(100) NOT NULL,
    `age` INT NOT NULL,
    `created_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP,
    `updated_at` TIMESTAMP DEFAULT CURRENT_TIMESTAMP ON UPDATE CURRENT_TIMESTAMP,
    INDEX `idx_students_email` (`email`),
    INDEX `idx_students_course` (`course`)
) ENGINE=InnoDB DEFAULT CHARSET=utf8mb4 COLLATE=utf8mb4_unicode_ci;

-- Optional starter sample data (for development/demo purposes)
INSERT INTO `students` (`name`, `email`, `phone`, `course`, `age`)
VALUES
    ('Alex Johnson', 'alex.johnson@example.com', '+1 555-0142', 'Computer Science', 21),
    ('Sophia Martinez', 'sophia.martinez@example.com', '+1 555-0188', 'Data Science', 23),
    ('Liam Chen', 'liam.chen@example.com', '+1 555-0199', 'Artificial Intelligence', 20),
    ('Emma Davis', 'emma.davis@example.com', '+1 555-0123', 'Information Technology', 22),
    ('Noah Patel', 'noah.patel@example.com', '+1 555-0177', 'Cybersecurity', 24)
ON DUPLICATE KEY UPDATE `email` = `email`;