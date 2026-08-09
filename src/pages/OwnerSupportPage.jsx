import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ExternalLink, Menu, MessageCircle } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import { ensureOwnerSession } from '../lib/ownerSession'

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
    let cancelled = false
    ensureOwnerSession().then((valid) => {
      if (!cancelled && !valid) navigate('/owner/login')
    })
    return () => { cancelled = true }
  }, [navigate])

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-md text-neutral-700 hover:bg-black/5 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="owner-title text-xl sm:text-2xl leading-8 truncate">Support</h1>
        </header>

        <main className="flex-1 p-4 sm:p-6 lg:p-12">
          <section className="owner-panel max-w-3xl p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex items-start gap-4">
              <div className="w-12 h-12 rounded-lg bg-[#E7EEE9] flex items-center justify-center shrink-0">
                <MessageCircle className="w-6 h-6 text-[var(--pb-teal)]" />
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
                  className="owner-panel-muted px-4 py-3 flex items-center justify-between gap-3"
                >
                  <span className="text-slate-800 text-sm font-semibold leading-5">{name}</span>
                  <ExternalLink className="w-4 h-4 text-slate-400 shrink-0" />
                </div>
              ))}
            </div>

            <div className="rounded-lg bg-[#E7EEE9] outline outline-1 outline-offset-[-1px] outline-[var(--pb-teal)]/20 px-4 py-3">
              <p className="text-[var(--pb-teal)] text-sm leading-6">
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
