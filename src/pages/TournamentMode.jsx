import { useState, useEffect, useMemo } from 'react'
import {
  FaTrophy,
  FaCrown,
  FaPlus,
  FaTimes,
  FaRandom,
  FaArrowLeft,
  FaChevronLeft,
  FaChevronRight,
  FaMedal,
  FaUndo,
  FaUsers,
} from 'react-icons/fa'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Design tokens — matches QueueManager so this reads as the same product.
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
  gold: '#C99A2E',
  goldBg: '#FBF1DA',
  silver: '#8A97A3',
  silverBg: '#EEF1F4',
  bronze: '#B0723A',
  bronzeBg: '#F5E9DC',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

const STORAGE_KEY = 'picklebook_tournament_v1'
const MAX_TEAMS = 15
const MIN_TEAMS = 2

// ---------------------------------------------------------------------------
// Helpers
// ---------------------------------------------------------------------------
let uidCounter = 0
const uid = () => `t-${Date.now()}-${(uidCounter++).toString(36)}-${Math.random().toString(36).slice(2, 6)}`

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

function nextPowerOfTwo(n) {
  let p = 1
  while (p < n) p *= 2
  return p
}

function loadState() {
  try {
    const raw = localStorage.getItem(STORAGE_KEY)
    if (!raw) return null
    return JSON.parse(raw)
  } catch {
    return null
  }
}

function saveState(state) {
  try {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(state))
  } catch {
    // storage unavailable — fail silently
  }
}

function emptyTeam() {
  return { id: uid(), name: '', player1: '', player2: '' }
}

function normalizeTeam(team) {
  return {
    ...team,
    name: team.name?.trim() || '',
    player1: team.player1?.trim() || '',
    player2: team.player2?.trim() || '',
  }
}

function displayName(team) {
  if (!team) return null
  return team.name?.trim() || [team.player1, team.player2].filter(Boolean).join(' & ') || 'Unnamed Team'
}

function pairLine(team) {
  if (!team) return ''
  return [team.player1, team.player2].filter(Boolean).join(' & ')
}

/**
 * Builds a full elimination bracket from a seeded list of teams (nulls are
 * byes). `picks` is { [roundIdx]: { [matchIdx]: 'A' | 'B' } } — only used
 * where both sides of a match are real teams; byes auto-advance.
 */
function computeRounds(seedTeams, picks) {
  const size = nextPowerOfTwo(Math.max(seedTeams.length, 2))
  const slots = seedTeams.slice()
  while (slots.length < size) slots.push(null)

  const round0 = []
  for (let i = 0; i < size; i += 2) {
    const a = slots[i]
    const b = slots[i + 1]
    let winner = null
    if (a && !b) winner = a
    else if (b && !a) winner = b
    else if (a && b) {
      const pick = picks?.[0]?.[i / 2]
      if (pick) winner = pick === 'A' ? a : b
    }
    round0.push({
      teamA: a,
      teamB: b,
      winner,
      bye: !!((a && !b) || (b && !a)),
      hasContender: !!(a || b),
    })
  }

  const rounds = [round0]
  let prev = round0
  let r = 1
  while (prev.length > 1) {
    const round = []
    for (let i = 0; i < prev.length; i += 2) {
      const left = prev[i]
      const right = prev[i + 1]
      const a = left.winner
      const b = right.winner
      const leftHasContender = !!left.hasContender
      const rightHasContender = !!right.hasContender
      let winner = null
      if (a && b) {
        const pick = picks?.[r]?.[i / 2]
        if (pick) winner = pick === 'A' ? a : b
      } else if (a && !rightHasContender) {
        winner = a
      } else if (b && !leftHasContender) {
        winner = b
      }
      round.push({
        teamA: a,
        teamB: b,
        winner,
        bye: !!((a && !rightHasContender) || (b && !leftHasContender)),
        hasContender: leftHasContender || rightHasContender,
      })
    }
    rounds.push(round)
    prev = round
    r++
  }
  return rounds
}

/** Losers of round 0 of a bracket, in match order (null where a bye left no loser). */
function round0Losers(rounds) {
  return rounds[0].map(m => {
    if (!m.teamA || !m.teamB || !m.winner) return null
    return m.winner.id === m.teamA.id ? m.teamB : m.teamA
  })
}

/**
 * Builds the 3rd-place match from the two semifinal losers (the round right
 * before the final). Returns null if the bracket isn't big enough to have a
 * semifinal (i.e. fewer than 4 teams / only 1 round).
 */
