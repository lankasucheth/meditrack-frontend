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
    <button onclick="viewAppointments(${patient.id}, '${patient.name}', ${patient.age}, '${patient.phone}')">View Appointments</button>
    <button onclick="openAddAppointment(${patient.id}, '${patient.name}', ${patient.age}, '${patient.phone}')">Add Appointment</button>
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

function openAddAppointment(patientId, patientName, patientAge, patientPhone) {
    const section = document.getElementById("appointment-section");
    const clickedCard = event.target.closest(".patient-card");

    if (currentPatientId === patientId && section.style.display === "block") {
        section.style.display = "none";
        currentPatientId = null;
        return;
    }

    currentPatientId = patientId;
    document.getElementById("selected-patient-name").innerText = patientName;
    section.style.display = "block";
    clickedCard.insertAdjacentElement("afterend", section);

    document.getElementById("appointment-list").innerHTML = "";
    document.getElementById("appointmentDate").min = getTodayLocal();
    document.getElementById("add-appointment-container").style.display = "block";

}

async function viewAppointments(patientId, patientName, patientAge, patientPhone) {
    const section = document.getElementById("appointment-section");
    const clickedCard = event.target.closest(".patient-card");

    if (currentPatientId === patientId && section.style.display === "block") {
        section.style.display = "none";
        currentPatientId = null;
        return;
    }

    currentPatientId = patientId;
    document.getElementById("selected-patient-name").innerText = patientName;
    section.style.display = "block";
    clickedCard.insertAdjacentElement("afterend", section);

    document.getElementById("add-appointment-container").style.display = "none";
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
                <button onclick="toggleInlineEdit(${appt.id})">Edit</button>
                <button onclick="deleteAppointment(${appt.id})">Delete</button>

                <div id="inline-edit-${appt.id}" style="display:none;">
                    <input type="text" id="inline-doctor-${appt.id}" value="${appt.doctorName}">
                    <input type="date" id="inline-date-${appt.id}" value="${appt.appointmentDate}">
                    <input type="text" id="inline-reason-${appt.id}" value="${appt.reason}">
                    <select id="inline-status-${appt.id}">
                        <option value="SCHEDULED" ${appt.status === "SCHEDULED" ? "selected" : ""}>SCHEDULED</option>
                        <option value="COMPLETED" ${appt.status === "COMPLETED" ? "selected" : ""}>COMPLETED</option>
                        <option value="CANCELLED" ${appt.status === "CANCELLED" ? "selected" : ""}>CANCELLED</option>
                    </select>
                    <button onclick="saveInlineEdit(${appt.id})">Save</button>
                </div>
            `;
            container.appendChild(apptDiv);
        });
    } catch (error) {
        console.error("Error fetching appointments:", error);
        document.getElementById("appointment-list").innerText = "Failed to load appointments.";
    }
}



function toggleInlineEdit(id) {
    const form = document.getElementById(`inline-edit-${id}`);
    form.style.display = (form.style.display === "none") ? "block" : "none";
}

async function saveInlineEdit(id) {
    const updatedAppointment = {
        doctorName: document.getElementById(`inline-doctor-${id}`).value,
        appointmentDate: document.getElementById(`inline-date-${id}`).value,
        reason: document.getElementById(`inline-reason-${id}`).value,
        status: document.getElementById(`inline-status-${id}`).value,
        patient: {
            id: currentPatientId
        }
    };
    try {
        const response = await fetch(`${APPOINTMENT_API_URL}/${id}`, {
            method: "PUT",
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(updatedAppointment)
        });
        if (!response.ok) {
            throw new Error("Failed to update appointment");
        }
        await loadAppointments(currentPatientId);
    } catch (error) {
        console.error("Error updating appointment:", error);
        alert("Failed to update appointment.");
    }
}

document.getElementById("appointment-form").addEventListener("submit", async function (event) {
    event.preventDefault();
    const form = event.target;
    const editingId = form.dataset.editingId;
    const newAppointment = {
        doctorName: document.getElementById("doctorName").value,
        appointmentDate: document.getElementById("appointmentDate").value,
        reason: document.getElementById("reason").value,
        status: document.getElementById("status").value,
        patient: {
            id: currentPatientId
        }
    };
    const isEditing = !!editingId;
    const url = isEditing ? `${APPOINTMENT_API_URL}/${editingId}` : APPOINTMENT_API_URL;
    const method = isEditing ? "PUT" : "POST";
    try {
        const response = await fetch(url, {
            method: method,
            headers: {
                "Content-Type": "application/json"
            },
            body: JSON.stringify(newAppointment)
        });
        if (!response.ok) {
            throw new Error("Failed to save appointment");
        }
        form.reset();
        delete form.dataset.editingId;
        form.querySelector("button").innerText = "Add Appointment";
        await loadAppointments(currentPatientId);
    } catch (error) {
        console.error("Error saving appointment:", error);
        alert("Failed to save appointment.");
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