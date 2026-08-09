import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { ArrowLeft, CalendarDays, Clock, Menu, Search, UserCheck } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import OwnerLoadError from '../components/OwnerLoadError'
import api from '../services/api'

function getLocalDateString(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime12h(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

function statusClass(status) {
  const normalized = String(status || '').toLowerCase()
  if (normalized.includes('cancel')) return 'bg-red-50 text-red-700 border-red-100'
  if (normalized.includes('pending')) return 'bg-amber-50 text-amber-700 border-amber-100'
  if (normalized.includes('confirm')) return 'bg-green-50 text-green-700 border-green-100'
  return 'bg-slate-100 text-slate-700 border-slate-200'
}

function OwnerBookingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [selectedDate, setSelectedDate] = useState(getLocalDateString())
  const [query, setQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('All')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    api.get(`/bookings/court/${id}?date=${selectedDate}`)
      .then(res => {
        setLoadError('')
        setBookings(Array.isArray(res.data) ? res.data : [])
        setLoading(false)
      })
      .catch(() => {
        setLoadError('Could not load this court schedule.')
        setLoading(false)
      })
  }, [id, selectedDate, retryKey])

  const statuses = useMemo(() => {
    const unique = new Set(bookings.map((booking) => booking.status).filter(Boolean))
    return ['All', ...unique]
  }, [bookings])

  const filteredBookings = bookings.filter((booking) => {
    const text = query.trim().toLowerCase()
    const matchesQuery = !text || [
      booking.bookingReference,
      booking.bookerName,
      booking.bookerPhone,
      booking.status,
    ].some((value) => String(value || '').toLowerCase().includes(text))
    const matchesStatus = statusFilter === 'All' || booking.status === statusFilter
    return matchesQuery && matchesStatus
  })

  const confirmedCount = bookings.filter((booking) => String(booking.status || '').toLowerCase().includes('confirm')).length
  const pendingCount = bookings.filter((booking) => String(booking.status || '').toLowerCase().includes('pending')).length

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="owner-kicker mb-1">Court Schedule</p>
                <h1 className="owner-title text-xl sm:text-2xl leading-8 truncate">Booking Management</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/owner/courts')}
              className="owner-secondary-btn px-3 py-2 text-sm flex items-center gap-2"
            >
              <ArrowLeft className="w-4 h-4" />
              Courts
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 flex flex-col gap-6">
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <CalendarDays className="w-4 h-4" />
                Total
              </p>
              <p className="text-2xl font-bold text-slate-900">{bookings.length}</p>
            </div>
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <UserCheck className="w-4 h-4" />
                Confirmed
              </p>
              <p className="text-2xl font-bold text-[var(--pb-teal)]">{confirmedCount}</p>
            </div>
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500 flex items-center gap-1.5">
                <Clock className="w-4 h-4" />
                Pending
              </p>
              <p className="text-2xl font-bold text-amber-700">{pendingCount}</p>
            </div>
          </div>

          <section className="owner-panel p-4 flex flex-col lg:flex-row gap-3 lg:items-center lg:justify-between">
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3 flex-1">
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                Date
                <input
                  type="date"
                  value={selectedDate}
                  onChange={(event) => setSelectedDate(event.target.value)}
                  className="owner-field px-3 py-2 text-sm normal-case font-normal"
                />
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                Status
                <select
                  value={statusFilter}
                  onChange={(event) => setStatusFilter(event.target.value)}
                  className="owner-field px-3 py-2 text-sm normal-case font-normal"
                >
                  {statuses.map((status) => <option key={status}>{status}</option>)}
                </select>
              </label>
              <label className="flex flex-col gap-1 text-xs font-bold uppercase text-slate-500">
                Search
                <div className="relative">
                  <Search className="w-4 h-4 text-slate-400 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={query}
                    onChange={(event) => setQuery(event.target.value)}
                    placeholder="Name, phone, reference"
                    className="owner-field pl-9 pr-3 py-2 text-sm normal-case font-normal"
                  />
                </div>
              </label>
            </div>
            <p className="text-sm text-slate-500">
              Showing {filteredBookings.length} of {bookings.length}
            </p>
          </section>

          {loadError ? (
            <OwnerLoadError
              title="Schedule did not load"
              message={loadError}
              onRetry={() => {
                setLoadError('')
                setLoading(true)
                setRetryKey((key) => key + 1)
              }}
            />
          ) : <div className="owner-panel overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[760px]">
                <thead>
                  <tr className="bg-[#f8faf6] border-b border-stone-200">
                    {['Reference', 'Date', 'Time', 'Booker', 'Phone', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-bold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
                  ) : filteredBookings.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No bookings match this view.</td></tr>
                  ) : (
                    filteredBookings.map(booking => (
                      <tr key={booking.id} className="border-t border-stone-100 hover:bg-slate-50">
                        <td className="px-4 py-4 font-bold text-sm text-[var(--pb-teal)]">{booking.bookingReference}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{new Date(booking.date).toLocaleDateString('en-PH', { timeZone: 'Asia/Manila' })}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}</td>
                        <td className="px-4 py-4 text-sm font-semibold text-slate-900">{booking.bookerName || '-'}</td>
                        <td className="px-4 py-4 text-sm text-slate-700">{booking.bookerPhone || '-'}</td>
                        <td className="px-4 py-4">
                          <span className={`border text-xs font-bold px-2.5 py-1 rounded-full ${statusClass(booking.status)}`}>
                            {booking.status || 'Unknown'}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>}
        </main>
      </div>
    </div>
  )
}

export default OwnerBookingsPage
