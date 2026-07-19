import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  CreditCard,
  FileText,
  MessageCircle,
  Settings,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courts', path: '/owner/courts', icon: MapPin },
  { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
  { label: 'Users', path: '/owner/users', icon: Users },
  { label: 'Payments', path: '/owner/payments', icon: CreditCard },
  { label: 'Reports', path: '/owner/reports', icon: FileText },
  { label: 'Messages', path: '/owner/messages', icon: MessageCircle },
]

function OwnerSidebar() {
  const navigate = useNavigate()
  const location = useLocation()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  return (
    <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-gray-100 border-r border-stone-300 flex flex-col p-4">
      <div className="px-2 py-4">
        <span className="text-green-800 text-2xl font-bold leading-8">PickleBook</span>
      </div>

      <nav className="flex-1 pt-2 flex flex-col gap-1">
        {NAV_ITEMS.map(item => {
          const Icon = item.icon
          const active = location.pathname === item.path
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
          <button
            onClick={() => navigate('/owner/settings')}
            className="flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-neutral-700 transition-colors duration-150 hover:bg-gray-300 text-left"
          >
            <Settings className="w-5 h-5" />
            <span>Settings</span>
          </button>
        </div>
      </div>

      <div className="pt-2">
        <div className="p-4 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 transition-shadow duration-150 hover:shadow-md">
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
                className="text-slate-500 text-xs font-medium leading-4 transition-colors duration-150 hover:text-red-600"
              >
                Log out
              </button>
            </div>
          </div>
        </div>
      </div>
    </aside>
  )
}

export default OwnerSidebar
