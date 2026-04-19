import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast } from "../shared/toast.js";

let students = [];
let currentFilter = "All";

// ── Helpers ──────────────────────────────────────────────────────────────────

function showAddMsg(msg, type) {
  const el = document.getElementById("addMsg");
  if (!el) return;
  el.textContent = msg;
  el.className = `add-msg ${type}`;
  setTimeout(() => { el.className = "add-msg"; }, 3000);
}

function buildStudentId(inputId = "aId") {
  const num = document.getElementById(inputId).value.trim();
  return num ? "STUD" + num : "";
}

function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  const year = d.getFullYear();
  return !isNaN(d.getTime()) && year >= 2020 && year <= 2026;
}

function checkHoliday(dateStr) {
  if (!dateStr) return false;
  const d = new Date(dateStr);
  if (d.getDay() === 0) return true; // Sunday
  
  const monthDay = dateStr.slice(5, 10);
  const holidays = [
    "01-26", "08-15", "10-02"
  ];
  return holidays.includes(monthDay);
}

function normalizeDate(dateStr) {
  if (!dateStr) return "";
  const d = new Date(dateStr);
  if (isNaN(d.getTime())) return "";
  const y = d.getFullYear();
  const m = String(d.getMonth() + 1).padStart(2, '0');
  const day = String(d.getDate()).padStart(2, '0');
  return `${y}-${m}-${day}`;
}

// ── Render ────────────────────────────────────────────────────────────────────

function updateStats() {
  const total = students.length;
  const present = students.filter((s) => s.status === "Present").length;
  const absent = students.filter((s) => s.status === "Absent").length;
  const pct = total ? Math.round((present / total) * 100) : 0;

  document.getElementById("sTotal").textContent = total;
  document.getElementById("sPresent").textContent = present;
  document.getElementById("sAbsent").textContent = absent;
  document.getElementById("sPct").textContent = `${pct}%`;

  const dates = [...new Set(students.map((s) => normalizeDate(s.date)).filter(Boolean))];
  document.getElementById("dateBadge").textContent = dates.length ? dates[0] : "No date";
}

