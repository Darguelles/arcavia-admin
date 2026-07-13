import { describe, it, expect } from 'vitest'
import { slugify } from '../../src/lib/utils'

describe('slugify', () => {
  it('lowercases the name', () => {
    expect(slugify('Lima')).toBe('lima')
  })

  it('replaces spaces with hyphens', () => {
    expect(slugify('San Isidro')).toBe('san-isidro')
  })

  it('strips accents', () => {
    expect(slugify('Córdoba')).toBe('cordoba')
    expect(slugify('Málaga')).toBe('malaga')
  })

  it('handles multiple spaces', () => {
    expect(slugify('Buenos  Aires')).toBe('buenos-aires')
  })

  it('strips non-alphanumeric chars', () => {
    expect(slugify('Lima (Perú)')).toBe('lima-peru')
  })

  it('trims leading/trailing whitespace', () => {
    expect(slugify('  lima  ')).toBe('lima')
  })

  it('handles mixed accents and spaces', () => {
    expect(slugify('São Paulo')).toBe('sao-paulo')
  })
})
