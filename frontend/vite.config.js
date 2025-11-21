// vite.config.js
import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react-swc'
import tailwindcss from '@tailwindcss/vite'
// ⚠️ FIX: Change to a NAMED import to correctly get the factory function


// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(), 
    tailwindcss()
    // The usage here remains the same, calling the imported function

  ],
})