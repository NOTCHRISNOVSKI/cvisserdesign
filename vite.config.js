import { defineConfig } from 'vite'

// De dev-server wordt bereikt via https://preview.cvisserdesign.nl (Cloudflare-tunnel + Access).
// Zet LOCAL=1 om hem alleen op localhost te gebruiken.
const viaTunnel = process.env.LOCAL !== '1'

export default defineConfig({
  build: {
    // Bouwen naar build/ (niet live). dist/ wordt alleen bij `npm run live` bijgewerkt.
    outDir: 'build',
    emptyOutDir: true,
  },
  server: {
    host: true,
    allowedHosts: ['preview.cvisserdesign.nl'],
    hmr: viaTunnel ? { protocol: 'wss', clientPort: 443 } : undefined,
  },
  preview: {
    host: true,
    allowedHosts: ['preview.cvisserdesign.nl'],
  },
})
