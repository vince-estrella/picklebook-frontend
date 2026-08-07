import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

const COLORS = {
  primary: '#16a34a',
  primaryHover: '#15803d',
}

// Formats "HH:MM" or "HH:MM:SS" (24hr) into "h:mm AM/PM"
function formatTime12h(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

// Minutes between two "HH:MM:SS" (or "HH:MM") strings
function getDurationMinutes(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

function BookingPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
const { court, selectedDate, selectedSlots } = state || {}

  const player = JSON.parse(localStorage.getItem('player') || 'null')
  const requiresOnlinePayment = court?.paymentMethod === 'Online'

  const [form, setForm] = useState({
    firstName: player?.firstName || '',
    lastName: player?.lastName || '',
    phone: player?.phone || '',
    email: player?.email || '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

if (!court || !selectedSlots || selectedSlots.length === 0) {
  navigate('/courts')
  return null
}

  const handleSubmit = async () => {
    if (!form.firstName || !form.lastName || !form.phone || !form.email) {
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
        bookerEmail: form.email,
        userId: player?.id ?? null,
      })


      if (res.data.checkoutUrl) {
        window.location.href = res.data.checkoutUrl
      } else {
        navigate('/booking/confirmed', { state: { booking: res.data.booking, court } })
      }
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

  const durationMinutes = getDurationMinutes(selectedSlots[0].start, selectedSlots[selectedSlots.length - 1].end)
  const totalPrice = (durationMinutes / 60) * court.pricePerHour

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
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {requiresOnlinePayment
            ? 'Complete your details below, then continue to secure online payment.'
            : 'Complete your details below to reserve your court. No prepayment required today.'}
        </p>

        <div className="flex flex-col md:flex-row gap-8 items-start">

          {/* Right: Summary — shown first on mobile, second on desktop */}
          <div className="w-full order-first md:order-last md:w-[280px] md:min-w-[280px]" style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
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
  {formatTime12h(selectedSlots[0].start)} – {formatTime12h(selectedSlots[selectedSlots.length - 1].end)}
</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', marginBottom: '2px' }}>DURATION</p>
                 <p style={{ fontWeight: '600' }}>
  {durationMinutes} Minutes
</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Standard Rate</span>
  <span>₱{totalPrice.toFixed(2)}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>
                  <span>Total to Pay</span>
               <span style={{ color: '#16a34a' }}>
  ₱{totalPrice.toFixed(2)}
</span>
                </div>
              </div>
            </div>
          </div>

          {/* Left: Form — shown second on mobile, first on desktop */}
          <div className="w-full order-last md:order-first md:flex-1">
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

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Email Address</label>
              <input
                type="email"
                placeholder="juan@example.com"
                value={form.email}
                onChange={e => setForm({ ...form, email: e.target.value })}
                onFocus={e => { e.target.style.borderColor = COLORS.primary; e.target.style.boxShadow = '0 0 0 3px rgba(22,163,74,0.15)' }}
                onBlur={e => { e.target.style.borderColor = '#e5e7eb'; e.target.style.boxShadow = 'none' }}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', outline: 'none', transition: 'border-color 0.15s ease, box-shadow 0.15s ease' }}
              />
              <p style={{ fontSize: '12px', color: '#9ca3af', marginTop: '4px' }}>We'll email your booking receipt here.</p>
            </div>

            {/* Payment notice — reflects this court's actual payment method */}
            {requiresOnlinePayment ? (
              <div style={{ background: '#eff6ff', border: '1px solid #bfdbfe', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', color: '#1d4ed8' }}>
                💳 <strong>Pay online</strong> — This court requires online payment. You'll be redirected to Xendit's secure checkout after confirming.
              </div>
            ) : (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', marginBottom: '24px', fontSize: '14px', color: '#15803d' }}>
                💚 <strong>Pay at the venue upon arrival</strong> — Simply check-in at the front desk before your time slot.
              </div>
            )}

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
              {loading ? 'Confirming...' : requiresOnlinePayment ? 'Continue to Payment' : 'Confirm Booking'}
            </button>
          </div>
        </div>
      </div>
    </div>
  )
}

export default BookingPage
