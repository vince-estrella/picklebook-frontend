import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Camera, Check, Loader2 } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Design tokens — shared with QueueManager/HomePage so this page reads as
// the same product: court navy, chalk-line white, citron accent, scoreboard mono.
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

const inputStyle = {
  width: '100%',
  padding: '10px 12px',
  borderRadius: '6px',
  border: '1px solid #D5DAD1',
  fontSize: '14px',
  fontFamily: "'Inter', sans-serif",
  color: COLORS.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

// ---------------------------------------------------------------------------
// Small shared UI primitives (mirrors QueueManager's Button)
// ---------------------------------------------------------------------------
function Button({ variant = 'ghost', size = 'md', icon, children, ...props }) {
  const base = {
    primary: { background: COLORS.citron, color: COLORS.navyDeep, border: 'none' },
    outline: { background: 'transparent', color: COLORS.chalk, border: `1px solid rgba(238,241,234,0.35)` },
    outlineDark: { background: 'transparent', color: COLORS.ink, border: `1px solid #C9D0C6` },
    danger: { background: 'transparent', color: '#B3453D', border: '1px solid #E3C3C0' },
    ghost: { background: 'transparent', color: COLORS.inkMute, border: 'none' },
  }[variant]

  const sizing = {
    sm: { padding: '7px 12px', fontSize: '13px' },
    md: { padding: '10px 16px', fontSize: '14px' },
    lg: { padding: '14px 24px', fontSize: '15px' },
  }[size]

  const hoverBg = {
    primary: COLORS.citronHover,
    outline: 'rgba(238,241,234,0.08)',
    outlineDark: '#F2F4EF',
    danger: '#FBEDEC',
    ghost: '#EEF1EA',
  }[variant]

  return (
    <button
      {...props}
      style={{
        ...base,
        ...sizing,
        borderRadius: '5px',
        fontWeight: 600,
        cursor: 'pointer',
        display: 'inline-flex',
        alignItems: 'center',
        justifyContent: 'center',
        gap: '8px',
        transition: 'background 0.15s ease, opacity 0.15s ease',
        whiteSpace: 'nowrap',
        ...(props.disabled ? { opacity: 0.4, cursor: 'not-allowed' } : {}),
        ...(props.style || {}),
      }}
      onMouseEnter={e => { if (!props.disabled) e.currentTarget.style.background = hoverBg }}
      onMouseLeave={e => { if (!props.disabled) e.currentTarget.style.background = base.background }}
    >
      {icon}
      {children}
    </button>
  )
}

function Card({ title, subtitle, children }) {
  return (
    <section
      style={{
        background: '#fff',
        borderRadius: '10px',
        border: `1px solid ${COLORS.chalkDim}`,
        overflow: 'hidden',
      }}
    >
      <div style={{ padding: '18px 22px', borderBottom: `1px solid ${COLORS.chalkDim}` }}>
        <h2
          style={{
            fontFamily: "'Big Shoulders Display', sans-serif",
            textTransform: 'uppercase',
            fontSize: '18px',
            margin: 0,
            color: COLORS.ink,
            letterSpacing: '0.01em',
          }}
        >
          {title}
        </h2>
        {subtitle && (
          <p style={{ fontSize: '13px', color: COLORS.inkMute, margin: '6px 0 0' }}>{subtitle}</p>
        )}
      </div>
      <div style={{ padding: '20px 22px' }}>{children}</div>
    </section>
  )
}

function FieldLabel({ children }) {
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10.5px',
        letterSpacing: '0.08em',
        textTransform: 'uppercase',
        color: COLORS.inkMute,
        fontWeight: 600,
      }}
    >
      {children}
    </span>
  )
}

