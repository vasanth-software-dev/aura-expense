/* ==========================================================================
   Aura Expense - Core Mobile Web Application Logic
   ========================================================================== */

// --- Category System & Colors ---
const CATEGORIES = {
  'Food': { icon: '🍔', color: '#FF9500', name: 'Food & Dining' },
  'Groceries': { icon: '🛒', color: '#30B0C7', name: 'Groceries' },
  'Shopping': { icon: '🛍️', color: '#AF52DE', name: 'Shopping' },
  'Transport': { icon: '🚗', color: '#007AFF', name: 'Transport' },
  'Bills': { icon: '⚡', color: '#FF2D55', name: 'Bills & Utilities' },
  'Entertainment': { icon: '🎬', color: '#FF375F', name: 'Entertainment' },
  'Health': { icon: '💊', color: '#34C759', name: 'Health' },
  'Salary': { icon: '💰', color: '#30D158', name: 'Salary' },
  'Investment': { icon: '📈', color: '#5E5CE6', name: 'Investment' },
  'Travel': { icon: '✈️', color: '#00C7BE', name: 'Travel' },
  'Other': { icon: '🏷️', color: '#8E8E93', name: 'Other' },
};

// --- Initial Demo Transactions ---
const INITIAL_TRANSACTIONS = [
  {
    id: 'tx-1',
    merchant: 'Swiggy',
    amount: 450,
    type: 'EXPENSE',
    category: 'Food',
    account: 'HDFC Bank ••4092',
    date: '2026-09-25T14:30:00Z',
    upiRef: '428910284',
    note: 'Lunch delivery',
  },
  {
    id: 'tx-2',
    merchant: 'Zepto Quick Commerce',
    amount: 1250,
    type: 'EXPENSE',
    category: 'Groceries',
    account: 'SBI ••8120',
    date: '2026-09-25T11:15:00Z',
    upiRef: '981723401',
    note: 'Fresh veggies & milk',
  },
  {
    id: 'tx-3',
    merchant: 'Uber India',
    amount: 280,
    type: 'EXPENSE',
    category: 'Transport',
    account: 'Axis Bank ••3301',
    date: '2026-09-25T08:45:00Z',
    upiRef: '310928319',
    note: 'Office commute',
  },
  {
    id: 'tx-4',
    merchant: 'Tech Corp India Pvt Ltd',
    amount: 85000,
    type: 'INCOME',
    category: 'Salary',
    account: 'HDFC Bank ••4092',
    date: '2026-09-24T10:00:00Z',
    upiRef: 'NEFT-8842109',
    note: 'Monthly Salary Credit',
  },
  {
    id: 'tx-5',
    merchant: 'Amazon India',
    amount: 3499,
    type: 'EXPENSE',
    category: 'Shopping',
    account: 'ICICI Bank ••9914',
    date: '2026-09-24T18:20:00Z',
    upiRef: 'CARD-9914',
    note: 'Wireless Earbuds',
  },
  {
    id: 'tx-6',
    merchant: 'Tata Power Electricity',
    amount: 1850,
    type: 'EXPENSE',
    category: 'Bills',
    account: 'SBI ••8120',
    date: '2026-09-22T16:00:00Z',
    upiRef: 'BBPS-482910',
    note: 'September Electricity',
  },
  {
    id: 'tx-7',
    merchant: 'Blue Tokai Coffee Roasters',
    amount: 340,
    type: 'EXPENSE',
    category: 'Food',
    account: 'HDFC Bank ••4092',
    date: '2026-09-21T09:30:00Z',
    upiRef: 'UPI-771928',
    note: 'Cold brew & croissant',
  }
];

// --- Initial Review Items ---
const INITIAL_REVIEW_ITEMS = [
  {
    id: 'rev-1',
    merchant: 'M/S Venkateshwara Store',
    amount: 1250,
    suggestedCategory: 'Groceries',
    account: 'SBI ••8120',
    time: 'Today, 2:15 PM',
  },
  {
    id: 'rev-2',
    merchant: 'PAYTM*RECHARGE-AIRTEL',
    amount: 499,
    suggestedCategory: 'Bills',
    account: 'HDFC ••4092',
    time: 'Yesterday, 11:30 AM',
  }
];

// --- State Store ---
class ExpenseStore {
  constructor() {
    this.transactions = this.load('aura_transactions', INITIAL_TRANSACTIONS);
    this.reviewItems = this.load('aura_reviews', INITIAL_REVIEW_ITEMS);
    this.monthlyBudget = this.load('aura_budget', 30000);
    this.theme = localStorage.getItem('aura_theme') || 'dark';
    this.currentTab = 'home';
    this.selectedCategory = 'Food';
    this.txFilter = 'ALL';
    this.searchQuery = '';
  }

  load(key, fallback) {
    try {
      const data = localStorage.getItem(key);
      return data ? JSON.parse(data) : fallback;
    } catch {
      return fallback;
    }
  }

  save() {
    localStorage.setItem('aura_transactions', JSON.stringify(this.transactions));
    localStorage.setItem('aura_reviews', JSON.stringify(this.reviewItems));
    localStorage.setItem('aura_budget', JSON.stringify(this.monthlyBudget));
    localStorage.setItem('aura_theme', this.theme);
  }

  addTransaction(tx) {
    this.transactions.unshift(tx);
    this.save();
  }

  deleteTransaction(id) {
    this.transactions = this.transactions.filter(t => t.id !== id);
    this.save();
  }

