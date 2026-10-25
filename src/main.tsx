import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import './index.css';
import { CURRENT_APP_VERSION } from './version.ts';

// AUTO-CLEAR CACHE ON VERSION UPDATE
const SAVED_VERSION_KEY = 'kelasgue_app_version';
const lastVersion = localStorage.getItem(SAVED_VERSION_KEY);
if (lastVersion !== CURRENT_APP_VERSION.version) {
  console.log(`Update detected: ${lastVersion} -> ${CURRENT_APP_VERSION.version}. Clearing cache...`);
  // Clear only configuration-related keys to avoid aggressive logout if possible, 
  // but clearing all is safer for a "fresh start"
  localStorage.removeItem('kelasgue_supabase_url');
  localStorage.removeItem('kelasgue_supabase_key');
  localStorage.setItem(SAVED_VERSION_KEY, CURRENT_APP_VERSION.version);
}

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
);
