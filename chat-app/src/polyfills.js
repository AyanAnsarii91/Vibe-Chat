// Polyfills for Node.js globals and modules
window.global = window;
window.process = { env: {} };
// Don't use require here as it's not available in the browser
// Buffer is imported in main.jsx
