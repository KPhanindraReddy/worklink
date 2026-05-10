import React from 'react';
import ReactDOM from 'react-dom/client';
import { BrowserRouter } from 'react-router-dom';
import { HelmetProvider } from 'react-helmet-async';
import { Toaster } from 'react-hot-toast';
import App from './App';
import { AuthProvider } from './context/AuthContext';
import { ThemeProvider } from './context/ThemeContext';
import { AppErrorBoundary } from './components/common/AppErrorBoundary';
import { installRuntimeRecovery } from './utils/runtimeRecovery';
import './i18n';
import './styles/index.css';

installRuntimeRecovery();

ReactDOM.createRoot(document.getElementById('root')).render(
  <React.StrictMode>
    <HelmetProvider>
      <BrowserRouter future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <ThemeProvider>
          <AppErrorBoundary>
            <AuthProvider>
              <App />
              <Toaster
                position="top-right"
                toastOptions={{
                  className: '!rounded-2xl !border !border-slate-200 !bg-white !text-slate-900 shadow-soft'
                }}
              />
            </AuthProvider>
          </AppErrorBoundary>
        </ThemeProvider>
      </BrowserRouter>
    </HelmetProvider>
  </React.StrictMode>
);
