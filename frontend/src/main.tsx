import { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import App from './App.tsx'
import './index.css'

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>,
)

// Hapus initial K3 splash screen dengan transisi lembut setelah React berhasil mount
const splash = document.getElementById('initial-k3-splash');
if (splash) {
  setTimeout(() => {
    splash.style.transition = 'opacity 0.4s ease-out, visibility 0.4s';
    splash.style.opacity = '0';
    splash.style.pointerEvents = 'none';
    setTimeout(() => {
      splash.remove();
    }, 400);
  }, 250);
}
