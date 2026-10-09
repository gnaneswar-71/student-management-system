/**
 * Studify — Student Management System
 * Frontend Application Controller
 */

(function () {
    "use strict";

    // ==========================================
    // 1. CONFIGURATION & STATE
    // ==========================================
    const API_BASE = ""; // Relative path works for both local server and Vercel
    const ENDPOINTS = {
        health: `${API_BASE}/api/health`,
        stats: `${API_BASE}/api/dashboard/stats`,
        students: `${API_BASE}/api/students`
    };

    const state = {
        students: [],
        filteredStudents: [],
        stats: { totalStudents: 0, totalCourses: 0, averageAge: 0, recentStudents: [] },
        isEditing: false,
        editingId: null,
        deleteTarget: null,
        searchQuery: "",
        selectedCourse: "",
        sortOption: "id-desc",
        isDbOnline: false
    };

    // DOM Elements Cache
    const el = {
        // Status & Alerts
        statusIndicator: document.getElementById("statusIndicator"),
        statusDot: document.getElementById("statusDot"),
        statusText: document.getElementById("statusText"),
        dbAlertBanner: document.getElementById("dbAlertBanner"),
        dbAlertMessage: document.getElementById("dbAlertMessage"),
        retryConnectionBtn: document.getElementById("retryConnectionBtn"),

        // Stats
        totalStudents: document.getElementById("totalStudents"),
        totalCourses: document.getElementById("totalCourses"),
        averageAge: document.getElementById("averageAge"),
        recentAddedText: document.getElementById("recentAddedText"),

        // Form
        formSection: document.getElementById("formSection"),
        studentForm: document.getElementById("studentForm"),
        formEyebrow: document.getElementById("formEyebrow"),
        formTitle: document.getElementById("formTitle"),
        formSubtitle: document.getElementById("formSubtitle"),
        studentId: document.getElementById("studentId"),
        name: document.getElementById("name"),
        email: document.getElementById("email"),
        phone: document.getElementById("phone"),
        course: document.getElementById("course"),
        age: document.getElementById("age"),
        cancelButton: document.getElementById("cancelButton"),
        resetButton: document.getElementById("resetButton"),
        submitButton: document.getElementById("submitButton"),
        submitButtonText: document.getElementById("submitButtonText"),
        submitButtonIcon: document.getElementById("submitButtonIcon"),
        formFeedback: document.getElementById("formFeedback"),

        // Field Errors
        nameError: document.getElementById("nameError"),
        emailError: document.getElementById("emailError"),
        phoneError: document.getElementById("phoneError"),
        courseError: document.getElementById("courseError"),
        ageError: document.getElementById("ageError"),

        // Directory & Table
        studentsSection: document.getElementById("studentsSection"),
        studentCount: document.getElementById("studentCount"),
        search: document.getElementById("search"),
        courseFilter: document.getElementById("courseFilter"),
        sortSelect: document.getElementById("sortSelect"),
        refreshButton: document.getElementById("refreshButton"),
        studentList: document.getElementById("studentList"),
        tableSummary: document.getElementById("tableSummary"),

        // Navigation & Actions
        navDashboard: document.getElementById("navDashboard"),
        navStudents: document.getElementById("navStudents"),
        navAddStudent: document.getElementById("navAddStudent"),
        addStudentButton: document.getElementById("addStudentButton"),
        breadcrumbCurrent: document.getElementById("breadcrumbCurrent"),

        // Delete Modal
        deleteModal: document.getElementById("deleteModal"),
        deleteTargetName: document.getElementById("deleteTargetName"),
        cancelDeleteBtn: document.getElementById("cancelDeleteBtn"),
        confirmDeleteBtn: document.getElementById("confirmDeleteBtn"),

        // Toast
        toast: document.getElementById("toast")
    };

    // Validation Regex Patterns
    const EMAIL_REGEX = /^[a-zA-Z0-9.!#$%&'*+/=?^_`{|}~-]+@[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?(?:\.[a-zA-Z0-9](?:[a-zA-Z0-9-]{0,61}[a-zA-Z0-9])?)+$/;
    const PHONE_REGEX = /^\+?[0-9\s\-().]{7,25}$/;

    // ==========================================
    // 2. TOAST NOTIFICATION SYSTEM
    // ==========================================
    let toastTimeout = null;

    function showToast(message, type = "info", duration = 3800) {
        if (!el.toast) return;

        if (toastTimeout) {
            clearTimeout(toastTimeout);
        }

        el.toast.className = `toast ${type}`;
        el.toast.textContent = message;

        // Force reflow
        void el.toast.offsetWidth;
        el.toast.classList.add("show");

        toastTimeout = setTimeout(() => {
            el.toast.classList.remove("show");
        }, duration);
    }

    // ==========================================
    // 3. HEALTH & STATUS MONITORING
    // ==========================================
    async function checkHealth() {
        if (el.statusDot) {
            el.statusDot.className = "status-dot connecting";
            el.statusText.textContent = "Checking...";
        }

        try {
            const res = await fetch(ENDPOINTS.health);
            const data = await res.json().catch(() => ({}));

            if (res.ok && data.database && data.database.connected) {
                state.isDbOnline = true;
                el.statusDot.className = "status-dot online";
                el.statusText.textContent = "Database online";
                if (el.dbAlertBanner) el.dbAlertBanner.hidden = true;
            } else {
                state.isDbOnline = false;
                el.statusDot.className = "status-dot offline";
                el.statusText.textContent = "Database offline";
                if (el.dbAlertBanner) {
                    el.dbAlertBanner.hidden = false;
                    if (el.dbAlertMessage) {
                        el.dbAlertMessage.textContent = data.database?.message || "MySQL database is unreachable. Ensure the MySQL service (MySQL80) is started.";
                    }
                }
            }
        } catch (err) {
            state.isDbOnline = false;
            if (el.statusDot) {
                el.statusDot.className = "status-dot offline";
                el.statusText.textContent = "Server unreachable";
            }
            if (el.dbAlertBanner) {
                el.dbAlertBanner.hidden = false;
                if (el.dbAlertMessage) {
                    el.dbAlertMessage.textContent = "Backend server is offline or unreachable. Verify that 'npm start' is running.";
                }
            }
        }
    }

    // ==========================================
    // 4. STATS DATA FETCHER
    // ==========================================
    async function loadDashboardStats() {
        try {
            const res = await fetch(ENDPOINTS.stats);
            if (!res.ok) throw new Error("Failed to load statistics");

            const json = await res.json();
            const stats = json.data || {};

            state.stats = stats;

            if (el.totalStudents) el.totalStudents.textContent = stats.totalStudents ?? 0;
            if (el.totalCourses) el.totalCourses.textContent = stats.totalCourses ?? 0;
            if (el.averageAge) el.averageAge.textContent = stats.averageAge ?? 0;

            if (el.recentAddedText && stats.recentStudents && stats.recentStudents.length > 0) {
                const latest = stats.recentStudents[0];
                el.recentAddedText.textContent = `Latest: ${latest.name}`;
            } else if (el.recentAddedText) {
                el.recentAddedText.textContent = "Enrolled students";
            }
        } catch (err) {
            console.warn("Could not fetch statistics:", err.message);
        }
    }

    // ==========================================
    // 5. STUDENT DATA FETCHER
    // ==========================================
    async function loadStudents() {
        renderLoadingState();

        try {
            const res = await fetch(ENDPOINTS.students);

            if (!res.ok) {
                const errorData = await res.json().catch(() => ({}));
                throw new Error(errorData.message || `HTTP ${res.status}: Failed to fetch students.`);
            }

            const data = await res.json();
            state.students = Array.isArray(data) ? data : (data.data || []);

            updateCourseFilterOptions();
            applyFiltersAndRender();
        } catch (err) {
            renderErrorState(err.message);
            showToast(err.message, "error");
        }
    }

    // ==========================================
    // 6. FILTERING, SORTING, & RENDERING
    // ==========================================
    function updateCourseFilterOptions() {
        if (!el.courseFilter) return;

        const currentVal = el.courseFilter.value;
        const courses = [...new Set(state.students.map(s => s.course).filter(Boolean))].sort();

        el.courseFilter.innerHTML = '<option value="">All Courses</option>';
        courses.forEach(course => {
            const opt = document.createElement("option");
            opt.value = course;
            opt.textContent = course;
            if (course === currentVal) opt.selected = true;
            el.courseFilter.appendChild(opt);
        });
    }

    function applyFiltersAndRender() {
        let result = [...state.students];

        // Search Filter
        if (state.searchQuery) {
            const q = state.searchQuery.toLowerCase();
            result = result.filter(s =>
                (s.name && s.name.toLowerCase().includes(q)) ||
                (s.email && s.email.toLowerCase().includes(q)) ||
                (s.phone && s.phone.toLowerCase().includes(q)) ||
                (s.course && s.course.toLowerCase().includes(q))
            );
        }

        // Course Dropdown Filter
        if (state.selectedCourse) {
            result = result.filter(s => s.course === state.selectedCourse);
        }

        // Sorting
        result.sort((a, b) => {
            switch (state.sortOption) {
                case "id-asc":
                    return a.id - b.id;
                case "id-desc":
                    return b.id - a.id;
                case "name-asc":
                    return (a.name || "").localeCompare(b.name || "");
                case "name-desc":
                    return (b.name || "").localeCompare(a.name || "");
                case "age-asc":
                    return (a.age || 0) - (b.age || 0);
                case "age-desc":
                    return (b.age || 0) - (a.age || 0);
                default:
                    return b.id - a.id;
            }
        });

        state.filteredStudents = result;
        renderStudentTable(result);
    }

    /**
     * Safely render the student table using safe DOM construction (XSS-proof)
     */
    function renderStudentTable(students) {
        if (!el.studentList) return;

        // Update count badge & summary
        const countText = `${students.length} ${students.length === 1 ? "student" : "students"}`;
        if (el.studentCount) el.studentCount.textContent = countText;
        if (el.tableSummary) {
            el.tableSummary.textContent = state.searchQuery || state.selectedCourse
                ? `Showing ${students.length} of ${state.students.length} students (filtered)`
                : `Showing ${students.length} students`;
        }

        // Clear existing rows
        el.studentList.innerHTML = "";

        if (students.length === 0) {
            renderEmptyState();
            return;
        }

        const fragment = document.createDocumentFragment();

        students.forEach(student => {
            const tr = document.createElement("tr");

            // 1. Student Name Cell with Initials Avatar
            const tdStudent = document.createElement("td");
            const studentCellDiv = document.createElement("div");
            studentCellDiv.className = "student-cell";

            const avatar = document.createElement("div");
            avatar.className = "student-avatar";
            avatar.textContent = getInitials(student.name);

            const detailsDiv = document.createElement("div");

            const nameDiv = document.createElement("div");
            nameDiv.className = "student-name";
            nameDiv.textContent = student.name || "Unnamed";

            const idDiv = document.createElement("div");
            idDiv.className = "student-id";
            idDiv.textContent = `ID: #${student.id}`;

            detailsDiv.appendChild(nameDiv);
            detailsDiv.appendChild(idDiv);

            studentCellDiv.appendChild(avatar);
            studentCellDiv.appendChild(detailsDiv);
            tdStudent.appendChild(studentCellDiv);

            // 2. Contact Cell (Email & Phone)
            const tdContact = document.createElement("td");
            const emailDiv = document.createElement("div");
            emailDiv.className = "contact-email";
            emailDiv.textContent = student.email || "—";

            const phoneDiv = document.createElement("div");
            phoneDiv.className = "student-id";
            phoneDiv.textContent = student.phone || "—";

            tdContact.appendChild(emailDiv);
            tdContact.appendChild(phoneDiv);

            // 3. Course Cell
            const tdCourse = document.createElement("td");
            const courseBadge = document.createElement("span");
            courseBadge.className = "course-badge";
            courseBadge.textContent = student.course || "General";
            tdCourse.appendChild(courseBadge);

            // 4. Age Cell
            const tdAge = document.createElement("td");
            tdAge.textContent = student.age ? `${student.age} yrs` : "—";

            // 5. Actions Cell (Edit & Delete)
            const tdActions = document.createElement("td");
            const actionsDiv = document.createElement("div");
            actionsDiv.className = "action-buttons";

            const editBtn = document.createElement("button");
            editBtn.type = "button";
            editBtn.className = "edit-button";
            editBtn.textContent = "Edit";
            editBtn.setAttribute("aria-label", `Edit student ${student.name}`);
            editBtn.addEventListener("click", () => startEditStudent(student));

            const deleteBtn = document.createElement("button");
            deleteBtn.type = "button";
            deleteBtn.className = "delete-button";
            deleteBtn.textContent = "Delete";
            deleteBtn.setAttribute("aria-label", `Delete student ${student.name}`);
            deleteBtn.addEventListener("click", () => openDeleteModal(student));

            actionsDiv.appendChild(editBtn);
            actionsDiv.appendChild(deleteBtn);
            tdActions.appendChild(actionsDiv);

            tr.appendChild(tdStudent);
            tr.appendChild(tdContact);
            tr.appendChild(tdCourse);
            tr.appendChild(tdAge);
            tr.appendChild(tdActions);

            fragment.appendChild(tr);
        });

        el.studentList.appendChild(fragment);
    }

    function renderLoadingState() {
        if (!el.studentList) return;
        el.studentList.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <div class="loading-state">
                        <span class="spinner" aria-hidden="true"></span>
                        <span>Loading students from database...</span>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderEmptyState() {
        if (!el.studentList) return;
        const msg = state.searchQuery || state.selectedCourse
            ? "No students match your filter criteria."
            : "No students registered yet. Add your first student using the form above!";

        el.studentList.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <div style="padding: 24px 0; color: #80869d;">
                        <div style="font-size: 28px; margin-bottom: 8px;">📂</div>
                        <p style="font-weight: 600; font-size: 13px;">${msg}</p>
                    </div>
                </td>
            </tr>
        `;
    }

    function renderErrorState(errorMessage) {
        if (!el.studentList) return;
        el.studentList.innerHTML = `
            <tr>
                <td colspan="5" class="empty">
                    <div style="padding: 20px 0; color: #dc2626;">
                        <div style="font-size: 26px; margin-bottom: 8px;">⚠️</div>
                        <p style="font-weight: 600; margin-bottom: 8px;">Failed to load student data</p>
                        <p style="font-size: 11px; color: #64748b;">${errorMessage}</p>
                        <button type="button" class="secondary-button" style="margin-top: 14px;" id="retryFetchBtn">
                            ↻ Retry
                        </button>
                    </div>
                </td>
            </tr>
        `;
        const retryBtn = document.getElementById("retryFetchBtn");
        if (retryBtn) retryBtn.addEventListener("click", () => {
            checkHealth();
            loadStudents();
            loadDashboardStats();
        });
    }

    function getInitials(name) {
        if (!name) return "ST";
        const parts = name.trim().split(/\s+/);
        if (parts.length === 1) return parts[0].substring(0, 2).toUpperCase();
        return (parts[0][0] + parts[parts.length - 1][0]).toUpperCase();
    }

    // ==========================================
    // 7. INPUT VALIDATION & FORM LOGIC
    // ==========================================
    function clearFieldErrors() {
        ["name", "email", "phone", "course", "age"].forEach(field => {
            const errEl = el[`${field}Error`];
            const inputEl = el[field];
            if (errEl) errEl.textContent = "";
            if (inputEl && inputEl.parentElement) {
                inputEl.parentElement.classList.remove("has-error");
            }
        });
        if (el.formFeedback) el.formFeedback.hidden = true;
    }

    function validateField(fieldName, value) {
        let error = "";
        const trimmed = (value || "").trim();

        switch (fieldName) {
            case "name":
                if (!trimmed) error = "Full name is required.";
                else if (trimmed.length < 2) error = "Name must be at least 2 characters.";
                else if (trimmed.length > 100) error = "Name cannot exceed 100 characters.";
                break;

            case "email":
                if (!trimmed) error = "Email address is required.";
                else if (!EMAIL_REGEX.test(trimmed.toLowerCase())) error = "Please enter a valid email address.";
                else if (trimmed.length > 100) error = "Email cannot exceed 100 characters.";
                break;

            case "phone":
                if (!trimmed) error = "Phone number is required.";
                else if (!PHONE_REGEX.test(trimmed)) error = "Please enter a valid phone number (min 7 digits).";
                break;

            case "course":
                if (!trimmed) error = "Course name is required.";
                else if (trimmed.length < 2) error = "Course must be at least 2 characters.";
                else if (trimmed.length > 100) error = "Course cannot exceed 100 characters.";
                break;

            case "age":
                if (!trimmed) error = "Age is required.";
                else {
                    const num = Number(trimmed);
                    if (!Number.isInteger(num) || num < 1 || num > 120) {
                        error = "Age must be a whole number between 1 and 120.";
                    }
                }
                break;
        }

        const errEl = el[`${fieldName}Error`];
        const inputEl = el[fieldName];

        if (errEl) errEl.textContent = error;
        if (inputEl && inputEl.parentElement) {
            if (error) {
                inputEl.parentElement.classList.add("has-error");
            } else {
                inputEl.parentElement.classList.remove("has-error");
            }
        }

        return !error;
    }

    function validateEntireForm() {
        let valid = true;
        const fields = ["name", "email", "phone", "course", "age"];
        fields.forEach(field => {
            const isFieldValid = validateField(field, el[field]?.value);
            if (!isFieldValid) valid = false;
        });
        return valid;
    }

    // Attach live validation on blur and input
    ["name", "email", "phone", "course", "age"].forEach(field => {
        const input = el[field];
        if (input) {
            input.addEventListener("input", () => {
                if (input.parentElement.classList.contains("has-error")) {
                    validateField(field, input.value);
                }
            });
            input.addEventListener("blur", () => {
                validateField(field, input.value);
            });
        }
    });

    // ==========================================
    // 8. ADD & EDIT STUDENT OPERATIONS
    // ==========================================
    async function handleFormSubmit(e) {
        e.preventDefault();

        if (!validateEntireForm()) {
            showToast("Please correct the errors in the form before submitting.", "warning");
            return;
        }

        const payload = {
            name: el.name.value.trim(),
            email: el.email.value.trim().toLowerCase(),
            phone: el.phone.value.trim(),
            course: el.course.value.trim(),
            age: parseInt(el.age.value, 10)
        };

        const isEditing = state.isEditing;
        const targetId = state.editingId;
        const url = isEditing ? `${ENDPOINTS.students}/${targetId}` : ENDPOINTS.students;
        const method = isEditing ? "PUT" : "POST";

        setFormSubmitting(true);

        try {
            const res = await fetch(url, {
                method,
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify(payload)
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                const message = data.message || `Failed to ${isEditing ? "update" : "save"} student.`;
                showToast(message, "error");
                setFormFeedback(message, "error");
                setFormSubmitting(false);
                return;
            }

            const successMsg = isEditing
                ? `Student "${payload.name}" updated successfully.`
                : `Student "${payload.name}" added successfully.`;

            showToast(successMsg, "success");
            resetForm();
            setFormSubmitting(false);

            // Refresh directory and stats
            await Promise.all([loadStudents(), loadDashboardStats()]);

            // Scroll to the updated student table
            if (el.studentsSection) {
                el.studentsSection.scrollIntoView({ behavior: "smooth" });
            }
        } catch (err) {
            setFormSubmitting(false);
            const msg = "Network error. Please check your connection to the server.";
            showToast(msg, "error");
            setFormFeedback(msg, "error");
        }
    }

    function startEditStudent(student) {
        state.isEditing = true;
        state.editingId = student.id;

        clearFieldErrors();

        // Populate fields
        if (el.studentId) el.studentId.value = student.id;
        if (el.name) el.name.value = student.name || "";
        if (el.email) el.email.value = student.email || "";
        if (el.phone) el.phone.value = student.phone || "";
        if (el.course) el.course.value = student.course || "";
        if (el.age) el.age.value = student.age || "";

        // UI state transitions
        if (el.formEyebrow) el.formEyebrow.textContent = `EDITING STUDENT #${student.id}`;
        if (el.formTitle) el.formTitle.textContent = `Edit student: ${student.name}`;
        if (el.formSubtitle) el.formSubtitle.textContent = "Modify the details below and click Update to save changes.";
        if (el.submitButtonText) el.submitButtonText.textContent = "Update student";
        if (el.submitButtonIcon) el.submitButtonIcon.textContent = "✓";
        if (el.cancelButton) el.cancelButton.hidden = false;

        // Smooth scroll to form & focus first field
        if (el.formSection) {
            el.formSection.scrollIntoView({ behavior: "smooth" });
            setTimeout(() => el.name && el.name.focus(), 300);
        }
    }

    function cancelEditMode() {
        resetForm();
    }

    function resetForm() {
        state.isEditing = false;
        state.editingId = null;

        if (el.studentForm) el.studentForm.reset();
        if (el.studentId) el.studentId.value = "";

        clearFieldErrors();

        // Restore Add Mode
        if (el.formEyebrow) el.formEyebrow.textContent = "STUDENT REGISTRATION";
        if (el.formTitle) el.formTitle.textContent = "Add a student";
        if (el.formSubtitle) el.formSubtitle.textContent = "Enter student information below to register a new record.";
        if (el.submitButtonText) el.submitButtonText.textContent = "Save student";
        if (el.submitButtonIcon) el.submitButtonIcon.textContent = "＋";
        if (el.cancelButton) el.cancelButton.hidden = true;
    }

    function setFormSubmitting(isSubmitting) {
        if (!el.submitButton) return;
        el.submitButton.disabled = isSubmitting;
        if (isSubmitting) {
            el.submitButtonText.textContent = state.isEditing ? "Updating..." : "Saving...";
        } else {
            el.submitButtonText.textContent = state.isEditing ? "Update student" : "Save student";
        }
    }

    function setFormFeedback(message, type) {
        if (!el.formFeedback) return;
        el.formFeedback.className = `form-feedback ${type}`;
        el.formFeedback.textContent = message;
        el.formFeedback.hidden = false;
    }

    // ==========================================
    // 9. DELETE MODAL & CONFIRMATION
    // ==========================================
    function openDeleteModal(student) {
        state.deleteTarget = student;
        if (el.deleteTargetName) el.deleteTargetName.textContent = `${student.name} (#${student.id})`;
        if (el.deleteModal) el.deleteModal.hidden = false;
    }

    function closeDeleteModal() {
        state.deleteTarget = null;
        if (el.deleteModal) el.deleteModal.hidden = true;
    }

    async function handleConfirmDelete() {
        if (!state.deleteTarget) return;

        const { id, name } = state.deleteTarget;
        if (el.confirmDeleteBtn) el.confirmDeleteBtn.disabled = true;

        try {
            const res = await fetch(`${ENDPOINTS.students}/${id}`, {
                method: "DELETE"
            });

            const data = await res.json().catch(() => ({}));

            if (!res.ok) {
                throw new Error(data.message || "Failed to delete student.");
            }

            showToast(`Student "${name}" was successfully deleted.`, "success");
            closeDeleteModal();

            // If we were editing this deleted student, reset the form
            if (state.isEditing && state.editingId === id) {
                resetForm();
            }

            // Refresh UI
            await Promise.all([loadStudents(), loadDashboardStats()]);
        } catch (err) {
            showToast(err.message, "error");
        } finally {
            if (el.confirmDeleteBtn) el.confirmDeleteBtn.disabled = false;
        }
    }

    // ==========================================
    // 10. SEARCH & TOOLBAR CONTROLS
    // ==========================================
    let searchDebounce = null;
    function handleSearchInput(e) {
        clearTimeout(searchDebounce);
        searchDebounce = setTimeout(() => {
            state.searchQuery = e.target.value.trim();
            applyFiltersAndRender();
        }, 200);
    }

    function handleCourseFilterChange(e) {
        state.selectedCourse = e.target.value;
        applyFiltersAndRender();
    }

    function handleSortChange(e) {
        state.sortOption = e.target.value;
        applyFiltersAndRender();
    }

    function handleRefreshClick() {
        if (el.refreshButton) {
            el.refreshButton.textContent = "↻ Loading...";
            el.refreshButton.disabled = true;
        }

        Promise.all([checkHealth(), loadStudents(), loadDashboardStats()]).finally(() => {
            if (el.refreshButton) {
                el.refreshButton.textContent = "↻ Refresh";
                el.refreshButton.disabled = false;
            }
            showToast("Data refreshed.", "info", 1800);
        });
    }

    // ==========================================
    // 11. NAVIGATION & INITIALIZATION
    // ==========================================
    function setupEventListeners() {
        // Form
        if (el.studentForm) el.studentForm.addEventListener("submit", handleFormSubmit);
        if (el.cancelButton) el.cancelButton.addEventListener("click", cancelEditMode);
        if (el.resetButton) el.resetButton.addEventListener("click", clearFieldErrors);

        // Delete Modal
        if (el.cancelDeleteBtn) el.cancelDeleteBtn.addEventListener("click", closeDeleteModal);
        if (el.confirmDeleteBtn) el.confirmDeleteBtn.addEventListener("click", handleConfirmDelete);
        if (el.deleteModal) {
            el.deleteModal.addEventListener("click", (e) => {
                if (e.target === el.deleteModal) closeDeleteModal();
            });
        }

        // Toolbar
        if (el.search) el.search.addEventListener("input", handleSearchInput);
        if (el.courseFilter) el.courseFilter.addEventListener("change", handleCourseFilterChange);
        if (el.sortSelect) el.sortSelect.addEventListener("change", handleSortChange);
        if (el.refreshButton) el.refreshButton.addEventListener("click", handleRefreshClick);
        if (el.retryConnectionBtn) el.retryConnectionBtn.addEventListener("click", () => {
            checkHealth();
            loadStudents();
            loadDashboardStats();
        });

        // Quick Action Button in Welcome Banner
        if (el.addStudentButton) {
            el.addStudentButton.addEventListener("click", () => {
                resetForm();
                if (el.formSection) {
                    el.formSection.scrollIntoView({ behavior: "smooth" });
                    setTimeout(() => el.name && el.name.focus(), 300);
                }
            });
        }

        // Navigation Links
        const navLinks = [
            { btn: el.navDashboard, target: el.formSection, label: "Dashboard" },
            { btn: el.navStudents, target: el.studentsSection, label: "Students" },
            { btn: el.navAddStudent, target: el.formSection, label: "Add Student" }
        ];

        navLinks.forEach(({ btn, target, label }) => {
            if (!btn) return;
            btn.addEventListener("click", (e) => {
                e.preventDefault();
                navLinks.forEach(item => item.btn && item.btn.classList.remove("active"));
                btn.classList.add("active");
                if (el.breadcrumbCurrent) el.breadcrumbCurrent.textContent = label;

                if (label === "Add Student") {
                    resetForm();
                    if (target) {
                        target.scrollIntoView({ behavior: "smooth" });
                        setTimeout(() => el.name && el.name.focus(), 300);
                    }
                } else if (target) {
                    target.scrollIntoView({ behavior: "smooth" });
                }
            });
        });

        // Escape Key to close modal
        document.addEventListener("keydown", (e) => {
            if (e.key === "Escape" && el.deleteModal && !el.deleteModal.hidden) {
                closeDeleteModal();
            }
        });
    }

    // App Initialization on DOM Load
    document.addEventListener("DOMContentLoaded", () => {
        setupEventListeners();
        checkHealth();
        loadDashboardStats();
        loadStudents();
    });

})();
