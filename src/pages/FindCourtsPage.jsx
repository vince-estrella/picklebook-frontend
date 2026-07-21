import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'

// Slot length used when checking whether a court has any opening left today.
const SLOT_MINUTES = 90
// Stop scanning once we've found this many available slots (we only need to
// know "some" exist, not the full list).
const SLOTS_TO_SHOW = 3

function timeStrToMinutes(t) {
  if (!t) return null
  const [h, m] = t.split(':').map(Number)
  return h * 60 + m
}

// UTC-based date strings (e.g. new Date().toISOString()) drift a day behind
// local time for anyone in a timezone ahead of UTC (like PH, UTC+8) during
// the early morning hours — this instead reads the date from the browser's
// local clock, matching how CourtDetailPage resolves "today".
function getLocalDateString(date) {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}

// Picks the right open/close pair for today's day of week. Note: this uses
// the browser's local clock, same simplification the rest of the booking
// flow doesn't have to worry about since the backend anchors to Asia/Manila
// for its own comparisons — fine as long as users are booking from PH time.
function getTodayHours(court) {
  const day = new Date().getDay() // 0 = Sunday, 6 = Saturday
  if (day === 0) return { open: court.sunOpen, close: court.sunClose }
  if (day === 6) return { open: court.satOpen, close: court.satClose }
  return { open: court.monFriOpen, close: court.monFriClose }
}

// Returns up to SLOTS_TO_SHOW genuinely available (unbooked, not-yet-passed)
// slots today — used only to check "does at least one exist", not to
// display exact times. A "00:00:00" open/close value is treated as "not set"
// (same convention CourtDetailPage already uses) so it falls back to a
// sensible default range instead of collapsing the whole day to zero slots.
function computeTodaySlots(court, bookingsToday) {
  const { open, close } = getTodayHours(court)
  const resolvedOpen = (!open || open === '00:00:00') ? '06:00' : open
  const resolvedClose = (!close || close === '00:00:00') ? '22:00' : close
  const openMin = timeStrToMinutes(resolvedOpen)
  const closeMin = timeStrToMinutes(resolvedClose)
  if (openMin == null || closeMin == null || openMin >= closeMin) return []

  const now = new Date()
  const nowMin = now.getHours() * 60 + now.getMinutes()

  const slots = []
  for (let start = openMin; start + SLOT_MINUTES <= closeMin; start += SLOT_MINUTES) {
    if (start < nowMin) continue // already passed today
    if (slots.length >= SLOTS_TO_SHOW) break

    const end = start + SLOT_MINUTES
    const overlapsBooking = bookingsToday.some(b => {
      const bStart = timeStrToMinutes(b.startTime)
      const bEnd = timeStrToMinutes(b.endTime)
      return bStart != null && bEnd != null && start < bEnd && end > bStart
    })

    if (!overlapsBooking) {
      slots.push({ start })
    }
  }

  return slots
}

// ── Design tokens — shared with HomePage / QueueManager / CourtDetailPage ──
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

