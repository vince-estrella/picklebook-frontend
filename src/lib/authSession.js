export function getStoredSessionToken(token) {
  const isLocalHttp =
    window.location.protocol === 'http:' &&
    ['localhost', '127.0.0.1'].includes(window.location.hostname)

  if (isLocalHttp && token) return token
  return 'cookie'
}
