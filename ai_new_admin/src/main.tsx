import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.tsx'

// Import and run early language initialization
import { initializeLanguageEarly } from './utils/earlyLanguageInit'

// Initialize language immediately before React renders
// This prevents any flicker or layout shifts
const initialLanguage = initializeLanguageEarly();

console.log('🚀 App starting with language:', initialLanguage);

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)