function StatusMessage({ status }) {
  if (status === 'success') {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '10.5px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '3px 8px', borderRadius: '999px',
          background: '#E7EEE9', color: COLORS.teal, fontWeight: 600,
        }}
      >
        <Check className="w-3 h-3" /> Saved
      </span>
    )
  }

  if (status === 'error') {
    return (
      <span
        style={{
          display: 'inline-flex', alignItems: 'center', gap: '6px',
          fontSize: '10.5px', fontFamily: "'JetBrains Mono', monospace", letterSpacing: '0.06em',
          textTransform: 'uppercase', padding: '3px 8px', borderRadius: '999px',
          background: '#FBEDEC', color: '#B3453D', fontWeight: 600,
        }}
      >
        <AlertCircle className="w-3 h-3" /> Error — try again
      </span>
    )
  }

  return null
}

function PlayerSettingsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({ email: '', profileImageUrl: '' })
  const [loading, setLoading] = useState(true)

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState('idle')

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [emailError, setEmailError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('playerToken')) {
      navigate('/login')
      return
    }

    api.get('/users/profile')
      .then(res => {
        setProfile(res.data)
        setNewEmail(res.data.email || '')
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [navigate])

  const updateStoredPlayer = (updates) => {
    const stored = JSON.parse(localStorage.getItem('player') || '{}')
    localStorage.setItem('player', JSON.stringify({ ...stored, ...updates }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    setAvatarStatus('idle')

    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleAvatarSave = async () => {
    if (!avatarFile) return

    setAvatarStatus('saving')

    try {
      const formData = new FormData()
      formData.append('image', avatarFile)

      const res = await api.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const profileImageUrl = res.data?.profileImageUrl || avatarPreview

      setProfile(p => ({ ...p, profileImageUrl }))
      updateStoredPlayer({ profileImageUrl })
      setAvatarFile(null)
      setAvatarStatus('success')
    } catch {
      setAvatarStatus('error')
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }

    if (!emailPassword) {
      setEmailError('Enter your current password to confirm this change.')
      return
    }

    setEmailStatus('saving')

    try {
      await api.put('/users/email', {
        email: newEmail,
        currentPassword: emailPassword,
      })

      setProfile(p => ({ ...p, email: newEmail }))
      updateStoredPlayer({ email: newEmail })
      setEmailPassword('')
      setEmailStatus('success')
    } catch {
      setEmailStatus('error')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordStatus('saving')

    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus('success')
    } catch {
      setPasswordStatus('error')
    }
  }

  if (loading) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: COLORS.chalk, fontFamily: "'Inter', sans-serif", color: COLORS.inkMute }}>
        <style>{FONT_IMPORT}</style>
        <Loader2 className="w-5 h-5 animate-spin" style={{ marginRight: '10px' }} />
        Loading…
      </div>
    )
  }

  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const displayedAvatar = avatarPreview || profile.profileImageUrl || player.profileImageUrl

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .ps-input:focus { border-color: ${COLORS.teal} !important; box-shadow: 0 0 0 3px rgba(15,107,92,0.12); }
        .ps-btn:focus-visible { outline: 2px solid ${COLORS.citron}; outline-offset: 2px; }
        .ps-avatar-btn { transition: transform 0.15s ease; }
        .ps-avatar-btn:hover { transform: scale(1.03); }

        @media (max-width: 640px) {
          .ps-header-wrap { padding: 28px 16px !important; }
          .ps-body-wrap { padding: 20px 16px 40px !important; }
        }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div className="ps-header-wrap" style={{ background: COLORS.navy, padding: '40px 32px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            Player Account
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 6vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
            Settings
          </h1>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <main className="ps-body-wrap" style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 32px 60px', display: 'flex', flexDirection: 'column', gap: '20px' }}>

        {/* ---------- PROFILE PICTURE ---------- */}
        <Card title="Profile Picture" subtitle="Shown on your player account.">
          <div style={{ display: 'flex', alignItems: 'center', gap: '20px', flexWrap: 'wrap' }}>
            <button
              type="button"
              className="ps-avatar-btn"
              onClick={() => fileInputRef.current?.click()}
              title="Change photo"
              style={{
                position: 'relative', width: '80px', height: '80px', borderRadius: '50%',
                overflow: 'hidden', background: COLORS.chalk, border: `2px solid ${COLORS.chalkDim}`,
                display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0,
                cursor: 'pointer', padding: 0,
              }}
            >
              {displayedAvatar ? (
                <img src={displayedAvatar} style={{ width: '100%', height: '100%', objectFit: 'cover' }} alt="Profile" />
              ) : (
                <span style={{ color: COLORS.inkMute, fontSize: '26px', fontWeight: 700, fontFamily: "'Big Shoulders Display', sans-serif" }}>?</span>
              )}
              <span
                style={{
                  position: 'absolute', inset: 0, background: 'rgba(11,42,56,0.55)',
                  display: 'flex', alignItems: 'center', justifyContent: 'center', opacity: 0,
                  transition: 'opacity 0.15s ease',
                }}
                onMouseEnter={e => e.currentTarget.style.opacity = 1}
                onMouseLeave={e => e.currentTarget.style.opacity = 0}
              >
                <Camera className="w-5 h-5" style={{ color: COLORS.chalk }} />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              style={{ display: 'none' }}
            />

            <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button className="ps-btn" type="button" variant="outlineDark" size="sm" onClick={() => fileInputRef.current?.click()}>
                  Choose Photo
                </Button>
                <Button
                  className="ps-btn"
                  type="button"
                  variant="primary"
                  size="sm"
                  disabled={!avatarFile || avatarStatus === 'saving'}
                  onClick={handleAvatarSave}
                  icon={avatarStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
                >
                  Save Photo
                </Button>
              </div>
              <StatusMessage status={avatarStatus} />
            </div>
          </div>
        </Card>

        {/* ---------- EMAIL ---------- */}
        <Card
          title="Email Address"
          subtitle={<>Currently <strong style={{ color: COLORS.ink }}>{profile.email || 'not set'}</strong></>}
        >
          <form onSubmit={handleEmailSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '380px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>New Email</FieldLabel>
              <input
                type="email"
                className="ps-input"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                style={inputStyle}
                placeholder="you@example.com"
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>Current Password</FieldLabel>
              <input
                type="password"
                className="ps-input"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                style={inputStyle}
                placeholder="Confirm it is you"
              />
            </label>

            {emailError && (
              <p style={{ fontSize: '13px', color: '#B3453D', fontWeight: 500, margin: 0 }}>{emailError}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <Button
                className="ps-btn"
                type="submit"
                variant="primary"
                disabled={emailStatus === 'saving'}
                icon={emailStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              >
                Update Email
              </Button>
              <StatusMessage status={emailStatus} />
            </div>
          </form>
        </Card>

        {/* ---------- PASSWORD ---------- */}
        <Card title="Password" subtitle="Use at least 8 characters.">
          <form onSubmit={handlePasswordSubmit} style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxWidth: '380px' }}>
            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>Current Password</FieldLabel>
              <input
                type="password"
                className="ps-input"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>New Password</FieldLabel>
              <input
                type="password"
                className="ps-input"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            <label style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <FieldLabel>Confirm New Password</FieldLabel>
              <input
                type="password"
                className="ps-input"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                style={inputStyle}
              />
            </label>

            {passwordError && (
              <p style={{ fontSize: '13px', color: '#B3453D', fontWeight: 500, margin: 0 }}>{passwordError}</p>
            )}

            <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginTop: '4px' }}>
              <Button
                className="ps-btn"
                type="submit"
                variant="primary"
                disabled={passwordStatus === 'saving'}
                icon={passwordStatus === 'saving' ? <Loader2 className="w-3.5 h-3.5 animate-spin" /> : null}
              >
                Update Password
              </Button>
              <StatusMessage status={passwordStatus} />
            </div>
          </form>
        </Card>
      </main>
    </div>
  )
}

export default PlayerSettingsPage