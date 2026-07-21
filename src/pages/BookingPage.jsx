import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const COLORS = {
  primary: '#16a34a',
  primaryHover: '#15803d',
}

function BookingPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
const { court, selectedDate, selectedSlots } = state || {}

  const player = JSON.parse(localStorage.getItem('player') || 'null')

  const [form, setForm] = useState({
    firstName: player?.firstName || '',
    lastName: player?.lastName || '',
    phone: player?.phone || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

if (!court || !selectedSlots || selectedSlots.length === 0) {
  navigate('/courts')
  return null
}

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.phone) {
      setError('Please fill in all fields.')
      return
    }

    setLoading(true)
    setError(null)

    try {
      const res = await api.post('/bookings', {
        courtId: parseInt(id),
        date: selectedDate,
        startTime: selectedSlots[0].start + ':00',
endTime: selectedSlots[selectedSlots.length - 1].end + ':00',
        bookerName: `${form.firstName} ${form.lastName}`,
        bookerPhone: form.phone,
        userId: player?.id ?? null,
      })

      navigate('/booking/confirmed', { state: { booking: res.data, court } })
    } catch (err) {
      if (err.response?.data === 'This time slot is already booked.') {
       navigate('/booking/unavailable', { 
  state: { court, selectedDate, selectedSlots } 
})
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  const duration = selectedSlots.length
const totalPrice = duration * court.pricePerHour

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <button
          onClick={() => navigate(-1)}
          onMouseEnter={e => { e.currentTarget.style.color = COLORS.primaryHover; e.currentTarget.style.textDecoration = 'underline' }}
          onMouseLeave={e => { e.currentTarget.style.color = COLORS.primary; e.currentTarget.style.textDecoration = 'none' }}
          style={{ color: COLORS.primary, fontSize: '14px', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer', transition: 'color 0.15s ease', padding: 0 }}
        >
          ← Back to court selection
        </button>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Confirm Your Booking</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>Complete your details below to reserve your court. No prepayment required today.</p>

        <div style={{ display: 'flex', gap: '32px', alignItems: 'flex-start' }}>

          {/* Left: Form */}
          <div style={{ flex: 1 }}>
            <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>First Name</label>
                <input
                  placeholder="Juan"
                  value={form.firstName}
                  onChange={e => setForm({ ...form, firstName: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = COLORS.primary; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Last Name</label>
                <input
                  placeholder="Dela Cruz"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  onFocus={e => { e.target.style.borderColor = COLORS.primary; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)' }}
                  onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Phone Number</label>
              <input
                placeholder="09171234567"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                onFocus={e => { e.target.style.borderColor = COLORS.primary; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>We'll send a confirmation SMS to this number.</p>
            </div>

            {/* Pay at venue notice */}
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', color: '#15803d' }}>
              💚 <strong>Pay at the venue upon arrival</strong> — Simply check-in at the front desk before your time slot.
            </div>

            {error && (
              <p style={{ color: '#dc2626', fontSize: '14px', marginBottom: '16px' }}>{error}</p>
            )}

            <button
              onClick={handleSubmit}
              disabled={loading}
              onMouseEnter={e => { if (!loading) e.currentTarget.style.background = COLORS.primaryHover }}
              onMouseLeave={e => { if (!loading) e.currentTarget.style.background = COLORS.primary }}
              onMouseDown={e => { if (!loading) e.currentTarget.style.transform = 'scale(0.98)' }}
              onMouseUp={e => { if (!loading) e.currentTarget.style.transform = 'scale(1)' }}
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: COLORS.primary,
                color: 'white',
                transition: 'background 0.15s ease, transform 0.1s ease',
                opacity: loading ? 0.8 : 1,
              }}
            >
              {loading ? 'Confirming...' : 'Confirm Booking'}
            </button>
          </div>

          {/* Right: Summary */}
          <div style={{ width: '280px', minWidth: '280px', background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
            {court.images && court.images.length > 0 ? (
              <img
                src={court.images[0].imageUrl}
                style={{ width: '100%', height: '140px', objectFit: 'cover' }}
                alt="court"
              />
            ) : (
              <div style={{ width: '100%', height: '140px', background: '#e5e7eb', display: 'flex', alignItems: 'center', justifyContent: 'center', color: '#9ca3af' }}>
                No image
              </div>
            )}
            <div style={{ padding: '16px' }}>
              <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '4px' }}>{court.name}</h3>
              <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>📍 {court.address}</p>

              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', fontSize: '13px', marginBottom: '16px' }}>
                <div>
                  <p style={{ color: '#9ca3af', marginBottom: '2px' }}>DATE</p>
                  <p style={{ fontWeight: '600' }}>{selectedDate}</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', marginBottom: '2px' }}>TIME</p>
                  <p style={{ fontWeight: '600' }}>
  {selectedSlots[0].start} – {selectedSlots[selectedSlots.length - 1].end}
</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', marginBottom: '2px' }}>DURATION</p>
                 <p style={{ fontWeight: '600' }}>
  {duration * 60} Minutes
</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Standard Rate</span>
  <span>₱{totalPrice}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>
                  <span>Total to Pay</span>
               <span style={{ color: '#16a34a' }}>
  ₱{totalPrice}
</span>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
