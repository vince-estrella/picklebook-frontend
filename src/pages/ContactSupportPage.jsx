import { useState, useEffect, useRef } from 'react'
import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaInstagram,
  FaFacebookF,
  FaCode,
  FaBuilding,
  FaPaperPlane,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Shared design tokens (match HomePage / QueueManager)
// ---------------------------------------------------------------------------
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

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

const STORAGE_KEY = 'picklebook_support_chats_v1'

// ---------------------------------------------------------------------------
// Placeholder org info — swap these for your real details.
// ---------------------------------------------------------------------------
const CONTACT_INFO = [
  { icon: FaEnvelope, label: 'Email', value: 'support@picklebook.app', href: 'mailto:support@picklebook.app' },
  { icon: FaPhoneAlt, label: 'Phone', value: '0976 316 9029', href: 'tel:+639763169029' },
  { icon: FaMapMarkerAlt, label: 'Address', value: 'N. Bacalso Avenue, Cebu City, 6000 Cebu, Philippines' },
  { icon: FaClock, label: 'Hours', value: 'Mon – Sun, 7:00 AM – 9:00 PM' },
]

const SOCIALS = [
  { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com' },
]

const RECIPIENTS = [
  {
    id: 'developer',
    name: 'Admin / Developer',
    desc: 'Bugs, account issues, app questions',
    icon: FaCode,
    autoReply: "Thanks for the message — our dev team will take a look and get back to you shortly.",
  },
  {
    id: 'owner',
    name: 'Court Owner',
    desc: 'Booking issues, court availability, on-site questions',
    icon: FaBuilding,
    autoReply: "Thanks for reaching out — the court owner will respond as soon as they're free.",
  },
]

function loadChats() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return {}
    return JSON.parse(raw)
  } catch {
    return {}
  }
}

function saveChats(chats) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(chats))
  } catch {
    // storage unavailable — chat still works for the session
  }
}

function formatTime(ts) {
  return new Date(ts).toLocaleTimeString([], { hour: 'numeric', minute: '2-digit' })
}

