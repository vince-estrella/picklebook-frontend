import { useState, useEffect, useMemo, useCallback, useRef } from 'react'
import {
  FaSearch,
  FaTrashAlt,
  FaLock,
  FaLockOpen,
  FaExchangeAlt,
  FaLink,
  FaUnlink,
  FaChevronUp,
  FaChevronDown,
  FaTimes,
  FaRandom,
  FaUndo,
  FaSyncAlt,
  FaUserPlus,
  FaBed,
  FaPlay,
  FaFlagCheckered,
  FaQrcode,
  FaCopy,
  FaCheck,
  FaWifi,
} from 'react-icons/fa'
import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../components/Navbar'
import {
  makeRoomCode,
  publishState,
  subscribeJoinRequests,
  clearJoinRequest,
  closeRoom,
} from '../lib/roomSync'

// ---------------------------------------------------------------------------
// Design tokens — shared with HomePage so this page reads as the same
// product: court navy, chalk-line white, citron accent, scoreboard mono.
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

const STORAGE_KEY = 'picklebook_queue_state_v1'
const ROOM_KEY = 'picklebook_room_code_v1'
const COURT_COUNT = 3
const SKILL_LEVELS = ['Beginner', 'Intermediate', 'Advanced', 'Pro']
const DEFAULT_SKILL = 'Beginner'

// Set this to wherever JoinQueuePage is mounted in your router, e.g. '/join'
const JOIN_PATH = '/join'

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let uidCounter = 0
const uid = () => `id-${Date.now()}-${(uidCounter++).toString(36)}-${Math.random().toString(36).slice(2, 8)}`

function emptyCourts() {
  return Array.from({ length: COURT_COUNT }, (_, i) => ({
    id: i + 1,
    name: `Court ${i + 1}`,
    locked: false,
    teamA: [],
    teamB: [],
  }))
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    const parsed = JSON.parse(raw)
    if (!parsed.players || !parsed.courts) return null
    return parsed
  } catch {
    return null
  }
}

function saveState(players, courts) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify({ players, courts }))
  } catch {
    // storage unavailable — fail silently, session still works in memory
  }
}

function clone(obj) {
  return JSON.parse(JSON.stringify(obj))
}

function shuffle(arr) {
  const a = [...arr]
  for (let i = a.length - 1; i > 0; i--) {
    const j = Math.floor(Math.random() * (i + 1))
    ;[a[i], a[j]] = [a[j], a[i]]
  }
  return a
}

/**
 * Parses bulk textarea input into { name, skill } entries.
 * Each line is one player. A line may optionally include a skill after a
 * comma or dash (e.g. "Jane Smith, Intermediate" or "Jane Smith - Pro").
 * Lines with no recognizable skill fall back to the modal's default skill,
 * and an empty/unrecognized skill ultimately resolves to "Beginner" when
 * the player is created.
 */
function parseBulkInput(text, defaultSkill) {
  return text
    .split('\n')
    .map(line => line.trim())
    .filter(Boolean)
    .map(line => {
      const parts = line.split(/,| - /).map(s => s.trim()).filter(Boolean)
      if (parts.length >= 2) {
        const matchedSkill = SKILL_LEVELS.find(s => s.toLowerCase() === parts[1].toLowerCase())
        if (matchedSkill) {
          return { name: parts[0], skill: matchedSkill }
        }
      }
      return { name: line, skill: defaultSkill || '' }
    })
}

/**
 * Orders the waiting list for matchmaking: lower games-played always goes
 * first (fairness), but players tied on games-played are shuffled randomly
 * every time this runs, instead of falling back to a fixed join-order —
 * that fixed tie-break was why the same foursomes kept re-forming.
 */
function priorityQueue(players) {
  const waiting = players.filter(p => p.status === 'waiting')
  const tiers = new Map()
  for (const p of waiting) {
    if (!tiers.has(p.gamesPlayed)) tiers.set(p.gamesPlayed, [])
    tiers.get(p.gamesPlayed).push(p)
  }
  const orderedKeys = [...tiers.keys()].sort((a, b) => a - b)
  return orderedKeys.flatMap(k => shuffle(tiers.get(k)))
}

/** How strongly two players have partnered recently — higher = avoid pairing again. */
function repeatScore(x, y) {
  let score = 0
  if (x.lastPartnerId === y.id) score += 2
  if ((x.partnerHistory || []).includes(y.id)) score += 1
  if ((y.partnerHistory || []).includes(x.id)) score += 1
  return score
}

function recordPartner(p, partnerId) {
  p.lastPartnerId = partnerId
  p.partnerHistory = [partnerId, ...(p.partnerHistory || [])].slice(0, 3)
}

/**
 * Splits a group of 4 players into two teams of 2.
 * Respects a fixed pair if one exists within the group; otherwise chooses
 * the split that least repeats each player's most recent teammate.
 */
function splitIntoTeams(fourInput) {
  const four = shuffle(fourInput)
  const pairId = four.find(p => p.fixedPairId)?.fixedPairId
  if (pairId) {
    const pairMembers = four.filter(p => p.fixedPairId === pairId)
    if (pairMembers.length === 2) {
      const others = four.filter(p => p.fixedPairId !== pairId)
      return { teamA: pairMembers, teamB: others }
    }
  }

  const combos = shuffle([
    [[0, 1], [2, 3]],
    [[0, 2], [1, 3]],
    [[0, 3], [1, 2]],
  ])
  let best = combos[0]
  let bestScore = Infinity
  for (const combo of combos) {
    const [a, b] = combo[0].map(i => four[i])
    const [c, d] = combo[1].map(i => four[i])
    const score = repeatScore(a, b) + repeatScore(c, d)
    if (score < bestScore) {
      bestScore = score
      best = combo
    }
  }
  const teamA = best[0].map(i => four[i])
  const teamB = best[1].map(i => four[i])
  return { teamA, teamB }
}

/**
 * Selects up to 4 players from a candidate list (already in priority order),
 * keeping a fixed pair together whenever both members are present in the
 * candidate list. Returns null if fewer than 4 could be assembled.
 */
