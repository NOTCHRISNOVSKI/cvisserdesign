import { defineConfig } from 'vite'
import { resolve } from 'node:path'
import { contentDir, generate } from './scripts/content.mjs'
import { applyPartials } from './scripts/partials.mjs'

// De dev-server wordt bereikt via https://preview.cvisserdesign.nl (Cloudflare-tunnel + Access).
// Zet LOCAL=1 om hem alleen op localhost te gebruiken.
const viaTunnel = process.env.LOCAL !== '1'

// Verwerkt content/ (foto's, video's, info.json) en ververst de preview bij elke wijziging.
function portfolioContent() {
  let ready = Promise.resolve({ work: [], showreel: null })
  const refresh = () => (ready = generate())

  return {
    name: 'portfolio-content',
    buildStart() {
      return refresh()
    },
    configureServer(server) {
      let timer
      const onChange = (file) => {
        if (!file.startsWith(contentDir)) return
        clearTimeout(timer)
        timer = setTimeout(async () => {
          try {
            await refresh()
            server.ws.send({ type: 'full-reload' })
          } catch (err) {
            server.config.logger.error(String(err))
          }
        }, 600)
      }
      server.watcher.add(contentDir)
      for (const event of ['add', 'change', 'unlink', 'addDir', 'unlinkDir']) server.watcher.on(event, onChange)
    },
    transformIndexHtml: {
      order: 'pre',
      async handler(html) {
        const { showreel } = await ready
        return applyPartials(html)
          .replaceAll('{{showreel-src}}', showreel?.src ?? '')
          .replaceAll('{{showreel-poster}}', showreel?.poster ?? '')
          .replaceAll('{{showreel-mobile-src}}', showreel?.mobile?.src ?? '')
          .replaceAll('{{showreel-mobile-poster}}', showreel?.mobile?.poster ?? '')
      },
    },
  }
}

export default defineConfig({
  plugins: [portfolioContent()],
  build: {
    // Bouwen naar build/ (niet live). dist/ wordt alleen bij `npm run live` bijgewerkt.
    outDir: 'build',
    emptyOutDir: true,
    rollupOptions: {
      input: {
        main: resolve(import.meta.dirname, 'index.html'),
        work: resolve(import.meta.dirname, 'work/index.html'),
        about: resolve(import.meta.dirname, 'about/index.html'),
        contact: resolve(import.meta.dirname, 'contact/index.html'),
      },
    },
  },
  server: {
    host: true,
    // Cloudflare mag niets van de dev-server bewaren (ook geen 404's), anders zie je verouderde bestanden
    headers: { 'Cache-Control': 'no-store' },
    allowedHosts: ['preview.cvisserdesign.nl'],
    hmr: viaTunnel ? { protocol: 'wss', clientPort: 443 } : undefined,
  },
  preview: {
    host: true,
    allowedHosts: ['preview.cvisserdesign.nl'],
  },
})
