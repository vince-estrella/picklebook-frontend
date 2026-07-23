import { useState, useEffect, useRef, useCallback } from 'react'
import { Search, Send, AlertCircle, MessagesSquare, Menu } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import api from '../services/api'

// See ChatHeadWidget.jsx for the expected backend contract this page relies on:
//   GET   /support/conversations?category=owner
//   GET   /support/conversations/:id/messages
//   POST  /support/conversations/:id/messages
//   PATCH /support/conversations/:id/read

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('') || '?'
}

function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

function OwnerMessagesPage() {
  const [conversations, setConversations] = useState([])
  const [search, setSearch] = useState('')
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [convError, setConvError] = useState(false)
  const [threadError, setThreadError] = useState(false)
  const [sending, setSending] = useState(false)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [showMobileList, setShowMobileList] = useState(true)
  const scrollRef = useRef(null)

  const loadConversations = useCallback(() => {
    api.get('/messages/owner/conversations')
      .then(res => {
        const data = res.data || []
        setConversations(data)
        setConvError(false)
        if (!activeId && data.length > 0) setActiveId(data[0].id)
      })
      .catch(() => setConvError(true))
      .finally(() => setLoading(false))
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  useEffect(() => { loadConversations() }, [loadConversations])

  useEffect(() => {
    if (!activeId) return
    setMessages([])
    setThreadError(false)
    api.get(`/messages/owner/conversations/${activeId}/messages`)
      .then(res => setMessages(res.data || []))
      .catch(() => setThreadError(true))

    setConversations(prev => prev.map(c => c.id === activeId ? { ...c, unreadCount: 0 } : c))
    api.patch(`/messages/owner/conversations/${activeId}/read`).catch(() => {})
  }, [activeId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const active = conversations.find(c => c.id === activeId)
  const filtered = conversations
    .filter(c => c.customerName?.toLowerCase().includes(search.toLowerCase()))
    .sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))

  const sendReply = () => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    const optimistic = { id: `temp-${Date.now()}`, sender: 'owner', text, createdAt: new Date().toISOString(), pending: true }
    setMessages(prev => [...prev, optimistic])
    setDraft('')
    setSending(true)
    api.post(`/messages/owner/conversations/${activeId}/messages`, { text })
      .then(res => {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? (res.data || { ...optimistic, pending: false }) : m))
        setConversations(prev => prev.map(c => c.id === activeId ? { ...c, lastMessage: text, lastMessageAt: new Date().toISOString() } : c))
      })
      .catch(() => {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, failed: true, pending: false } : m))
      })
      .finally(() => setSending(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendReply()
    }
  }

  const selectConversation = (id) => {
    setActiveId(id)
    setShowMobileList(false) // on mobile, jump into the thread view
  }

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex justify-between items-center sticky top-0 z-10">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <h1 className="text-green-800 text-xl sm:text-2xl font-bold leading-8">Messages</h1>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 lg:pt-6 flex-1 min-h-0">
          <div className="h-[calc(100vh-132px)] sm:h-[calc(100vh-140px)] bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 overflow-hidden flex">

            {/* Conversation list */}
            <div
              className={`w-full sm:w-80 sm:min-w-[20rem] border-r border-stone-200 flex-col ${
                showMobileList ? 'flex' : 'hidden sm:flex'
              }`}
            >
              <div className="p-4 border-b border-stone-200">
                <div className="relative">
                  <Search className="w-4 h-4 text-neutral-500 absolute left-3 top-1/2 -translate-y-1/2" />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search conversations…"
                    className="w-full pl-9 pr-3 py-2 bg-gray-100 rounded-full text-sm text-slate-800 placeholder:text-gray-500 outline-none transition-shadow duration-150 focus:ring-2 focus:ring-green-700/30"
                  />
                </div>
              </div>

              <div className="flex-1 overflow-y-auto">
                {loading && <p className="p-6 text-center text-slate-500 text-sm">Loading…</p>}
                {!loading && convError && (
                  <div className="p-6 flex flex-col items-center text-center gap-2 text-slate-500 text-sm">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Couldn't load conversations. Check that the support API is connected.
                  </div>
                )}
                {!loading && !convError && filtered.length === 0 && (
                  <p className="p-6 text-center text-slate-500 text-sm">No conversations found.</p>
                )}
                {filtered.map(c => (
                  <button
                    key={c.id}
                    onClick={() => selectConversation(c.id)}
                    className={`w-full px-4 py-3 flex items-center gap-3 text-left border-b border-stone-100 transition-colors duration-150 ${
                      c.id === activeId ? 'bg-green-50' : 'hover:bg-gray-100'
                    }`}
                  >
                    <div className="w-10 h-10 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold shrink-0 overflow-hidden">
                      {c.customerAvatarUrl ? (
                        <img src={c.customerAvatarUrl} alt={c.customerName} className="w-full h-full object-cover" />
                      ) : (
                        initials(c.customerName)
                      )}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className={`text-sm truncate ${c.unreadCount ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                          {c.customerName}
                        </p>
                        <span className="text-[11px] text-slate-400 shrink-0">{formatTimestamp(c.lastMessageAt)}</span>
                      </div>
                      <p className={`text-xs truncate ${c.unreadCount ? 'text-slate-700' : 'text-slate-500'}`}>
                        {c.courtName ? `${c.courtName} · ` : ''}{c.lastMessage || 'No messages yet'}
                      </p>
                    </div>
                    {c.unreadCount > 0 && (
                      <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                        {c.unreadCount > 9 ? '9+' : c.unreadCount}
                      </span>
                    )}
                  </button>
                ))}
              </div>
            </div>

            {/* Thread */}
            <div className={`flex-1 flex-col min-w-0 ${showMobileList ? 'hidden sm:flex' : 'flex'}`}>
              {!active ? (
                <div className="flex-1 flex flex-col items-center justify-center gap-3 text-slate-400">
                  <MessagesSquare className="w-10 h-10" />
                  <p className="text-sm">Select a conversation to reply.</p>
                </div>
              ) : (
                <>
                  <div className="px-4 sm:px-6 py-4 border-b border-stone-200 flex items-center gap-3 shrink-0">
                    <button
                      onClick={() => setShowMobileList(true)}
                      className="sm:hidden p-1 -ml-1 rounded-lg text-neutral-700 hover:bg-gray-200"
                      aria-label="Back to conversations"
                    >
                      <ChevronLeftIcon />
                    </button>
                    <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-sm font-semibold overflow-hidden">
                      {active.customerAvatarUrl ? (
                        <img src={active.customerAvatarUrl} alt={active.customerName} className="w-full h-full object-cover" />
                      ) : (
                        initials(active.customerName)
                      )}
                    </div>
                    <div>
                      <p className="text-slate-800 text-sm font-semibold leading-4">{active.customerName}</p>
                      <p className="text-slate-500 text-xs">{active.courtName ? `About ${active.courtName}` : 'Court owner inbox'}</p>
                    </div>
                  </div>

                  <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 sm:p-6 flex flex-col gap-3 bg-slate-50">
                    {threadError && (
                      <div className="m-auto flex flex-col items-center text-center gap-2 text-slate-500 text-sm">
                        <AlertCircle className="w-5 h-5 text-amber-500" />
                        Couldn't load this conversation.
                      </div>
                    )}
                    {!threadError && messages.length === 0 && (
                      <p className="m-auto text-slate-400 text-sm">No messages yet.</p>
                    )}
                    {messages.map(m => (
                      <div key={m.id} className={`flex flex-col ${m.sender === 'owner' ? 'items-end' : 'items-start'}`}>
                        <div
                          className={`max-w-[85%] sm:max-w-[60%] px-4 py-2.5 rounded-2xl text-sm leading-relaxed ${
                            m.sender === 'owner'
                              ? `bg-green-800 text-white ${m.failed ? 'opacity-50' : ''} rounded-br-sm`
                              : 'bg-white text-slate-800 outline outline-1 outline-stone-200 rounded-bl-sm'
                          }`}
                        >
                          {m.text}
                        </div>
                        <span className="text-[11px] text-slate-400 mt-1 px-1">
                          {m.failed ? 'Failed to send' : formatTimestamp(m.createdAt)}
                        </span>
                      </div>
                    ))}
                  </div>

                  <div className="p-3 sm:p-4 border-t border-stone-200 flex items-end gap-2 sm:gap-3 shrink-0">
                    <textarea
                      value={draft}
                      onChange={e => setDraft(e.target.value)}
                      onKeyDown={handleKeyDown}
                      placeholder={`Reply to ${active.customerName}…`}
                      rows={1}
                      className="flex-1 resize-none rounded-lg border border-stone-300 px-4 py-2.5 text-sm outline-none focus:ring-2 focus:ring-green-700/30 max-h-32"
                    />
                    <button
                      onClick={sendReply}
                      disabled={!draft.trim() || sending}
                      className={`px-4 sm:px-5 py-2.5 rounded-lg flex items-center gap-2 text-sm font-medium transition-colors duration-150 ${
                        draft.trim() ? 'bg-green-800 text-white hover:bg-green-900' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                      }`}
                    >
                      <Send className="w-4 h-4" />
                      <span className="hidden sm:inline">Send</span>
                    </button>
                  </div>
                </>
              )}
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

// tiny inline back-arrow so we don't need another lucide import for one icon
function ChevronLeftIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="15 18 9 12 15 6" />
    </svg>
  )
}

export default OwnerMessagesPage