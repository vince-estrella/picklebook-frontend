import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Search,
  Bell,
  ChevronLeft,
  ChevronRight,
  Eye,
  X,
  Filter,
} from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'

const STATUS_FILTERS = ['All', 'Confirmed', 'Pending', 'Cancelled', 'Completed']

const STATUS_STYLES = {
  Confirmed: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-slate-200 text-slate-700',
}

const PAGE_SIZE = 8

function BookingsListPage() {
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [statusFilter, setStatusFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [page, setPage] = useState(1)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    api
      .get('/bookings/owner')
      .then((res) => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => {
        navigate('/owner/login')
      })
  }, [])

  const handleCancelBooking = async (bookingId) => {
    if (!window.confirm('Cancel this booking? This cannot be undone.')) return
    try {
      await api.patch(`/bookings/${bookingId}/status`, JSON.stringify('Cancelled'), {
        headers: { 'Content-Type': 'application/json' },
      })
      setBookings((prev) =>
        prev.map((b) => (b.id === bookingId ? { ...b, status: 'Cancelled' } : b))
      )
    } catch (err) {
      console.error('Failed to cancel booking:', err)
      alert('Could not cancel booking. Please try again.')
    }
  }

  const filteredBookings = bookings.filter((b) => {
    const matchesStatus = statusFilter === 'All' || b.status === statusFilter
    const q = search.trim().toLowerCase()
    const matchesSearch =
      !q ||
      b.bookerName?.toLowerCase().includes(q) ||
      b.courtName?.toLowerCase().includes(q)
    return matchesStatus && matchesSearch
  })

  const totalPages = Math.max(1, Math.ceil(filteredBookings.length / PAGE_SIZE))
  const pageBookings = filteredBookings.slice((page - 1) * PAGE_SIZE, page * PAGE_SIZE)

  const goToPage = (p) => {
    if (p < 1 || p > totalPages) return
    setPage(p)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar />

      {/* Main column */}
      <div className="flex-1 flex flex-col">
        {/* Topbar */}
        <header className="px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-green-800 text-2xl font-bold leading-8">Bookings</h1>
          <div className="flex items-center gap-8">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => {
                  setSearch(e.target.value)
                  setPage(1)
                }}
                placeholder="Search by user or court..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
              />
            </div>
            <button className="relative px-2 pt-2 pb-3.5 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-gray-200">
              <Bell className="w-4 h-5 text-neutral-700" />
              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5" />
            </button>
          </div>
        </header>

        <main className="p-12 flex flex-col gap-6">
          {/* Filter bar */}
          <div className="flex justify-between items-center flex-wrap gap-4">
            <div className="flex items-center gap-2">
              <div className="p-2 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center">
                <Filter className="w-4 h-4 text-neutral-700" />
              </div>
              <div className="flex items-center gap-2 flex-wrap">
                {STATUS_FILTERS.map((status) => (
                  <button
                    key={status}
                    onClick={() => {
                      setStatusFilter(status)
                      setPage(1)
                    }}
                    className={`px-4 py-2 rounded-full text-sm font-medium leading-5 transition-colors duration-150 ${
                      statusFilter === status
                        ? 'bg-green-800 text-white'
                        : 'bg-white text-neutral-700 outline outline-1 outline-offset-[-1px] outline-stone-300 hover:bg-gray-200'
                    }`}
                  >
                    {status}
                  </button>
                ))}
              </div>
            </div>
            <span className="text-slate-500 text-sm font-normal leading-5">
              {filteredBookings.length} booking{filteredBookings.length === 1 ? '' : 's'}
            </span>
          </div>

          {/* Bookings table */}
          <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-stone-300">
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    User
                  </th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    Court
                  </th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    Date &amp; Time
                  </th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    Amount
                  </th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    Status
                  </th>
                  <th className="px-6 py-4 text-right text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">
                    Actions
                  </th>
                </tr>
              </thead>
              <tbody>
                {pageBookings.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="px-6 py-10 text-center text-slate-500 text-sm font-normal">
                      No bookings match your filters.
                    </td>
                  </tr>
                ) : (
                  pageBookings.map((b) => (
                    <tr
                      key={b.id}
                      className="border-t border-stone-200 transition-colors duration-150 hover:bg-gray-200"
                    >
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-9 h-9 rounded-full bg-green-100 flex items-center justify-center text-green-800 text-xs font-semibold shrink-0">
                            {b.bookerName?.[0] || '?'}
                          </div>
                          <span className="text-slate-800 text-sm font-medium leading-5">{b.bookerName}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-700 text-sm font-normal leading-5">
                        {b.courtName}
                      </td>
                      <td className="px-6 py-4 text-neutral-700 text-sm font-normal leading-5">
                        {new Date(b.date).toLocaleDateString('en-PH')} • {b.startTime?.slice(0, 5)}–{b.endTime?.slice(0, 5)}
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-slate-800 text-sm font-bold leading-5">₱{b.amount}</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-[2.5px] rounded-full inline-block text-xs font-bold leading-4 ${
                            STATUS_STYLES[b.status] || 'bg-gray-100 text-gray-700'
                          }`}
                        >
                          {b.status}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/owner/bookings/${b.id}`)}
                            className="p-2 rounded-lg text-neutral-700 transition-colors duration-150 hover:text-green-800 hover:bg-green-100"
                            title="View Details"
                          >
                            <Eye className="w-4 h-4" />
                          </button>
                          {b.status === 'Pending' && (
                            <button
                              onClick={() => handleCancelBooking(b.id)}
                              className="p-2 rounded-lg text-neutral-700 transition-colors duration-150 hover:text-red-600 hover:bg-red-100"
                              title="Cancel Booking"
                            >
                              <X className="w-4 h-4" />
                            </button>
                          )}
                        </div>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>

            <div className="p-4 bg-gray-100 border-t border-stone-300 flex justify-between items-center">
              <span className="text-slate-500 text-sm font-normal leading-5">
                Showing {pageBookings.length === 0 ? 0 : (page - 1) * PAGE_SIZE + 1}-
                {Math.min(page * PAGE_SIZE, filteredBookings.length)} of {filteredBookings.length} bookings
              </span>
              <div className="flex items-center gap-2">
                <button
                  onClick={() => goToPage(page - 1)}
                  disabled={page === 1}
                  className={`p-1.5 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center transition-colors duration-150 ${
                    page === 1 ? 'opacity-50 cursor-not-allowed' : 'hover:bg-gray-300 hover:outline-green-700'
                  }`}
                >
                  <ChevronLeft className="w-3 h-3 text-zinc-900" />
                </button>
                <span className="text-slate-600 text-xs font-medium leading-4 px-2">
                  Page {page} of {totalPages}
                </span>
                <button
                  onClick={() => goToPage(page + 1)}
                  disabled={page === totalPages}
                  className={`p-1.5 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center transition-colors duration-150 ${
                    page === totalPages
                      ? 'opacity-50 cursor-not-allowed'
                      : 'hover:bg-gray-300 hover:outline-green-700'
                  }`}
                >
                  <ChevronRight className="w-3 h-3 text-zinc-900" />
                </button>
              </div>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="mt-auto py-6 bg-zinc-800">
          <div className="px-12 flex justify-between items-center flex-wrap gap-4">
            <span className="text-green-300 text-2xl font-bold leading-8">PickleBook Admin</span>
            <div className="flex gap-6">
              <span className="text-zinc-200 text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white">
                Privacy Policy
              </span>
              <span className="text-zinc-200 text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white">
                Terms of Service
              </span>
              <span className="text-zinc-200 text-base font-normal leading-6 cursor-pointer transition-colors duration-150 hover:text-white">
                Help Center
              </span>
            </div>
            <span className="text-zinc-200 text-sm font-normal leading-5">© 2026 PickleBook. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default BookingsListPage