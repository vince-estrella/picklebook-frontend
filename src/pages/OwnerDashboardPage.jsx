import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  Plus,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
  Check,
  Menu,
  Users,
  MapPin,
  CalendarCheck,
} from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import api from '../services/api'

// Turns a timestamp into a short "5m ago" / "3h ago" / "2d ago" style label.
function formatRelativeTime(timestamp) {
  if (!timestamp) return ''
  const date = new Date(timestamp)
  if (Number.isNaN(date.getTime())) return ''
  const diffMs = Date.now() - date.getTime()
  const diffMin = Math.floor(diffMs / 60000)
  if (diffMin < 1) return 'Just now'
  if (diffMin < 60) return `${diffMin}m ago`
  const diffHr = Math.floor(diffMin / 60)
  if (diffHr < 24) return `${diffHr}h ago`
  const diffDay = Math.floor(diffHr / 24)
  return `${diffDay}d ago`
}

function OwnerDashboardPage() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [stats, setStats] = useState({
    usersCurrentlyBooked: 0,
    activeBookings: 0,
    monthlyRevenue: 0,
    weeklyRevenue: [],
  })
  const [loading, setLoading] = useState(true)

  const [notifications, setNotifications] = useState([])
  const [showNotifications, setShowNotifications] = useState(false)
  const [notificationsLoading, setNotificationsLoading] = useState(true)
  const [showMobileSearch, setShowMobileSearch] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const notificationsRef = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    Promise.all([
      api.get('/courts/owner'),
      api.get('/bookings/owner'),
      api.get('/bookings/stats'),
    ]).then(([courtsRes, bookingsRes, statsRes]) => {
      setCourts(courtsRes.data)
      setBookings(bookingsRes.data)
      setStats(statsRes.data)
      setLoading(false)
    }).catch(() => {
      navigate('/owner/login')
    })

    api.get('/owner/notifications')
      .then(res => setNotifications(res.data))
      .catch(() => setNotifications([]))
      .finally(() => setNotificationsLoading(false))
  }, [])

  // Close the notification dropdown when clicking anywhere outside it.
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (notificationsRef.current && !notificationsRef.current.contains(e.target)) {
        setShowNotifications(false)
      }
    }
    document.addEventListener('mousedown', handleClickOutside)
    return () => document.removeEventListener('mousedown', handleClickOutside)
  }, [])

  const unreadCount = notifications.filter(n => !n.read).length

  const markNotificationRead = (notifId) => {
    setNotifications(prev => prev.map(n => n.id === notifId ? { ...n, read: true } : n))
    api.patch(`/owner/notifications/${notifId}/read`).catch(() => {})
  }

  const markAllNotificationsRead = () => {
    setNotifications(prev => prev.map(n => ({ ...n, read: true })))
    api.post('/owner/notifications/read-all').catch(() => {})
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  const totalCourts = courts.length

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md sticky top-0 z-10">
          <div className="flex justify-between items-center gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <h1 className="text-green-800 text-xl sm:text-2xl font-bold leading-8 truncate">Admin Overview</h1>
            </div>
            <div className="flex items-center gap-2 sm:gap-4 lg:gap-8">
              {/* Search: full input on desktop, icon toggle on mobile */}
              <div className="relative hidden sm:block">
                <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  placeholder="Search resources..."
                  className="w-40 md:w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
                />
              </div>
              <button
                onClick={() => setShowMobileSearch(s => !s)}
                className="sm:hidden p-2 rounded-full transition-colors duration-150 hover:bg-gray-200"
                aria-label="Search"
              >
                <Search className="w-4 h-4 text-neutral-700" />
              </button>

              <div className="flex items-center gap-2 sm:gap-4">
                <div className="relative" ref={notificationsRef}>
                  <button
                    onClick={() => setShowNotifications(s => !s)}
                    className="relative px-2 pt-2 pb-3.5 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-gray-200"
                  >
                    <Bell className="w-4 h-5 text-neutral-700" />
                    {unreadCount > 0 && (
                      <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5" />
                    )}
                  </button>

                  {showNotifications && (
                    <div className="fixed sm:absolute left-4 right-4 sm:left-auto sm:right-0 top-16 sm:top-full mt-0 sm:mt-2 sm:w-80 bg-white rounded-xl shadow-lg outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden z-20">
                      <div className="px-4 py-3 border-b border-stone-200 flex justify-between items-center">
                        <span className="text-slate-800 text-sm font-semibold">Notifications</span>
                        {unreadCount > 0 && (
                          <button
                            onClick={markAllNotificationsRead}
                            className="flex items-center gap-1 text-green-800 text-xs font-medium transition-colors duration-150 hover:text-green-900"
                          >
                            <Check className="w-3 h-3" /> Mark all read
                          </button>
                        )}
                      </div>

                      <div className="max-h-80 overflow-y-auto">
                        {notificationsLoading ? (
                          <p className="px-4 py-6 text-center text-slate-500 text-sm">Loading...</p>
                        ) : notifications.length === 0 ? (
                          <p className="px-4 py-6 text-center text-slate-500 text-sm">You're all caught up.</p>
                        ) : (
                          notifications.map(n => (
                            <button
                              key={n.id}
                              onClick={() => markNotificationRead(n.id)}
                              className="w-full text-left px-4 py-3 border-b border-stone-100 last:border-b-0 flex items-start gap-3 transition-colors duration-150 hover:bg-gray-100"
                            >
                              <span
                                className={`w-2 h-2 rounded-full mt-1.5 shrink-0 ${n.read ? 'bg-transparent' : 'bg-green-700'}`}
                              />
                              <div className="flex-1 min-w-0">
                                <p className={`text-sm leading-5 ${n.read ? 'text-slate-500 font-normal' : 'text-slate-800 font-medium'}`}>
                                  {n.message}
                                </p>
                                <p className="text-slate-400 text-xs mt-0.5">{formatRelativeTime(n.createdAt)}</p>
                              </div>
                            </button>
                          ))
                        )}
                      </div>
                    </div>
                  )}
                </div>
                <button
                  onClick={() => navigate('/owner/courts/add')}
                  className="px-3 sm:px-6 py-2 bg-green-800 hover:bg-green-900 active:scale-95 rounded-full flex items-center gap-2 text-white text-sm sm:text-base font-normal leading-6 transition-all duration-150 whitespace-nowrap"
                >
                  <Plus className="w-4 h-4" />
                  <span className="hidden sm:inline">Add Court</span>
                </button>
              </div>
            </div>
          </div>

          {/* Mobile search field, shown below header row when toggled */}
          {showMobileSearch && (
            <div className="relative mt-3 sm:hidden">
              <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-full pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
                autoFocus
              />
            </div>
          )}
        </header>

        <main className="p-4 sm:p-6 lg:p-12 flex flex-col gap-6 lg:gap-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-green-100 rounded-lg">
                  <Users className="w-5 h-4 text-green-800" />
                </div>
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Users Booked Now</span>
                <span className="text-slate-800 text-2xl sm:text-3xl font-bold leading-10">{stats.usersCurrentlyBooked}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-neutral-200 rounded-lg">
                  <MapPin className="w-5 h-6 text-zinc-600" />
                </div>
                <span className="hidden sm:inline text-slate-500 text-base font-normal leading-6">Active Now</span>
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Total Courts</span>
                <span className="text-slate-800 text-2xl sm:text-3xl font-bold leading-10">{totalCourts}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-rose-200 rounded-lg">
                  <CalendarCheck className="w-4 h-5 text-amber-800" />
                </div>
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Active Bookings</span>
                <span className="text-slate-800 text-2xl sm:text-3xl font-bold leading-10">{stats.activeBookings}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-zinc-800 rounded-xl flex flex-col justify-between transition-shadow duration-150 hover:shadow-lg">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-green-700 rounded-lg">
                  <TrendingUp className="w-5 h-4 text-green-50" />
                </div>
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="opacity-80 text-zinc-200 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Monthly Revenue</span>
               <span className="text-white text-xl sm:text-3xl font-bold leading-10 truncate">
                  ₱{Number(stats.monthlyRevenue).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* Manage Courts table - spans 2 cols on desktop */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
              <div className="px-1 flex justify-between items-center">
                <h2 className="text-slate-800 text-xl sm:text-2xl font-semibold leading-8">Manage Courts</h2>
                <div className="flex items-center gap-2">
                  <button className="px-2 pt-2 pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center transition-colors duration-150 hover:bg-gray-200">
                    <Search className="w-4 h-3 text-zinc-900" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[640px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-stone-300">
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Court Name</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Location</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Price</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Status</th>
                        <th className="px-4 sm:px-6 py-4 text-right text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Actions</th>
                      </tr>
                    </thead>
                    <tbody>
                      {courts.length === 0 ? (
                        <tr>
                          <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm font-normal">
                            No courts yet. Click "Add Court" to get started.
                          </td>
                        </tr>
                      ) : (
                        courts.map(court => (
                          <tr key={court.id} className="border-t border-stone-200 transition-colors duration-150 hover:bg-gray-200">
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex items-center gap-3">
                                <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                  <img
                                    className="w-full h-full object-cover"
                                    src={court.imageUrl || 'https://placehold.co/40x40'}
                                    alt={court.name}
                                  />
                                </div>
                                <span className="text-slate-800 text-sm sm:text-base font-normal leading-6">
                                  {court.name}
                                </span>
                              </div>
                            </td>
                            <td className="px-4 sm:px-6 py-4 text-neutral-700 text-sm font-normal leading-5">
                              {court.address}
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="text-slate-800 text-sm font-bold leading-5">₱{court.pricePerHour}</span>
                              <span className="text-slate-800 text-sm font-semibold leading-5">/hr</span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <span className="px-3 py-[2.5px] bg-green-100 rounded-full inline-block text-green-800 text-xs font-bold leading-4">
                                {court.status || 'Available'}
                              </span>
                            </td>
                            <td className="px-4 sm:px-6 py-4">
                              <div className="flex justify-end gap-2">
                                <button
                                  onClick={() => navigate(`/owner/courts/${court.id}/edit`)}
                                  className="p-2 rounded-lg text-neutral-700 transition-colors duration-150 hover:text-slate-900 hover:bg-gray-200"
                                  title="Edit"
                                >
                                  <Pencil className="w-4 h-4" />
                                </button>
                                <button
                                  onClick={() => navigate(`/owner/courts/${court.id}/bookings`)}
                                  className="p-2 rounded-lg text-neutral-700 transition-colors duration-150 hover:text-green-800 hover:bg-green-100"
                                  title="View Bookings"
                                >
                                  <Eye className="w-4 h-4" />
                                </button>
                              </div>
                            </td>
                          </tr>
                        ))
                      )}
                    </tbody>
                  </table>
                </div>

                <div className="p-4 bg-gray-100 border-t border-stone-300 flex justify-between items-center gap-2">
                  <span className="text-slate-500 text-xs sm:text-sm font-normal leading-5">
                    Showing {courts.length} of {courts.length} courts
                  </span>
                  <div className="flex gap-2 shrink-0">
                    <button className="p-1.5 opacity-50 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center cursor-not-allowed" disabled>
                      <ChevronLeft className="w-3 h-3 text-zinc-900" />
                    </button>
                    <button className="p-1.5 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center transition-colors duration-150 hover:bg-gray-300 hover:outline-green-700">
                      <ChevronRight className="w-3 h-3 text-zinc-900" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div className="flex flex-col gap-6 lg:gap-8">

              {/* Weekly revenue - placeholder until real data is wired up */}
              <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                <span className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Weekly Revenue</span>
                <div className="h-40 sm:h-48 pt-6 sm:pt-8 flex justify-center items-end gap-1.5 sm:gap-2 overflow-x-auto">
                  {(() => {
                    const max = Math.max(1, ...stats.weeklyRevenue.map(d => d.total))
                    return stats.weeklyRevenue.map((d, i) => (
                      <div
                        key={d.date}
                        className="w-5 sm:w-7 bg-green-700 rounded-t-sm transition-opacity duration-150 hover:opacity-100 shrink-0"
                        style={{
                          height: `${Math.max(4, (d.total / max) * 160)}px`,
                          opacity: i === stats.weeklyRevenue.length - 1 ? 1 : 0.3 + (i / stats.weeklyRevenue.length) * 0.5,
                        }}
                        title={`₱${d.total} on ${d.date}`}
                      />
                    ))
                  })()}
                </div>
                <div className="px-1 flex justify-between gap-1">
                  {stats.weeklyRevenue.map(d => (
                    <span key={d.date} className="text-slate-500 text-[9px] sm:text-[10px] font-bold uppercase leading-4">
                      {d.day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live bookings */}
              <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                <span className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Live Bookings</span>
                <div className="flex flex-col gap-4">
                  {bookings.length === 0 ? (
                    <p className="text-slate-500 text-xs font-normal leading-4">No live bookings right now.</p>
                  ) : (
                    bookings.slice(0, 4).map(b => (
                      <div key={b.id} className="p-2 rounded-lg flex items-center gap-3 transition-colors duration-150 hover:bg-gray-200">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="w-2.5 h-2.5 bg-green-800 rounded-full block" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-xs font-medium leading-4 truncate">{b.bookerName}</p>
                          <p className="text-slate-500 text-xs font-normal leading-4 truncate">
                            {b.courtName} • {b.startTime?.slice(0, 5)}
                          </p>
                        </div>
                        <span className="text-green-800 text-xs font-bold leading-4 shrink-0">
                          ₱{Number(b.amount).toLocaleString(undefined, { maximumFractionDigits: 0 })}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => navigate('/owner/bookings')}
                  className="py-2 text-center text-green-800 text-base font-normal leading-6 transition-colors duration-150 hover:underline hover:text-green-900"
                >
                  View All Activity
                </button>
              </div>

              {/* System status */}
              <div className="p-4 bg-green-100 rounded-xl outline outline-1 outline-offset-[-1px] outline-green-800/20 flex flex-col gap-2">
                <div className="flex items-center gap-3">
                  <span className="relative flex w-3 h-3">
                    <span className="absolute inline-flex w-3 h-3 bg-green-800 rounded-full opacity-75 animate-ping" />
                    <span className="relative inline-flex w-3 h-3 bg-green-800 rounded-full" />
                  </span>
                  <span className="text-green-800 text-sm font-semibold leading-4 tracking-wide">System Online</span>
                </div>
                <p className="text-green-800 text-xs font-normal leading-5">
                  All payment gateways are functioning normally.
                </p>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-6 bg-zinc-800">
          <div className="px-4 sm:px-6 lg:px-12 flex flex-col sm:flex-row justify-between items-center flex-wrap gap-4 text-center sm:text-left">
            <span className="text-green-300 text-xl sm:text-2xl font-bold leading-8">PickleBook Admin</span>
            <div className="flex flex-wrap justify-center gap-4 sm:gap-6">
              <span
                onClick={() => navigate('/privacy-policy')}
                className="text-zinc-200 text-sm sm:text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white"
              >
                Privacy Policy
              </span>
              <span
                onClick={() => navigate('/terms')}
                className="text-zinc-200 text-sm sm:text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white"
              >
                Terms of Service
              </span>
              <span
                onClick={() => navigate('/contact')}
                className="text-zinc-200 text-sm sm:text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white"
              >
                Help Center
              </span>
            </div>
            <span className="text-zinc-200 text-xs sm:text-sm font-normal leading-5">© 2026 PickleBook. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default OwnerDashboardPage