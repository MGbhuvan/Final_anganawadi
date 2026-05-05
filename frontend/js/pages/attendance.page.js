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
  if (typeof dateStr === 'string' && dateStr.length >= 10) {
    const prefix = dateStr.slice(0, 10);
    if (/^\d{4}-\d{2}-\d{2}$/.test(prefix)) return prefix;
  }
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
  if (!Array.isArray(allAttendance)) allAttendance = [];

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

function printAttendance() {
  const dtInput = document.getElementById("aDt");
  const targetDate = dtInput ? dtInput.value : new Date().toISOString().slice(0, 10);
  const dateObj = new Date(targetDate);
  const formattedDate = dateObj.toLocaleDateString('en-US', { weekday: 'long', year: 'numeric', month: 'long', day: 'numeric' });

  if (!students.length) {
    alert("No records to print for this date.");
    return;
  }

  let printHtml = `
  <!DOCTYPE html>
  <html>
  <head>
      <title>Attendance Report - ${formattedDate}</title>
      <style>
          @page { size: A4; margin: 20mm; }
          body { font-family: 'Arial', sans-serif; color: #111; }
          .header { text-align: center; margin-bottom: 30px; border-bottom: 2px solid #ddd; padding-bottom: 10px; }
          h1 { margin: 0 0 10px 0; font-size: 24px; text-transform: uppercase; letter-spacing: 2px; }
          .date-display { font-size: 16px; font-weight: bold; color: #555; }
          .stats { display: flex; justify-content: space-around; margin-bottom: 20px; font-weight: bold; font-size: 14px; }
          table { width: 100%; border-collapse: collapse; margin-top: 10px; }
          th, td { border: 1px solid #000; padding: 10px; text-align: left; font-size: 14px; }
          th { background-color: #f0f0f0; }
          .status-Present { color: #138808; font-weight: bold; }
          .status-Absent { color: #D32F2F; font-weight: bold; }
          .status-Not { color: #F57C00; font-weight: bold; }
          .footer { margin-top: 50px; text-align: right; font-size: 14px; font-style: italic; }
      </style>
  </head>
  <body>
      <div class="header">
          <h1>Student Attendance Report</h1>
          <div class="date-display">${formattedDate}</div>
      </div>
      
      <div class="stats">
          <span>Total: ${students.length}</span>
          <span style="color:#138808">Present: ${students.filter(s => s.status === 'Present').length}</span>
          <span style="color:#D32F2F">Absent: ${students.filter(s => s.status === 'Absent').length}</span>
      </div>

      <table>
          <thead>
              <tr>
                  <th>S.No</th>
                  <th>Student ID</th>
                  <th>Student Name</th>
                  <th>Attendance Status</th>
              </tr>
          </thead>
          <tbody>
  `;

  students.forEach((s, index) => {
      const sClass = s.status === 'Present' ? 'status-Present' : (s.status === 'Absent' ? 'status-Absent' : 'status-Not');
      printHtml += `
          <tr>
              <td>${index + 1}</td>
              <td>${s.student_code}</td>
              <td>${s.student_name}</td>
              <td class="${sClass}">${s.status}</td>
          </tr>
      `;
  });

  printHtml += `
          </tbody>
      </table>
      
      <div class="footer">
          <p>Authorized Signature: ______________________</p>
      </div>
  </body>
  </html>
  `;

  const printWindow = window.open('', '_blank');
  if (!printWindow) { alert("Please allow popups to print the report."); return; }
  printWindow.document.write(printHtml);
  printWindow.document.close();
  printWindow.focus();
  setTimeout(() => {
      printWindow.print();
      printWindow.close();
  }, 250);
}

// ── Input Restrictions ────────────────────────────────────────────────────────

document.getElementById("aDt").addEventListener("change", loadStudents);

// ── Monthly Attendance ────────────────────────────────────────────────────────

let monthlyData = null; // stores last loaded monthly data

function switchTab(tab) {
  const daily   = document.getElementById("dailyPanel");
  const monthly = document.getElementById("monthlyPanel");
  const tDaily  = document.getElementById("tabDaily");
  const tMonthly= document.getElementById("tabMonthly");

  if (tab === "daily") {
    daily.style.display   = "block";
    monthly.style.display = "none";
    tDaily.classList.add("active");
    tMonthly.classList.remove("active");
  } else {
    daily.style.display   = "none";
    monthly.style.display = "block";
    tDaily.classList.remove("active");
    tMonthly.classList.add("active");
  }
}

function isSunday(year, mon, day) {
  return new Date(year, mon - 1, day).getDay() === 0;
}

