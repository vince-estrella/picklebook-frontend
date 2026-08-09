import api from '../services/api'

export function hasOwnerSessionMarker() {
  return Boolean(localStorage.getItem('token'))
}

export async function ensureOwnerSession() {
  if (hasOwnerSessionMarker()) return true

  try {
    const res = await api.get('/owner/profile')
    localStorage.setItem('token', 'cookie')

    const storedOwner = JSON.parse(localStorage.getItem('owner') || '{}')
    localStorage.setItem('owner', JSON.stringify({
      ...storedOwner,
      email: res.data?.email || storedOwner.email,
      profileImageUrl: res.data?.profileImageUrl || storedOwner.profileImageUrl,
    }))

    return true
  } catch {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    return false
  }
}
