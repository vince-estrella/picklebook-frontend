import { useState, useEffect, useMemo, useRef } from 'react'
import { FaBed, FaClock, FaCheckCircle } from 'react-icons/fa'
import { subscribeRoomState, submitJoinRequest, roomExists } from '../lib/roomSync'

// Same design tokens as QueueManager — kept local here so this page can be
// dropped in on its own route without pulling in the rest of the app.
const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro']
const DEFAULT_SKILL = 'Beginner'

const inputStyle = {
  width: '100%',
  padding: '13px 14px',
  borderRadius: '8px',
  border: '1px solid #D5DAD1',
  fontSize: '16px', // 16px avoids iOS auto-zoom on focus
  fontFamily: "'Inter', sans-serif",
  color: COLORS.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

// sessionStorage (not localStorage) on purpose: it's scoped to this one tab,
// so joining as a second "player" in another tab/window on the same device
// can't overwrite the first player's saved identity. It still survives a
// reload of *this* tab, which is all "remember me if I refresh" needs.
function joinStorageKey(code) {
  return `picklebook_join_${code}`
}

function playSuccessTone() {
  try {
    const Ctx = window.AudioContext || window.webkitAudioContext
    const ctx = new Ctx()
    const osc = ctx.createOscillator()
    const gain = ctx.createGain()
    osc.connect(gain)
    gain.connect(ctx.destination)
    osc.type = 'sine'
    osc.frequency.setValueAtTime(660, ctx.currentTime)
    osc.frequency.setValueAtTime(880, ctx.currentTime + 0.12)
    gain.gain.setValueAtTime(0.15, ctx.currentTime)
    gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.5)
    osc.start()
    osc.stop(ctx.currentTime + 0.5)
  } catch {
    // Web Audio unavailable — silently skip the sound
  }
}

