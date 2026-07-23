import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import { Menu } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import api from '../services/api'

function OwnerBookingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get(`/bookings/court/${id}?date=${today}`)
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <button
              onClick={() => navigate('/owner/dashboard')}
              className="text-green-800 text-sm bg-transparent border-none cursor-pointer"
            >
              ← Back to Dashboard
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12">
          <h1 className="text-xl sm:text-2xl font-bold mb-1">Booking Management</h1>
          <p className="text-slate-500 text-sm mb-6">Today's bookings for this court.</p>

          <div className="bg-white border border-stone-200 rounded-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full border-collapse min-w-[640px]">
                <thead>
                  <tr className="bg-gray-50">
                    {['Booking ID', 'Date', 'Time', 'Booker Name', 'Phone', 'Status'].map(h => (
                      <th key={h} className="px-4 py-3 text-left text-xs font-semibold text-slate-500 uppercase tracking-wide">
                        {h}
                      </th>
                    ))}
                  </tr>
                </thead>
                <tbody>
                  {loading ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">Loading...</td></tr>
                  ) : bookings.length === 0 ? (
                    <tr><td colSpan={6} className="p-8 text-center text-slate-400">No bookings for today.</td></tr>
                  ) : (
                    bookings.map(b => (
                      <tr key={b.id} className="border-t border-stone-100">
                        <td className="px-4 py-3.5 font-semibold text-sm text-green-700">{b.bookingReference}</td>
                        <td className="px-4 py-3.5 text-sm">{new Date(b.date).toLocaleDateString('en-PH')}</td>
                        <td className="px-4 py-3.5 text-sm">{b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}</td>
                        <td className="px-4 py-3.5 text-sm">{b.bookerName}</td>
                        <td className="px-4 py-3.5 text-sm">{b.bookerPhone}</td>
                        <td className="px-4 py-3.5">
                          <span className="bg-green-100 text-green-700 text-xs font-semibold px-2.5 py-1 rounded-full">
                            {b.status}
                          </span>
                        </td>
                      </tr>
                    ))
                  )}
                </tbody>
              </table>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default OwnerBookingsPage