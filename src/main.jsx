import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Apply saved theme before first paint to avoid a flash of the wrong theme.
document.documentElement.setAttribute(
  'data-theme',
  localStorage.getItem('mindspace_theme') === 'light' ? 'light' : 'dark'
)

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
