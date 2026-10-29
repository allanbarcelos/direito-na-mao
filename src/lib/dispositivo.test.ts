import { describe, expect, it } from 'vitest'
import { ehCelular } from './dispositivo'

const nav = (userAgent: string, mobile?: boolean) =>
  ({ userAgent, ...(mobile === undefined ? {} : { userAgentData: { mobile } }) }) as unknown as Navigator

describe('ehCelular', () => {
  it('usa a dica do navegador quando existe', () => {
    expect(ehCelular(nav('Mozilla/5.0 (Linux; Android 14)', true), true)).toBe(true)
    expect(ehCelular(nav('Mozilla/5.0 (Windows NT 10.0; Win64; x64)', false), false)).toBe(false)
  })

  it('tablet Android conta como celular mesmo com mobile: false', () => {
    expect(ehCelular(nav('Mozilla/5.0 (Linux; Android 14; Tablet)', false), true)).toBe(true)
  })

  it('sem a dica, decide pelo user agent (iPhone, iPad, computador)', () => {
    expect(ehCelular(nav('Mozilla/5.0 (iPhone; CPU iPhone OS 18_0 like Mac OS X) Mobile/15E148'), true)).toBe(true)
    expect(ehCelular(nav('Mozilla/5.0 (iPad; CPU OS 18_0 like Mac OS X)'), true)).toBe(true)
    expect(ehCelular(nav('Mozilla/5.0 (Macintosh; Intel Mac OS X 14_0) Safari/605.1.15'), false)).toBe(false)
  })
})
