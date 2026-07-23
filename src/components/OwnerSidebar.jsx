import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  FileText,
  MessageCircle,
  LifeBuoy,
  Settings,
  X,
} from 'lucide-react'

export const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courts', path: '/owner/courts', icon: MapPin },
  { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
  { label: 'Users', path: '/owner/users', icon: Users },
  { label: 'Reports', path: '/owner/reports', icon: FileText },
  { label: 'Messages', path: '/owner/messages', icon: MessageCircle },
]

function OwnerSidebar({ isOpen, onClose }) {
  const navigate = useNavigate()
  const location = useLocation()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  const handleNavigate = (path) => {
    navigate(path)
    onClose?.()
  }

  return (
    <>
      {/* Mobile sidebar overlay */}
      {isOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={onClose}
        />
      )}

      <aside
        className={`w-64 min-w-[16rem] h-screen fixed lg:sticky top-0 bg-gray-100 border-r border-stone-300 flex flex-col p-4 z-40 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="px-2 py-4 flex items-center justify-between">
          <span className="text-green-800 text-2xl font-bold leading-8">PickleBook</span>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-lg text-neutral-700 hover:bg-gray-300"
            aria-label="Close menu"
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        <nav className="flex-1 pt-2 flex flex-col gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = location.pathname === item.path
            return (
              <button
                key={item.path}
                onClick={() => handleNavigate(item.path)}
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
              onClick={() => handleNavigate('/owner/support')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors duration-150 ${
                location.pathname === '/owner/support'
                  ? 'bg-green-700 text-green-50'
                  : 'text-neutral-700 hover:bg-gray-300'
              }`}
            >
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </button>
            <button
              onClick={() => handleNavigate('/owner/settings')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors duration-150 ${
                location.pathname === '/owner/settings'
                  ? 'bg-green-700 text-green-50'
                  : 'text-neutral-700 hover:bg-gray-300'
              }`}
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
    </>
  )
}

export default OwnerSidebar