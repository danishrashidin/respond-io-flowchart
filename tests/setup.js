import { afterEach, vi } from 'vitest'
import { enableAutoUnmount } from '@vue/test-utils'

if (typeof window !== 'undefined') {
  Object.defineProperty(window, 'matchMedia', {
    writable: true,
    value: (query) => ({
      matches: false,
      media: query,
      onchange: null,
      addListener() {},
      removeListener() {},
      addEventListener() {},
      removeEventListener() {},
      dispatchEvent() {
        return true
      },
    }),
  })
}
enableAutoUnmount((unmount) =>
  afterEach(() => {
    unmount()
    if (typeof document === 'undefined') {
      vi.restoreAllMocks()
      return
    }
    document.body.innerHTML = ''
    for (const cookie of document.cookie.split(';')) {
      document.cookie = `${cookie.split('=')[0].trim()}=; max-age=0; path=/`
    }
    vi.restoreAllMocks()
  }),
)
