import { describe, it, expect } from 'vitest'
import { describeDevice } from '@incubrain/foundry/modules/events/server/utils/visitor-device'

const UA = {
  iphone: 'Mozilla/5.0 (iPhone; CPU iPhone OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  ipad: 'Mozilla/5.0 (iPad; CPU OS 17_5 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Mobile/15E148 Safari/604.1',
  pixel: 'Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Mobile Safari/537.36',
  galaxyTab: 'Mozilla/5.0 (Linux; Android 13; SM-X710) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  macSafari: 'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.5 Safari/605.1.15',
  winChrome: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36',
  winEdge: 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36 Edg/126.0.2592.87',
  linuxFirefox: 'Mozilla/5.0 (X11; Linux x86_64; rv:127.0) Gecko/20100101 Firefox/127.0',
  googlebot: 'Mozilla/5.0 (compatible; Googlebot/2.1; +http://www.google.com/bot.html)',
  gptbot: 'Mozilla/5.0 AppleWebKit/537.36 (KHTML, like Gecko); compatible; GPTBot/1.2; +https://openai.com/gptbot',
  curl: 'curl/8.4.0',
}

describe('describeDevice (server-side UA → device/browser/os)', () => {
  it.each([
    ['iphone', { device: 'mobile', browser: 'Safari', os: 'iOS' }],
    ['ipad', { device: 'tablet', browser: 'Safari', os: 'iOS' }],
    ['pixel', { device: 'mobile', browser: 'Chrome', os: 'Android' }],
    ['galaxyTab', { device: 'tablet', browser: 'Chrome', os: 'Android' }],
    ['macSafari', { device: 'desktop', browser: 'Safari', os: 'macOS' }],
    ['winChrome', { device: 'desktop', browser: 'Chrome', os: 'Windows' }],
    ['winEdge', { device: 'desktop', browser: 'Microsoft Edge', os: 'Windows' }],
    ['linuxFirefox', { device: 'desktop', browser: 'Firefox', os: 'Linux' }],
  ] as const)('%s', (key, expected) => {
    expect(describeDevice(UA[key])).toEqual(expected)
  })

  it('never reports a version', () => {
    for (const ua of Object.values(UA)) {
      const { browser, os } = describeDevice(ua)
      expect(`${browser ?? ''} ${os ?? ''}`).not.toMatch(/\d/)
    }
  })

  it.each(['googlebot', 'gptbot', 'curl'] as const)('describes no device for %s', (key) => {
    expect(describeDevice(UA[key])).toEqual({})
  })

  it('describes nothing for a missing or blank UA', () => {
    expect(describeDevice(undefined)).toEqual({})
    expect(describeDevice(null)).toEqual({})
    expect(describeDevice('   ')).toEqual({})
  })
})
