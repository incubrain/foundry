/**
 * AI user-agent taxonomy — the single source of truth for "who is this crawler
 * and what does it do with the fetch".
 *
 * Two consumers, one list:
 *
 * 1. **Visitor classification** (`modules/events/server/utils/visitor-class.ts`)
 *    maps a request's User-Agent to `visitor.class: 'human' | 'agent' | 'bot'`
 *    and, for agents, `visitor.subclass` — the group the token came from.
 *    The agentic-vs-human traffic split is a core KPI (VISION.md).
 * 2. **robots.txt policy** (`modules/ai-robots.ts`) turns the same taxonomy into
 *    `User-agent:` groups so a site can allow AI *answer* traffic while taking a
 *    deliberate stance on AI *training* crawls.
 *
 * The split that matters is **what the fetch is for**, not who operates it:
 * a live fetch that can cite you back is distribution; a training crawl is a
 * one-way donation to a model. They deserve different answers, so they are
 * different lists — and those same lists are what `visitor.subclass` reports,
 * so "what robots.txt says to this crawler" and "how the signal stream counts
 * it" can never disagree.
 *
 * Tokens are matched case-insensitively as substrings of the UA, and are written
 * exactly as the operator publishes them so they can be emitted verbatim into
 * robots.txt.
 */

/**
 * Answer-engine crawlers: they fetch to build or refresh the index an AI answer
 * is drawn from, and they cite the source. Blocking these removes the site from
 * AI answers — the opposite of what a validation site wants.
 */
export const AI_SEARCH_AGENTS = [
  'OAI-SearchBot',
  'Claude-SearchBot',
  'PerplexityBot',
  'DuckAssistBot',
  'YouBot',
] as const

/**
 * User-triggered live fetchers — the `*-User` family. A human asked a question
 * and the assistant is fetching this page *right now* on their behalf. This is
 * the highest-intent non-human traffic a Foundry site sees.
 */
export const AI_USER_FETCHERS = [
  'ChatGPT-User',
  'Claude-User',
  'Perplexity-User',
  'Meta-ExternalFetcher',
  'MistralAI-User',
  'Google-CloudVertexBot',
] as const

/**
 * Training / dataset crawlers. The fetch feeds a corpus; there is no click and
 * no citation back. Whether this is a good trade is a per-site judgement call —
 * hence `aiRobots.training` in `modules/ai-robots.ts`.
 */
export const AI_TRAINING_CRAWLERS = [
  'GPTBot',
  'ClaudeBot',
  'Google-Extended',
  'CCBot',
  'Applebot-Extended',
  'Bytespider',
  'Amazonbot',
  'Meta-ExternalAgent',
  'FacebookBot',
  'cohere-ai',
  'AI2Bot',
  'Ai2Bot-Dolma',
  'Diffbot',
  'omgilibot',
  'Timpibot',
  'PanguBot',
  'Webzio-Extended',
  'ImagesiftBot',
  'SemrushBot-OCOB',
] as const

/**
 * Headless browsers and automation runtimes. Agentic traffic, but not published
 * crawlers — they ignore robots.txt and have no `User-agent:` token worth
 * writing, so these feed classification only.
 */
export const AI_AUTOMATION_AGENTS = [
  'HeadlessChrome',
  'Playwright',
  'Puppeteer',
  'Selenium',
  'Cypress',
  'FoundrySmoke', // this repo's own smoke runners (scripts/smoke.mjs, scripts/browser-smoke.mjs)
] as const

/**
 * Loose vendor substrings that catch UAs not covered by a published token
 * (e.g. `claude-web`, one-off `anthropic-ai` variants). Classification only —
 * never emitted into robots.txt, where a wrong `User-agent:` line is worse than
 * a missing one.
 */
export const AI_VENDOR_HINTS = [
  'claude-web',
  'anthropic',
  'OpenAI',
  'cohere',
] as const

/**
 * Every AI agent that fetches to answer a question now. Always allowed in
 * robots.txt — this is how a Foundry site stays visible inside AI answers.
 */
export const AI_ANSWER_AGENTS = [
  ...AI_SEARCH_AGENTS,
  ...AI_USER_FETCHERS,
] as const

/** Every published token, in classification order (answer → training → automation). */
export const AI_AGENT_TOKENS = [
  ...AI_ANSWER_AGENTS,
  ...AI_TRAINING_CRAWLERS,
  ...AI_AUTOMATION_AGENTS,
] as const

export type AiAgentToken = (typeof AI_AGENT_TOKENS)[number]

/**
 * What an agent's fetch is *for* — the sub-class reported as `visitor.subclass`
 * alongside `visitor.class: 'agent'`.
 *
 * These are exactly the four lists above, not a second opinion about them: the
 * robots.txt split and the analytics split read the same grouping, so a crawler
 * cannot be "search" to robots.txt and "training" in the signal stream.
 *
 * - `search` — answer-engine index crawlers. Presence here is distribution.
 * - `live-user-fetch` — a human asked a question and the assistant is fetching
 *   this page right now. Highest-intent non-human traffic there is.
 * - `training` — corpus crawls. No click, no citation back.
 * - `automation` — headless browsers and test/automation runtimes. Agentic, but
 *   unpublished: never emitted into robots.txt.
 */
export type AiAgentPurpose = 'search' | 'live-user-fetch' | 'training' | 'automation'

/**
 * The grouping, in one iterable shape — the single source of truth for
 * sub-classification. Adding a token to a list above is all it takes for both
 * robots.txt and `visitor.subclass` to learn about it.
 */
export const AI_AGENT_PURPOSE_GROUPS: ReadonlyArray<{
  purpose: AiAgentPurpose
  tokens: readonly string[]
}> = [
  { purpose: 'search', tokens: AI_SEARCH_AGENTS },
  { purpose: 'live-user-fetch', tokens: AI_USER_FETCHERS },
  { purpose: 'training', tokens: AI_TRAINING_CRAWLERS },
  { purpose: 'automation', tokens: AI_AUTOMATION_AGENTS },
]
