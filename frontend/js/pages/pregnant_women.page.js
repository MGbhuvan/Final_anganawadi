import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];
let deleteTargetPwId = null;
let openMenuPwId = null;

const DATE_MIN = "2020-01-01";
const DATE_MAX = "2026-12-31";

function isValidDate(dateStr) {
  if (!dateStr) return false;
  const year = parseInt(dateStr.split("-")[0], 10);
  return year >= 2020 && year <= 2026;
}

function isValidPwId(id) {
  return /^PW\d+$/.test(id);
}

function isPwIdDuplicate(id, excludePwId = null) {
  return records.some((r) => r.pw_id === id && r.pw_id !== excludePwId);
}

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3500);
}

function updateStats() {
  const total = records.length;
  const delivered = records.filter((r) => r.status === "Delivered").length;
  document.getElementById("sTotal").textContent = total;
  document.getElementById("sDelivered").textContent = delivered;
  document.getElementById("sPending").textContent = total - delivered;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function pillClass(status) {
  return status === "Delivered" ? "pill-d" : "pill-p";
}

function maskAadhaar(aadhaar) {
  if (!aadhaar || aadhaar.length < 4) return aadhaar;
  return `XXXX-XXXX-${aadhaar.slice(-4)}`;
}

function toggleMenu(pwId, event) {
  event.stopPropagation();
  const menu = document.getElementById(`dots-menu-${pwId}`);
  if (!menu) return;
  if (openMenuPwId && openMenuPwId !== pwId) {
    const prev = document.getElementById(`dots-menu-${openMenuPwId}`);
    if (prev) prev.classList.remove("open");
  }
  menu.classList.toggle("open");
  openMenuPwId = menu.classList.contains("open") ? pwId : null;
}

document.addEventListener("click", () => {
  if (!openMenuPwId) return;
  const menu = document.getElementById(`dots-menu-${openMenuPwId}`);
  if (menu) menu.classList.remove("open");
  openMenuPwId = null;
});

function promptDelete(pwId) {
  const target = records.find((r) => r.pw_id === pwId);
  if (!target) return;
  deleteTargetPwId = pwId;
  document.getElementById(
    "confirmSub"
  ).textContent = `Delete record for "${target.name}" (ID: ${target.pw_id})? This cannot be undone.`;
  document.getElementById("deleteOverlay").classList.add("show");
}

function closeDeleteOverlay() {
  deleteTargetPwId = null;
  document.getElementById("deleteOverlay").classList.remove("show");
}

async function confirmDelete() {
  if (!deleteTargetPwId) return;
  const target = records.find((r) => r.pw_id === deleteTargetPwId);
  if (!target) return;
  try {
    await apiRequest(`/pregnant-women/${encodeURIComponent(deleteTargetPwId)}`, { method: "DELETE" });
    await loadRecords();
    closeDeleteOverlay();
    showFixedToast("fixedToast", `Record for ${target.name} deleted.`, "#B91C1C");
  } catch (err) {
    showFixedToast("fixedToast", err.message, "#B91C1C");
  }
}

function renderTable() {
  const body = document.getElementById("pwBody");
  updateStats();
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-icon">🤰</div>
        <p>No records yet.<br/>Fill the form above and click <strong>Save Record</strong>.</p>
      </div>
    </td></tr>`;
    return;
  }

  body.innerHTML = records
    .map(
      (r) => `<tr id="row-${r.pw_id}">
      <td><span class="pw-id">${r.pw_id}</span></td>
      <td class="pw-name">${r.name}</td>
      <td style="text-align:center;">${r.age}</td>
      <td>${maskAadhaar(r.aadhaar)}</td>
      <td>${r.address}</td>
      <td>+91 ${r.phone}</td>
      <td><span class="pill ${pillClass(r.status)}">${r.status}</span></td>
      <td>${String(r.registration_date).slice(0, 10)}</td>
      <td>
        <div class="action-cell">
          <button class="update-btn" onclick="startEdit('${r.pw_id}')">✏️ Update</button>
          <div style="position:relative;">
            <button class="dots-btn" onclick="toggleMenu('${r.pw_id}', event)" title="More options">⋯</button>
            <div class="dots-menu" id="dots-menu-${r.pw_id}">
              <button class="dots-menu-item delete-item" onclick="promptDelete('${r.pw_id}')">🗑️ Delete</button>
            </div>
          </div>
        </div>
      </td>
    </tr>`
    )
    .join("");
}

function startEdit(pwId) {
  const r = records.find((x) => x.pw_id === pwId);
  const row = document.getElementById(`row-${pwId}`);
  if (!r || !row) return;
  row.classList.add("editing-row");

  row.innerHTML = `
    <td><input class="edit-input" id="e-pwId-${pwId}" value="${r.pw_id}" style="min-width:70px;" maxlength="10"/></td>
    <td><input class="edit-input" id="e-name-${pwId}" value="${r.name}" style="min-width:100px;"/></td>
    <td><input class="edit-input" id="e-age-${pwId}" type="number" min="18" max="50" value="${r.age}" style="min-width:55px;"/></td>
    <td><input class="edit-input" id="e-aadhaar-${pwId}" value="${r.aadhaar}" maxlength="12" style="min-width:120px;"/></td>
    <td><input class="edit-input" id="e-addr-${pwId}" value="${r.address}" style="min-width:130px;"/></td>
    <td>
      <div style="display:flex;align-items:center;gap:4px;">
        <span style="font-size:0.82rem;font-weight:700;color:var(--green);">+91</span>
        <input class="edit-input" id="e-phone-${pwId}" value="${r.phone}" maxlength="10" style="min-width:90px;"/>
      </div>
    </td>
    <td>
      <select class="edit-select" id="e-status-${pwId}">
        <option value="Pending" ${r.status === "Pending" ? "selected" : ""}>Pending</option>
        <option value="Delivered" ${r.status === "Delivered" ? "selected" : ""}>Delivered</option>
      </select>
    </td>
    <td><input class="edit-input" id="e-date-${pwId}" type="date" value="${String(r.registration_date).slice(0, 10)}" min="${DATE_MIN}" max="${DATE_MAX}" style="min-width:120px;"/></td>
    <td style="white-space:nowrap;">
      <button class="save-row-btn" onclick="saveEdit('${pwId}')">💾 Save</button>
      <button class="cancel-row-btn" onclick="renderTable()">Cancel</button>
    </td>
  `;
}

async function saveEdit(pwId) {
  const nextPwId = document.getElementById(`e-pwId-${pwId}`).value.trim().toUpperCase();
  const name = document.getElementById(`e-name-${pwId}`).value.trim();
  const age = parseInt(document.getElementById(`e-age-${pwId}`).value, 10);
  const aadhaar = document.getElementById(`e-aadhaar-${pwId}`).value.trim();
  const address = document.getElementById(`e-addr-${pwId}`).value.trim();
  const phone = document.getElementById(`e-phone-${pwId}`).value.trim();
  const status = document.getElementById(`e-status-${pwId}`).value;
  const registration_date = document.getElementById(`e-date-${pwId}`).value;

  if (!nextPwId || !name || !aadhaar || !address || !phone || !status || !registration_date) {
    showFixedToast("fixedToast", "Please fill all fields!", "#A32D2D");
    return;
  }
  if (nextPwId !== pwId) {
    showFixedToast("fixedToast", "PW ID cannot be changed during update.", "#A32D2D");
    return;
  }
  if (!isValidPwId(nextPwId)) {
    showFixedToast("fixedToast", 'PW ID must start with "PW" followed by numbers.', "#A32D2D");
    return;
  }
  if (isPwIdDuplicate(nextPwId, pwId)) {
    showFixedToast("fixedToast", `PW ID "${nextPwId}" already exists.`, "#A32D2D");
    return;
  }
  if (!Number.isFinite(age) || age < 18 || age > 50) {
    showFixedToast("fixedToast", "Age must be between 18 and 50.", "#A32D2D");
    return;
  }
  if (!/^\d{12}$/.test(aadhaar)) {
    showFixedToast("fixedToast", "Aadhaar must be exactly 12 digits.", "#A32D2D");
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showFixedToast("fixedToast", "Phone must be 10 digits starting with 6-9.", "#A32D2D");
    return;
  }
  if (!isValidDate(registration_date)) {
    showFixedToast("fixedToast", "Date must be between 2020 and 2026.", "#A32D2D");
    return;
  }

  try {
    await apiRequest(`/pregnant-women/${encodeURIComponent(pwId)}`, {
      method: "PATCH",
      body: JSON.stringify({
        pw_id: pwId,
        name,
        age,
        aadhaar,
        address,
        phone,
        status,
        registration_date
      })
    });
    await loadRecords();
    showFixedToast("fixedToast", `Record updated for ${name}!`, "#138808");
  } catch (err) {
    showFixedToast("fixedToast", err.message, "#A32D2D");
  }
}

async function loadRecords() {
  records = await apiRequest("/pregnant-women");
  renderTable();
}

async function saveRecord() {
  const pw_id = document.getElementById("fPwId").value.trim().toUpperCase();
  const name = document.getElementById("fName").value.trim();
  const age = document.getElementById("fAge").value.trim();
  const aadhaar = document.getElementById("fAadhaar").value.trim();
  const phone = document.getElementById("fPhone").value.trim();
  const address = document.getElementById("fAddr").value.trim();
  const registration_date = document.getElementById("fDate").value;
  const status = document.getElementById("fStatus").value;

  if (!pw_id || !name || !age || !aadhaar || !phone || !address || !registration_date || !status) {
    showToast("Please fill in all fields before saving.", "error");
    return;
  }
  if (!isValidPwId(pw_id)) {
    showToast('PW ID must start with "PW" followed by numbers (e.g. PW001).', "error");
    return;
  }
  if (isPwIdDuplicate(pw_id)) {
    showToast(`PW ID "${pw_id}" already exists. Use a unique ID.`, "error");
    return;
  }
  if (isNaN(age) || parseInt(age, 10) < 18 || parseInt(age, 10) > 50) {
    showToast("Please enter a valid age between 18 and 50.", "error");
    return;
  }
  if (!/^\d{12}$/.test(aadhaar)) {
    showToast("Aadhaar Card Number must be exactly 12 digits.", "error");
    return;
  }
  if (!/^[6-9]\d{9}$/.test(phone)) {
    showToast("Phone must be 10 digits and start with 6, 7, 8, or 9.", "error");
    return;
  }
  if (!isValidDate(registration_date)) {
    showToast("Registration date must be between 01-Jan-2020 and 31-Dec-2026.", "error");
    return;
  }

  try {
    await apiRequest("/pregnant-women", {
      method: "POST",
      body: JSON.stringify({
        pw_id,
        name,
        age: parseInt(age, 10),
        aadhaar,
        phone,
        address,
        registration_date,
        status
      })
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${name} saved!`, "#138808");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fPwId", "fName", "fAge", "fAadhaar", "fPhone", "fAddr", "fDate"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fStatus").value = "";
}

