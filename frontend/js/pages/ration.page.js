// Inlined API Client Logic to ensure maximum compatibility
const API_BASE_URL = window.location.port === "4000" 
    ? "/api" 
    : "http://127.0.0.1:4000/api";

async function apiRequest(path, options = {}) {
    const response = await fetch(`${API_BASE_URL}${path}`, {
        headers: { "Content-Type": "application/json", ...(options.headers || {}) },
        ...options
    });
    if (response.status === 204) return null;
    const data = await response.json();
    if (!response.ok) throw new Error(data?.error || "Request failed");
    return data;
}

let items = [];
let inventory = [];

function showToast(msg) {
    const t = document.getElementById("toast");
    t.textContent = msg;
    t.classList.add("show");
    setTimeout(() => t.classList.remove("show"), 3000);
}

async function loadItems() {
    console.log("Fetching items from:", `${API_BASE_URL}/ration/items`);
    try {
        items = await apiRequest("/ration/items");
        console.log("Items received:", items);
        
        // 1. All items for PW and Stock In
        const selects = document.querySelectorAll(".item-select");
        selects.forEach(s => {
            if (!items || items.length === 0) {
                s.innerHTML = '<option value="">No items found</option>';
            } else {
                s.innerHTML = '<option value="">-- Choose Ration Item --</option>' + 
                    items.map(i => `<option value="${i.id}">${i.item_name} (${i.unit})</option>`).join("");
            }
            
            s.onchange = () => {
                const item = items.find(it => it.id == s.value);
                const unitLabelId = s.id === "si-item" ? "si-unit-label" : "pw-dist-unit-label";
                const labelEl = document.getElementById(unitLabelId);
                if (labelEl) labelEl.textContent = item ? `(${item.unit})` : "";
            };
        });

        // 2. Filtered items for Student Distribution (Milk and Millet Laddu only)
        const studentSelects = document.querySelectorAll(".item-select-student");
        const studentItems = items.filter(i => 
            i.item_name.toLowerCase() === "milk" || 
            i.item_name.toLowerCase() === "millet laddu"
        );

        studentSelects.forEach(s => {
            if (!studentItems.length) {
                s.innerHTML = '<option value="">Milk/Laddu not found</option>';
            } else {
                s.innerHTML = '<option value="">-- Choose Student Item --</option>' + 
                    studentItems.map(i => `<option value="${i.id}">${i.item_name} (${i.unit})</option>`).join("");
            }

            s.onchange = () => {
                const item = studentItems.find(it => it.id == s.value);
                const labelEl = document.getElementById("stu-dist-unit-label");
                if (labelEl) labelEl.textContent = item ? `(${item.unit})` : "";
            };
        });

    } catch (e) {
        console.error("Load items error:", e);
        showToast("Failed to load ration items.");
    }
}

async function loadInventory() {
    try {
        inventory = await apiRequest("/ration/inventory");
        const grid = document.getElementById("inventoryGrid");
        if (!inventory.length) {
            grid.innerHTML = '<p style="text-align:center; grid-column:1/-1; padding:3rem; color:#6B7280;">No inventory found. Add some stock to get started!</p>';
            return;
        }
        grid.innerHTML = inventory.map(i => `
            <div class="inv-card">
                <div class="card-options">
                    <button class="options-btn" onclick="toggleMenu(event, ${items.find(it => it.item_name === i.item_name)?.id})">⋮</button>
                    <div class="options-menu" id="menu-${items.find(it => it.item_name === i.item_name)?.id}">
                        <div class="menu-item" onclick="openReduceModal(${items.find(it => it.item_name === i.item_name)?.id}, '${i.item_name}', '${i.unit}')">
                            ➖ Minus Stock
                        </div>
                    </div>
                </div>
                <div class="inv-item-name">${i.item_name}</div>
                <div class="inv-stock-container">
                    <div class="inv-stock">${i.total_stock}</div>
                    <div class="inv-unit">${i.unit}</div>
                </div>
                <div class="inv-footer">Last Updated: ${new Date(i.last_updated).toLocaleString()}</div>
            </div>
        `).join("");
    } catch (e) { console.error("Load inventory error:", e); }
}

window.toggleMenu = (event, id) => {
    event.stopPropagation();
    document.querySelectorAll('.options-menu').forEach(m => {
        if (m.id !== `menu-${id}`) m.classList.remove('show');
    });
    document.getElementById(`menu-${id}`).classList.toggle('show');
};

