import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3000);
}

function genderClass(g) {
  return g === "Male" ? "gp-male" : g === "Female" ? "gp-female" : "gp-other";
}

function updateStats() {
  const total = records.length;
  const boys = records.filter((r) => r.gender === "Male").length;
  const girls = records.filter((r) => r.gender === "Female").length;
  document.getElementById("sTotal").textContent = total;
  document.getElementById("sBoys").textContent = boys;
  document.getElementById("sGirls").textContent = girls;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function renderTable() {
  const body = document.getElementById("stBody");
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="5">
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
      <td>${String(r.dob).slice(0, 10)}</td>
      <td><span class="gender-pill ${genderClass(r.gender)}">${r.gender}</span></td>
      <td><button class="del-btn" onclick="deleteRecord('${r.student_id}')">Delete</button></td>
    </tr>`
    )
    .join("");
  updateStats();
}

async function loadRecords() {
  records = await apiRequest("/students");
  renderTable();
}

async function saveRecord() {
  const student_id = document.getElementById("fId").value.trim();
  const name = document.getElementById("fNm").value.trim();
  const dob = document.getElementById("fDob").value;
  const gender = document.getElementById("fGn").value;

  if (!student_id || !name || !dob || !gender) {
    showToast("Please fill in all fields before saving.", "error");
    return;
  }

  try {
    await apiRequest("/students", {
      method: "POST",
      body: JSON.stringify({ student_id, name, dob, gender })
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${name} saved!`, "#138808");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fId", "fNm", "fDob"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fGn").value = "";
}

async function deleteRecord(studentId) {
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

window.saveRecord = saveRecord;
window.clearForm = clearForm;
window.deleteRecord = deleteRecord;

loadRecords().catch((err) => {
  showToast(err.message || "Failed to load data.", "error");
});
