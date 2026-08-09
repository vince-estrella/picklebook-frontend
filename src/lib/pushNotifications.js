import api from '../services/api'

function urlBase64ToUint8Array(base64String) {
  const normalized = String(base64String || '').trim()
  const padding = '='.repeat((4 - normalized.length % 4) % 4)
  const base64 = (normalized + padding).replace(/-/g, '+').replace(/_/g, '/')
  const rawData = window.atob(base64)
  return Uint8Array.from([...rawData].map((char) => char.charCodeAt(0)))
}

function getValidatedApplicationServerKey(publicKey) {
  let key
  try {
    key = urlBase64ToUint8Array(publicKey)
  } catch {
    throw new Error('Push public key is not valid base64. Check VAPID_PUBLIC_KEY in Railway.')
  }

  if (key.length !== 65 || key[0] !== 4) {
    throw new Error('Push public key is not a valid P-256 public key. Regenerate VAPID keys and update Railway.')
  }

  return key
}

export function pushSupported() {
  return 'serviceWorker' in navigator && 'PushManager' in window && 'Notification' in window
}

export function getPushUnsupportedMessage() {
  const ua = window.navigator.userAgent
  const isiOS = /iphone|ipad|ipod/i.test(ua)
  if (isiOS) {
    return 'iPhone notifications only work from a Safari-installed Home Screen app on supported iOS versions. Configuration profiles can add the app icon, but Apple may not allow web push from that profile.'
  }
  return 'This browser does not support web push notifications.'
}

export async function getNotificationState() {
  if (!pushSupported()) return 'unsupported'
  const registration = await navigator.serviceWorker.ready
  const subscription = await registration.pushManager.getSubscription()
  if (subscription) return 'enabled'
  return Notification.permission
}

export async function enablePushNotifications() {
  if (!pushSupported()) {
    throw new Error('Push notifications are not supported on this browser.')
  }

  const permission = await Notification.requestPermission()
  if (permission !== 'granted') {
    throw new Error('Notification permission was not granted.')
  }

  const keyResponse = await api.get('/push/public-key')
  const publicKey = keyResponse.data?.publicKey
  if (!publicKey) {
    throw new Error('Push notifications are not configured on the server yet.')
  }

  const registration = await navigator.serviceWorker.ready
  let subscription = await registration.pushManager.getSubscription()
  if (!subscription) {
    subscription = await registration.pushManager.subscribe({
      userVisibleOnly: true,
      applicationServerKey: getValidatedApplicationServerKey(publicKey),
    })
  }

  await api.post('/push/subscriptions', subscription.toJSON())
  return subscription
}

export async function sendTestPushNotification() {
  await api.post('/push/test')
}