document.getElementById("fPwId").addEventListener("input", function onPwInput() {
  let value = this.value.toUpperCase();
  if (value.length > 0 && !value.startsWith("PW")) {
    value = `PW${value.replace(/^P?W?/, "").replace(/\D/g, "")}`;
  } else {
    value = `PW${value.replace(/^PW/, "").replace(/\D/g, "")}`;
  }
  this.value = value;
});

document.getElementById("fPhone").addEventListener("input", function onPhoneInput() {
  this.value = this.value.replace(/\D/g, "").slice(0, 10);
});

document.getElementById("fAadhaar").addEventListener("input", function onAadhaarInput() {
  this.value = this.value.replace(/\D/g, "").slice(0, 12);
});

document.getElementById("fDate").addEventListener("change", function onDateInput() {
  if (this.value && !isValidDate(this.value)) {
    showToast("Please select a date between 2020 and 2026.", "error");
    this.value = "";
  }
});

window.toggleMenu = toggleMenu;
window.promptDelete = promptDelete;
window.closeDeleteOverlay = closeDeleteOverlay;
window.confirmDelete = confirmDelete;
window.renderTable = renderTable;
window.startEdit = startEdit;
window.saveEdit = saveEdit;
window.saveRecord = saveRecord;
window.clearForm = clearForm;

loadRecords().catch((err) => {
  showToast(err.message || "Failed to load data.", "error");
});
