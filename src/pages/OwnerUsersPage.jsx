import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone, Calendar, Menu } from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'
import OwnerLoadError from '../components/OwnerLoadError'
import { ensureOwnerSession } from '../lib/ownerSession'

function formatCurrency(n) {
  return `₱${Number(n || 0).toFixed(2)}`
}

// Groups raw bookings (which only store a name + phone, not a real account)
// into one row per unique customer, keyed by phone number.
function deriveCustomers(bookings) {
  const byPhone = new Map()

  for (const b of bookings) {
    const key = b.bookerPhone || b.bookerName
    if (!byPhone.has(key)) {
      byPhone.set(key, {
        phone: b.bookerPhone,
        name: b.bookerName,
        bookingCount: 0,
        totalSpent: 0,
        lastBookingDate: b.date,
        lastCourtName: b.courtName || b.court?.name,
      })
    }
    const entry = byPhone.get(key)
    entry.bookingCount += 1
    entry.totalSpent += Number(b.totalPrice ?? b.amount ?? 0)
    if (!entry.lastBookingDate || b.date > entry.lastBookingDate) {
      entry.lastBookingDate = b.date
      entry.lastCourtName = b.courtName || b.court?.name
    }
  }

  return Array.from(byPhone.values()).sort((a, b) => b.bookingCount - a.bookingCount)
}

function OwnerUsersPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [search, setSearch] = useState('')
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadUsers() {
      const valid = await ensureOwnerSession()
      if (cancelled) return
      if (!valid) {
        navigate('/owner/login')
        return
      }

      try {
        setError(null)
        const res = await api.get('/bookings/owner')
        if (!cancelled) setBookings(res.data)
      } catch (err) {
        if (cancelled) return
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/owner/login')
          return
        }
        setError('Could not load bookings. Please try again.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadUsers()
    return () => { cancelled = true }
  }, [navigate, retryKey])

  const customers = useMemo(() => deriveCustomers(bookings), [bookings])

  const filteredCustomers = useMemo(() => {
    const text = search.toLowerCase()
    if (!text) return customers
    return customers.filter(c =>
      c.name?.toLowerCase().includes(text) ||
      c.phone?.toLowerCase().includes(text)
    )
  }, [customers, search])

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
      <div className="flex-1 flex flex-col min-w-0">

        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 backdrop-blur-md flex justify-between items-center sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="owner-title text-xl sm:text-2xl leading-8 truncate">Users</h1>
          </div>
          <div className="relative hidden sm:block">
            <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="owner-field w-48 md:w-64 pl-10 pr-4 py-2 text-sm font-normal placeholder:text-gray-500"
            />
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 flex flex-col gap-6">
          {/* Mobile search */}
          <div className="relative sm:hidden">
            <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="owner-field w-full pl-10 pr-4 py-2 text-sm font-normal placeholder:text-gray-500"
            />
          </div>

          <div className="flex flex-col gap-1">
            <p className="text-slate-500 text-sm sm:text-base">
              {loading ? 'Loading customers...' : `Showing ${filteredCustomers.length} of ${customers.length} customers who've booked your courts`}
            </p>
          </div>

          {error && (
            <OwnerLoadError
              title="Customers did not load"
              message={error}
              onRetry={() => {
                setLoading(true)
                setRetryKey((key) => key + 1)
              }}
            />
          )}

          {!error && <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-100 border-b border-stone-300">
                    <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Customer</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Phone</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Bookings</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Total Spent</th>
                    <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Last Booking</th>
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">Loading...</td>
                    </tr>
                  ) : filteredCustomers.length === 0 ? (
                    <tr>
                      <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm">
                        {customers.length === 0 ? 'No bookings yet — customers will show up here once they book a court.' : 'No customers match your search.'}
                      </td>
                    </tr>
                  ) : (
                    filteredCustomers.map(c => (
                      <tr key={c.phone || c.name} className="border-t border-stone-200 transition-colors duration-150 hover:bg-gray-200">
                        <td className="px-4 sm:px-6 py-4">
                          <div className="flex items-center gap-3">
                            <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm shrink-0">
                              {c.name?.charAt(0)?.toUpperCase() || '?'}
                            </div>
                            <span className="text-slate-800 text-sm sm:text-base font-medium leading-6">{c.name || 'Unknown'}</span>
                          </div>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-neutral-700 text-sm">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Phone className="w-3.5 h-3.5" /> {c.phone || '—'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4">
                          <span className="px-3 py-[2.5px] bg-green-100 rounded-full inline-block text-green-800 text-xs font-bold leading-4 whitespace-nowrap">
                            {c.bookingCount} booking{c.bookingCount === 1 ? '' : 's'}
                          </span>
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-slate-800 text-sm font-bold whitespace-nowrap">
                          {formatCurrency(c.totalSpent)}
                        </td>
                        <td className="px-4 sm:px-6 py-4 text-neutral-700 text-sm">
                          <span className="inline-flex items-center gap-1 whitespace-nowrap">
                            <Calendar className="w-3.5 h-3.5" /> {c.lastBookingDate || '—'}
                            {c.lastCourtName && <span className="text-neutral-400">· {c.lastCourtName}</span>}
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

export default OwnerUsersPage
