import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function CourtDetailPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [court, setCourt] = useState(null)
  const [selectedDate, setSelectedDate] = useState(
    new Date().toISOString().split('T')[0]
  )
  const [bookedSlots, setBookedSlots] = useState([])
  const [selectedSlot, setSelectedSlot] = useState(null)

  const generateSlots = (open, close) => {
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

  useEffect(() => {
    api.get(`/courts/${id}`).then(res => setCourt(res.data))
  }, [id])

  useEffect(() => {
    if (!selectedDate) return
    api.get(`/bookings/court/${id}?date=${selectedDate}`)
      .then(res => setBookedSlots(res.data))
      .catch(() => setBookedSlots([]))
  }, [id, selectedDate])

  if (!court) return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div className="p-8 text-gray-500">Loading...</div>
    </div>
  )

  const dayOfWeek = new Date(selectedDate).getDay()
  const openTime = dayOfWeek === 0 ? court.sunOpen : dayOfWeek === 6 ? court.satOpen : court.monFriOpen
  const closeTime = dayOfWeek === 0 ? court.sunClose : dayOfWeek === 6 ? court.satClose : court.monFriClose
  const slots = generateSlots(
    (!openTime || openTime === '00:00:00') ? '06:00' : openTime,
    (!closeTime || closeTime === '00:00:00') ? '22:00' : closeTime
  )

  const isBooked = (slot) => bookedSlots.some(b =>
    b.startTime.substring(0, 5) === slot.start
  )
  const isPast = (slot) => {
  const now = new Date()
  const isToday = selectedDate === now.toISOString().split('T')[0]
  if (!isToday) return false
  const slotHour = parseInt(slot.start.split(':')[0])
  return slotHour <= now.getHours()
}

  const amenitiesList = court.amenities ? court.amenities.split(',') : []

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '40px 32px' }}>

        {/* Header */}
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '24px' }}>
          <div>
            <h1 style={{ fontSize: '28px', fontWeight: '700', color: '#111827', margin: 0 }}>{court.name}</h1>
            <p style={{ color: '#6b7280', marginTop: '4px' }}>📍 {court.address}</p>
          </div>
          <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'flex-end' }}>
            {court.type && <span style={{ background: '#f3f4f6', color: '#374151', fontSize: '13px', padding: '4px 12px', borderRadius: '999px' }}>{court.type}</span>}
            {court.maxPlayers > 0 && <span style={{ background: '#f3f4f6', color: '#374151', fontSize: '13px', padding: '4px 12px', borderRadius: '999px' }}>Max {court.maxPlayers} Players</span>}
            {court.surfaceType && <span style={{ background: '#f3f4f6', color: '#374151', fontSize: '13px', padding: '4px 12px', borderRadius: '999px' }}>{court.surfaceType}</span>}
          </div>
        </div>

        {/* Images */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '12px', height: '260px', borderRadius: '12px', overflow: 'hidden', marginBottom: '32px' }}>
          {court.images && court.images.length > 0 ? (
            court.images.slice(0, 3).map((img, i) => (
              <img
                key={i}
                src={img.imageUrl}
                style={{ width: '100%', height: '100%', objectFit: 'cover' }}
                alt="court"
              />
            ))
          ) : (
            <div style={{ gridColumn: '1 / -1', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
              No images uploaded yet
            </div>
          )}
        </div>

        {/* Body: Info + Booking Panel */}
        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

          {/* Left: Info */}
          <div style={{ flex: 1, display: 'flex', flexDirection: 'column', gap: '24px' }}>

            {court.description && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '8px' }}>About the Court</h2>
                <p style={{ color: '#4b5563', lineHeight: '1.6' }}>{court.description}</p>
              </div>
            )}

            {amenitiesList.length > 0 && (
              <div>
                <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Amenities</h2>
                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px' }}>
                  {amenitiesList.map(a => (
                    <div key={a} style={{ display: 'flex', alignItems: 'center', gap: '8px', color: '#4b5563', fontSize: '14px' }}>
                      <span style={{ color: '#16a34a' }}>✓</span> {a.trim()}
                    </div>
                  ))}
                </div>
              </div>
            )}

            <div>
              <h2 style={{ fontSize: '18px', fontWeight: '700', marginBottom: '12px' }}>Operating Hours</h2>
              <div style={{ display: 'flex', flexDirection: 'column', gap: '8px', fontSize: '14px', color: '#4b5563' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Monday - Friday</span>
                  <span>{court.monFriOpen} – {court.monFriClose}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Saturday</span>
                  <span>{court.satOpen} – {court.satClose}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between' }}>
                  <span>Sunday</span>
                  <span>{court.sunOpen} – {court.sunClose}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Right: Booking Panel */}
          <div style={{
            width: '300px',
            minWidth: '300px',
            background: 'white',
            border: '1px solid #e5e7eb',
            borderRadius: '12px',
            padding: '24px',
            position: 'sticky',
            top: '24px'
          }}>
            {/* Price */}
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px' }}>
              <span style={{ fontSize: '12px', color: '#9ca3af', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Hourly Rate</span>
              <span style={{ fontSize: '24px', fontWeight: '700', color: '#16a34a' }}>
                ₱{court.pricePerHour}<span style={{ fontSize: '13px', fontWeight: '400', color: '#9ca3af' }}>/hr</span>
              </span>
            </div>

            {/* Date */}
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Select Date</label>
            <input
  type="date"
  value={selectedDate}
  min={new Date().toISOString().split('T')[0]}
  max={new Date(Date.now() + 7 * 24 * 60 * 60 * 1000).toISOString().split('T')[0]}
  onChange={e => { setSelectedDate(e.target.value); setSelectedSlot(null) }}
  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
/>

            {/* Time Slots */}
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '8px' }}>Available Times</label>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '16px' }}>
              {slots.map(slot => {
  const booked = isBooked(slot)
  const past = isPast(slot)
  const selected = selectedSlot?.start === slot.start
  const disabled = booked || past
  return (
    <button
      key={slot.start}
      disabled={disabled}
      onClick={() => !disabled && setSelectedSlot(slot)}
      style={{
        padding: '8px 4px',
        borderRadius: '8px',
        fontSize: '13px',
        fontWeight: '500',
        border: '1px solid #e5e7eb',
        cursor: disabled ? 'not-allowed' : 'pointer',
        background: booked ? '#f3f4f6' : past ? '#f3f4f6' : selected ? '#16a34a' : '#f9fafb',
        color: booked ? '#9ca3af' : past ? '#d1d5db' : selected ? 'white' : '#374151',
        transition: 'all 0.15s',
        position: 'relative'
      }}
    >
      {slot.start}
      {past && !booked && (
        <span style={{ fontSize: '9px', display: 'block', color: '#d1d5db' }}>past</span>
      )}
    </button>
  )
})}
            </div>

            {/* Book Button */}
            <button
              disabled={!selectedSlot}
              onClick={() => navigate(`/booking/${id}`, {
                state: { court, selectedDate, selectedSlot }
              })}
              style={{
                width: '100%',
                padding: '12px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                border: 'none',
                cursor: selectedSlot ? 'pointer' : 'not-allowed',
                background: selectedSlot ? '#16a34a' : '#e5e7eb',
                color: selectedSlot ? 'white' : '#9ca3af',
                transition: 'background 0.15s'
              }}
            >
              Book Now
            </button>
            <p style={{ fontSize: '12px', color: '#9ca3af', textAlign: 'center', marginTop: '8px' }}>
              You won't be charged yet
            </p>
          </div>
        </div>
      </div>
    </div>
  )
}

export default CourtDetailPage