document.addEventListener('click', () => {
    document.querySelectorAll('.options-menu').forEach(m => m.classList.remove('show'));
});

window.openReduceModal = (id, name, unit) => {
    document.getElementById("reduce-item-id").value = id;
    document.getElementById("reduceModalTitle").textContent = `Minus ${name}`;
    document.getElementById("reduce-unit-label").textContent = `(${unit})`;
    document.getElementById("reduceModal").classList.add("show");
};

window.closeReduceModal = () => {
    document.getElementById("reduceModal").classList.remove("show");
    document.getElementById("reduce-qty").value = "";
    document.getElementById("reduce-reason").value = "";
};

async function submitReduction() {
    const item_id = document.getElementById("reduce-item-id").value;
    const quantity = document.getElementById("reduce-qty").value;
    const reason = document.getElementById("reduce-reason").value;

    if (!quantity) return showToast("Quantity is required!");

    try {
        await apiRequest("/ration/adjust", {
            method: "POST",
            body: JSON.stringify({ item_id, quantity, reason })
        });
        showToast("Stock reduced successfully!");
        closeReduceModal();
        loadInventory();
    } catch (e) { showToast(e.message); }
}

async function submitStockIn() {
    const item_id = document.getElementById("si-item").value;
    const quantity = document.getElementById("si-qty").value;
    const received_date = document.getElementById("si-date").value;
    const supplier = document.getElementById("si-supplier").value;

    if (!item_id || !quantity) return showToast("Item and Quantity are required!");

    try {
        await apiRequest("/ration/stock-in", {
            method: "POST",
            body: JSON.stringify({ item_id, quantity, received_date, supplier })
        });
        showToast("Stock added successfully!");
        document.getElementById("si-qty").value = "";
        loadInventory();
    } catch (e) { showToast(e.message); }
}

async function submitDistribution(type) {
    const prefix = type === "PW" ? "pw-dist" : "stu-dist";
    const target_id = document.getElementById(`${prefix}-target`).value;
    const item_id = document.getElementById(`${prefix}-item`).value;
    const quantity = document.getElementById(`${prefix}-qty`).value;
    const remarks = document.getElementById(`${prefix}-remarks`).value;

    if (!target_id || !item_id || !quantity) return showToast("Please fill all required fields!");

    try {
        await apiRequest("/ration/distribute", {
            method: "POST",
            body: JSON.stringify({ type, target_id, item_id, quantity, remarks })
        });
        showToast(`${type} Distribution recorded!`);
        document.getElementById(`${prefix}-qty`).value = "";
        document.getElementById(`${prefix}-target`).value = type === "PW" ? "PW" : "";
        document.getElementById(`${prefix}-remarks`).value = "";
        loadInventory();
    } catch (e) { showToast(e.message); }
}

async function submitAutoStudentDist() {
    const date = document.getElementById("stu-auto-date").value;
    const eggs_count = document.getElementById("stu-auto-eggs") ? document.getElementById("stu-auto-eggs").value : 0;
    if (!date) return showToast("Please select a distribution date!");

    try {
        const res = await apiRequest("/ration/auto-distribute-students", {
            method: "POST",
            body: JSON.stringify({ date, eggs_count: parseFloat(eggs_count || 0) })
        });
        showToast(res.message);
        loadInventory();
    } catch (e) {
        showToast(e.message);
    }
}

