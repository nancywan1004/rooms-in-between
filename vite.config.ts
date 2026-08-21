import { defineConfig } from 'vite'
import react from '@vitejs/plugin-react'
import { sceneSavePlugin } from './vite.sceneSavePlugin'

export default defineConfig({
  plugins: [react(), sceneSavePlugin()],
  server: {
    open: true,
  },
})
