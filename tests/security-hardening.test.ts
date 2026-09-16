/**
 * The security decisions, held in place.
 *
 * Each of these guards a property that is easy to undo by accident and
 * expensive to notice: a policy quietly widened to make something work,
 * a development convenience that reopens the dev server to the network,
 * a permission added back to the job that runs third-party install
 * scripts. They assert the property rather than the wording, so ordinary
 * edits stay free while a weakening shows up as a failing test.
 */

import { readFileSync } from 'node:fs'
import { fileURLToPath } from 'node:url'
import { describe, expect, it } from 'vitest'
import config, { PRODUCTION_CSP } from '../vite.config'

const repoFile = (name: string) =>
  readFileSync(fileURLToPath(new URL(`../${name}`, import.meta.url)), 'utf8')

/** `"script-src 'self'"` → `['self']`, by directive name. */
const directives = (policy: string): Map<string, string[]> => {
  const map = new Map<string, string[]>()
  for (const part of policy.split(';')) {
    const [name, ...values] = part.trim().split(/\s+/)
    if (name) map.set(name, values)
  }
  return map
}

describe('the policy the published site runs under', () => {
  const csp = directives(PRODUCTION_CSP)

  it('falls back to the site’s own origin for anything unnamed', () => {
    expect(csp.get('default-src')).toEqual(["'self'"])
  })

  it('runs only its own script, with no inline or eval escape hatch', () => {
    expect(csp.get('script-src')).toEqual(["'self'"])
  })

  it('closes the two things the site never uses', () => {
    expect(csp.get('object-src')).toEqual(["'none'"])
    expect(csp.get('form-action')).toEqual(["'none'"])
  })

  it('pins the document base, so an injected <base> cannot redirect assets', () => {
    expect(csp.get('base-uri')).toEqual(["'self'"])
  })

  it('serves photographs from this origin, allowing the data: URIs Vite inlines', () => {
    expect(csp.get('img-src')).toEqual(["'self'", 'data:'])
  })

  it('names every fetching directive, leaving nothing to a default', () => {
    for (const d of ['script-src', 'style-src', 'img-src', 'font-src', 'connect-src']) {
      expect(csp.has(d), `${d} is missing`).toBe(true)
    }
  })

  it('admits no wildcard, no scheme-wide source and no plaintext origin', () => {
    for (const [name, values] of csp) {
      for (const v of values) {
        expect(v, `${name} allows ${v}`).not.toBe('*')
        expect(v, `${name} allows ${v}`).not.toMatch(/^https?:$/)
        expect(v, `${name} allows ${v}`).not.toMatch(/^http:\/\//)
        expect(v, `${name} allows ${v}`).not.toMatch(/^\*\./)
      }
    }
  })

  it('never reaches for unsafe-inline or unsafe-eval to make something work', () => {
    expect(PRODUCTION_CSP).not.toContain("'unsafe-inline'")
    expect(PRODUCTION_CSP).not.toContain("'unsafe-eval'")
    expect(PRODUCTION_CSP).not.toContain("'unsafe-hashes'")
  })

  it('leaves out frame-ancestors, which a meta policy cannot carry', () => {
    // Claiming it here would read as protection against framing that the
    // browser is required to ignore. It needs a real response header,
    // which GitHub Pages cannot send.
    expect(csp.has('frame-ancestors')).toBe(false)
    expect(csp.has('report-uri')).toBe(false)
    expect(csp.has('sandbox')).toBe(false)
  })
})

describe('where the policy is applied', () => {
  const plugins = (config.plugins as unknown[]).flat(Infinity) as {
    name?: string
    apply?: unknown
    transformIndexHtml?: unknown
  }[]
  const csp = plugins.find((p) => p && p.name === 'odc-content-security-policy')

  it('is wired into the build', () => {
    expect(csp, 'the CSP plugin is not in the plugin list').toBeTruthy()
  })

  it('applies to the build alone, so the dev server is never given it', () => {
    // Development runs with no policy rather than a weakened copy of the
    // real one — that is what keeps `script-src 'self'` affordable above.
    expect(csp!.apply).toBe('build')
  })

  it('emits one meta tag carrying exactly the production policy', () => {
    const hook = csp!.transformIndexHtml as
      | { handler: (html: string, ctx: unknown) => unknown }
      | ((html: string, ctx: unknown) => unknown)
    const out = typeof hook === 'function' ? hook('', {}) : hook.handler('', {})
    const tags = (Array.isArray(out) ? out : (out as { tags: unknown[] }).tags) as {
      tag: string
      attrs: Record<string, string>
      injectTo: string
    }[]

    expect(tags).toHaveLength(1)
    expect(tags[0].tag).toBe('meta')
    expect(tags[0].attrs['http-equiv']).toBe('Content-Security-Policy')
    expect(tags[0].attrs.content).toBe(PRODUCTION_CSP)
  })

  it('puts the tag ahead of the script and stylesheet it governs', () => {
    const hook = csp!.transformIndexHtml as { handler: (h: string, c: unknown) => unknown }
    const out = hook.handler('', {})
    const tags = (Array.isArray(out) ? out : (out as { tags: unknown[] }).tags) as {
      injectTo: string
    }[]
    // Anything later than head-prepend would be parsed after Vite's own
    // module script, which the policy has to cover.
    expect(tags[0].injectTo).toBe('head-prepend')
  })
})

describe('the development and preview servers', () => {
  it('listen on the loopback address only', () => {
    // Not reachable from the rest of the network, which is what keeps a
    // dev-server vulnerability from being someone else’s to exploit.
    expect(config.server?.host).toBe('127.0.0.1')
    expect(config.preview?.host).toBe('127.0.0.1')
  })

  it('fail loudly on a port clash instead of moving somewhere unexpected', () => {
    expect(config.server?.strictPort).toBe(true)
    expect(config.preview?.strictPort).toBe(true)
  })

  it('keeps the ports the README documents', () => {
    expect(config.server?.port).toBe(5173)
    expect(config.preview?.port).toBe(4173)
  })
})

describe('what the deploy workflow is allowed to do', () => {
  const yaml = repoFile('.github/workflows/deploy.yml')
  const buildJob = yaml.slice(yaml.indexOf('\n  build:'), yaml.indexOf('\n  deploy:'))
  const deployJob = yaml.slice(yaml.indexOf('\n  deploy:'))

  it('grants nothing by default', () => {
    expect(yaml).toMatch(/^permissions:\s*\{\}\s*$/m)
  })

  it('gives the job that runs npm ci read access and nothing more', () => {
    // `npm ci` runs the install scripts of every dependency. This is the
    // blast radius if one of them is ever compromised.
    expect(buildJob).toMatch(/permissions:\s*\n\s*contents:\s*read\s*\n/)
    expect(buildJob).not.toMatch(/pages:\s*write/)
    expect(buildJob).not.toMatch(/id-token:\s*write/)
    expect(buildJob).not.toMatch(/contents:\s*write/)
  })

  it('keeps the Pages permissions on the publishing job alone', () => {
    expect(deployJob).toMatch(/pages:\s*write/)
    expect(deployJob).toMatch(/id-token:\s*write/)
  })

  it('configures Pages from the publishing job, not the build', () => {
    // configure-pages calls the Pages API and so needs `pages: write`.
    expect(buildJob).not.toContain('actions/configure-pages')
    expect(deployJob).toContain('actions/configure-pages')
  })

  it('does not leave the checkout token behind in .git/config', () => {
    expect(buildJob).toMatch(/persist-credentials:\s*false/)
  })

  it('publishes only from main, and never from a pull request', () => {
    // Both conditions matter: without the ref check, a manual run started
    // from any branch would deploy that branch to the live site.
    for (const block of [deployJob, buildJob]) {
      const gate = block.match(/if:\s*(.+)/)?.[1] ?? ''
      expect(gate).toContain("github.event_name != 'pull_request'")
      expect(gate).toContain("github.ref == 'refs/heads/main'")
    }
  })

  it('still builds and tests pull requests', () => {
    expect(yaml).toMatch(/pull_request:\s*\n\s*branches:\s*\[main\]/)
    expect(buildJob).toContain('npm test')
    expect(buildJob).toContain('npm run typecheck')
    expect(buildJob).toContain('npm run build')
  })
})
