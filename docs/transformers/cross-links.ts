import { defineTransformer } from '@nuxt/content'

interface CrossLink {
  path: string
  text: string
  line?: number
}

export default defineTransformer({
  name: 'auto-cross-links',
  extensions: ['.md'],
  transform(content) {
    // Find all internal markdown links [text](/path)
    const linkPattern = /\[([^\]]+)\]\(([^)]+)\)/g
    const outgoingLinks: CrossLink[] = []
    const seen = new Set<string>()

    let match
    while ((match = linkPattern.exec(content.body || '')) !== null) {
      const text = match[1]
      const path = match[2]

      // Only track internal links (not external URLs)
      if (path.startsWith('/') && !path.startsWith('//') && !seen.has(path)) {
        outgoingLinks.push({
          path,
          text,
        })
        seen.add(path)
      }
    }

    // Add outgoing links to content metadata
    if (outgoingLinks.length > 0) {
      content.outgoingLinks = outgoingLinks
    }

    return content
  },
})
