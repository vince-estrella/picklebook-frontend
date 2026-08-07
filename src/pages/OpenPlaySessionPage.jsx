import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
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

function OpenPlaySessionPage() {
  const { code } = useParams()
  const navigate = useNavigate()
  const playerToken = localStorage.getItem('playerToken')
  const [session, setSession] = useState(null)
  const [loading, setLoading] = useState(Boolean(playerToken))
  const [error, setError] = useState(null)
  const [joining, setJoining] = useState(false)

  const link = `${window.location.origin}/open-play/${code}`

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
              <p className="rounded-lg bg-green-50 border border-green-100 p-4 text-sm text-green-800">
                You're joined. The host can track payment and check-in status here.
              </p>
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
                    openPlayPlayers: participants.map(player => ({
                      name: player.playerName,
                      skill: queueSkillFromOpenPlay(booking.openPlaySkillLevel),
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
          <h2 className="text-xl font-bold text-slate-950 mb-4">Joined Players</h2>
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
                {participants.map(player => (
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
                        <select value={player.paymentStatus} onChange={e => updateParticipant(player.id, { paymentStatus: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1">
                          <option value="Unpaid">Unpaid</option>
                          <option value="PaidCash">Paid cash</option>
                          <option value="PaidReclub">Paid via Reclub</option>
                          <option value="Waived">Waived</option>
                        </select>
                      ) : player.paymentStatus}
                    </td>
                    <td className="py-3 pr-4">
                      {session.isHost ? (
                        <select value={player.checkInStatus} onChange={e => updateParticipant(player.id, { checkInStatus: e.target.value })} className="border border-slate-200 rounded-md px-2 py-1">
                          <option value="Joined">Joined</option>
                          <option value="CheckedIn">Checked in</option>
                          <option value="NoShow">No-show</option>
                        </select>
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
