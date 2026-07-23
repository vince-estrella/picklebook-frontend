import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  TrendingUp,
  Receipt,
  CalendarCheck,
  Trophy,
  Download,
} from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'
import ChatHeadWidget from '../components/ChatHeadWidget'

const RANGE_OPTIONS = [
  { value: 'all', label: 'All time' },
  { value: '30d', label: 'Last 30 days' },
  { value: '7d', label: 'Last 7 days' },
  { value: 'month', label: 'This month' },
]

function formatCurrency(n) {
  return `₱${Number(n || 0).toLocaleString(undefined, { maximumFractionDigits: 0 })}`
}

// Bookings can come back with either a `date` or a `startDate` field
// depending on the endpoint version — this reads whichever is present.
function getBookingDate(b) {
  const raw = b.date || b.startDate || b.createdAt
  return raw ? new Date(raw) : null
}

function isWithinRange(bookingDate, range) {
  if (!bookingDate || range === 'all') return true
  const now = new Date()
  if (range === 'month') {
    return bookingDate.getFullYear() === now.getFullYear() && bookingDate.getMonth() === now.getMonth()
  }
  const days = range === '7d' ? 7 : 30
  const cutoff = new Date(now)
  cutoff.setDate(cutoff.getDate() - days)
  return bookingDate >= cutoff
}

