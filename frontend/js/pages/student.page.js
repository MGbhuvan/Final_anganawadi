import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];
let activeMenuId = null; 

// ── Helpers ──────────────────────────────────────────────────────────────────

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3500);
}

function showModalToast(msg, type) {
  showInlineToast("modalToast", msg, type, 3500);
}

function genderClass(g) {
  return g === "Male" ? "gp-male" : g === "Female" ? "gp-female" : "gp-other";
}

function buildStudentId(inputId = "fId") {
  const num = document.getElementById(inputId).value.trim();
  return num ? "STUD" + num : "";
}

function isValidAadhaar(val) {
  return /^\d{12}$/.test(val);
}

function isValidDate(val) {
  if (!val) return false;
  const d = new Date(val);
  const year = d.getFullYear();
  return !isNaN(d.getTime()) && year >= 2020 && year <= 2026;
}

// ── Stats & Render ────────────────────────────────────────────────────────────

function updateStats() {
  const total = records.length;
  const boys  = records.filter((r) => r.gender === "Male").length;
  const girls = records.filter((r) => r.gender === "Female").length;
  document.getElementById("sTotal").textContent = total;
  document.getElementById("sBoys").textContent  = boys;
  document.getElementById("sGirls").textContent = girls;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function maskAadhaar(val) {
  if (!val) return "—";
  const s = String(val);
  return s.length === 12 ? "XXXX XXXX " + s.slice(8) : s;
}

function renderTable() {
  const body = document.getElementById("stBody");
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="7">
      <div class="empty-state">
        <div class="empty-icon">📚</div>
        <p>No records yet.<br/>Fill the form above and click <strong>Save Record</strong>.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = records
    .map(
      (r) => `<tr>
      <td><span class="stu-id">${r.student_id}</span></td>
      <td class="stu-name">${r.name}</td>
      <td>${r.parent_name || "—"}</td>
      <td>${String(r.dob).slice(0, 10)}</td>
      <td><span class="gender-pill ${genderClass(r.gender)}">${r.gender}</span></td>
      <td>${maskAadhaar(r.aadhaar)}</td>
      <td class="action-cell">
        <button class="menu-btn" id="menuBtn_${r.student_id}"
          onclick="toggleMenu(event, '${r.student_id}')" aria-label="Actions">⋮</button>
        <div class="action-menu" id="menu_${r.student_id}">
          <button class="update-opt" onclick="openUpdate('${r.student_id}')">✏️ Update</button>
          <button class="delete-opt" onclick="deleteRecord('${r.student_id}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
  updateStats();
}

// ── Action Menu ───────────────────────────────────────────────────────────────

function closeAllMenus() {
  document.querySelectorAll(".action-menu.open").forEach((m) => m.classList.remove("open"));
  activeMenuId = null;
}

window.toggleMenu = function (event, studentId) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const menu = document.getElementById(`menu_${studentId}`);
  if (!menu) return;
  const isOpen = menu.classList.contains("open");
  closeAllMenus();
  
  if (!isOpen) {
    menu.classList.add("open");
    activeMenuId = studentId;

    // Dynamic fixed positioning to break out of the table container
    const rect = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.margin = "0";
    
    // Align menu's right edge with button's right edge
    menu.style.left = "auto";
    menu.style.right = `${window.innerWidth - rect.right}px`;

    // Pop upwards if there's not enough space below
    const spaceBelow = window.innerHeight - rect.bottom;
    if (spaceBelow < 120) {
      menu.style.top = "auto";
      menu.style.bottom = `${window.innerHeight - rect.top + 5}px`;
    } else {
      menu.style.bottom = "auto";
      menu.style.top = `${rect.bottom + 5}px`;
    }
  }
};

document.addEventListener("click", () => closeAllMenus());
document.addEventListener("scroll", closeAllMenus, true);

// ── Load / Save / Delete ──────────────────────────────────────────────────────

async function loadRecords() {
  records = await apiRequest("/students");
  
  // Sort numerically based on the numeric portion of student_id (e.g., 'STUD002' -> 2)
  records.sort((a, b) => {
    const numA = parseInt(a.student_id.replace(/\D/g, ""), 10) || 0;
    const numB = parseInt(b.student_id.replace(/\D/g, ""), 10) || 0;
    return numA - numB;
  });
  
  renderTable();
}

async function saveRecord() {
  const student_id  = buildStudentId("fId");
  const name        = document.getElementById("fNm").value.trim();
  const parent_name = document.getElementById("fPn").value.trim();
  const dob         = document.getElementById("fDob").value;
  const gender      = document.getElementById("fGn").value;
  const aadhaar     = document.getElementById("fAadhaar").value.trim();
  const address     = document.getElementById("fAddr").value.trim();

  // Validate presence
  const fields = { student_id, name, parent_name, dob, gender, aadhaar, address };
  for (const [key, val] of Object.entries(fields)) {
    if (!val) {
      const label = key.replace("_", " ").toUpperCase();
      showToast(`Field '${label}' is required.`, "error");
      return;
    }
  }

  if (!isValidAadhaar(aadhaar)) {
    showToast("Aadhar Card Number must be exactly 12 digits.", "error");
    return;
  }

  if (!isValidDate(dob)) {
    showToast("Date of Birth must be between 2020 and 2026.", "error");
    return;
  }

  console.log("DEBUG: Sending student registration payload:", fields);

  try {
    await apiRequest("/students", {
      method: "POST",
      body: JSON.stringify(fields)
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${name} saved!`, "#138808");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fId", "fNm", "fPn", "fDob", "fAadhaar", "fAddr"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fGn").value = "";
}

