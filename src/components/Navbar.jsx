import { useEffect, useState } from 'react'
import { Link } from 'react-router-dom'
import { CalendarCheck, ListStart, QrCode, Settings } from 'lucide-react'

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
      <Link to="/" className="flex items-center gap-1.5 sm:gap-2 font-bold text-gray-900 text-lg shrink-0">
        <img src="/favicon.svg" alt="" className="h-8 w-8" />
        <span className="text-[20px] leading-none sm:text-lg">PickleBook</span>
      </Link>

      <div className="flex items-center justify-end gap-1.5 sm:gap-4 min-w-0">
        {player ? (
          <>
            <Link
              to="/my-bookings"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center shrink-0"
              aria-label="My Bookings"
              title="My Bookings"
            >
              <CalendarCheck className="h-5 w-5" />
            </Link>

            <Link
              to="/scan-queue"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center shrink-0"
              aria-label="Scan Queue QR"
              title="Scan Queue QR"
            >
              <QrCode className="h-5 w-5" />
            </Link>

            <Link
              to="/queue"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center shrink-0"
              aria-label="Host Queue"
              title="Host Queue"
            >
              <ListStart className="h-5 w-5" />
            </Link>

            <Link
              to="/settings"
              className="h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center shrink-0"
              aria-label="Settings"
              title="Settings"
            >
              <Settings className="h-5 w-5" />
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
