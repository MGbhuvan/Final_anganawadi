import { apiRequest } from "../shared/apiClient.js";
import { showFixedToast, showInlineToast } from "../shared/toast.js";

let records = [];
let activeMenuId = null;

function showToast(msg, type) {
  showInlineToast("toastMsg", msg, type, 3000);
}

function showModalToast(msg, type) {
  showInlineToast("modalToast", msg, type, 3000);
}

function buildChildId() {
  const num = document.getElementById("fId").value.trim();
  return num ? "CHILD" + String(num).padStart(3, '0') : "";
}

function buildMotherId(idInput) {
  const num = document.getElementById(idInput).value.trim();
  return num ? "PW" + String(num).padStart(3, '0') : "";
}

function bmiStatus(bmi) {
  if (bmi < 18.5) return { label: "Underweight", class: "pill-low" };
  if (bmi <= 25) return { label: "Normal", class: "pill-normal" };
  return { label: "Overweight", class: "pill-high" };
}

function vaxClass(v) {
  if (v === "Complete") return "pill-complete";
  if (v === "Partial") return "pill-partial";
  return "pill-notdone";
}

function updateStats() {
  const total = records.length;
  const normal = records.filter((r) => r.bmi >= 18.5 && r.bmi <= 25).length;
  document.getElementById("sTotal").textContent = total;
  document.getElementById("sNormal").textContent = normal;
  document.getElementById("sAttention").textContent = total - normal;
  document.getElementById("recBadge").textContent = `${total} record${total !== 1 ? "s" : ""}`;
}

function renderTable() {
  const body = document.getElementById("cdBody");
  if (!records.length) {
    body.innerHTML = `<tr><td colspan="8">
      <div class="empty-state">
        <div class="empty-icon">No data</div>
        <p>No records yet.<br/>Fill the form above and click <strong>Save Record</strong>.</p>
      </div>
    </td></tr>`;
    updateStats();
    return;
  }

  body.innerHTML = records
    .map(
      (r) => `<tr>
      <td><span class="ch-id">${r.child_code}</span></td>
      <td class="ch-name">${r.name}</td>
      <td>${r.mother_id}</td>
      <td>${r.age} mo</td>
      <td>${r.weight} kg</td>
      <td>${r.height} cm</td>
      <td><span class="pill ${vaxClass(r.vaccination_status)}">${r.vaccination_status}</span></td>
      <td class="action-cell">
        <button class="menu-btn" id="menuBtn_${r.child_code}" onclick="toggleMenu(event, '${r.child_code}')" title="More options" aria-label="Open actions menu">&#8942;</button>
        <div class="action-menu" id="menu_${r.child_code}">
          <button class="update-opt" onclick="openUpdate('${r.child_code}')">Update</button>
          <button class="delete-opt" onclick="deleteRecord('${r.child_code}')">Delete</button>
        </div>
      </td>
    </tr>`
    )
    .join("");
  updateStats();
}

function closeAllMenus() {
  document.querySelectorAll(".action-menu.open").forEach((menu) => menu.classList.remove("open"));
  activeMenuId = null;
}

window.toggleMenu = function toggleMenu(event, id) {
  event.stopPropagation();
  const btn = document.getElementById(`menuBtn_${id}`);
  const menu = document.getElementById(`menu_${id}`);
  if (!menu) return;
  const isOpen = menu.classList.contains("open");
  closeAllMenus();

  if (!isOpen) {
    menu.classList.add("open");
    activeMenuId = id;

    const rect = btn.getBoundingClientRect();
    menu.style.position = "fixed";
    menu.style.margin = "0";
    menu.style.left = "auto";
    menu.style.right = `${window.innerWidth - rect.right}px`;

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

document.addEventListener("click", closeAllMenus);
document.addEventListener("scroll", closeAllMenus, true);

async function loadRecords() {
  const result = await apiRequest("/children");
  records = Array.isArray(result) ? result : [];
  renderTable();
}

async function saveRecord() {
  const child_code = buildChildId();
  const name = document.getElementById("fName").value.trim();
  const mother_id = buildMotherId("fMid");
  const age = document.getElementById("fAge").value;
  const weight = document.getElementById("fWeight").value;
  const height = document.getElementById("fHeight").value;
  const vaccination_status = document.getElementById("fVacc").value;

  const missing = [];
  if (!child_code) missing.push("Child ID");
  if (!name) missing.push("Child Name");
  if (!mother_id) missing.push("Mother ID");
  if (!age) missing.push("Age");
  if (!weight) missing.push("Weight");
  if (!height) missing.push("Height");
  if (!vaccination_status) missing.push("Vaccination Status");

  if (missing.length > 0) {
    showToast(`Missing fields: ${missing.join(", ")}`, "error");
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
  ["fId", "fName", "fMid", "fAge", "fWeight", "fHeight"].forEach((id) => {
    document.getElementById(id).value = "";
  });
  document.getElementById("fVacc").value = "";
}

async function deleteRecord(id) {
  closeAllMenus();
  const target = records.find((r) => r.child_code === id);
  if (!target || !confirm(`Delete record for ${target.name}?`)) return;

  try {
    await apiRequest(`/children/${encodeURIComponent(id)}`, { method: "DELETE" });
    await loadRecords();
    showFixedToast("fixedToast", `Record for ${target.name} deleted.`, "#A32D2D");
  } catch (err) {
    showToast(err.message, "error");
  }
}

window.openUpdate = function openUpdate(id) {
  closeAllMenus();
  const r = records.find((rec) => rec.child_code === id);
  if (!r) return;

  document.getElementById("mId").value = r.child_code;
  document.getElementById("mNm").value = r.name;
  document.getElementById("mMid").value = r.mother_id ? r.mother_id.replace(/\D/g, '') : '';
  document.getElementById("mAge").value = r.age;
  document.getElementById("mWt").value = r.weight;
  document.getElementById("mHt").value = r.height;
  document.getElementById("mVacc").value = r.vaccination_status;

  document.getElementById("updateModal").classList.add("open");
};

window.closeModal = function closeModal() {
  document.getElementById("updateModal").classList.remove("open");
};

window.submitUpdate = async function submitUpdate() {
  const child_code = document.getElementById("mId").value;
  const name = document.getElementById("mNm").value.trim();
  const mother_id = buildMotherId("mMid");
  const age = document.getElementById("mAge").value;
  const weight = document.getElementById("mWt").value;
  const height = document.getElementById("mHt").value;
  const vaccination_status = document.getElementById("mVacc").value;

  const missing = [];
  if (!name) missing.push("Child Name");
  if (!mother_id) missing.push("Mother ID");
  if (!age) missing.push("Age");
  if (!weight) missing.push("Weight");
  if (!height) missing.push("Height");
  if (!vaccination_status) missing.push("Vaccination Status");

  if (missing.length > 0) {
    showModalToast(`Missing fields: ${missing.join(", ")}`, "error");
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

document.getElementById("fId").addEventListener("input", function onCreateIdInput() {
  this.value = this.value.replace(/\D/g, "");
});

document.getElementById("fMid").addEventListener("input", function onMidInput() {
  this.value = this.value.replace(/\D/g, "");
});

document.getElementById("mId").addEventListener("input", function onModalIdInput() {
  this.value = this.value.replace(/\D/g, "");
});

document.getElementById("mMid").addEventListener("input", function onModalMidInput() {
  this.value = this.value.replace(/\D/g, "");
});

window.saveRecord = saveRecord;
window.clearForm = clearForm;
window.deleteRecord = deleteRecord;

loadRecords().catch((err) => showToast(err.message, "error"));
