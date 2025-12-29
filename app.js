const storageKey = 'daily-expense-tracker:entries';
const form = document.getElementById('expense-form');
const dateInput = document.getElementById('date');
const descriptionInput = document.getElementById('description');
const categoryInput = document.getElementById('category');
const paymentInput = document.getElementById('payment');
const amountInput = document.getElementById('amount');
const notesInput = document.getElementById('notes');
const tableBody = document.getElementById('expense-rows');
const statsContainer = document.getElementById('stats');
const entryCount = document.getElementById('entry-count');
const filterFrom = document.getElementById('filter-from');
const filterTo = document.getElementById('filter-to');
const filterCategory = document.getElementById('filter-category');
const filterSearch = document.getElementById('filter-search');
const resetFilters = document.getElementById('reset-filters');
const clearAll = document.getElementById('clear-all');

let entries = loadEntries();
setDefaultDate();
render();

form.addEventListener('submit', (event) => {
  event.preventDefault();

  const amount = parseFloat(amountInput.value);
  if (Number.isNaN(amount) || amount <= 0) {
    amountInput.focus();
    return;
  }

  const entry = {
    id: createId(),
    date: dateInput.value || new Date().toISOString().slice(0, 10),
    description: descriptionInput.value.trim(),
    category: (categoryInput.value || 'Uncategorized').trim(),
    payment: paymentInput.value,
    amount: Number(amount.toFixed(2)),
    notes: notesInput.value.trim(),
    createdAt: new Date().toISOString(),
  };

  entries = [entry, ...entries];
  saveEntries(entries);
  form.reset();
  setDefaultDate();
  categoryInput.value = entry.category;
  render();
});

filterFrom.addEventListener('change', render);
filterTo.addEventListener('change', render);
filterCategory.addEventListener('input', render);
filterSearch.addEventListener('input', render);
resetFilters.addEventListener('click', () => {
  filterFrom.value = '';
  filterTo.value = '';
  filterCategory.value = '';
  filterSearch.value = '';
  render();
});

clearAll.addEventListener('click', () => {
  if (!entries.length) return;
  const confirmed = confirm('Remove all saved expenses?');
  if (!confirmed) return;
  entries = [];
  saveEntries(entries);
  render();
});

tableBody.addEventListener('click', (event) => {
  const { target } = event;
  if (target.matches('[data-delete]')) {
    const id = target.getAttribute('data-delete');
    entries = entries.filter((entry) => entry.id !== id);
    saveEntries(entries);
    render();
  }
});

function loadEntries() {
  try {
    const stored = localStorage.getItem(storageKey);
    return stored ? JSON.parse(stored) : [];
  } catch (error) {
    console.error('Unable to load entries', error);
    return [];
  }
}

function saveEntries(list) {
  localStorage.setItem(storageKey, JSON.stringify(list));
}

function setDefaultDate() {
  const today = new Date().toISOString().slice(0, 10);
  dateInput.value = today;
}

function applyFilters(list) {
  const from = filterFrom.value ? new Date(filterFrom.value) : null;
  const to = filterTo.value ? new Date(filterTo.value) : null;
  const category = filterCategory.value.trim().toLowerCase();
  const search = filterSearch.value.trim().toLowerCase();

  return list.filter((entry) => {
    const entryDate = new Date(entry.date);
    const withinFrom = from ? entryDate >= from : true;
    const withinTo = to ? entryDate <= to : true;
    const matchesCategory = category ? entry.category.toLowerCase().includes(category) : true;
    const matchesSearch = search
      ? entry.description.toLowerCase().includes(search) || entry.notes.toLowerCase().includes(search)
      : true;

    return withinFrom && withinTo && matchesCategory && matchesSearch;
  });
}

function summarize(list) {
  const total = list.reduce((sum, entry) => sum + entry.amount, 0);
  const count = list.length;

  const months = new Map();
  const categories = new Map();
  let earliestMs = null;
  let latestMs = null;

  for (const entry of list) {
    const monthKey = entry.date.slice(0, 7);
    months.set(monthKey, (months.get(monthKey) || 0) + entry.amount);
    categories.set(entry.category, (categories.get(entry.category) || 0) + entry.amount);

    const dateMs = new Date(entry.date).getTime();
    earliestMs = earliestMs !== null ? Math.min(earliestMs, dateMs) : dateMs;
    latestMs = latestMs !== null ? Math.max(latestMs, dateMs) : dateMs;
  }

  const daysActive =
    earliestMs !== null && latestMs !== null
      ? Math.max(1, Math.round((latestMs - earliestMs) / (1000 * 60 * 60 * 24)) + 1)
      : 0;
  const averagePerDay = daysActive ? total / daysActive : 0;

  const thisMonthKey = new Date().toISOString().slice(0, 7);
  const monthTotal = months.get(thisMonthKey) || 0;

  const topCategory = Array.from(categories.entries()).sort((a, b) => b[1] - a[1])[0];

  return {
    total,
    count,
    averagePerDay,
    monthTotal,
    topCategory,
  };
}

