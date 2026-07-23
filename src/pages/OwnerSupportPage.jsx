import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Menu, MessageCircle } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'

const SUPPORT_CONTACTS = [
  'Vince Gabrielle Milos',
  'Rhey Albert Crispo',
  'Mharjohn Gerarman',
  'Christian Nino Delantes',
]

function OwnerSupportPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
    }
  }, [navigate])

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-green-800 text-xl sm:text-2xl font-bold leading-8 truncate">Support</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-12">
          <section className="max-w-3xl bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-xl bg-green-100 flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-green-800" />
              </div>
              <div className="min-w-0">
                <p className="text-slate-500 text-xs font-semibold uppercase tracking-wide">App issues</p>
                <h2 className="text-slate-900 text-2xl font-bold leading-8 mt-1">Message the team on Facebook</h2>
                <p className="text-slate-600 text-sm leading-6 mt-3">
                  For bugs, account problems, booking concerns, or other PickleBook app issues, please message any of
                  these team members on Facebook.
                </p>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              {SUPPORT_CONTACTS.map(name => (
                <div
                  key={name}
                  className="px-4 py-3 rounded-lg bg-slate-50 outline outline-1 outline-offset-[-1px] outline-stone-200 flex items-center justify-between gap-3"
                >
                  <span className="text-slate-800 text-sm font-semibold leading-5">{name}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-green-50 outline outline-1 outline-offset-[-1px] outline-green-200 px-4 py-3">
              <p className="text-green-900 text-sm leading-6">
                Include what page you were on, what you clicked, and a screenshot if possible so the issue is easier to trace.
              </p>
            </div>
          </section>
        </main>
      </div>
    </div>
  )
}

export default OwnerSupportPage