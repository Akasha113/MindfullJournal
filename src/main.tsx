import { StrictMode } from 'react';
import { createRoot } from 'react-dom/client';
import App from './App.tsx';
import './index.css';

// PWA Service Worker registration temporarily disabled
// if ('serviceWorker' in navigator) {
//   window.addEventListener('load', () => {
//     navigator.serviceWorker.register('/sw.js', { scope: '/', type: 'module' })
//       .then(reg => console.log('✅ Service Worker registered:', reg))
//       .catch(err => console.warn('⚠️ Service Worker registration failed:', err))
//   });
// }

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <App />
  </StrictMode>
);
