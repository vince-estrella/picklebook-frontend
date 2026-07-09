import { useLocation, useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

function SlotUnavailablePage() {
  const { state } = useLocation()
  const navigate = useNavigate()
  const { court, selectedDate, selectedSlot } = state || {}

  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '600px', margin: '60px auto', padding: '0 24px' }}>
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', overflow: 'hidden', display: 'flex' }}>

          {/* Left red panel */}
          <div style={{ width: '160px', minWidth: '160px', background: '#fef2f2', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '32px 16px' }}>
            <div style={{ width: '56px', height: '56px', background: '#dc2626', borderRadius: '50%', display: 'flex', alignItems: 'center', justifyContent: 'center', fontSize: '24px', marginBottom: '12px' }}>
              ✕
            </div>
            <p style={{ color: '#dc2626', fontWeight: '600', fontSize: '13px', textAlign: 'center' }}>Session Conflict</p>
            <p style={{ color: '#dc2626', fontSize: '11px', textAlign: 'center', marginTop: '4px' }}>Error Code: PB-409</p>
          </div>

          {/* Right content */}
          <div style={{ flex: 1, padding: '32px 24px' }}>
            <h2 style={{ fontSize: '22px', fontWeight: '700', marginBottom: '12px' }}>Slot Unavailable</h2>
            <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '24px' }}>
              Sorry, this slot was just taken by someone else. Please go back and select another time.
            </p>

            {/* Original selection */}
            <div style={{ background: '#f9fafb', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '16px', marginBottom: '24px' }}>
              <p style={{ fontSize: '11px', color: '#9ca3af', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.05em' }}>Original Selection</p>
              <p style={{ fontWeight: '700', fontSize: '15px', marginBottom: '8px' }}>{court?.name}</p>
              <div style={{ display: 'flex', gap: '24px', fontSize: '13px' }}>
                <div>
                  <p style={{ color: '#9ca3af' }}>Time</p>
                  <p style={{ fontWeight: '600' }}>{selectedSlot?.start} – {selectedSlot?.end}</p>
                </div>
                <div>
                  <p style={{ color: '#9ca3af' }}>Duration</p>
                  <p style={{ fontWeight: '600' }}>60 Minutes</p>
                </div>
              </div>
            </div>

            {/* Actions */}
            <div style={{ display: 'flex', gap: '12px' }}>
              <button
                onClick={() => navigate(`/courts/${court?.id}`, { state: { preselectedDate: selectedDate } })}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', background: '#dc2626', color: 'white', cursor: 'pointer' }}
              >
                Choose Another Slot
              </button>
              <button
                onClick={() => navigate(`/courts/${court?.id}`)}
                style={{ flex: 1, padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', background: 'white', color: '#374151', cursor: 'pointer' }}
              >
                Back to Court
              </button>
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}

export default SlotUnavailablePage