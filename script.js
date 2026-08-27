const API_URL = "http://localhost:3000/students";


// Get students when page loads
window.onload = function () {
    loadStudents();
};


// GET students
function loadStudents() {

    fetch(API_URL)
        .then(response => response.json())
        .then(students => {

            displayStudents(students);

        })
        .catch(error => {
            console.log("Error:", error);
        });
}


// Display students
function displayStudents(students) {

    const table = document.getElementById("studentTable");

    table.innerHTML = "";

    students.forEach(student => {

        const row = `
            <tr>

                <td>${student.id}</td>

                <td>${student.name}</td>

                <td>${student.email}</td>

                <td>${student.phone}</td>

                <td>${student.course}</td>

                <td>${student.age}</td>

                <td>
                    <button class="edit-btn"
                        onclick="editStudent(${student.id})">
                        Edit
                    </button>

                    <button class="delete-btn"
                        onclick="deleteStudent(${student.id})">
                        Delete
                    </button>
                </td>

            </tr>
        `;

        table.innerHTML += row;

    });
}


// ADD student
function addStudent() {

    const student = {

        name: document.getElementById("name").value,

        email: document.getElementById("email").value,

        phone: document.getElementById("phone").value,

        course: document.getElementById("course").value,

        age: document.getElementById("age").value

    };


    if (!student.name || !student.email) {

        alert("Name and Email are required");

        return;
    }


    fetch(API_URL, {

        method: "POST",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(student)

    })

    .then(response => response.json())

    .then(data => {

        alert(data.message);

        clearForm();

        loadStudents();

    })

    .catch(error => {

        console.log("Error:", error);

    });
}


// DELETE student
function deleteStudent(id) {

    if (!confirm("Are you sure you want to delete this student?")) {
        return;
    }


    fetch(`${API_URL}/${id}`, {

        method: "DELETE"

    })

    .then(response => response.json())

    .then(data => {

        alert(data.message);

        loadStudents();

    })

    .catch(error => {

        console.log("Error:", error);

    });
}


// EDIT student
function editStudent(id) {

    const name = prompt("Enter new name:");

    if (!name) {
        return;
    }

    const email = prompt("Enter new email:");

    const phone = prompt("Enter new phone:");

    const course = prompt("Enter new course:");

    const age = prompt("Enter new age:");


    const student = {
        name,
        email,
        phone,
        course,
        age
    };


    fetch(`${API_URL}/${id}`, {

        method: "PUT",

        headers: {
            "Content-Type": "application/json"
        },

        body: JSON.stringify(student)

    })

    .then(response => response.json())

    .then(data => {

        alert(data.message);

        loadStudents();

    })

    .catch(error => {

        console.log("Error:", error);

    });
}


// SEARCH
function searchStudents() {

    const searchValue =
        document.getElementById("search").value.toLowerCase();

    fetch(API_URL)

        .then(response => response.json())

        .then(students => {

            const filtered = students.filter(student =>

                student.name.toLowerCase().includes(searchValue) ||

                student.email.toLowerCase().includes(searchValue) ||

                student.course.toLowerCase().includes(searchValue)

            );

            displayStudents(filtered);

        });
}


// Clear form
function clearForm() {

    document.getElementById("name").value = "";

    document.getElementById("email").value = "";

    document.getElementById("phone").value = "";

    document.getElementById("course").value = "";

    document.getElementById("age").value = "";
}