function OwnerReportsPage() {
  const navigate = useNavigate()
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [range, setRange] = useState('30d')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    Promise.all([
      api.get('/courts/owner'),
      api.get('/bookings/owner'),
    ]).then(([courtsRes, bookingsRes]) => {
      setCourts(courtsRes.data)
      setBookings(bookingsRes.data)
      setLoading(false)
    }).catch(() => {
      navigate('/owner/login')
    })
  }, [])

  const filteredBookings = useMemo(
    () => bookings.filter(b => isWithinRange(getBookingDate(b), range)),
    [bookings, range]
  )

  const revenueByCourt = useMemo(() => {
    const map = new Map()
    // Seed every court so ones with zero bookings still show a row.
    courts.forEach(c => map.set(c.name, { name: c.name, address: c.address, bookingsCount: 0, revenue: 0 }))
    filteredBookings.forEach(b => {
      const key = b.courtName || 'Unknown court'
      const entry = map.get(key) || { name: key, address: '', bookingsCount: 0, revenue: 0 }
      entry.bookingsCount += 1
      entry.revenue += Number(b.amount || 0)
      map.set(key, entry)
    })
    return Array.from(map.values()).sort((a, b) => b.revenue - a.revenue)
  }, [courts, filteredBookings])

  const totalRevenue = filteredBookings.reduce((sum, b) => sum + Number(b.amount || 0), 0)
  const totalBookings = filteredBookings.length
  const avgBookingValue = totalBookings > 0 ? totalRevenue / totalBookings : 0
  const topCourt = revenueByCourt.find(c => c.revenue > 0) || null
  const maxCourtRevenue = Math.max(1, ...revenueByCourt.map(c => c.revenue))

  const handleExportCsv = () => {
    const header = ['Court', 'Bookings', 'Revenue']
    const rows = revenueByCourt.map(c => [c.name, c.bookingsCount, c.revenue.toFixed(2)])
    const csv = [header, ...rows].map(r => r.join(',')).join('\n')
    const blob = new Blob([csv], { type: 'text/csv' })
    const url = URL.createObjectURL(blob)
    const a = document.createElement('a')
    a.href = url
    a.download = `picklebook-revenue-${range}.csv`
    a.click()
    URL.revokeObjectURL(url)
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex flex-col lg:flex-row">
      <OwnerSidebar />

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md sticky top-0 z-10">
          <div className="flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3">
            <h1 className="text-green-800 text-xl sm:text-2xl font-bold leading-8">Revenue Reports</h1>
            <div className="flex items-center gap-2 sm:gap-3">
              <select
                value={range}
                onChange={e => setRange(e.target.value)}
                className="flex-1 sm:flex-none px-3 sm:px-4 py-2 bg-gray-100 rounded-full text-xs sm:text-sm font-medium text-slate-800 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
              >
                {RANGE_OPTIONS.map(o => (
                  <option key={o.value} value={o.value}>{o.label}</option>
                ))}
              </select>
              <button
                onClick={handleExportCsv}
                className="px-3 sm:px-5 py-2 bg-green-800 hover:bg-green-900 active:scale-95 rounded-full flex items-center gap-2 text-white text-xs sm:text-sm font-medium transition-all duration-150 whitespace-nowrap"
              >
                <Download className="w-4 h-4" />
                <span className="hidden xs:inline sm:inline">Export CSV</span>
              </button>
            </div>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 flex flex-col gap-6 lg:gap-8">

          {/* Stat cards */}
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3 sm:gap-4">
            <div className="p-4 sm:p-6 bg-zinc-800 rounded-xl flex flex-col justify-between transition-shadow duration-150 hover:shadow-lg">
              <div className="px-2 pt-2 pb-3.5 bg-green-700 rounded-lg w-fit">
                <TrendingUp className="w-5 h-4 text-green-50" />
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="opacity-80 text-zinc-200 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Total Revenue</span>
                <span className="text-white text-xl sm:text-3xl font-bold leading-10 truncate">{formatCurrency(totalRevenue)}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="px-2 pt-2 pb-3.5 bg-rose-200 rounded-lg w-fit">
                <CalendarCheck className="w-4 h-5 text-amber-800" />
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Total Bookings</span>
                <span className="text-slate-800 text-2xl sm:text-3xl font-bold leading-10">{totalBookings}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="px-2 pt-2 pb-3.5 bg-green-100 rounded-lg w-fit">
                <Receipt className="w-5 h-4 text-green-800" />
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Avg. Booking Value</span>
                <span className="text-slate-800 text-xl sm:text-3xl font-bold leading-10 truncate">{formatCurrency(avgBookingValue)}</span>
              </div>
            </div>

            <div className="p-4 sm:p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between transition-shadow duration-150 hover:shadow-md">
              <div className="px-2 pt-2 pb-3.5 bg-neutral-200 rounded-lg w-fit">
                <Trophy className="w-5 h-4 text-zinc-600" />
              </div>
              <div className="pt-4 sm:pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-[10px] sm:text-xs font-medium uppercase leading-4 tracking-wide">Top Performing Court</span>
                <span className="text-slate-800 text-base sm:text-xl font-bold leading-8 truncate">
                  {topCourt ? topCourt.name : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8 items-start">

            {/* Revenue by court table */}
            <div className="lg:col-span-2 flex flex-col gap-4 min-w-0">
              <div className="px-1 flex justify-between items-center">
                <h2 className="text-slate-800 text-xl sm:text-2xl font-semibold leading-8">Revenue by Court</h2>
              </div>

              <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full border-collapse min-w-[560px]">
                    <thead>
                      <tr className="bg-gray-100 border-b border-stone-300">
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Court</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Bookings</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Revenue</th>
                        <th className="px-4 sm:px-6 py-4 text-left text-slate-500 text-xs sm:text-sm font-semibold uppercase leading-4 tracking-wide">Share</th>
                      </tr>
                    </thead>
                    <tbody>
                      {revenueByCourt.length === 0 ? (
                        <tr>
                          <td colSpan={4} className="px-6 py-10 text-center text-slate-500 text-sm font-normal">
                            No courts yet.
                          </td>
                        </tr>
                      ) : (
                        revenueByCourt.map(c => {
                          const share = totalRevenue > 0 ? (c.revenue / totalRevenue) * 100 : 0
                          return (
                            <tr key={c.name} className="border-t border-stone-200 transition-colors duration-150 hover:bg-gray-200">
                              <td className="px-4 sm:px-6 py-4">
                                <p className="text-slate-800 text-sm sm:text-base font-normal leading-6">{c.name}</p>
                                {c.address && <p className="text-slate-500 text-xs font-normal leading-4">{c.address}</p>}
                              </td>
                              <td className="px-4 sm:px-6 py-4 text-neutral-700 text-sm font-normal leading-5">
                                {c.bookingsCount}
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <span className="text-slate-800 text-sm font-bold leading-5">{formatCurrency(c.revenue)}</span>
                              </td>
                              <td className="px-4 sm:px-6 py-4">
                                <div className="flex items-center gap-2 w-24 sm:w-32">
                                  <div className="flex-1 h-1.5 bg-stone-200 rounded-full overflow-hidden">
                                    <div className="h-full bg-green-700 rounded-full" style={{ width: `${share}%` }} />
                                  </div>
                                  <span className="text-slate-500 text-xs font-medium leading-4 w-9 text-right">{share.toFixed(0)}%</span>
                                </div>
                              </td>
                            </tr>
                          )
                        })
                      )}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>

            {/* Right rail: revenue bar chart per court */}
            <div className="flex flex-col gap-6 lg:gap-8">
              <div className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                <span className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Revenue Breakdown</span>
                {revenueByCourt.filter(c => c.revenue > 0).length === 0 ? (
                  <p className="text-slate-500 text-xs font-normal leading-4">No revenue in this period yet.</p>
                ) : (
                  <div className="flex flex-col gap-3">
                    {revenueByCourt.slice(0, 6).map(c => (
                      <div key={c.name} className="flex flex-col gap-1">
                        <div className="flex justify-between items-baseline gap-2">
                          <span className="text-slate-800 text-xs font-medium leading-4 truncate">{c.name}</span>
                          <span className="text-slate-500 text-xs font-normal leading-4 shrink-0">{formatCurrency(c.revenue)}</span>
                        </div>
                        <div className="h-2 bg-stone-200 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-green-700 rounded-full transition-all duration-300"
                            style={{ width: `${(c.revenue / maxCourtRevenue) * 100}%` }}
                          />
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>

              <div className="p-4 bg-green-100 rounded-xl outline outline-1 outline-offset-[-1px] outline-green-800/20 flex flex-col gap-2">
                <span className="text-green-800 text-sm font-semibold leading-4 tracking-wide">About these numbers</span>
                <p className="text-green-800 text-xs font-normal leading-5">
                  Revenue is calculated from booking records for the selected date range. Cancelled or refunded
                  bookings are only excluded if your booking records mark them as such.
                </p>
              </div>
            </div>
          </div>
        </main>
      </div>

      <ChatHeadWidget />
    </div>
  )
}

export default OwnerReportsPage