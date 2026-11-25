import { StrictMode } from 'react'
import { createRoot, hydrateRoot } from 'react-dom/client'
import '@fontsource-variable/geist/wght.css'
import './styles/base.css'
import './styles/mock.css'
import './styles/sections.css'
import './styles/tiles.css'
import './styles/motion.css'
import App from './App.tsx'

const root = document.getElementById('root')!
const app = (
  <StrictMode>
    <App />
  </StrictMode>
)

// The production build ships prerendered HTML (scripts/prerender.mjs); the dev server doesn't.
if (root.firstElementChild) hydrateRoot(root, app)
else createRoot(root).render(app)
