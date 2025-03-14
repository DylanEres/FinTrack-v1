// Constants
const STORAGE_KEY = "dj-fintrack-transactions";
const NEXT_ID_KEY = `${STORAGE_KEY}-nextId`;
const API_URL = "http://localhost:8080/api";

// State management
let transactions = [];
let isLoading = true;
let nextId = 1;

// DOM Elements
const showAddFormBtn = document.getElementById("showAddFormBtn");
const clearAllBtn = document.getElementById("clearAllBtn");
const transactionModal = document.getElementById("transactionModal");
const cancelBtn = document.getElementById("cancelBtn");
const transactionForm = document.getElementById("transactionForm");
const financialSummary = document.getElementById("financialSummary");
const transactionsTable = document.getElementById("transactionsTable");

// Form elements
const descriptionInput = document.getElementById("description");
const amountInput = document.getElementById("amount");
const typeSelect = document.getElementById("type");
const dateInput = document.getElementById("date");

// Initialize the application
function init() {
  // Set default date to today
  dateInput.value = new Date().toISOString().slice(0, 10);
  
  // Setup event listeners
  showAddFormBtn.addEventListener("click", showAddForm);
  clearAllBtn.addEventListener("click", confirmClearAll);
  cancelBtn.addEventListener("click", hideAddForm);
  transactionForm.addEventListener("submit", handleAddTransaction);

  // Load transactions
  loadTransactions();
}

// Load transactions from API or localStorage
async function loadTransactions() {
  isLoading = true;
  renderTransactionsTable();
  
  try {
    // Try loading from API first
    const response = await fetch(`${API_URL}/transactions`);
    
    // If API is available and response is successful
    if (response.ok) {
      const data = await response.json();
      transactions = data;
      
      // If we got data from API, update localStorage
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      
      // Get the highest id for nextId
      if (transactions.length > 0) {
        const maxId = Math.max(...transactions.map(t => t.id));
        nextId = maxId + 1;
        localStorage.setItem(NEXT_ID_KEY, nextId.toString());
      }
    } else {
      // If API fails, fall back to localStorage
      loadFromLocalStorage();
    }
  } catch (err) {
    console.error("Error loading from API:", err);
    // If fetching from API fails, fall back to localStorage
    loadFromLocalStorage();
  } finally {
    isLoading = false;
    renderTransactionsTable();
    renderFinancialSummary();
  }
}

// Load data from localStorage
function loadFromLocalStorage() {
  try {
    const storedTransactions = localStorage.getItem(STORAGE_KEY);
    const storedNextId = localStorage.getItem(NEXT_ID_KEY);

    if (storedTransactions) {
      transactions = JSON.parse(storedTransactions);
    }

    if (storedNextId) {
      nextId = parseInt(storedNextId);
    }
  } catch (err) {
    console.error("Error loading from localStorage:", err);
    transactions = [];
    nextId = 1;
  }
}

// Save transactions to API and localStorage
async function saveTransactions() {
  // Save to localStorage as backup
  localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
  localStorage.setItem(NEXT_ID_KEY, nextId.toString());
  
  renderTransactionsTable();
  renderFinancialSummary();
}

// Calculate financial summary data
function calculateFinancialSummary() {
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const balance = income - expenses;

  return { income, expenses, balance };
}

// Render financial summary
function renderFinancialSummary() {
  const { income, expenses, balance } = calculateFinancialSummary();
  
  const html = `
    <h4 class="mb-3">Financial Summary</h4>
    <div class="progress-container">
      <div class="d-flex">
        <div
          class="progress-bar bg-success text-white"
          style="width: ${income > 0 ? (balance / income) * 100 : 0}%"
        >
          $${balance.toFixed(2)} Balance
        </div>
        <div
          class="progress-bar bg-danger text-white"
          style="width: ${income > 0 ? (expenses / income) * 100 : 0}%"
        >
          $${expenses.toFixed(2)} Spent
        </div>
      </div>
    </div>
    <div class="row g-3">
      <div class="col-4">
        <div class="p-3 bg-dark border border-secondary rounded text-center">
          <div class="text-success">Income</div>
          <div class="fs-4">$${income.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="p-3 bg-dark border border-secondary rounded text-center">
          <div class="text-danger">Expenses</div>
          <div class="fs-4">$${expenses.toFixed(2)}</div>
        </div>
      </div>
      <div class="col-4">
        <div class="p-3 bg-dark border border-secondary rounded text-center">
          <div class="text-primary">Balance</div>
          <div class="fs-4">$${balance.toFixed(2)}</div>
        </div>
      </div>
    </div>
  `;
  
  financialSummary.innerHTML = html;
}