async function deleteRecord(studentId) {
  closeAllMenus();
  const target = records.find((r) => r.student_id === studentId);
  if (!target) return;
  if (!confirm(`Delete record for ${target.name}?`)) return;

  try {
    await apiRequest(`/students/${encodeURIComponent(studentId)}`, { method: "DELETE" });
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${target.name} deleted.`, "#A32D2D");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ── Update Modal ──────────────────────────────────────────────────────────────

window.openUpdate = function (studentId) {
  closeAllMenus();
  const r = records.find((rec) => rec.student_id === studentId);
  if (!r) return;

  document.getElementById("mId").value      = r.student_id;
  document.getElementById("mNm").value      = r.name || "";
  document.getElementById("mPn").value      = r.parent_name || "";
  document.getElementById("mGn").value      = r.gender || "";
  document.getElementById("mDob").value     = String(r.dob).slice(0, 10);
  document.getElementById("mAadhaar").value = r.aadhaar || "";
  document.getElementById("mAddr").value    = r.address || "";
  
  document.getElementById("updateModal").classList.add("open");
};

window.closeModal = function () {
  document.getElementById("updateModal").classList.remove("open");
};

window.submitUpdate = async function () {
  const student_id  = document.getElementById("mId").value;
  const name        = document.getElementById("mNm").value.trim();
  const parent_name = document.getElementById("mPn").value.trim();
  const gender      = document.getElementById("mGn").value;
  const dob         = document.getElementById("mDob").value;
  const aadhaar     = document.getElementById("mAadhaar").value.trim();
  const address     = document.getElementById("mAddr").value.trim();

  const fields = { name, parent_name, gender, dob, aadhaar, address };
  for (const [key, val] of Object.entries(fields)) {
    if (!val) {
      showModalToast(`The field '${key.replace("_", " ")}' is required.`, "error");
      return;
    }
  }

  if (!isValidAadhaar(aadhaar)) {
    showModalToast("Aadhar Card Number must be exactly 12 digits.", "error");
    return;
  }

  if (!isValidDate(dob)) {
    showModalToast("Date of Birth must be between 2020 and 2026.", "error");
    return;
  }

  try {
    await apiRequest(`/students/${encodeURIComponent(student_id)}`, {
      method: "PUT",
      body: JSON.stringify(fields)
    });
    closeModal();
    await loadRecords();
    showFixedToast("fixedToast", `Record updated successfully!`, "#378ADD");
  } catch (err) {
    showModalToast(err.message, "error");
  }
};

// ── Input Restrictions ────────────────────────────────────────────────────────

document.getElementById("fId").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});
document.getElementById("fAadhaar").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 12);
});
document.getElementById("mAadhaar").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "").slice(0, 12);
});

// ── Expose globals & boot ─────────────────────────────────────────────────────

window.saveRecord    = saveRecord;
window.clearForm     = clearForm;
window.deleteRecord  = deleteRecord;

loadRecords().catch((err) => {
  showToast(err.message || "Failed to load data.", "error");
});
