import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3000);
}

function levelClass(level) {
  if (level === "High") return "pill-high";
  if (level === "Medium") return "pill-medium";
  return "pill-low";
}

function updatePreview() {
  const pw = parseFloat(document.getElementById("fPW").value) || 0;
  const st = parseFloat(document.getElementById("fST").value) || 0;
  const preview = document.getElementById("stockPreview");
  if (pw > 0 || st > 0) {
    const total = (pw + st).toFixed(1);
    preview.textContent = `Total Combined Stock: ${total} kg  —  PW: ${pw} kg  |  Students: ${st} kg`;
    preview.className = "stock-preview show";
  } else {
    preview.className = "stock-preview";
  }
}

function updateStats() {
  const total = records.length;
  const totalPW = records.reduce((sum, r) => sum + parseFloat(r.pw_count || 0), 0);
  const totalST = records.reduce((sum, r) => sum + parseFloat(r.student_count || 0), 0);
  const lowCount = records.filter((r) => r.stock_level === "Low").length;

  document.getElementById("sTotal").textContent = total;
  document.getElementById("sPW").textContent = totalPW.toFixed(1);
  document.getElementById("sST").textContent = totalST.toFixed(1);
  document.getElementById("sLow").textContent = lowCount;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function renderTable() {
  const body = document.getElementById("rsBody");
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-icon">🏪</div>
        <p>No stock entries yet.<br/>Fill the form above and click <strong>Save Record</strong>.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = records
    .map((r) => {
      const total = (parseFloat(r.pw_count || 0) + parseFloat(r.student_count || 0)).toFixed(1);
      return `<tr>
        <td><span class="rs-id">${r.entry_code}</span></td>
        <td>${r.ration_stock_id}</td>
        <td class="rs-name">${r.centre}</td>
        <td>${r.item}</td>
        <td><span class="qty-val">${r.pw_count} kg</span></td>
        <td><span class="qty-val">${r.student_count} kg</span></td>
        <td><span class="qty-val">${total} kg</span></td>
        <td><span class="pill ${levelClass(r.stock_level)}">${r.stock_level}</span></td>
        <td><button class="del-btn" onclick="deleteRec('${r.entry_code}')">Delete</button></td>
      </tr>`;
    })
    .join("");
  updateStats();
}

async function loadRecords() {
  records = await apiRequest("/ration-stocks");
  renderTable();
}

async function saveRecord() {
  const ration_stock_id = document.getElementById("fRsId").value.trim();
  const centre = document.getElementById("fCentre").value.trim();
  const item = document.getElementById("fItem").value;
  const pw_count = document.getElementById("fPW").value.trim();
  const student_count = document.getElementById("fST").value.trim();
  const stock_level = document.getElementById("fLevel").value;

  if (!ration_stock_id || !centre || !item || !pw_count || !student_count || !stock_level) {
    showToast("Please fill in all fields before saving.", "error");
    return;
  }

  try {
    await apiRequest("/ration-stocks", {
      method: "POST",
      body: JSON.stringify({ ration_stock_id, centre, item, pw_count, student_count, stock_level })
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Stock entry for ${centre} saved!`, "#F5A623");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fRsId", "fCentre", "fPW", "fST"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fItem").value = "";
  document.getElementById("fLevel").value = "";
  document.getElementById("stockPreview").className = "stock-preview";
}

async function deleteRec(entryCode) {
  const target = records.find((r) => r.entry_code === entryCode);
  if (!target) return;
  if (!confirm(`Delete stock entry for ${target.centre}?`)) return;

  try {
    await apiRequest(`/ration-stocks/${encodeURIComponent(entryCode)}`, { method: "DELETE" });
    await loadRecords();
    showFixedToast("fixedToast", `Entry for ${target.centre} deleted.`, "#A32D2D");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function exportCSV() {
  if (!records.length) {
    showFixedToast("fixedToast", "No records to export!", "#A32D2D");
    return;
  }
  const headers = [
    "Entry ID",
    "RS ID",
    "Centre Name",
    "Ration Item",
    "PW Ration (kg)",
    "Student Ration (kg)",
    "Total Stock (kg)",
    "Stock Level"
  ];
  const rows = records.map((r) => {
    const total = (parseFloat(r.pw_count || 0) + parseFloat(r.student_count || 0)).toFixed(1);
    return [r.entry_code, r.ration_stock_id, r.centre, r.item, r.pw_count, r.student_count, total, r.stock_level];
  });
  const csv = [headers, ...rows].map((row) => row.map((v) => `"${v}"`).join(",")).join("\n");
  const blob = new Blob([csv], { type: "text/csv;charset=utf-8;" });
  const url = URL.createObjectURL(blob);
  const a = document.createElement("a");
  a.href = url;
  a.download = `ration_stock_${new Date().toISOString().slice(0, 10)}.csv`;
  a.click();
  URL.revokeObjectURL(url);
  showFixedToast("fixedToast", "CSV exported successfully!", "#138808");
}

function printReport() {
  if (!records.length) {
    showFixedToast("fixedToast", "No records to print!", "#A32D2D");
    return;
  }
  const now = new Date();
  document.getElementById("printDate").textContent =
    `Printed on: ${now.toLocaleDateString("en-IN", { day: "2-digit", month: "long", year: "numeric" })}` +
    `  |  Time: ${now.toLocaleTimeString("en-IN", { hour: "2-digit", minute: "2-digit" })}`;
  window.print();
}

document.getElementById("fPW").addEventListener("input", updatePreview);
document.getElementById("fST").addEventListener("input", updatePreview);

window.saveRecord = saveRecord;
window.clearForm = clearForm;
window.deleteRec = deleteRec;
window.exportCSV = exportCSV;
window.printReport = printReport;
window.updatePreview = updatePreview;

loadRecords().catch((err) => {
  showToast(err.message || "Failed to load data.", "error");
});
