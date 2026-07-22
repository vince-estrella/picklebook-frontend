import { useEffect, useMemo, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import {
  Star, MapPin, Share2, Heart, ShieldCheck, KeyRound, Droplets,
  Sun, Fan, Wifi, ParkingCircle, ShowerHead, Flag, ChevronRight, Check, MessageCircle
} from 'lucide-react'
import CourtMap from '../components/CourtMap'
import MessageOwnerModal from '../components/MessageOwnerModal'
import api from '../services/api'
import Navbar from '../components/Navbar'

// ── Design tokens — shared with HomePage / QueueManager / ContactSupportPage ──
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

// ── Constants ────────────────────────────────────────────────────────────
const SERVICE_FEE = 5 // flat platform fee per booking, in the same currency as pricePerHour
const API_BASE = 'https://picklebook-api-production.up.railway.app'

// Maps a raw amenity string to an icon. Falls back to a generic check mark
// for anything the design doesn't have a specific icon for yet.
const AMENITY_ICONS = [
  { match: /light/i, icon: Sun },
  { match: /fan|cool/i, icon: Fan },
  { match: /wi-?fi/i, icon: Wifi },
  { match: /park/i, icon: ParkingCircle },
  { match: /locker|shower/i, icon: ShowerHead },
  { match: /water/i, icon: Droplets },
]
function iconForAmenity(name) {
  const found = AMENITY_ICONS.find(a => a.match.test(name))
  return found ? found.icon : Check
}

// Works out "Open now" from the same open/close fields the hours table uses.
function computeIsOpenNow(court) {
  if (!court) return null
  const now = new Date()
  const day = now.getDay()
  const open = day === 0 ? court.sunOpen : day === 6 ? court.satOpen : court.monFriOpen
  const close = day === 0 ? court.sunClose : day === 6 ? court.satClose : court.monFriClose
  if (!open || !close) return null
  const [oh, om] = open.split(':').map(Number)
  const [ch, cm] = close.split(':').map(Number)
  const nowMin = now.getHours() * 60 + now.getMinutes()
  return nowMin >= oh * 60 + om && nowMin < ch * 60 + cm
}

function formatCurrency(n) {
  return `₱${Number(n).toFixed(2)}`
}

// Converts a "HH:MM" 24-hour string into a compact 12-hour label, e.g.
// "11:00" -> "11AM", "13:00" -> "1PM", "13:30" -> "1:30PM".
function formatHour12(timeStr) {
  const [h, m] = timeStr.split(':').map(Number)
  const period = h >= 12 ? 'PM' : 'AM'
  let hour12 = h % 12
  if (hour12 === 0) hour12 = 12
  return m ? `${hour12}:${String(m).padStart(2, '0')}${period}` : `${hour12}${period}`
}

// Builds the "11AM – 12PM" style label shown on each bookable slot button.
function formatSlotRangeLabel(slot) {
  return `${formatHour12(slot.start)} – ${formatHour12(slot.end)}`
}

function generateSlots(open, close) {
  const slots = []
  let [startH] = open.split(':').map(Number)
  const [endH] = close.split(':').map(Number)
  while (startH < endH) {
    const start = `${String(startH).padStart(2, '0')}:00`
    const end = `${String(startH + 1).padStart(2, '0')}:00`
    slots.push({ start, end })
    startH++
  }
  return slots
}

function StarRating({ value, size = 14 }) {
  if (value === undefined || value === null) return null
  return (
    <span className="inline-flex items-center gap-1">
      <Star size={size} className="fill-amber-500 text-amber-500" />
      <span className="text-sm font-bold" style={{ color: COLORS.ink }}>{value.toFixed(1)}</span>
    </span>
  )
}

function CourtDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [court, setCourt] = useState(null)
  const getLocalDateString = (date) => {
  const year = date.getFullYear()
  const month = String(date.getMonth() + 1).padStart(2, '0')
  const day = String(date.getDate()).padStart(2, '0')
  return `${year}-${month}-${day}`
}
const getDefaultDate = () => {
  const now = new Date()
  if (now.getHours() >= 22) {
    const tomorrow = new Date(now)
    tomorrow.setDate(tomorrow.getDate() + 1)
    return getLocalDateString(tomorrow)
  }
  return getLocalDateString(now)
}
const [selectedDate, setSelectedDate] = useState(getDefaultDate())
  const [bookedSlots, setBookedSlots] = useState([])
  const [selectedSlots, setSelectedSlots] = useState([])
  const [showFullDescription, setShowFullDescription] = useState(false)
  const [saved, setSaved] = useState(false)
  const [showAllReviews, setShowAllReviews] = useState(false)
  const [showMessageModal, setShowMessageModal] = useState(false)

  useEffect(() => {
    api.get(`/courts/${id}`).then(res => setCourt(res.data))
  }, [id])

  useEffect(() => {
    if (!selectedDate) return
    api.get(`/bookings/court/${id}?date=${selectedDate}`)
      .then(res => setBookedSlots(res.data))
      .catch(() => setBookedSlots([]))
  }, [id, selectedDate])

  if (!court) {
    return (
      <div className="min-h-screen" style={{ background: COLORS.chalk }}>
        <style>{FONT_IMPORT}</style>
        <Navbar />
        <div className="p-8" style={{ color: COLORS.inkMute }}>Loading...</div>
      </div>
    )
  }

  const dayOfWeek = new Date(selectedDate).getDay()
  const openTime = dayOfWeek === 0 ? court.sunOpen : dayOfWeek === 6 ? court.satOpen : court.monFriOpen
  const closeTime = dayOfWeek === 0 ? court.sunClose : dayOfWeek === 6 ? court.satClose : court.monFriClose
  const slots = generateSlots(
    (!openTime || openTime === '00:00:00') ? '06:00' : openTime,
    (!closeTime || closeTime === '00:00:00') ? '22:00' : closeTime
  )

const isBooked = (slot) => bookedSlots.some(b => {
  const bStart = b.startTime.substring(0, 5)
  const bEnd = b.endTime.substring(0, 5)
  return slot.start >= bStart && slot.start < bEnd
})
  const isPast = (slot) => {
  const now = new Date()
  const todayStr = getLocalDateString(now)
  if (selectedDate !== todayStr) return false
  const slotHour = parseInt(slot.start.split(':')[0])
  return slotHour <= now.getHours()
}
  const isSlotDisabled = (slot) => isBooked(slot) || isPast(slot)

  // Click-to-click range selection: the first click sets the anchor/start,
  // the next click extends the selection to that slot (inclusive of every
  // hour in between), the same way a calendar date-range picker works.
  // Clicking the sole selected slot again clears the selection, and clicking
  // a fresh slot after a range is already selected starts a brand new range.
  const toggleSlot = (slot) => {
    setSelectedSlots(prev => {
      if (prev.length === 1 && prev[0].start === slot.start) {
        return []
      }
      if (prev.length === 0) {
        return [slot]
      }

      const anchor = prev[0]
      const anchorIdx = slots.findIndex(s => s.start === anchor.start)
      const clickedIdx = slots.findIndex(s => s.start === slot.start)
      if (anchorIdx === -1 || clickedIdx === -1 || anchorIdx === clickedIdx) {
        return [slot]
      }

      const from = Math.min(anchorIdx, clickedIdx)
      const to = Math.max(anchorIdx, clickedIdx)
      const range = slots.slice(from, to + 1)

      // If any hour inside the requested range is booked or in the past,
      // treat this click as the start of a fresh selection instead.
      if (range.some(isSlotDisabled)) {
        return [slot]
      }

      return range.sort((a, b) => a.start.localeCompare(b.start))
    })
  }

  const amenitiesList = court.amenities ? court.amenities.split(',').map(a => a.trim()).filter(Boolean) : []
  const images = court.images && court.images.length > 0 ? court.images : []
  const latitude = court.latitude ?? 10.3157
  const longitude = court.longitude ?? 123.8854

  // ── Fields the backend doesn't provide yet — sensible, clearly-marked fallbacks ──
const hostName = court.ownerName || 'the PickleBook team'
const hostAvatarUrl = court.ownerProfileImageUrl || null
  const rating = typeof court.rating === 'number' ? court.rating : null
  const reviewCount = typeof court.reviewCount === 'number' ? court.reviewCount : 0
  const reviews = Array.isArray(court.reviews) ? court.reviews : []
  const breadcrumb = (court.city && court.barangay)
    ? [court.city, court.barangay, court.name]
    : (court.address ? court.address.split(',').map(s => s.trim()) : [court.name])

  const isOpen = computeIsOpenNow(court)

  const subtotal = selectedSlots.length * (court.pricePerHour || 0)
  const total = selectedSlots.length > 0 ? subtotal + SERVICE_FEE : 0

  const trustBadges = [
    { icon: ShieldCheck, title: 'Verified court', body: 'Inspected regularly for quality.' },
    { icon: KeyRound, title: 'Quick check-in', body: 'Digital access codes provided.' },
    {
      icon: Droplets,
      title: amenitiesList.length > 0 ? 'Amenities included' : 'Standard setup',
      body: amenitiesList.length > 0 ? amenitiesList.slice(0, 2).join(', ') + '.' : 'Court and nets ready to play.'
    },
  ]

  const description = court.description || ''
  const isLongDescription = description.length > 220
  const shownDescription = !isLongDescription || showFullDescription
    ? description
    : description.slice(0, 220).trimEnd() + '…'

  const handleShare = async () => {
    const url = window.location.href
    if (navigator.share) {
      try { await navigator.share({ title: court.name, url }) } catch { /* user cancelled */ }
    } else {
      await navigator.clipboard.writeText(url)
      alert('Link copied to clipboard')
    }
  }

  const visibleReviews = showAllReviews ? reviews : reviews.slice(0, 2)

  return (
    <div className="min-h-screen" style={{ background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .cd-icon-btn:hover { background: ${COLORS.chalkDim}44; }
        .cd-thumb:hover { transform: scale(1.05); }
        .cd-badge-card:hover { background: ${COLORS.chalkDim}; }
        .cd-slot:not(:disabled):hover { outline-color: ${COLORS.teal} !important; background: #F5F7F3; }
        .cd-book-btn:not(:disabled):hover { background: ${COLORS.citronHover} !important; }
        .cd-book-btn:not(:disabled):active { transform: scale(0.98); }
        .cd-more-link:hover { color: ${COLORS.navyDeep} !important; }
        .cd-show-photos:hover { background: #fff; }
        .cd-report:hover { color: ${COLORS.ink} !important; }
        .cd-all-reviews:hover { background: ${COLORS.navy}; color: #fff !important; }
        input[type="date"]::-webkit-calendar-picker-indicator { cursor: pointer; }
      `}</style>
      <Navbar />

      <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-4">

        {/* Breadcrumb + title */}
        <div className="flex flex-col gap-1">
          <div className="flex items-center flex-wrap text-xs font-medium" style={{ color: COLORS.inkMute }}>
            {breadcrumb.map((crumb, i) => (
              <span key={i} className="flex items-center">
                {i > 0 && <ChevronRight size={12} className="mx-1" style={{ color: COLORS.chalkDim }} />}
                <span style={i === breadcrumb.length - 1 ? { color: COLORS.navy, fontWeight: 700 } : undefined}>{crumb}</span>
              </span>
            ))}
          </div>

          <div className="flex justify-between items-end flex-wrap gap-3">
            <div className="flex flex-col gap-1">
              <h1 className="text-3xl leading-tight" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 800 }}>{court.name}</h1>
              <div className="flex items-center flex-wrap gap-2 text-sm" style={{ color: COLORS.inkMute }}>
                {rating !== null ? (
                  <>
                    <StarRating value={rating} />
                    <span>•</span>
                    <span className="underline">{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
                    <span>•</span>
                  </>
                ) : (
                  <>
                    <span style={{ color: '#93A29C' }}>No reviews yet</span>
                    <span>•</span>
                  </>
                )}
                <span className="inline-flex items-center gap-1">
                  <MapPin size={14} /> {court.address}
                </span>
              </div>
            </div>

            <div className="flex items-center gap-4">
              <button onClick={handleShare} className="cd-icon-btn flex items-center gap-1 px-2 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 active:scale-95" style={{ color: COLORS.ink }}>
                <Share2 size={16} /> Share
              </button>
              <button onClick={() => setSaved(s => !s)} className="cd-icon-btn flex items-center gap-1 px-2 py-2 rounded-lg text-sm font-semibold transition-colors duration-150 active:scale-95" style={{ color: COLORS.ink }}>
                <Heart size={18} className={`transition-colors duration-150 ${saved ? 'fill-red-500 text-red-500' : ''}`} /> Save
              </button>
            </div>
          </div>
        </div>

        {/* Image gallery */}
        <div className="w-full h-[360px] md:h-[440px] rounded-xl overflow-hidden grid grid-cols-4 grid-rows-2 gap-1 relative">
          {images.length > 0 ? (
            <>
              
<img
  src={images[0].imageUrl}
  className="cd-thumb col-span-2 row-span-2 w-full h-full object-cover transition-transform duration-300 cursor-pointer"
  alt={court.name}
/>
              
              {images.slice(1, 5).map((img, i) => (
                <img
                  key={i}
                  src={`${img.imageUrl}`}
                  className="cd-thumb w-full h-full object-cover transition-transform duration-300 cursor-pointer"
                  alt="court"
                />
              ))}
              {images.length > 5 && (
                <button
                  onClick={() => {}}
                  className="cd-show-photos absolute bottom-4 right-4 px-4 py-2 rounded-lg shadow text-base transition-colors duration-150 hover:shadow-md"
                  style={{ background: COLORS.chalk, outline: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }}
                >
                  Show all photos
                </button>
              )}
            </>
          ) : (
            <div className="col-span-4 row-span-2 flex items-center justify-center" style={{ background: COLORS.chalkDim, color: COLORS.inkMute }}>
              No images uploaded yet
            </div>
          )}
        </div>

        {/* Host + trust badges */}
        <div className="pt-4 pb-8 flex flex-col gap-6" style={{ borderBottom: `1px solid ${COLORS.chalkDim}` }}>
          <div className="flex justify-between items-center">
            <div>
              <h2 className="text-2xl font-semibold" style={{ color: COLORS.ink }}>Managed by {hostName}</h2>
              <p className="text-base" style={{ color: COLORS.inkMute }}>
                {court.type || 'Outdoor venue'} • Max {court.maxPlayers || 4} players • {court.surfaceType || 'Standard surface'}
              </p>
            </div>
            <div className="flex items-center gap-4">
              <button
                onClick={() => setShowMessageModal(true)}
                className="cd-icon-btn flex items-center gap-2 px-4 py-2.5 rounded-lg text-sm font-semibold transition-colors duration-150"
                style={{ outline: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }}
              >
                <MessageCircle size={16} /> Message Owner
              </button>
              <div className="w-14 h-14 rounded-full overflow-hidden flex items-center justify-center text-sm shrink-0" style={{ outline: `1px solid ${COLORS.chalkDim}`, background: COLORS.chalkDim, color: COLORS.inkMute }}>
                {hostAvatarUrl ? <img src={hostAvatarUrl} className="w-full h-full object-cover" alt={hostName} /> : hostName.charAt(0).toUpperCase()}
              </div>
            </div>
          </div>

          <div className="flex flex-col md:flex-row justify-center gap-4">
            {trustBadges.map((b, i) => (
              <div key={i} className="cd-badge-card flex-1 p-4 rounded-xl flex gap-4 transition-colors duration-150" style={{ background: '#fff', outline: `1px solid ${COLORS.chalkDim}` }}>
                <b.icon size={20} className="shrink-0" style={{ color: COLORS.navy }} />
                <div>
                  <p className="text-base" style={{ color: COLORS.ink }}>{b.title}</p>
                  <p className="text-sm" style={{ color: COLORS.inkMute }}>{b.body}</p>
                </div>
              </div>
            ))}
          </div>
        </div>

        {/* About */}
        {description && (
          <div className="pb-8 flex flex-col gap-4" style={{ borderBottom: `1px solid ${COLORS.chalkDim}` }}>
            <h2 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>About this court</h2>
            <p className="text-lg leading-7 whitespace-pre-line" style={{ color: COLORS.inkMute }}>{shownDescription}</p>
            {isLongDescription && (
              <button
                onClick={() => setShowFullDescription(s => !s)}
                className="cd-more-link inline-flex items-center gap-1 text-base font-bold underline w-fit transition-colors duration-150"
                style={{ color: COLORS.navy }}
              >
                {showFullDescription ? 'Show less' : 'Show more'}
                <ChevronRight size={14} className={`transition-transform duration-200 ${showFullDescription ? '-rotate-90' : 'rotate-90'}`} />
              </button>
            )}
          </div>
        )}

        {/* Amenities */}
        {amenitiesList.length > 0 && (
          <div className="pb-8 flex flex-col gap-4" style={{ borderBottom: `1px solid ${COLORS.chalkDim}` }}>
            <h2 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>What this court offers</h2>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
              {amenitiesList.map(a => {
                const Icon = iconForAmenity(a)
                return (
                  <div key={a} className="flex items-center gap-4 h-6">
                    <Icon size={20} className="shrink-0" style={{ color: COLORS.ink }} />
                    <span className="text-base" style={{ color: COLORS.inkMute }}>{a}</span>
                  </div>
                )
              })}
            </div>
          </div>
        )}

        {/* Location & hours */}
        <div className="flex flex-col gap-4">
          <div className="flex justify-between items-center">
            <h2 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>Location & hours</h2>
            {isOpen !== null && (
              <span
                className="px-2 py-1 rounded-full text-xs font-bold"
                style={isOpen ? { background: '#E7EEE9', color: COLORS.teal } : { background: '#FBEDEC', color: '#B3453D' }}
              >
                {isOpen ? 'Open now' : 'Closed now'}
              </span>
            )}
          </div>

          <div className="flex flex-col md:flex-row gap-8">
            <div className="flex-1 flex flex-col gap-2 pb-4">
              {[
                ['Mon - Fri', court.monFriOpen, court.monFriClose],
                ['Saturday', court.satOpen, court.satClose],
                ['Sunday', court.sunOpen, court.sunClose],
              ].map(([label, open, close]) => (
                <div key={label} className="py-2 flex justify-between" style={{ borderBottom: `1px solid ${COLORS.chalkDim}` }}>
                  <span className="text-base" style={{ color: COLORS.inkMute }}>{label}</span>
                  <span className="text-base font-medium" style={{ ...monoStyle, color: COLORS.ink }}>
                    {open ? formatHour12(open.substring(0, 5)) : open} – {close ? formatHour12(close.substring(0, 5)) : close}
                  </span>
                </div>
              ))}
            </div>

            <div className="flex-1 flex flex-col gap-2">
              <CourtMap latitude={latitude} longitude={longitude} courtName={court.name} />
              <p className="text-sm" style={{ color: COLORS.inkMute }}>{court.address}</p>
              <a
                href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                target="_blank"
                rel="noopener noreferrer"
                className="cd-more-link font-semibold no-underline w-fit transition-colors duration-150 hover:underline"
                style={{ color: COLORS.navy }}
              >
                Open in Google Maps
              </a>
            </div>
          </div>
        </div>

        {/* Booking panel */}
        <div className="flex flex-col md:flex-row gap-8 items-start">
          <div className="flex-1 hidden md:block" />
          <div className="w-full md:w-[380px] shrink-0 md:sticky md:top-6 p-6 rounded-2xl shadow-xl flex flex-col gap-4" style={{ background: '#fff', outline: `1px solid ${COLORS.chalkDim}` }}>
            <div className="flex justify-between items-end">
              <div className="flex items-end gap-1">
                <span className="text-2xl font-bold" style={{ ...monoStyle, color: COLORS.ink }}>{formatCurrency(court.pricePerHour)}</span>
                <span className="text-base" style={{ color: COLORS.inkMute }}>/ hour</span>
              </div>
              {rating !== null && (
                <div className="flex items-center gap-1 text-sm">
                  <StarRating value={rating} size={13} />
                  <span style={{ color: COLORS.inkMute }}>· {reviewCount} reviews</span>
                </div>
              )}
            </div>

<div className="p-4 rounded-xl flex flex-col gap-1 transition-colors duration-150" style={{ outline: `1px solid ${COLORS.chalkDim}` }}>
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.ink }}>Select date</span>
              <input
                type="date"
                value={selectedDate}
                min={getLocalDateString(new Date())}
                max={getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                onChange={e => { setSelectedDate(e.target.value); setSelectedSlots([]) }}
                className="text-base border-none outline-none bg-transparent p-0"
                style={{ ...monoStyle, color: COLORS.ink }}
              />
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.ink }}>Available times</span>
              <p className="text-xs" style={{ color: COLORS.inkMute }}>Tap a start time, then tap an end time to select the whole range.</p>
              <div className="grid grid-cols-2 gap-2">
                {slots.map(slot => {
                  const booked = isBooked(slot)
                  const past = isPast(slot)
                  const disabled = booked || past
                  const selected = selectedSlots.some(s => s.start === slot.start)
                  return (
                    <button
                      key={slot.start}
                      disabled={disabled}
                      onClick={() => toggleSlot(slot)}
                      className="cd-slot px-2 py-2 rounded-lg text-xs text-center leading-tight transition-all duration-150"
                      style={
                        disabled
                          ? { background: COLORS.chalkDim, color: '#93A29C', textDecoration: 'line-through', cursor: 'not-allowed', outline: `1px solid ${COLORS.chalkDim}` }
                          : selected
                            ? { background: '#FBFAD9', outline: `2px solid ${COLORS.citron}`, fontWeight: 700, color: COLORS.ink }
                            : { outline: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink }
                      }
                    >
                      {formatSlotRangeLabel(slot)}
                    </button>
                  )
                })}
              </div>
            </div>

            <div className="pt-4 flex flex-col gap-2" style={{ borderTop: `1px solid ${COLORS.chalkDim}` }}>
              {selectedSlots.length > 0 && (
                <>
                  <div className="flex justify-between text-base" style={{ color: COLORS.inkMute }}>
                    <span>{selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''} x {formatCurrency(court.pricePerHour)}</span>
                    <span style={monoStyle}>{formatCurrency(subtotal)}</span>
                  </div>
                  <div className="flex justify-between text-base" style={{ color: COLORS.inkMute }}>
                    <span>Service fee</span>
                    <span style={monoStyle}>{formatCurrency(SERVICE_FEE)}</span>
                  </div>
                  <div className="pt-2 flex justify-between text-lg font-bold" style={{ color: COLORS.ink }}>
                    <span>Total</span>
                    <span style={monoStyle}>{formatCurrency(total)}</span>
                  </div>
                </>
              )}
            </div>

            <button
              disabled={selectedSlots.length === 0}
              onClick={() => navigate(`/booking/${id}`, { state: { court, selectedDate, selectedSlots } })}
              className="cd-book-btn w-full py-3 rounded-xl font-semibold text-base transition-all duration-150"
              style={
                selectedSlots.length > 0
                  ? { background: COLORS.citron, color: COLORS.navyDeep, boxShadow: '0 10px 25px rgba(11,42,56,0.15)', cursor: 'pointer' }
                  : { background: COLORS.chalkDim, color: '#93A29C', cursor: 'not-allowed' }
              }
            >
              Book now
            </button>
            <p className="text-sm text-center" style={{ color: COLORS.inkMute }}>You won't be charged yet</p>

            <div className="pt-4 flex justify-center" style={{ borderTop: `1px solid ${COLORS.chalkDim}` }}>
              <button className="cd-report flex items-center gap-1 text-xs font-medium transition-colors duration-150" style={{ color: COLORS.inkMute }}>
                <Flag size={12} /> Report listing
              </button>
            </div>
          </div>
        </div>

        {/* Reviews */}
        <div className="pt-12 pb-8 flex flex-col gap-6" style={{ borderTop: `1px solid ${COLORS.chalkDim}` }}>
          <h2 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>Recent reviews</h2>
          {reviews.length === 0 ? (
            <p style={{ color: COLORS.inkMute }}>No reviews yet — be the first to book and leave one.</p>
          ) : (
            <>
              <div className="flex flex-col md:flex-row gap-8">
                {visibleReviews.map(r => (
                  <div key={r.id} className="flex-1 flex flex-col gap-2">
                    <div className="flex items-center gap-4">
                      <div className="w-10 h-10 rounded-full overflow-hidden flex items-center justify-center text-sm" style={{ background: COLORS.chalkDim, color: COLORS.inkMute }}>
                        {r.avatarUrl ? <img src={r.avatarUrl} className="w-full h-full object-cover" alt={r.authorName} /> : r.authorName?.charAt(0)}
                      </div>
                      <div>
                        <p className="text-base font-bold" style={{ color: COLORS.ink }}>{r.authorName}</p>
                        <p className="text-xs font-medium" style={{ color: COLORS.inkMute }}>{r.date}</p>
                      </div>
                    </div>
                    <p className="text-base" style={{ color: COLORS.inkMute }}>{r.comment}</p>
                  </div>
                ))}
              </div>
              {reviews.length > 2 && !showAllReviews && (
                <button
                  onClick={() => setShowAllReviews(true)}
                  className="cd-all-reviews px-6 py-2 rounded-lg text-base w-fit transition-colors duration-150"
                  style={{ outline: `1px solid ${COLORS.ink}`, color: COLORS.ink }}
                >
                  Show all {reviews.length} reviews
                </button>
              )}
            </>
          )}
        </div>
      </div>

      {showMessageModal && (
        <MessageOwnerModal
          courtId={court.id}
          ownerName={hostName}
          onClose={() => setShowMessageModal(false)}
        />
      )}
    </div>
  )
}

export default CourtDetailPage
