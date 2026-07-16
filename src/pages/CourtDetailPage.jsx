  import { useEffect, useMemo, useState } from 'react'
  import { useParams, useNavigate } from 'react-router-dom'
  import {
    Star, MapPin, Share2, Heart, ShieldCheck, KeyRound, Droplets,
    Sun, Fan, Wifi, ParkingCircle, ShowerHead, Flag, ChevronRight, Check
  } from 'lucide-react'
  import CourtMap from '../components/CourtMap'
  import api from '../services/api'
  import Navbar from '../components/Navbar'

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
        <Star size={size} className="fill-amber-800 text-amber-800" />
        <span className="text-sm font-bold text-zinc-900">{value.toFixed(1)}</span>
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
        <div className="min-h-screen bg-slate-50">
          <Navbar />
          <div className="p-8 text-neutral-500">Loading...</div>
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

  const isBooked = (slot) => bookedSlots.some(b => b.startTime.substring(0, 5) === slot.start)
    const toggleSlot = (slot) => {
      setSelectedSlots(prev => {
        const exists = prev.some(s => s.start === slot.start)
        if (exists) return prev.filter(s => s.start !== slot.start)
        return [...prev, slot].sort((a, b) => a.start.localeCompare(b.start))
      })
    }
    const isPast = (slot) => {
    const now = new Date()
    const todayStr = getLocalDateString(now)
    if (selectedDate !== todayStr) return false
    const slotHour = parseInt(slot.start.split(':')[0])
    return slotHour <= now.getHours()
  }

    const amenitiesList = court.amenities ? court.amenities.split(',').map(a => a.trim()).filter(Boolean) : []
    const images = court.images && court.images.length > 0 ? court.images : []
    const latitude = court.latitude ?? 10.3157
    const longitude = court.longitude ?? 123.8854

    // ── Fields the backend doesn't provide yet — sensible, clearly-marked fallbacks ──
    const hostName = court.hostName || 'the PickleBook team'
    const hostAvatarUrl = court.hostAvatarUrl || null
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
      <div className="min-h-screen bg-slate-50">
        <Navbar />

        <div className="max-w-5xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-4">

          {/* Breadcrumb + title */}
          <div className="flex flex-col gap-1">
            <div className="flex items-center flex-wrap text-xs font-medium text-neutral-700">
              {breadcrumb.map((crumb, i) => (
                <span key={i} className="flex items-center">
                  {i > 0 && <ChevronRight size={12} className="mx-1 text-neutral-400" />}
                  <span className={i === breadcrumb.length - 1 ? 'text-green-800 font-bold' : ''}>{crumb}</span>
                </span>
              ))}
            </div>

            <div className="flex justify-between items-end flex-wrap gap-3">
              <div className="flex flex-col gap-1">
                <h1 className="text-3xl font-bold text-slate-800 leading-tight">{court.name}</h1>
                <div className="flex items-center flex-wrap gap-2 text-sm text-neutral-700">
                  {rating !== null ? (
                    <>
                      <StarRating value={rating} />
                      <span>•</span>
                      <span className="underline">{reviewCount} review{reviewCount === 1 ? '' : 's'}</span>
                      <span>•</span>
                    </>
                  ) : (
                    <>
                      <span className="text-neutral-400">No reviews yet</span>
                      <span>•</span>
                    </>
                  )}
                  <span className="inline-flex items-center gap-1">
                    <MapPin size={14} /> {court.address}
                  </span>
                </div>
              </div>

              <div className="flex items-center gap-4">
                <button onClick={handleShare} className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm font-semibold text-zinc-900 transition-colors duration-150 hover:bg-gray-100 active:scale-95">
                  <Share2 size={16} /> Share
                </button>
                <button onClick={() => setSaved(s => !s)} className="flex items-center gap-1 px-2 py-2 rounded-lg text-sm font-semibold text-zinc-900 transition-colors duration-150 hover:bg-gray-100 active:scale-95">
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
    className="col-span-2 row-span-2 w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
    alt={court.name}
  />
                
                {images.slice(1, 5).map((img, i) => (
                  <img
                    key={i}
                    src={`${img.imageUrl}`}
                    className="w-full h-full object-cover transition-transform duration-300 hover:scale-105 cursor-pointer"
                    alt="court"
                  />
                ))}
                {images.length > 5 && (
                  <button
                    onClick={() => {}}
                    className="absolute bottom-4 right-4 px-4 py-2 bg-slate-50 rounded-lg shadow outline outline-1 outline-neutral-500 text-base text-zinc-900 transition-colors duration-150 hover:bg-white hover:shadow-md"
                  >
                    Show all photos
                  </button>
                )}
              </>
            ) : (
              <div className="col-span-4 row-span-2 bg-gray-200 flex items-center justify-center text-gray-400">
                No images uploaded yet
              </div>
            )}
          </div>

          {/* Host + trust badges */}
          <div className="pt-4 pb-8 border-b border-stone-300 flex flex-col gap-6">
            <div className="flex justify-between items-center">
              <div>
                <h2 className="text-2xl font-semibold text-zinc-900">Managed by {hostName}</h2>
                <p className="text-base text-neutral-700">
                  {court.type || 'Outdoor venue'} • Max {court.maxPlayers || 4} players • {court.surfaceType || 'Standard surface'}
                </p>
              </div>
              <div className="w-14 h-14 rounded-full outline outline-1 outline-stone-300 overflow-hidden bg-gray-200 flex items-center justify-center text-neutral-500 text-sm">
                {hostAvatarUrl ? <img src={hostAvatarUrl} className="w-full h-full object-cover" alt={hostName} /> : hostName.charAt(0).toUpperCase()}
              </div>
            </div>

            <div className="flex flex-col md:flex-row justify-center gap-4">
              {trustBadges.map((b, i) => (
                <div key={i} className="flex-1 p-4 bg-gray-100 rounded-xl flex gap-4 transition-colors duration-150 hover:bg-gray-200">
                  <b.icon size={20} className="text-green-800 shrink-0" />
                  <div>
                    <p className="text-base text-slate-800">{b.title}</p>
                    <p className="text-sm text-neutral-700">{b.body}</p>
                  </div>
                </div>
              ))}
            </div>
          </div>

          {/* About */}
          {description && (
            <div className="pb-8 border-b border-stone-300 flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-zinc-900">About this court</h2>
              <p className="text-lg text-neutral-700 leading-7 whitespace-pre-line">{shownDescription}</p>
              {isLongDescription && (
                <button
                  onClick={() => setShowFullDescription(s => !s)}
                  className="inline-flex items-center gap-1 text-base font-bold text-green-800 underline w-fit transition-colors duration-150 hover:text-green-900"
                >
                  {showFullDescription ? 'Show less' : 'Show more'}
                  <ChevronRight size={14} className={`transition-transform duration-200 ${showFullDescription ? '-rotate-90' : 'rotate-90'}`} />
                </button>
              )}
            </div>
          )}

          {/* Amenities */}
          {amenitiesList.length > 0 && (
            <div className="pb-8 border-b border-stone-300 flex flex-col gap-4">
              <h2 className="text-2xl font-semibold text-zinc-900">What this court offers</h2>
              <div className="grid grid-cols-1 md:grid-cols-2 gap-y-3 gap-x-6">
                {amenitiesList.map(a => {
                  const Icon = iconForAmenity(a)
                  return (
                    <div key={a} className="flex items-center gap-4 h-6">
                      <Icon size={20} className="text-slate-800 shrink-0" />
                      <span className="text-base text-neutral-700">{a}</span>
                    </div>
                  )
                })}
              </div>
            </div>
          )}

          {/* Location & hours */}
          <div className="flex flex-col gap-4">
            <div className="flex justify-between items-center">
              <h2 className="text-2xl font-semibold text-zinc-900">Location & hours</h2>
              {isOpen !== null && (
                <span className={`px-2 py-1 rounded-full text-xs font-bold ${isOpen ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800'}`}>
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
                  <div key={label} className="py-2 border-b border-stone-300 flex justify-between">
                    <span className="text-base text-neutral-700">{label}</span>
                    <span className="text-base font-medium text-slate-800">{open} – {close}</span>
                  </div>
                ))}
              </div>

              <div className="flex-1 flex flex-col gap-2">
                <CourtMap latitude={latitude} longitude={longitude} courtName={court.name} />
                <p className="text-sm text-neutral-500">{court.address}</p>
                <a
                  href={`https://www.google.com/maps?q=${latitude},${longitude}`}
                  target="_blank"
                  rel="noopener noreferrer"
                  className="text-green-800 font-semibold no-underline w-fit transition-colors duration-150 hover:text-green-900 hover:underline"
                >
                  Open in Google Maps
                </a>
              </div>
            </div>
          </div>

          {/* Booking panel */}
          <div className="flex flex-col md:flex-row gap-8 items-start">
            <div className="flex-1 hidden md:block" />
            <div className="w-full md:w-[380px] shrink-0 md:sticky md:top-6 p-6 bg-slate-50 rounded-2xl shadow-xl outline outline-1 outline-stone-300 flex flex-col gap-4">
              <div className="flex justify-between items-end">
                <div className="flex items-end gap-1">
                  <span className="text-2xl font-bold text-slate-800">{formatCurrency(court.pricePerHour)}</span>
                  <span className="text-base text-neutral-700">/ hour</span>
                </div>
                {rating !== null && (
                  <div className="flex items-center gap-1 text-sm">
                    <StarRating value={rating} size={13} />
                    <span className="text-neutral-700">· {reviewCount} reviews</span>
                  </div>
                )}
              </div>

  <div className="p-4 rounded-xl outline outline-1 outline-stone-300 flex flex-col gap-1 transition-colors duration-150 focus-within:outline-2 focus-within:outline-green-700">
                <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">Select date</span>
                <input
                  type="date"
                  value={selectedDate}
                  min={getLocalDateString(new Date())}
                  max={getLocalDateString(new Date(Date.now() + 7 * 24 * 60 * 60 * 1000))}
                  onChange={e => { setSelectedDate(e.target.value); setSelectedSlots([]) }}
                  className="text-base text-zinc-900 border-none outline-none bg-transparent p-0"
                />
              </div>

              <div className="flex flex-col gap-2">
                <span className="text-xs font-medium text-slate-800 uppercase tracking-wide">Available times</span>
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
                        className={[
                          'px-3 py-2 rounded-lg text-sm text-center transition-all duration-150',
                          disabled
                            ? 'bg-gray-100 text-gray-400 cursor-not-allowed line-through outline outline-1 outline-stone-300'
                            : selected
                              ? 'bg-green-100 outline outline-2 outline-green-800 font-bold text-zinc-900 hover:bg-green-200'
                              : 'outline outline-1 outline-stone-300 text-zinc-900 hover:bg-green-50 hover:outline-green-700 active:scale-95',
                        ].join(' ')}
                      >
                        {slot.start}
                      </button>
                    )
                  })}
                </div>
              </div>

              <div className="pt-4 border-t border-stone-300 flex flex-col gap-2">
                {selectedSlots.length > 0 && (
                  <>
                    <div className="flex justify-between text-base text-neutral-700">
                      <span>{selectedSlots.length} hour{selectedSlots.length > 1 ? 's' : ''} x {formatCurrency(court.pricePerHour)}</span>
                      <span>{formatCurrency(subtotal)}</span>
                    </div>
                    <div className="flex justify-between text-base text-neutral-700">
                      <span>Service fee</span>
                      <span>{formatCurrency(SERVICE_FEE)}</span>
                    </div>
                    <div className="pt-2 flex justify-between text-lg font-bold text-slate-800">
                      <span>Total</span>
                      <span>{formatCurrency(total)}</span>
                    </div>
                  </>
                )}
              </div>

              <button
                disabled={selectedSlots.length === 0}
                onClick={() => navigate(`/booking/${id}`, { state: { court, selectedDate, selectedSlots } })}
                className={[
                  'w-full py-3 rounded-xl font-semibold text-base transition-all duration-150',
                  selectedSlots.length > 0
                    ? 'bg-green-800 text-white shadow-lg cursor-pointer hover:bg-green-900 hover:shadow-xl active:scale-[0.98]'
                    : 'bg-gray-200 text-gray-400 cursor-not-allowed',
                ].join(' ')}
              >
                Book now
              </button>
              <p className="text-sm text-neutral-500 text-center">You won't be charged yet</p>

              <div className="pt-4 border-t border-stone-300 flex justify-center">
                <button className="flex items-center gap-1 text-xs font-medium text-neutral-700 transition-colors duration-150 hover:text-neutral-900">
                  <Flag size={12} /> Report listing
                </button>
              </div>
            </div>
          </div>

          {/* Reviews */}
          <div className="pt-12 pb-8 border-t border-stone-300 flex flex-col gap-6">
            <h2 className="text-2xl font-semibold text-zinc-900">Recent reviews</h2>
            {reviews.length === 0 ? (
              <p className="text-neutral-500">No reviews yet — be the first to book and leave one.</p>
            ) : (
              <>
                <div className="flex flex-col md:flex-row gap-8">
                  {visibleReviews.map(r => (
                    <div key={r.id} className="flex-1 flex flex-col gap-2">
                      <div className="flex items-center gap-4">
                        <div className="w-10 h-10 bg-neutral-200 rounded-full overflow-hidden flex items-center justify-center text-neutral-500 text-sm">
                          {r.avatarUrl ? <img src={r.avatarUrl} className="w-full h-full object-cover" alt={r.authorName} /> : r.authorName?.charAt(0)}
                        </div>
                        <div>
                          <p className="text-base font-bold text-zinc-900">{r.authorName}</p>
                          <p className="text-xs font-medium text-neutral-700">{r.date}</p>
                        </div>
                      </div>
                      <p className="text-base text-neutral-700">{r.comment}</p>
                    </div>
                  ))}
                </div>
                {reviews.length > 2 && !showAllReviews && (
                  <button
                    onClick={() => setShowAllReviews(true)}
                    className="px-6 py-2 rounded-lg outline outline-1 outline-slate-800 text-base text-zinc-900 w-fit transition-colors duration-150 hover:bg-slate-800 hover:text-white"
                  >
                    Show all {reviews.length} reviews
                  </button>
                )}
              </>
            )}
          </div>
        </div>
      </div>
    )
  }

  export default CourtDetailPage
