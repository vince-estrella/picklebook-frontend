import { useState, useEffect } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import api from '../services/api'

const AMENITIES_OPTIONS = ['Night Lighting', 'Free WiFi', 'Parking', 'Locker Rooms', 'Water Station', 'Paddle Rental', 'Changing Rooms', 'Ample Parking']

function EditCourtPage() {
  const navigate = useNavigate()
  const { id } = useParams()
  const [form, setForm] = useState(null)
  const [amenities, setAmenities] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [fetching, setFetching] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    api.get(`/courts/${id}`).then(res => {
      const court = res.data
      setForm({
        name: court.name || '',
        address: court.address || '',
        type: court.type || 'Outdoor',
        surfaceType: court.surfaceType || '',
        maxPlayers: court.maxPlayers || 4,
        pricePerHour: court.pricePerHour || '',
        description: court.description || '',
        externalBookingUrl: court.externalBookingUrl || '',
        monFriOpen: court.monFriOpen || '06:00:00',
        monFriClose: court.monFriClose || '22:00:00',
        satOpen: court.satOpen || '07:00:00',
        satClose: court.satClose || '21:00:00',
        sunOpen: court.sunOpen || '08:00:00',
        sunClose: court.sunClose || '20:00:00',
        latitude: court.latitude || 0,
        longitude: court.longitude || 0,
        courtOwnerId: court.courtOwnerId,
      })
      setAmenities(court.amenities ? court.amenities.split(',').map(a => a.trim()).filter(Boolean) : [])
      setFetching(false)
    }).catch(() => navigate('/owner/dashboard'))
  }, [id])

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleSubmit = async () => {
    if (!form.name || !form.address || !form.pricePerHour) {
      setError('Court name, address, and price are required.')
      return
    }
    setLoading(true)
    setError(null)
    try {
      const courtData = {
        ...form,
        amenities: amenities.join(','),
        pricePerHour: parseFloat(form.pricePerHour),
        maxPlayers: parseInt(form.maxPlayers)
      }
      await api.put(`/courts/${id}`, courtData)

      for (const img of images) {
        const formData = new FormData()
        formData.append('file', img)
        await api.post(`/courts/${id}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      navigate('/owner/dashboard')
    } catch {
      setError('Failed to update court. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  if (fetching) return <div style={{ padding: '40px', color: '#6b7280' }}>Loading...</div>

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
      <div style={{ flex: 1, padding: '32px', maxWidth: '800px' }}>
        <button onClick={() => navigate('/owner/dashboard')}
          style={{ color: '#16a34a', fontSize: '14px', marginBottom: '24px', background: 'none', border: 'none', cursor: 'pointer' }}>
          ← Back to Dashboard
        </button>

        <h1 style={{ fontSize: '24px', fontWeight: '700', marginBottom: '4px' }}>Edit Court</h1>
        <p style={{ color: '#6b7280', fontSize: '14px', marginBottom: '32px' }}>Update your court details.</p>

        {/* Image Upload */}
        <div style={{ border: '2px dashed #e5e7eb', borderRadius: '12px', padding: '24px', textAlign: 'center', marginBottom: '24px', background: 'white' }}>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '8px' }}>📷 Upload additional court images</p>
          <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))}
            style={{ fontSize: '13px', color: '#374151' }} />
          {images.length > 0 && <p style={{ fontSize: '13px', color: '#16a34a', marginTop: '8px' }}>{images.length} new image(s) selected</p>}
        </div>

        {/* Basic Info */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Court Name</label>
            <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Full Address</label>
            <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Environment</label>
              <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option>Outdoor</option>
                <option>Indoor</option>
              </select>
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Surface Material</label>
              <select value={form.surfaceType} onChange={e => setForm({ ...form, surfaceType: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }}>
                <option value="">Select surface</option>
                <option>Acrylic (Professional)</option>
                <option>Cemented</option>
                <option>Clay</option>
                <option>Hardcourt</option>
              </select>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Max Players</label>
              <input type="number" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
            <div>
              <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Price per Hour (₱)</label>
              <input type="number" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })}
                style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
            </div>
          </div>
        </div>

        {/* Amenities */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Facility Amenities</h3>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '10px' }}>
            {AMENITIES_OPTIONS.map(a => (
              <button key={a} onClick={() => toggleAmenity(a)}
                style={{ padding: '10px 8px', borderRadius: '8px', fontSize: '12px', fontWeight: '500', border: '1px solid', cursor: 'pointer', textAlign: 'center',
                  borderColor: amenities.includes(a) ? '#16a34a' : '#e5e7eb',
                  background: amenities.includes(a) ? '#f0fdf4' : 'white',
                  color: amenities.includes(a) ? '#16a34a' : '#374151' }}>
                {a}
              </button>
            ))}
          </div>
        </div>

        {/* Operating Schedule */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Operating Schedule</h3>
          {[
            { label: 'Mon - Fri', openKey: 'monFriOpen', closeKey: 'monFriClose' },
            { label: 'Saturday', openKey: 'satOpen', closeKey: 'satClose' },
            { label: 'Sunday', openKey: 'sunOpen', closeKey: 'sunClose' },
          ].map(row => (
            <div key={row.label} style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '12px', fontSize: '14px' }}>
              <span style={{ width: '80px', color: '#374151', fontWeight: '500' }}>{row.label}</span>
              <input type="time" value={form[row.openKey].substring(0, 5)}
                onChange={e => setForm({ ...form, [row.openKey]: e.target.value + ':00' })}
                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }} />
              <span style={{ color: '#9ca3af' }}>to</span>
              <input type="time" value={form[row.closeKey].substring(0, 5)}
                onChange={e => setForm({ ...form, [row.closeKey]: e.target.value + ':00' })}
                style={{ border: '1px solid #e5e7eb', borderRadius: '8px', padding: '8px 12px', fontSize: '14px' }} />
            </div>
          ))}
        </div>

        {/* Description */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
          <div style={{ marginBottom: '16px' }}>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>External Booking URL (Optional)</label>
            <input placeholder="https://yourclub.com/book" value={form.externalBookingUrl}
              onChange={e => setForm({ ...form, externalBookingUrl: e.target.value })}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box' }} />
          </div>
          <div>
            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Court Description</label>
            <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })}
              rows={4}
              style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', boxSizing: 'border-box', resize: 'vertical' }} />
          </div>
        </div>

        {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'flex-end' }}>
          <button onClick={() => navigate('/owner/dashboard')}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #e5e7eb', background: 'white', cursor: 'pointer', color: '#374151' }}>
            Cancel
          </button>
          <button onClick={handleSubmit} disabled={loading}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', background: '#16a34a', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}>
            {loading ? 'Saving...' : 'Save Changes'}
          </button>
        </div>
      </div>
    </div>
  )
}

export default EditCourtPage