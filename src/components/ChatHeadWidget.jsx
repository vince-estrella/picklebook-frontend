import { useState, useEffect, useRef, useCallback } from 'react'
import { useNavigate } from 'react-router-dom'
import { MessageCircle, X, ChevronLeft, Send, ExternalLink, AlertCircle } from 'lucide-react'
import api from '../services/api'

// ---------------------------------------------------------------------------
// Expected backend contract (create these routes if they don't exist yet):
//   GET   /support/conversations?category=owner   -> Conversation[]
//   GET   /support/conversations/:id/messages      -> Message[]
//   POST  /support/conversations/:id/messages      { text } -> Message
//   PATCH /support/conversations/:id/read          -> { ok: true }
//
// Conversation: { id, customerName, lastMessage, lastMessageAt, unreadCount }
// Message: { id, sender: 'customer' | 'owner', text, createdAt }
// ---------------------------------------------------------------------------

const POLL_MS = 15000

function initials(name = '') {
  return name.split(' ').filter(Boolean).slice(0, 2).map(n => n[0].toUpperCase()).join('') || '?'
}

function timeAgo(iso) {
  if (!iso) return ''
  const diff = (Date.now() - new Date(iso).getTime()) / 1000
  if (diff < 60) return 'now'
  if (diff < 3600) return `${Math.floor(diff / 60)}m`
  if (diff < 86400) return `${Math.floor(diff / 3600)}h`
  return `${Math.floor(diff / 86400)}d`
}

