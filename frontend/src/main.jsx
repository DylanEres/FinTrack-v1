import React from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.jsx'

// Import Bootstrap and our custom CSS
// Make sure Bootstrap comes first, then our custom styles
import 'bootstrap/dist/css/bootstrap.min.css'
import './index.css'

// Get the root element
const rootElement = document.getElementById('root')

// Create a root
const root = createRoot(rootElement)

// Render the App component
root.render(
  <React.StrictMode>
    <App />
  </React.StrictMode>
)