import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast } from "../shared/toast.js";

let students = [];
let currentFilter = "All";

function showAddMsg(msg, type) {
  const el = document.getElementById("addMsg");
  el.textContent = msg;
  el.className = `add-msg ${type}`;
  setTimeout(() => {
    el.className = "add-msg";
  }, 3000);
}

function updateStats() {
  const total = students.length;
  const present = students.filter((s) => s.status === "Present").length;
  const absent = students.filter((s) => s.status === "Absent").length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  document.getElementById("sTotal").textContent = total;
  document.getElementById("sPresent").textContent = present;
  document.getElementById("sAbsent").textContent = absent;
  document.getElementById("sPct").textContent = `${pct}%`;

  const dates = [...new Set(students.map((s) => s.date).filter(Boolean))];
  document.getElementById("dateBadge").textContent = dates.length ? dates[0] : "No date";
}

function renderTable() {
  const body = document.getElementById("atBody");
  const list = currentFilter === "All" ? students : students.filter((s) => s.status === currentFilter);

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="6">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No students found.<br/>Add students using the form above.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = list
    .map(
      (s) => `<tr>
      <td><span class="stu-id">${s.student_code}</span></td>
      <td class="stu-name">${s.student_name}</td>
      <td>${String(s.date).slice(0, 10)}</td>
      <td>
        <div class="att-btns">
          <button class="att-btn pre ${s.status === "Present" ? "active" : ""}" onclick="markAttendance('${s.entry_id}','Present')">Pre</button>
          <button class="att-btn abs ${s.status === "Absent" ? "active" : ""}" onclick="markAttendance('${s.entry_id}','Absent')">Abs</button>
        </div>
      </td>
      <td>
        <span class="status-pill ${
          s.status === "Present" ? "sp-present" : s.status === "Absent" ? "sp-absent" : "sp-notmarked"
        }">${s.status}</span>
      </td>
      <td><button class="del-btn" onclick="deleteStudent('${s.entry_id}')">Delete</button></td>
    </tr>`
    )
    .join("");
  updateStats();
}

async function loadStudents() {
  students = await apiRequest("/attendance");
  renderTable();
}

function filterTable(f, btn) {
  currentFilter = f;
  document.querySelectorAll(".filter-btn").forEach((b) => b.classList.remove("active"));
  btn.classList.add("active");
  renderTable();
}

async function markAttendance(entryId, status) {
  const rec = students.find((s) => s.entry_id === entryId);
  if (!rec) return;
  const nextStatus = rec.status === status ? "Not Marked" : status;

  try {
    await apiRequest(`/attendance/${encodeURIComponent(entryId)}`, {
      method: "PATCH",
      body: JSON.stringify({ status: nextStatus })
    });
    await loadStudents();
  } catch (err) {
    showAddMsg(err.message, "error");
  }
}

async function addStudent() {
  const student_code = document.getElementById("aId").value.trim();
  const student_name = document.getElementById("aNm").value.trim();
  const date = document.getElementById("aDt").value;

  if (!student_code || !student_name || !date) {
    showAddMsg("Please fill Student ID, Name and Date.", "error");
    return;
  }

  try {
    await apiRequest("/attendance", {
      method: "POST",
      body: JSON.stringify({ student_code, student_name, date })
    });
    document.getElementById("aId").value = "";
    document.getElementById("aNm").value = "";
    await loadStudents();
    showFixedToast("fixedToast", `${student_name} added to attendance list!`, "#A855F7");
    showAddMsg(`${student_name} added successfully!`, "success");
  } catch (err) {
    showAddMsg(err.message, "error");
  }
}

async function deleteStudent(entryId) {
  const target = students.find((s) => s.entry_id === entryId);
  if (!target) return;
  if (!confirm(`Remove ${target.student_name} from attendance?`)) return;

  try {
    await apiRequest(`/attendance/${encodeURIComponent(entryId)}`, { method: "DELETE" });
    await loadStudents();
    showFixedToast("fixedToast", `${target.student_name} removed.`, "#A32D2D");
  } catch (err) {
    showAddMsg(err.message, "error");
  }
}

window.filterTable = filterTable;
window.markAttendance = markAttendance;
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;

loadStudents().catch((err) => {
  showAddMsg(err.message || "Failed to load attendance.", "error");
});
