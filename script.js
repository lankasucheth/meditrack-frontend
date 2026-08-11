const API_BASE_URL = "http://localhost:8080/api/patients";
const APPOINTMENT_API_URL = "http://localhost:8080/api/appointments";
let currentPatientId = null;

function getTodayLocal() {
    const d = new Date();
    const year = d.getFullYear();
    const month = String(d.getMonth() + 1).padStart(2, '0');
    const day = String(d.getDate()).padStart(2, '0');
    return `${year}-${month}-${day}`;
}

document.getElementById("appointmentDate").addEventListener("input", function () {
    const parts = this.value.split("-");
    if (parts[0] && parts[0].length > 4) {
        parts[0] = parts[0].slice(0, 4);
        this.value = parts.join("-");
    }
});
// ---------- PATIENTS ----------

async function loadPatients() {
    try {
        const response = await fetch(API_BASE_URL);
        const patients = await response.json();
        const container = document.getElementById("patient-list");
        container.innerHTML = "";
        patients.forEach(patient => {
            const patientDiv = document.createElement("div");
            patientDiv.className = "patient-card";
            patientDiv.innerHTML = `
    <strong>${patient.name}</strong> (Age: ${patient.age})<br>
    Phone: ${patient.phone}<br>
    <button onclick="deletePatient(${patient.id})">Delete</button>
    <button onclick="startEdit(${patient.id}, '${patient.name}', ${patient.age}, '${patient.phone}')">Edit</button>
    <button onclick="viewAppointments(${patient.id}, '${patient.name}')">View Appointments</button>
    <button onclick="openAddAppointment(${patient.id}, '${patient.name}')">Add Appointment</button>
`;
            container.appendChild(patientDiv);
        });
    } catch (error) {
        console.error("Error fetching patients:", error);
        document.getElementById("patient-list").innerText = "Failed to load patients.";
    }
}

async function deletePatient(id) {
    if (!confirm("Are you sure you want to delete this patient?")) {
        return;
    }
    try {
        const response = await fetch(`${API_BASE_URL}/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) {
            throw new Error("Delete failed");
        }
        loadPatients();
    } catch (error) {
        console.error("Error deleting patient:", error);
        alert("Failed to delete patient. They may have existing appointments.");
    }
}

function startEdit(id, name, age, phone) {
    document.getElementById("name").value = name;
    document.getElementById("age").value = age;
    document.getElementById("phone").value = phone;
    const form = document.getElementById("patient-form");
    form.dataset.editingId = id;
    const button = form.querySelector("button");
    button.innerText = "Update Patient";
}

document.getElementById("patient-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const editingId = form.dataset.editingId;
    const patientData = {
        name: document.getElementById("name").value,
        age: parseInt(document.getElementById("age").value),
        phone: document.getElementById("phone").value
    };
    const isEditing = !!editingId;
    const url = isEditing ? `${API_BASE_URL}/${editingId}` : API_BASE_URL;
    const method = isEditing ? "PUT" : "POST";
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(patientData)
        });
        if (!response.ok) {
            throw new Error("Request failed");
        }
        form.reset();
        delete form.dataset.editingId;
        form.querySelector("button").innerText = "Add Patient";
        loadPatients();
    } catch (error) {
        console.error("Error saving patient:", error);
        alert("Failed to save patient.");
    }
});

// ---------- APPOINTMENTS ----------

function openAddAppointment(patientId, patientName) {
    currentPatientId = patientId;
    document.getElementById("selected-patient-name").innerText = patientName;

    const section = document.getElementById("appointment-section");
    section.style.display = "block";

    const clickedCard = event.target.closest(".patient-card");
    clickedCard.insertAdjacentElement("afterend", section);

    document.getElementById("appointment-list").innerHTML = "";
    document.getElementById("appointmentDate").min = getTodayLocal();
}

async function viewAppointments(patientId, patientName) {
    currentPatientId = patientId;
    document.getElementById("selected-patient-name").innerText = patientName;

    const section = document.getElementById("appointment-section");
    section.style.display = "block";

    const clickedCard = event.target.closest(".patient-card");
    clickedCard.insertAdjacentElement("afterend", section);

    await loadAppointments(patientId);
}

async function loadAppointments(patientId) {
    try {
        const response = await fetch(`${APPOINTMENT_API_URL}/patient/${patientId}`);
        const appointments = await response.json();
        const container = document.getElementById("appointment-list");
        container.innerHTML = "";
        if (appointments.length === 0) {
            container.innerText = "No appointments yet.";
            return;
        }
        appointments.forEach(appt => {
            const apptDiv = document.createElement("div");
            apptDiv.className = "appointment-card";
            apptDiv.innerHTML = `
                Dr. ${appt.doctorName} — ${appt.appointmentDate}<br>
                Reason: ${appt.reason} | Status: ${appt.status}<br>
                <button onclick="deleteAppointment(${appt.id})">Delete</button>
            `;
            container.appendChild(apptDiv);
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        document.getElementById("appointment-list").innerText = "Failed to load appointments.";
    }
}

document.getElementById("appointment-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const newAppointment = {
        doctorName: document.getElementById("doctorName").value,
        appointmentDate: document.getElementById("appointmentDate").value,
        reason: document.getElementById("reason").value,
        status: document.getElementById("status").value,
        patient: {
            id: currentPatientId
        }
    };
    try {
        const response = await fetch(APPOINTMENT_API_URL, {
            method: "POST",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newAppointment)
        });
        if (!response.ok) {
            throw new Error("Failed to add appointment");
        }
        document.getElementById("appointment-form").reset();
        await loadAppointments(currentPatientId);
    } catch (error) {
        console.error("Error adding appointment:", error);
        alert("Failed to add appointment.");
    }
});

async function deleteAppointment(id) {
    if (!confirm("Delete this appointment?")) {
        return;
    }
    try {
        const response = await fetch(`${APPOINTMENT_API_URL}/${id}`, {
            method: "DELETE"
        });
        if (!response.ok) {
            throw new Error("Delete failed");
        }
        await loadAppointments(currentPatientId);
    } catch (error) {
        console.error("Error deleting appointment:", error);
        alert("Failed to delete appointment.");
    }
}

// ---------- INITIAL LOAD ----------

loadPatients();