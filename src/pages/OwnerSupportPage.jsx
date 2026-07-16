import { useEffect, useRef, useState } from 'react'
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
  Send,
  ShieldCheck,
  User as UserIcon,
  Store,
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

const ROLE_FILTERS = ['All', 'User', 'Admin']

const ROLE_META = {
  User: { icon: UserIcon, badge: 'bg-blue-100 text-blue-800' },
  Owner: { icon: Store, badge: 'bg-green-100 text-green-800' },
  Admin: { icon: ShieldCheck, badge: 'bg-purple-100 text-purple-800' },
}

function timeAgo(dateStr) {
  if (!dateStr) return ''
  const diff = Date.now() - new Date(dateStr).getTime()
  const mins = Math.floor(diff / 60000)
  if (mins < 1) return 'now'
  if (mins < 60) return `${mins}m`
  const hrs = Math.floor(mins / 60)
  if (hrs < 24) return `${hrs}h`
  return `${Math.floor(hrs / 24)}d`
}

function OwnerSupportPage() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [roleFilter, setRoleFilter] = useState('All')
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    api
      .get('/support/conversations')
      .then((res) => {
        setConversations(res.data)
        if (res.data.length > 0) setActiveId(res.data[0].id)
        setLoading(false)
      })
      .catch((err) => {
        if (err.response?.status === 401 || err.response?.status === 403) {
          navigate('/owner/login')
        } else {
          console.error('Failed to load conversations:', err)
          setLoading(false)
        }
      })
  }, [])

  useEffect(() => {
    if (!activeId) return
    api
      .get(`/support/conversations/${activeId}/messages`)
      .then((res) => setMessages(res.data))
      .catch((err) => console.error('Failed to load messages:', err))
  }, [activeId])

  useEffect(() => {
    scrollRef.current?.scrollTo({ top: scrollRef.current.scrollHeight, behavior: 'smooth' })
  }, [messages])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  const currentPath = window.location.pathname

  const filteredConversations = conversations.filter((c) => {
    const matchesRole = roleFilter === 'All' || c.role === roleFilter
    const q = search.trim().toLowerCase()
    const matchesSearch = !q || c.name?.toLowerCase().includes(q)
    return matchesRole && matchesSearch
  })

  const activeConversation = conversations.find((c) => c.id === activeId)

  const handleSend = () => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    setSending(true)
    const optimisticMessage = {
      id: `temp-${Date.now()}`,
      sender: 'Owner',
      text,
      createdAt: new Date().toISOString(),
    }
    setMessages((prev) => [...prev, optimisticMessage])
    setDraft('')

    api
      .post(`/support/conversations/${activeId}/messages`, { text })
      .then((res) => {
        setMessages((prev) => prev.map((m) => (m.id === optimisticMessage.id ? res.data : m)))
        setConversations((prev) =>
          prev.map((c) => (c.id === activeId ? { ...c, lastMessage: text, updatedAt: new Date().toISOString() } : c))
        )
      })
      .catch((err) => {
        console.error('Failed to send message:', err)
        setMessages((prev) => prev.filter((m) => m.id !== optimisticMessage.id))
      })
      .finally(() => setSending(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      handleSend()
    }
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
            <button
              onClick={() => navigate('/owner/support')}
              className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors duration-150 ${
                currentPath === '/owner/support' ? 'bg-green-700 text-green-50' : 'text-neutral-700 hover:bg-gray-300'
              }`}
            >
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
          <div className="p-4 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 transition-shadow duration-150 hover:shadow-md">
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
          <h1 className="text-green-800 text-2xl font-bold leading-8">Support</h1>
          <div className="flex items-center gap-8">
            <button className="relative px-2 pt-2 pb-3.5 flex items-center justify-center rounded-full transition-colors duration-150 hover:bg-gray-200">
              <Bell className="w-4 h-5 text-neutral-700" />
              <span className="w-2 h-2 bg-red-500 rounded-full absolute top-1.5 right-1.5" />
            </button>
          </div>
        </header>

        <main className="flex-1 px-12 py-8 flex gap-6 min-h-0">
          {/* Conversation list */}
          <div className="w-80 shrink-0 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col overflow-hidden">
            <div className="p-4 border-b border-stone-300 flex flex-col gap-3">
              <div className="relative">
                <Search className="w-4 h-4 text-neutral-700 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="text"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  placeholder="Search conversations..."
                  className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
                />
              </div>
              <div className="flex items-center gap-2">
                {ROLE_FILTERS.map((role) => (
                  <button
                    key={role}
                    onClick={() => setRoleFilter(role)}
                    className={`px-3 py-1.5 rounded-full text-xs font-semibold leading-4 transition-colors duration-150 ${
                      roleFilter === role
                        ? 'bg-green-800 text-white'
                        : 'bg-gray-100 text-neutral-700 hover:bg-gray-300'
                    }`}
                  >
                    {role}
                  </button>
                ))}
              </div>
            </div>

            <div className="flex-1 overflow-y-auto">
              {filteredConversations.length === 0 ? (
                <p className="p-6 text-center text-slate-500 text-sm font-normal">No conversations found.</p>
              ) : (
                filteredConversations.map((c) => {
                  const meta = ROLE_META[c.role] || ROLE_META.User
                  const RoleIcon = meta.icon
                  const active = c.id === activeId
                  return (
                    <button
                      key={c.id}
                      onClick={() => setActiveId(c.id)}
                      className={`w-full text-left px-4 py-3 flex items-center gap-3 border-b border-stone-100 transition-colors duration-150 ${
                        active ? 'bg-green-100' : 'hover:bg-gray-100'
                      }`}
                    >
                      <div className="relative shrink-0">
                        <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-slate-700 text-sm font-semibold">
                          {c.name?.[0] || '?'}
                        </div>
                        {c.unreadCount > 0 && (
                          <span className="absolute -top-1 -right-1 min-w-[18px] h-[18px] px-1 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center">
                            {c.unreadCount}
                          </span>
                        )}
                      </div>
                      <div className="min-w-0 flex-1">
                        <div className="flex items-center justify-between gap-2">
                          <span className="text-slate-800 text-sm font-semibold leading-5 truncate">{c.name}</span>
                          <span className="text-slate-400 text-[10px] font-normal shrink-0">
                            {timeAgo(c.updatedAt)}
                          </span>
                        </div>
                        <div className="flex items-center gap-1.5 mt-0.5">
                          <span
                            className={`px-1.5 py-[1px] rounded-full inline-flex items-center gap-1 text-[10px] font-bold leading-3 ${meta.badge}`}
                          >
                            <RoleIcon className="w-2.5 h-2.5" />
                            {c.role}
                          </span>
                        </div>
                        <p className="text-slate-500 text-xs font-normal leading-4 truncate mt-1">
                          {c.lastMessage || 'No messages yet'}
                        </p>
                      </div>
                    </button>
                  )
                })
              )}
            </div>
          </div>

          {/* Chat panel */}
          <div className="flex-1 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col overflow-hidden min-h-0">
            {!activeConversation ? (
              <div className="flex-1 flex items-center justify-center text-slate-500 text-sm font-normal">
                Select a conversation to start chatting.
              </div>
            ) : (
              <>
                {/* Chat header */}
                <div className="px-6 py-4 border-b border-stone-300 flex items-center gap-3">
                  <div className="w-10 h-10 rounded-full bg-gray-200 flex items-center justify-center text-slate-700 text-sm font-semibold">
                    {activeConversation.name?.[0] || '?'}
                  </div>
                  <div className="min-w-0">
                    <p className="text-slate-800 text-sm font-semibold leading-5 truncate">
                      {activeConversation.name}
                    </p>
                    <span
                      className={`px-2 py-[1px] rounded-full inline-flex items-center gap-1 text-[10px] font-bold leading-3 mt-0.5 ${
                        (ROLE_META[activeConversation.role] || ROLE_META.User).badge
                      }`}
                    >
                      {activeConversation.role}
                    </span>
                  </div>
                </div>

                {/* Messages */}
                <div ref={scrollRef} className="flex-1 overflow-y-auto px-6 py-4 flex flex-col gap-3 bg-slate-50">
                  {messages.length === 0 ? (
                    <p className="m-auto text-slate-500 text-sm font-normal">
                      No messages yet. Say hello 👋
                    </p>
                  ) : (
                    messages.map((m) => {
                      const isOwner = m.sender === 'Owner'
                      return (
                        <div key={m.id} className={`flex ${isOwner ? 'justify-end' : 'justify-start'}`}>
                          <div
                            className={`max-w-[70%] px-4 py-2.5 rounded-2xl text-sm font-normal leading-5 ${
                              isOwner
                                ? 'bg-green-800 text-white rounded-br-sm'
                                : 'bg-white text-slate-800 outline outline-1 outline-offset-[-1px] outline-stone-300 rounded-bl-sm'
                            }`}
                          >
                            {!isOwner && (
                              <p className="text-[10px] font-bold uppercase tracking-wide mb-1 opacity-60">
                                {m.sender}
                              </p>
                            )}
                            <p>{m.text}</p>
                            <p
                              className={`text-[10px] font-normal mt-1 text-right ${
                                isOwner ? 'text-green-100/70' : 'text-slate-400'
                              }`}
                            >
                              {timeAgo(m.createdAt)}
                            </p>
                          </div>
                        </div>
                      )
                    })
                  )}
                </div>

                {/* Composer */}
                <div className="px-6 py-4 border-t border-stone-300 flex items-end gap-3">
                  <textarea
                    value={draft}
                    onChange={(e) => setDraft(e.target.value)}
                    onKeyDown={handleKeyDown}
                    placeholder="Type a message..."
                    rows={1}
                    className="flex-1 resize-none px-4 py-2.5 bg-gray-100 rounded-2xl text-sm font-normal text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30 max-h-32"
                  />
                  <button
                    onClick={handleSend}
                    disabled={!draft.trim() || sending}
                    className={`p-3 rounded-full flex items-center justify-center transition-all duration-150 ${
                      !draft.trim() || sending
                        ? 'bg-gray-200 text-gray-400 cursor-not-allowed'
                        : 'bg-green-800 hover:bg-green-900 active:scale-95 text-white'
                    }`}
                  >
                    <Send className="w-4 h-4" />
                  </button>
                </div>
              </>
            )}
          </div>
        </main>
      </div>
    </div>
  )
}

export default OwnerSupportPage
