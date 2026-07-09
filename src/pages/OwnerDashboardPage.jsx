import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import api from '../services/api'

function OwnerDashboardPage() {
  const navigate = useNavigate()
  const owner = JSON.parse(localStorage.getItem('owner') || '{}')
  const [courts, setCourts] = useState([])
  const [bookings, setBookings] = useState([])
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    Promise.all([
      api.get('/courts'),
      // fetch bookings for all courts - we'll get today's for now
    ]).then(([courtsRes]) => {
      setCourts(courtsRes.data)
      setLoading(false)
    }).catch(() => {
      navigate('/owner/login')
    })
  }, [])

  const handleLogout = () => {
    localStorage.removeItem('token')
    localStorage.removeItem('owner')
    navigate('/owner/login')
  }

  if (loading) return <div style={{ padding: '40px', color: '#6b7280' }}>Loading...</div>

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
            { label: 'Manage Courts', path: '/owner/courts' },
            { label: 'Bookings', path: '/owner/bookings' },
          ].map(item => (
            <button
              key={item.path}
              onClick={() => navigate(item.path)}
              style={{
                display: 'block',
                width: '100%',
                textAlign: 'left',
                padding: '10px 12px',
                borderRadius: '8px',
                border: 'none',
                cursor: 'pointer',
                fontSize: '14px',
                fontWeight: '500',
                marginBottom: '4px',
                background: window.location.pathname === item.path ? '#16a34a' : 'transparent',
                color: window.location.pathname === item.path ? 'white' : '#9ca3af',
              }}
            >
              {item.label}
            </button>
          ))}
        </nav>

        {/* Owner info + logout */}
        <div style={{ padding: '16px 20px', borderTop: '1px solid #2d2d2d' }}>
          <p style={{ color: '#9ca3af', fontSize: '12px', marginBottom: '4px' }}>Logged in as</p>
          <p style={{ color: 'white', fontSize: '13px', fontWeight: '600', marginBottom: '12px' }}>
            {owner.firstName} {owner.lastName}
          </p>
          <button
            onClick={handleLogout}
            style={{ fontSize: '13px', color: '#6b7280', background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
          >
            Log out
          </button>
        </div>
      </div>

      {/* Main content */}
      <div style={{ flex: 1, padding: '32px' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '24px', fontWeight: '700', margin: 0 }}>Dashboard</h1>
            <p style={{ color: '#6b7280', fontSize: '14px', marginTop: '4px' }}>Welcome back, {owner.firstName}</p>
          </div>
          <button
            onClick={() => navigate('/owner/courts/add')}
            style={{ background: '#16a34a', color: 'white', border: 'none', borderRadius: '8px', padding: '10px 20px', fontWeight: '600', fontSize: '14px', cursor: 'pointer' }}
          >
            + Add Court
          </button>
        </div>

        {/* Stats */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px' }}>
          {[
            { label: 'Total Courts', value: courts.length },
            { label: 'Active Bookings', value: '—' },
            { label: 'Monthly Revenue', value: '—' },
          ].map(stat => (
            <div key={stat.label} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '20px 24px' }}>
              <p style={{ color: '#6b7280', fontSize: '13px', marginBottom: '8px' }}>{stat.label}</p>
              <p style={{ fontSize: '28px', fontWeight: '700', color: '#111827' }}>{stat.value}</p>
            </div>
          ))}
        </div>

        {/* Courts Table */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden' }}>
          <div style={{ padding: '20px 24px', borderBottom: '1px solid #e5e7eb', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <h2 style={{ fontWeight: '700', fontSize: '16px', margin: 0 }}>Manage Courts</h2>
          </div>
          <table style={{ width: '100%', borderCollapse: 'collapse' }}>
            <thead>
              <tr style={{ background: '#f9fafb' }}>
                {['Court Name', 'Location', 'Price', 'Type', 'Actions'].map(h => (
                  <th key={h} style={{ padding: '12px 16px', textAlign: 'left', fontSize: '12px', fontWeight: '600', color: '#6b7280', textTransform: 'uppercase', letterSpacing: '0.05em' }}>{h}</th>
                ))}
              </tr>
            </thead>
            <tbody>
              {courts.length === 0 ? (
                <tr>
                  <td colSpan={5} style={{ padding: '32px', textAlign: 'center', color: '#9ca3af', fontSize: '14px' }}>
                    No courts yet. Click "+ Add Court" to get started.
                  </td>
                </tr>
              ) : (
                courts.map(court => (
                  <tr key={court.id} style={{ borderTop: '1px solid #f3f4f6' }}>
                    <td style={{ padding: '14px 16px', fontWeight: '600', fontSize: '14px' }}>{court.name}</td>
                    <td style={{ padding: '14px 16px', color: '#6b7280', fontSize: '14px' }}>{court.address}</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>₱{court.pricePerHour}/hr</td>
                    <td style={{ padding: '14px 16px', fontSize: '14px' }}>{court.type || '—'}</td>
                    <td style={{ padding: '14px 16px' }}>
                      <button
                        onClick={() => navigate(`/owner/courts/${court.id}/bookings`)}
                        style={{ fontSize: '13px', color: '#16a34a', background: 'none', border: 'none', cursor: 'pointer', fontWeight: '600' }}
                      >
                        View Bookings
                      </button>
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

export default OwnerDashboardPage