const GOVT_HOLIDAYS = ["01-26", "08-15", "10-02"];
function isHoliday(year, mon, day) {
  if (isSunday(year, mon, day)) return true;
  const md = `${String(mon).padStart(2,'0')}-${String(day).padStart(2,'0')}`;
  return GOVT_HOLIDAYS.includes(md);
}

async function loadMonthlyAttendance() {
  const monthInput = document.getElementById("mMonth");
  const month = monthInput ? monthInput.value : "";
  if (!month) { alert("Please select a month."); return; }

  const container = document.getElementById("monthlyTableContainer");
  container.innerHTML = `<div class="monthly-empty">Loading...</div>`;

  try {
    const data = await apiRequest(`/attendance/monthly?month=${encodeURIComponent(month)}`);
    monthlyData = data;
    renderMonthlyTable(data);
  } catch(err) {
    container.innerHTML = `<div class="monthly-empty" style="color:#E24B4A">${err.message}</div>`;
  }
}

function renderMonthlyTable(data) {
  const container = document.getElementById("monthlyTableContainer");
  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const title = `${monthNames[data.month_num - 1]} ${data.year}`;
  document.getElementById("monthlyTitle").textContent = `Attendance Register — ${title}`;

  if (!data.students || data.students.length === 0) {
    container.innerHTML = `<div class="monthly-empty">No attendance records found for ${title}.</div>`;
    return;
  }

  // Header
  let html = `<table><thead><tr>
    <th class="col-id" style="text-align:left;padding-left:14px;">ID</th>
    <th class="col-name">Student Name</th>`;
  data.days.forEach(d => {
    const holiday = isHoliday(data.year, data.month_num, d);
    const style = holiday ? 'style="background:rgba(192,132,252,0.18);"' : '';
    html += `<th ${style}>${d}</th>`;
  });
  html += `<th class="col-total">P</th><th class="col-total" style="color:#E24B4A;">A</th></tr></thead><tbody>`;

  // Rows
  data.students.forEach(stu => {
    let presentCount = 0, absentCount = 0;
    html += `<tr><td class="col-id">${stu.student_code}</td><td class="col-name">${stu.student_name}</td>`;
    data.days.forEach(d => {
      const holiday = isHoliday(data.year, data.month_num, d);
      const status  = stu.attendance[d];
      if (holiday) {
        html += `<td class="cell-h">H</td>`;
      } else if (status === "Present") {
        presentCount++;
        html += `<td class="cell-p">P</td>`;
      } else if (status === "Absent") {
        absentCount++;
        html += `<td class="cell-a">A</td>`;
      } else {
        html += `<td class="cell-nm">-</td>`;
      }
    });
    html += `<td class="col-total">${presentCount}</td>
             <td class="col-total" style="color:#E24B4A;">${absentCount}</td></tr>`;
  });

  html += `</tbody></table>`;
  container.innerHTML = html;
}

