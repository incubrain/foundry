// @vitest-environment node
import { describe, it, expect } from 'vitest'
import {
  isLive,
  isSlug,
  parsePost,
  parsePublishAt,
  postState,
  renderPost,
  slugify,
  validatePostInput,
} from '@incubrain/foundry/modules/blog/core/post.mjs'

const NOW = new Date('2026-10-16T12:00:00.000Z')

describe('postState', () => {
  it('is live once publishAt has passed, scheduled before', () => {
    expect(postState({ publishAt: '2026-10-16T11:59:59.999Z' }, NOW)).toBe('live')
    expect(postState({ publishAt: '2026-10-16T12:00:00.001Z' }, NOW)).toBe('scheduled')
  })

  it('treats publishAt exactly now as live', () => {
    expect(postState({ publishAt: '2026-10-16T12:00:00.000Z' }, NOW)).toBe('live')
    expect(isLive({ publishAt: '2026-10-16T12:00:00.000Z' }, NOW)).toBe(true)
  })

  it('lets draft win over a past publishAt', () => {
    expect(postState({ publishAt: '2020-01-01T00:00:00Z', draft: true }, NOW)).toBe('draft')
    expect(isLive({ publishAt: '2020-01-01T00:00:00Z', draft: true }, NOW)).toBe(false)
  })

  it('fails closed on a missing, invalid or odd publishAt', () => {
    expect(postState({}, NOW)).toBe('draft')
    expect(postState({ publishAt: 'next tuesday' }, NOW)).toBe('draft')
    expect(postState({ publishAt: '2026-02-31' }, NOW)).toBe('draft')
    expect(postState({ publishAt: 42 }, NOW)).toBe('draft')
    expect(postState({ publishAt: '2020-01-01', draft: 'true' }, NOW)).toBe('draft')
    expect(postState(null, NOW)).toBe('draft')
    expect(postState({ publishAt: '2020-01-01' }, 'garbage')).toBe('draft')
  })

  it('compares instants, so an offset publishAt is judged in UTC', () => {
    // 2026-10-16T17:30+05:30 is 12:00Z — exactly now.
    expect(postState({ publishAt: '2026-10-16T17:30:00+05:30' }, NOW)).toBe('live')
    expect(postState({ publishAt: '2026-10-16T17:31:00+05:30' }, NOW)).toBe('scheduled')
  })

  it('accepts a Date and defaults now to the clock', () => {
    expect(postState({ publishAt: new Date('2020-01-01') })).toBe('live')
    expect(postState({ publishAt: '2999-01-01T00:00:00Z' })).toBe('scheduled')
  })
})

describe('parsePublishAt', () => {
  it('reads date-only and offset-less values as UTC', () => {
    expect(parsePublishAt('2026-10-20')?.toISOString()).toBe('2026-10-20T00:00:00.000Z')
    expect(parsePublishAt('2026-10-20T09:15')?.toISOString()).toBe('2026-10-20T09:15:00.000Z')
    expect(parsePublishAt('2026-10-20 09:15:30.5Z')?.toISOString()).toBe('2026-10-20T09:15:30.500Z')
    expect(parsePublishAt('2026-10-20T09:00:00+0530')?.toISOString()).toBe('2026-10-20T03:30:00.000Z')
  })

  it('rejects loose and impossible dates', () => {
    for (const bad of ['Oct 20 2026', '2026-13-01', '2026-02-30', '2026-10-20T25:00', '', 7, null]) {
      expect(parsePublishAt(bad)).toBeNull()
    }
  })
})

