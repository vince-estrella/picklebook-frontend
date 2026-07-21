import axios from 'axios'

const api = axios.create({
  baseURL: import.meta.env.VITE_API_URL || 'https://picklebook-api-production.up.railway.app/api',
})

// Owner and Player accounts are separate token types, stored under separate
// localStorage keys. Requests to owner-only routes (anything containing
// "owner" or hitting courtowners auth) send the owner token; everything else
// (player auth, "my bookings", and the shared guest/player booking endpoint)
// prefers the player token, falling back to the owner token if no player
// session exists. The backend enforces roles independently via [Authorize(Roles=...)],
// so sending the "wrong" token to a route that doesn't need one is harmless.
api.interceptors.request.use((config) => {
  const isOwnerRoute = config.url?.includes('owner') || config.url?.includes('courtowners')
  const ownerToken = localStorage.getItem('token')
  const playerToken = localStorage.getItem('playerToken')

  if (isOwnerRoute) {
    if (ownerToken) config.headers.Authorization = `Bearer ${ownerToken}`
  } else if (playerToken) {
    config.headers.Authorization = `Bearer ${playerToken}`
  } else if (ownerToken) {
    config.headers.Authorization = `Bearer ${ownerToken}`
  }

  return config
})

api.interceptors.request.use(config => {
  if (config.method === 'get') {
    config.params = { ...config.params, _t: Date.now() }
  }
  return config
})

export default api