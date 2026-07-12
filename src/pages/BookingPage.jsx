import { useState } from 'react'
import { useParams, useLocation, useNavigate } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

function BookingPage() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()
  const { court, selectedDate, selectedSlot } = state || {}

  const [form, setForm] = useState({
    firstName: '',
    lastName: '',
    phone: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

  if (!court || !selectedSlot) {
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
        startTime: selectedSlot.start + ':00',
        endTime: selectedSlot.end + ':00',
        bookerName: `${form.firstName} ${form.lastName}`,
        bookerPhone: form.phone,
      })

      navigate('/booking/confirmed', { state: { booking: res.data, court } })
    } catch (err) {
      if (err.response?.data === 'This time slot is already booked.') {
        navigate('/booking/unavailable', { state: { court, selectedDate, selectedSlot } })
      } else {
        setError('Something went wrong. Please try again.')
      }
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px' }}>
        <button
          onClick={() => navigate(-1)}
          style={{ color: '#16a34a', fontSize: '14px', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer' }}
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
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
              <div>
                <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Last Name</label>
                <input
                  placeholder="Dela Cruz"
                  value={form.lastName}
                  onChange={e => setForm({ ...form, lastName: e.target.value })}
                  style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
                />
              </div>
            </div>

            <div style={{ marginBottom: '16px' }}>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Phone Number</label>
              <input
                placeholder="09171234567"
                value={form.phone}
                onChange={e => setForm({ ...form, phone: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}
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
              style={{
                width: '100%',
                padding: '14px',
                borderRadius: '8px',
                fontWeight: '600',
                fontSize: '15px',
                border: 'none',
                cursor: loading ? 'not-allowed' : 'pointer',
                background: '#16a34a',
                color: 'white',
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
                  <p style={{ fontWeight: '600' }}>{selectedSlot.start} – {selectedSlot.end}</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af', marginBottom: '2px' }}>DURATION</p>
                  <p style={{ fontWeight: '600' }}>60 Minutes</p>
                </div>
              </div>

              <div style={{ borderTop: '1px solid #e5e7eb', paddingTop: '12px' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '13px', marginBottom: '4px' }}>
                  <span style={{ color: '#6b7280' }}>Standard Rate</span>
                  <span>₱{court.pricePerHour}</span>
                </div>
                <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '15px', fontWeight: '700', marginTop: '8px' }}>
                  <span>Total to Pay</span>
                  <span style={{ color: '#16a34a' }}>₱{court.pricePerHour}</span>
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