function computeThirdPlaceMatch(rounds, pick) {
  if (!rounds || rounds.length < 2) return null
  const semis = rounds[rounds.length - 2]
  if (!semis || semis.length !== 2) return null

  const loserOf = (m) => {
    if (!m.teamA || !m.teamB || !m.winner) return null
    return m.winner.id === m.teamA.id ? m.teamB : m.teamA
  }
  const teamA = loserOf(semis[0])
  const teamB = loserOf(semis[1])
  let winner = null
  if (teamA && teamB && pick) winner = pick === 'A' ? teamA : teamB
  return { teamA, teamB, winner, bye: false }
}

function getRoundLabel(roundIdx, totalRounds) {
  const fromEnd = totalRounds - 1 - roundIdx
  if (fromEnd === 0) return 'Final'
  if (fromEnd === 1) return 'Semifinal'
  if (fromEnd === 2) return 'Quarterfinal'
  return `Round ${roundIdx + 1}`
}

// ---------------------------------------------------------------------------
// Small shared UI primitives
// ---------------------------------------------------------------------------
function Button({ variant = 'ghost', size = 'md', icon, children, ...props }) {
  const base = {
    primary: { background: COLORS.citron, color: COLORS.navyDeep, border: 'none' },
    outline: { background: 'transparent', color: COLORS.chalk, border: '1px solid rgba(238,241,234,0.35)' },
    outlineDark: { background: 'transparent', color: COLORS.ink, border: '1px solid #C9D0C6' },
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
// Main component
// ---------------------------------------------------------------------------
function TournamentMode({ queuePlayers = [], onExit }) {
  const persisted = loadState()
  const [stage, setStage] = useState(persisted?.stage || 'setup') // 'setup' | 'bracket'
  const [format, setFormat] = useState(persisted?.format || 'single') // 'single' | 'split'
  const [teams, setTeams] = useState(persisted?.teams || [emptyTeam(), emptyTeam()])
  const [picks, setPicks] = useState(persisted?.picks || {})
  const [silverPicks, setSilverPicks] = useState(persisted?.silverPicks || {})
  const [playThird, setPlayThird] = useState(persisted?.playThird ?? true)
  const [thirdPick, setThirdPick] = useState(persisted?.thirdPick || null) // 'A' | 'B' | null
  const [silverThirdPick, setSilverThirdPick] = useState(persisted?.silverThirdPick || null)
  const [activeBracketTab, setActiveBracketTab] = useState('gold') // 'gold' | 'silver'
  const [mobileRound, setMobileRound] = useState(0)

  useEffect(() => {
    saveState({ stage, format, teams, picks, silverPicks, playThird, thirdPick, silverThirdPick })
  }, [stage, format, teams, picks, silverPicks, playThird, thirdPick, silverThirdPick])

  // ---- team setup actions ----
  const addTeam = () => {
    if (teams.length >= MAX_TEAMS) return
    setTeams(t => [...t, emptyTeam()])
  }
  const removeTeam = (id) => setTeams(t => t.filter(tm => tm.id !== id))
  const updateTeam = (id, patch) => setTeams(t => t.map(tm => (tm.id === id ? { ...tm, ...patch } : tm)))
  const shuffleSeeds = () => setTeams(t => shuffle(t))
  const importQueuePlayers = () => {
    const imported = queuePlayers
      .filter(p => p.name?.trim())
      .slice(0, MAX_TEAMS)
      .map(p => ({ id: uid(), name: p.name.trim(), player1: p.name.trim(), player2: '' }))
    if (imported.length >= MIN_TEAMS) {
      setTeams(imported)
      setPicks({})
      setSilverPicks({})
      setThirdPick(null)
      setSilverThirdPick(null)
      setStage('setup')
    }
  }

  const readyTeams = teams
    .map(normalizeTeam)
    .filter(t => t.name || t.player1 || t.player2)
  const canGenerate = readyTeams.length >= MIN_TEAMS

  const generateBracket = () => {
    setPicks({})
    setSilverPicks({})
    setThirdPick(null)
    setSilverThirdPick(null)
    setMobileRound(0)
    setActiveBracketTab('gold')
    setStage('bracket')
  }

  const resetTournament = () => {
    if (!window.confirm('Reset the tournament? This clears all teams and results.')) return
    setTeams([emptyTeam(), emptyTeam()])
    setPicks({})
    setSilverPicks({})
    setThirdPick(null)
    setSilverThirdPick(null)
    setStage('setup')
    setMobileRound(0)
  }

  const editTeams = () => setStage('setup')

  // ---- bracket computation ----
  const mainRounds = useMemo(
    () => (stage === 'bracket' ? computeRounds(readyTeams, picks) : []),
    [stage, readyTeams, picks]
  )
  const silverSeed = useMemo(
    () => (format === 'split' && mainRounds.length ? round0Losers(mainRounds) : []),
    [format, mainRounds]
  )
  const hasSilverContenders = silverSeed.filter(Boolean).length >= MIN_TEAMS
  const silverRounds = useMemo(
    () => (format === 'split' && hasSilverContenders ? computeRounds(silverSeed, silverPicks) : []),
    [format, hasSilverContenders, silverSeed, silverPicks]
  )

  const activeRounds = format === 'split' && activeBracketTab === 'silver' ? silverRounds : mainRounds
  const setActivePick = (roundIdx, matchIdx, side) => {
    const isSilver = format === 'split' && activeBracketTab === 'silver'
    const setter = isSilver ? setSilverPicks : setPicks
    setter(prev => {
      const next = clone(prev)
      next[roundIdx] = { ...(next[roundIdx] || {}), [matchIdx]: side }
      // any later round depended on this match's outcome — clear it so state stays consistent
      Object.keys(next).forEach(r => {
        if (Number(r) > roundIdx) delete next[r]
      })
      return next
    })
    // a semifinal (or earlier) result changing can change who the 3rd-place
    // contenders are, so drop any previous 3rd-place pick to stay consistent
    ;(isSilver ? setSilverThirdPick : setThirdPick)(null)
  }

  const goldChampion = mainRounds.length ? mainRounds[mainRounds.length - 1][0]?.winner : null
  const silverChampion = silverRounds.length ? silverRounds[silverRounds.length - 1][0]?.winner : null

  const goldThirdMatch = useMemo(
    () => (playThird ? computeThirdPlaceMatch(mainRounds, thirdPick) : null),
    [playThird, mainRounds, thirdPick]
  )
  const silverThirdMatch = useMemo(
    () => (playThird ? computeThirdPlaceMatch(silverRounds, silverThirdPick) : null),
    [playThird, silverRounds, silverThirdPick]
  )

  // -------------------------------------------------------------------------
  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .tm-btn:focus-visible { outline: 2px solid ${COLORS.citron}; outline-offset: 2px; }
        .tm-team-row { display: grid; grid-template-columns: 28px 1.2fr 1fr 1fr 36px; gap: 10px; align-items: center; }
        .tm-bracket-scroll { display: flex; gap: 36px; overflow-x: auto; overflow-y: hidden; padding: 8px 24px 24px 4px; }
        .tm-round-col { position: relative; width: 230px; flex-shrink: 0; overflow: visible; }
        .tm-round-header { font-family: 'JetBrains Mono', monospace; font-size: 11px; letter-spacing: 0.08em; text-transform: uppercase; color: ${COLORS.inkMute}; text-align: center; margin: 0 0 10px; }
        .tm-connector { position: absolute; background: #C7D0C9; }
        .tm-mobile-only { display: none; }
        .tm-desktop-only { display: block; }

        @media (max-width: 860px) {
          .tm-team-row { grid-template-columns: 22px 1fr 1fr 30px; }
          .tm-team-row .tm-player2 { grid-column: 2 / span 2; }
        }

        @media (max-width: 640px) {
          .tm-header-wrap { padding: 20px 14px !important; }
          .tm-body-wrap { padding: 14px 10px 50px !important; }
          .tm-desktop-only { display: none !important; }
          .tm-mobile-only { display: block !important; }
          .tm-team-row { grid-template-columns: 20px 1fr 26px; row-gap: 8px; }
          .tm-team-row .tm-player1, .tm-team-row .tm-player2 { grid-column: 1 / span 2; }
          input, select, textarea { font-size: 16px !important; }
          .tm-btn { padding: 12px 12px !important; font-size: 13px !important; }
          .tm-format-toggle { flex-direction: column !important; }
          .tm-format-toggle > button { width: 100% !important; }
        }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div className="tm-header-wrap" style={{ background: COLORS.navy, padding: '36px 32px' }}>
        <div style={{ maxWidth: '1280px', margin: '0 auto' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <button
                onClick={onExit}
                style={{
                  background: 'none', border: 'none', cursor: 'pointer', color: COLORS.citron,
                  fontSize: '12px', letterSpacing: '0.1em', textTransform: 'uppercase', padding: 0,
                  display: 'inline-flex', alignItems: 'center', gap: '6px', marginBottom: '10px', fontFamily: "'JetBrains Mono', monospace",
                }}
              >
                <FaArrowLeft size={10} /> Back to Queue
              </button>
              <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(26px, 7vw, 40px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
                Tournament Mode
              </h1>
            </div>
            {stage === 'bracket' && (
              <div style={{ display: 'flex', gap: '8px' }}>
                <Button className="tm-btn" variant="outline" size="md" icon={<FaUsers size={12} />} onClick={editTeams}>
                  Edit Teams
                </Button>
                <Button className="tm-btn" variant="danger" size="md" icon={<FaUndo size={12} />} onClick={resetTournament}>
                  Reset
                </Button>
              </div>
            )}
          </div>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div className="tm-body-wrap" style={{ maxWidth: '1280px', margin: '0 auto', padding: '28px 32px 60px' }}>
        {stage === 'setup' ? (
          <SetupScreen
            teams={teams}
            format={format}
            setFormat={setFormat}
            playThird={playThird}
            setPlayThird={setPlayThird}
            addTeam={addTeam}
            removeTeam={removeTeam}
            updateTeam={updateTeam}
            shuffleSeeds={shuffleSeeds}
            importQueuePlayers={importQueuePlayers}
            queueImportCount={Math.min(queuePlayers.filter(p => p.name?.trim()).length, MAX_TEAMS)}
            canGenerate={canGenerate}
            generateBracket={generateBracket}
          />
        ) : (
          <BracketScreen
            format={format}
            hasSilverContenders={hasSilverContenders}
            activeBracketTab={activeBracketTab}
            setActiveBracketTab={setActiveBracketTab}
            activeRounds={activeRounds}
            setActivePick={setActivePick}
            goldChampion={goldChampion}
            silverChampion={silverChampion}
            mobileRound={mobileRound}
            setMobileRound={setMobileRound}
            goldThirdMatch={goldThirdMatch}
            silverThirdMatch={silverThirdMatch}
            onPickThird={side => (activeBracketTab === 'silver' ? setSilverThirdPick(side) : setThirdPick(side))}
          />
        )}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Setup screen
// ---------------------------------------------------------------------------
function SetupScreen({ teams, format, setFormat, playThird, setPlayThird, addTeam, removeTeam, updateTeam, shuffleSeeds, importQueuePlayers, queueImportCount, canGenerate, generateBracket }) {
  return (
    <div>
      {/* Format picker */}
      <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '18px', marginBottom: '20px' }}>
        <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '16px', margin: '0 0 12px', color: COLORS.ink }}>
          Bracket Format
        </h2>
        <div className="tm-format-toggle" style={{ display: 'flex', gap: '10px', marginBottom: '16px' }}>
          <FormatCard
            active={format === 'single'}
            title="Single Elimination"
            desc="Lose once and you're out. One bracket, one champion."
            onClick={() => setFormat('single')}
          />
          <FormatCard
            active={format === 'split'}
            title="Gold / Silver Split"
            desc="Round 1 winners play winners (Gold). Round 1 losers play losers (Silver). Two champions."
            onClick={() => setFormat('split')}
          />
        </div>

        <button
          onClick={() => setPlayThird(v => !v)}
          style={{
            width: '100%', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '12px',
            padding: '12px 14px', borderRadius: '8px', cursor: 'pointer', textAlign: 'left',
            border: `1.5px solid ${playThird ? COLORS.teal : '#D5DAD1'}`,
            background: playThird ? '#E7EEE9' : '#fff',
          }}
        >
          <span>
            <span style={{ display: 'block', fontWeight: 700, fontSize: '13.5px', color: playThird ? COLORS.teal : COLORS.ink }}>
              Play for 3rd Place
            </span>
            <span style={{ display: 'block', fontSize: '12px', color: COLORS.inkMute, marginTop: '2px' }}>
              Adds a bonus match between the two semifinal losers to decide 3rd. Needs at least 4 teams{format === 'split' ? ' per bracket' : ''}.
            </span>
          </span>
          <ToggleSwitch on={playThird} />
        </button>
      </div>

      {/* Teams */}
      <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '18px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '14px', flexWrap: 'wrap', gap: '10px' }}>
          <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '16px', margin: 0, color: COLORS.ink }}>
            Teams <span style={{ color: COLORS.inkMute, fontFamily: "'JetBrains Mono', monospace", fontSize: '13px', fontWeight: 400 }}>({teams.length}/{MAX_TEAMS})</span>
          </h2>
          <div style={{ display: 'flex', gap: '8px' }}>
            {queueImportCount >= MIN_TEAMS && (
              <Button className="tm-btn" variant="outlineDark" size="sm" icon={<FaUsers size={11} />} onClick={importQueuePlayers}>
                Import Queue
              </Button>
            )}
            <Button className="tm-btn" variant="outlineDark" size="sm" icon={<FaRandom size={11} />} onClick={shuffleSeeds}>
              Shuffle Seeds
            </Button>
            <Button className="tm-btn" variant="outlineDark" size="sm" icon={<FaPlus size={11} />} onClick={addTeam} disabled={teams.length >= MAX_TEAMS}>
              Add Team
            </Button>
          </div>
        </div>

        <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', marginBottom: '10px' }}>
          <div className="tm-team-row tm-desktop-only" style={{ padding: '0 4px' }}>
            <span />
            <span style={{ fontSize: '10.5px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>Team Name</span>
            <span style={{ fontSize: '10.5px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>Player 1</span>
            <span style={{ fontSize: '10.5px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>Player 2</span>
            <span />
          </div>

          {teams.map((team, i) => (
            <div key={team.id} className="tm-team-row" style={{ padding: '8px 4px', borderBottom: `1px solid ${COLORS.chalkDim}` }}>
              <span style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', color: COLORS.inkMute }}>
                {String(i + 1).padStart(2, '0')}
              </span>
              <input
                className="tm-team-name"
                value={team.name}
                onChange={e => updateTeam(team.id, { name: e.target.value })}
                placeholder={`Team ${i + 1}`}
                style={inputStyle}
              />
              <input
                className="tm-player1"
                value={team.player1}
                onChange={e => updateTeam(team.id, { player1: e.target.value })}
                placeholder="Player 1"
                style={inputStyle}
              />
              <input
                className="tm-player2"
                value={team.player2}
                onChange={e => updateTeam(team.id, { player2: e.target.value })}
                placeholder="Player 2 (optional)"
                style={inputStyle}
              />
              <button
                onClick={() => removeTeam(team.id)}
                disabled={teams.length <= MIN_TEAMS}
                title="Remove team"
                style={{
                  background: 'none', border: 'none', cursor: teams.length <= MIN_TEAMS ? 'not-allowed' : 'pointer',
                  color: teams.length <= MIN_TEAMS ? '#C9D0C6' : '#B3453D', padding: '8px', justifySelf: 'center',
                }}
              >
                <FaTimes size={13} />
              </button>
            </div>
          ))}
        </div>

        <p style={{ fontSize: '11.5px', color: COLORS.inkMute, margin: '10px 0 18px' }}>
          Need at least {MIN_TEAMS} named teams. Byes are added automatically if your count isn't a power of two (e.g. 15 teams → 1 first-round bye).
        </p>

        <Button
          variant="primary"
          size="lg"
          icon={<FaTrophy size={14} />}
          onClick={generateBracket}
          disabled={!canGenerate}
          style={{ width: '100%' }}
        >
          Generate Bracket
        </Button>
      </div>
    </div>
  )
}

function ToggleSwitch({ on }) {
  return (
    <span
      style={{
        flexShrink: 0, width: '38px', height: '22px', borderRadius: '999px', position: 'relative',
        background: on ? COLORS.teal : '#D5DAD1', transition: 'background 0.15s ease',
      }}
    >
      <span
        style={{
          position: 'absolute', top: '2px', left: on ? '18px' : '2px', width: '18px', height: '18px',
          borderRadius: '50%', background: '#fff', transition: 'left 0.15s ease', boxShadow: '0 1px 2px rgba(0,0,0,0.25)',
        }}
      />
    </span>
  )
}

function FormatCard({ active, title, desc, onClick }) {
  return (
    <button
      onClick={onClick}
      style={{
        flex: 1, textAlign: 'left', padding: '14px', borderRadius: '8px', cursor: 'pointer',
        border: `1.5px solid ${active ? COLORS.teal : '#D5DAD1'}`,
        background: active ? '#E7EEE9' : '#fff',
      }}
    >
      <p style={{ margin: '0 0 4px', fontWeight: 700, fontSize: '13.5px', color: active ? COLORS.teal : COLORS.ink }}>{title}</p>
      <p style={{ margin: 0, fontSize: '12px', color: COLORS.inkMute, lineHeight: 1.4 }}>{desc}</p>
    </button>
  )
}

// ---------------------------------------------------------------------------
// Bracket screen — desktop columns + mobile round-by-round
// ---------------------------------------------------------------------------
function BracketScreen({
  format, hasSilverContenders,
  activeBracketTab, setActiveBracketTab, activeRounds, setActivePick,
  goldChampion, silverChampion, mobileRound, setMobileRound,
  goldThirdMatch, silverThirdMatch, onPickThird,
}) {
  const totalRounds = activeRounds.length
  const activeThirdMatch = activeBracketTab === 'silver' ? silverThirdMatch : goldThirdMatch
  const thirdLabel = activeBracketTab === 'silver' ? '4th Place Match' : '3rd Place Match'
  const totalSteps = totalRounds + (activeThirdMatch ? 1 : 0)
  const lastStep = Math.max(0, totalSteps - 1)
  const safeMobileRound = Math.min(mobileRound, lastStep)
  const onThirdStep = activeThirdMatch && safeMobileRound === totalRounds

  return (
    <div>
      {format === 'split' && (
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <BracketTab
            active={activeBracketTab === 'gold'}
            label="Gold Bracket"
            icon={<FaTrophy size={12} />}
            color={COLORS.gold}
            bg={COLORS.goldBg}
            onClick={() => { setActiveBracketTab('gold'); setMobileRound(0) }}
          />
          <BracketTab
            active={activeBracketTab === 'silver'}
            label="Silver Bracket"
            icon={<FaMedal size={12} />}
            color={COLORS.silver}
            bg={COLORS.silverBg}
            onClick={() => { setActiveBracketTab('silver'); setMobileRound(0) }}
            disabled={!hasSilverContenders}
          />
        </div>
      )}

      {format === 'split' && activeBracketTab === 'silver' && !hasSilverContenders && (
        <p style={{ fontSize: '13px', color: COLORS.inkMute, background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px', padding: '16px' }}>
          The Silver bracket fills in once enough Round 1 matches in the Gold bracket have results (it's seeded from Round 1 losers).
        </p>
      )}

      {(format === 'single' || (activeBracketTab === 'gold') || hasSilverContenders) && activeRounds.length > 0 && (
        <>
          {/* Champion banners */}
          {activeBracketTab === 'gold' && goldChampion && (
            <ChampionBanner team={goldChampion} label="Gold Champion" color={COLORS.gold} bg={COLORS.goldBg} icon={<FaCrown size={22} color={COLORS.gold} />} />
          )}
          {activeBracketTab === 'silver' && silverChampion && (
            <ChampionBanner team={silverChampion} label="Silver Champion" color={COLORS.silver} bg={COLORS.silverBg} icon={<FaCrown size={22} color={COLORS.silver} />} />
          )}
          {activeThirdMatch?.winner && (
            <ChampionBanner team={activeThirdMatch.winner} label={thirdLabel.replace(' Match', '')} color={COLORS.bronze} bg={COLORS.bronzeBg} icon={<FaMedal size={20} color={COLORS.bronze} />} />
          )}

          {/* Desktop: full bracket, horizontal scroll — precisely aligned so every
              match sits centered between the two matches feeding into it, with
              connector lines, the way a real single-elimination bracket should look. */}
          <div className="tm-desktop-only">
            <BracketTree rounds={activeRounds} totalRounds={totalRounds} setActivePick={setActivePick} />

            {activeThirdMatch && (
              <div style={{ marginTop: '10px', maxWidth: '260px' }}>
                <p className="tm-round-header" style={{ textAlign: 'left', color: COLORS.bronze }}>
                  <FaMedal size={11} style={{ marginRight: '5px', position: 'relative', top: '1px' }} />
                  {thirdLabel}
                </p>
                <MatchCard match={activeThirdMatch} onPick={onPickThird} />
              </div>
            )}
          </div>

          {/* Mobile: one round (or the 3rd-place match) at a time */}
          <div className="tm-mobile-only">
            <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px', padding: '10px 6px' }}>
              <button
                onClick={() => setMobileRound(r => Math.max(0, r - 1))}
                disabled={safeMobileRound === 0}
                style={{ background: 'none', border: 'none', padding: '10px', color: safeMobileRound === 0 ? '#C9D0C6' : COLORS.ink, cursor: safeMobileRound === 0 ? 'not-allowed' : 'pointer' }}
              >
                <FaChevronLeft size={16} />
              </button>
              <span style={{
                fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '16px',
                color: onThirdStep ? COLORS.bronze : COLORS.ink, letterSpacing: '0.02em',
                display: 'inline-flex', alignItems: 'center', gap: '6px',
              }}>
                {onThirdStep && <FaMedal size={14} />}
                {onThirdStep ? thirdLabel : getRoundLabel(safeMobileRound, totalRounds)}
              </span>
              <button
                onClick={() => setMobileRound(r => Math.min(totalSteps - 1, r + 1))}
                disabled={safeMobileRound === lastStep}
                style={{ background: 'none', border: 'none', padding: '10px', color: safeMobileRound === lastStep ? '#C9D0C6' : COLORS.ink, cursor: safeMobileRound === lastStep ? 'not-allowed' : 'pointer' }}
              >
                <FaChevronRight size={16} />
              </button>
            </div>

            <div style={{ display: 'flex', gap: '5px', marginBottom: '16px', justifyContent: 'center', flexWrap: 'wrap' }}>
              {Array.from({ length: totalSteps }).map((_, i) => (
                <button
                  key={i}
                  onClick={() => setMobileRound(i)}
                  style={{
                    width: '9px', height: '9px', borderRadius: '50%', border: 'none', padding: 0, cursor: 'pointer',
                    background: i === safeMobileRound ? (i === totalRounds ? COLORS.bronze : COLORS.teal) : '#D5DAD1',
                  }}
                />
              ))}
            </div>

            <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
              {onThirdStep ? (
                <MatchCard match={activeThirdMatch} onPick={onPickThird} large />
              ) : (
                activeRounds[safeMobileRound]?.map((match, mIdx) => (
                  <MatchCard
                    key={mIdx}
                    match={match}
                    onPick={side => setActivePick(safeMobileRound, mIdx, side)}
                    large
                  />
                ))
              )}
            </div>
          </div>
        </>
      )}
    </div>
  )
}

function BracketTab({ active, label, icon, color, bg, onClick, disabled }) {
  return (
    <button
      onClick={onClick}
      disabled={disabled}
      style={{
        flex: 1, padding: '12px', borderRadius: '8px', cursor: disabled ? 'not-allowed' : 'pointer',
        border: `1.5px solid ${active ? color : '#D5DAD1'}`,
        background: active ? bg : '#fff',
        color: active ? color : COLORS.inkMute,
        fontWeight: 700, fontSize: '13.5px',
        display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '7px',
        opacity: disabled ? 0.5 : 1,
      }}
    >
      {icon} {label}
    </button>
  )
}

function ChampionBanner({ team, label, color, bg, icon }) {
  return (
    <div style={{
      display: 'flex', alignItems: 'center', gap: '12px', background: bg, border: `1.5px solid ${color}`,
      borderRadius: '10px', padding: '16px 18px', marginBottom: '20px',
    }}>
      {icon || <FaCrown size={22} color={color} />}
      <div>
        <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color, fontWeight: 700 }}>{label}</p>
        <p style={{ margin: '2px 0 0', fontSize: '18px', fontWeight: 800, color: COLORS.ink, fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase' }}>
          {displayName(team)}
        </p>
        {pairLine(team) && <p style={{ margin: '2px 0 0', fontSize: '12.5px', color: COLORS.inkMute }}>{pairLine(team)}</p>}
      </div>
    </div>
  )
}

// ---------------------------------------------------------------------------
// Desktop bracket tree — every match is placed at a precise pixel position
// so it sits centered between the two matches feeding into it (standard
// bracket geometry), with connector lines drawn between rounds. This is
// what makes the desktop view actually look/behave like a single-elim
// bracket instead of independently-spaced columns that drift out of sync.
// ---------------------------------------------------------------------------
const BRACKET_CARD_H = 90
const BRACKET_GAP0 = 22
const BRACKET_STUB = 18 // half of the 36px column gap set in .tm-bracket-scroll

function bracketTop(round0Unit, roundIdx, matchIdx) {
  const mult = Math.pow(2, roundIdx)
  return round0Unit * mult * matchIdx + (round0Unit * (mult - 1)) / 2
}

function BracketTree({ rounds, totalRounds, setActivePick }) {
  const unit = BRACKET_CARD_H + BRACKET_GAP0
  const round0Count = rounds[0]?.length || 0
  const totalHeight = Math.max(round0Count * unit - BRACKET_GAP0, BRACKET_CARD_H)
  const centerFor = (r, i) => bracketTop(unit, r, i) + BRACKET_CARD_H / 2

  return (
    <div className="tm-bracket-scroll">
      {rounds.map((round, rIdx) => (
        <div key={rIdx} className="tm-round-col">
          <p className="tm-round-header">{getRoundLabel(rIdx, totalRounds)}</p>
          <div style={{ position: 'relative', height: `${totalHeight}px` }}>
            {round.map((match, mIdx) => (
              <MatchCardFixed
                key={mIdx}
                match={match}
                top={bracketTop(unit, rIdx, mIdx)}
                onPick={side => setActivePick(rIdx, mIdx, side)}
              />
            ))}

            {rIdx < rounds.length - 1 && round.map((_, mIdx) => {
              if (mIdx % 2 !== 0) return null
              const yTop = centerFor(rIdx, mIdx)
              const yBottom = centerFor(rIdx, mIdx + 1)
              const yNext = centerFor(rIdx + 1, mIdx / 2)
              const spanTop = Math.min(yTop, yBottom)
              const spanHeight = Math.abs(yBottom - yTop)
              return (
                <div key={`connector-${mIdx}`}>
                  <div className="tm-connector" style={{ left: '100%', width: `${BRACKET_STUB}px`, height: '1px', top: `${yTop}px` }} />
                  <div className="tm-connector" style={{ left: '100%', width: `${BRACKET_STUB}px`, height: '1px', top: `${yBottom}px` }} />
                  <div className="tm-connector" style={{ left: `calc(100% + ${BRACKET_STUB}px)`, width: '1px', height: `${spanHeight}px`, top: `${spanTop}px` }} />
                  <div className="tm-connector" style={{ left: `calc(100% + ${BRACKET_STUB}px)`, width: `${BRACKET_STUB}px`, height: '1px', top: `${yNext}px` }} />
                </div>
              )
            })}
          </div>
        </div>
      ))}
    </div>
  )
}

function MatchCardFixed({ match, top, onPick }) {
  const { teamA, teamB, winner, bye } = match
  const clickable = teamA && teamB && !bye

  return (
    <div
      style={{
        position: 'absolute', top: `${top}px`, left: 0, right: 0, height: `${BRACKET_CARD_H}px`,
        background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px',
        overflow: 'hidden', boxSizing: 'border-box', display: 'flex', flexDirection: 'column',
      }}
    >
      <TeamSlotFixed team={teamA} isWinner={!!winner && !!teamA && winner.id === teamA.id} clickable={clickable} onClick={() => clickable && onPick('A')} />
      <div style={{ height: '1px', background: COLORS.chalkDim, flexShrink: 0 }} />
      <TeamSlotFixed team={teamB} isWinner={!!winner && !!teamB && winner.id === teamB.id} clickable={clickable} onClick={() => clickable && onPick('B')} bye={bye && !teamB} />
    </div>
  )
}

function TeamSlotFixed({ team, isWinner, clickable, onClick, bye }) {
  if (!team) {
    return (
      <div style={{ flex: 1, display: 'flex', alignItems: 'center', padding: '0 10px', fontSize: '12.5px', color: '#B7BFB9', fontStyle: 'italic' }}>
        {bye ? 'BYE' : 'TBD'}
      </div>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      style={{
        flex: 1, textAlign: 'left', padding: '0 10px', border: 'none', cursor: clickable ? 'pointer' : 'default',
        background: isWinner ? '#E7EEE9' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '6px', minHeight: 0,
      }}
    >
      <span style={{ minWidth: 0, overflow: 'hidden' }}>
        <span style={{
          display: 'block', fontWeight: isWinner ? 700 : 600, fontSize: '13px',
          color: isWinner ? COLORS.teal : COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName(team)}
        </span>
        {pairLine(team) && (
          <span style={{ display: 'block', fontSize: '10px', color: COLORS.inkMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pairLine(team)}
          </span>
        )}
      </span>
      {isWinner && <FaTrophy size={11} color={COLORS.teal} style={{ flexShrink: 0 }} />}
    </button>
  )
}

// ---------------------------------------------------------------------------
// Match card (flexible height — used by the mobile round-by-round view,
// where only one column is on screen at a time so alignment doesn't matter)
// ---------------------------------------------------------------------------
function MatchCard({ match, onPick, large }) {
  const { teamA, teamB, winner, bye } = match
  const clickable = teamA && teamB && !bye
  const pad = large ? '14px' : '10px'
  const nameSize = large ? '15px' : '13px'

  return (
    <div style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px', overflow: 'hidden' }}>
      <TeamSlot team={teamA} isWinner={!!winner && !!teamA && winner.id === teamA.id} clickable={clickable} onClick={() => clickable && onPick('A')} pad={pad} nameSize={nameSize} />
      <div style={{ height: '1px', background: COLORS.chalkDim }} />
      <TeamSlot team={teamB} isWinner={!!winner && !!teamB && winner.id === teamB.id} clickable={clickable} onClick={() => clickable && onPick('B')} pad={pad} nameSize={nameSize} bye={bye && !teamB} />
    </div>
  )
}

function TeamSlot({ team, isWinner, clickable, onClick, pad, nameSize, bye }) {
  if (!team) {
    return (
      <div style={{ padding: pad, fontSize: nameSize, color: '#B7BFB9', fontStyle: 'italic' }}>
        {bye ? 'BYE' : 'TBD'}
      </div>
    )
  }
  return (
    <button
      onClick={onClick}
      disabled={!clickable}
      style={{
        width: '100%', textAlign: 'left', padding: pad, border: 'none', cursor: clickable ? 'pointer' : 'default',
        background: isWinner ? '#E7EEE9' : '#fff',
        display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '8px',
      }}
    >
      <span style={{ minWidth: 0 }}>
        <span style={{
          display: 'block', fontWeight: isWinner ? 700 : 600, fontSize: nameSize,
          color: isWinner ? COLORS.teal : COLORS.ink, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap',
        }}>
          {displayName(team)}
        </span>
        {pairLine(team) && (
          <span style={{ display: 'block', fontSize: '10.5px', color: COLORS.inkMute, overflow: 'hidden', textOverflow: 'ellipsis', whiteSpace: 'nowrap' }}>
            {pairLine(team)}
          </span>
        )}
      </span>
      {isWinner && <FaTrophy size={12} color={COLORS.teal} style={{ flexShrink: 0 }} />}
    </button>
  )
}

export default TournamentMode
