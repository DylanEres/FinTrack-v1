import { useState, useEffect } from 'react';
import "bootstrap/dist/css/bootstrap.min.css";

const API_URL = "https://fintrackcpp.fly.dev";

function App() {
  const [transactions, setTransactions] = useState([]);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [showAddForm, setShowAddForm] = useState(false);
  const [newTransaction, setNewTransaction] = useState({
    description: '',
    amount: '',
    type: 'expense',
    date: new Date().toISOString().slice(0, 10)
  });

  // Fetch transactions from API
  useEffect(() => {
    fetchTransactions();
  }, []);

  const fetchTransactions = async () => {
    setIsLoading(true);
    try {
      const response = await fetch(`${API_URL}/api/transactions`);
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      const data = await response.json();
      setTransactions(data);
      setError(null);
    } catch (err) {
      console.error("Error fetching transactions:", err);
      setError("Failed to load transactions. Please try again later.");
    } finally {
      setIsLoading(false);
    }
  };

  // Calculate financial summaries
  const income = transactions
    .filter(t => t.type === 'income')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const expenses = transactions
    .filter(t => t.type === 'expense')
    .reduce((sum, t) => sum + parseFloat(t.amount), 0);
    
  const balance = income - expenses;

  // Handle form input changes
  const handleInputChange = (e) => {
    const { name, value } = e.target;
    setNewTransaction({
      ...newTransaction,
      [name]: name === 'amount' ? parseFloat(value) || '' : value
    });
  };

  // Add new transaction
  const handleAddTransaction = async (e) => {
    e.preventDefault();
    if (!newTransaction.description || !newTransaction.amount) return;
    
    try {
      const response = await fetch(`${API_URL}/api/transactions`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(newTransaction)
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Refresh transactions list
      fetchTransactions();
      
      // Reset form
      setNewTransaction({
        description: '',
        amount: '',
        type: 'expense',
        date: new Date().toISOString().slice(0, 10)
      });
      
      setShowAddForm(false);
    } catch (err) {
      console.error("Error adding transaction:", err);
      alert("Failed to add transaction. Please try again.");
    }
  };

  // Delete transaction
  const handleDeleteTransaction = async (id) => {
    try {
      const response = await fetch(`${API_URL}/api/transactions/${id}`, {
        method: 'DELETE'
      });
      
      if (!response.ok) {
        throw new Error(`HTTP error! Status: ${response.status}`);
      }
      
      // Refresh transactions list
      fetchTransactions();
    } catch (err) {
      console.error("Error deleting transaction:", err);
      alert("Failed to delete transaction. Please try again.");
    }
  };

  // Custom styles to force full width
  const fullWidthStyle = {
    width: '100vw',
    maxWidth: '100%',
    overflowX: 'hidden',
    margin: 0,
    padding: 0
  };

  return (
    <div className="vh-100 d-flex flex-column" style={fullWidthStyle}>
      {/* Navbar - matches screenshot exactly */}
      <header className="w-100 bg-primary" style={{ padding: '0.7rem 0' }}>
        <div className="d-flex justify-content-between align-items-center px-4">
          <div>
            <a href="#" className="text-white text-decoration-none fs-4">Finance Tracker</a>
          </div>
          <div>
            <a href="#" className="text-white text-decoration-none mx-2">Dashboard</a>
            <a href="#" className="text-white text-decoration-none mx-2">Reports</a>
            <a href="#" className="text-white text-decoration-none mx-2">Settings</a>
          </div>
        </div>
      </header>
      
      {/* Main Content */}
      <main className="flex-grow-1 bg-dark text-white">
        <div className="px-4 py-4 w-100">
          {/* Hero and Summary Section */}
          <div className="row w-100 mx-0">
            <div className="col-md-6 px-0 pe-md-4">
              <h1 className="text-primary fw-bold display-4">Take Control of Your Finances</h1>
              <p className="lead">
                Track expenses, monitor income, and achieve your financial goals with our easy-to-use finance tracker.
              </p>
              <button 
                className="btn btn-primary me-2"
                onClick={() => setShowAddForm(true)}
              >
                Add Transaction
              </button>
              <button className="btn btn-outline-light">View Reports</button>
            </div>
            <div className="col-md-6 px-0 ps-md-4">
              <div>
                <h4 className="mb-3">Financial Summary</h4>
                <div className="progress mb-4" style={{ height: "30px" }}>
                  <div 
                    className="progress-bar bg-success text-white" 
                    style={{ width: `${income > 0 ? (balance/income)*100 : 0}%` }}
                  >
                    ${balance.toFixed(2)} Balance
                  </div>
                  <div 
                    className="progress-bar bg-danger text-white" 
                    style={{ width: `${income > 0 ? (expenses/income)*100 : 0}%` }}
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
            </div>
          </div>
          
          {/* Transactions Section */}
          <div className="mt-5 w-100">
            <div className="d-flex justify-content-between align-items-center mb-3">
              <h2>Recent Transactions</h2>
              <div>
                <button className="btn btn-sm btn-outline-primary me-2">Filter</button>
                <button className="btn btn-sm btn-outline-secondary">Export</button>
              </div>
            </div>
            
            {isLoading ? (
              <div className="text-center py-4">
                <div className="spinner-border text-primary" role="status">
                  <span className="visually-hidden">Loading...</span>
                </div>
                <p className="mt-2">Loading transactions...</p>
              </div>
            ) : error ? (
              <div className="alert alert-danger">{error}</div>
            ) : (
              <div className="w-100">
                {transactions.length === 0 ? (
                  <div className="text-center py-4">
                    <p>No transactions found. Add a new transaction to get started!</p>
                  </div>
                ) : (
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
                      {transactions.map(transaction => (
                        <tr key={transaction.id}>
                          <td>{transaction.date}</td>
                          <td>{transaction.description}</td>
                          <td className={transaction.type === 'income' ? 'text-success' : 'text-danger'}>
                            ${parseFloat(transaction.amount).toFixed(2)}
                          </td>
                          <td>
                            <span className={`badge ${transaction.type === 'income' ? 'bg-success' : 'bg-danger'}`}>
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
                )}
              </div>
            )}
          </div>
        </div>
      </main>
      
      {/* Footer */}
      <footer className="bg-dark text-light py-4 border-top border-secondary w-100">
        <div className="px-4 w-100">
          <div className="row w-100 mx-0">
            <div className="col-md-6 px-0 pe-md-4">
              <h5>Finance Tracker</h5>
              <p className="small">Take control of your finances with our easy-to-use tracking tool.</p>
            </div>
            <div className="col-md-3 px-0 ps-md-4">
              <h6>Links</h6>
              <div>Home</div>
              <div>Features</div>
              <div>Pricing</div>
              <div>Support</div>
            </div>
            <div className="col-md-3 px-0 ps-md-4">
              <h6>Contact</h6>
              <div className="text-secondary small">Email: support@fintracker.com</div>
              <div className="text-secondary small">Phone: (123) 456-7890</div>
            </div>
          </div>
        </div>
      </footer>
      
      {/* Transaction Form Modal */}
      {showAddForm && (
        <div className="position-fixed top-0 start-0 w-100 h-100 d-flex justify-content-center align-items-center" 
             style={{ backgroundColor: "rgba(0,0,0,0.8)", zIndex: 1050 }}>
          <div className="card bg-dark text-light border border-secondary" style={{ width: "90%", maxWidth: "500px" }}>
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
                  <button type="submit" className="btn btn-primary">Add Transaction</button>
                </div>
              </form>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}

export default App;