// @vitest-environment node
import { describe, it, expect } from 'vitest'
import { guardTarget } from '@incubrain/foundry/modules/blog/server/utils/guard'

describe('guardTarget', () => {
  it('names the content path behind every raw-source shape', () => {
    expect(guardTarget('/raw/blog/x.md', {}, '/blog')).toBe('/blog/x')
    expect(guardTarget('/blog/x.md', {}, '/blog')).toBe('/blog/x')
    expect(guardTarget('/raw/blog/Hello%20There.md', {}, '/blog')).toBe('/blog/Hello There')
    expect(guardTarget('/api/_foundry/content/page', { collection: 'blog', path: '/blog/x/' }, '/blog')).toBe('/blog/x')
  })

  it('denies surround and malformed encodings, ignores unrelated routes', () => {
    expect(guardTarget('/api/_foundry/content/surround', { collection: 'blog' }, '/blog')).toBe('deny')
    expect(guardTarget('/raw/blog/%E0%A4%A.md', {}, '/blog')).toBe('deny')
    expect(guardTarget('/blog/x', {}, '/blog')).toBeNull()
    expect(guardTarget('/blog/rss.xml', {}, '/blog')).toBeNull()
    expect(guardTarget('/raw/pages/x.md', {}, '/blog')).toBeNull()
    expect(guardTarget('/api/_foundry/content/page', { collection: 'pages', path: '/x' }, '/blog')).toBeNull()
  })
})
