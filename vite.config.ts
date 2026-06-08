import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import tsconfigPaths from 'vite-tsconfig-paths'
import { tanstackStart } from '@tanstack/react-start/vite'

export default defineConfig({
  plugins: [
    tanstackStart(),
    react(),
    tsconfigPaths(),
  ],
})