function selectGroupFrom(candidates) {
  const selected = []
  const used = new Set()
  for (let i = 0; i < candidates.length && selected.length < 4; i++) {
    const p = candidates[i]
    if (used.has(p.id)) continue
    if (p.fixedPairId && selected.length === 3) {
      // adding this player's partner would overflow the group — skip for now,
      // they'll anchor the next group instead.
      const partnerAvailable = candidates.some(q => q.fixedPairId === p.fixedPairId && q.id !== p.id && !used.has(q.id))
      if (partnerAvailable) continue
    }
    selected.push(p)
    used.add(p.id)
    if (p.fixedPairId) {
      const partner = candidates.find(q => q.fixedPairId === p.fixedPairId && q.id !== p.id && !used.has(q.id))
      if (partner && selected.length < 4) {
        selected.push(partner)
        used.add(partner.id)
      }
    }
  }
  return selected.length === 4 ? selected : null
}

/**
 * Pulls the next fair group of 4 off the front of a priority-sorted queue.
 * Skill-aware: tries first to build a group made entirely of players who
 * share the front-of-queue player's skill level (so Beginners get matched
 * with Beginners, Advanced with Advanced, etc). If there aren't enough
 * same-skill players waiting to fill a foursome, it falls back to filling
 * the group from the full mixed queue instead of leaving the court empty.
 */
function pickGroup(queue) {
  if (queue.length === 0) return null

  const anchor = queue[0]
  const anchorSkill = anchor.skill || DEFAULT_SKILL
  const sameSkill = queue.filter(p => (p.skill || DEFAULT_SKILL) === anchorSkill)

  const sameSkillGroup = selectGroupFrom(sameSkill)
  if (sameSkillGroup) return sameSkillGroup

  // Not enough players of the same skill waiting — mix in others so play
  // doesn't stall.
  return selectGroupFrom(queue)
}

/**
 * Fills every open (unlocked, empty) court from the waiting queue —
 * prioritizing fewest games played, then longest wait, then skill match.
 */
function generateMatches(players, courts) {
  const queue = priorityQueue(players)
  const nextPlayers = clone(players)
  const nextCourts = clone(courts)
  const byId = Object.fromEntries(nextPlayers.map(p => [p.id, p]))

  for (const court of nextCourts) {
    if (court.locked) continue
    if (court.teamA.length > 0 || court.teamB.length > 0) continue
    if (queue.length < 4) break

    const group = pickGroup(queue)
    if (!group) break
    // remove chosen players from local queue copy
    for (const g of group) {
      const idx = queue.findIndex(q => q.id === g.id)
      if (idx !== -1) queue.splice(idx, 1)
    }

    const { teamA, teamB } = splitIntoTeams(group)
    court.teamA = teamA.map(p => p.id)
    court.teamB = teamB.map(p => p.id)

    recordPartner(byId[teamA[0].id], teamA[1].id)
    recordPartner(byId[teamA[1].id], teamA[0].id)
    recordPartner(byId[teamB[0].id], teamB[1].id)
    recordPartner(byId[teamB[1].id], teamB[0].id)
    for (const p of [...teamA, ...teamB]) {
      byId[p.id].status = 'playing'
      byId[p.id].courtId = court.id
    }
  }

  return { players: nextPlayers, courts: nextCourts }
}

// ---------------------------------------------------------------------------
// Small shared UI primitives
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
    md: { padding: '11px 18px', fontSize: '14px' },
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
        borderRadius: '4px',
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

function StatusPill({ status }) {
  const map = {
    waiting: { label: 'Waiting', bg: '#E7EEE9', fg: COLORS.teal },
    playing: { label: 'Playing', bg: '#FBFAD9', fg: '#8A8F0E' },
    resting: { label: 'Resting', bg: '#EEECEA', fg: COLORS.inkMute },
  }[status]
  return (
    <span
      style={{
        fontFamily: "'JetBrains Mono', monospace",
        fontSize: '10.5px',
        letterSpacing: '0.06em',
        textTransform: 'uppercase',
        padding: '3px 8px',
        borderRadius: '999px',
        background: map.bg,
        color: map.fg,
        fontWeight: 600,
      }}
    >
      {map.label}
    </span>
  )
}

