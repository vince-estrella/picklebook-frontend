import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  CreditCard,
  FileText,
  LifeBuoy,
  Settings,
  Search,
  Bell,
  Plus,
  Pencil,
  Eye,
  ChevronLeft,
  ChevronRight,
  TrendingUp,
} from 'lucide-react'
import api from '../services/api'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courts', path: '/owner/courts', icon: MapPin },
  { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
  { label: 'Users', path: '/owner/users', icon: Users },
  { label: 'Payments', path: '/owner/payments', icon: CreditCard },
  { label: 'Reports', path: '/owner/reports', icon: FileText },
]

const WEEKDAYS = ['MON', 'TUE', 'WED', 'THU', 'FRI', 'SAT', 'SUN']

function OwnerDashboardPage() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    Promise.all([
      api.get('/courts'),
      // fetch bookings for all courts - we'll get today's for now
    ]).then(([courtsRes]) => {
      setCourts(courtsRes.data)
      setLoading(false)
    }).catch(() => {
      navigate('/owner/login')
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  const totalCourts = courts.length
  const activeBookings = bookings.length
  // Revenue isn't wired up to a real endpoint yet - shown as a dash until that data exists.
  const monthlyRevenue = null
  const currentPath = window.location.pathname

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">

      {/* Sidebar */}
      <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-gray-100 border-r border-stone-300 flex flex-col p-4">
        <div className="px-2 py-4">
          <span className="text-green-800 text-2xl font-bold leading-8">PickleBook</span>
        </div>

        <nav className="flex-1 pt-2 flex flex-col gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors ${
                  active ? 'bg-green-700 text-green-50' : 'text-neutral-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="pt-2">
          <div className="pt-8 border-t border-stone-300 flex flex-col gap-1">
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-neutral-700 hover:bg-gray-200 text-left">
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-neutral-700 hover:bg-gray-200 text-left">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <div className="p-4 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 outline outline-2 outline-offset-[-2px] outline-green-300 flex items-center justify-center text-green-800 font-semibold shrink-0">
                {(owner.firstName?.[0] || 'O')}{(owner.lastName?.[0] || '')}
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold leading-4 tracking-wide truncate">
                  {owner.firstName} {owner.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 text-xs font-medium leading-4 hover:text-slate-700"
                >
                  Log out
                </button>
              </div>
            </div>
          </div>
        </div>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col">

        {/* Topbar */}
        <header className="px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <h1 className="text-green-800 text-2xl font-bold leading-8">Admin Overview</h1>
          <div className="flex items-center gap-8">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                placeholder="Search resources..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none focus:ring-2 focus:ring-green-700/30"
              />
            </div>
            <div className="flex items-center gap-4">
              <button className="relative px-2 pt-2 pb-3.5 flex items-center justify-center">
                <Bell className="w-4 h-5 text-neutral-700" />
                <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5" />
              </button>
              <button
                onClick={() => navigate('/owner/courts/add')}
                className="px-6 py-2 bg-green-800 hover:bg-green-900 rounded-full flex items-center gap-2 text-white text-base font-normal leading-6 transition-colors"
              >
                <Plus className="w-4 h-4" />
                Add Court
              </button>
            </div>
          </div>
        </header>

        <main className="p-12 flex flex-col gap-8">

          {/* Stat cards */}
          <div className="grid grid-cols-4 gap-4">
            <div className="p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-green-100 rounded-lg">
                  <Users className="w-5 h-4 text-green-800" />
                </div>
              </div>
              <div className="pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-medium uppercase leading-4 tracking-wide">Total Users</span>
                <span className="text-slate-800 text-3xl font-bold leading-10">—</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-neutral-200 rounded-lg">
                  <MapPin className="w-5 h-6 text-zinc-600" />
                </div>
                <span className="text-slate-500 text-base font-normal leading-6">Active Now</span>
              </div>
              <div className="pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-medium uppercase leading-4 tracking-wide">Total Courts</span>
                <span className="text-slate-800 text-3xl font-bold leading-10">{totalCourts}</span>
              </div>
            </div>

            <div className="p-6 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-rose-200 rounded-lg">
                  <CalendarCheck className="w-4 h-5 text-amber-800" />
                </div>
              </div>
              <div className="pt-8 flex flex-col gap-1">
                <span className="text-slate-500 text-xs font-medium uppercase leading-4 tracking-wide">Active Bookings</span>
                <span className="text-slate-800 text-3xl font-bold leading-10">{activeBookings}</span>
              </div>
            </div>

            <div className="p-6 bg-zinc-800 rounded-xl flex flex-col justify-between">
              <div className="flex justify-between items-start">
                <div className="px-2 pt-2 pb-3.5 bg-green-700 rounded-lg">
                  <TrendingUp className="w-5 h-4 text-green-50" />
                </div>
              </div>
              <div className="pt-8 flex flex-col gap-1">
                <span className="opacity-80 text-zinc-200 text-xs font-medium uppercase leading-4 tracking-wide">Monthly Revenue</span>
                <span className="text-white text-3xl font-bold leading-10">
                  {monthlyRevenue !== null ? `₱${monthlyRevenue}` : '—'}
                </span>
              </div>
            </div>
          </div>

          <div className="grid grid-cols-3 gap-8 items-start">

            {/* Manage Courts table - spans 2 cols */}
            <div className="col-span-2 flex flex-col gap-4">
              <div className="px-1 flex justify-between items-center">
                <h2 className="text-slate-800 text-2xl font-semibold leading-8">Manage Courts</h2>
                <div className="flex items-center gap-2">
                  <button className="px-2 pt-2 pb-3.5 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center hover:bg-gray-50">
                    <Search className="w-4 h-3 text-zinc-900" />
                  </button>
                </div>
              </div>

              <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
                <table className="w-full border-collapse">
                  <thead>
                    <tr className="bg-gray-100 border-b border-stone-300">
                      <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Court Name</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Location</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Price</th>
                      <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Status</th>
                      <th className="px-6 py-4 text-right text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Actions</th>
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
                        <tr key={court.id} className="border-t border-stone-200">
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-3">
                              <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                                <img
                                  className="w-full h-full object-cover"
                                  src={court.imageUrl || 'https://placehold.co/40x40'}
                                  alt={court.name}
                                />
                              </div>
                              <span className="text-slate-800 text-base font-normal leading-6">
                                {court.name}
                              </span>
                            </div>
                          </td>
                          <td className="px-6 py-4 text-neutral-700 text-sm font-normal leading-5">
                            {court.address}
                          </td>
                          <td className="px-6 py-4">
                            <span className="text-slate-800 text-sm font-bold leading-5">₱{court.pricePerHour}</span>
                            <span className="text-slate-800 text-sm font-semibold leading-5">/hr</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-3 py-[2.5px] bg-green-100 rounded-full inline-block text-green-800 text-xs font-bold leading-4">
                              {court.status || 'Available'}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex justify-end gap-2">
                              <button
                                onClick={() => navigate(`/owner/courts/${court.id}/edit`)}
                                className="p-2 text-neutral-700 hover:text-slate-900"
                                title="Edit"
                              >
                                <Pencil className="w-4 h-4" />
                              </button>
                              <button
                                onClick={() => navigate(`/owner/courts/${court.id}/bookings`)}
                                className="p-2 text-neutral-700 hover:text-green-800"
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

                <div className="p-4 bg-gray-100 border-t border-stone-300 flex justify-between items-center">
                  <span className="text-slate-500 text-sm font-normal leading-5">
                    Showing {courts.length} of {courts.length} courts
                  </span>
                  <div className="flex gap-2">
                    <button className="p-1.5 opacity-50 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center" disabled>
                      <ChevronLeft className="w-3 h-3 text-zinc-900" />
                    </button>
                    <button className="p-1.5 rounded-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex items-center justify-center hover:bg-white">
                      <ChevronRight className="w-3 h-3 text-zinc-900" />
                    </button>
                  </div>
                </div>
              </div>
            </div>

            {/* Right rail */}
            <div className="flex flex-col gap-8">

              {/* Weekly revenue - placeholder until real data is wired up */}
              <div className="p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                <span className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Weekly Revenue</span>
                <div className="h-48 pt-8 flex justify-center items-end gap-2">
                  {[16, 24, 20, 32, 28, 36, 12].map((h, i) => (
                    <div
                      key={i}
                      className="w-7 bg-green-700 rounded-t-sm"
                      style={{ height: `${h * 4}px`, opacity: i === 4 ? 1 : 0.2 + i * 0.12 }}
                    />
                  ))}
                </div>
                <div className="px-1 flex justify-between">
                  {WEEKDAYS.map(day => (
                    <span key={day} className="text-slate-500 text-[10px] font-bold uppercase leading-4">
                      {day}
                    </span>
                  ))}
                </div>
              </div>

              {/* Live bookings */}
              <div className="p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
                <span className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Live Bookings</span>
                <div className="flex flex-col gap-4">
                  {bookings.length === 0 ? (
                    <p className="text-slate-500 text-xs font-normal leading-4">No live bookings right now.</p>
                  ) : (
                    bookings.slice(0, 4).map(b => (
                      <div key={b.id} className="p-2 rounded-lg flex items-center gap-3">
                        <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center shrink-0">
                          <span className="w-2.5 h-2.5 bg-green-800 rounded-full block" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-slate-800 text-xs font-medium leading-4 truncate">{b.userName}</p>
                          <p className="text-slate-500 text-xs font-normal leading-4 truncate">
                            {b.courtName} • {b.time}
                          </p>
                        </div>
                        <span className="text-green-800 text-xs font-bold leading-4 shrink-0">
                          ₱{b.amount}
                        </span>
                      </div>
                    ))
                  )}
                </div>
                <button
                  onClick={() => navigate('/owner/bookings')}
                  className="py-2 text-center text-green-800 text-base font-normal leading-6 hover:underline"
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
          <div className="px-12 flex justify-between items-center flex-wrap gap-4">
            <span className="text-green-300 text-2xl font-bold leading-8">PickleBook Admin</span>
            <div className="flex gap-6">
              <span className="text-zinc-200 text-base font-normal leading-6">Privacy Policy</span>
              <span className="text-zinc-200 text-base font-normal leading-6">Terms of Service</span>
              <span className="text-zinc-200 text-base font-normal leading-6">Help Center</span>
            </div>
            <span className="text-zinc-200 text-sm font-normal leading-5">© 2026 PickleBook. All rights reserved.</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default OwnerDashboardPage
