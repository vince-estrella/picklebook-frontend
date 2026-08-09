import { useEffect, useState } from 'react'
import { useNavigate, useParams, useSearchParams } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import Navbar from '../components/Navbar'
import api from '../services/api'

function formatTime12h(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h %= 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

function queueSkillFromOpenPlay(skillLevel) {
  if (/advanced/i.test(skillLevel || '')) return 'Advanced'
  if (/competitive|pro/i.test(skillLevel || '')) return 'Pro'
  if (/intermediate/i.test(skillLevel || '')) return 'Intermediate'
  return 'Beginner'
}

const PAYMENT_OPTIONS = [
  { value: 'Unpaid', label: 'Unpaid', className: 'border-red-200 bg-red-50 text-red-700' },
  { value: 'PaidCash', label: 'Cash', className: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'PaidReclub', label: 'Reclub', className: 'border-blue-200 bg-blue-50 text-blue-700' },
  { value: 'Waived', label: 'Waived', className: 'border-slate-200 bg-slate-100 text-slate-700' },
]

const CHECKIN_OPTIONS = [
  { value: 'Joined', label: 'Joined', className: 'border-slate-200 bg-slate-50 text-slate-700' },
  { value: 'CheckedIn', label: 'Checked in', className: 'border-green-200 bg-green-50 text-green-700' },
  { value: 'NoShow', label: 'No-show', className: 'border-amber-200 bg-amber-50 text-amber-700' },
]

const FILTERS = [
  { value: 'all', label: 'All' },
  { value: 'unpaid', label: 'Unpaid' },
  { value: 'paid', label: 'Paid' },
  { value: 'unchecked', label: 'Not checked in' },
  { value: 'checked', label: 'Checked in' },
]

function StatusButton({ active, children, className = '', ...props }) {
  return (
    <button
      type="button"
      className={`px-3 py-1.5 rounded-md border text-xs font-bold transition-colors ${active ? className : 'border-slate-200 bg-white text-slate-500 hover:bg-slate-50'}`}
      {...props}
    >
      {children}
    </button>
  )
}

function OpenPlaySessionPage() {
  const { code } = useParams()
  const [searchParams] = useSearchParams()
  const navigate = useNavigate()
  const playerToken = localStorage.getItem('playerToken')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(playerToken))
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)
  const [participantFilter, setParticipantFilter] = useState('all')

  const link = `${window.location.origin}/open-play/${code}`
  const queueCode = searchParams.get('queueCode')

  const loadSession = async () => {
    if (!playerToken) {
      setLoading(false)
      return
    }
    try {
      const res = await api.get(`/openplay/sessions/${code}`)
      setSession(res.data)
      setError(null)
    } catch {
      setError('Could not load this open play session.')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!playerToken) return undefined

    let cancelled = false
    const fetchSession = async () => {
      try {
        const res = await api.get(`/openplay/sessions/${code}`)
        if (cancelled) return
        setSession(res.data)
        setError(null)
      } catch {
        if (!cancelled) setError('Could not load this open play session.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    fetchSession()
    return () => {
      cancelled = true
    }
  }, [code, playerToken])

  const handleJoin = async () => {
    setJoining(true)
    setError(null)
    try {
      await api.post(`/openplay/sessions/${code}/join`)
      await loadSession()
      if (queueCode) {
        navigate(`/join?code=${queueCode.toUpperCase()}`)
      }
    } catch (err) {
      const message = err.response?.data
      setError(typeof message === 'string' ? message : 'Could not join open play.')
    } finally {
      setJoining(false)
    }
  }

  const updateParticipant = async (participantId, patch) => {
    await api.patch(`/openplay/participants/${participantId}`, patch)
    await loadSession()
  }

  if (!playerToken) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <main className="max-w-xl mx-auto px-6 py-16 text-center">
          <h1 className="text-3xl font-bold text-slate-900 mb-3">Log in to join Open Play</h1>
          <p className="text-slate-600 mb-6">PickleBook uses your player profile so the host can see who joined.</p>
          <button onClick={() => navigate('/login')} className="px-5 py-3 rounded-lg bg-green-700 text-white font-semibold">
            Log In
          </button>
        </main>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-slate-500 py-20">Loading open play...</p>
      </div>
    )
  }

  if (!session) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p className="text-center text-red-600 py-20">{error || 'Open play not found.'}</p>
      </div>
    )
  }

  const booking = session.booking
  const participants = session.participants || []
  const paidCount = participants.filter((player) => player.paymentStatus !== 'Unpaid').length
  const unpaidCount = participants.length - paidCount
  const checkedInCount = participants.filter((player) => player.checkInStatus === 'CheckedIn').length
  const filteredParticipants = participants.filter((player) => {
    if (participantFilter === 'unpaid') return player.paymentStatus === 'Unpaid'
    if (participantFilter === 'paid') return player.paymentStatus !== 'Unpaid'
    if (participantFilter === 'unchecked') return player.checkInStatus !== 'CheckedIn'
    if (participantFilter === 'checked') return player.checkInStatus === 'CheckedIn'
    return true
  })

  const markVisiblePaidCash = async () => {
    const targets = filteredParticipants.filter((player) => player.paymentStatus === 'Unpaid')
    if (targets.length === 0) return
    await Promise.all(targets.map((player) => api.patch(`/openplay/participants/${player.id}`, { paymentStatus: 'PaidCash' })))
    await loadSession()
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <main className="max-w-5xl mx-auto px-4 sm:px-6 py-10">
        <div className="grid grid-cols-1 lg:grid-cols-[1fr_320px] gap-6">
          <section className="bg-white rounded-xl border border-slate-200 p-6">
            <p className="text-xs font-bold uppercase tracking-wide text-green-700 mb-2">Open Play</p>
            <h1 className="text-3xl font-bold text-slate-950 mb-2">{booking?.court?.name || 'PickleBook Open Play'}</h1>
            <p className="text-slate-600 mb-6">{booking?.court?.address}</p>

            <div className="grid grid-cols-2 sm:grid-cols-5 gap-3 mb-6">
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Date</p>
                <p className="font-semibold text-slate-900">{new Date(booking.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Time</p>
                <p className="font-semibold text-slate-900">{formatTime12h(booking.startTime)} - {formatTime12h(booking.endTime)}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Level</p>
                <p className="font-semibold text-slate-900">{booking.openPlaySkillLevel || 'All Levels'}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Players</p>
                <p className="font-semibold text-slate-900">{session.joinedCount}/{session.maxPlayers}</p>
              </div>
              <div className="rounded-lg bg-slate-50 p-3">
                <p className="text-xs text-slate-500 mb-1">Fee</p>
                <p className="font-semibold text-slate-900">PHP {Number(booking.openPlayPricePerPlayer || 0).toFixed(0)}</p>
              </div>
            </div>

            {booking.openPlayNote && (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-900 mb-4">
                {booking.openPlayNote}
              </div>
            )}

            {booking.openPlayReclubLink && (
              <a href={booking.openPlayReclubLink} target="_blank" rel="noreferrer" className="inline-flex mb-6 text-sm font-semibold text-green-700 hover:underline">
                Open Reclub event
              </a>
            )}

            {!session.joined && (
              <button
                type="button"
                onClick={handleJoin}
                disabled={joining || session.isFull}
                className="w-full sm:w-auto px-5 py-3 rounded-lg bg-green-700 text-white font-semibold disabled:opacity-60 disabled:cursor-not-allowed"
              >
                {session.isFull ? 'Open Play Full' : joining ? 'Joining...' : 'Join Open Play'}
              </button>
            )}

            {session.joined && !session.isHost && (
              <div className="rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-800">
                <p>You're joined. The host can track payment and check-in status here.</p>
                {queueCode && (
                  <button
                    type="button"
                    onClick={() => navigate(`/join?code=${queueCode.toUpperCase()}`)}
                    className="mt-3 px-4 py-2 rounded-lg bg-green-700 text-white font-semibold"
                  >
                    Continue to Queue
                  </button>
                )}
              </div>
            )}
          </section>

          <aside className="bg-white rounded-xl border border-slate-200 p-6">
            <h2 className="font-bold text-slate-900 mb-3">Share QR</h2>
            <div className="flex justify-center rounded-xl bg-slate-50 p-5 mb-3">
              <QRCodeSVG value={link} size={190} bgColor="#f8fafc" fgColor="#0f172a" level="M" />
            </div>
            <p className="text-center text-sm font-mono tracking-wider text-slate-700 mb-4">{session.roomCode}</p>
            <button onClick={() => navigator.clipboard?.writeText(link)} className="w-full px-4 py-2 rounded-lg border border-slate-200 font-semibold text-slate-700">
              Copy Invite Link
            </button>
            {session.isHost && (
              <button
                onClick={() => navigate('/queue', {
                  state: {
                    openPlayRoomCode: session.roomCode,
                    openPlayPlayers: participants.map(player => ({
                      name: player.playerName,
                      skill: queueSkillFromOpenPlay(booking.openPlaySkillLevel),
                      profileImageUrl: player.playerProfileImageUrl,
                    })),
                  },
                })}
                className="w-full mt-3 px-4 py-2 rounded-lg bg-slate-900 font-semibold text-white"
              >
                Open Queue Manager
              </button>
            )}
          </aside>
        </div>

        <section className="mt-6 bg-white rounded-xl border border-slate-200 p-6">
          <div className="flex flex-col gap-1 mb-4">
            <h2 className="text-xl font-bold text-slate-950">Joined Players</h2>
            {session.isHost && (
              <p className="text-sm text-slate-500">
                {paidCount} paid · {unpaidCount} unpaid · {checkedInCount} checked in
              </p>
            )}
          </div>
          {session.isHost && (
            <>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3 mb-4">
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">Collected</p>
                  <p className="text-lg font-bold text-slate-900">PHP {Number((booking.openPlayPricePerPlayer || 0) * paidCount).toFixed(0)}</p>
                </div>
                <div className="rounded-lg bg-red-50 border border-red-100 p-3">
                  <p className="text-xs text-red-600 mb-1">Unpaid</p>
                  <p className="text-lg font-bold text-red-700">{unpaidCount}</p>
                </div>
                <div className="rounded-lg bg-green-50 border border-green-100 p-3">
                  <p className="text-xs text-green-700 mb-1">Checked in</p>
                  <p className="text-lg font-bold text-green-800">{checkedInCount}</p>
                </div>
                <div className="rounded-lg bg-slate-50 border border-slate-200 p-3">
                  <p className="text-xs text-slate-500 mb-1">Joined</p>
                  <p className="text-lg font-bold text-slate-900">{participants.length}/{session.maxPlayers}</p>
                </div>
              </div>
              <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-4">
                <div className="flex flex-wrap gap-2">
                  {FILTERS.map((filter) => (
                    <button
                      type="button"
                      key={filter.value}
                      onClick={() => setParticipantFilter(filter.value)}
                      className={`px-3 py-2 rounded-md border text-xs font-bold transition-colors ${
                        participantFilter === filter.value
                          ? 'border-green-700 bg-green-700 text-white'
                          : 'border-slate-200 bg-white text-slate-600 hover:bg-slate-50'
                      }`}
                    >
                      {filter.label}
                    </button>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={markVisiblePaidCash}
                  disabled={filteredParticipants.every((player) => player.paymentStatus !== 'Unpaid')}
                  className="px-3 py-2 rounded-md border border-slate-200 text-xs font-bold text-slate-700 disabled:opacity-50 disabled:cursor-not-allowed hover:bg-slate-50"
                >
                  Mark visible paid cash
                </button>
              </div>
            </>
          )}
          <div className="overflow-x-auto">
            <table className="min-w-full text-sm">
              <thead>
                <tr className="text-left text-slate-500 border-b border-slate-100">
                  <th className="py-2 pr-4">Player</th>
                  {session.isHost && <th className="py-2 pr-4">Contact</th>}
                  <th className="py-2 pr-4">Payment</th>
                  <th className="py-2 pr-4">Check-in</th>
                </tr>
              </thead>
              <tbody>
                {(session.isHost ? filteredParticipants : participants).map(player => (
                  <tr key={player.id} className="border-b border-slate-50">
                    <td className="py-3 pr-4 font-semibold text-slate-900">
                      {player.playerName}
                      {player.isHost && <span className="ml-2 text-xs text-green-700">(Host)</span>}
                    </td>
                    {session.isHost && (
                      <td className="py-3 pr-4 text-slate-600">
                        <div>{player.playerPhone || '-'}</div>
                        <div className="text-xs">{player.playerEmail || '-'}</div>
                      </td>
                    )}
                    <td className="py-3 pr-4">
                      {session.isHost ? (
                        <div className="flex flex-wrap gap-1.5">
                          {PAYMENT_OPTIONS.map((option) => (
                            <StatusButton key={option.value} active={player.paymentStatus === option.value} className={option.className} onClick={() => updateParticipant(player.id, { paymentStatus: option.value })}>
                              {option.label}
                            </StatusButton>
                          ))}
                        </div>
                      ) : player.paymentStatus}
                    </td>
                    <td className="py-3 pr-4">
                      {session.isHost ? (
                        <div className="flex flex-wrap gap-1.5">
                          {CHECKIN_OPTIONS.map((option) => (
                            <StatusButton key={option.value} active={player.checkInStatus === option.value} className={option.className} onClick={() => updateParticipant(player.id, { checkInStatus: option.value })}>
                              {option.label}
                            </StatusButton>
                          ))}
                        </div>
                      ) : player.checkInStatus}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        </section>
      </main>
    </div>
  )
}

export default OpenPlaySessionPage