function Modal({ title, onClose, children, width = 420 }) {
  return (
    <div
      onClick={onClose}
      style={{
        position: 'fixed', inset: 0, background: 'rgba(7,29,39,0.55)',
        display: 'flex', alignItems: 'center', justifyContent: 'center', zIndex: 100, padding: '16px',
      }}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="qm-modal"
        style={{
          background: '#fff', borderRadius: '10px', width: '100%', maxWidth: `${width}px`,
          padding: '24px', boxShadow: '0 20px 60px rgba(0,0,0,0.25)',
          maxHeight: '90vh', overflowY: 'auto', boxSizing: 'border-box',
        }}
      >
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '18px' }}>
          <h3 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '20px', margin: 0, color: COLORS.ink }}>{title}</h3>
          <button onClick={onClose} style={{ background: 'none', border: 'none', cursor: 'pointer', color: COLORS.inkMute, padding: '4px' }}>
            <FaTimes size={16} />
          </button>
        </div>
        {children}
      </div>
    </div>
  )
}

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
// Main page
// ---------------------------------------------------------------------------
function QueueManager() {
  const [players, setPlayers] = useState(() => loadState()?.players ?? [])
  const [courts, setCourts] = useState(() => loadState()?.courts ?? emptyCourts())
  const [search, setSearch] = useState('')
  const [pairMode, setPairMode] = useState(false)
  const [pairFirst, setPairFirst] = useState(null)
  const [showAddModal, setShowAddModal] = useState(false)
  const [replaceTarget, setReplaceTarget] = useState(null) // { courtId, team, slotIndex, outgoingId }
  const [roomCode, setRoomCode] = useState(() => sessionStorage.getItem(ROOM_KEY) || null)
  const [showJoinPanel, setShowJoinPanel] = useState(false)
  const [joinedCount, setJoinedCount] = useState(0)
  const history = useRef([])
  const [, forceRender] = useState(0)

  useEffect(() => { saveState(players, courts) }, [players, courts])

  // Publish every local change up to Firebase so joined players see it live.
  useEffect(() => {
    if (!roomCode) return
    publishState(roomCode, players, courts).catch(() => {})
  }, [roomCode, players, courts])

  const commit = useCallback((mutator) => {
    history.current.push({ players: clone(players), courts: clone(courts) })
    if (history.current.length > 15) history.current.shift()
    const draftPlayers = clone(players)
    const draftCourts = clone(courts)
    const result = mutator(draftPlayers, draftCourts)
    setPlayers(result?.players ?? draftPlayers)
    setCourts(result?.courts ?? draftCourts)
  }, [players, courts])

  const undo = () => {
    const prev = history.current.pop()
    if (!prev) return
    setPlayers(prev.players)
    setCourts(prev.courts)
    forceRender(n => n + 1)
  }

  // ---- derived data ----------------------------------------------------
  const waitingPlayers = useMemo(() => {
    return players
      .filter(p => p.status === 'waiting')
      .filter(p => p.name.toLowerCase().includes(search.toLowerCase()))
      .sort((a, b) => a.gamesPlayed - b.gamesPlayed || a.joinedAt - b.joinedAt)
  }, [players, search])

  const restingPlayers = useMemo(
    () => players.filter(p => p.status === 'resting').filter(p => p.name.toLowerCase().includes(search.toLowerCase())),
    [players, search]
  )

  const playingCount = players.filter(p => p.status === 'playing').length
  const activeCourts = courts.filter(c => c.teamA.length > 0).length
  const byId = useMemo(() => Object.fromEntries(players.map(p => [p.id, p])), [players])

  // ---- actions -----------------------------------------------------------
  // Adds one or many players at once. `entries` is an array of
  // { name, skill, joinRequestId? }. Any entry with no skill (or an
  // unrecognized one) automatically defaults to "Beginner". joinRequestId,
  // when present, tags the created player so a joined participant's device
  // can recognize itself in the live queue.
  const addPlayers = (entries) => {
    const valid = (entries || []).filter(e => e.name && e.name.trim())
    if (valid.length === 0) return
    commit((ps) => {
      for (const e of valid) {
        const skill = SKILL_LEVELS.includes(e.skill) ? e.skill : DEFAULT_SKILL
        ps.push({
          id: uid(),
          name: e.name.trim(),
          skill,
          gamesPlayed: 0,
          timesRested: 0,
          status: 'waiting',
          joinedAt: Date.now(),
          fixedPairId: null,
          lastPartnerId: null,
          partnerHistory: [],
          courtId: null,
          joinRequestId: e.joinRequestId || null,
        })
      }
      return { players: ps }
    })
    setShowAddModal(false)
  }

  // ---- live "Join Game" session -------------------------------------------
  // While a room is open, players' devices push join requests to Firebase;
  // the host (this page) is the only writer of the canonical queue, so it
  // picks up each request, adds the player normally, then clears the
  // request. This keeps the queue's matchmaking logic single-threaded even
  // though many phones are pointed at it.
  //
  // knownJoinIdsRef tracks which join requests have already been turned
  // into players. It's a ref (not the `players` state) on purpose: the
  // subscription callback below is set up once per room and its closure
  // would otherwise capture a stale snapshot of `players`, so a second
  // Firebase update arriving before React re-renders could see an
  // already-added player as "unknown" again and re-process their request —
  // which is what caused a newly-joining player to knock out one that was
  // still connecting.
  const knownJoinIdsRef = useRef(new Set())

  // Keep the ref in sync with the canonical player list (e.g. on reload,
  // where players — and their joinRequestId — come back from localStorage).
  useEffect(() => {
    const ids = new Set(players.map(p => p.joinRequestId).filter(Boolean))
    knownJoinIdsRef.current = ids
  }, [players])

  useEffect(() => {
    if (!roomCode) return
    const unsubscribe = subscribeJoinRequests(roomCode, (requests) => {
      if (requests.length === 0) return
      const fresh = requests.filter(r => !knownJoinIdsRef.current.has(r.id))
      if (fresh.length > 0) {
        // Mark these as known immediately (synchronously), before addPlayers
        // triggers a re-render — closes the race where a second snapshot
        // fires while the first is still in flight.
        fresh.forEach(r => knownJoinIdsRef.current.add(r.id))
        addPlayers(fresh.map(r => ({ name: r.name, skill: r.skill, joinRequestId: r.id })))
      }
      requests.forEach(r => clearJoinRequest(roomCode, r.id).catch(() => {}))
      setJoinedCount(c => c + fresh.length)
    })
    return unsubscribe
  }, [roomCode])

  const startJoinSession = () => {
    const code = makeRoomCode()
    sessionStorage.setItem(ROOM_KEY, code)
    setRoomCode(code)
    setJoinedCount(0)
    setShowJoinPanel(true)
  }

  const endJoinSession = () => {
    if (!roomCode) return
    closeRoom(roomCode).catch(() => {})
    sessionStorage.removeItem(ROOM_KEY)
    setRoomCode(null)
    setShowJoinPanel(false)
  }

  const removePlayer = (id) => {
    commit((ps, cs) => {
      const idx = ps.findIndex(p => p.id === id)
      if (idx !== -1) ps.splice(idx, 1)
      for (const c of cs) {
        c.teamA = c.teamA.filter(pid => pid !== id)
        c.teamB = c.teamB.filter(pid => pid !== id)
      }
      return { players: ps, courts: cs }
    })
  }

  const toggleRest = (id) => {
    commit((ps) => {
      const p = ps.find(pl => pl.id === id)
      if (!p) return { players: ps }
      if (p.status === 'resting') {
        p.status = 'waiting'
        p.joinedAt = Date.now()
      } else if (p.status === 'waiting') {
        p.status = 'resting'
        p.timesRested += 1
      }
      return { players: ps }
    })
  }

  const moveWaiting = (id, dir) => {
    // manual override: nudge joinedAt so ordering shifts by one position
    commit((ps) => {
      const sorted = ps
        .filter(p => p.status === 'waiting')
        .sort((a, b) => a.gamesPlayed - b.gamesPlayed || a.joinedAt - b.joinedAt)
      const idx = sorted.findIndex(p => p.id === id)
      const swapIdx = idx + dir
      if (idx === -1 || swapIdx < 0 || swapIdx >= sorted.length) return { players: ps }
      const a = ps.find(p => p.id === sorted[idx].id)
      const b = ps.find(p => p.id === sorted[swapIdx].id)
      const tmp = a.joinedAt
      a.joinedAt = b.joinedAt
      b.joinedAt = tmp
      const g = a.gamesPlayed
      a.gamesPlayed = b.gamesPlayed
      b.gamesPlayed = g
      return { players: ps }
    })
  }

  const handlePlayerClickForPairing = (id) => {
    if (!pairMode) return
    if (!pairFirst) {
      setPairFirst(id)
      return
    }
    if (pairFirst === id) {
      setPairFirst(null)
      return
    }
    commit((ps) => {
      const a = ps.find(p => p.id === pairFirst)
      const b = ps.find(p => p.id === id)
      if (a && b) {
        const pairId = uid()
        a.fixedPairId = pairId
        b.fixedPairId = pairId
      }
      return { players: ps }
    })
    setPairFirst(null)
    setPairMode(false)
  }

  const removeFixedPair = (id) => {
    commit((ps) => {
      const p = ps.find(pl => pl.id === id)
      if (!p?.fixedPairId) return { players: ps }
      const pairId = p.fixedPairId
      ps.forEach(pl => { if (pl.fixedPairId === pairId) pl.fixedPairId = null })
      return { players: ps }
    })
  }

  const toggleLockCourt = (courtId) => {
    commit((ps, cs) => {
      const c = cs.find(cc => cc.id === courtId)
      if (c) c.locked = !c.locked
      return { courts: cs }
    })
  }

  const removeFromCourt = (courtId, team, playerId) => {
    commit((ps, cs) => {
      const c = cs.find(cc => cc.id === courtId)
      if (!c) return { players: ps, courts: cs }
      c[team] = c[team].filter(pid => pid !== playerId)
      const p = ps.find(pl => pl.id === playerId)
      if (p) {
        p.status = 'waiting'
        p.joinedAt = Date.now()
        p.courtId = null
      }
      return { players: ps, courts: cs }
    })
  }

  const confirmReplace = (incomingId, outgoingLeaves) => {
    const { courtId, team, outgoingId } = replaceTarget
    commit((ps, cs) => {
      const c = cs.find(cc => cc.id === courtId)
      const slotIdx = c[team].indexOf(outgoingId)
      if (slotIdx !== -1) c[team][slotIdx] = incomingId

      const outgoing = ps.find(p => p.id === outgoingId)
      const incoming = ps.find(p => p.id === incomingId)
      if (outgoing) {
        if (outgoingLeaves) {
          const idx = ps.findIndex(p => p.id === outgoingId)
          ps.splice(idx, 1)
        } else {
          outgoing.status = 'waiting'
          outgoing.joinedAt = Date.now()
          outgoing.courtId = null
        }
      }
      if (incoming) {
        incoming.status = 'playing'
        incoming.courtId = courtId
      }
      return { players: ps, courts: cs }
    })
    setReplaceTarget(null)
  }

  const randomizeOpenCourts = () => {
    commit((ps, cs) => {
      const result = generateMatches(ps, cs)
      return result
    })
  }

  const shuffleWaiting = () => {
    commit((ps) => {
      const waiting = ps.filter(p => p.status === 'waiting')
      const now = Date.now()
      const shuffled = [...waiting].sort(() => Math.random() - 0.5)
      shuffled.forEach((p, i) => { p.joinedAt = now + i })
      return { players: ps }
    })
  }

  const resetQueue = () => {
    if (!window.confirm('Reset the entire session? This clears all players and courts.')) return
    history.current.push({ players: clone(players), courts: clone(courts) })
    setPlayers([])
    setCourts(emptyCourts())
  }

  const endRound = () => {
    commit((ps, cs) => {
      for (const c of cs) {
        if (c.locked) continue
        const ids = [...c.teamA, ...c.teamB]
        for (const id of ids) {
          const p = ps.find(pl => pl.id === id)
          if (p) {
            p.gamesPlayed += 1
            p.status = 'waiting'
            p.joinedAt = Date.now()
            p.courtId = null
          }
        }
        c.teamA = []
        c.teamB = []
      }
      const result = generateMatches(ps, cs)
      return result
    })
  }

  const canEndRound = courts.some(c => !c.locked && c.teamA.length > 0)

  // Finish a single court independently — increments games played for just
  // that foursome, sends them to the back of the queue, and immediately
  // pulls the next fair group into that one court without touching the others.
  const endCourtRound = (courtId) => {
    commit((ps, cs) => {
      const c = cs.find(cc => cc.id === courtId)
      if (!c || c.locked || (c.teamA.length === 0 && c.teamB.length === 0)) return { players: ps, courts: cs }
      const ids = [...c.teamA, ...c.teamB]
      for (const id of ids) {
        const p = ps.find(pl => pl.id === id)
        if (p) {
          p.gamesPlayed += 1
          p.status = 'waiting'
          p.joinedAt = Date.now()
          p.courtId = null
        }
      }
      c.teamA = []
      c.teamB = []
      const result = generateMatches(ps, cs)
      return result
    })
  }

  // -------------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .qm-btn:focus-visible { outline: 2px solid ${COLORS.citron}; outline-offset: 2px; }
        .qm-grid { display: grid; grid-template-columns: 320px 1fr; gap: 24px; }
        .qm-courts { display: grid; grid-template-columns: repeat(3, 1fr); gap: 16px; }
        .qm-card { transition: transform 0.15s ease, box-shadow 0.15s ease; }

        @media (max-width: 1000px) {
          .qm-grid { grid-template-columns: 1fr !important; }
          .qm-courts { grid-template-columns: 1fr !important; }
        }

        @media (max-width: 700px) {
          .qm-header-stats { flex-wrap: wrap; }
        }

        /* --- Mobile tightening --- */
        @media (max-width: 640px) {
          .qm-header-wrap { padding: 20px 16px !important; }
          .qm-body-wrap { padding: 16px 12px 40px !important; }
          .qm-header-top { flex-direction: column; align-items: stretch !important; gap: 14px !important; }
          .qm-header-actions { width: 100%; }
          .qm-header-actions .qm-btn { flex: 1 1 auto; }
          .qm-header-actions .qm-primary-cta { flex-basis: 100%; order: 3; }
          .qm-header-stats { display: grid !important; grid-template-columns: 1fr 1fr; gap: 14px 10px; row-gap: 16px; margin-top: 20px !important; }
          .qm-header-stats > div { border-right: none !important; padding-right: 0 !important; margin-right: 0 !important; }
          .qm-courts-header { flex-direction: column; align-items: stretch !important; }
          .qm-courts-actions { width: 100%; display: grid !important; grid-template-columns: 1fr 1fr; gap: 8px; }
          .qm-courts-actions .qm-btn { width: 100%; }
          .qm-courts { gap: 12px !important; }

          /* Prevent iOS Safari from zooming the page when a form field is focused */
          input, select, textarea { font-size: 16px !important; }

          /* Bigger, thumb-friendly tap targets everywhere on small screens */
          .qm-btn { padding: 11px 14px !important; font-size: 13.5px !important; }
          .qm-icon-btn { padding: 10px !important; }

          /* Let the waiting list flow with page scroll instead of scrolling
             inside its own box — avoids a scroll-within-scroll on phones */
          .qm-queue-scroll { max-height: none !important; overflow: visible !important; }

          .qm-court-card { min-height: 0 !important; padding: 14px !important; }
        }

        @media (max-width: 420px) {
          .qm-header-stats { grid-template-columns: 1fr 1fr; }
          .qm-courts-actions { grid-template-columns: 1fr; }
          .qm-modal { padding: 18px !important; }
        }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div className="qm-header-wrap" style={{ background: COLORS.navy, padding: '40px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div className="qm-header-top" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '20px' }}>
            <div>
              <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
                Open Play Session
              </p>
              <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(28px, 8vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
                Queue Manager
              </h1>
            </div>
            <div className="qm-header-actions" style={{ display: 'flex', gap: '10px', flexWrap: 'wrap' }}>
              {roomCode ? (
                <Button className="qm-btn" variant="outline" size="lg" icon={<FaWifi size={13} color={COLORS.citron} />} onClick={() => setShowJoinPanel(true)}>
                  Join Session Live
                </Button>
              ) : (
                <Button className="qm-btn" variant="outline" size="lg" icon={<FaQrcode size={13} />} onClick={startJoinSession}>
                  Join Game
                </Button>
              )}
              <Button className="qm-btn" variant="outline" size="lg" icon={<FaUserPlus size={13} />} onClick={() => setShowAddModal(true)}>
                Add Players
              </Button>
              <Button className="qm-btn qm-primary-cta" variant="primary" size="lg" icon={<FaSyncAlt size={13} />} onClick={endRound} disabled={!canEndRound}>
                End Round
              </Button>
            </div>
          </div>

          <div className="qm-header-stats" style={{ display: 'flex', gap: '0', marginTop: '36px', borderTop: '1px solid rgba(238,241,234,0.18)', paddingTop: '18px' }}>
            {[
              { value: players.length, label: 'TOTAL PLAYERS' },
              { value: waitingPlayers.length, label: 'WAITING' },
              { value: playingCount, label: 'ON COURT' },
              { value: `${activeCourts}/${COURT_COUNT}`, label: 'ACTIVE COURTS' },
            ].map((s, i) => (
              <div key={s.label} style={{ paddingRight: '28px', marginRight: '28px', borderRight: i < 3 ? '1px solid rgba(238,241,234,0.18)' : 'none' }}>
                <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '24px', fontWeight: 600, color: COLORS.chalk, margin: 0 }}>{s.value}</p>
                <p style={{ fontSize: '11px', letterSpacing: '0.08em', color: '#7C8B85', margin: '4px 0 0' }}>{s.label}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="qm-body-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 32px 60px' }}>
        <div className="qm-grid">
          {/* ---------- LEFT: WAITING QUEUE ---------- */}
          <div>
            <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, overflow: 'hidden' }}>
              <div style={{ padding: '16px 18px', borderBottom: `1px solid ${COLORS.chalkDim}` }}>
                <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '18px', margin: '0 0 12px', color: COLORS.ink }}>
                  Waiting Queue
                </h2>
                <div style={{ position: 'relative', marginBottom: '10px' }}>
                  <FaSearch size={12} style={{ position: 'absolute', left: '12px', top: '50%', transform: 'translateY(-50%)', color: COLORS.inkMute }} />
                  <input
                    value={search}
                    onChange={e => setSearch(e.target.value)}
                    placeholder="Search player…"
                    style={{ ...inputStyle, paddingLeft: '32px' }}
                  />
                </div>
                <button
                  className="qm-btn"
                  onClick={() => { setPairMode(m => !m); setPairFirst(null) }}
                  style={{
                    background: pairMode ? '#FBFAD9' : 'transparent',
                    border: `1px solid ${pairMode ? '#C9CC46' : '#D5DAD1'}`,
                    borderRadius: '6px', padding: '7px 12px', fontSize: '12.5px', fontWeight: 600,
                    color: pairMode ? '#7A7E10' : COLORS.inkMute, cursor: 'pointer', display: 'inline-flex', alignItems: 'center', gap: '6px', width: '100%', justifyContent: 'center',
                  }}
                >
                  <FaLink size={11} />
                  {pairMode ? (pairFirst ? 'Select second player…' : 'Select first player…') : 'Pair Two Players'}
                </button>
              </div>

              <div className="qm-queue-scroll" style={{ maxHeight: '640px', overflowY: 'auto' }}>
                {waitingPlayers.length === 0 && restingPlayers.length === 0 && (
                  <p style={{ padding: '24px 18px', fontSize: '13px', color: COLORS.inkMute, textAlign: 'center' }}>
                    No players waiting. Add players to get started.
                  </p>
                )}
                {waitingPlayers.map((p, i) => (
                  <QueueRow
                    key={p.id}
                    player={p}
                    position={i + 1}
                    pairMode={pairMode}
                    isPairSelected={pairFirst === p.id}
                    onSelectForPair={() => handlePlayerClickForPairing(p.id)}
                    onRemove={() => removePlayer(p.id)}
                    onRest={() => toggleRest(p.id)}
                    onMoveUp={() => moveWaiting(p.id, -1)}
                    onMoveDown={() => moveWaiting(p.id, 1)}
                    onUnpair={() => removeFixedPair(p.id)}
                    partnerName={p.fixedPairId ? players.find(q => q.fixedPairId === p.fixedPairId && q.id !== p.id)?.name : null}
                  />
                ))}
                {restingPlayers.length > 0 && (
                  <p style={{ padding: '14px 18px 6px', fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.inkMute, margin: 0 }}>
                    Resting
                  </p>
                )}
                {restingPlayers.map(p => (
                  <QueueRow
                    key={p.id}
                    player={p}
                    resting
                    onRemove={() => removePlayer(p.id)}
                    onRest={() => toggleRest(p.id)}
                  />
                ))}
              </div>
            </div>
          </div>

          {/* ---------- CENTER: COURTS ---------- */}
          <div>
            <div className="qm-courts-header" style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
              <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '18px', margin: 0, color: COLORS.ink }}>
                Active Courts
              </h2>
              <div className="qm-courts-actions" style={{ display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
                <Button className="qm-btn" variant="outlineDark" size="sm" icon={<FaRandom size={11} />} onClick={randomizeOpenCourts}>
                  Randomize Open Courts
                </Button>
                <Button className="qm-btn" variant="outlineDark" size="sm" icon={<FaSyncAlt size={11} />} onClick={shuffleWaiting}>
                  Shuffle Waiting
                </Button>
                <Button className="qm-btn" variant="outlineDark" size="sm" icon={<FaUndo size={11} />} onClick={undo} disabled={history.current.length === 0}>
                  Undo
                </Button>
                <Button className="qm-btn" variant="danger" size="sm" icon={<FaTrashAlt size={11} />} onClick={resetQueue}>
                  Reset
                </Button>
              </div>
            </div>

            <div className="qm-courts">
              {courts.map(court => (
                <CourtCard
                  key={court.id}
                  court={court}
                  byId={byId}
                  onLockToggle={() => toggleLockCourt(court.id)}
                  onRemove={(team, pid) => removeFromCourt(court.id, team, pid)}
                  onReplace={(team, pid) => setReplaceTarget({ courtId: court.id, team, outgoingId: pid })}
                  onFinish={() => endCourtRound(court.id)}
                />
              ))}
            </div>

            {/* ---------- STATS TABLE ---------- */}
            <div style={{ marginTop: '32px', background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, overflow: 'hidden' }}>
              <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '18px', margin: 0, padding: '16px 18px', borderBottom: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }}>
                Player Statistics
              </h2>
              <div style={{ overflowX: 'auto' }}>
                <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '13.5px' }}>
                  <thead>
                    <tr style={{ background: COLORS.chalk }}>
                      {['Player', 'Skill', 'Games Played', 'Times Rested', 'Status', 'Fixed Pair'].map(h => (
                        <th key={h} style={{ textAlign: 'left', padding: '10px 18px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600, whiteSpace: 'nowrap' }}>
                          {h}
                        </th>
                      ))}
                    </tr>
                  </thead>
                  <tbody>
                    {players.length === 0 && (
                      <tr><td colSpan={6} style={{ padding: '20px 18px', color: COLORS.inkMute, textAlign: 'center' }}>No players yet.</td></tr>
                    )}
                    {players
                      .slice()
                      .sort((a, b) => a.name.localeCompare(b.name))
                      .map(p => (
                        <tr key={p.id} style={{ borderTop: `1px solid ${COLORS.chalkDim}` }}>
                          <td style={{ padding: '10px 18px', fontWeight: 600, color: COLORS.ink, whiteSpace: 'nowrap' }}>{p.name}</td>
                          <td style={{ padding: '10px 18px', whiteSpace: 'nowrap' }}>{p.skill || DEFAULT_SKILL}</td>
                          <td style={{ padding: '10px 18px', fontFamily: "'JetBrains Mono', monospace" }}>{p.gamesPlayed}</td>
                          <td style={{ padding: '10px 18px', fontFamily: "'JetBrains Mono', monospace" }}>{p.timesRested}</td>
                          <td style={{ padding: '10px 18px' }}><StatusPill status={p.status} /></td>
                          <td style={{ padding: '10px 18px', color: p.fixedPairId ? COLORS.teal : COLORS.inkMute, fontWeight: p.fixedPairId ? 600 : 400 }}>
                            {p.fixedPairId ? 'Yes' : 'No'}
                          </td>
                        </tr>
                      ))}
                  </tbody>
                </table>
              </div>
            </div>
          </div>
        </div>
      </div>

      {showAddModal && (
        <AddPlayerModal onClose={() => setShowAddModal(false)} onAdd={addPlayers} />
      )}

      {replaceTarget && (
        <ReplaceModal
          waitingPlayers={waitingPlayers}
          outgoingName={byId[replaceTarget.outgoingId]?.name}
          onClose={() => setReplaceTarget(null)}
          onConfirm={confirmReplace}
        />
      )}

      {showJoinPanel && roomCode && (
        <JoinGamePanel
          code={roomCode}
          joinedCount={joinedCount}
          onClose={() => setShowJoinPanel(false)}
          onEndSession={endJoinSession}
        />
      )}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Join Game panel (host side) — shows the code/link players use to join
// ---------------------------------------------------------------------------
function JoinGamePanel({ code, joinedCount, onClose, onEndSession }) {
  const [copied, setCopied] = useState(false)
  const link = `${typeof window !== 'undefined' ? window.location.origin : ''}${JOIN_PATH}?code=${code}`

  const copyLink = async () => {
    try {
      await navigator.clipboard.writeText(link)
      setCopied(true)
      setTimeout(() => setCopied(false), 1800)
    } catch {
      // clipboard blocked — user can still select & copy the text manually
    }
  }

  return (
    <Modal title="Join Game" onClose={onClose} width={420}>
      <p style={{ fontSize: '13.5px', color: COLORS.inkMute, margin: '0 0 20px' }}>
        Players scan or type this code on their own phone to add themselves to the queue and follow it live.
      </p>

      <div style={{
        background: COLORS.navy, borderRadius: '10px', padding: '24px', textAlign: 'center', marginBottom: '16px',
      }}>
        <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 10px' }}>
          Room Code
        </p>
        <p style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: '46px', letterSpacing: '0.12em', color: COLORS.chalk, margin: '0 0 18px' }}>
          {code}
        </p>
        <div style={{ background: COLORS.chalk, borderRadius: '8px', padding: '14px', display: 'inline-block' }}>
          <QRCodeSVG value={link} size={168} bgColor={COLORS.chalk} fgColor={COLORS.navyDeep} level="M" />
        </div>
        <p style={{ fontSize: '11.5px', color: '#A9B7B2', margin: '10px 0 0' }}>
          Scan to join instantly
        </p>
      </div>

      <div style={{ display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <input readOnly value={link} style={{ ...inputStyle, fontSize: '12.5px', color: COLORS.inkMute }} onFocus={e => e.target.select()} />
        <Button variant="outlineDark" size="md" onClick={copyLink} icon={copied ? <FaCheck size={12} /> : <FaCopy size={12} />}>
          {copied ? 'Copied' : 'Copy'}
        </Button>
      </div>

      <div style={{ display: 'flex', alignItems: 'center', gap: '8px', padding: '10px 12px', background: '#E7EEE9', borderRadius: '6px', marginBottom: '20px' }}>
        <FaWifi size={13} color={COLORS.teal} />
        <span style={{ fontSize: '13px', color: COLORS.teal, fontWeight: 600 }}>
          {joinedCount} player{joinedCount === 1 ? '' : 's'} joined this way so far
        </span>
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'space-between' }}>
        <Button variant="danger" size="sm" onClick={onEndSession}>End Join Session</Button>
        <Button variant="primary" size="sm" onClick={onClose}>Done</Button>
      </div>
    </Modal>
  )
}