  resolveReview(id, category, addToTransactions = true) {
    const item = this.reviewItems.find(r => r.id === id);
    if (!item) return;

    if (addToTransactions) {
      this.addTransaction({
        id: 'tx-' + Date.now(),
        merchant: item.merchant,
        amount: item.amount,
        type: 'EXPENSE',
        category: category || item.suggestedCategory,
        account: item.account,
        date: new Date().toISOString(),
        upiRef: 'UPI-' + Math.floor(10000000 + Math.random() * 90000000),
        note: 'Categorized from Review Queue'
      });
    }

    this.reviewItems = this.reviewItems.filter(r => r.id !== id);
    this.save();
  }

  getTotalSpentThisMonth() {
    return this.transactions
      .filter(t => t.type === 'EXPENSE')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getTotalIncomeThisMonth() {
    return this.transactions
      .filter(t => t.type === 'INCOME')
      .reduce((sum, t) => sum + Number(t.amount), 0);
  }

  getCategoryTotals() {
    const totals = {};
    for (const cat in CATEGORIES) {
      totals[cat] = 0;
    }
    this.transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        if (totals[t.category] !== undefined) {
          totals[t.category] += Number(t.amount);
        } else {
          totals['Other'] = (totals['Other'] || 0) + Number(t.amount);
        }
      });
    return totals;
  }
}

// Instantiate global state
const store = new ExpenseStore();

// --- Currency Formatter (Indian Lakhs Format) ---
function formatINR(val, includeDecimals = true) {
  const num = Number(val) || 0;
  return new Intl.NumberFormat('en-IN', {
    style: 'currency',
    currency: 'INR',
    maximumFractionDigits: includeDecimals ? 2 : 0,
    minimumFractionDigits: includeDecimals ? 2 : 0,
  }).format(num);
}

// Format relative date
function formatDateLabel(dateStr) {
  const d = new Date(dateStr);
  const now = new Date();
  const isToday = d.toDateString() === now.toDateString();
  const yesterday = new Date();
  yesterday.setDate(now.getDate() - 1);
  const isYesterday = d.toDateString() === yesterday.toDateString();

  if (isToday) return 'Today';
  if (isYesterday) return 'Yesterday';
  return d.toLocaleDateString('en-IN', { month: 'short', day: 'numeric' });
}

function formatTimeLabel(dateStr) {
  const d = new Date(dateStr);
  return d.toLocaleTimeString('en-IN', { hour: '2-digit', minute: '2-digit' });
}

// Haptic feedback for native feel
function triggerHaptic(type = 'light') {
  if (navigator.vibrate) {
    if (type === 'light') navigator.vibrate(12);
    else if (type === 'medium') navigator.vibrate(25);
    else if (type === 'success') navigator.vibrate([15, 30, 20]);
  }
}

// Toast message
function showToast(msg) {
  const toast = document.getElementById('toast-msg');
  if (!toast) return;
  toast.textContent = msg;
  toast.classList.add('show');
  setTimeout(() => toast.classList.remove('show'), 2500);
}

// --- DOM Rendering & Controller ---
document.addEventListener('DOMContentLoaded', () => {
  // Apply saved theme
  document.documentElement.setAttribute('data-theme', store.theme);
  updateThemeIcon();

  // Set today's date in header
  const dateEl = document.getElementById('header-date');
  if (dateEl) {
    const today = new Date();
    dateEl.textContent = today.toLocaleDateString('en-IN', { month: 'long', day: 'numeric' });
  }

  // Bind Bottom Nav Tabs
  document.querySelectorAll('.nav-tab-btn[data-tab]').forEach(btn => {
    btn.addEventListener('click', () => {
      triggerHaptic('light');
      switchTab(btn.dataset.tab);
    });
  });

  // Bind Theme Toggle
  const themeBtn = document.getElementById('btn-theme-toggle');
  if (themeBtn) {
    themeBtn.addEventListener('click', () => {
      triggerHaptic('light');
      toggleTheme();
    });
  }

  // Bind Add Expense Modal & Float Button
  const addBtn = document.getElementById('btn-nav-add');
  const addModal = document.getElementById('modal-add-expense');
  const addModalClose = document.getElementById('btn-close-add-modal');

  if (addBtn && addModal) {
    addBtn.addEventListener('click', () => {
      triggerHaptic('medium');
      openAddModal();
    });
  }
  if (addModalClose && addModal) {
    addModalClose.addEventListener('click', () => {
      closeModal('modal-add-expense');
    });
  }

  // Bind QR Code Modal
  const qrBtn = document.getElementById('btn-show-qr');
  const qrModal = document.getElementById('modal-qr');
  const qrModalClose = document.getElementById('btn-close-qr-modal');

  if (qrBtn) {
    qrBtn.addEventListener('click', () => {
      triggerHaptic('light');
      openQrModal();
    });
  }
  if (qrModalClose) {
    qrModalClose.addEventListener('click', () => {
      closeModal('modal-qr');
    });
  }

  // Render initial components
  renderCategoryGrid();
  renderAllViews();
  setupAddExpenseForm();
  setupSmsSimulator();
  setupFilterAndSearch();
});

// --- Tab Switching ---
function switchTab(tabName) {
  store.currentTab = tabName;
  document.querySelectorAll('.tab-content').forEach(el => el.classList.remove('active'));
  document.querySelectorAll('.nav-tab-btn[data-tab]').forEach(el => el.classList.remove('active'));

  const activeTabContent = document.getElementById(`tab-${tabName}`);
  const activeNavBtn = document.querySelector(`.nav-tab-btn[data-tab="${tabName}"]`);

  if (activeTabContent) activeTabContent.classList.add('active');
  if (activeNavBtn) activeNavBtn.classList.add('active');

  // Trigger sub-renders
  if (tabName === 'reports') renderReports();
  if (tabName === 'budgets') renderBudgetsView();
  if (tabName === 'transactions') renderTransactionsList();
  if (tabName === 'home') renderHomeDashboard();
}

