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
  Plus,
  Pencil,
  Eye,
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

function OwnerCourtsPage() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')
  const [courts, setCourts] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    api
      .get('/courts/owner')
      .then((res) => {
        setCourts(res.data)
        setLoading(false)
      })
      .catch(() => {
        navigate('/owner/login')
      })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  const currentPath = window.location.pathname

  const filteredCourts = courts.filter((c) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      c.name?.toLowerCase().includes(q) ||
      c.address?.toLowerCase().includes(q)
    )
  })

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      {/* Sidebar */}
      <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-gray-100 border-r border-stone-300 flex flex-col p-4">
        <div className="px-2 py-4">
          <span className="text-green-800 text-2xl font-bold leading-8">PickleBook</span>
        </div>

        <nav className="flex-1 pt-2 flex flex-col gap-1">
          {NAV_ITEMS.map((item) => {
            const Icon = item.icon
            const active = currentPath === item.path
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors duration-150 ${
                  active ? 'bg-green-700 text-green-50' : 'text-neutral-700 hover:bg-gray-300'
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
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-neutral-700 transition-colors duration-150 hover:bg-gray-300 text-left">
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </button>
            <button className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-neutral-700 transition-colors duration-150 hover:bg-gray-300 text-left">
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <div className="p-4 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-full bg-green-100 outline outline-2 outline-offset-[-2px] outline-green-300 flex items-center justify-center text-green-800 font-semibold shrink-0">
                {owner.firstName?.[0] || 'O'}
                {owner.lastName?.[0] || ''}
              </div>
              <div className="min-w-0">
                <p className="text-slate-800 text-sm font-semibold leading-4 tracking-wide truncate">
                  {owner.firstName} {owner.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-slate-500 text-xs font-medium leading-4 transition-colors duration-150 hover:text-red-600"
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
          <h1 className="text-green-800 text-2xl font-bold leading-8">Manage Courts</h1>
          <div className="flex items-center gap-4">
            <div className="relative">
              <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courts..."
                className="w-64 pl-10 pr-4 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
              />
            </div>
            <button
              onClick={() => navigate('/owner/courts/add')}
              className="px-6 py-2 bg-green-800 hover:bg-green-900 rounded-full flex items-center gap-2 text-white text-sm font-medium transition-colors"
            >
              <Plus className="w-4 h-4" />
              Add Court
            </button>
          </div>
        </header>

        <main className="p-12 flex flex-col gap-6">
          <p className="text-slate-500 text-sm">
            {filteredCourts.length} of {courts.length} court{courts.length === 1 ? '' : 's'}
          </p>

          <div className="bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden">
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-gray-100 border-b border-stone-300">
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Court Name</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Location</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Price</th>
                  <th className="px-6 py-4 text-left text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Type</th>
                  <th className="px-6 py-4 text-right text-slate-500 text-sm font-semibold uppercase leading-4 tracking-wide">Actions</th>
                </tr>
              </thead>
              <tbody>
                {filteredCourts.length === 0 ? (
                  <tr>
                    <td colSpan={5} className="px-6 py-10 text-center text-slate-500 text-sm font-normal">
                      {courts.length === 0
                        ? 'No courts yet. Click "Add Court" to get started.'
                        : 'No courts match your search.'}
                    </td>
                  </tr>
                ) : (
                  filteredCourts.map((court) => (
                    <tr key={court.id} className="border-t border-stone-200 transition-colors duration-150 hover:bg-gray-100">
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                            <img
                              className="w-full h-full object-cover"
                              src={court.images?.[0]?.imageUrl || 'https://placehold.co/40x40'}
                              alt={court.name}
                            />
                          </div>
                          <span className="text-slate-800 text-base font-normal leading-6">{court.name}</span>
                        </div>
                      </td>
                      <td className="px-6 py-4 text-neutral-700 text-sm font-normal leading-5">{court.address}</td>
                      <td className="px-6 py-4">
                        <span className="text-slate-800 text-sm font-bold leading-5">₱{court.pricePerHour}</span>
                        <span className="text-slate-800 text-sm font-semibold leading-5">/hr</span>
                      </td>
                      <td className="px-6 py-4">
                        <span
                          className={`px-3 py-[2.5px] rounded-full inline-block text-xs font-bold leading-4 ${
                            court.type === 'Indoor' ? 'bg-green-100 text-green-800' : 'bg-gray-200 text-gray-700'
                          }`}
                        >
                          {court.type}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex justify-end gap-2">
                          <button
                            onClick={() => navigate(`/owner/courts/${court.id}/edit`)}
                            className="p-2 rounded-lg text-neutral-700 transition-colors duration-150 hover:text-green-800 hover:bg-green-100"
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
        </main>
      </div>
    </div>
  )
}

export default OwnerCourtsPage