// ---------------------------------------------------------------------------
// Queue row
// ---------------------------------------------------------------------------
function QueueRow({ player, position, pairMode, isPairSelected, onSelectForPair, onRemove, onRest, onMoveUp, onMoveDown, onUnpair, partnerName, resting }) {
  return (
    <div
      onClick={pairMode ? onSelectForPair : undefined}
      className="qm-card"
      style={{
        display: 'flex', alignItems: 'center', gap: '10px', padding: '12px 18px',
        borderBottom: `1px solid ${COLORS.chalkDim}`, cursor: pairMode ? 'pointer' : 'default',
        background: isPairSelected ? '#FBFAD9' : resting ? '#FAFAF8' : 'transparent',
        opacity: resting ? 0.7 : 1,
      }}
    >
      {!resting && (
        <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: COLORS.inkMute, width: '18px', flexShrink: 0 }}>
          {String(position).padStart(2, '0')}
        </span>
      )}
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
          <span style={{ fontWeight: 600, fontSize: '14px', color: COLORS.ink }}>{player.name}</span>
          <span style={{ fontSize: '10.5px', color: COLORS.inkMute, border: '1px solid #D5DAD1', borderRadius: '999px', padding: '1px 7px' }}>
            {player.skill || DEFAULT_SKILL}
          </span>
          {partnerName && (
            <span style={{ fontSize: '10.5px', color: COLORS.teal, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <FaLink size={9} /> {partnerName}
            </span>
          )}
          {player.joinRequestId && (
            <span title="Joined via Join Game" style={{ fontSize: '10.5px', color: COLORS.teal, display: 'inline-flex', alignItems: 'center', gap: '3px' }}>
              <FaWifi size={9} />
            </span>
          )}
        </div>
        <div style={{ display: 'flex', gap: '10px', marginTop: '3px' }}>
          <span style={{ fontSize: '11.5px', color: COLORS.inkMute }}>{player.gamesPlayed} games played</span>
          <StatusPill status={player.status} />
        </div>
      </div>

      {!pairMode && (
        <div style={{ display: 'flex', alignItems: 'center', gap: '2px', flexShrink: 0 }}>
          {!resting && onMoveUp && (
            <>
              <IconBtn title="Move up" onClick={onMoveUp}><FaChevronUp size={10} /></IconBtn>
              <IconBtn title="Move down" onClick={onMoveDown}><FaChevronDown size={10} /></IconBtn>
            </>
          )}
          {player.fixedPairId && (
            <IconBtn title="Remove fixed pair" onClick={onUnpair}><FaUnlink size={11} /></IconBtn>
          )}
          <IconBtn title={resting ? 'Return to queue' : 'Rest'} onClick={onRest}>
            {resting ? <FaPlay size={10} /> : <FaBed size={11} />}
          </IconBtn>
          <IconBtn title="Remove player" danger onClick={onRemove}><FaTimes size={12} /></IconBtn>
        </div>
      )}
    </div>
  )
}

