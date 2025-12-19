// Daily Expense Tracker (localStorage)

const STORAGE_KEY = "expense_tracker_v1";

const el = (id) => document.getElementById(id);

const form = el("expenseForm");
const dateInput = el("date");
const categoryInput = el("category");
const descInput = el("desc");
const amountInput = el("amount");

const monthFilter = el("monthFilter");
const categoryFilter = el("categoryFilter");
const searchFilter = el("searchFilter");

const tbody = el("expenseTbody");

const todayTotalEl = el("todayTotal");
const monthTotalEl = el("monthTotal");
const filteredTotalEl = el("filteredTotal");
const entryCountEl = el("entryCount");

const exportBtn = el("exportBtn");
const importInput = el("importInput");
const clearAllBtn = el("clearAllBtn");
const resetBtn = el("resetBtn");

function pad2(n) { return String(n).padStart(2, "0"); }

function todayISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}-${pad2(d.getDate())}`;
}

function currentMonthISO() {
  const d = new Date();
  return `${d.getFullYear()}-${pad2(d.getMonth() + 1)}`;
}

function moneyRM(n) {
  const v = Number(n || 0);
  return `RM ${v.toFixed(2)}`;
}

function loadExpenses() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    const data = raw ? JSON.parse(raw) : [];
    return Array.isArray(data) ? data : [];
  } catch {
    return [];
  }
}

function saveExpenses(expenses) {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(expenses));
}

function uid() {
  return `${Date.now()}_${Math.random().toString(16).slice(2)}`;
}

let expenses = loadExpenses();

function getMonth(dateISO) {
  // dateISO: YYYY-MM-DD -> YYYY-MM
  return (dateISO || "").slice(0, 7);
}

function matchesFilters(item) {
  const m = monthFilter.value || currentMonthISO();
  const cat = categoryFilter.value || "All";
  const q = (searchFilter.value || "").trim().toLowerCase();

  const monthOk = getMonth(item.date) === m;
  const catOk = (cat === "All") || item.category === cat;
  const qOk = !q || (item.desc || "").toLowerCase().includes(q);

  return monthOk && catOk && qOk;
}

function computeTotals() {
  const today = todayISO();
  const month = currentMonthISO();

  const todayTotal = expenses
    .filter(e => e.date === today)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const monthTotal = expenses
    .filter(e => getMonth(e.date) === month)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  const filtered = expenses
    .filter(matchesFilters)
    .reduce((s, e) => s + Number(e.amount || 0), 0);

  todayTotalEl.textContent = moneyRM(todayTotal);
  monthTotalEl.textContent = moneyRM(monthTotal);
  filteredTotalEl.textContent = moneyRM(filtered);
}

function render() {
  // sort by date desc, then createdAt desc
  const sorted = [...expenses].sort((a, b) => {
    if (a.date !== b.date) return b.date.localeCompare(a.date);
    return (b.createdAt || 0) - (a.createdAt || 0);
  });

  const visible = sorted.filter(matchesFilters);

  tbody.innerHTML = "";
  for (const item of visible) {
    const tr = document.createElement("tr");

    tr.innerHTML = `
      <td>${item.date}</td>
      <td>${item.category}</td>
      <td>${escapeHtml(item.desc || "")}</td>
      <td class="right">${moneyRM(item.amount)}</td>
      <td class="right">
        <div class="actions">
          <button class="btn btn-secondary" data-action="edit" data-id="${item.id}">Edit</button>
          <button class="btn btn-danger" data-action="delete" data-id="${item.id}">Delete</button>
        </div>
      </td>
    `;

    tbody.appendChild(tr);
  }

  entryCountEl.textContent = String(visible.length);
  computeTotals();
}

function escapeHtml(str) {
  return String(str)
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;")
    .replaceAll("'", "&#039;");
}

function addExpense({ date, category, desc, amount }) {
  const item = {
    id: uid(),
    date,
    category,
    desc: (desc || "").trim(),
    amount: Number(amount),
    createdAt: Date.now(),
    updatedAt: Date.now(),
  };
  expenses.push(item);
  saveExpenses(expenses);
  render();
}

function deleteExpense(id) {
  expenses = expenses.filter(e => e.id !== id);
  saveExpenses(expenses);
  render();
}

function editExpense(id) {
  const item = expenses.find(e => e.id === id);
  if (!item) return;

  const newDate = prompt("Edit date (YYYY-MM-DD):", item.date);
  if (!newDate) return;

  const newCategory = prompt("Edit category:", item.category);
  if (!newCategory) return;

  const newDesc = prompt("Edit description:", item.desc || "") ?? "";
  const newAmount = prompt("Edit amount (number):", String(item.amount));
  if (!newAmount) return;

  const amt = Number(newAmount);
  if (!Number.isFinite(amt) || amt <= 0) {
    alert("Invalid amount.");
    return;
  }

  item.date = newDate;
  item.category = newCategory;
  item.desc = newDesc.trim();
  item.amount = amt;
  item.updatedAt = Date.now();

  saveExpenses(expenses);
  render();
}

form.addEventListener("submit", (e) => {
  e.preventDefault();
  const date = dateInput.value;
  const category = categoryInput.value;
  const desc = descInput.value;
  const amount = amountInput.value;

  const amt = Number(amount);
  if (!Number.isFinite(amt) || amt <= 0) {
    alert("Please enter a valid amount.");
    return;
  }

  addExpense({ date, category, desc, amount: amt });

  // Keep date/month, clear desc+amount
  descInput.value = "";
  amountInput.value = "";
  descInput.focus();
});

resetBtn.addEventListener("click", () => {
  dateInput.value = todayISO();
  categoryInput.value = "Food";
  descInput.value = "";
  amountInput.value = "";
});

tbody.addEventListener("click", (e) => {
  const btn = e.target.closest("button[data-action]");
  if (!btn) return;

  const action = btn.dataset.action;
  const id = btn.dataset.id;

  if (action === "delete") {
    if (confirm("Delete this expense?")) deleteExpense(id);
  } else if (action === "edit") {
    editExpense(id);
  }
});

function download(filename, text) {
  const a = document.createElement("a");
  a.href = URL.createObjectURL(new Blob([text], { type: "application/json" }));
  a.download = filename;
  a.click();
  URL.revokeObjectURL(a.href);
}

exportBtn.addEventListener("click", () => {
  const payload = {
    version: 1,
    exportedAt: new Date().toISOString(),
    expenses,
  };
  download(`expenses_backup_${currentMonthISO()}.json`, JSON.stringify(payload, null, 2));
});

importInput.addEventListener("change", async () => {
  const file = importInput.files?.[0];
  if (!file) return;

  try {
    const text = await file.text();
    const obj = JSON.parse(text);
    if (!obj || !Array.isArray(obj.expenses)) throw new Error("Bad format");

    // Merge by id (prefer imported)
    const byId = new Map(expenses.map(e => [e.id, e]));
    for (const e of obj.expenses) {
      if (e && e.id) byId.set(e.id, e);
    }
    expenses = Array.from(byId.values());

    saveExpenses(expenses);
    render();
    alert("Import successful.");
  } catch (err) {
    alert("Import failed. Please choose a valid backup JSON.");
  } finally {
    importInput.value = "";
  }
});

clearAllBtn.addEventListener("click", () => {
  if (!confirm("This will delete ALL saved expenses in this browser. Continue?")) return;
  expenses = [];
  saveExpenses(expenses);
  render();
});

// Filters
monthFilter.addEventListener("input", render);
categoryFilter.addEventListener("change", render);
searchFilter.addEventListener("input", render);

// Init defaults
dateInput.value = todayISO();
monthFilter.value = currentMonthISO();
render();
