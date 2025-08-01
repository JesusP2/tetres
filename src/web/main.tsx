import { scan } from 'react-scan';
import '@fontsource-variable/geist';
import { RouterProvider } from '@tanstack/react-router';
import { StrictMode } from 'react';
import ReactDOM from 'react-dom/client';
import './global.css';
import { createRouter } from './router';

if (import.meta.env.DEV) {
  scan({
    enabled: import.meta.env.DEV,
  });
}

const rootElement = document.getElementById('root');
if (!rootElement) throw new Error('Root element not found');

const router = createRouter();

const root = ReactDOM.createRoot(rootElement);
root.render(
  <StrictMode>
    <RouterProvider router={router} />
  </StrictMode>,
);
