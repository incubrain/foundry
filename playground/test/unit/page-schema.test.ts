// @vitest-environment node
// basePageSchema.hero is opt-in (product-validator-4bc): the catch-all renders
// an automatic UPageHero only for `hero: true`.
import { describe, expect, it } from 'vitest'
import { basePageSchema } from '../../../layer/content.collections'

describe('basePageSchema.hero', () => {
  it('defaults to false when the page has no hero: key', () => {
    expect(basePageSchema.parse({ title: 'No hero key' }).hero).toBe(false)
  })

  it('keeps an explicit hero: true', () => {
    expect(basePageSchema.parse({ title: 'Hero', hero: true }).hero).toBe(true)
  })

  it('keeps an explicit hero: false', () => {
    expect(basePageSchema.parse({ title: 'No hero', hero: false }).hero).toBe(false)
  })
})