function IconBtn({ children, onClick, title, danger }) {
  return (
    <button
      title={title}
      className="qm-icon-btn"
      onClick={onClick}
      style={{
        background: 'none', border: 'none', cursor: 'pointer', padding: '6px',
        color: danger ? '#B3453D' : COLORS.inkMute, borderRadius: '5px', display: 'flex',
      }}
      onMouseEnter={e => e.currentTarget.style.background = danger ? '#FBEDEC' : COLORS.chalk}
      onMouseLeave={e => e.currentTarget.style.background = 'none'}
    >
      {children}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Court card
// ---------------------------------------------------------------------------
function CourtCard({ court, byId, onLockToggle, onRemove, onReplace, onFinish }) {
  const hasPlayers = court.teamA.length > 0 || court.teamB.length > 0
  return (
    <div
      className="qm-card qm-court-card"
      style={{
        background: hasPlayers ? COLORS.navy : '#fff',
        border: `1px solid ${hasPlayers ? COLORS.navy : COLORS.chalkDim}`,
        borderRadius: '10px', padding: '18px', minHeight: '220px',
      }}
    >
      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px' }}>
        <h3 style={{
          fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '17px',
          margin: 0, color: hasPlayers ? COLORS.chalk : COLORS.ink,
        }}>
          {court.name}
        </h3>
        <div style={{ display: 'flex', gap: '2px' }}>
          <button
            title={court.locked ? 'Unlock court' : 'Lock court'}
            className="qm-icon-btn"
            onClick={onLockToggle}
            style={{
              background: 'none', border: 'none', cursor: 'pointer', padding: '5px',
              color: court.locked ? COLORS.citron : (hasPlayers ? '#A9B7B2' : COLORS.inkMute),
            }}
          >
            {court.locked ? <FaLock size={13} /> : <FaLockOpen size={13} />}
          </button>
        </div>
      </div>

      {!hasPlayers ? (
        <p style={{ fontSize: '13px', color: COLORS.inkMute, textAlign: 'center', marginTop: '40px' }}>
          Open court — waiting for players.
        </p>
      ) : (
        <>
          <TeamBlock label="Team A" ids={court.teamA} byId={byId} onRemove={pid => onRemove('teamA', pid)} onReplace={pid => onReplace('teamA', pid)} />
          <div style={{ textAlign: 'center', fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: COLORS.citron, letterSpacing: '0.1em', margin: '10px 0' }}>VS</div>
          <TeamBlock label="Team B" ids={court.teamB} byId={byId} onRemove={pid => onRemove('teamB', pid)} onReplace={pid => onReplace('teamB', pid)} />

          <button
            className="qm-btn"
            onClick={onFinish}
            disabled={court.locked}
            title={court.locked ? 'Unlock this court to finish it' : 'Finish this court and pull in the next group'}
            style={{
              width: '100%', marginTop: '16px', padding: '10px', borderRadius: '5px',
              background: court.locked ? 'rgba(238,241,234,0.06)' : COLORS.citron,
              color: court.locked ? '#6B7975' : COLORS.navyDeep,
              border: 'none', fontWeight: 700, fontSize: '13px', cursor: court.locked ? 'not-allowed' : 'pointer',
              display: 'flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
            }}
          >
            <FaFlagCheckered size={12} />
            Finish Court
          </button>
        </>
      )}
    </div>
  )
}

function TeamBlock({ label, ids, byId, onRemove, onReplace }) {
  return (
    <div>
      <p style={{ fontSize: '10.5px', letterSpacing: '0.08em', textTransform: 'uppercase', color: '#7C8B85', margin: '0 0 6px' }}>{label}</p>
      {ids.map(pid => {
        const p = byId[pid]
        if (!p) return null
        return (
          <div key={pid} style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', padding: '6px 0', gap: '8px' }}>
            <span style={{ color: COLORS.chalk, fontSize: '13.5px', fontWeight: 600, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap', minWidth: 0 }}>{p.name}</span>
            <div style={{ display: 'flex', gap: '2px', flexShrink: 0 }}>
              <button
                title="Replace player"
                className="qm-icon-btn"
                onClick={() => onReplace(pid)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A9B7B2', padding: '5px' }}
                onMouseEnter={e => e.currentTarget.style.color = COLORS.citron}
                onMouseLeave={e => e.currentTarget.style.color = '#A9B7B2'}
              >
                <FaExchangeAlt size={11} />
              </button>
              <button
                title="Remove from court"
                className="qm-icon-btn"
                onClick={() => onRemove(pid)}
                style={{ background: 'none', border: 'none', cursor: 'pointer', color: '#A9B7B2', padding: '5px' }}
                onMouseEnter={e => e.currentTarget.style.color = '#E08E88'}
                onMouseLeave={e => e.currentTarget.style.color = '#A9B7B2'}
              >
                <FaTimes size={12} />
              </button>
            </div>
          </div>
        )
      })}
    </div>
  )
}

// ---------------------------------------------------------------------------
// Modals
// ---------------------------------------------------------------------------
function AddPlayerModal({ onClose, onAdd }) {
  const [namesText, setNamesText] = useState('')
  const [skill, setSkill] = useState(DEFAULT_SKILL)

  const entries = useMemo(() => parseBulkInput(namesText, skill), [namesText, skill])
  const validCount = entries.filter(e => e.name.trim()).length

  return (
    <Modal title="Add Players" onClose={onClose} width={460}>
      <form onSubmit={e => { e.preventDefault(); onAdd(entries) }}>
        <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>
          Player names
        </label>
        <p style={{ fontSize: '11.5px', color: COLORS.inkMute, margin: '0 0 8px' }}>
          One player per line. Add a skill per line too, like "Jane Smith, Intermediate" — otherwise the default below is used.
        </p>
        <textarea
          autoFocus
          rows={6}
          value={namesText}
          onChange={e => setNamesText(e.target.value)}
          placeholder={'Jane Smith\nJohn Doe, Intermediate\nAlex Rivera'}
          style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px', lineHeight: 1.5 }}
        />

        <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>
          Default skill level
        </label>
        <select value={skill} onChange={e => setSkill(e.target.value)} style={{ ...inputStyle, marginBottom: '6px' }}>
          {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
        </select>
        <p style={{ fontSize: '11.5px', color: COLORS.inkMute, margin: '0 0 20px' }}>
          Applied to any name above that doesn't already specify a skill.
        </p>

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={validCount === 0}>
            Add {validCount > 0 ? `${validCount} Player${validCount > 1 ? 's' : ''}` : 'Players'}
          </Button>
        </div>
      </form>
    </Modal>
  )
}

function ReplaceModal({ waitingPlayers, outgoingName, onClose, onConfirm }) {
  const [selected, setSelected] = useState('')
  const [leaves, setLeaves] = useState(false)

  return (
    <Modal title="Replace Player" onClose={onClose}>
      <p style={{ fontSize: '13.5px', color: COLORS.inkMute, marginBottom: '16px' }}>
        Replacing <strong style={{ color: COLORS.ink }}>{outgoingName}</strong> on court.
      </p>

      <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>Bring in from queue</label>
      <select value={selected} onChange={e => setSelected(e.target.value)} style={{ ...inputStyle, marginBottom: '16px' }}>
        <option value="">Select a player…</option>
        {waitingPlayers.map(p => (
          <option key={p.id} value={p.id}>{p.name} — {p.gamesPlayed} games played</option>
        ))}
      </select>
      {waitingPlayers.length === 0 && (
        <p style={{ fontSize: '12.5px', color: '#B3453D', marginTop: '-8px', marginBottom: '16px' }}>No one is waiting right now.</p>
      )}

      <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '8px' }}>
        {outgoingName} should…
      </label>
      <div style={{ display: 'flex', gap: '10px', marginBottom: '22px' }}>
        <ChoiceCard active={!leaves} onClick={() => setLeaves(false)} label="Return to queue" />
        <ChoiceCard active={leaves} onClick={() => setLeaves(true)} label="Leave session" />
      </div>

      <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end' }}>
        <Button variant="ghost" onClick={onClose}>Cancel</Button>
        <Button variant="primary" disabled={!selected} onClick={() => onConfirm(selected, leaves)}>Confirm Swap</Button>
      </div>
    </Modal>
  )
}

function ChoiceCard({ active, onClick, label }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, padding: '12px', borderRadius: '6px', cursor: 'pointer', fontSize: '13px', fontWeight: 600,
        border: `1.5px solid ${active ? COLORS.teal : '#D5DAD1'}`,
        background: active ? '#E7EEE9' : '#fff',
        color: active ? COLORS.teal : COLORS.inkMute,
      }}
    >
      {label}
    </button>
  )
}

export default QueueManager