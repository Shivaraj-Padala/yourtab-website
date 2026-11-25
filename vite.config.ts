import react, { reactCompilerPreset } from '@vitejs/plugin-react'
import babel from '@rolldown/plugin-babel'
import { defineConfig } from 'vite'

// https://vite.dev/config/
// BASE is '/' on a custom domain, and '/<repo>/' on a GitHub Pages project site (set by the workflow)
export default defineConfig({
  base: process.env.BASE ?? '/',
  plugins: [
    react(),
    babel({ presets: [reactCompilerPreset()] })
  ],
})