function JoinQueuePage() {
  const initialCode = useMemo(() => {
    const params = new URLSearchParams(window.location.search)
    return (params.get('code') || '').toUpperCase()
  }, [])

  const [code, setCode] = useState(initialCode)
  const [codeInput, setCodeInput] = useState(initialCode)
  const [checkingCode, setCheckingCode] = useState(false)
  const [codeError, setCodeError] = useState('')

  const [roomState, setRoomState] = useState(null) // { players, courts }
  const [myRequestId, setMyRequestId] = useState(() => (code ? sessionStorage.getItem(joinStorageKey(code)) : null))
  const [nameInput, setNameInput] = useState('')
  const [skillInput, setSkillInput] = useState(DEFAULT_SKILL)
  const [submitting, setSubmitting] = useState(false)

  const prevStatusRef = useRef(null)

  // subscribe once we have a confirmed room code
  useEffect(() => {
    if (!code) return
    const unsubscribe = subscribeRoomState(code, setRoomState)
    return unsubscribe
  }, [code])

  const me = useMemo(() => {
    if (!roomState?.players || !myRequestId) return null
    return roomState.players.find(p => p.joinRequestId === myRequestId) || null
  }, [roomState, myRequestId])

  const myCourt = useMemo(() => {
    if (!me || me.status !== 'playing' || !roomState?.courts) return null
    return roomState.courts.find(c => c.id === me.courtId) || null
  }, [me, roomState])

  const waitingList = useMemo(() => {
    if (!roomState?.players) return []
    return roomState.players
      .filter(p => p.status === 'waiting')
      .sort((a, b) => a.gamesPlayed - b.gamesPlayed || a.joinedAt - b.joinedAt)
  }, [roomState])

  const myPosition = me?.status === 'waiting'
    ? waitingList.findIndex(p => p.id === me.id) + 1
    : null

  // Notify the moment status flips to "playing"
  useEffect(() => {
    if (!me) return
    const prev = prevStatusRef.current
    if (prev && prev !== 'playing' && me.status === 'playing') {
      playSuccessTone()
      if (navigator.vibrate) navigator.vibrate([120, 60, 120])
      if ('Notification' in window && Notification.permission === 'granted') {
        new Notification("You're up! 🎾", { body: `Head to ${myCourt?.name || 'your court'} now.` })
      }
    }
    prevStatusRef.current = me.status
  }, [me, myCourt])

  useEffect(() => {
    if ('Notification' in window && Notification.permission === 'default') {
      Notification.requestPermission().catch(() => {})
    }
  }, [])

  const handleCodeSubmit = async (e) => {
    e.preventDefault()
    const clean = codeInput.trim().toUpperCase()
    if (!clean) return
    setCheckingCode(true)
    setCodeError('')
    try {
      const exists = await roomExists(clean)
      if (!exists) {
        setCodeError("Couldn't find a session with that code. Double check with the host.")
        setCheckingCode(false)
        return
      }
      setCode(clean)
      const url = new URL(window.location.href)
      url.searchParams.set('code', clean)
      window.history.replaceState({}, '', url)
      setMyRequestId(sessionStorage.getItem(joinStorageKey(clean)))
    } catch {
      setCodeError('Something went wrong checking that code — try again.')
    }
    setCheckingCode(false)
  }

  const handleJoinSubmit = async (e) => {
    e.preventDefault()
    if (!nameInput.trim()) return
    setSubmitting(true)
    try {
      const requestId = await submitJoinRequest(code, { name: nameInput.trim(), skill: skillInput })
      sessionStorage.setItem(joinStorageKey(code), requestId)
      setMyRequestId(requestId)
    } catch {
      setCodeError('Could not submit your name — check your connection and try again.')
    }
    setSubmitting(false)
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>

      <div style={{ background: COLORS.navy, padding: '32px 20px 40px' }}>
        <div style={{ maxWidth: '480px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            Open Play Session
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: '32px', color: COLORS.chalk, margin: 0, textTransform: 'uppercase' }}>
            Join the Queue
          </h1>
        </div>
      </div>

      <div style={{ maxWidth: '480px', margin: '-24px auto 0', padding: '0 20px 60px' }}>
        {!code && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: '13.5px', color: COLORS.inkMute, margin: '0 0 16px' }}>
              Enter the room code shown at the courts.
            </p>
            <form onSubmit={handleCodeSubmit}>
              <input
                autoFocus
                value={codeInput}
                onChange={e => setCodeInput(e.target.value.toUpperCase())}
                placeholder="ROOM CODE"
                style={{ ...inputStyle, textAlign: 'center', letterSpacing: '0.2em', fontFamily: "'JetBrains Mono', monospace", fontSize: '22px', marginBottom: '14px' }}
                maxLength={8}
              />
              {codeError && <p style={{ color: '#B3453D', fontSize: '13px', margin: '0 0 12px' }}>{codeError}</p>}
              <button
                type="submit"
                disabled={checkingCode || !codeInput.trim()}
                style={{
                  width: '100%', padding: '13px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px',
                  background: COLORS.citron, color: COLORS.navyDeep, cursor: checkingCode ? 'not-allowed' : 'pointer',
                  opacity: checkingCode || !codeInput.trim() ? 0.6 : 1,
                }}
              >
                {checkingCode ? 'Checking…' : 'Continue'}
              </button>
            </form>
          </div>
        )}

        {code && !myRequestId && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '22px', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <p style={{ fontSize: '13.5px', color: COLORS.inkMute, margin: '0 0 16px' }}>
              You're joining session <strong style={{ color: COLORS.ink }}>{code}</strong>. Enter your name to get in line.
            </p>
            <form onSubmit={handleJoinSubmit}>
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>Your name</label>
              <input
                autoFocus
                value={nameInput}
                onChange={e => setNameInput(e.target.value)}
                placeholder="e.g. Jane Smith"
                style={{ ...inputStyle, marginBottom: '14px' }}
              />
              <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>Skill level</label>
              <select value={skillInput} onChange={e => setSkillInput(e.target.value)} style={{ ...inputStyle, marginBottom: '18px' }}>
                {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
              </select>
              {codeError && <p style={{ color: '#B3453D', fontSize: '13px', margin: '0 0 12px' }}>{codeError}</p>}
              <button
                type="submit"
                disabled={submitting || !nameInput.trim()}
                style={{
                  width: '100%', padding: '13px', borderRadius: '8px', border: 'none', fontWeight: 700, fontSize: '15px',
                  background: COLORS.citron, color: COLORS.navyDeep, cursor: submitting ? 'not-allowed' : 'pointer',
                  opacity: submitting || !nameInput.trim() ? 0.6 : 1,
                }}
              >
                {submitting ? 'Joining…' : 'Join Queue'}
              </button>
            </form>
          </div>
        )}

        {code && myRequestId && !me && (
          <div style={{ background: '#fff', borderRadius: '12px', padding: '30px 22px', textAlign: 'center', boxShadow: '0 10px 30px rgba(0,0,0,0.08)' }}>
            <div className="jq-spin" style={{ width: '28px', height: '28px', margin: '0 auto 14px', border: `3px solid ${COLORS.chalkDim}`, borderTopColor: COLORS.teal, borderRadius: '50%', animation: 'jq-spin 0.8s linear infinite' }} />
            <style>{`@keyframes jq-spin { to { transform: rotate(360deg); } }`}</style>
            <p style={{ fontSize: '14px', color: COLORS.inkMute, margin: 0 }}>
              Waiting for the host to add you to the queue…
            </p>
          </div>
        )}

        {code && me && (
          <>
            <StatusCard me={me} myCourt={myCourt} myPosition={myPosition} waitingCount={waitingList.length} />

            <div style={{ marginTop: '18px', background: '#fff', borderRadius: '12px', border: `1px solid ${COLORS.chalkDim}`, overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '15px', margin: 0, padding: '14px 18px', borderBottom: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }}>
                Waiting List
              </h2>
              {waitingList.length === 0 ? (
                <p style={{ padding: '20px 18px', fontSize: '13px', color: COLORS.inkMute, textAlign: 'center' }}>Nobody's waiting right now.</p>
              ) : (
                waitingList.map((p, i) => (
                  <div
                    key={p.id}
                    style={{
                      display: 'flex', alignItems: 'center', gap: '10px', padding: '10px 18px',
                      borderBottom: `1px solid ${COLORS.chalkDim}`,
                      background: p.id === me.id ? '#FBFAD9' : 'transparent',
                    }}
                  >
                    <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: COLORS.inkMute, width: '20px' }}>
                      {String(i + 1).padStart(2, '0')}
                    </span>
                    <span style={{ fontSize: '13.5px', fontWeight: p.id === me.id ? 700 : 500, color: COLORS.ink, flex: 1 }}>
                      {p.name}{p.id === me.id ? ' (you)' : ''}
                    </span>
                    <span style={{ fontSize: '10.5px', color: COLORS.inkMute, border: '1px solid #D5DAD1', borderRadius: '999px', padding: '1px 7px' }}>
                      {p.skill || DEFAULT_SKILL}
                    </span>
                  </div>
                ))
              )}
            </div>
          </>
        )}
      </div>
    </div>
  )
}

