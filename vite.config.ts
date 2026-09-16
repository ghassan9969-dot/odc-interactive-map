import { defineConfig, type Plugin } from 'vite'
import react from '@vitejs/plugin-react'

/**
 * The policy the published site runs under.
 *
 * Everything the map needs is served from its own origin — the bundle,
 * the stylesheet, the floor photographs, the logo — so every fetching
 * directive is `'self'` and there is no third party to allow. `data:`
 * stays open to images alone because Vite inlines any asset under its
 * 4 kB limit as a data URI, which would otherwise break the moment a
 * small photograph is added.
 *
 * `object-src` and `form-action` are closed outright: the site embeds no
 * plugins and submits no forms, so neither has anything to lose.
 *
 * `frame-ancestors` is deliberately absent. A `<meta>` policy cannot
 * carry it — the specification requires it to be ignored there — so
 * putting it here would suggest a protection against framing that does
 * not exist. That one needs a real response header, which GitHub Pages
 * cannot send; see the note in README.
 */
const PRODUCTION_CSP = [
  "default-src 'self'",
  "script-src 'self'",
  "style-src 'self'",
  "img-src 'self' data:",
  "font-src 'self'",
  "connect-src 'self'",
  "object-src 'none'",
  "base-uri 'self'",
  "form-action 'none'",
].join('; ')

/**
 * Writes the policy into the built `index.html`, and only the built one.
 *
 * `apply: 'build'` keeps it away from the dev server, which serves its
 * client from inline script and talks to it over a websocket; admitting
 * those would mean `'unsafe-inline'` in the policy that ships, to buy
 * nothing the published site uses. Development therefore runs with no
 * policy rather than with a weakened copy of the real one.
 *
 * The tag is prepended to `<head>` so it is parsed before the module
 * script and the stylesheet it has to govern.
 */
function contentSecurityPolicy(): Plugin {
  return {
    name: 'odc-content-security-policy',
    apply: 'build',
    transformIndexHtml: {
      order: 'pre',
      handler: () => [
        {
          tag: 'meta',
          attrs: { 'http-equiv': 'Content-Security-Policy', content: PRODUCTION_CSP },
          injectTo: 'head-prepend',
        },
      ],
    },
  }
}

export default defineConfig({
  plugins: [react(), contentSecurityPolicy()],
  base: './',
  // Bound to the loopback address so the dev server is not reachable from
  // the rest of the network. `strictPort` makes a clash fail loudly rather
  // than silently moving to another port.
  server: { host: '127.0.0.1', port: 5173, strictPort: true },
  preview: { host: '127.0.0.1', port: 4173, strictPort: true },
})

export { PRODUCTION_CSP }
