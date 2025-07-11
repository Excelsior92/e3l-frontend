import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'
// import NewApp from './new-ui/NewApp.jsx'

// Check if the URL has a parameter to use the new UI
// Example: http://localhost:5173/?ui=new
const useNewUI = new URLSearchParams(window.location.search).get('ui') === 'new';

createRoot(document.getElementById('root')).render(
  <StrictMode>
    {useNewUI ? <NewApp /> : <App />}
  </StrictMode>,
) 