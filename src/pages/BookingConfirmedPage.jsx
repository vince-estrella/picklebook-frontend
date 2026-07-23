import { useEffect, useState } from 'react'
import { useLocation, useNavigate, useSearchParams } from 'react-router-dom'
import api from '../services/api'
import Navbar from '../components/Navbar'

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

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '60px auto', padding: '0 24px', textAlign: 'center' }}>

        <div style={{ width: '64px', height: '64px', background: isOnline && !isPaid ? '#fef3c7' : '#dcfce7', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', fontSize: '28px' }}>
          {isOnline && !isPaid ? '⏳' : '✓'}
        </div>

        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>
          {isOnline && !isPaid ? 'Payment Processing…' : 'Booking Confirmed!'}
        </h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          {isOnline && !isPaid
            ? "We're confirming your payment with Xendit — this usually takes just a few seconds. Refresh this page or check My Bookings shortly."
            : 'Your court is reserved. Show this confirmation upon arrival.'}
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
              <p style={{ fontWeight: '600' }}>{new Date(booking.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric' })}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>TIME</p>
              <p style={{ fontWeight: '600' }}>{booking.startTime?.substring(0, 5)} – {booking.endTime?.substring(0, 5)}</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>DURATION</p>
              <p style={{ fontWeight: '600' }}>60 Mins</p>
            </div>
            <div>
              <p style={{ fontSize: '12px', color: '#9ca3af', marginBottom: '4px' }}>PRICE</p>
              <p style={{ fontWeight: '700', color: '#16a34a' }}>₱{court?.pricePerHour}</p>
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
          ) : (
            <div style={{ background: '#f0fdf4', border: '1px solid #bbf7d0', borderRadius: '8px', padding: '12px 16px', fontSize: '13px', color: '#15803d' }}>
              💚 <strong>Pay at venue</strong> — Please check in at the front desk upon arrival to finalize payment.
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