import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'

function getInitials(player) {
  const first = player?.firstName?.[0] || ''
  const last = player?.lastName?.[0] || ''
  return `${first}${last}`.toUpperCase() || '?'
}

function Navbar() {
  const [player] = useState(() => {
    const stored = localStorage.getItem('player')
    if (stored && localStorage.getItem('playerToken')) {
      try {
        return JSON.parse(stored)
      } catch {
        localStorage.removeItem('player')
        localStorage.removeItem('playerToken')
      }
    }
    return null
  })

  useEffect(() => {
    const handleStorage = () => window.location.reload()
    window.addEventListener('storage', handleStorage)
    return () => window.removeEventListener('storage', handleStorage)
  }, [])

  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 bg-white border-b border-gray-100">
      <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg shrink-0">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <span className="hidden min-[380px]:inline">PickleBook</span>
      </Link>

      <div className="flex items-center justify-end gap-3 sm:gap-6 min-w-0">
        {player ? (
          <>
            <Link
              to="/my-bookings"
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors whitespace-nowrap"
            >
              My Bookings
            </Link>

            <Link
              to="/settings"
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors whitespace-nowrap"
            >
              Settings
            </Link>

            <Link
              to="/settings"
              className="h-9 w-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center overflow-hidden font-bold text-xs shrink-0"
              aria-label="Open profile settings"
            >
              {player.profileImageUrl ? (
                <img src={player.profileImageUrl} alt="" className="h-full w-full object-cover" />
              ) : (
                getInitials(player)
              )}
            </Link>
          </>
        ) : (
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors whitespace-nowrap"
          >
            Log In
          </Link>
        )}

        <Link
          to="/courts"
          className="text-sm font-medium bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap"
        >
          Find Courts
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
