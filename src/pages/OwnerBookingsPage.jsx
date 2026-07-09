import { useEffect, useState } from 'react'
import { useParams, useNavigate } from 'react-router-dom'
import api from '../services/api'

function OwnerBookingsPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const today = new Date().toISOString().split('T')[0]
    api.get(`/bookings/court/${id}?date=${today}`)
      .then(res => {
        setBookings(res.data)
        setLoading(false)
      })
      .catch(() => setLoading(false))
  }, [id])

  return (
    <div style={{ display: 'flex', minHeight: '100vh', background: '#f9fafb' }}>

      {/* Sidebar */}
      <div style={{ width: '220px', minWidth: '220px', background: '#1a1a1a', display: 'flex', flexDirection: 'column', padding: '24px 0' }}>
        <div style={{ padding: '0 20px 24px', borderBottom: '1px solid #2d2d2d' }}>
          <h2 style={{ color: '#16a34a', fontWeight: '700', fontSize: '18px', margin: 0 }}>🏓 PickleBook</h2>
        </div>
        <nav style={{ padding: '16px 12px', flex: 1 }}>
          {[
            { label: 'Dashboard', path: '/owner/dashboard' },
{ label: 'Add Court', path: '/owner/courts/add' },
          ].map(item => (
            <button key={item.path} onClick={() => navigate(item.path)}
              style={{ display: 'block', width: '100%', textAlign: 'left', padding: '10px 12px', borderRadius: '8px', border: 'none', cursor: 'pointer', fontSize: '14px', fontWeight: '500', marginBottom: '4px', background: 'transparent', color: '#9ca3af' }}>
              {item.label}
            </button>
          ))}
        </nav>
      </div>

      {/* Main */}
      <div style={{ flex: 1, padding: '32px' }}>
        <button onClick={() => navigate('/owner/dashboard')}
          style={{ color: '#16a34a', fontSize: '14px', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Booking Management</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>Today's bookings for this court.</p>

        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Booking ID', 'Date', 'Time', 'Booker Name', 'Phone', 'Status'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {loading ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>Loading...</td></tr>
              ) : bookings.length === 0 ? (
                <tr><td colSpan={6} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af' }}>No bookings for today.</td></tr>
              ) : (
                bookings.map(b => (
                  <tr key={b.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', fontSize: '13px', color: '#16a34a' }}>{b.bookingReference}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>{new Date(b.date).toLocaleDateString('en-PH')}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>{b.startTime?.substring(0, 5)} – {b.endTime?.substring(0, 5)}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>{b.bookerName}</td>
                    <td style={{ padding: '14px 16px', fontSize: '13px' }}>{b.bookerPhone}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <span style={{ background: '#dcfce7', color: '#15803d', fontSize: '12px', fontWeight: '600', padding: '4px 10px', borderRadius: '999px' }}>
                        {b.status}
                      </span>
                    </td>
                  </tr>
                ))
              )}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  )
}

export default OwnerBookingsPage