function printMonthlyAttendance() {
  if (!monthlyData) { alert("Please load a month first."); return; }
  const data = monthlyData;
  const monthNames = ["January","February","March","April","May","June",
                      "July","August","September","October","November","December"];
  const title = `${monthNames[data.month_num - 1]} ${data.year}`;

  if (!data.students || data.students.length === 0) {
    alert("No records to print."); return;
  }

  // Style constants for print header
  const COL_ID_STYLE   = "border:1px solid #555;padding:4px 6px;font-size:8pt;text-align:left;white-space:nowrap;background:#1e1b4b;color:#fff;";
  const COL_NAME_STYLE = "border:1px solid #555;padding:4px 8px;font-size:8pt;text-align:left;min-width:130px;background:#1e1b4b;color:#fff;";
  const DAY_TH_STYLE   = "border:1px solid #555;padding:4px 3px;font-size:7.5pt;text-align:center;min-width:18px;background:#1e1b4b;color:#fff;";

  // Build header row
  let headCols = `<th style="${COL_ID_STYLE}">ID</th><th style="${COL_NAME_STYLE}">Student Name</th>`;
  data.days.forEach(d => {
    const h = isHoliday(data.year, data.month_num, d);
    headCols += `<th style="${DAY_TH_STYLE}${h ? 'background:#ede9fe;' : ''}">${d}</th>`;
  });
  headCols += `<th style="${DAY_TH_STYLE}color:#7C3AED;">P</th>
               <th style="${DAY_TH_STYLE}color:#D32F2F;">A</th>`;

  // Rebuild with correct style refs
  let headColsFixed = `<th style="${COL_ID_STYLE}">ID</th><th style="${COL_NAME_STYLE}">Student Name</th>`;
  data.days.forEach(d => {
    const h = isHoliday(data.year, data.month_num, d);
    headColsFixed += `<th style="${DAY_TH_STYLE}${h ? 'background:#5b21b6;' : ''}">${d}</th>`;
  });
  headColsFixed += `<th style="${DAY_TH_STYLE}">P</th><th style="${DAY_TH_STYLE}">A</th>`;

  // Rows
  let rowsHtml = "";
  data.students.forEach((stu, idx) => {
    let p = 0, a = 0;
    let cells = "";
    const rowBg = idx % 2 === 0 ? "#fff" : "#f9f5ff";
    const TD = `border:1px solid #ccc;padding:3px;font-size:7.5pt;text-align:center;`;
    data.days.forEach(d => {
      const h = isHoliday(data.year, data.month_num, d);
      const s = stu.attendance[d];
      if (h) {
        cells += `<td style="${TD}background:#ede9fe;color:#7c3aed;">H</td>`;
      } else if (s === "Present") {
        p++; cells += `<td style="${TD}color:#138808;font-weight:bold;">P</td>`;
      } else if (s === "Absent") {
        a++; cells += `<td style="${TD}color:#D32F2F;font-weight:bold;">A</td>`;
      } else {
        cells += `<td style="${TD}color:#bbb;">-</td>`;
      }
    });
    rowsHtml += `<tr style="background:${rowBg}">
      <td style="border:1px solid #ccc;padding:3px 6px;font-size:7.5pt;color:#5b21b6;font-weight:bold;">${stu.student_code}</td>
      <td style="border:1px solid #ccc;padding:3px 8px;font-size:8pt;font-weight:600;white-space:nowrap;">${stu.student_name}</td>
      ${cells}
      <td style="border:1px solid #ccc;padding:3px;font-size:7.5pt;text-align:center;font-weight:bold;color:#7C3AED;">${p}</td>
      <td style="border:1px solid #ccc;padding:3px;font-size:7.5pt;text-align:center;font-weight:bold;color:#D32F2F;">${a}</td>
    </tr>`;
  });

  const printHtml = `<!DOCTYPE html><html><head><title>Attendance Register — ${title}</title>
  <style>
    @page { size: A4 landscape; margin: 12mm 10mm; }
    body { font-family: Arial, sans-serif; color: #111; }
    h2 { text-align:center; font-size:14pt; margin:0 0 2px; letter-spacing:1px; }
    .sub { text-align:center; font-size:9pt; color:#555; margin-bottom:10px; }
    .legend { text-align:right; font-size:7.5pt; margin-bottom:6px; color:#333; }
    table { width:100%; border-collapse:collapse; }
    .footer { margin-top:24px; display:flex; justify-content:space-between; font-size:8.5pt; }
  </style></head><body>
  <h2>POSHAN ABHIYAN — Monthly Attendance Register</h2>
  <div class="sub">${title}</div>
  <div class="legend">P = Present &nbsp;|&nbsp; A = Absent &nbsp;|&nbsp; H = Holiday/Sunday &nbsp;|&nbsp; – = Not Marked</div>
  <table><thead><tr>${headColsFixed}</tr></thead><tbody>${rowsHtml}</tbody></table>
  <div class="footer">
    <span>Total Students: ${data.students.length}</span>
    <span>Authorized Signature: ______________________</span>
  </div>
  </body></html>`;

  const w = window.open('', '_blank');
  if (!w) { alert("Please allow popups to print the report."); return; }
  w.document.write(printHtml);
  w.document.close();
  w.focus();
  setTimeout(() => { w.print(); w.close(); }, 350);
}

// ── Init ──────────────────────────────────────────────────────────────────────

// Opens Monthly View tab pre-loaded with the month of the currently selected date
function viewMonthlyFromDate() {
  const dtInput = document.getElementById("aDt");
  const dateVal = dtInput && dtInput.value ? dtInput.value : new Date().toISOString().slice(0, 10);
  // Extract YYYY-MM from the date
  const month = dateVal.slice(0, 7);

  // Set the month picker in the monthly panel
  const mInput = document.getElementById("mMonth");
  if (mInput) mInput.value = month;

  // Switch to monthly tab
  switchTab('monthly');

  // Auto-load the register
  loadMonthlyAttendance();
}

window.filterTable            = filterTable;
window.markAttendance         = markAttendance;
window.addStudent             = addStudent;
window.printAttendance        = printAttendance;
window.switchTab              = switchTab;
window.loadMonthlyAttendance  = loadMonthlyAttendance;
window.printMonthlyAttendance = printMonthlyAttendance;
window.viewMonthlyFromDate    = viewMonthlyFromDate;

// Default month picker to current month
(function initMonthPicker() {
  const now = new Date();
  const y   = now.getFullYear();
  const m   = String(now.getMonth() + 1).padStart(2, '0');
  const el  = document.getElementById("mMonth");
  if (el) el.value = `${y}-${m}`;
})();

loadStudents().catch((err) => {
  showAddMsg(err.message || "Failed to load attendance.", "error");
});