// --- Theme Toggle ---
function toggleTheme() {
  store.theme = store.theme === 'dark' ? 'light' : 'dark';
  document.documentElement.setAttribute('data-theme', store.theme);
  store.save();
  updateThemeIcon();
}

function updateThemeIcon() {
  const icon = document.getElementById('theme-icon');
  if (icon) {
    icon.textContent = store.theme === 'dark' ? '☀️' : '🌙';
  }
}

// --- Home Dashboard Rendering ---
function renderHomeDashboard() {
  const totalSpent = store.getTotalSpentThisMonth();
  const budget = store.monthlyBudget;
  const remaining = Math.max(0, budget - totalSpent);
  const ratio = Math.min(100, Math.round((totalSpent / budget) * 100));

  // Spent Hero
  const spentEl = document.getElementById('hero-spent-amount');
  if (spentEl) spentEl.textContent = formatINR(totalSpent);

  const dailyAvg = (totalSpent / (new Date().getDate() || 1));
  const avgEl = document.getElementById('hero-daily-avg');
  if (avgEl) avgEl.textContent = formatINR(dailyAvg, false) + '/day';

  const projected = dailyAvg * 30;
  const projEl = document.getElementById('hero-projected');
  if (projEl) projEl.textContent = formatINR(projected, false);

  // Budget Card
  const budgetRatioEl = document.getElementById('home-budget-ratio');
  if (budgetRatioEl) budgetRatioEl.textContent = `${formatINR(totalSpent, false)} / ${formatINR(budget, false)}`;

  const budgetBarEl = document.getElementById('home-budget-bar');
  if (budgetBarEl) {
    budgetBarEl.style.width = `${ratio}%`;
    if (ratio > 90) {
      budgetBarEl.style.background = 'var(--expense)';
    } else if (ratio > 75) {
      budgetBarEl.style.background = 'var(--warning)';
    } else {
      budgetBarEl.style.background = 'linear-gradient(90deg, #30D158 0%, #FF9F0A 100%)';
    }
  }

  const budgetLeftEl = document.getElementById('home-budget-left');
  if (budgetLeftEl) budgetLeftEl.textContent = `${formatINR(remaining, false)} remaining`;

  const budgetPercentEl = document.getElementById('home-budget-percent');
  if (budgetPercentEl) budgetPercentEl.textContent = `${ratio}% used`;

  // Review Queue Notice
  const reviewCard = document.getElementById('home-review-card');
  const reviewCountEl = document.getElementById('home-review-count');
  if (reviewCard && reviewCountEl) {
    if (store.reviewItems.length > 0) {
      reviewCard.style.display = 'flex';
      reviewCountEl.textContent = `${store.reviewItems.length} transaction${store.reviewItems.length > 1 ? 's' : ''} need review`;
    } else {
      reviewCard.style.display = 'none';
    }
  }

  // Quick Category Pills
  renderCategoryPills();

  // Recent Transactions (limit to 5)
  renderRecentTransactions();
}

function renderCategoryPills() {
  const container = document.getElementById('home-category-pills');
  if (!container) return;

  const totals = store.getCategoryTotals();
  container.innerHTML = Object.entries(CATEGORIES).map(([catKey, info]) => {
    const amount = totals[catKey] || 0;
    return `
      <div class="cat-chip" onclick="filterByCategory('${catKey}')">
        <span class="cat-indicator" style="background-color: ${info.color};"></span>
        <span>${info.icon} ${catKey}</span>
        <span style="color: var(--text-tertiary); font-size: 11px;">${formatINR(amount, false)}</span>
      </div>
    `;
  }).join('');
}

function filterByCategory(catKey) {
  triggerHaptic('light');
  store.selectedCategory = catKey;
  store.txFilter = 'ALL';
  store.searchQuery = catKey;
  switchTab('transactions');
  const searchInput = document.getElementById('input-tx-search');
  if (searchInput) searchInput.value = catKey;
  renderTransactionsList();
}

function renderRecentTransactions() {
  const container = document.getElementById('home-recent-list');
  if (!container) return;

  const recents = store.transactions.slice(0, 5);
  if (recents.length === 0) {
    container.innerHTML = `<div style="text-align: center; padding: 24px; color: var(--text-tertiary);">No transactions recorded yet. Tap + to add one!</div>`;
    return;
  }

  container.innerHTML = recents.map(tx => renderTxItemHtml(tx)).join('');
}

function renderTxItemHtml(tx) {
  const cat = CATEGORIES[tx.category] || CATEGORIES['Other'];
  const isExpense = tx.type === 'EXPENSE';
  const prefix = isExpense ? '-' : '+';
  const amountClass = isExpense ? 'expense' : 'income';

  return `
    <div class="tx-item" onclick="openTransactionDetail('${tx.id}')">
      <div class="tx-left">
        <div class="tx-icon" style="background: ${cat.color}20; color: ${cat.color};">
          ${cat.icon}
        </div>
        <div class="tx-details">
          <div class="tx-merchant">${escapeHtml(tx.merchant)}</div>
          <div class="tx-meta">
            <span class="tx-badge">${escapeHtml(tx.account || 'HDFC')}</span>
            <span>•</span>
            <span>${formatDateLabel(tx.date)}</span>
          </div>
        </div>
      </div>
      <div class="tx-right">
        <div class="tx-amount ${amountClass}">${prefix}${formatINR(tx.amount)}</div>
        <div class="tx-time">${formatTimeLabel(tx.date)}</div>
      </div>
    </div>
  `;
}

