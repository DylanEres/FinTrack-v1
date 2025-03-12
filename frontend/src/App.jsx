import { useState, useEffect } from "react";
import "bootstrap/dist/css/bootstrap.min.css";

// Constants
const STORAGE_KEY = "dj-fintrack-transactions";
const NEXT_ID_KEY = `${STORAGE_KEY}-nextId`;

// Default transaction form values
const DEFAULT_TRANSACTION = {
  description: "",
  amount: "",
  type: "expense",
  date: new Date().toISOString().slice(0, 10),
};

// Styles
const styles = {
  fullWidth: {
    width: "100vw",
    maxWidth: "100%",
    overflowX: "hidden",
    margin: 0,
    padding: 0,
  },
  modalOverlay: {
    backgroundColor: "rgba(0,0,0,0.8)",
    zIndex: 1050
  },
  modalCard: {
    width: "90%",
    maxWidth: "500px"
  },
  progressBar: {
    height: "30px"
  }
};

function App() {
  // State hooks
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [nextId, setNextId] = useState(1);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState(DEFAULT_TRANSACTION);

  // Load transactions from localStorage on initial render
  useEffect(() => {
    const loadTransactions = () => {
      setIsLoading(true);
      try {
        const storedTransactions = localStorage.getItem(STORAGE_KEY);
        const storedNextId = localStorage.getItem(NEXT_ID_KEY);

        if (storedTransactions) {
          setTransactions(JSON.parse(storedTransactions));
        }

        if (storedNextId) {
          setNextId(parseInt(storedNextId));
        }
      } catch (err) {
        console.error("Error loading from localStorage:", err);
      } finally {
        setIsLoading(false);
      }
    };

    loadTransactions();
  }, []);

  // Save transactions to localStorage whenever they change
  useEffect(() => {
    if (!isLoading) {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(transactions));
      localStorage.setItem(NEXT_ID_KEY, nextId.toString());
    }
  }, [transactions, nextId, isLoading]);

  // Calculate financial summaries
  const income = transactions
    .filter(t => t.type === "income")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const expenses = transactions
    .filter(t => t.type === "expense")
    .reduce((sum, t) => sum + parseFloat(t.amount || 0), 0);

  const balance = income - expenses;

  // Event handlers
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: name === "amount" ? parseFloat(value) || "" : value,
    });
  };

  const handleAddTransaction = (e) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount) return;

    const transaction = {
      ...newTransaction,
      id: nextId,
    };

    setTransactions([...transactions, transaction]);
    setNextId(nextId + 1);
    setNewTransaction(DEFAULT_TRANSACTION);
    setShowAddForm(false);
  };

  const handleDeleteTransaction = (id) => {
    setTransactions(transactions.filter(t => t.id !== id));
  };

  const handleClearAll = () => {
    if (window.confirm("Are you sure you want to delete ALL transactions? This cannot be undone.")) {
      setTransactions([]);
      setNextId(1);
    }
  };

  // Render components
  const renderHeader = () => (
    <header className="w-100 bg-primary" style={{ padding: "0.7rem 0" }}>
      <div className="text-center">
        <span className="text-white fs-4">DJ's FinTrack</span>
      </div>
    </header>
  );

  const renderFinancialSummary = () => (
    <div>
      <h4 className="mb-3">Financial Summary</h4>
      <div className="progress mb-4" style={styles.progressBar}>
        <div
          className="progress-bar bg-success text-white"
          style={{ width: `${income > 0 ? (balance / income) * 100 : 0}%` }}
        >
          ${balance.toFixed(2)} Balance
        </div>
        <div
          className="progress-bar bg-danger text-white"
          style={{ width: `${income > 0 ? (expenses / income) * 100 : 0}%` }}
        >
          ${expenses.toFixed(2)} Spent
        </div>
      </div>
      <div className="row g-3">
        <div className="col-4">
          <div className="p-3 bg-dark border border-secondary rounded text-center">
            <div className="text-success">Income</div>
            <div className="fs-4">${income.toFixed(2)}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 bg-dark border border-secondary rounded text-center">
            <div className="text-danger">Expenses</div>
            <div className="fs-4">${expenses.toFixed(2)}</div>
          </div>
        </div>
        <div className="col-4">
          <div className="p-3 bg-dark border border-secondary rounded text-center">
            <div className="text-primary">Balance</div>
            <div className="fs-4">${balance.toFixed(2)}</div>
          </div>
        </div>
      </div>
    </div>
  );

  const renderTransactionsTable = () => {
    if (isLoading) {
      return (
        <div className="text-center py-4">
          <div className="spinner-border text-primary" role="status">
            <span className="visually-hidden">Loading...</span>
          </div>
          <p className="mt-2">Loading transactions...</p>
        </div>
      );
    }

    if (transactions.length === 0) {
      return (
        <div className="text-center py-4">
          <p>No transactions found. Add a new transaction to get started!</p>
        </div>
      );
    }

    return (
      <table className="table table-dark table-borderless w-100">
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
          {transactions.map((transaction) => (
            <tr key={transaction.id}>
              <td>{transaction.date}</td>
              <td>{transaction.description}</td>
              <td className={transaction.type === "income" ? "text-success" : "text-danger"}>
                ${parseFloat(transaction.amount || 0).toFixed(2)}
              </td>
              <td>
                <span className={`badge ${transaction.type === "income" ? "bg-success" : "bg-danger"}`}>
                  {transaction.type}
                </span>
              </td>
              <td>
                <button
                  className="btn btn-sm btn-outline-danger"
                  onClick={() => handleDeleteTransaction(transaction.id)}
                >
                  Delete
                </button>
              </td>
            </tr>
          ))}
        </tbody>
      </table>
    );
  };

  const renderTransactionModal = () => {
    if (!showAddForm) return null;
    
    return (
      <div
        className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center"
        style={styles.modalOverlay}
      >
        <div className="card bg-dark text-light border border-secondary" style={styles.modalCard}>
          <div className="card-header bg-primary text-white">
            <h5 className="mb-0">Add New Transaction</h5>
          </div>
          <div className="card-body">
            <form onSubmit={handleAddTransaction}>
              <div className="mb-3">
                <label className="form-label">Description</label>
                <input
                  type="text"
                  className="form-control bg-dark text-light border-secondary"
                  name="description"
                  value={newTransaction.description}
                  onChange={handleInputChange}
                  required
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Amount</label>
                <input
                  type="number"
                  className="form-control bg-dark text-light border-secondary"
                  name="amount"
                  value={newTransaction.amount}
                  onChange={handleInputChange}
                  required
                  min="0.01"
                  step="0.01"
                />
              </div>
              <div className="mb-3">
                <label className="form-label">Type</label>
                <select
                  className="form-select bg-dark text-light border-secondary"
                  name="type"
                  value={newTransaction.type}
                  onChange={handleInputChange}
                >
                  <option value="expense">Expense</option>
                  <option value="income">Income</option>
                </select>
              </div>
              <div className="mb-3">
                <label className="form-label">Date</label>
                <input
                  type="date"
                  className="form-control bg-dark text-light border-secondary"
                  name="date"
                  value={newTransaction.date}
                  onChange={handleInputChange}
                />
              </div>
              <div className="d-flex justify-content-end gap-2">
                <button
                  type="button"
                  className="btn btn-outline-light"
                  onClick={() => setShowAddForm(false)}
                >
                  Cancel
                </button>
                <button type="submit" className="btn btn-primary">
                  Add Transaction
                </button>
              </div>
            </form>
          </div>
        </div>
      </div>
    );
  };

  const renderFooter = () => (
    <footer className="bg-dark text-light py-3 border-top border-secondary w-100">
      <div className="text-center">
        <h5>FinTrack</h5>
        <p className="small">
          Take control of your finances with our easy-to-use tracking tool.
        </p>
      </div>
    </footer>
  );

  // Main component render
  return (
    <div className="vh-100 d-flex flex-column" style={styles.fullWidth}>
      {renderHeader()}

      <main className="flex-grow-1 bg-dark text-white">
        <div className="px-4 py-4 w-100">
          {/* Hero and Summary Section */}
          <div className="row w-100 mx-0">
            <div className="col-md-6 px-0 pe-md-4">
              <h1 className="text-primary fw-bold display-4">Finance Tracker</h1>
              <p className="lead">
                Track expenses, monitor income, and achieve your financial goals
                with our easy-to-use finance tracker.
              </p>
              <button
                className="btn btn-primary me-2"
                onClick={() => setShowAddForm(true)}
              >
                Add Transaction
              </button>
              <button
                className="btn btn-outline-danger"
                onClick={handleClearAll}
              >
                Clear All
              </button>
            </div>
            <div className="col-md-6 px-0 ps-md-4">
              {renderFinancialSummary()}
            </div>
          </div>

          {/* Transactions Section */}
          <div className="mt-5 w-100">
            <h2>Recent Transactions</h2>
            <div className="w-100">
              {renderTransactionsTable()}
            </div>
          </div>
          
          <div className="mt-3 text-secondary small text-center">
            <em>
              Your transaction data is stored locally on this device and not
              shared with other users.
            </em>
          </div>
        </div>
      </main>

      {renderFooter()}
      {renderTransactionModal()}
    </div>
  );
}

export default App;