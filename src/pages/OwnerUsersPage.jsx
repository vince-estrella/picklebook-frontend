import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Search, Phone, Calendar } from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'

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

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    // Assumption: backend exposes all of an owner's bookings at this route,
    // mirroring the existing GET /bookings/court/{id} pattern. Adjust if the
    // real endpoint differs.
    api.get('/bookings/owner')
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load bookings. The /bookings/owner endpoint may not exist yet.')
        setLoading(false)
      })
  }, [])

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
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col">

        <header className="px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-green-800 text-2xl font-bold leading-8">Users</h1>
          <div className="relative">
            <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              placeholder="Search by name or phone..."
              value={search}
              onChange={e => setSearch(e.target.value)}
              className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
            />
          </div>
        </header>

        <main className="p-12 flex flex-col gap-6">
          <div className="flex flex-col gap-1">
            <p className="text-slate-500 text-base">
              {loading ? 'Loading customers...' : `Showing ${filteredCustomers.length} of ${customers.length} customers who've booked your courts`}
            </p>
          </div>

          {error && (
            <div className="p-4 bg-amber-50 outline outline-1 outline-amber-200 rounded-lg text-amber-800 text-sm">
              {error}
            </div>
          )}

          <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-stone-300">
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Customer</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Phone</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Bookings</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Total Spent</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Last Booking</th>
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
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 font-semibold text-sm shrink-0">
                            {c.name?.charAt(0)?.toUpperCase() || '?'}
                          </div>
                          <span className="text-slate-800 text-base font-medium leading-6">{c.name || 'Unknown'}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-700 text-sm">
                        <span className="inline-flex items-center gap-1">
                          <Phone className="w-3.5 h-3.5" /> {c.phone || '—'}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="px-3 py-[2.5px] bg-green-100 rounded-full inline-block text-green-800 text-xs font-bold leading-4">
                          {c.bookingCount} booking{c.bookingCount === 1 ? '' : 's'}
                        </span>
                      </td>
                      <td className="px-6 py-4 text-slate-800 text-sm font-bold">
                        {formatCurrency(c.totalSpent)}
                      </td>
                      <td className="px-6 py-4 text-neutral-700 text-sm">
                        <span className="inline-flex items-center gap-1">
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
        </main>
      </div>
    </div>
  )
}

export default OwnerUsersPage