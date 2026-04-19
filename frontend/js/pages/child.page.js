import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3000);
}

function getBMI(weight, height) {
  if (!weight || !height || height === 0) return null;
  return (weight / ((height / 100) * (height / 100))).toFixed(1);
}

function bmiInfo(bmi) {
  if (!bmi) return { label: "N/A", cls: "pill-normal" };
  const b = parseFloat(bmi);
  if (b < 14) return { label: "Underweight", cls: "pill-low" };
  if (b <= 18) return { label: "Normal", cls: "pill-normal" };
  return { label: "Overweight", cls: "pill-high" };
}

function vaccClass(v) {
  if (v === "Complete") return "pill-complete";
  if (v === "Partial") return "pill-partial";
  return "pill-notdone";
}

function calcBMI() {
  const w = parseFloat(document.getElementById("fWeight").value);
  const h = parseFloat(document.getElementById("fHeight").value);
  const preview = document.getElementById("bmiPreview");
  if (w && h && h > 0) {
    const bmi = getBMI(w, h);
    const info = bmiInfo(bmi);
    preview.textContent = `BMI: ${bmi} — ${info.label}`;
    preview.className = "bmi-preview show";
  } else {
    preview.className = "bmi-preview";
  }
}

function updateStats() {
  const total = records.length;
  const normal = records.filter((r) => bmiInfo(r.bmi).label === "Normal").length;
  document.getElementById("sTotal").textContent = total;
  document.getElementById("sNormal").textContent = normal;
  document.getElementById("sAttention").textContent = total - normal;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function renderTable() {
  const body = document.getElementById("cdBody");
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="9">
      <div class="empty-state">
        <div class="empty-icon">👶</div>
        <p>No records yet.<br/>Fill the form above and click <strong>Save Record</strong>.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = records
    .map((r) => {
      const bi = bmiInfo(r.bmi);
      return `<tr>
        <td><span class="ch-id">${r.child_code}</span></td>
        <td class="ch-name">${r.name}</td>
        <td>${r.mother_id}</td>
        <td style="text-align:center;">${r.age} mo.</td>
        <td style="text-align:center;">${r.weight} kg</td>
        <td style="text-align:center;">${r.height} cm</td>
        <td><span class="pill ${bi.cls}">${bi.label} (${r.bmi})</span></td>
        <td><span class="pill ${vaccClass(r.vaccination_status)}">${r.vaccination_status}</span></td>
        <td><button class="del-btn" onclick="deleteRec('${r.child_code}')">Delete</button></td>
      </tr>`;
    })
    .join("");
  updateStats();
}

async function loadRecords() {
  records = await apiRequest("/children");
  renderTable();
}

async function saveRecord() {
  const name = document.getElementById("fName").value.trim();
  const mother_id = document.getElementById("fMid").value.trim();
  const age = document.getElementById("fAge").value.trim();
  const weight = document.getElementById("fWeight").value.trim();
  const height = document.getElementById("fHeight").value.trim();
  const vaccination_status = document.getElementById("fVacc").value;

  if (!name || !mother_id || !age || !weight || !height || !vaccination_status) {
    showToast("Please fill in all fields before saving.", "error");
    return;
  }

  try {
    await apiRequest("/children", {
      method: "POST",
      body: JSON.stringify({ name, mother_id, age, weight, height, vaccination_status })
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${name} saved!`, "#F5A623");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fName", "fMid", "fAge", "fWeight", "fHeight"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fVacc").value = "";
  document.getElementById("bmiPreview").className = "bmi-preview";
}

async function deleteRec(childCode) {
  const target = records.find((r) => r.child_code === childCode);
  if (!target) return;
  if (!confirm(`Delete record for ${target.name}?`)) return;

  try {
    await apiRequest(`/children/${encodeURIComponent(childCode)}`, { method: "DELETE" });
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${target.name} deleted.`, "#A32D2D");
  } catch (err) {
    showToast(err.message, "error");
  }
}

document.getElementById("fWeight").addEventListener("input", calcBMI);
document.getElementById("fHeight").addEventListener("input", calcBMI);

window.saveRecord = saveRecord;
window.clearForm = clearForm;
window.deleteRec = deleteRec;
window.calcBMI = calcBMI;

loadRecords().catch((err) => {
  showToast(err.message || "Failed to load data.", "error");
});