function ChatHeadWidget() {
  const navigate = useNavigate()
  const [open, setOpen] = useState(false)
  const [conversations, setConversations] = useState([])
  const [activeId, setActiveId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loadError, setLoadError] = useState(null)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const pollRef = useRef(null)

  const totalUnread = conversations.reduce((sum, c) => sum + (c.unreadCount || 0), 0)

  const loadConversations = useCallback(() => {
    api.get('/support/conversations', { params: { category: 'owner' } })
      .then(res => {
        setConversations(res.data || [])
        setLoadError(null)
      })
      .catch(() => setLoadError('conversations'))
  }, [])

  useEffect(() => {
    loadConversations()
    pollRef.current = setInterval(loadConversations, POLL_MS)
    return () => clearInterval(pollRef.current)
  }, [loadConversations])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages, activeId])

  const openThread = (conversation) => {
    setActiveId(conversation.id)
    setMessages([])
    setLoadError(null)
    api.get(`/support/conversations/${conversation.id}/messages`)
      .then(res => setMessages(res.data || []))
      .catch(() => setLoadError('messages'))
    if (conversation.unreadCount > 0) {
      setConversations(prev => prev.map(c => c.id === conversation.id ? { ...c, unreadCount: 0 } : c))
      api.patch(`/support/conversations/${conversation.id}/read`).catch(() => {})
    }
  }

  const sendReply = () => {
    const text = draft.trim()
    if (!text || !activeId || sending) return
    const optimistic = { id: `temp-${Date.now()}`, sender: 'owner', text, createdAt: new Date().toISOString(), pending: true }
    setMessages(prev => [...prev, optimistic])
    setDraft('')
    setSending(true)
    api.post(`/support/conversations/${activeId}/messages`, { text })
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

  const active = conversations.find(c => c.id === activeId)
  const sorted = [...conversations].sort((a, b) => new Date(b.lastMessageAt || 0) - new Date(a.lastMessageAt || 0))

  return (
    <div className="fixed bottom-6 right-6 z-50 flex flex-col items-end gap-3">
      {open && (
        <div className="w-[360px] h-[480px] bg-white rounded-2xl shadow-2xl outline outline-1 outline-stone-300 flex flex-col overflow-hidden">
          {/* Header */}
          <div className="px-4 py-3 bg-green-800 flex items-center justify-between shrink-0">
            <div className="flex items-center gap-2 min-w-0">
              {active && (
                <button
                  onClick={() => setActiveId(null)}
                  className="text-green-100 hover:text-white transition-colors duration-150 shrink-0"
                >
                  <ChevronLeft className="w-4 h-4" />
                </button>
              )}
              <span className="text-white text-sm font-semibold truncate">
                {active ? active.customerName : 'Messages'}
              </span>
            </div>
            <button onClick={() => setOpen(false)} className="text-green-100 hover:text-white transition-colors duration-150 shrink-0">
              <X className="w-4 h-4" />
            </button>
          </div>

          {/* Body */}
          {!active ? (
            <div className="flex-1 overflow-y-auto">
              {loadError === 'conversations' && (
                <div className="p-4 flex flex-col items-center text-center gap-2 text-slate-500 text-xs">
                  <AlertCircle className="w-5 h-5 text-amber-500" />
                  Couldn't load conversations. The support API may not be connected yet.
                </div>
              )}
              {!loadError && sorted.length === 0 && (
                <p className="p-6 text-center text-slate-500 text-xs">No conversations yet.</p>
              )}
              {sorted.map(c => (
                <button
                  key={c.id}
                  onClick={() => openThread(c)}
                  className="w-full px-4 py-3 flex items-center gap-3 text-left border-b border-stone-100 hover:bg-gray-100 transition-colors duration-150"
                >
                  <div className="w-9 h-9 rounded-full bg-green-100 text-green-800 flex items-center justify-center text-xs font-semibold shrink-0">
                    {initials(c.customerName)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center justify-between gap-2">
                      <p className={`text-sm truncate ${c.unreadCount ? 'font-semibold text-slate-900' : 'font-medium text-slate-700'}`}>
                        {c.customerName}
                      </p>
                      <span className="text-[10px] text-slate-400 shrink-0">{timeAgo(c.lastMessageAt)}</span>
                    </div>
                    <p className={`text-xs truncate ${c.unreadCount ? 'text-slate-700' : 'text-slate-500'}`}>{c.lastMessage || 'No messages yet'}</p>
                  </div>
                  {c.unreadCount > 0 && (
                    <span className="w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center shrink-0">
                      {c.unreadCount > 9 ? '9+' : c.unreadCount}
                    </span>
                  )}
                </button>
              ))}
            </div>
          ) : (
            <>
              <div ref={scrollRef} className="flex-1 overflow-y-auto p-3 flex flex-col gap-2 bg-slate-50">
                {loadError === 'messages' && (
                  <div className="m-auto flex flex-col items-center text-center gap-2 text-slate-500 text-xs">
                    <AlertCircle className="w-5 h-5 text-amber-500" />
                    Couldn't load this conversation.
                  </div>
                )}
                {!loadError && messages.length === 0 && (
                  <p className="m-auto text-slate-400 text-xs">No messages yet.</p>
                )}
                {messages.map(m => (
                  <div key={m.id} className={`flex flex-col ${m.sender === 'owner' ? 'items-end' : 'items-start'}`}>
                    <div
                      className={`max-w-[75%] px-3 py-2 rounded-2xl text-sm leading-snug ${
                        m.sender === 'owner'
                          ? `bg-green-800 text-white ${m.failed ? 'opacity-50' : ''} rounded-br-sm`
                          : 'bg-white text-slate-800 outline outline-1 outline-stone-200 rounded-bl-sm'
                      }`}
                    >
                      {m.text}
                    </div>
                    {m.failed && <span className="text-[10px] text-red-500 mt-0.5">Failed to send</span>}
                  </div>
                ))}
              </div>

              <div className="p-3 border-t border-stone-200 flex items-end gap-2 shrink-0">
                <textarea
                  value={draft}
                  onChange={e => setDraft(e.target.value)}
                  onKeyDown={handleKeyDown}
                  placeholder="Reply…"
                  rows={1}
                  className="flex-1 resize-none rounded-lg border border-stone-300 px-3 py-2 text-sm outline-none focus:ring-2 focus:ring-green-700/30 max-h-24"
                />
                <button
                  onClick={sendReply}
                  disabled={!draft.trim() || sending}
                  className={`w-9 h-9 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150 ${
                    draft.trim() ? 'bg-green-800 text-white hover:bg-green-900' : 'bg-stone-200 text-stone-400 cursor-not-allowed'
                  }`}
                >
                  <Send className="w-4 h-4" />
                </button>
              </div>
            </>
          )}

          {!active && (
            <button
              onClick={() => { setOpen(false); navigate('/owner/messages') }}
              className="px-4 py-2.5 border-t border-stone-200 flex items-center justify-center gap-2 text-green-800 text-xs font-semibold hover:bg-gray-50 transition-colors duration-150 shrink-0"
            >
              Open full inbox <ExternalLink className="w-3 h-3" />
            </button>
          )}
        </div>
      )}

      <button
        onClick={() => setOpen(v => !v)}
        className="relative w-14 h-14 rounded-full bg-green-800 hover:bg-green-900 active:scale-95 shadow-lg flex items-center justify-center transition-all duration-150"
        title="Messages"
      >
        {open ? <X className="w-6 h-6 text-white" /> : <MessageCircle className="w-6 h-6 text-white" />}
        {!open && totalUnread > 0 && (
          <span className="absolute -top-1 -right-1 w-5 h-5 rounded-full bg-red-500 text-white text-[10px] font-bold flex items-center justify-center outline outline-2 outline-white">
            {totalUnread > 9 ? '9+' : totalUnread}
          </span>
        )}
      </button>
    </div>
  )
}

export default ChatHeadWidget
