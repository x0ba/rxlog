const UNSAFE_PREFIXES = ['//', '/\\']

export function sanitizeRedirectUrl(value: unknown) {
  if (typeof value !== 'string') return undefined

  const trimmedValue = value.trim()
  if (!trimmedValue.startsWith('/')) return undefined
  if (UNSAFE_PREFIXES.some((prefix) => trimmedValue.startsWith(prefix))) {
    return undefined
  }

  return trimmedValue
}

export function getCurrentRelativeUrl() {
  if (typeof window === 'undefined') return '/dashboard'

  return `${window.location.pathname}${window.location.search}${window.location.hash}`
}
