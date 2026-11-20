import {StrictMode} from 'react';
import {createRoot} from 'react-dom/client';
import App from './App.tsx';
import ErrorBoundary from './components/ErrorBoundary';
import Toaster from './components/Toaster';
import '@fontsource-variable/inter';
import '@fontsource-variable/space-grotesk';
import '@fontsource-variable/jetbrains-mono';
import './index.css';

createRoot(document.getElementById('root')!).render(
  <StrictMode>
    <ErrorBoundary modulo="ORBI">
      <App />
      <Toaster />
    </ErrorBoundary>
  </StrictMode>,
);

// 17A Fase 3: permite abrir la app sin señal (solo en producción; en desarrollo interferiría con Vite)
if (import.meta.env.PROD && 'serviceWorker' in navigator) {
  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').catch((error) => console.error('[ORBI] No se pudo activar el modo sin señal:', error));
  });
}
