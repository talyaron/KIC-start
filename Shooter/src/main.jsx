import React, { StrictMode } from 'react'
import { createRoot } from 'react-dom/client'
import './index.css'
import App from './App.jsx'

// Global Error Trap
window.onerror = function (message, source, lineno, colno, error) {
    const errorBox = document.createElement('div');
    errorBox.style.cssText = 'position:fixed;top:0;left:0;width:100%;background:red;color:white;padding:20px;z-index:9999;font-size:20px;';
    errorBox.innerHTML = `<h1>Critical Error</h1><p>${message}</p><pre>${error?.stack}</pre>`;
    document.body.appendChild(errorBox);
};

console.log("App Starting...");

createRoot(document.getElementById('root')).render(
    <App />
)