async function loadHistory() {
    const type = document.getElementById("history-type").value;
    try {
        const history = await apiRequest(`/ration/history/${type}`);
        const head = document.getElementById("history-head");
        const body = document.getElementById("history-body");

        if (type === "additions") {
            head.innerHTML = "<tr><th>Date</th><th>Item</th><th>Qty</th><th>Supplier</th></tr>";
            body.innerHTML = history.map(h => `
                <tr>
                    <td>${new Date(h.created_at).toLocaleDateString()}</td>
                    <td>${h.item_name}</td>
                    <td>${h.quantity}</td>
                    <td><span class="badge">${h.supplier}</span></td>
                </tr>
            `).join("");
        } else if (type === "adjustments") {
            head.innerHTML = "<tr><th>Date</th><th>Item</th><th>Qty Reduced</th><th>Reason</th></tr>";
            body.innerHTML = history.map(h => `
                <tr>
                    <td>${new Date(h.created_at).toLocaleDateString()}</td>
                    <td>${h.item_name}</td>
                    <td>-${h.quantity}</td>
                    <td><span class="badge" style="background:#fee2e2; color:#b91c1c;">${h.reason}</span></td>
                </tr>
            `).join("");
        } else {
            head.innerHTML = `<tr><th>Date</th><th>Beneficiary ID</th><th>Item</th><th>Qty</th><th>Remarks</th></tr>`;
            body.innerHTML = history.map(h => `
                <tr>
                    <td>${new Date(h.created_at).toLocaleDateString()}</td>
                    <td><code>${h.pw_id || h.student_id}</code></td>
                    <td>${h.item_name}</td>
                    <td>${h.quantity}</td>
                    <td>${h.remarks || '-'}</td>
                </tr>
            `).join("");
        }
    } catch (e) { console.error("Load history error:", e); }
}

async function exportHistoryToExcel() {
    const type = document.getElementById("history-type").value;
    try {
        const history = await apiRequest(`/ration/history/${type}`);
        if (!history || history.length === 0) return showToast("No records found to export!");

        let tableHtml = "<table><thead><tr>";
        let headers = [];
        if (type === "additions") {
            headers = ["Date", "Item", "Quantity", "Supplier"];
        } else if (type === "adjustments") {
            headers = ["Date", "Item", "Quantity Reduced", "Reason"];
        } else {
            headers = ["Date", "Beneficiary ID", "Item", "Quantity", "Remarks"];
        }

        headers.forEach(h => tableHtml += `<th style='background:#f1f5f9; font-weight:bold;'>${h}</th>`);
        tableHtml += "</tr></thead><tbody>";

        history.forEach(h => {
            tableHtml += "<tr>";
            if (type === "additions") {
                tableHtml += `<td>${new Date(h.created_at).toLocaleDateString()}</td><td>${h.item_name}</td><td>${h.quantity}</td><td>${h.supplier}</td>`;
            } else if (type === "adjustments") {
                tableHtml += `<td>${new Date(h.created_at).toLocaleDateString()}</td><td>${h.item_name}</td><td>${h.quantity}</td><td>${h.reason}</td>`;
            } else {
                tableHtml += `<td>${new Date(h.created_at).toLocaleDateString()}</td><td>${h.pw_id || h.student_id}</td><td>${h.item_name}</td><td>${h.quantity}</td><td>${h.remarks || ""}</td>`;
            }
            tableHtml += "</tr>";
        });
        tableHtml += "</tbody></table>";

        const blob = new Blob([tableHtml], { type: "application/vnd.ms-excel" });
        const url = URL.createObjectURL(blob);
        const link = document.createElement("a");
        link.href = url;
        link.download = `ration_history_${type}_${new Date().toISOString().split('T')[0]}.xls`;
        document.body.appendChild(link);
        link.click();
        document.body.removeChild(link);
        URL.revokeObjectURL(url);
        showToast("Excel report generated successfully!");
    } catch (e) {
        showToast("Failed to generate report.");
    }
}

// Event Listeners
window.addEventListener('tabChanged', (e) => {
    if (e.detail === 'dashboard') loadInventory();
    if (e.detail === 'history') loadHistory();
});

// Initialization
document.addEventListener("DOMContentLoaded", () => {
    loadItems();
    loadInventory();
    
    // Set default dates
    const today = new Date().toISOString().split('T')[0];
    if (document.getElementById("si-date")) document.getElementById("si-date").value = today;
    if (document.getElementById("stu-auto-date")) document.getElementById("stu-auto-date").value = today;

    // PW ID Prefix Persistence
    const pwIdInput = document.getElementById("pw-dist-target");
    if (pwIdInput) {
        pwIdInput.addEventListener("input", function() {
            let val = this.value.toUpperCase();
            if (!val.startsWith("PW")) {
                val = "PW" + val.replace(/[^0-9]/g, "");
            } else {
                val = "PW" + val.substring(2).replace(/[^0-9]/g, "");
            }
            this.value = val;
        });
    }
});

// Export to window
window.submitStockIn = submitStockIn;
window.submitDistribution = submitDistribution;
window.submitAutoStudentDist = submitAutoStudentDist;
window.loadHistory = loadHistory;
window.exportHistoryToExcel = exportHistoryToExcel;