function ContactSupportPage() {
  const navigate = useNavigate()
  const [activeId, setActiveId] = useState(RECIPIENTS[0].id)
  const [chats, setChats] = useState(() => loadChats())
  const [draft, setDraft] = useState('')
  const scrollRef = useRef(null)
  const replyTimers = useRef({})

  useEffect(() => { saveChats(chats) }, [chats])

  useEffect(() => {
    if (scrollRef.current) scrollRef.current.scrollTop = scrollRef.current.scrollHeight
  }, [chats, activeId])

  useEffect(() => () => {
    Object.values(replyTimers.current).forEach(clearTimeout)
  }, [])

  const active = RECIPIENTS.find(r => r.id === activeId)
  const thread = chats[activeId] || []

  const sendMessage = () => {
    const text = draft.trim()
    if (!text) return

    const userMsg = { id: `${Date.now()}-u`, sender: 'user', text, ts: Date.now() }
    setChats(prev => ({ ...prev, [activeId]: [...(prev[activeId] || []), userMsg] }))
    setDraft('')

    // Lightweight placeholder acknowledgement — swap for a real API/socket call later.
    clearTimeout(replyTimers.current[activeId])
    replyTimers.current[activeId] = setTimeout(() => {
      setChats(prev => ({
        ...prev,
        [activeId]: [
          ...(prev[activeId] || []),
          { id: `${Date.now()}-s`, sender: 'support', text: active.autoReply, ts: Date.now() },
        ],
      }))
    }, 900)
  }

  const handleKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault()
      sendMessage()
    }
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .cs-btn:focus-visible { outline: 2px solid ${COLORS.citron}; outline-offset: 2px; }
        .cs-grid { display: grid; grid-template-columns: 340px 1fr; gap: 24px; align-items: start; }
        @media (max-width: 900px) {
          .cs-grid { grid-template-columns: 1fr !important; }
        }
        .cs-scroll::-webkit-scrollbar { width: 6px; }
        .cs-scroll::-webkit-scrollbar-thumb { background: ${COLORS.chalkDim}; border-radius: 999px; }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div style={{ background: COLORS.navy, padding: '48px 32px' }}>
        <div style={{ maxWidth: '1140px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            We're here to help
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 4vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
            Contact Support
          </h1>
          <p style={{ color: '#A9B7B2', fontSize: '15px', marginTop: '10px', maxWidth: '520px' }}>
            Reach out directly below, or start a chat with our team on the right.
          </p>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div style={{ maxWidth: '1140px', margin: '0 auto', padding: '28px 32px 60px' }}>
        <div className="cs-grid">
          {/* ---------- LEFT: INFO ---------- */}
          <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
            <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '22px' }}>
              <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '18px', margin: '0 0 16px', color: COLORS.ink }}>
                Get in Touch
              </h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                  <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                    <div style={{
                      width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                      border: `1.5px solid ${COLORS.citron}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={14} color={COLORS.navy} />
                    </div>
                    <div>
                      <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>{label}</p>
                      {href ? (
                        <a href={href} style={{ fontSize: '14px', color: COLORS.ink, fontWeight: 600, textDecoration: 'none' }}>{value}</a>
                      ) : (
                        <p style={{ margin: '2px 0 0', fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{value}</p>
                      )}
                    </div>
                  </div>
                ))}
              </div>

              <div style={{ borderTop: `1px solid ${COLORS.chalkDim}`, marginTop: '20px', paddingTop: '16px' }}>
                <p style={{ margin: '0 0 10px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>Follow us</p>
                <div style={{ display: 'flex', gap: '10px' }}>
                  {SOCIALS.map(({ icon: Icon, label, href }) => (
                    <a
                      key={label}
                      href={href}
                      target="_blank"
                      rel="noreferrer"
                      title={label}
                      style={{
                        width: '34px', height: '34px', borderRadius: '50%', background: COLORS.chalk,
                        display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.ink,
                      }}
                    >
                      <Icon size={13} />
                    </a>
                  ))}
                </div>
              </div>
            </div>

            <div style={{ background: COLORS.navy, borderRadius: '10px', padding: '20px 22px' }}>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
                Response time
              </p>
              <p style={{ color: COLORS.chalk, fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
                We typically reply within 24 hours. For urgent day-of court issues, use the chat and pick
                <strong style={{ color: COLORS.citron }}> Court Owner</strong> for the fastest response.
              </p>
            </div>
          </div>

          {/* ---------- RIGHT: CHAT ---------- */}
          <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, overflow: 'hidden', display: 'flex', flexDirection: 'column', height: '620px' }}>
            {/* recipient tabs */}
            <div style={{ display: 'flex', borderBottom: `1px solid ${COLORS.chalkDim}` }}>
              {RECIPIENTS.map(r => {
                const isActive = r.id === activeId
                const Icon = r.icon
                return (
                  <button
                    key={r.id}
                    className="cs-btn"
                    onClick={() => setActiveId(r.id)}
                    style={{
                      flex: 1, padding: '14px 16px', border: 'none', cursor: 'pointer', textAlign: 'left',
                      background: isActive ? COLORS.chalk : '#fff',
                      borderBottom: `2px solid ${isActive ? COLORS.teal : 'transparent'}`,
                      display: 'flex', alignItems: 'center', gap: '10px',
                    }}
                  >
                    <div style={{
                      width: '32px', height: '32px', borderRadius: '50%', flexShrink: 0,
                      background: isActive ? COLORS.navy : COLORS.chalk,
                      display: 'flex', alignItems: 'center', justifyContent: 'center',
                    }}>
                      <Icon size={13} color={isActive ? COLORS.citron : COLORS.inkMute} />
                    </div>
                    <div style={{ minWidth: 0 }}>
                      <p style={{ margin: 0, fontSize: '13.5px', fontWeight: 700, color: COLORS.ink, whiteSpace: 'nowrap' }}>{r.name}</p>
                      <p style={{ margin: 0, fontSize: '11px', color: COLORS.inkMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>{r.desc}</p>
                    </div>
                  </button>
                )
              })}
            </div>

            {/* thread */}
            <div ref={scrollRef} className="cs-scroll" style={{ flex: 1, overflowY: 'auto', padding: '18px', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              {thread.length === 0 && (
                <div style={{ margin: 'auto', textAlign: 'center', color: COLORS.inkMute, fontSize: '13.5px', maxWidth: '260px' }}>
                  <p style={{ margin: 0 }}>Start a conversation with {active.name.toLowerCase()}.</p>
                </div>
              )}
              {thread.map(m => (
                <div key={m.id} style={{ display: 'flex', flexDirection: 'column', alignItems: m.sender === 'user' ? 'flex-end' : 'flex-start' }}>
                  <div
                    style={{
                      maxWidth: '75%', padding: '10px 14px', borderRadius: '12px', fontSize: '13.5px', lineHeight: '1.5',
                      background: m.sender === 'user' ? COLORS.navy : COLORS.chalk,
                      color: m.sender === 'user' ? COLORS.chalk : COLORS.ink,
                      borderBottomRightRadius: m.sender === 'user' ? '3px' : '12px',
                      borderBottomLeftRadius: m.sender === 'user' ? '12px' : '3px',
                    }}
                  >
                    {m.text}
                  </div>
                  <span style={{ fontSize: '10.5px', color: COLORS.inkMute, marginTop: '3px', padding: '0 4px' }}>
                    {formatTime(m.ts)}
                  </span>
                </div>
              ))}
            </div>

            {/* composer */}
            <div style={{ borderTop: `1px solid ${COLORS.chalkDim}`, padding: '14px', display: 'flex', gap: '10px', alignItems: 'flex-end' }}>
              <textarea
                value={draft}
                onChange={e => setDraft(e.target.value)}
                onKeyDown={handleKeyDown}
                placeholder={`Message ${active.name}…`}
                rows={1}
                style={{
                  flex: 1, resize: 'none', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px',
                  padding: '11px 14px', fontSize: '14px', fontFamily: "'Inter', sans-serif", outline: 'none',
                  color: COLORS.ink, maxHeight: '100px',
                }}
              />
              <button
                className="cs-btn"
                onClick={sendMessage}
                disabled={!draft.trim()}
                style={{
                  background: draft.trim() ? COLORS.citron : COLORS.chalkDim,
                  color: draft.trim() ? COLORS.navyDeep : COLORS.inkMute,
                  border: 'none', borderRadius: '8px', width: '42px', height: '42px', flexShrink: 0,
                  display: 'flex', alignItems: 'center', justifyContent: 'center',
                  cursor: draft.trim() ? 'pointer' : 'not-allowed',
                }}
              >
                <FaPaperPlane size={14} />
              </button>
            </div>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div style={{ background: COLORS.navyDeep, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p
            onClick={() => navigate('/')}
            style={{ color: COLORS.chalk, fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 700, fontSize: '18px', margin: 0, letterSpacing: '0.02em', cursor: 'pointer' }}
          >
            PICKLEBOOK
          </p>
          <p style={{ color: '#5B6864', fontSize: '12px', margin: '4px 0 0' }}>High-performance court management.</p>
        </div>
      </div>
    </div>
  )
}

export default ContactSupportPage
