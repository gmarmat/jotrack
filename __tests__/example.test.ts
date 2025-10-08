import { describe, it, expect } from 'vitest'

describe('Jotrack Unit Tests', () => {
  it('should pass a basic test', () => {
    expect(1 + 1).toBe(2)
  })

  it('should validate environment', () => {
    expect(process.versions.node).toBeDefined()
  })
})

