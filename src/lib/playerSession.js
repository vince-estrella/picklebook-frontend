import api from '../services/api'

export function clearPlayerSession() {
  localStorage.removeItem('playerToken')
  localStorage.removeItem('player')
}

export function hasPlayerSessionMarker() {
  return Boolean(localStorage.getItem('playerToken'))
}

export async function ensurePlayerSession() {
  const marker = localStorage.getItem('playerToken')
  if (marker && marker !== 'cookie') return true

  try {
    const res = await api.get('/users/profile')
    localStorage.setItem('playerToken', 'cookie')

    const storedPlayer = JSON.parse(localStorage.getItem('player') || '{}')
    localStorage.setItem('player', JSON.stringify({
      ...storedPlayer,
      email: res.data?.email || storedPlayer.email,
      profileImageUrl: res.data?.profileImageUrl || storedPlayer.profileImageUrl,
    }))

    return true
  } catch {
    clearPlayerSession()
    return false
  }
}
