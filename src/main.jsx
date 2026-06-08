import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import "@fontsource/sarabun/400.css";
import "@fontsource/sarabun/600.css";
import "@fontsource/sarabun/700.css";
import "@fontsource/sarabun/800.css";
import App from './App.jsx'

createRoot(document.getElementById('root')).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
