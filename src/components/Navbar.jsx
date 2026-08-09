import { useEffect, useState } from 'react'
import { Link, useLocation } from 'react-router-dom'
import { CalendarCheck, MessageCircle, Settings } from 'lucide-react'
import api from '../services/api'

function Navbar() {
  const location = useLocation()
  const [hasUnreadMessages, setHasUnreadMessages] = useState(false)
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

  useEffect(() => {
    if (!player || !localStorage.getItem('playerToken')) return undefined

    let cancelled = false
    const loadUnread = () => {
      api.get('/messages/conversations')
        .then((res) => {
          if (cancelled) return
          const unread = (res.data || []).some((conversation) => Number(conversation.unreadCount || 0) > 0)
          setHasUnreadMessages(unread)
        })
        .catch(() => {
          if (!cancelled) setHasUnreadMessages(false)
        })
    }

    loadUnread()
    const interval = window.setInterval(loadUnread, 45000)
    window.addEventListener('focus', loadUnread)
    return () => {
      cancelled = true
      window.clearInterval(interval)
      window.removeEventListener('focus', loadUnread)
    }
  }, [player, location.pathname])

  return (
    <nav className="flex items-center justify-between gap-3 px-4 py-3 sm:px-8 sm:py-4 bg-white border-b border-gray-100">
      <Link to="/" className="flex min-w-0 items-center gap-1.5 sm:gap-2 font-bold text-gray-900 text-lg shrink-0">
        <img src="/favicon.svg" alt="" className="h-8 w-8 shrink-0" />
        <span className="text-[20px] leading-none sm:text-lg max-[380px]:hidden">PickleBook</span>
      </Link>

      <div className="flex items-center justify-end gap-1 sm:gap-4 min-w-0">
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
              to="/messages"
              className="relative h-9 w-9 sm:h-10 sm:w-10 rounded-lg text-gray-600 hover:text-green-700 hover:bg-green-50 transition-colors flex items-center justify-center shrink-0"
              aria-label="Messages"
              title="Messages"
            >
              <MessageCircle className="h-5 w-5" />
              {hasUnreadMessages && (
                <span className="absolute right-1.5 top-1.5 h-2.5 w-2.5 rounded-full bg-red-500 ring-2 ring-white" />
              )}
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
          className="text-sm font-bold bg-green-600 text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-green-700 transition-colors whitespace-nowrap shadow-sm"
        >
          Find Courts
        </Link>
      </div>
    </nav>
  )
}

export default Navbar