// --- Transactions List & Filter ---
function setupFilterAndSearch() {
  document.querySelectorAll('.segmented-option[data-filter]').forEach(opt => {
    opt.addEventListener('click', () => {
      triggerHaptic('light');
      document.querySelectorAll('.segmented-option[data-filter]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      store.txFilter = opt.dataset.filter;
      renderTransactionsList();
    });
  });

  const searchInput = document.getElementById('input-tx-search');
  if (searchInput) {
    searchInput.addEventListener('input', (e) => {
      store.searchQuery = e.target.value.toLowerCase().trim();
      renderTransactionsList();
    });
  }
}

function renderTransactionsList() {
  const container = document.getElementById('tx-full-list');
  if (!container) return;

  let filtered = store.transactions;

  // Filter type
  if (store.txFilter === 'EXPENSE') {
    filtered = filtered.filter(t => t.type === 'EXPENSE');
  } else if (store.txFilter === 'INCOME') {
    filtered = filtered.filter(t => t.type === 'INCOME');
  }

  // Filter search
  if (store.searchQuery) {
    filtered = filtered.filter(t =>
      t.merchant.toLowerCase().includes(store.searchQuery) ||
      (t.category && t.category.toLowerCase().includes(store.searchQuery)) ||
      (t.note && t.note.toLowerCase().includes(store.searchQuery)) ||
      (t.account && t.account.toLowerCase().includes(store.searchQuery)) ||
      String(t.amount).includes(store.searchQuery)
    );
  }

  if (filtered.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
        <div style="font-size: 36px; margin-bottom: 8px;">🔍</div>
        <div style="font-weight: 600; color: var(--text-secondary);">No transactions match your search</div>
        <div style="font-size: 13px; margin-top: 4px;">Try searching a different keyword or amount</div>
      </div>
    `;
    return;
  }

  // Group by Date
  const groups = {};
  filtered.forEach(tx => {
    const label = formatDateLabel(tx.date);
    if (!groups[label]) groups[label] = [];
    groups[label].push(tx);
  });

  let html = '';
  for (const [dateGroup, items] of Object.entries(groups)) {
    html += `
      <div style="font-size: 13px; font-weight: 700; color: var(--text-secondary); text-transform: uppercase; letter-spacing: 0.5px; margin: 16px 4px 8px;">
        ${dateGroup}
      </div>
      <div class="tx-list-group">
        ${items.map(tx => renderTxItemHtml(tx)).join('')}
      </div>
    `;
  }

  container.innerHTML = html;
}

// --- Transaction Detail Sheet ---
function openTransactionDetail(txId) {
  triggerHaptic('light');
  const tx = store.transactions.find(t => t.id === txId);
  if (!tx) return;

  const modal = document.getElementById('modal-tx-detail');
  const body = document.getElementById('tx-detail-body');
  if (!modal || !body) return;

  const cat = CATEGORIES[tx.category] || CATEGORIES['Other'];
  const isExpense = tx.type === 'EXPENSE';

  body.innerHTML = `
    <div style="text-align: center; margin: 10px 0 20px;">
      <div style="display: inline-flex; align-items: center; justify-content: center; width: 60px; height: 60px; border-radius: 20px; background: ${cat.color}20; font-size: 32px; margin-bottom: 12px;">
        ${cat.icon}
      </div>
      <div style="font-size: 22px; font-weight: 800; color: var(--text-primary);">${escapeHtml(tx.merchant)}</div>
      <div style="font-size: 36px; font-weight: 800; color: ${isExpense ? 'var(--expense)' : 'var(--income)'}; margin-top: 4px;">
        ${isExpense ? '-' : '+'}${formatINR(tx.amount)}
      </div>
      <div style="font-size: 13px; color: var(--text-secondary); margin-top: 2px;">
        ${new Date(tx.date).toLocaleString('en-IN', { dateStyle: 'full', timeStyle: 'short' })}
      </div>
    </div>

    <div class="ios-card" style="padding: 14px 18px; margin-bottom: 20px;">
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--divider);">
        <span style="color: var(--text-secondary); font-size: 14px;">Category</span>
        <span style="font-weight: 600; color: ${cat.color};">${cat.icon} ${cat.name}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--divider);">
        <span style="color: var(--text-secondary); font-size: 14px;">Payment Account</span>
        <span style="font-weight: 600;">${escapeHtml(tx.account || 'HDFC Bank ••4092')}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0; border-bottom: 1px solid var(--divider);">
        <span style="color: var(--text-secondary); font-size: 14px;">UPI / Reference</span>
        <span style="font-family: monospace; font-weight: 600; color: var(--accent);">${escapeHtml(tx.upiRef || 'UPI-' + tx.id.slice(-6))}</span>
      </div>
      <div style="display: flex; justify-content: space-between; padding: 10px 0;">
        <span style="color: var(--text-secondary); font-size: 14px;">Notes</span>
        <span style="font-weight: 500; color: var(--text-primary);">${escapeHtml(tx.note || 'None')}</span>
      </div>
    </div>

    <button class="btn-primary" style="background: var(--expense); box-shadow: 0 4px 14px rgba(255, 69, 58, 0.3);" onclick="deleteCurrentTx('${tx.id}')">
      Delete Transaction
    </button>
  `;

  modal.classList.add('open');
}

function deleteCurrentTx(id) {
  triggerHaptic('medium');
  store.deleteTransaction(id);
  closeModal('modal-tx-detail');
  showToast('✓ Transaction removed');
  renderAllViews();
}

// --- Add Expense Modal Logic ---
function openAddModal() {
  const modal = document.getElementById('modal-add-expense');
  if (modal) {
    modal.classList.add('open');
    const input = document.getElementById('input-amount-hero');
    if (input) {
      input.value = '';
      setTimeout(() => input.focus(), 300);
    }
  }
}

function closeModal(modalId) {
  const modal = document.getElementById(modalId);
  if (modal) modal.classList.remove('open');
}

function renderCategoryGrid() {
  const grid = document.getElementById('category-picker-grid');
  if (!grid) return;

  grid.innerHTML = Object.entries(CATEGORIES).map(([catKey, info]) => `
    <div class="cat-picker-item ${catKey === store.selectedCategory ? 'selected' : ''}" data-cat="${catKey}" onclick="selectCategory('${catKey}')">
      <div class="cat-picker-icon">${info.icon}</div>
      <div class="cat-picker-name">${catKey}</div>
    </div>
  `).join('');
}

function selectCategory(catKey) {
  triggerHaptic('light');
  store.selectedCategory = catKey;
  document.querySelectorAll('.cat-picker-item').forEach(el => {
    el.classList.toggle('selected', el.dataset.cat === catKey);
  });
}

function setupAddExpenseForm() {
  // Quick amount additions (+100, +500, +1000, +2000)
  document.querySelectorAll('.quick-amount-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      const addVal = Number(chip.dataset.add) || 0;
      const amountInput = document.getElementById('input-amount-hero');
      const current = Number(amountInput.value) || 0;
      amountInput.value = (current + addVal).toString();
    });
  });

  // Type selector (Expense / Income / Transfer)
  let activeTxType = 'EXPENSE';
  document.querySelectorAll('.segmented-option[data-type]').forEach(opt => {
    opt.addEventListener('click', () => {
      triggerHaptic('light');
      document.querySelectorAll('.segmented-option[data-type]').forEach(o => o.classList.remove('active'));
      opt.classList.add('active');
      activeTxType = opt.dataset.type;
    });
  });

  // Save Transaction
  const form = document.getElementById('form-add-expense');
  if (form) {
    form.addEventListener('submit', (e) => {
      e.preventDefault();
      const amountInput = document.getElementById('input-amount-hero');
      const merchantInput = document.getElementById('input-merchant');
      const accountSelect = document.getElementById('select-account');
      const noteInput = document.getElementById('input-note');

      const amount = parseFloat(amountInput.value);
      if (!amount || amount <= 0) {
        showToast('Please enter a valid amount');
        return;
      }

      const merchant = merchantInput.value.trim() || (activeTxType === 'INCOME' ? 'Credit Deposit' : 'General Store');
      const account = accountSelect.value;
      const note = noteInput.value.trim();

      const newTx = {
        id: 'tx-' + Date.now(),
        merchant,
        amount,
        type: activeTxType,
        category: store.selectedCategory,
        account,
        date: new Date().toISOString(),
        upiRef: 'UPI-' + Math.floor(10000000 + Math.random() * 90000000),
        note,
      };

      store.addTransaction(newTx);
      triggerHaptic('success');
      showToast('✓ Expense recorded successfully');
      closeModal('modal-add-expense');

      // Clear fields
      amountInput.value = '';
      merchantInput.value = '';
      noteInput.value = '';

      renderAllViews();
    });
  }
}

// --- Budgets View Rendering ---
function renderBudgetsView() {
  const container = document.getElementById('budgets-category-list');
  if (!container) return;

  const totals = store.getCategoryTotals();
  const categoryBudgets = {
    'Food': 10000,
    'Shopping': 8000,
    'Groceries': 6000,
    'Transport': 4000,
    'Bills': 5000,
    'Entertainment': 3000,
    'Health': 2500,
    'Travel': 5000,
  };

  container.innerHTML = Object.entries(categoryBudgets).map(([catKey, budgetLimit]) => {
    const cat = CATEGORIES[catKey] || CATEGORIES['Other'];
    const spent = totals[catKey] || 0;
    const ratio = Math.min(100, Math.round((spent / budgetLimit) * 100));
    const isExceeded = spent > budgetLimit;

    let barColor = 'var(--income)';
    if (ratio > 90) barColor = 'var(--expense)';
    else if (ratio > 75) barColor = 'var(--warning)';

    return `
      <div class="ios-card" style="padding: 14px 18px; margin-bottom: 12px;">
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <div style="display: flex; align-items: center; gap: 8px; font-weight: 700;">
            <span style="font-size: 20px;">${cat.icon}</span>
            <span>${catKey}</span>
          </div>
          <div style="font-size: 13px; font-weight: 600; color: ${isExceeded ? 'var(--expense)' : 'var(--text-secondary)'};">
            ${formatINR(spent, false)} / ${formatINR(budgetLimit, false)}
          </div>
        </div>
        <div class="budget-progress-track" style="margin-bottom: 6px;">
          <div style="width: ${ratio}%; height: 100%; border-radius: var(--radius-full); background: ${barColor}; transition: width 0.5s ease;"></div>
        </div>
        <div style="display: flex; justify-content: space-between; font-size: 11px; color: var(--text-tertiary); font-weight: 500;">
          <span>${ratio}% utilized</span>
          <span style="color: ${isExceeded ? 'var(--expense)' : 'var(--income)'}; font-weight: 600;">
            ${isExceeded ? `${formatINR(spent - budgetLimit, false)} over limit` : `${formatINR(budgetLimit - spent, false)} left`}
          </span>
        </div>
      </div>
    `;
  }).join('');
}

// --- Reports & Analytics Rendering ---
function renderReports() {
  const totals = store.getCategoryTotals();
  const totalSpent = store.getTotalSpentThisMonth();
  const sorted = Object.entries(totals)
    .filter(([_, val]) => val > 0)
    .sort((a, b) => b[1] - a[1]);

  // Donut SVG Generator
  const donutEl = document.getElementById('report-donut-svg');
  const legendEl = document.getElementById('report-donut-legend');

  if (donutEl && sorted.length > 0 && totalSpent > 0) {
    let accumulatedAngle = 0;
    const radius = 55;
    const strokeWidth = 24;
    const circumference = 2 * Math.PI * radius;

    const circlesHtml = sorted.map(([catKey, amount]) => {
      const cat = CATEGORIES[catKey] || CATEGORIES['Other'];
      const percent = amount / totalSpent;
      const strokeDash = percent * circumference;
      const dashOffset = -accumulatedAngle * circumference;
      accumulatedAngle += percent;

      return `
        <circle cx="80" cy="80" r="${radius}" fill="transparent"
          stroke="${cat.color}" stroke-width="${strokeWidth}"
          stroke-dasharray="${strokeDash} ${circumference}"
          stroke-dashoffset="${dashOffset}"
          stroke-linecap="round"
          style="transition: stroke-dasharray 0.8s ease;" />
      `;
    }).join('');

    donutEl.innerHTML = `
      <svg width="160" height="160" viewBox="0 0 160 160">
        <circle cx="80" cy="80" r="${radius}" fill="transparent" stroke="var(--bg-surface-secondary)" stroke-width="${strokeWidth}" />
        ${circlesHtml}
      </svg>
    `;

    // Legend
    if (legendEl) {
      legendEl.innerHTML = sorted.map(([catKey, amount]) => {
        const cat = CATEGORIES[catKey] || CATEGORIES['Other'];
        const pct = Math.round((amount / totalSpent) * 100);
        return `
          <div class="legend-item">
            <span class="legend-color" style="background-color: ${cat.color};"></span>
            <span class="legend-name">${cat.icon} ${catKey} (${pct}%)</span>
            <span class="legend-val">${formatINR(amount, false)}</span>
          </div>
        `;
      }).join('');
    }
  }

  // Top Merchants
  const merchantsList = document.getElementById('report-top-merchants');
  if (merchantsList) {
    const merchantMap = {};
    store.transactions
      .filter(t => t.type === 'EXPENSE')
      .forEach(t => {
        merchantMap[t.merchant] = (merchantMap[t.merchant] || 0) + Number(t.amount);
      });

    const topMerchants = Object.entries(merchantMap)
      .sort((a, b) => b[1] - a[1])
      .slice(0, 5);

    merchantsList.innerHTML = topMerchants.map(([merchant, val], idx) => `
      <div style="display: flex; justify-content: space-between; align-items: center; padding: 10px 0; border-bottom: 1px solid var(--divider);">
        <div style="display: flex; align-items: center; gap: 10px;">
          <span style="font-weight: 700; color: var(--text-tertiary); font-size: 13px; width: 16px;">#${idx + 1}</span>
          <span style="font-weight: 600; font-size: 14px;">${escapeHtml(merchant)}</span>
        </div>
        <span style="font-weight: 700; color: var(--text-primary); font-size: 14px;">${formatINR(val, false)}</span>
      </div>
    `).join('');
  }
}

// --- Live Indian Bank SMS Parser Simulation ---
const SMS_TEMPLATES = {
  hdfc: 'Sent Rs.450.00 from HDFC Bank A/C **4092 to SWIGGY UPI:428910284 on 25-09-26. Bal: INR 18,420.50',
  sbi: 'Dear SBI User, your A/C 8120 debited by Rs 1250.00 on 25Sep26 by UPI to ZEPTOMARKET. UPI Ref 981723401.',
  icici: 'ICICI Bank Card ending 9914 charged INR 3,499.00 at AMAZON INDIA on 24-Sep-26. Avl Lmt: INR 1,45,000.',
  axis: 'Axis Bank: INR 280.00 spent on Card ending 3301 at UBER INDIA on 25-Sep-26. Info: UPI/310928319',
};

function setupSmsSimulator() {
  const textarea = document.getElementById('sms-input-text');
  const resultBox = document.getElementById('sms-parse-result');
  const btnParse = document.getElementById('btn-parse-sms');

  // Preset chips
  document.querySelectorAll('.sms-preset-chip').forEach(chip => {
    chip.addEventListener('click', () => {
      triggerHaptic('light');
      document.querySelectorAll('.sms-preset-chip').forEach(c => c.classList.remove('active'));
      chip.classList.add('active');
      const bank = chip.dataset.bank;
      if (textarea && SMS_TEMPLATES[bank]) {
        textarea.value = SMS_TEMPLATES[bank];
      }
    });
  });

  // Live Parser Trigger
  if (btnParse && textarea && resultBox) {
    btnParse.addEventListener('click', () => {
      triggerHaptic('medium');
      const rawText = textarea.value.trim();
      if (!rawText) {
        showToast('Please paste or select an SMS');
        return;
      }

      const parsed = parseIndianSms(rawText);
      if (!parsed) {
        showToast('Could not parse SMS. Try another template.');
        return;
      }

      // Display parsed result
      resultBox.classList.add('active');
      const cat = CATEGORIES[parsed.category] || CATEGORIES['Other'];
      resultBox.innerHTML = `
        <div style="display: flex; justify-content: space-between; align-items: center; margin-bottom: 8px;">
          <span style="font-weight: 700; color: var(--income); font-size: 13px;">✓ SMS Parsed Successfully</span>
          <span style="font-size: 11px; color: var(--text-tertiary);">${parsed.bank}</span>
        </div>
        <div style="font-size: 20px; font-weight: 800; color: var(--expense); margin-bottom: 4px;">
          -${formatINR(parsed.amount)}
        </div>
        <div style="font-size: 14px; font-weight: 600; color: var(--text-primary); margin-bottom: 6px;">
          Merchant: ${escapeHtml(parsed.merchant)}
        </div>
        <div class="parse-pill-row">
          <span class="parse-pill">${cat.icon} ${parsed.category}</span>
          <span class="parse-pill">${parsed.account}</span>
          <span class="parse-pill">Ref: ${parsed.upiRef}</span>
        </div>
        <button class="btn-primary" style="margin-top: 12px; padding: 10px; font-size: 13px;" onclick="addParsedTx(${JSON.stringify(parsed).replace(/"/g, '&quot;')})">
          + Add to Active Transactions
        </button>
      `;
    });
  }
}

// Client-side regex engine matching backend/src/modules/parsers/
function parseIndianSms(text) {
  let amount = 0;
  let merchant = 'Unknown Merchant';
  let account = 'Bank Account';
  let bank = 'Generic Indian Bank';
  let upiRef = 'UPI-' + Math.floor(10000000 + Math.random() * 90000000);

  // 1. Amount Extraction (Rs, INR, Rs.)
  const amountMatch = text.match(/(?:Rs\.?|INR)\s*([\d,]+(?:\.\d{1,2})?)/i) ||
                      text.match(/debited\s+by\s+(?:Rs\.?|INR)?\s*([\d,]+(?:\.\d{1,2})?)/i);
  if (amountMatch) {
    amount = parseFloat(amountMatch[1].replace(/,/g, ''));
  } else {
    return null;
  }

  // 2. Bank & Account Extraction
  if (/HDFC/i.test(text)) {
    bank = 'HDFC Bank';
    const acc = text.match(/(?:\*\*|a\/c\s+)(\d{4})/i);
    account = `HDFC ••${acc ? acc[1] : '4092'}`;
  } else if (/SBI/i.test(text)) {
    bank = 'State Bank of India';
    const acc = text.match(/(?:A\/C\s+)(\d{4})/i);
    account = `SBI ••${acc ? acc[1] : '8120'}`;
  } else if (/ICICI/i.test(text)) {
    bank = 'ICICI Bank';
    const acc = text.match(/(?:ending\s+)(\d{4})/i);
    account = `ICICI ••${acc ? acc[1] : '9914'}`;
  } else if (/Axis/i.test(text)) {
    bank = 'Axis Bank';
    const acc = text.match(/(?:ending\s+)(\d{4})/i);
    account = `Axis ••${acc ? acc[1] : '3301'}`;
  }

  // 3. Merchant Extraction
  const toMatch = text.match(/(?:to|at|vpa)\s+([A-Za-z0-9\s*_\.-]+?)(?:\s+(?:UPI|on|Ref|avl|Bal)|\.|$)/i);
  if (toMatch) {
    merchant = toMatch[1].replace(/^(UPI to|by UPI to)\s+/i, '').trim();
  }

  // 4. UPI Ref Extraction
  const refMatch = text.match(/(?:UPI(?:\s*Ref)?[:\s/]+)(\d+)/i);
  if (refMatch) {
    upiRef = refMatch[1];
  }

  // 5. Smart Categorization
  let category = 'Other';
  const mLower = merchant.toLowerCase();
  if (/swiggy|zomato|starbucks|blue tokai|mcdonald|kfc|burger|restaurant|food/i.test(mLower)) category = 'Food';
  else if (/zepto|blinkit|instamart|bigbasket|grofers|supermarket|kirana/i.test(mLower)) category = 'Groceries';
  else if (/amazon|flipkart|myntra|zara|h&m|ajio|croma/i.test(mLower)) category = 'Shopping';
  else if (/uber|ola|rapido|metro|fuel|petrol|hpcl|bpcl|ioc/i.test(mLower)) category = 'Transport';
  else if (/electricity|power|airtel|jio|vi|broadband|water|bescom|tata power/i.test(mLower)) category = 'Bills';
  else if (/netflix|spotify|prime|pvr|inox|cinema/i.test(mLower)) category = 'Entertainment';
  else if (/apollo|pharmacy|medplus|netmeds|hospital|dr\b/i.test(mLower)) category = 'Health';

  return {
    amount,
    merchant,
    bank,
    account,
    upiRef,
    category,
  };
}

function addParsedTx(parsed) {
  triggerHaptic('success');
  store.addTransaction({
    id: 'tx-' + Date.now(),
    merchant: parsed.merchant,
    amount: parsed.amount,
    type: 'EXPENSE',
    category: parsed.category,
    account: parsed.account,
    date: new Date().toISOString(),
    upiRef: parsed.upiRef,
    note: `Auto-parsed from ${parsed.bank} SMS`,
  });

  showToast('✓ SMS expense added to transactions!');
  renderAllViews();
  switchTab('home');
}

// --- Review Queue View ---
function renderReviewQueueView() {
  const container = document.getElementById('review-queue-list');
  if (!container) return;

  if (store.reviewItems.length === 0) {
    container.innerHTML = `
      <div style="text-align: center; padding: 40px 20px; color: var(--text-tertiary);">
        <div style="font-size: 36px; margin-bottom: 8px;">🎉</div>
        <div style="font-weight: 700; color: var(--text-primary);">All caught up!</div>
        <div style="font-size: 13px; margin-top: 4px;">Zero transactions need manual review.</div>
      </div>
    `;
    return;
  }

  container.innerHTML = store.reviewItems.map(item => {
    const cat = CATEGORIES[item.suggestedCategory] || CATEGORIES['Other'];
    return `
      <div class="ios-card" style="padding: 16px; margin-bottom: 14px;">
        <div style="display: flex; justify-content: space-between; align-items: flex-start; margin-bottom: 10px;">
          <div>
            <div style="font-size: 15px; font-weight: 700; color: var(--text-primary);">${escapeHtml(item.merchant)}</div>
            <div style="font-size: 12px; color: var(--text-secondary); margin-top: 2px;">
              ${escapeHtml(item.account)} • ${item.time}
            </div>
          </div>
          <div style="font-size: 18px; font-weight: 800; color: var(--expense);">
            -${formatINR(item.amount)}
          </div>
        </div>

        <div style="background: var(--bg-surface-secondary); padding: 10px 14px; border-radius: var(--radius-md); margin-bottom: 12px;">
          <div style="font-size: 11px; font-weight: 600; color: var(--text-tertiary); text-transform: uppercase;">Suggested Category</div>
          <div style="display: flex; align-items: center; gap: 6px; font-weight: 700; color: ${cat.color}; margin-top: 2px;">
            <span>${cat.icon}</span>
            <span>${cat.name}</span>
          </div>
        </div>

        <div style="display: grid; grid-template-columns: 1fr 1fr; gap: 8px;">
          <button class="btn-primary" style="margin-top: 0; padding: 10px; font-size: 13px; background: var(--bg-surface-secondary); color: var(--text-primary); border: 1px solid var(--border-color); box-shadow: none;" onclick="dismissReview('${item.id}')">
            Skip
          </button>
          <button class="btn-primary" style="margin-top: 0; padding: 10px; font-size: 13px;" onclick="confirmReview('${item.id}', '${item.suggestedCategory}')">
            ✓ Confirm
          </button>
        </div>
      </div>
    `;
  }).join('');
}

function confirmReview(id, category) {
  triggerHaptic('success');
  store.resolveReview(id, category, true);
  showToast('✓ Transaction categorized and saved');
  renderAllViews();
}

function dismissReview(id) {
  triggerHaptic('light');
  store.resolveReview(id, null, false);
  showToast('Transaction dismissed');
  renderAllViews();
}

// --- Data Export ---
function exportData(type) {
  triggerHaptic('light');
  if (type === 'json') {
    const dataStr = 'data:text/json;charset=utf-8,' + encodeURIComponent(JSON.stringify(store.transactions, null, 2));
    const a = document.createElement('a');
    a.href = dataStr;
    a.download = `aura-expense-export-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    showToast('✓ JSON Export downloaded');
  } else if (type === 'csv') {
    const headers = ['ID', 'Date', 'Merchant', 'Amount', 'Type', 'Category', 'Account', 'UPI Ref', 'Notes'];
    const rows = store.transactions.map(t => [
      t.id,
      t.date,
      `"${t.merchant.replace(/"/g, '""')}"`,
      t.amount,
      t.type,
      t.category,
      `"${t.account || ''}"`,
      `"${t.upiRef || ''}"`,
      `"${(t.note || '').replace(/"/g, '""')}"`
    ]);

    const csvContent = 'data:text/csv;charset=utf-8,' + [headers.join(','), ...rows.map(r => r.join(','))].join('\n');
    const a = document.createElement('a');
    a.href = encodeURI(csvContent);
    a.download = `aura-expense-export-${new Date().toISOString().slice(0, 10)}.csv`;
    a.click();
    showToast('✓ CSV Export downloaded');
  }
}