const headingStyle = { fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase' }
const monoStyle = { fontFamily: "'JetBrains Mono', monospace" }

const inputStyle = {
  width: '100%',
  background: '#fff',
  borderRadius: '8px',
  border: `1px solid ${COLORS.chalkDim}`,
  padding: '10px 14px',
  fontSize: '14px',
  color: COLORS.ink,
  outline: 'none',
  boxSizing: 'border-box',
}

function FindCourtsPage() {
  const navigate = useNavigate()
  const [courts, setCourts] = useState([])
  const [search, setSearch] = useState('')
  const [typeFilter, setTypeFilter] = useState('All')
  const [minPrice, setMinPrice] = useState('')
  const [maxPrice, setMaxPrice] = useState('')
  const [viewMode, setViewMode] = useState('Grid')
  const [bookingsByCourtId, setBookingsByCourtId] = useState({})

  useEffect(() => {
    api.get('/courts')
      .then(res => setCourts(Array.isArray(res.data) ? res.data : []))
      .catch(err => {
        console.error(err)
        setCourts([])
      })
  }, [])

  useEffect(() => {
    if (courts.length === 0) return
    const todayStr = getLocalDateString(new Date())

    Promise.all(
      courts.map(c =>
        api.get(`/bookings/court/${c.id}`, { params: { date: todayStr } })
          .then(res => ({ id: c.id, bookings: Array.isArray(res.data) ? res.data : [] }))
          .catch(() => ({ id: c.id, bookings: [] }))
      )
    ).then(results => {
      const map = {}
      results.forEach(r => { map[r.id] = r.bookings })
      setBookingsByCourtId(map)
    })
  }, [courts])

  const filteredCourts = courts.filter(court => {
    const text = search.toLowerCase()
    const matchSearch =
      court.name.toLowerCase().includes(text) ||
      court.address.toLowerCase().includes(text)
    const matchType = typeFilter === 'All' || court.type === typeFilter
    const price = Number(court.pricePerHour)
    const matchMin = minPrice === '' || price >= Number(minPrice)
    const matchMax = maxPrice === '' || price <= Number(maxPrice)
    return matchSearch && matchType && matchMin && matchMax
  })

  return (
    <div className="min-h-screen" style={{ background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .fc-input:focus { outline: none; border-color: ${COLORS.teal}; box-shadow: 0 0 0 3px ${COLORS.teal}26; }
        .fc-view-btn:hover:not(.fc-view-active) { background: #fff; }
        .fc-reset-btn:hover { background: ${COLORS.chalkDim}55; border-color: ${COLORS.inkMute}; }
        .fc-card:hover { box-shadow: 0 12px 30px rgba(11,42,56,0.10); transform: translateY(-3px); }
        .fc-card-img:hover img { transform: scale(1.05); }
        .fc-slot-btn:not(:disabled):hover { background: ${COLORS.teal}; color: #fff; }
        .fc-book-btn:hover { background: ${COLORS.citronHover} !important; }
        .fc-book-btn:active { transform: scale(0.98); }
        input[type="checkbox"] { accent-color: ${COLORS.teal}; }
      `}</style>

      <Navbar />

      <div className="w-full max-w-[1280px] mx-auto px-6 md:px-12 pt-10 pb-16 flex flex-col md:flex-row gap-8">

        {/* ================= SIDEBAR ================= */}
        <div className="w-full md:w-64 shrink-0">
          <div className="p-5 rounded-xl flex flex-col gap-7" style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}` }}>
            <h2 className="text-lg" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>Filters</h2>

            {/* Location */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkMute }}>
                Location
              </label>
              <input
                type="text"
                placeholder="City or zip code"
                value={search}
                onChange={e => setSearch(e.target.value)}
                className="fc-input"
                style={inputStyle}
              />
            </div>

            {/* Price */}
            <div className="flex flex-col gap-2">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkMute }}>
                Price Range (per hr)
              </label>
              <div className="flex items-center gap-2">
                <input
                  type="number"
                  min="0"
                  placeholder="₱0"
                  value={minPrice}
                  onChange={e => setMinPrice(e.target.value)}
                  className="fc-input"
                  style={inputStyle}
                />
                <span style={{ color: COLORS.inkMute }}>–</span>
                <input
                  type="number"
                  min="0"
                  placeholder="₱1000"
                  value={maxPrice}
                  onChange={e => setMaxPrice(e.target.value)}
                  className="fc-input"
                  style={inputStyle}
                />
              </div>
            </div>

            {/* Availability */}
            <div className="flex flex-col gap-3">
              <label className="text-xs font-semibold uppercase tracking-wide" style={{ color: COLORS.inkMute }}>
                Availability
              </label>

              <label className="flex gap-2 items-center cursor-pointer">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm" style={{ color: COLORS.ink }}>Available Today</span>
              </label>

              <label className="flex gap-2 items-center cursor-pointer">
                <input type="checkbox" className="cursor-pointer" />
                <span className="text-sm" style={{ color: COLORS.ink }}>Instant Book</span>
              </label>

              <label className="flex gap-2 items-center cursor-pointer">
                <input
                  type="checkbox"
                  checked={typeFilter === 'Indoor'}
                  onChange={() => setTypeFilter(typeFilter === 'Indoor' ? 'All' : 'Indoor')}
                  className="cursor-pointer"
                />
                <span className="text-sm" style={{ color: COLORS.ink }}>Indoor Courts</span>
              </label>
            </div>

            <button
              onClick={() => { setSearch(''); setTypeFilter('All'); setMinPrice(''); setMaxPrice('') }}
              className="fc-reset-btn rounded-lg py-2.5 text-sm font-medium transition-colors duration-150 active:scale-[0.98]"
              style={{ border: `1px solid ${COLORS.chalkDim}`, color: COLORS.inkMute }}
            >
              Reset All Filters
            </button>
          </div>
        </div>

        {/* ================= COURTS SECTION ================= */}
        <div className="flex-1 flex flex-col gap-6">

          {/* Header */}
          <div className="flex justify-between items-end flex-wrap gap-4">
            <div>
              <h1 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 800 }}>Available Courts</h1>
              <p className="text-sm mt-1" style={{ color: COLORS.inkMute }}>
                Showing {filteredCourts.length} court{filteredCourts.length === 1 ? '' : 's'} near your location
              </p>
            </div>

            <div className="rounded-lg p-1 flex" style={{ background: COLORS.chalk, border: `1px solid ${COLORS.chalkDim}` }}>
              {['Grid', 'Map'].map(mode => (
                <button
                  key={mode}
                  onClick={() => setViewMode(mode)}
                  className={`fc-view-btn px-5 py-2 rounded-md text-sm font-medium transition-colors duration-150 ${viewMode === mode ? 'fc-view-active' : ''}`}
                  style={viewMode === mode ? { background: COLORS.navy, color: COLORS.chalk } : { color: COLORS.inkMute }}
                >
                  {mode}
                </button>
              ))}
            </div>
          </div>

          {/* Court cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {filteredCourts.map(court => (
              <div
                key={court.id}
                className="fc-card rounded-2xl overflow-hidden transition-all duration-200"
                style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}` }}
              >
                {/* Image */}
                <div className="fc-card-img h-56 relative overflow-hidden" style={{ background: COLORS.chalkDim }}>
                  {court.images?.length > 0 ? (
                    <img
                      src={court.images[0].imageUrl}
                      alt={court.name}
                      className="w-full h-full object-cover transition-transform duration-300"
                    />
                  ) : (
                    <div className="flex items-center justify-center h-full" style={{ color: COLORS.inkMute }}>
                      No Image
                    </div>
                  )}

                  {/* Type */}
                  <div
                    className="absolute top-4 right-4 px-3 py-1 rounded-full font-bold text-xs"
                    style={court.type === 'Indoor' ? { background: '#E7EEE9', color: COLORS.teal } : { background: COLORS.chalkDim, color: COLORS.inkMute }}
                  >
                    {court.type}
                  </div>
                </div>

                {/* Content */}
                <div className="p-6">
                  <div className="flex justify-between items-start gap-3">
                    <div>
                      <h2 className="font-semibold" style={{ color: COLORS.ink }}>{court.name}</h2>
                      <p className="text-sm mt-1 flex items-center gap-1" style={{ color: COLORS.inkMute }}>
                        <MapPin size={13} /> {court.address}
                      </p>
                    </div>
                    <div className="text-right shrink-0">
                      <p className="font-bold" style={{ ...monoStyle, color: COLORS.ink }}>₱{court.pricePerHour}</p>
                      <p className="text-xs" style={{ color: COLORS.inkMute }}>per hour</p>
                    </div>
                  </div>

                  {/* Available today? */}
                  <div className="mt-5">
                    {(() => {
                      const slots = computeTodaySlots(court, bookingsByCourtId[court.id] || [])
                      const hasAvailability = slots.length > 0
                      return (
                        <span
                          className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-full text-xs font-bold uppercase tracking-wide"
                          style={
                            hasAvailability
                              ? { background: '#E7EEE9', color: COLORS.teal }
                              : { background: COLORS.chalkDim, color: COLORS.inkMute }
                          }
                        >
                          {hasAvailability ? 'Available slots today' : 'No available slots today'}
                        </span>
                      )
                    })()}
                  </div>

                  {/* Book button */}
                  <button
                    onClick={() => navigate(`/courts/${court.id}`)}
                    className="fc-book-btn mt-6 w-full py-3.5 rounded-xl font-semibold transition-all duration-150"
                    style={{ background: COLORS.citron, color: COLORS.navyDeep }}
                  >
                    Book Now
                  </button>
                </div>
              </div>
            ))}

            {filteredCourts.length === 0 && (
              <div className="md:col-span-2 rounded-2xl p-12 text-center" style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}`, color: COLORS.inkMute }}>
                No courts match your filters.
              </div>
            )}
          </div>
        </div>
      </div>
    </div>
  )
}

export default FindCourtsPage