// Render transactions table
function renderTransactionsTable() {
  if (isLoading) {
    transactionsTable.innerHTML = `
      <div class="text-center py-4">
        <div class="spinner"></div>
        <p class="mt-2">Loading transactions...</p>
      </div>
    `;
    return;
  }

  if (transactions.length === 0) {
    transactionsTable.innerHTML = `
      <div class="text-center py-4">
        <p>No transactions found. Add a new transaction to get started!</p>
      </div>
    `;
    return;
  }

  let tableHtml = `
    <table class="table table-dark table-borderless w-100">
      <thead>
        <tr>
          <th>Date</th>
          <th>Description</th>
          <th>Amount</th>
          <th>Type</th>
          <th>Actions</th>
        </tr>
      </thead>
      <tbody>
  `;

  transactions.forEach((transaction) => {
    tableHtml += `
      <tr>
        <td>${transaction.date}</td>
        <td>${transaction.description}</td>
        <td class="${transaction.type === "income" ? "text-success" : "text-danger"}">
          $${parseFloat(transaction.amount || 0).toFixed(2)}
        </td>
        <td>
          <span class="badge ${transaction.type === "income" ? "bg-success" : "bg-danger"}">
            ${transaction.type}
          </span>
        </td>
        <td>
          <button
            class="btn btn-sm btn-outline-danger delete-btn"
            data-id="${transaction.id}"
          >
            Delete
          </button>
        </td>
      </tr>
    `;
  });

  tableHtml += `
      </tbody>
    </table>
  `;

  transactionsTable.innerHTML = tableHtml;
  
  // Add event listeners to all delete buttons
  document.querySelectorAll(".delete-btn").forEach(button => {
    button.addEventListener("click", () => handleDeleteTransaction(parseInt(button.dataset.id)));
  });
}

// Show add transaction form
function showAddForm() {
  // Reset form
  transactionForm.reset();
  dateInput.value = new Date().toISOString().slice(0, 10);
  
  // Show modal
  transactionModal.classList.add("active");
}

// Hide add transaction form
function hideAddForm() {
  transactionModal.classList.remove("active");
}

// Handle form submission
async function handleAddTransaction(e) {
  e.preventDefault();
  
  // Validate form
  if (!descriptionInput.value || !amountInput.value) return;

  const newTransaction = {
    description: descriptionInput.value,
    amount: parseFloat(amountInput.value),
    type: typeSelect.value,
    date: dateInput.value
  };

  try {
    // Try to save via API first
    const response = await fetch(`${API_URL}/transactions`, {
      method: "POST",
      headers: {
        "Content-Type": "application/json"
      },
      body: JSON.stringify(newTransaction)
    });

    if (response.ok) {
      // If API call succeeds, reload from API
      await loadTransactions();
    } else {
      // If API call fails, save locally
      addTransactionLocally(newTransaction);
    }
  } catch (err) {
    console.error("Error adding transaction via API:", err);
    // If API call fails, save locally
    addTransactionLocally(newTransaction);
  }

  // Hide form
  hideAddForm();
}

// Add transaction locally
function addTransactionLocally(newTransaction) {
  // Add ID and save to local transactions array
  const transaction = {
    ...newTransaction,
    id: nextId
  };

  transactions.push(transaction);
  nextId++;
  
  // Save to localStorage
  saveTransactions();
}

// Handle transaction deletion
async function handleDeleteTransaction(id) {
  try {
    // Try to delete via API first
    const response = await fetch(`${API_URL}/transactions/${id}`, {
      method: "DELETE"
    });

    if (response.ok) {
      // If API call succeeds, reload from API
      await loadTransactions();
    } else {
      // If API call fails, delete locally
      deleteTransactionLocally(id);
    }
  } catch (err) {
    console.error("Error deleting transaction via API:", err);
    // If API call fails, delete locally
    deleteTransactionLocally(id);
  }
}

// Delete transaction locally
function deleteTransactionLocally(id) {
  transactions = transactions.filter(t => t.id !== id);
  saveTransactions();
}

// Confirm clear all transactions
function confirmClearAll() {
  if (window.confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
    transactions = [];
    nextId = 1;
    saveTransactions();
  }
}

// Initialize the application
document.addEventListener("DOMContentLoaded", init);