function resetDemoData() {
  if (confirm('Reset transactions and reviews to default demo state?')) {
    triggerHaptic('medium');
    localStorage.removeItem('aura_transactions');
    localStorage.removeItem('aura_reviews');
    store.transactions = [...INITIAL_TRANSACTIONS];
    store.reviewItems = [...INITIAL_REVIEW_ITEMS];
    store.save();
    showToast('✓ Demo data restored');
    renderAllViews();
  }
}

// --- QR Code Modal Generator (Vector SVG) ---
function openQrModal() {
  const modal = document.getElementById('modal-qr');
  const qrContainer = document.getElementById('qr-code-display');
  const localUrl = `http://10.135.135.93:3000`;

  if (qrContainer) {
    // Generate clean vector QR representation
    qrContainer.innerHTML = generateSvgQrCode(localUrl);
  }

  if (modal) modal.classList.add('open');
}

// Compact algorithmic QR generator or clean SVG matrix
function generateSvgQrCode(url) {
  // Use public high-res QR image generator or SVG fallback
  return `
    <img src="https://api.qrserver.com/v1/create-qr-code/?size=200x200&data=${encodeURIComponent(url)}&color=000000&bgcolor=FFFFFF&margin=1"
         alt="Scan QR to open Aura Expense"
         width="200" height="200"
         style="display: block; border-radius: 12px;"
         onerror="this.src='data:image/svg+xml,<svg xmlns=\\'http://www.w3.org/2000/svg\\' width=\\'200\\' height=\\'200\\'><rect width=\\'200\\' height=\\'200\\' fill=\\'white\\'/><text x=\\'100\\' y=\\'100\\' font-size=\\'12\\' text-anchor=\\'middle\\' fill=\\'black\\'>Connect to: ${url}</text></svg>'" />
  `;
}

// --- Re-render all views ---
function renderAllViews() {
  renderHomeDashboard();
  renderTransactionsList();
  renderBudgetsView();
  renderReports();
  renderReviewQueueView();
}

// Helper: Escape HTML
function escapeHtml(str) {
  if (!str) return '';
  return String(str)
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;')
    .replace(/"/g, '&quot;')
    .replace(/'/g, '&#039;');
}
