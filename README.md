# Studify — Student Management System

A production-quality, responsive Student Management Dashboard built with **Node.js**, **Express.js**, **MySQL (mysql2 connection pool)**, and modern **Vanilla HTML5/CSS3/JavaScript**.

---

## 📖 Table of Contents
- [Overview](#overview)
- [Key Features](#key-features)
- [Technology Stack](#technology-stack)
- [Project Architecture](#project-architecture)
- [Prerequisites](#prerequisites)
- [Quick Start Guide](#quick-start-guide)
  - [1. Clone and Install Dependencies](#1-clone-and-install-dependencies)
  - [2. Configure Environment Variables](#2-configure-environment-variables)
  - [3. Setup MySQL Database](#3-setup-mysql-database)
  - [4. Verify Database Connectivity](#4-verify-database-connectivity)
  - [5. Launch the Application](#5-launch-the-application)
- [NPM Scripts & Development Commands](#npm-scripts--development-commands)
- [REST API Documentation](#rest-api-documentation)
- [Security & Validation Standards](#security--validation-standards)
- [Troubleshooting & Common Issues](#troubleshooting--common-issues)
- [Deployment Guide (Vercel & Cloud MySQL)](#deployment-guide-vercel--cloud-mysql)

---

## 🌟 Overview
**Studify** is a complete, portfolio-grade web application designed for academic administrators. It provides a real-time analytics dashboard, comprehensive student directory management, dynamic search/filter/sort, accessible modal confirmations, and robust input validation backed by a secure REST API and MySQL database.

---

## ✨ Key Features

### 🖥️ Modern SaaS Frontend
- **Executive Dashboard**: Real-time statistics for Total Students, Active Courses, and Cohort Average Age calculated from live database records.
- **Student Directory Table**: Clean presentation of student names, initials avatars, contact cards (email + phone), course badges, age, and quick actions.
- **Search & Filters**: Instant live search (name, email, phone, course) and course dropdown filtering.
- **Sorting Options**: Sort by Newest (ID DESC), Oldest (ID ASC), Name (A-Z, Z-A), and Age (Lowest, Highest).
- **Dual-Purpose Form**: Seamlessly switch between adding new students and editing existing records with field pre-population.
- **Delete Confirmation Modal**: Accessible modal overlay prevents accidental deletions.
- **Toast Notifications**: Non-intrusive feedback for success, warning, info, and error events.
- **Responsive Layout**: Designed for mobile phones, tablets, and widescreen desktop monitors.
- **Real-Time Connectivity Badge**: Visual status indicator displaying live server and MySQL database health.

### 🛡️ Robust Backend & Database
- **Modular MVC Architecture**: Clean separation between routes, controllers, models, and middleware.
- **Connection Pooling**: Built with `mysql2.createPool()` for high concurrency, automatic reconnection, and stability.
- **Parameterized SQL Queries**: 100% prepared statements to eliminate SQL injection vulnerabilities.
- **XSS-Proof DOM Construction**: Strictly avoids unsafe `innerHTML` interpolation of user-supplied fields.
- **Defensive Error Handling**: Centralized error middleware gracefully handles syntax errors, database outages (`503 Service Unavailable`), and duplicate email constraints (`409 Conflict`).
- **Comprehensive Test Suite**: Automated unit and integration tests powered by Node.js built-in test runner.

---

## 🛠️ Technology Stack

| Layer | Technologies |
|---|---|
| **Frontend** | HTML5, Modern CSS3 (CSS Variables, Flexbox, Grid), Vanilla JavaScript (ES6+ async/await) |
| **Backend** | Node.js (v18+ or v24+), Express.js 4.x, REST API Architecture |
| **Database** | MySQL (8.0+), `mysql2` with Connection Pool and Promise API |
| **Tooling & Config**| `dotenv`, `cors`, `nodemon`, Node.js Test Runner (`node:test`, `node:assert`) |
| **Deployment** | Vercel Serverless Ready (`vercel.json`), External Cloud MySQL compatibility |

---

## 📁 Project Architecture

```
Student-Management-System/
├── config/
│   └── database.js             # MySQL pool initialization and testConnection health check
├── controllers/
│   ├── studentController.js    # Student CRUD request handlers & pagination/sorting
│   ├── dashboardController.js  # Live metric aggregations (counts, courses, avg age)
│   └── healthController.js     # Health probe checking server uptime and DB status
├── middleware/
│   ├── validator.js            # Input validation & sanitization for student payloads
│   └── errorHandler.js         # Centralized 404 and HTTP error response handlers
├── models/
│   ├── studentModel.js         # Parameterized MySQL database queries & repository
│   └── Student.js              # Backward-compatible model re-export
├── public/
│   ├── index.html              # Studify Dashboard markup
│   ├── style.css               # Modern SaaS CSS design system (indigo/purple theme)
│   └── script.js               # Frontend application controller & state manager
├── routes/
│   ├── studentRoutes.js        # /api/students endpoints
│   ├── dashboardRoutes.js      # /api/dashboard/stats endpoints
│   └── healthRoutes.js         # /api/health endpoint
├── scripts/
│   ├── check-db.js             # Interactive CLI database diagnostic tool
│   └── init-db.js              # Safe DB creator, table migrator & starter seeder
├── tests/
│   ├── validator.test.js       # Unit tests for input validation rules
│   └── api.test.js             # Integration tests for server routes & error handling
├── .env.example                # Template for environment variables
├── .gitignore                  # Git ignore rules (node_modules, .env, logs)
├── database.sql                # Complete MySQL DDL schema and starter seeds
├── package.json                # Dependencies, metadata, and npm scripts
├── README.md                   # Comprehensive documentation
├── server.js                   # Main application entry point & graceful shutdown
└── vercel.json                 # Vercel serverless routing configuration
```

---

## 📋 Prerequisites
Before running the application, make sure you have:
1. **Node.js**: v18.0.0 or later (v24 LTS recommended). Verify with `node -v`.
2. **MySQL Server**: MySQL 8.0 Community Server installed locally or an external hosted MySQL database (Railway, Aiven, TiDB Cloud, PlanetScale). Verify with `mysql --version`.

---

## 🚀 Quick Start Guide

### 1. Clone and Install Dependencies
```bash
git clone <repository-url>
cd Student-Management-System
npm install
```

### 2. Configure Environment Variables
Copy `.env.example` to `.env`:
```bash
cp .env.example .env
```
*(On Windows PowerShell: `Copy-Item .env.example .env`)*

Open `.env` and verify your MySQL connection credentials:
```env
PORT=3000
NODE_ENV=development

DB_HOST=localhost
DB_PORT=3306
DB_USER=root
DB_PASSWORD=your_mysql_password
DB_NAME=student_management
DB_SSL=false
```

### 3. Setup MySQL Database
Ensure your MySQL service is running. Then run the automated database setup script:
```bash
npm run init-db
```
This script will:
- Create the database `student_management` if it does not already exist.
- Create the `students` table with proper data types and timestamps.
- Perform safe schema migrations (adds `created_at` / `updated_at` if missing, ensures `name` is not unique).
- Insert 5 sample student records if the table is currently empty.

*Alternative: You can also manually import the schema using MySQL CLI:*
```bash
mysql -u root -p < database.sql
```

### 4. Verify Database Connectivity
Run the diagnostic check tool to verify your MySQL configuration before launching:
```bash
npm run check-db
```
When successful, it prints:
```
=================================================
  Studify — MySQL Database Diagnostic Check     
=================================================
Target Host:     localhost
Target Port:     3306
Database User:   root
Database Name:   student_management
-------------------------------------------------
[1/4] Checking TCP connection to host/port... OK ✅
[2/4] Testing MySQL authentication... OK ✅
[3/4] Checking database "student_management"... EXISTS ✅
[4/4] Verifying 'students' table and schema... READY ✅
=================================================
🎉 Database is fully operational and connected!
=================================================
```

### 5. Launch the Application
Start the server in standard production mode:
```bash
npm start
```
Or start in development mode with auto-reload:
```bash
npm run dev
```

Open your browser and navigate to:
```
http://localhost:3000
```

---

## 📜 NPM Scripts & Development Commands

| Command | Description |
|---|---|
| `npm start` | Starts the production Express server (`node server.js`) |
| `npm run dev` | Starts server in development mode using `nodemon` |
| `npm test` | Runs the automated test suite using Node's built-in test runner |
| `npm run check-db` | Runs standalone MySQL diagnostic check with actionable fix advice |
| `npm run init-db` | Creates database, applies safe schema migrations, and seeds starter data |

---

## 📡 REST API Documentation

### Base URL: `http://localhost:3000`

### 1. Health Probe
- **`GET /api/health`**
  - **Description**: Checks server uptime and verifies MySQL connection.
  - **Response (200 OK)**:
    ```json
    {
      "status": "healthy",
      "timestamp": "2026-10-09T03:54:18.085Z",
      "uptime": "120s",
      "database": {
        "connected": true,
        "message": "Connected to MySQL successfully",
        "host": "localhost",
        "port": 3306,
        "name": "student_management"
      },
      "environment": "development"
    }
    ```
  - **Response (503 Service Unavailable)**: Returned if MySQL is offline.

---

### 2. Dashboard Analytics
- **`GET /api/dashboard/stats`**
  - **Description**: Returns live aggregated statistics computed via SQL.
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "data": {
        "totalStudents": 5,
        "totalCourses": 5,
        "averageAge": 22.0,
        "recentStudents": [
          { "id": 5, "name": "Noah Patel", "course": "Cybersecurity", "created_at": "..." }
        ]
      }
    }
    ```

---

### 3. List Students
- **`GET /api/students`**
  - **Query Parameters**:
    - `search` *(optional)*: Substring filter for name, email, phone, or course.
    - `course` *(optional)*: Filter by exact course name.
    - `sort` *(optional)*: Field to sort by (`id`, `name`, `course`, `age`, `created_at`). Default: `id`.
    - `order` *(optional)*: `ASC` or `DESC`. Default: `DESC`.
    - `page` *(optional)*: Page number (1-indexed).
    - `limit` *(optional)*: Number of records per page (max 100).
  - **Response (200 OK)**:
    ```json
    [
      {
        "id": 1,
        "name": "Alex Johnson",
        "email": "alex.johnson@example.com",
        "phone": "+1 555-0142",
        "course": "Computer Science",
        "age": 21,
        "created_at": "2026-10-09T03:30:00.000Z",
        "updated_at": "2026-10-09T03:30:00.000Z"
      }
    ]
    ```

---

### 4. Get Student by ID
- **`GET /api/students/:id`**
  - **Response (200 OK)**: Single student JSON object.
  - **Response (404 Not Found)**: `{ "success": false, "message": "Student not found." }`

---

### 5. Create Student
- **`POST /api/students`**
  - **Request Body**:
    ```json
    {
      "name": "Maya Lin",
      "email": "maya.lin@example.com",
      "phone": "+1 555-0155",
      "course": "Software Engineering",
      "age": 21
    }
    ```
  - **Response (201 Created)**:
    ```json
    {
      "success": true,
      "message": "Student added successfully.",
      "id": 6,
      "data": { ... }
    }
    ```
  - **Response (400 Bad Request)**: Missing or invalid fields.
  - **Response (409 Conflict)**: Duplicate email address.

---

### 6. Update Student
- **`PUT /api/students/:id`**
  - **Request Body**: Same fields as POST.
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Student updated successfully.",
      "data": { "id": 6, ... }
    }
    ```
  - **Response (404 Not Found)**: Student with that ID does not exist.
  - **Response (409 Conflict)**: Updated email is already in use by another student.

---

### 7. Delete Student
- **`DELETE /api/students/:id`**
  - **Response (200 OK)**:
    ```json
    {
      "success": true,
      "message": "Student deleted successfully.",
      "id": 6
    }
    ```
  - **Response (404 Not Found)**: Student not found.

---

## 🔒 Security & Validation Standards

1. **SQL Injection Defense**: Every single query uses parameterized SQL (`?` placeholders). No raw user strings are ever concatenated into SQL commands.
2. **XSS Protection**: Student names, courses, emails, and contact numbers are rendered in the DOM using `element.textContent` and `document.createElement()`, strictly preventing stored or reflected XSS injection.
3. **Input Sanitization**:
   - `name`: 2 to 100 characters, trimmed of leading/trailing whitespace.
   - `email`: Normalized to lowercase, trimmed, validated against RFC-compliant email regex.
   - `phone`: Validated against international telephone regex (`7` to `25` valid digits/symbols).
   - `course`: 2 to 100 characters, trimmed.
   - `age`: Strictly validated as a whole integer between `1` and `120`.
4. **Environment Variables**: Database credentials and secrets are kept in `.env` and excluded from version control via `.gitignore`.
5. **Request Protection**: JSON payload limits (`100kb`) and CORS protections enabled.

---

## ❓ Troubleshooting & Common Issues

### Issue 1: `ECONNREFUSED` on port 3306
**Cause:** The MySQL Windows Service is stopped.  
**Fix:**
- Open PowerShell or Command Prompt as **Administrator** and run:
  ```powershell
  net start MySQL80
  # Or: Start-Service MySQL80
  ```
- Alternatively: Press `Win + R`, type `services.msc`, locate `MySQL80`, and click **Start**.

### Issue 2: `ER_ACCESS_DENIED_ERROR`
**Cause:** The MySQL password or user in `.env` does not match your MySQL installation.  
**Fix:** Open `.env` and verify `DB_USER` and `DB_PASSWORD`. Test logging into MySQL manually:
```bash
mysql -u root -p
```

### Issue 3: `ER_BAD_DB_ERROR` (Unknown database 'student_management')
**Cause:** The database has not been initialized yet.  
**Fix:** Run:
```bash
npm run init-db
```

### Issue 4: Port 3000 is already in use (`EADDRINUSE`)
**Cause:** Another application or a previous Node process is running on port 3000.  
**Fix:**
- Specify a different port in `.env` (e.g. `PORT=3001`).
- Or terminate the existing process using PowerShell:
  ```powershell
  Get-Process -Id (Get-NetTCPConnection -LocalPort 3000).OwningProcess | Stop-Process -Force
  ```

---

## ☁️ Deployment Guide (Vercel & Cloud MySQL)

### Vercel Deployment Architecture
Vercel is a serverless platform that hosts frontend static assets and serverless Node.js functions. Because Vercel does **not** provide a built-in persistent MySQL database, you must connect to an externally hosted MySQL database.

#### Recommended Cloud MySQL Providers:
- **Aiven for MySQL** (Free tier available)
- **TiDB Cloud Serverless** (Free tier available, 100% MySQL compatible)
- **Railway MySQL**
- **Clever Cloud**

#### Steps to Deploy to Vercel:
1. Ensure your external MySQL database is running and reachable from the internet.
2. In your Vercel Project Dashboard:
   - Go to **Settings** -> **Environment Variables**.
   - Add the following variables:
     - `DB_HOST`: Your cloud database hostname (e.g., `gateway.tidbcloud.com`)
     - `DB_PORT`: Database port (e.g., `4000` or `3306`)
     - `DB_USER`: Database username
     - `DB_PASSWORD`: Database password
     - `DB_NAME`: Database name (`student_management`)
     - `DB_SSL`: `true` (Enables secure TLS connection with certificate validation)
3. Deploy using the Vercel CLI or GitHub integration:
   ```bash
   vercel
   ```
4. The file `vercel.json` automatically configures routes:
   - `/api/*` -> Serverless execution via `api/index.js`
   - Static files -> Served directly from `/public/`

---

## 📄 License
This project is open-source under the ISC License. Created for professional portfolio demonstrations.
