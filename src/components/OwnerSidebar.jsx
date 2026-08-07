import { useNavigate, useLocation } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Trophy,
  Users,
  FileText,
  MessageCircle,
  LifeBuoy,
  Settings,
  X,
} from 'lucide-react'

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courts', path: '/owner/courts', icon: MapPin },
  { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
  { label: 'Open Play', path: '/owner/open-play', icon: Trophy },
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
        className={`owner-sidebar w-64 min-w-[16rem] h-screen fixed lg:sticky top-0 flex flex-col p-4 z-40 transition-transform duration-200 ${
          isOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <div className="px-2 py-4 flex items-center justify-between">
          <span className="owner-brand text-2xl font-bold leading-8">PickleBook</span>
          <button
            onClick={onClose}
            className="lg:hidden p-2 rounded-md text-stone-100 hover:bg-white/10"
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
                className={`owner-nav-item flex items-center gap-3 px-4 py-3 text-sm leading-5 text-left transition-colors duration-150 ${
                  active ? 'owner-nav-item-active' : 'owner-nav-item-idle'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>

        <div className="pt-2">
          <div className="pt-8 border-t border-white/15 flex flex-col gap-1">
            <button
              onClick={() => handleNavigate('/owner/support')}
              className={`owner-nav-item flex items-center gap-3 px-4 py-3 text-sm leading-5 text-left transition-colors duration-150 ${
                location.pathname === '/owner/support'
                  ? 'owner-nav-item-active'
                  : 'owner-nav-item-idle'
              }`}
            >
              <LifeBuoy className="w-5 h-5" />
              <span>Support</span>
            </button>
            <button
              onClick={() => handleNavigate('/owner/settings')}
              className={`owner-nav-item flex items-center gap-3 px-4 py-3 text-sm leading-5 text-left transition-colors duration-150 ${
                location.pathname === '/owner/settings'
                  ? 'owner-nav-item-active'
                  : 'owner-nav-item-idle'
              }`}
            >
              <Settings className="w-5 h-5" />
              <span>Settings</span>
            </button>
          </div>
        </div>

        <div className="pt-2">
          <div className="p-4 rounded-md bg-white/8 border border-white/12">
            <div className="flex items-center gap-3">
              <div className="w-10 h-10 rounded-md bg-white/12 border border-white/15 flex items-center justify-center text-stone-50 font-semibold shrink-0">
                {(owner.firstName?.[0] || 'O')}{(owner.lastName?.[0] || '')}
              </div>
              <div className="min-w-0">
                <p className="text-stone-50 text-sm font-semibold leading-4 tracking-wide truncate">
                  {owner.firstName} {owner.lastName}
                </p>
                <button
                  onClick={handleLogout}
                  className="text-stone-300 text-xs font-medium leading-4 transition-colors duration-150 hover:text-white"
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
