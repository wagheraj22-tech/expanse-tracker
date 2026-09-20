const STORAGE_KEY = 'expense-tracker-transactions';

const formSection = document.getElementById('formSection');
const transactionForm = document.getElementById('transactionForm');
const descriptionInput = document.getElementById('description');
const amountInput = document.getElementById('amount');
const typeInput = document.getElementById('type');
const categoryInput = document.getElementById('category');
const dateInput = document.getElementById('date');
const searchInput = document.getElementById('search');
const transactionList = document.getElementById('transactionList');

const balanceEl = document.getElementById('balance');
const incomeEl = document.getElementById('income');
const expenseEl = document.getElementById('expense');

let transactions = JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
let editingId = null;

function formatCurrency(value) {
  const isNegative = value < 0;
  const absoluteValue = Math.abs(value);
  const formatted = absoluteValue.toLocaleString('en-IN', {
    minimumFractionDigits: 0,
    maximumFractionDigits: 2,
  });

  return `${isNegative ? '-₹' : '₹'}${formatted}`;
}

function formatDate(dateString) {
  if (!dateString) return 'No date';

  const date = new Date(dateString + 'T00:00:00');
  return new Intl.DateTimeFormat('en-IN', {
    day: '2-digit',
    month: 'short',
    year: 'numeric',
  }).format(date);
}

function openForm() {
  formSection.style.display = 'block';
  descriptionInput.focus();
}

function closeForm() {
  formSection.style.display = 'none';
  transactionForm.reset();
  typeInput.value = 'expense';

  const today = new Date().toISOString().split('T')[0];
  dateInput.value = today;
  editingId = null;

  const submitButton = transactionForm.querySelector('button[type="submit"]');
  if (submitButton) {
    submitButton.textContent = 'Save Transaction';
  }
}

function saveTransactions() {
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
}

function updateSummary() {
  const income = transactions
    .filter((item) => item.type === 'income')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const expense = transactions
    .filter((item) => item.type === 'expense')
    .reduce((sum, item) => sum + Number(item.amount), 0);

  const balance = income - expense;

  incomeEl.textContent = formatCurrency(income);
  expenseEl.textContent = formatCurrency(expense);
  balanceEl.textContent = formatCurrency(balance);
}

function renderTransactions() {
  const searchTerm = searchInput.value.trim().toLowerCase();
  const filteredTransactions = transactions.filter((item) => {
    const text = `${item.description} ${item.category} ${item.date}`.toLowerCase();
    return text.includes(searchTerm);
  });

  if (!filteredTransactions.length) {
    transactionList.innerHTML = '<p class="empty">No transactions yet.</p>';
    return;
  }

  transactionList.innerHTML = filteredTransactions
    .map((item) => {
      const amountText = item.type === 'income'
        ? `+${formatCurrency(item.amount)}`
        : `-${formatCurrency(item.amount)}`;

      return `
        <div class="transaction-item">
          <div class="transaction-main">
            <div class="transaction-icon">${item.category.charAt(0).toUpperCase()}</div>
            <div class="transaction-info">
              <h3>${item.description}</h3>
              <p>${item.category} • ${formatDate(item.date)}</p>
            </div>
          </div>

          <div class="transaction-side">
            <span class="amount ${item.type === 'income' ? 'income' : 'expense'}">
              ${amountText}
            </span>
            <button class="edit-btn" data-id="${item.id}" type="button">Edit</button>
            <button class="delete-btn" data-id="${item.id}" type="button">Delete</button>
          </div>
        </div>
      `;
    })
    .join('');
}

transactionForm.addEventListener('submit', (event) => {
  event.preventDefault();

  const description = descriptionInput.value.trim();
  const amount = Number(amountInput.value);
  const type = typeInput.value;
  const category = categoryInput.value;
  const date = dateInput.value;

  if (!description || !amount || amount <= 0 || !date) {
    alert('Please enter valid transaction details.');
    return;
  }

  if (editingId !== null) {
    transactions = transactions.map((item) =>
      String(item.id) === String(editingId)
        ? { ...item, description, amount, type, category, date }
        : item
    );
  } else {
    transactions.unshift({
      id: Date.now() + Math.random(),
      description,
      amount,
      type,
      category,
      date,
    });
  }

  saveTransactions();
  updateSummary();
  renderTransactions();
  closeForm();
});

transactionList.addEventListener('click', (event) => {
  const editButton = event.target.closest('.edit-btn');
  if (editButton) {
    const transactionId = editButton.dataset.id;
    const transaction = transactions.find((item) => String(item.id) === String(transactionId));

    if (!transaction) return;

    openForm();
    descriptionInput.value = transaction.description;
    amountInput.value = transaction.amount;
    typeInput.value = transaction.type;
    categoryInput.value = transaction.category;
    dateInput.value = transaction.date;
    editingId = transaction.id;

    const submitButton = transactionForm.querySelector('button[type="submit"]');
    if (submitButton) {
      submitButton.textContent = 'Update Transaction';
    }

    formSection.scrollIntoView({ behavior: 'smooth', block: 'start' });
    return;
  }

  const deleteButton = event.target.closest('.delete-btn');
  if (!deleteButton) return;

  const transactionId = deleteButton.dataset.id;
  const confirmDelete = confirm('Are you sure you want to delete this transaction?');
  if (!confirmDelete) return;

  transactions = transactions.filter((item) => String(item.id) !== String(transactionId));
  saveTransactions();
  updateSummary();
  renderTransactions();
});

searchInput.addEventListener('input', renderTransactions);

function initializeApp() {
  if (!dateInput.value) {
    dateInput.value = new Date().toISOString().split('T')[0];
  }

  updateSummary();
  renderTransactions();
}

initializeApp();