function renderTable() {
  const dtInput = document.getElementById("aDt");
  const today = new Date().toISOString().slice(0, 10);
  const targetDate = dtInput && dtInput.value ? dtInput.value : today;
  const isCurrentDay = targetDate === today;
  const isTargetHoliday = checkHoliday(targetDate);

  const body = document.getElementById("atBody");

  if (isTargetHoliday) {
    body.innerHTML = `<tr><td colspan="5">
      <div class="empty-state" style="padding: 4rem 2rem;">
        <div class="empty-icon" style="font-size: 3.5rem;">🏖️</div>
        <p style="font-size: 1.1rem; color: #581C87; font-weight: 800; margin-top: 1rem;">
          ${targetDate} is a Holiday!
        </p>
        <p style="color: #6B7280; font-size: 0.9rem;">No attendance required for Sundays or Government Holidays.</p>
      </div>
    </td></tr>`;
    document.getElementById("sTotal").textContent = 0;
    document.getElementById("sPresent").textContent = 0;
    document.getElementById("sAbsent").textContent = 0;
    document.getElementById("sPct").textContent = `0%`;
    document.getElementById("dateBadge").textContent = targetDate;
    return;
  }

  const list = currentFilter === "All" ? students : students.filter((s) => s.status === currentFilter);

  if (!list.length) {
    body.innerHTML = `<tr><td colspan="5">
      <div class="empty-state">
        <div class="empty-icon">📋</div>
        <p>No records found for this date.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = list
    .map((s) => {
      const btnDisabled = !isCurrentDay ? "disabled style='opacity: 0.5; cursor: not-allowed;'" : "";
      return `<tr>
      <td><span class="stu-id">${s.student_code}</span></td>
      <td class="stu-name">${s.student_name}</td>
      <td>${normalizeDate(s.date)}</td>
      <td>
        <div class="att-btns">
          <button class="att-btn pre ${s.status === "Present" ? "active" : ""}" ${btnDisabled} onclick="${isCurrentDay ? `markAttendance('${s.entry_id}','Present')` : ''}">Pre</button>
          <button class="att-btn abs ${s.status === "Absent" ? "active" : ""}" ${btnDisabled} onclick="${isCurrentDay ? `markAttendance('${s.entry_id}','Absent')` : ''}">Abs</button>
        </div>
      </td>
      <td>
        <span class="status-pill ${
          s.status === "Present" ? "sp-present" : s.status === "Absent" ? "sp-absent" : "sp-notmarked"
        }">${s.status}</span>
      </td>
    </tr>`;
    })
    .join("");
  updateStats();
}

// ── Actions ───────────────────────────────────────────────────────────────────

async function loadStudents() {
  const dtInput = document.getElementById("aDt");
  const today = new Date().toISOString().slice(0, 10);
  if (dtInput && !dtInput.value) {
    dtInput.value = today;
  }
  const targetDate = dtInput ? dtInput.value : today;

  const isCurrentDay = targetDate === today;
  const isTargetHoliday = checkHoliday(targetDate);

  let allAttendance = await apiRequest("/attendance");

  if (isCurrentDay && !isTargetHoliday) {
    const allRegisteredStudents = await apiRequest("/students");
    const recordsForDate = allAttendance.filter(r => normalizeDate(r.date) === targetDate);
    const existingCodes = new Set(recordsForDate.map(r => r.student_code));

    let needsReload = false;
    for (const student of allRegisteredStudents) {
      if (!existingCodes.has(student.student_id)) {
        try {
            await apiRequest("/attendance", {
              method: "POST",
              body: JSON.stringify({
                student_code: student.student_id,
                student_name: student.name,
                date: targetDate
              })
            });
            needsReload = true;
        } catch(e) {
            console.error("Auto-populate error:", e);
        }
      }
    }

    if (needsReload) {
      allAttendance = await apiRequest("/attendance");
    }
  }

  // Filter for currently selected date
  students = allAttendance.filter(r => normalizeDate(r.date) === targetDate);

  // Sort numerically
  students.sort((a, b) => {
    const numA = parseInt(a.student_code.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.student_code.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });

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
  const dtInput = document.getElementById("aDt");
  const targetDate = dtInput ? dtInput.value : new Date().toISOString().slice(0, 10);
  
  if (checkHoliday(targetDate)) {
    showAddMsg("Cannot generate list for a holiday.", "error");
    return;
  }

  showAddMsg("Generating list...", "success");

  try {
    const allRegisteredStudents = await apiRequest("/students");
    const existingAttendance = await apiRequest("/attendance");
    const recordsForDate = existingAttendance.filter(r => normalizeDate(r.date) === targetDate);
    const existingCodes = new Set(recordsForDate.map(r => r.student_code));

    let addedCount = 0;
    for (const student of allRegisteredStudents) {
      if (!existingCodes.has(student.student_id)) {
        await apiRequest("/attendance", {
          method: "POST",
          body: JSON.stringify({
            student_code: student.student_id,
            student_name: student.name,
            date: targetDate
          })
        });
        addedCount++;
      }
    }

    await loadStudents();
    if (addedCount > 0) {
        showFixedToast("fixedToast", `${addedCount} students populated for ${targetDate}.`, "#A855F7");
    } else {
        showAddMsg("All students are already populated for this date.", "success");
    }
  } catch (err) {
    showAddMsg(err.message, "error");
  }
}

// ── Input Restrictions ────────────────────────────────────────────────────────

document.getElementById("aDt").addEventListener("change", loadStudents);

// ── Init ──────────────────────────────────────────────────────────────────────

window.filterTable = filterTable;
window.markAttendance = markAttendance;
window.addStudent = addStudent;
window.deleteStudent = deleteStudent;

loadStudents().catch((err) => {
  showAddMsg(err.message || "Failed to load attendance.", "error");
});
