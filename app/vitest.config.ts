import { defineConfig } from 'vitest/config'

export default defineConfig({
  test: {
    // The unit tests cover pure logic (no DOM), so run them in Node.
    environment: 'node',
    include: ['src/**/*.test.ts'],
  },
})
