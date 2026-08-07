import { useEffect, useState } from 'react'
import { useNavigate, useParams } from 'react-router-dom'
import { ArrowLeft, Link as LinkIcon, Menu, Upload, X } from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'

const AMENITIES_OPTIONS = ['Night Lighting', 'Free WiFi', 'Parking', 'Locker Rooms', 'Water Station', 'Paddle Rental', 'Changing Rooms', 'Ample Parking']

const SCHEDULE_ROWS = [
  { label: 'Mon - Fri', openKey: 'monFriOpen', closeKey: 'monFriClose' },
  { label: 'Saturday', openKey: 'satOpen', closeKey: 'satClose' },
  { label: 'Sunday', openKey: 'sunOpen', closeKey: 'sunClose' },
]

function fieldClass(extra = '') {
  return `owner-field px-4 py-3 text-sm font-normal placeholder:text-gray-400 ${extra}`
}

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
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }

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
  }, [id, navigate])

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleDeleteImage = async (imageId) => {
    const confirmed = window.confirm('Delete this photo? This cannot be undone.')
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
      `Delete "${form?.name || 'this court'}"? This cannot be undone. Courts with pending or confirmed bookings cannot be deleted.`
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
        maxPlayers: parseInt(form.maxPlayers),
      }
      await api.put(`/courts/${id}`, courtData)
    } catch {
      setError('Failed to update court. Please try again.')
      setLoading(false)
      return
    }

    try {
      for (const img of images) {
        const formData = new FormData()
        formData.append('file', img)
        await api.post(`/courts/${id}/images`, formData)
      }
    } catch {
      alert('Court updated, but some images failed to upload. Please try adding them again.')
    }

    navigate('/owner/courts')
  }

  if (fetching) {
    return (
      <div className="min-h-screen flex items-center justify-center owner-workspace text-slate-500">
        Loading...
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 sticky top-0 z-10">
          <div className="flex items-center justify-between gap-3">
            <div className="flex items-center gap-2 min-w-0">
              <button
                onClick={() => setSidebarOpen(true)}
                className="lg:hidden p-2 -ml-2 rounded-md text-neutral-700 hover:bg-black/5 shrink-0"
                aria-label="Open menu"
              >
                <Menu className="w-5 h-5" />
              </button>
              <div className="min-w-0">
                <p className="owner-kicker mb-1">Court Inventory</p>
                <h1 className="owner-title text-2xl sm:text-3xl leading-none truncate">Edit Court</h1>
              </div>
            </div>
            <button
              onClick={() => navigate('/owner/courts')}
              className="owner-secondary-btn px-4 py-2 flex items-center gap-2 text-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </header>

        <main className="w-full max-w-[960px] px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col gap-8">
          <p className="text-zinc-600 text-sm">Update court details, photos, schedule, payment method, and listing copy.</p>

          {existingImages.length > 0 && (
            <section className="owner-panel p-6 sm:p-8">
              <h2 className="text-stone-900 text-xl font-semibold leading-6 mb-4">Current Photos</h2>
              <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
                {existingImages.map(img => (
                  <div key={img.id} className="relative rounded-lg overflow-hidden aspect-square bg-stone-100">
                    <img src={img.imageUrl} alt="Court" className="w-full h-full object-cover block" />
                    <button
                      type="button"
                      onClick={() => handleDeleteImage(img.id)}
                      disabled={deletingImageId === img.id}
                      title="Delete photo"
                      className="absolute top-2 right-2 w-8 h-8 rounded-md border border-white/30 bg-black/65 text-white flex items-center justify-center disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <X className="w-4 h-4" />
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          <section className="owner-panel-muted p-6 sm:p-8 flex flex-col gap-4">
            <span className="text-zinc-600 text-sm font-semibold uppercase leading-5 tracking-wide">Gallery</span>
            <label className="h-44 relative bg-white/60 rounded-lg outline outline-2 outline-offset-[-2px] outline-dashed outline-stone-300 flex flex-col justify-center items-center gap-1 overflow-hidden cursor-pointer hover:bg-white">
              <Upload className="w-6 h-6 text-[var(--pb-teal)]" />
              <span className="text-stone-900 text-sm font-semibold leading-5 tracking-tight">Upload additional court images</span>
              <span className="text-zinc-600 text-xs font-normal leading-4">JPEG or PNG</span>
              <input type="file" multiple accept="image/*" onChange={e => setImages(Array.from(e.target.files))} className="hidden" />
            </label>
            {images.length > 0 && <p className="text-[var(--pb-teal)] text-sm font-semibold leading-5">{images.length} new image(s) selected</p>}
          </section>

          <section className="owner-panel p-6 sm:p-8 flex flex-col gap-4">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Court Name</label>
              <input value={form.name} onChange={e => setForm({ ...form, name: e.target.value })} className={fieldClass()} />
            </div>

            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Full Address</label>
              <input value={form.address} onChange={e => setForm({ ...form, address: e.target.value })} className={fieldClass()} />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Environment</label>
                <select value={form.type} onChange={e => setForm({ ...form, type: e.target.value })} className={fieldClass()}>
                  <option>Outdoor</option>
                  <option>Indoor</option>
                </select>
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Surface Material</label>
                <select value={form.surfaceType} onChange={e => setForm({ ...form, surfaceType: e.target.value })} className={fieldClass()}>
                  <option value="">Select surface</option>
                  <option>Acrylic (Professional)</option>
                  <option>Cemented</option>
                  <option>Clay</option>
                  <option>Hardcourt</option>
                </select>
              </div>
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Max Players</label>
                <input type="number" value={form.maxPlayers} onChange={e => setForm({ ...form, maxPlayers: e.target.value })} className={fieldClass()} />
              </div>
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Price per Hour (PHP)</label>
                <input type="number" value={form.pricePerHour} onChange={e => setForm({ ...form, pricePerHour: e.target.value })} className={fieldClass()} />
              </div>
            </div>
          </section>

          <section className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
            <div>
              <h2 className="text-stone-900 text-xl font-semibold leading-6">Payment Method</h2>
              <p className="text-zinc-600 text-sm font-normal leading-5 mt-1">Choose how bookers pay for this court.</p>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              {[
                { value: 'PayAtVenue', title: 'Pay at Venue', body: 'Bookers reserve now, pay in person on arrival.' },
                { value: 'Online', title: 'Pay Online (Xendit)', body: 'Bookers pay online at checkout through Xendit.' },
              ].map(option => {
                const selected = form.paymentMethod === option.value
                return (
                  <button
                    key={option.value}
                    type="button"
                    onClick={() => setForm({ ...form, paymentMethod: option.value })}
                    className={`p-4 rounded-lg outline outline-1 outline-offset-[-1px] text-left transition-colors ${selected ? 'outline-[var(--pb-teal)] bg-[#E7EEE9]' : 'outline-neutral-200 bg-white hover:bg-stone-50'}`}
                  >
                    <span className={`text-sm font-semibold block ${selected ? 'text-[var(--pb-teal)]' : 'text-stone-900'}`}>{option.title}</span>
                    <span className="text-xs text-zinc-600 block mt-1">{option.body}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-stone-900 text-xl font-semibold leading-6">Facility Amenities</h2>
            <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
              {AMENITIES_OPTIONS.map(a => {
                const selected = amenities.includes(a)
                return (
                  <button
                    key={a}
                    type="button"
                    onClick={() => toggleAmenity(a)}
                    className={`p-3 rounded-lg outline outline-1 outline-offset-[-1px] text-left transition-colors ${selected ? 'outline-[var(--pb-teal)] bg-[#E7EEE9]' : 'outline-neutral-200 bg-white hover:bg-stone-50'}`}
                  >
                    <span className={`text-xs font-medium leading-4 ${selected ? 'text-[var(--pb-teal)]' : 'text-stone-900'}`}>{a}</span>
                  </button>
                )
              })}
            </div>
          </section>

          <section className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
            <h2 className="text-stone-900 text-xl font-semibold leading-6">Operating Schedule</h2>
            <div className="flex flex-col gap-4">
              {SCHEDULE_ROWS.map((row, i) => (
                <div key={row.label} className={`py-3 flex flex-col sm:flex-row sm:justify-between sm:items-center gap-3 ${i < SCHEDULE_ROWS.length - 1 ? 'border-b border-zinc-100' : ''}`}>
                  <span className="w-32 text-stone-900 text-sm font-semibold leading-5 tracking-tight">{row.label}</span>
                  <div className="flex items-center gap-3">
                    <input type="time" value={form[row.openKey].substring(0, 5)} onChange={e => setForm({ ...form, [row.openKey]: e.target.value + ':00' })} className="owner-field px-3 py-2 text-sm" />
                    <span className="text-zinc-600 text-sm">to</span>
                    <input type="time" value={form[row.closeKey].substring(0, 5)} onChange={e => setForm({ ...form, [row.closeKey]: e.target.value + ':00' })} className="owner-field px-3 py-2 text-sm" />
                  </div>
                </div>
              ))}
            </div>
          </section>

          <section className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">External Booking URL (Optional)</label>
              <div className="relative">
                <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                <input placeholder="https://yourclub.com/book" value={form.externalBookingUrl} onChange={e => setForm({ ...form, externalBookingUrl: e.target.value })} className={fieldClass('pl-12')} />
              </div>
            </div>
            <div className="flex flex-col gap-2">
              <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Court Description</label>
              <textarea value={form.description} onChange={e => setForm({ ...form, description: e.target.value })} rows={4} className={fieldClass('resize-y')} />
            </div>
          </section>

          {error && <p className="text-red-600 text-sm font-normal leading-5">{error}</p>}

          <div className="pt-2 flex flex-col sm:flex-row sm:justify-between gap-3">
            <button onClick={handleDeleteCourt} disabled={deletingCourt} className="owner-danger-btn px-6 py-3 text-sm disabled:opacity-50 disabled:cursor-not-allowed">
              {deletingCourt ? 'Deleting...' : 'Delete Court'}
            </button>
            <div className="flex justify-end gap-3">
              <button onClick={() => navigate('/owner/courts')} className="owner-secondary-btn px-6 py-3 text-sm">
                Cancel
              </button>
              <button onClick={handleSubmit} disabled={loading} className="owner-primary-btn px-8 py-3 text-sm disabled:opacity-70 disabled:cursor-not-allowed">
                {loading ? 'Saving...' : 'Save Changes'}
              </button>
            </div>
          </div>
        </main>
      </div>
    </div>
  )
}

export default EditCourtPage
