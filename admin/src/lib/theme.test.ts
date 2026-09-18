import assert from 'node:assert/strict'
import { beforeEach, describe, it } from 'node:test'

const store = new Map<string, string>()
const classList = new Set<string>()
const htmlStyle: { colorScheme?: string } = {}

const localStorageMock = {
  getItem(key: string) {
    return store.has(key) ? store.get(key)! : null
  },
  setItem(key: string, value: string) {
    store.set(key, value)
  },
  removeItem(key: string) {
    store.delete(key)
  },
  clear() {
    store.clear()
  },
  key() {
    return null
  },
  get length() {
    return store.size
  },
}

Object.defineProperty(globalThis, 'localStorage', {
  value: localStorageMock,
  configurable: true,
})

Object.defineProperty(globalThis, 'document', {
  value: {
    documentElement: {
      classList: {
        toggle(name: string, force?: boolean) {
          if (force) classList.add(name)
          else classList.delete(name)
        },
        add(name: string) {
          classList.add(name)
        },
        remove(name: string) {
          classList.delete(name)
        },
        contains(name: string) {
          return classList.has(name)
        },
      },
      style: htmlStyle,
    },
  },
  configurable: true,
})

const { applyTheme, getStoredTheme, toggleTheme } = await import('./theme.ts')

describe('admin theme', () => {
  beforeEach(() => {
    store.clear()
    classList.clear()
    htmlStyle.colorScheme = undefined
  })

  it('defaults to dark when nothing is stored', () => {
    assert.equal(getStoredTheme(), 'dark')
  })

  it('restores a stored light preference', () => {
    store.set('cookapp-admin-theme', 'light')
    assert.equal(getStoredTheme(), 'light')
  })

  it('applies dark to the document including color-scheme', () => {
    applyTheme('dark')
    assert.equal(classList.has('dark'), true)
    assert.equal(htmlStyle.colorScheme, 'dark')
    assert.equal(store.get('cookapp-admin-theme'), 'dark')
  })

  it('toggles dark → light so the whole chrome (including content) leaves dark class', () => {
    applyTheme('dark')
    const next = toggleTheme('dark')
    assert.equal(next, 'light')
    assert.equal(classList.has('dark'), false)
    assert.equal(htmlStyle.colorScheme, 'light')
  })
})
