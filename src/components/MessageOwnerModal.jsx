import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { X, Send, AlertCircle } from 'lucide-react'
import api from '../services/api'

// Same palette as CourtDetailPage / MyBookingsPage / HomePage.
const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  citronHover: '#C3CC1F',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const POLL_MS = 8000

function formatTimestamp(iso) {
  if (!iso) return ''
  const d = new Date(iso)
  const isToday = d.toDateString() === new Date().toDateString()
  return isToday
    ? d.toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
    : d.toLocaleDateString([], { month: 'short', day: 'numeric' })
}

// courtId: the court being asked about. ownerName: display name for the
// header (falls back gracefully if the backend doesn't expose one yet).
// onClose: closes the modal.
function MessageOwnerModal({ courtId, ownerName, onClose }) {
  const navigate = useNavigate()
  const [conversationId, setConversationId] = useState(null)
  const [messages, setMessages] = useState([])
  const [draft, setDraft] = useState('')
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)
  const [sending, setSending] = useState(false)
  const scrollRef = useRef(null)
  const pollRef = useRef(null)

  const isLoggedIn = !!localStorage.getItem('playerToken')

  useEffect(() => {
    if (!isLoggedIn) {
      setLoading(false)
      return
    }

    api.post('/messages/start', { courtId })
      .then(res => {
        const id = res.data.conversationId
        setConversationId(id)
        return api.get(`/messages/conversations/${id}/messages`)
      })
      .then(res => {
        setMessages(res.data || [])
        setLoading(false)
      })
      .catch(() => {
        setError('Could not start this conversation. Please try again.')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [courtId])

  // Mark as read once the thread's loaded, and poll for new replies while open.
  useEffect(() => {
    if (!conversationId) return
    api.patch(`/messages/conversations/${conversationId}/read`).catch(() => {})

    pollRef.current = setInterval(() => {
      api.get(`/messages/conversations/${conversationId}/messages`)
        .then(res => setMessages(res.data || []))
        .catch(() => {})
    }, POLL_MS)

    return () => clearInterval(pollRef.current)
  }, [conversationId])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [messages])

  const sendMessage = () => {
    const text = draft.trim()
    if (!text || !conversationId || sending) return

    const optimistic = { id: `temp-${Date.now()}`, sender: 'player', text, createdAt: new Date().toISOString(), pending: true }
    setMessages(prev => [...prev, optimistic])
    setDraft('')
    setSending(true)

    api.post(`/messages/conversations/${conversationId}/messages`, { text })
      .then(res => {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? (res.data || { ...optimistic, pending: false }) : m))
      })
      .catch(() => {
        setMessages(prev => prev.map(m => m.id === optimistic.id ? { ...m, failed: true, pending: false } : m))
      })
      .finally(() => setSending(false))
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4"
      style={{ background: 'rgba(11,42,56,0.45)' }}
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md rounded-2xl shadow-2xl overflow-hidden flex flex-col"
        style={{ background: '#fff', maxHeight: '600px' }}
      >
        {/* Header */}
        <div className="px-5 py-4 flex items-center justify-between shrink-0" style={{ background: COLORS.navy }}>
          <div>
            <p className="text-sm font-semibold" style={{ color: COLORS.chalk }}>
              Message {ownerName || 'the court owner'}
            </p>
            <p className="text-xs" style={{ color: COLORS.citron }}>Usually replies within a day</p>
          </div>
          <button onClick={onClose} className="shrink-0" style={{ color: COLORS.chalk }}>
            <X size={18} />
          </button>
        </div>

        {/* Body */}
        {!isLoggedIn ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-4 p-8 text-center">
            <p style={{ color: COLORS.inkMute }}>Log in as a player to message this court's owner.</p>
            <button
              onClick={() => navigate('/login')}
              className="px-6 py-2.5 rounded-lg font-semibold text-sm"
              style={{ background: COLORS.citron, color: COLORS.navyDeep }}
            >
              Log In
            </button>
          </div>
        ) : loading ? (
          <div className="flex-1 flex items-center justify-center p-8">
            <p style={{ color: COLORS.inkMute }} className="text-sm">Loading…</p>
          </div>
        ) : error ? (
          <div className="flex-1 flex flex-col items-center justify-center gap-2 p-8 text-center">
            <AlertCircle size={20} style={{ color: '#B43535' }} />
            <p style={{ color: '#B43535' }} className="text-sm">{error}</p>
          </div>
        ) : (
          <>
            <div ref={scrollRef} className="flex-1 overflow-y-auto p-4 flex flex-col gap-2" style={{ background: COLORS.chalk, minHeight: '280px' }}>
              {messages.length === 0 && (
                <p className="m-auto text-sm" style={{ color: COLORS.inkMute }}>
                  Send a message to ask about this court — availability, group rates, anything.
                </p>
              )}
              {messages.map(m => (
                <div key={m.id} className={`flex flex-col ${m.sender === 'player' ? 'items-end' : 'items-start'}`}>
                  <div
                    className="max-w-[75%] px-3.5 py-2 rounded-2xl text-sm leading-snug"
                    style={
                      m.sender === 'player'
                        ? { background: COLORS.teal, color: '#fff', opacity: m.failed ? 0.5 : 1, borderBottomRightRadius: '4px' }
                        : { background: '#fff', color: COLORS.ink, border: `1px solid ${COLORS.chalkDim}`, borderBottomLeftRadius: '4px' }
                    }
                  >
                    {m.text}
                  </div>
                  <span className="text-[11px] mt-1 px-1" style={{ color: COLORS.inkMute }}>
                    {m.failed ? 'Failed to send' : formatTimestamp(m.createdAt)}
                  </span>
                </div>
              ))}
            </div>

            <div className="p-3 flex items-end gap-2 shrink-0" style={{ borderTop: `1px solid ${COLORS.chalkDim}` }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder="Type a message…"
                rows={1}
                className="flex-1 resize-none rounded-lg px-3 py-2 text-sm outline-none max-h-24"
                style={{ border: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }}
              />
              <button
                onClick={sendMessage}
                disabled={!draft.trim() || sending}
                className="w-10 h-10 rounded-lg flex items-center justify-center shrink-0 transition-colors duration-150"
                style={
                  draft.trim()
                    ? { background: COLORS.teal, color: '#fff', cursor: 'pointer' }
                    : { background: COLORS.chalkDim, color: '#93A29C', cursor: 'not-allowed' }
                }
              >
                <Send size={16} />
              </button>
            </div>
          </>
        )}
      </div>
    </div>
  )
}

export default MessageOwnerModal
