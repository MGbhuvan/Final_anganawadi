import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];
let activeMenuId = null;

// ── Helpers ──────────────────────────────────────────────────────────────────

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3000);
}

function showModalToast(msg, type) {
  showInlineToast("modalToast", msg, type, 3000);
}

function buildChildId() {
  const num = document.getElementById("fId").value.trim();
  return num ? "CHILD" + num : "";
}

function bmiStatus(bmi) {
  if (bmi < 18.5) return { label: "Underweight", class: "pill-low" };
  if (bmi <= 25)   return { label: "Normal",      class: "pill-normal" };
  return { label: "Overweight", class: "pill-high" };
}

function vaxClass(v) {
  if (v === "Complete") return "pill-complete";
  if (v === "Partial")  return "pill-partial";
  return "pill-notdone";
}

// ── Render ────────────────────────────────────────────────────────────────────

function updateStats() {
  const total = records.length;
  const normal = records.filter(r => r.bmi >= 18.5 && r.bmi <= 25).length;
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

  body.innerHTML = records.map(r => {
    const bmi = bmiStatus(r.bmi);
    return `<tr>
      <td><span class="ch-id">${r.child_code}</span></td>
      <td class="ch-name">${r.name}</td>
      <td>${r.mother_id}</td>
      <td>${r.age} mo</td>
      <td>${r.weight} kg</td>
      <td>${r.height} cm</td>
      <td><span class="pill ${bmi.class}">${bmi.label}</span></td>
      <td><span class="pill ${vaxClass(r.vaccination_status)}">${r.vaccination_status}</span></td>
      <td class="action-cell">
        <button class="menu-btn" onclick="toggleMenu(event, '${r.child_code}')">⋮</button>
        <div class="action-menu" id="menu_${r.child_code}">
          <button class="update-opt" onclick="openUpdate('${r.child_code}')">✏️ Update</button>
          <button class="delete-opt" onclick="deleteRecord('${r.child_code}')">🗑️ Delete</button>
        </div>
      </td>
    </tr>`;
  }).join("");
  updateStats();
}

// ── Actions ───────────────────────────────────────────────────────────────────

function closeAllMenus() {
  document.querySelectorAll(".action-menu.open").forEach(m => m.classList.remove("open"));
  activeMenuId = null;
}

window.toggleMenu = function (event, id) {
  event.stopPropagation();
  const btn = event.currentTarget;
  const menu = document.getElementById(`menu_${id}`);
  if (!menu) return;
  const isOpen = menu.classList.contains("open");
  closeAllMenus();

  if (!isOpen) {
    menu.classList.add("open");
    activeMenuId = id;

    // Dynamic fixed positioning
    const rect = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.margin = "0";
    
    // Align right edge
    menu.style.left = "auto";
    menu.style.right = `${window.innerWidth - rect.right}px`;

    // Pop upwards if tight on space
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

async function loadRecords() {
  records = await apiRequest("/children");
  renderTable();
}

async function saveRecord() {
  const child_code = buildChildId();
  const name = document.getElementById("fName").value.trim();
  const mother_id = document.getElementById("fMid").value.trim();
  const age = document.getElementById("fAge").value;
  const weight = document.getElementById("fWeight").value;
  const height = document.getElementById("fHeight").value;
  const vaccination_status = document.getElementById("fVacc").value;

  if (!child_code || !name || !mother_id || !age || !weight || !height || !vaccination_status) {
    showToast("Please fill in all fields.", "error");
    return;
  }

  try {
    await apiRequest("/children", {
      method: "POST",
      body: JSON.stringify({ child_code, name, mother_id, age, weight, height, vaccination_status })
    });
    clearForm();
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${name} saved!`, "#138808");
  } catch (err) {
    showToast(err.message, "error");
  }
}

function clearForm() {
  ["fId", "fName", "fMid", "fAge", "fWeight", "fHeight"].forEach(id => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fVacc").value = "";
  document.getElementById("bmiPreview").classList.remove("show");
}

async function deleteRecord(id) {
  closeAllMenus();
  const target = records.find(r => r.child_code === id);
  if (!target || !confirm(`Delete record for ${target.name}?`)) return;

  try {
    await apiRequest(`/children/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${target.name} deleted.`, "#A32D2D");
  } catch (err) {
    showToast(err.message, "error");
  }
}

// ── Update Modal ──────────────────────────────────────────────────────────────

window.openUpdate = function (id) {
  closeAllMenus();
  const r = records.find(rec => rec.child_code === id);
  if (!r) return;

  document.getElementById("mId").value   = r.child_code;
  document.getElementById("mNm").value   = r.name;
  document.getElementById("mMid").value  = r.mother_id;
  document.getElementById("mAge").value  = r.age;
  document.getElementById("mWt").value   = r.weight;
  document.getElementById("mHt").value   = r.height;
  document.getElementById("mVacc").value = r.vaccination_status;

  document.getElementById("updateModal").classList.add("open");
};

window.closeModal = function () {
  document.getElementById("updateModal").classList.remove("open");
};

window.submitUpdate = async function () {
  const child_code = document.getElementById("mId").value;
  const name = document.getElementById("mNm").value.trim();
  const mother_id = document.getElementById("mMid").value.trim();
  const age = document.getElementById("mAge").value;
  const weight = document.getElementById("mWt").value;
  const height = document.getElementById("mHt").value;
  const vaccination_status = document.getElementById("mVacc").value;

  if (!name || !mother_id || !age || !weight || !height || !vaccination_status) {
    showModalToast("All fields are required.", "error");
    return;
  }

  try {
    await apiRequest(`/children/${encodeURIComponent(child_code)}`, {
      method: "PUT",
      body: JSON.stringify({ name, mother_id, age, weight, height, vaccination_status })
    });
    closeModal();
    await loadRecords();
    showFixedToast("fixedToast", `Record updated for ${name}!`, "#F5A623");
  } catch (err) {
    showModalToast(err.message, "error");
  }
};

window.calcBMI = function () {
  const w = parseFloat(document.getElementById("fWeight").value);
  const h = parseFloat(document.getElementById("fHeight").value);
  const preview = document.getElementById("bmiPreview");

  if (w > 0 && h > 0) {
    const bmi = (w / ((h / 100) ** 2)).toFixed(1);
    const status = bmiStatus(bmi);
    preview.innerHTML = `Live BMI: <strong>${bmi}</strong> — <span class="${status.class}">${status.label}</span>`;
    preview.classList.add("show");
  } else {
    preview.classList.remove("show");
  }
};

// ── Input Restrictions ────────────────────────────────────────────────────────

document.getElementById("fId").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});
document.getElementById("mId").addEventListener("input", function () {
  this.value = this.value.replace(/\D/g, "");
});

// ── Init ──────────────────────────────────────────────────────────────────────

window.saveRecord = saveRecord;
window.clearForm = clearForm;
window.deleteRecord = deleteRecord;

loadRecords().catch(err => showToast(err.message, "error"));
