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
  const [existingImages, setExistingImages] = useState([])
  const [deletingImageId, setDeletingImageId] = useState(null)
  const [loading, setLoading] = useState(false)
  const [deletingCourt, setDeletingCourt] = useState(false)
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
        paymentMethod: court.paymentMethod || 'PayAtVenue',
      })
      setAmenities(court.amenities ? court.amenities.split(',').map(a => a.trim()).filter(Boolean) : [])
      setExistingImages(court.images || [])
      setFetching(false)
    }).catch(() => navigate('/owner/dashboard'))
  }, [id])

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleDeleteImage = async (imageId) => {
    const confirmed = window.confirm('Delete this photo? This can\'t be undone.')
    if (!confirmed) return

    setDeletingImageId(imageId)
    try {
      await api.delete(`/courts/${id}/images/${imageId}`)
      setExistingImages(prev => prev.filter(img => img.id !== imageId))
    } catch {
      setError('Failed to delete image. Please try again.')
    } finally {
      setDeletingImageId(null)
    }
  }

  const handleDeleteCourt = async () => {
    const confirmed = window.confirm(
      `Delete "${form?.name || 'this court'}"? This can't be undone. Courts with pending or confirmed bookings can't be deleted.`
    )
    if (!confirmed) return

    setDeletingCourt(true)
    setError(null)
    try {
      await api.delete(`/courts/${id}`)
      navigate('/owner/courts')
    } catch (err) {
      const message = err?.response?.data
      setError(typeof message === 'string' ? message : 'Failed to delete court. Please try again.')
    } finally {
      setDeletingCourt(false)
    }
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

        {/* Existing Images */}
        {existingImages.length > 0 && (
          <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '24px' }}>
            <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '16px' }}>Current Photos</h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '12px' }}>
              {existingImages.map(img => (
                <div key={img.id} style={{ position: 'relative', borderRadius: '8px', overflow: 'hidden', aspectRatio: '1', background: '#f3f4f6' }}>
                  <img src={img.imageUrl} alt="Court" style={{ width: '100%', height: '100%', objectFit: 'cover', display: 'block' }} />
                  <button
                    type="button"
                    onClick={() => handleDeleteImage(img.id)}
                    disabled={deletingImageId === img.id}
                    title="Delete photo"
                    style={{
                      position: 'absolute', top: '6px', right: '6px', width: '24px', height: '24px',
                      borderRadius: '999px', border: 'none', background: 'rgba(0,0,0,0.6)', color: 'white',
                      fontSize: '14px', lineHeight: '24px', textAlign: 'center', cursor: deletingImageId === img.id ? 'not-allowed' : 'pointer',
                      opacity: deletingImageId === img.id ? 0.5 : 1,
                    }}
                  >
                    ✕
                  </button>
                </div>
              ))}
            </div>
          </div>
        )}

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

        {/* Payment Method */}
        <div style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px', marginBottom: '16px' }}>
          <h3 style={{ fontWeight: '700', fontSize: '15px', marginBottom: '4px' }}>Payment Method</h3>
          <p style={{ fontSize: '13px', color: '#6b7280', marginBottom: '16px' }}>Choose how bookers pay for this court.</p>
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px' }}>
            <button
              type="button"
              onClick={() => setForm({ ...form, paymentMethod: 'PayAtVenue' })}
              style={{
                textAlign: 'left', padding: '14px', borderRadius: '8px', cursor: 'pointer',
                border: form.paymentMethod === 'PayAtVenue' ? '1px solid #16a34a' : '1px solid #e5e7eb',
                background: form.paymentMethod === 'PayAtVenue' ? '#f0fdf4' : 'white',
              }}
            >
              <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: form.paymentMethod === 'PayAtVenue' ? '#15803d' : '#111827' }}>
                Pay at Venue
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Bookers reserve now, pay in person on arrival.
              </span>
            </button>
            <button
              type="button"
              onClick={() => setForm({ ...form, paymentMethod: 'PayMongo' })}
              style={{
                textAlign: 'left', padding: '14px', borderRadius: '8px', cursor: 'pointer',
                border: form.paymentMethod === 'PayMongo' ? '1px solid #16a34a' : '1px solid #e5e7eb',
                background: form.paymentMethod === 'PayMongo' ? '#f0fdf4' : 'white',
              }}
            >
              <span style={{ display: 'block', fontSize: '13px', fontWeight: '700', color: form.paymentMethod === 'PayMongo' ? '#15803d' : '#111827' }}>
                Pay Online (PayMongo)
              </span>
              <span style={{ display: 'block', fontSize: '12px', color: '#6b7280', marginTop: '2px' }}>
                Coming soon — bookings still default to pay-at-venue for now.
              </span>
            </button>
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

        <div style={{ display: 'flex', gap: '12px', justifyContent: 'space-between' }}>
          <button onClick={handleDeleteCourt} disabled={deletingCourt}
            style={{ padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: '1px solid #fca5a5', background: 'white', cursor: deletingCourt ? 'not-allowed' : 'pointer', color: '#dc2626', opacity: deletingCourt ? 0.5 : 1 }}>
            {deletingCourt ? 'Deleting...' : 'Delete Court'}
          </button>
          <div style={{ display: 'flex', gap: '12px' }}>
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
    </div>
  )
}

export default EditCourtPage