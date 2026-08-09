import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import InstallPickleBookButton from './InstallPickleBookButton'
import api from '../services/api'

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

  const handleLogout = async () => {
    try {
      await api.post('/users/logout')
    } catch {
      // Local cleanup still logs the browser out if the network is unavailable.
    }
    localStorage.removeItem('player')
    localStorage.removeItem('playerToken')
    window.location.href = '/'
  }

  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 bg-white border-b border-gray-100 flex-wrap">
      <Link to="/" className="flex items-center gap-2 font-bold text-gray-900 text-lg shrink-0">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <span>PickleBook</span>
      </Link>

      <div className="flex items-center justify-end gap-2 sm:gap-6 flex-wrap">
        <InstallPickleBookButton compact />

        {player ? (
          <>
            <Link
              to="/my-bookings"
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
            >
              My Bookings
            </Link>

            <Link
              to="/settings"
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
            >
              Settings
            </Link>

            <button
              type="button"
              onClick={handleLogout}
              className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
            >
              Log Out
            </button>
          </>
        ) : (
          <Link
            to="/login"
            className="text-sm font-medium text-gray-600 hover:text-green-600 transition-colors"
          >
            Log In
          </Link>
        )}

        <Link
          to="/courts"
          className="text-sm font-medium bg-green-600 text-white px-4 py-2 rounded-lg hover:bg-green-700 transition-colors"
        >
          Find Courts
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
