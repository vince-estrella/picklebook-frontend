import { useEffect, useMemo, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { QRCodeSVG } from 'qrcode.react'
import { Copy, Menu, Plus, RefreshCw, XCircle } from 'lucide-react'
import OwnerSidebar from '../components/OwnerSidebar'
import api from '../services/api'

function toDateInput(date = new Date()) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

function formatTime(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = Number(hStr)
  const period = h >= 12 ? 'PM' : 'AM'
  h %= 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

function formatMoney(value) {
  return `PHP ${Number(value || 0).toFixed(2)}`
}

function OwnerOpenPlayPage() {
  const navigate = useNavigate()
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [courts, setCourts] = useState([])
  const [sessions, setSessions] = useState([])
  const [selectedRoom, setSelectedRoom] = useState(null)
  const [detail, setDetail] = useState(null)
  const [loading, setLoading] = useState(true)
  const [saving, setSaving] = useState(false)
  const [error, setError] = useState('')
  const [form, setForm] = useState({
    courtId: '',
    date: toDateInput(),
    startTime: '18:00',
    endTime: '20:00',
    maxPlayers: 16,
    pricePerPlayer: 50,
    skillLevel: 'All Levels',
    note: '',
    reclubLink: '',
  })

  const selectedSession = useMemo(
    () => sessions.find((session) => session.roomCode === selectedRoom),
    [sessions, selectedRoom]
  )

  const loadData = async () => {
    try {
      const [courtsRes, sessionsRes] = await Promise.all([
        api.get('/courts/owner'),
        api.get('/openplay/owner/sessions'),
      ])
      setCourts(courtsRes.data)
      setSessions(sessionsRes.data)
      setForm((prev) => ({
        ...prev,
        courtId: prev.courtId || courtsRes.data?.[0]?.id || '',
      }))
      setSelectedRoom((prev) => prev || sessionsRes.data?.[0]?.roomCode || null)
      setError('')
    } catch {
      navigate('/owner/login')
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    Promise.all([
      api.get('/courts/owner'),
      api.get('/openplay/owner/sessions'),
    ])
      .then(([courtsRes, sessionsRes]) => {
        setCourts(courtsRes.data)
        setSessions(sessionsRes.data)
        setForm((prev) => ({
          ...prev,
          courtId: prev.courtId || courtsRes.data?.[0]?.id || '',
        }))
        setSelectedRoom((prev) => prev || sessionsRes.data?.[0]?.roomCode || null)
        setError('')
      })
      .catch(() => {
        navigate('/owner/login')
      })
      .finally(() => {
        setLoading(false)
      })
  }, [navigate])

  useEffect(() => {
    if (!selectedRoom) {
      return
    }
    api
      .get(`/openplay/owner/sessions/${selectedRoom}`)
      .then((res) => setDetail(res.data))
      .catch(() => setDetail(null))
  }, [selectedRoom])

  const handleSubmit = async (event) => {
    event.preventDefault()
    setSaving(true)
    setError('')
    try {
      const payload = {
        courtId: Number(form.courtId),
        date: form.date,
        startTime: `${form.startTime}:00`,
        endTime: `${form.endTime}:00`,
        maxPlayers: Number(form.maxPlayers),
        pricePerPlayer: Number(form.pricePerPlayer),
        skillLevel: form.skillLevel,
        note: form.note,
        reclubLink: form.reclubLink,
      }
      const res = await api.post('/openplay/owner/sessions', payload)
      await loadData()
      setSelectedRoom(res.data.roomCode)
    } catch (err) {
      const message = err.response?.data
      setError(typeof message === 'string' ? message : 'Could not create Open Play.')
    } finally {
      setSaving(false)
    }
  }

  const updateParticipant = async (participantId, patch) => {
    await api.patch(`/openplay/owner/participants/${participantId}`, patch)
    const res = await api.get(`/openplay/owner/sessions/${selectedRoom}`)
    setDetail(res.data)
  }

  const cancelSession = async (session) => {
    const confirmed = window.confirm(`Cancel Open Play ${session.roomCode}?`)
    if (!confirmed) return
    await api.patch(`/openplay/owner/sessions/${session.id}/cancel`)
    await loadData()
  }

  if (loading) {
    return <div className="min-h-screen flex items-center justify-center owner-workspace text-slate-500">Loading...</div>
  }

  const activeDetail = detail || selectedSession
  const inviteLink = selectedRoom ? `${window.location.origin}/open-play/${selectedRoom}` : ''
  const participants = activeDetail?.participants || []
  const booking = activeDetail?.booking

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 backdrop-blur-md sticky top-0 z-10 flex items-center justify-between gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button onClick={() => setSidebarOpen(true)} className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200" aria-label="Open menu">
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="owner-kicker mb-1">Queue Events</p>
              <h1 className="owner-title text-xl sm:text-2xl leading-8 truncate">Open Play</h1>
            </div>
          </div>
          <button onClick={loadData} className="owner-secondary-btn px-3 py-2 flex items-center gap-2 text-sm">
            <RefreshCw className="w-4 h-4" />
            Refresh
          </button>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 grid grid-cols-1 xl:grid-cols-[420px_1fr] gap-6">
          <form onSubmit={handleSubmit} className="owner-panel p-6 flex flex-col gap-5">
            <div>
              <p className="owner-kicker mb-1">Create Session</p>
              <h2 className="text-slate-900 text-lg font-bold">Owner-hosted Open Play</h2>
            </div>

            {error && <div className="px-4 py-3 rounded-lg bg-red-50 border border-red-200 text-red-700 text-sm">{error}</div>}

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Court
              <select value={form.courtId} onChange={(e) => setForm({ ...form, courtId: e.target.value })} className="owner-field px-3 py-3 text-sm" required>
                {courts.map((court) => <option key={court.id} value={court.id}>{court.name}</option>)}
              </select>
            </label>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Date
                <input type="date" min={toDateInput()} value={form.date} onChange={(e) => setForm({ ...form, date: e.target.value })} className="owner-field px-3 py-3 text-sm" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Price per player
                <input type="number" min="0" step="1" value={form.pricePerPlayer} onChange={(e) => setForm({ ...form, pricePerPlayer: e.target.value })} className="owner-field px-3 py-3 text-sm" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Start
                <input type="time" value={form.startTime} onChange={(e) => setForm({ ...form, startTime: e.target.value })} className="owner-field px-3 py-3 text-sm" required />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                End
                <input type="time" value={form.endTime} onChange={(e) => setForm({ ...form, endTime: e.target.value })} className="owner-field px-3 py-3 text-sm" required />
              </label>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Max players
                <input type="number" min="2" max="64" value={form.maxPlayers} onChange={(e) => setForm({ ...form, maxPlayers: e.target.value })} className="owner-field px-3 py-3 text-sm" />
              </label>
              <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
                Skill level
                <select value={form.skillLevel} onChange={(e) => setForm({ ...form, skillLevel: e.target.value })} className="owner-field px-3 py-3 text-sm">
                  <option>All Levels</option>
                  <option>Beginner</option>
                  <option>Intermediate</option>
                  <option>Advanced</option>
                  <option>Competitive</option>
                </select>
              </label>
            </div>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Reclub link
              <input value={form.reclubLink} onChange={(e) => setForm({ ...form, reclubLink: e.target.value })} placeholder="https://..." className="owner-field px-3 py-3 text-sm" />
            </label>

            <label className="flex flex-col gap-2 text-sm font-semibold text-slate-700">
              Host note
              <textarea value={form.note} onChange={(e) => setForm({ ...form, note: e.target.value })} rows={3} className="owner-field px-3 py-3 text-sm resize-none" placeholder="Payment instructions, level notes, or meetup details" />
            </label>

            <button type="submit" disabled={saving || courts.length === 0} className="owner-primary-btn px-5 py-3 flex items-center justify-center gap-2 text-sm disabled:opacity-60 disabled:cursor-not-allowed">
              <Plus className="w-4 h-4" />
              {saving ? 'Creating...' : 'Create Open Play'}
            </button>
          </form>

          <section className="flex flex-col gap-6 min-w-0">
            <div className="owner-panel p-0 overflow-hidden">
              <div className="px-6 py-4 border-b border-stone-200 flex items-center justify-between">
                <h2 className="text-slate-900 font-bold">Sessions</h2>
                <span className="text-slate-500 text-sm">{sessions.length} total</span>
              </div>
              <div className="divide-y divide-stone-200">
                {sessions.length === 0 ? (
                  <p className="px-6 py-8 text-slate-500 text-sm">No Open Play sessions yet.</p>
                ) : sessions.map((session) => {
                  const b = session.booking
                  const active = selectedRoom === session.roomCode
                  return (
                    <button key={session.id} onClick={() => { setDetail(null); setSelectedRoom(session.roomCode) }} className={`w-full px-6 py-4 text-left transition-colors ${active ? 'bg-green-50' : 'hover:bg-gray-50'}`}>
                      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-2">
                        <div>
                          <p className="text-slate-900 font-semibold">{b?.court?.name || 'Court'} <span className="text-xs text-slate-500 font-mono">{session.roomCode}</span></p>
                          <p className="text-slate-500 text-sm">{new Date(b?.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', timeZone: 'Asia/Manila' })} · {formatTime(b?.startTime)} - {formatTime(b?.endTime)}</p>
                        </div>
                        <div className="text-sm text-slate-700">{session.joinedCount}/{session.maxPlayers} · {formatMoney(b?.openPlayPricePerPlayer)}</div>
                      </div>
                    </button>
                  )
                })}
              </div>
            </div>

            {activeDetail && (
              <div className="owner-panel p-6 grid grid-cols-1 lg:grid-cols-[240px_1fr] gap-6">
                <div>
                  <div className="rounded-lg bg-slate-50 border border-slate-200 p-4 flex justify-center">
                    <QRCodeSVG value={inviteLink} size={180} bgColor="#f8fafc" fgColor="#0f172a" />
                  </div>
                  <p className="text-center font-mono text-sm tracking-wider text-slate-700 mt-3">{selectedRoom}</p>
                  <button onClick={() => navigator.clipboard?.writeText(inviteLink)} className="owner-secondary-btn mt-3 w-full px-4 py-2 flex items-center justify-center gap-2 text-sm">
                    <Copy className="w-4 h-4" />
                    Copy Link
                  </button>
                  <button onClick={() => cancelSession(activeDetail)} className="owner-danger-btn mt-3 w-full px-4 py-2 flex items-center justify-center gap-2 text-sm">
                    <XCircle className="w-4 h-4" />
                    Cancel
                  </button>
                </div>

                <div className="min-w-0">
                  <div className="mb-4">
                    <h2 className="text-xl font-bold text-slate-900">{booking?.court?.name}</h2>
                    <p className="text-slate-500 text-sm">{formatMoney(booking?.openPlayPricePerPlayer)} per player · {participants.length}/{activeDetail.maxPlayers} joined</p>
                  </div>
                  <div className="overflow-x-auto">
                    <table className="w-full min-w-[680px] text-sm">
                      <thead>
                        <tr className="text-left text-slate-500 border-b border-stone-200">
                          <th className="py-2 pr-4">Player</th>
                          <th className="py-2 pr-4">Contact</th>
                          <th className="py-2 pr-4">Payment</th>
                          <th className="py-2 pr-4">Check-in</th>
                        </tr>
                      </thead>
                      <tbody>
                        {participants.length === 0 ? (
                          <tr><td colSpan={4} className="py-8 text-slate-500">No players joined yet.</td></tr>
                        ) : participants.map((player) => (
                          <tr key={player.id} className="border-b border-stone-100">
                            <td className="py-3 pr-4 font-semibold text-slate-900">{player.playerName}</td>
                            <td className="py-3 pr-4 text-slate-600">
                              <div>{player.playerPhone || '-'}</div>
                              <div className="text-xs">{player.playerEmail || '-'}</div>
                            </td>
                            <td className="py-3 pr-4">
                              <select value={player.paymentStatus} onChange={(e) => updateParticipant(player.id, { paymentStatus: e.target.value })} className="owner-field px-2 py-1 text-xs">
                                <option value="Unpaid">Unpaid</option>
                                <option value="PaidCash">Paid cash</option>
                                <option value="PaidReclub">Paid via Reclub</option>
                                <option value="Waived">Waived</option>
                              </select>
                            </td>
                            <td className="py-3 pr-4">
                              <select value={player.checkInStatus} onChange={(e) => updateParticipant(player.id, { checkInStatus: e.target.value })} className="owner-field px-2 py-1 text-xs">
                                <option value="Joined">Joined</option>
                                <option value="CheckedIn">Checked in</option>
                                <option value="NoShow">No-show</option>
                              </select>
                            </td>
                          </tr>
                        ))}
                      </tbody>
                    </table>
                  </div>
                </div>
              </div>
            )}
          </section>
        </main>
      </div>
    </div>
  )
}

export default OwnerOpenPlayPage
