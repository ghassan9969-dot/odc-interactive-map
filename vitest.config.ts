import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The suite exercises pure map data and routing logic, so no DOM is needed.
    environment: 'node',
    include: ['tests/**/*.test.ts'],
    reporters: 'verbose',
  },
})
