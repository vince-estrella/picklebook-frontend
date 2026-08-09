import { useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { ArrowLeft, MessageCircle, Search, Send } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../services/api'
import { clearPlayerSession, ensurePlayerSession } from '../lib/playerSession'

function formatTime(value) {
  if (!value) return ''
  return new Date(value).toLocaleString('en-PH', {
    month: 'short',
    day: 'numeric',
    hour: 'numeric',
    minute: '2-digit',
    timeZone: 'Asia/Manila',
  })
}

function PlayerMessagesPage() {
  const navigate = useNavigate()
  const bottomRef = useRef(null)
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [search, setSearch] = useState('')
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')

  const loadConversations = useCallback(() => {
    ensurePlayerSession().then((valid) => {
      if (!valid) {
        navigate('/login')
        return
      }

      api.get('/messages/conversations')
      .then((res) => {
        const data = res.data || []
        setConversations(data)
        setActiveId((current) => current || data[0]?.id || null)
        setError('')
      })
      .catch((err) => {
        const status = err.response?.status
        if (status === 401 || status === 403) {
          clearPlayerSession()
          navigate('/login')
          return
        }
        setError('Could not load your messages. Please try again.')
      })
      .finally(() => setLoading(false))
    })
  }, [navigate])

  useEffect(() => {
    loadConversations()
  }, [loadConversations])

  useEffect(() => {
    if (!activeId) {
      return
    }

    let cancelled = false
    api.get(`/messages/conversations/${activeId}/messages`)
      .then((res) => {
        if (!cancelled) setMessages(res.data || [])
      })
      .catch(() => {
        if (!cancelled) setMessages([])
      })

    api.patch(`/messages/conversations/${activeId}/read`).catch(() => {})
    return () => { cancelled = true }
  }, [activeId])

  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' })
  }, [messages])

  const filtered = useMemo(() => {
    const q = search.trim().toLowerCase()
    if (!q) return conversations
    return conversations.filter((conversation) =>
      conversation.courtName?.toLowerCase().includes(q) ||
      conversation.ownerName?.toLowerCase().includes(q) ||
      conversation.lastMessage?.toLowerCase().includes(q)
    )
  }, [conversations, search])

  const active = conversations.find((conversation) => conversation.id === activeId)

  const sendMessage = async (event) => {
    event.preventDefault()
    const text = draft.trim()
    if (!text || !activeId) return

    const optimistic = {
      id: `temp-${Date.now()}`,
      sender: 'player',
      text,
      createdAt: new Date().toISOString(),
      pending: true,
    }

    setDraft('')
    setMessages((prev) => [...prev, optimistic])
    try {
      const res = await api.post(`/messages/conversations/${activeId}/messages`, { text })
      setMessages((prev) => prev.map((message) => message.id === optimistic.id ? (res.data || optimistic) : message))
      loadConversations()
    } catch {
      setMessages((prev) => prev.map((message) => message.id === optimistic.id ? { ...message, failed: true, pending: false } : message))
    }
  }

  return (
    <div className="min-h-screen bg-[#EEF1EA]">
      <Navbar />
      <main className="mx-auto flex min-h-[calc(100vh-65px)] w-full max-w-6xl flex-col px-4 py-5 sm:px-6 lg:px-8">
        <div className="mb-4 flex items-center justify-between gap-3">
          <div>
            <p className="text-xs font-bold uppercase tracking-[0.18em] text-green-700">Inbox</p>
            <h1 className="text-2xl font-black text-slate-950">Messages</h1>
          </div>
          {activeId && (
            <button
              type="button"
              onClick={() => {
                setActiveId(null)
                setMessages([])
              }}
              className="inline-flex items-center gap-1 rounded-lg border border-slate-200 bg-white px-3 py-2 text-sm font-bold text-slate-700 lg:hidden"
            >
              <ArrowLeft className="h-4 w-4" />
              Inbox
            </button>
          )}
        </div>

        <section className="grid min-h-[620px] overflow-hidden rounded-xl border border-slate-200 bg-white shadow-sm lg:grid-cols-[340px_1fr]">
          <aside className={`${activeId ? 'hidden lg:flex' : 'flex'} min-h-0 flex-col border-slate-200 lg:border-r`}>
            <div className="border-b border-slate-100 p-3">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-slate-400" />
                <input
                  value={search}
                  onChange={(event) => setSearch(event.target.value)}
                  placeholder="Search messages..."
                  className="w-full rounded-lg border border-slate-200 bg-slate-50 py-2.5 pl-9 pr-3 text-sm outline-none focus:border-green-700"
                />
              </div>
            </div>

            <div className="min-h-0 flex-1 overflow-y-auto">
              {loading ? (
                <p className="p-6 text-sm text-slate-500">Loading messages...</p>
              ) : error ? (
                <p className="p-6 text-sm text-red-600">{error}</p>
              ) : filtered.length === 0 ? (
                <div className="flex h-full flex-col items-center justify-center p-8 text-center text-slate-500">
                  <MessageCircle className="mb-3 h-10 w-10 text-slate-300" />
                  <p className="text-sm font-semibold">No messages yet</p>
                  <p className="mt-1 text-xs">Message a court owner from a court page and it will show here.</p>
                </div>
              ) : filtered.map((conversation) => (
                <button
                  key={conversation.id}
                  type="button"
                  onClick={() => setActiveId(conversation.id)}
                  className={`w-full border-b border-slate-100 p-4 text-left transition-colors ${activeId === conversation.id ? 'bg-green-50' : 'hover:bg-slate-50'}`}
                >
                  <div className="flex items-start gap-3">
                    <div className="grid h-10 w-10 shrink-0 place-items-center rounded-full bg-green-100 text-sm font-black text-green-800">
                      {(conversation.courtName?.[0] || 'P').toUpperCase()}
                    </div>
                    <div className="min-w-0 flex-1">
                      <div className="flex items-center justify-between gap-2">
                        <p className="truncate text-sm font-black text-slate-900">{conversation.courtName || 'Court'}</p>
                        {conversation.unreadCount > 0 && (
                          <span className="rounded-full bg-green-700 px-2 py-0.5 text-[10px] font-black text-white">{conversation.unreadCount}</span>
                        )}
                      </div>
                      <p className="truncate text-xs font-semibold text-slate-500">{conversation.ownerName || 'Court owner'}</p>
                      <p className="mt-1 truncate text-sm text-slate-500">{conversation.lastMessage || 'No messages yet'}</p>
                    </div>
                  </div>
                </button>
              ))}
            </div>
          </aside>

          <section className={`${activeId ? 'flex' : 'hidden lg:flex'} min-h-0 flex-col bg-[#FBFCF8]`}>
            {!active ? (
              <div className="flex flex-1 flex-col items-center justify-center p-8 text-center text-slate-400">
                <MessageCircle className="mb-3 h-12 w-12" />
                <p className="text-sm font-semibold">Choose a conversation.</p>
              </div>
            ) : (
              <>
                <header className="border-b border-slate-200 bg-white p-4">
                  <p className="text-base font-black text-slate-950">{active.courtName || 'Court'}</p>
                  <p className="text-sm text-slate-500">{active.ownerName || 'Court owner'}</p>
                </header>

                <div className="flex-1 overflow-y-auto p-4">
                  {messages.length === 0 ? (
                    <p className="m-auto text-center text-sm text-slate-400">No messages yet.</p>
                  ) : messages.map((message) => {
                    const mine = message.sender === 'player'
                    return (
                      <div key={message.id} className={`mb-3 flex ${mine ? 'justify-end' : 'justify-start'}`}>
                        <div className={`max-w-[82%] rounded-2xl px-4 py-2.5 text-sm shadow-sm ${mine ? 'rounded-br-md bg-green-700 text-white' : 'rounded-bl-md bg-white text-slate-800 border border-slate-100'}`}>
                          <p className="whitespace-pre-wrap leading-5">{message.text}</p>
                          <p className={`mt-1 text-[10px] ${mine ? 'text-green-100' : 'text-slate-400'}`}>
                            {message.failed ? 'Not sent' : message.pending ? 'Sending...' : formatTime(message.createdAt)}
                          </p>
                        </div>
                      </div>
                    )
                  })}
                  <div ref={bottomRef} />
                </div>

                <form onSubmit={sendMessage} className="border-t border-slate-200 bg-white p-3">
                  <div className="flex items-end gap-2">
                    <textarea
                      value={draft}
                      onChange={(event) => setDraft(event.target.value)}
                      rows={1}
                      placeholder="Write a message..."
                      className="max-h-28 flex-1 resize-none rounded-xl border border-slate-200 px-3 py-3 text-sm outline-none focus:border-green-700"
                    />
                    <button
                      type="submit"
                      disabled={!draft.trim()}
                      className="grid h-11 w-11 shrink-0 place-items-center rounded-xl bg-green-700 text-white disabled:cursor-not-allowed disabled:opacity-50"
                      aria-label="Send message"
                    >
                      <Send className="h-4 w-4" />
                    </button>
                  </div>
                </form>
              </>
            )}
          </section>
        </section>
      </main>
    </div>
  )
}

export default PlayerMessagesPage