describe('slugify', () => {
  it('makes a lowercase hyphenated ASCII slug', () => {
    expect(slugify('Hello, World!')).toBe('hello-world')
    expect(slugify('  Why we don’t use  "AI" — yet  ')).toBe('why-we-dont-use-ai-yet')
    expect(slugify('Café déjà vu')).toBe('cafe-deja-vu')
  })

  it('returns empty when nothing usable is left and caps the length', () => {
    expect(slugify('मराठी')).toBe('')
    expect(slugify('')).toBe('')
    expect(slugify('a '.repeat(100)).length).toBeLessThanOrEqual(80)
    expect(isSlug(slugify('a '.repeat(100)))).toBe(true)
  })

  it('isSlug rejects traversal and case', () => {
    for (const bad of ['../x', 'a/b', 'A', 'a--b', '-a', '', 'a.md']) expect(isSlug(bad)).toBe(false)
  })
})

describe('renderPost / parsePost', () => {
  const post = {
    frontmatter: {
      title: 'A: tricky "title"',
      description: 'Colons: and # hashes',
      publishAt: '2026-10-20T09:00:00.000Z',
      draft: false,
      tags: ['a', 'b'],
      image: { src: '/x.png', alt: 'x' },
      source: 'polaris:article/abc',
    },
    body: 'Hello\n\n## There\n',
  }

  it('round-trips and is stable', () => {
    const text = renderPost(post)
    const back = parsePost(text)
    expect(back.frontmatter).toEqual(post.frontmatter)
    expect(back.body).toBe('Hello\n\n## There')
    expect(renderPost(back)).toBe(text)
  })

  it('writes keys in a fixed order, quotes publishAt, always writes draft', () => {
    const text = renderPost({ frontmatter: { source: 's', publishAt: '2026-10-20T09:00:00.000Z', title: 'T', extra: 1 }, body: 'x' })
    expect(text.split('\n').slice(0, 7)).toEqual([
      '---',
      'title: T',
      'publishAt: "2026-10-20T09:00:00.000Z"',
      'draft: false',
      'source: s',
      'extra: 1',
      '---',
    ])
  })

  it('drops empty optionals and handles an empty body and CRLF', () => {
    const text = renderPost({ frontmatter: { title: 'T', publishAt: '2026-10-20T09:00:00.000Z', description: '', tags: [] }, body: '' })
    expect(text).toBe('---\ntitle: T\npublishAt: "2026-10-20T09:00:00.000Z"\ndraft: false\n---\n')
    expect(parsePost('---\r\ntitle: T\r\n---\r\n\r\nline1\r\nline2\r\n').body).toBe('line1\nline2')
  })

  it('reads text with no frontmatter as body only', () => {
    expect(parsePost('just text\n')).toEqual({ frontmatter: {}, body: 'just text' })
  })

  it('keeps unquoted ISO timestamps as strings', () => {
    expect(parsePost('---\ntitle: T\npublishAt: 2026-10-20T09:00:00Z\n---\n').frontmatter.publishAt).toBe('2026-10-20T09:00:00Z')
  })
})

describe('validatePostInput', () => {
  it('derives the slug and normalises publishAt to UTC', () => {
    const r = validatePostInput({ title: 'Hello World', body: 'x', publishAt: '2026-10-20T14:30:00+05:30' })
    expect(r).toMatchObject({ ok: true, value: { slug: 'hello-world', publishAt: '2026-10-20T09:00:00.000Z' } })
  })

  it('keeps an explicit slug and leaves absent publishAt undefined', () => {
    const r = validatePostInput({ slug: 'my-slug', title: 'मराठी', body: '' })
    expect(r).toMatchObject({ ok: true, value: { slug: 'my-slug' } })
    expect(r.ok && r.value.publishAt).toBeUndefined()
  })

  it('refuses bad input with a readable message', () => {
    const cases: unknown[] = [
      { body: 'x' },
      { title: 'T' },
      { title: 'T', body: 'x', slug: '../etc' },
      { title: 'T', body: 'x', publishAt: 'soon' },
      { title: 'T', body: 'x', canonical: 'not a url' },
      { title: 'T', body: 'x', surprise: true },
      { title: 'मराठी', body: 'x' },
      'nope',
    ]
    for (const input of cases) {
      const r = validatePostInput(input)
      expect(r.ok).toBe(false)
      if (!r.ok) expect(r.message.length).toBeGreaterThan(0)
    }
  })
})
