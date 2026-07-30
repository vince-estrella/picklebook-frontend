import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

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

function BookingConfirmedPage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const [searchParams] = useSearchParams()
  const bookingIdParam = searchParams.get('bookingId')

  const [booking, setBooking] = useState(state?.booking || null)
  const [court, setCourt] = useState(state?.court || null)
  const [loading, setLoading] = useState(!state?.booking && !!bookingIdParam)
  const [error, setError] = useState(null)

  useEffect(() => {
    // Arrived via client-side navigate (guest / pay-at-venue flow) — already
    // have everything needed, nothing to fetch.
    if (state?.booking) return

    // Arrived via an external redirect from Xendit's hosted checkout — no
    // React Router state survives that, so fetch the booking fresh instead.
    if (!bookingIdParam) {
      navigate('/courts')
      return
    }

    api.get(`/bookings/${bookingIdParam}`)
      .then(res => {
        setBooking(res.data)
        setCourt(res.data.court)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load your booking. If you were just charged, check My Bookings or contact the court.')
        setLoading(false)
      })
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [])

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p style={{ textAlign: 'center', padding: '80px 24px', color: '#6b7280' }}>Loading your booking...</p>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-50">
        <Navbar />
        <p style={{ textAlign: 'center', padding: '80px 24px', color: '#dc2626' }}>{error}</p>
      </div>
    )
  }

  if (!booking) {
    navigate('/courts')
    return null
  }

  const isOnline = booking.paymentMethod === 'Online'
  const isPaid = booking.paymentStatus === 'Paid'
  const durationMinutes = getDurationMinutes(booking.startTime, booking.endTime)
  const totalPrice = Number(booking.amount || 0)

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>

        <div style={{ width: '64px', height: '64px', background: booking.status === 'Confirmed' ? '#dcfce7' : '#fef3c7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
          {booking.status === 'Confirmed' ? '✓' : '⏳'}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {isOnline && !isPaid
            ? 'Payment Processing…'
            : booking.status === 'Confirmed'
              ? 'Booking Confirmed!'
              : 'Booking Requested'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {isOnline && !isPaid
            ? "We're confirming your payment with Xendit — this usually takes just a few seconds. Refresh this page or check My Bookings shortly."
            : booking.status === 'Confirmed'
              ? 'Your court is reserved. Show this confirmation upon arrival.'
              : 'The court owner will confirm your booking once you check in and pay at the venue.'}
        </p>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'left', marginBottom: '24px' }}>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>COURT</p>
              <p style={{ fontWeight: '600', fontSize: '15px' }}>{court?.name}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>BOOKING ID</p>
              <p style={{ fontWeight: '700', fontSize: '15px', color: '#16a34a' }}>{booking.bookingReference}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DATE</p>
              <p style={{ fontWeight: '600' }}>{new Date(booking.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TIME</p>
              <p style={{ fontWeight: '600' }}>{formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DURATION</p>
              <p style={{ fontWeight: '600' }}>{durationMinutes} Mins</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>PRICE</p>
              <p style={{ fontWeight: '700', color: '#16a34a' }}>₱{totalPrice.toFixed(2)}</p>
            </div>
          </div>

          {isOnline ? (
            isPaid ? (
              <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
                ✅ <strong>Payment received</strong> — you're all set, no need to pay again at the venue.
              </div>
            ) : (
              <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e' }}>
                ⏳ <strong>Waiting for payment confirmation</strong> — this page will update once Xendit confirms your payment.
              </div>
            )
          ) : booking.status === 'Confirmed' ? (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
              ✅ <strong>Confirmed</strong> — you're all set for your booking.
            </div>
          ) : (
            <div style={{ background: '#fef3c7', border: '1px solid #fde68a', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#92400e' }}>
              ⏳ <strong>Pending confirmation</strong> — pay at the venue when you check in to confirm your spot.
            </div>
          )}
        </div>

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'center' }}>
          <button
            onClick={() => navigate('/courts')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151' }}
          >
            Find More Courts
          </button>
          <button
            onClick={() => navigate('/')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', background: '#16a34a', color: 'white', cursor: 'pointer' }}
          >
            Back to Home
          </button>
        </div>
      </div>
    </div>
  )
}

export default BookingConfirmedPage