function StatusCard({ me, myCourt, myPosition, waitingCount }) {
  if (me.status === 'playing') {
    return (
      <div style={{ background: COLORS.citron, borderRadius: '12px', padding: '26px 22px', textAlign: 'center' }}>
        <FaCheckCircle size={26} color={COLORS.navyDeep} style={{ marginBottom: '8px' }} />
        <p style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: '26px', textTransform: 'uppercase', color: COLORS.navyDeep, margin: '0 0 4px' }}>
          You're up!
        </p>
        <p style={{ fontSize: '14px', color: COLORS.navyDeep, margin: 0, fontWeight: 600 }}>
          Head to {myCourt?.name || 'your court'} now
        </p>
      </div>
    )
  }
  if (me.status === 'resting') {
    return (
      <div style={{ background: '#fff', borderRadius: '12px', padding: '24px 22px', textAlign: 'center', border: `1px solid ${COLORS.chalkDim}` }}>
        <FaBed size={20} color={COLORS.inkMute} style={{ marginBottom: '8px' }} />
        <p style={{ fontSize: '15px', fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' }}>You're resting</p>
        <p style={{ fontSize: '13px', color: COLORS.inkMute, margin: 0 }}>Let the host know when you're ready to play again.</p>
      </div>
    )
  }
  return (
    <div style={{ background: '#fff', borderRadius: '12px', padding: '24px 22px', textAlign: 'center', border: `1px solid ${COLORS.chalkDim}` }}>
      <FaClock size={20} color={COLORS.teal} style={{ marginBottom: '8px' }} />
      <p style={{ fontSize: '15px', fontWeight: 700, color: COLORS.ink, margin: '0 0 4px' }}>
        {myPosition ? `You're #${myPosition} in line` : "You're in the queue"}
      </p>
      <p style={{ fontSize: '13px', color: COLORS.inkMute, margin: 0 }}>
        {waitingCount} waiting · keep this page open — you'll be notified the moment you're on a court
      </p>
    </div>
  )
}

export default JoinQueuePage