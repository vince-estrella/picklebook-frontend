import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { MapPin, Calendar, Clock } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'

const STATUS_STYLES = {
  Confirmed: { background: '#dcfce7', color: '#15803d' },
  Pending: { background: '#fef3c7', color: '#92400e' },
  Cancelled: { background: '#fee2e2', color: '#b91c1c' },
  Completed: { background: '#e2e8f0', color: '#334155' },
}

function formatCurrency(n) {
  return `₱${Number(n || 0).toFixed(2)}`
}

function MyBookingsPage() {
  const navigate = useNavigate()
  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    if (!localStorage.getItem('playerToken')) {
      navigate('/login')
      return
    }
    api.get('/users/bookings')
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load your bookings. Please try logging in again.')
        setLoading(false)
      })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('playerToken')
    localStorage.removeItem('player')
    navigate('/login')
  }

  const now = new Date()
  const upcoming = bookings.filter(b => {
    const end = new Date(b.date)
    const [h] = (b.endTime || '00:00:00').split(':').map(Number)
    end.setHours(h)
    return end >= now && b.status !== 'Cancelled'
  })
  const past = bookings.filter(b => !upcoming.includes(b))

  const BookingCard = ({ b }) => (
    <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', gap: '16px' }}>
      <div style={{ flex: 1, minWidth: 0 }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
          <h3 style={{ fontSize: '16px', fontWeight: '700', margin: 0 }}>{b.courtName}</h3>
          <span style={{
            ...(STATUS_STYLES[b.status] || { background: '#f3f4f6', color: '#374151' }),
            fontSize: '11px', fontWeight: '700', padding: '3px 10px', borderRadius: '999px',
          }}>
            {b.status}
          </span>
        </div>
        <p style={{ fontSize: '13px', color: '#6b7280', display: 'flex', alignItems: 'center', gap: '4px', margin: '0 0 4px' }}>
          <MapPin size={13} /> {b.courtAddress}
        </p>
        <div style={{ display: 'flex', gap: '16px', fontSize: '13px', color: '#6b7280', marginTop: '8px' }}>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Calendar size={13} />
            {new Date(b.date).toLocaleDateString('en-PH', { month: 'short', day: 'numeric', year: 'numeric' })}
          </span>
          <span style={{ display: 'flex', alignItems: 'center', gap: '4px' }}>
            <Clock size={13} />
            {b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}
          </span>
        </div>
      </div>
      <div style={{ textAlign: 'right', flexShrink: 0 }}>
        <p style={{ fontSize: '11px', color: '#9ca3af', margin: '0 0 2px', textTransform: 'uppercase' }}>Amount</p>
        <p style={{ fontSize: '16px', fontWeight: '700', color: '#16a34a', margin: 0 }}>{formatCurrency(b.amount)}</p>
        <p style={{ fontSize: '11px', color: '#9ca3af', marginTop: '6px' }}>{b.bookingReference}</p>
      </div>
    </div>
  )

  return (
    <div style={{ minHeight: '100vh', background: '#f9fafb' }}>
      <Navbar />
      <div style={{ maxWidth: '760px', margin: '0 auto', padding: '40px 24px' }}>

        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '26px', fontWeight: '700', margin: 0 }}>My Bookings</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>
              {player.firstName ? `Welcome back, ${player.firstName}.` : ''}
            </p>
          </div>
          <button
            onClick={handleLogout}
            style={{ padding: '8px 16px', borderRadius: '8px', border: '1px solid #e5e7eb', background: 'white', fontSize: '13px', fontWeight: '600', color: '#374151', cursor: 'pointer' }}
          >
            Log out
          </button>
        </div>

        {loading ? (
          <p style={{ color: '#9ca3af', textAlign: 'center', padding: '40px 0' }}>Loading...</p>
        ) : error ? (
          <p style={{ color: '#dc2626', textAlign: 'center', padding: '40px 0' }}>{error}</p>
        ) : bookings.length === 0 ? (
          <div style={{ textAlign: 'center', padding: '60px 0' }}>
            <p style={{ color: '#6b7280', marginBottom: '16px' }}>No bookings yet.</p>
            <button
              onClick={() => navigate('/courts')}
              style={{ padding: '10px 24px', borderRadius: '8px', border: 'none', background: '#16a34a', color: 'white', fontWeight: '600', cursor: 'pointer' }}
            >
              Find a Court
            </button>
          </div>
        ) : (
          <div style={{ display: 'flex', flexDirection: 'column', gap: '32px' }}>
            {upcoming.length > 0 && (
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Upcoming
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {upcoming.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
            {past.length > 0 && (
              <div>
                <h2 style={{ fontSize: '14px', fontWeight: '700', textTransform: 'uppercase', color: '#6b7280', letterSpacing: '0.05em', marginBottom: '12px' }}>
                  Past
                </h2>
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px' }}>
                  {past.map(b => <BookingCard key={b.id} b={b} />)}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  )
}

export default MyBookingsPage