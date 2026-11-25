// After `vite build` (client) and `vite build --ssr` (server), put the rendered page into dist/index.html.
import { readFile, rm, writeFile } from 'node:fs/promises'
import { fileURLToPath } from 'node:url'

const root = fileURLToPath(new URL('..', import.meta.url))
const { render } = await import(new URL('../dist-ssr/entry-server.js', import.meta.url).href)

const file = `${root}dist/index.html`
const html = await readFile(file, 'utf8')
if (!html.includes('<!--app-html-->')) throw new Error('dist/index.html has no <!--app-html--> placeholder')
await writeFile(file, html.replace('<!--app-html-->', render()))
await rm(`${root}dist-ssr`, { recursive: true, force: true })
console.log('Prerendered dist/index.html')
