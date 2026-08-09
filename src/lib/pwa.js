let deferredInstallPrompt = null
const listeners = new Set()

export function isStandalonePwa() {
  return window.matchMedia?.('(display-mode: standalone)').matches || window.navigator.standalone === true
}

export function isIosDevice() {
  return /iphone|ipad|ipod/i.test(window.navigator.userAgent)
}

export function getDeferredInstallPrompt() {
  return deferredInstallPrompt
}

export function subscribeInstallPrompt(listener) {
  listeners.add(listener)
  listener(deferredInstallPrompt)
  return () => listeners.delete(listener)
}

function notifyListeners() {
  listeners.forEach((listener) => listener(deferredInstallPrompt))
}

export function setupInstallPromptCapture() {
  window.addEventListener('beforeinstallprompt', (event) => {
    event.preventDefault()
    deferredInstallPrompt = event
    notifyListeners()
  })

  window.addEventListener('appinstalled', () => {
    deferredInstallPrompt = null
    notifyListeners()
  })
}

export async function promptInstall() {
  if (!deferredInstallPrompt) return null
  deferredInstallPrompt.prompt()
  const choice = await deferredInstallPrompt.userChoice
  deferredInstallPrompt = null
  notifyListeners()
  return choice
}

export function registerServiceWorker() {
  if (!('serviceWorker' in navigator)) return

  window.addEventListener('load', () => {
    navigator.serviceWorker.register('/sw.js').then((registration) => {
      registration.update()
      setInterval(() => registration.update(), 60 * 60 * 1000)
    }).catch((error) => {
      console.warn('Service worker registration failed:', error)
    })
  })
}
