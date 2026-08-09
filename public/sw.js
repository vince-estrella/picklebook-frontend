const CACHE_VERSION = 'picklebook-v2'
const STATIC_CACHE = `${CACHE_VERSION}-static`
const STATIC_ASSETS = [
  '/manifest.webmanifest',
  '/favicon.svg',
  '/pwa/icon-192.png',
  '/pwa/icon-512.png'
]

self.addEventListener('install', (event) => {
  event.waitUntil(
    caches.open(STATIC_CACHE).then((cache) => cache.addAll(STATIC_ASSETS))
  )
})

self.addEventListener('activate', (event) => {
  event.waitUntil(
    caches.keys()
      .then((keys) => Promise.all(
        keys
          .filter((key) => key.startsWith('picklebook-') && key !== STATIC_CACHE)
          .map((key) => caches.delete(key))
      ))
  )
})

self.addEventListener('fetch', (event) => {
  const request = event.request
  if (request.method !== 'GET') return

  const url = new URL(request.url)
  if (url.pathname.startsWith('/api')) return

  if (request.mode === 'navigate') {
    event.respondWith(fetch(request))
    return
  }

  event.respondWith(
    caches.match(request).then((cached) => {
      if (cached) return cached
      return fetch(request).then((response) => {
        if (!response || response.status !== 200 || response.type === 'opaque') {
          return response
        }
        const copy = response.clone()
        caches.open(STATIC_CACHE).then((cache) => cache.put(request, copy))
        return response
      })
    })
  )
})

self.addEventListener('push', (event) => {
  let payload = {
    title: 'PickleBook',
    body: 'You have a new PickleBook update.',
    url: '/',
    tag: 'picklebook'
  }

  if (event.data) {
    try {
      payload = { ...payload, ...event.data.json() }
    } catch {
      payload.body = event.data.text()
    }
  }

  event.waitUntil(
    self.registration.showNotification(payload.title, {
      body: payload.body,
      icon: '/pwa/icon-192.png',
      badge: '/favicon.svg',
      tag: payload.tag,
      data: { url: payload.url || '/' }
    })
  )
})

self.addEventListener('notificationclick', (event) => {
  event.notification.close()
  const url = event.notification.data?.url || '/'

  event.waitUntil(
    self.clients.matchAll({ type: 'window', includeUncontrolled: true }).then((clients) => {
      for (const client of clients) {
        const clientUrl = new URL(client.url)
        if (clientUrl.pathname === url && 'focus' in client) {
          return client.focus()
        }
      }
      return self.clients.openWindow(url)
    })
  )
})
