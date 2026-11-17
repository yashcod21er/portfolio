import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tailwindcss from '@tailwindcss/vite'
import { fileURLToPath, URL } from 'node:url'

// https://vite.dev/config/
export default defineConfig({
  plugins: [
    react(),
    tailwindcss(),
  ],
  resolve: {
    // "@/..." points at src/, matching how Skiper UI / Vengeance UI components import.
    alias: { '@': fileURLToPath(new URL('./src', import.meta.url)) },
  },
  build: {
    rolldownOptions: {
      output: {
        // Keep the 3D runtime out of the main bundle.
        codeSplitting: {
          groups: [{ name: 'three', test: /node_modules[\\/](three|@react-three)/ }],
        },
      },
    },
  },
})