function render() {
  const filtered = applyFilters(entries);
  renderTable(filtered);
  renderStats(filtered);
  updateCounts(filtered);
}

function renderTable(list) {
  if (!list.length) {
    tableBody.innerHTML = '<tr class="empty"><td colspan="6">No expenses match your filters.</td></tr>';
    return;
  }

  const rows = list
    .sort((a, b) => new Date(b.date) - new Date(a.date))
    .map((entry) => {
      const note = entry.notes ? `<p class="note-text">${escapeHtml(entry.notes)}</p>` : '';
      return `
        <tr>
          <td>${formatDate(entry.date)}</td>
          <td>
            <div>${escapeHtml(entry.description)}</div>
            ${note}
          </td>
          <td><span class="badge-pill">${escapeHtml(entry.category || 'Uncategorized')}</span></td>
          <td>${escapeHtml(entry.payment)}</td>
          <td class="num">${formatCurrency(entry.amount)}</td>
          <td class="actions"><button class="delete" data-delete="${entry.id}">Delete</button></td>
        </tr>
      `;
    })
    .join('');

  tableBody.innerHTML = rows;
}

function renderStats(list) {
  const { total, count, averagePerDay, monthTotal, topCategory } = summarize(list);

  const stats = [
    {
      label: 'Filtered total',
      value: formatCurrency(total),
      detail: `${count} entr${count === 1 ? 'y' : 'ies'}`,
    },
    {
      label: 'Average per day',
      value: formatCurrency(averagePerDay),
      detail: list.length ? 'Across active days' : 'No data yet',
    },
    {
      label: 'This month',
      value: formatCurrency(monthTotal),
      detail: 'Month-to-date total',
    },
    {
      label: 'Top category',
      value: topCategory ? `${topCategory[0]} • ${formatCurrency(topCategory[1])}` : '—',
      detail: topCategory ? 'Highest spend' : 'Add expenses to see insights',
    },
  ];

  statsContainer.innerHTML = stats
    .map(
      (stat) => `
        <div class="stat-card">
          <p class="stat-label">${stat.label}</p>
          <p class="stat-value">${stat.value}</p>
          <p class="stat-trend">${stat.detail}</p>
        </div>
      `,
    )
    .join('');
}

function updateCounts(list) {
  entryCount.textContent = `${list.length} entr${list.length === 1 ? 'y' : 'ies'} shown`;
  refreshCategorySuggestions();
}

function refreshCategorySuggestions() {
  const datalist = document.getElementById('category-options');
  const uniqueCategories = Array.from(new Set(entries.map((entry) => entry.category).filter(Boolean)));
  const preset = ['Food', 'Transport', 'Housing', 'Utilities', 'Health', 'Entertainment'];
  const merged = Array.from(new Set([...preset, ...uniqueCategories]));

  datalist.innerHTML = merged.map((category) => `<option value="${escapeHtml(category)}"></option>`).join('');
}

function formatDate(dateString) {
  const formatter = new Intl.DateTimeFormat(undefined, { year: 'numeric', month: 'short', day: 'numeric' });
  return formatter.format(new Date(dateString));
}

function formatCurrency(value) {
  const formatter = new Intl.NumberFormat(undefined, { style: 'currency', currency: 'USD' });
  return formatter.format(value || 0);
}

function escapeHtml(text) {
  const map = {
    '&': '&amp;',
    '<': '&lt;',
    '>': '&gt;',
    '"': '&quot;',
    "'": '&#039;',
  };
  return String(text).replace(/[&<>"']/g, (m) => map[m]);
}

function createId() {
  if (typeof crypto !== 'undefined' && crypto.randomUUID) {
    return crypto.randomUUID();
  }
  return `id-${Date.now()}-${Math.random().toString(16).slice(2)}`;
}
