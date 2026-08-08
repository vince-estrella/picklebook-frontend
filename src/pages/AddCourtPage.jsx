import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  MapPin,
  ArrowLeft,
  Upload,
  Link as LinkIcon,
  Menu,
} from 'lucide-react'
import api from '../services/api'
import LocationPicker from '../components/LocationPicker'
import OwnerSidebar from '../components/OwnerSidebar'

const AMENITIES_OPTIONS = ['Night Lighting', 'Free WiFi', 'Parking', 'Locker Rooms', 'Water Station', 'Paddle Rental', 'Changing Rooms', 'Ample Parking']

const SCHEDULE_ROWS = [
  { label: 'Mon - Fri', openKey: 'monFriOpen', closeKey: 'monFriClose' },
  { label: 'Saturday', openKey: 'satOpen', closeKey: 'satClose' },
  { label: 'Sunday', openKey: 'sunOpen', closeKey: 'sunClose' },
]

function fieldClass(extra = '') {
  return `owner-field px-4 py-4 text-base font-normal placeholder:text-gray-400 ${extra}`
}

function AddCourtPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
    venueId: '',
    venueName: '',
    address: '',
    type: 'Outdoor',
    surfaceType: '',
    maxPlayers: 4,
    pricePerHour: '',
    description: '',
    externalBookingUrl: '',
    monFriOpen: '06:00:00',
    monFriClose: '22:00:00',
    satOpen: '07:00:00',
    satClose: '21:00:00',
    sunOpen: '08:00:00',
    sunClose: '20:00:00',
    latitude: 0,
    longitude: 0,
    courtOwnerId: JSON.parse(localStorage.getItem('owner') || '{}').id,
    paymentMethod: 'PayAtVenue',
    allowOpenPlay: true,
  })
  const [amenities, setAmenities] = useState([])
  const [venues, setVenues] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  useEffect(() => {
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    api.get('/venues/owner').then(res => setVenues(Array.isArray(res.data) ? res.data : [])).catch(() => setVenues([]))
  }, [navigate])

  const toggleAmenity = (a) => {
    setAmenities(prev => prev.includes(a) ? prev.filter(x => x !== a) : [...prev, a])
  }

  const handleSubmit = async () => {
    if (!form.name || !form.pricePerHour || (!form.venueId && (!form.venueName || !form.address))) {
      setError('Court name, venue, address, and price are required.')
      return
    }
    setLoading(true)
    setError(null)

    let courtId
    try {
      const selectedVenue = venues.find(v => String(v.id) === String(form.venueId))
      const courtData = {
        ...form,
        venueId: form.venueId ? Number(form.venueId) : null,
        venue: form.venueId
          ? null
          : {
              name: form.venueName,
              address: form.address,
              latitude: form.latitude,
              longitude: form.longitude,
              amenities: amenities.join(','),
              description: form.description,
              externalBookingUrl: form.externalBookingUrl,
            },
        address: selectedVenue?.address || form.address,
        latitude: selectedVenue?.latitude ?? form.latitude,
        longitude: selectedVenue?.longitude ?? form.longitude,
        amenities: amenities.join(','),
        pricePerHour: parseFloat(form.pricePerHour),
        maxPlayers: parseInt(form.maxPlayers),
      }
      const res = await api.post('/courts', courtData)
      courtId = res.data.id
    } catch {
      setError('Failed to save court. Please try again.')
      setLoading(false)
      return
    }

    // The court already exists at this point — an image-upload failure below
    // must not be reported as a save failure, or the owner will resubmit and
    // create a duplicate court.
    try {
      for (const img of images) {
        const formData = new FormData()
        formData.append('file', img)
        await api.post(`/courts/${courtId}/images`, formData)
      }
    } catch {
      alert('Court saved, but some images failed to upload. You can add them from Edit Court.')
    }

    navigate('/owner/dashboard')
  }

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      {/* Main column */}
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
                <h1 className="owner-title text-2xl sm:text-3xl leading-none truncate">Register New Court</h1>
              </div>
            </div>
            <button
              type="button"
              onClick={() => navigate('/owner/courts')}
              className="owner-secondary-btn px-4 py-2 flex items-center gap-2 text-sm shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back
            </button>
          </div>
        </header>

        <main className="w-full max-w-[960px] px-4 sm:px-6 lg:px-8 py-8 lg:py-10 flex flex-col gap-8">
          <div>
              <p className="text-zinc-600 text-base font-normal leading-6">
                Enter the specific details for your facility to start receiving bookings.
              </p>
          </div>

          <div className="flex flex-col gap-8">

            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-5">
              <div>
                <h2 className="text-stone-900 text-xl font-semibold leading-6">Venue</h2>
                <p className="text-zinc-600 text-sm font-normal leading-5 mt-1">
                  The venue is the map pin. Add courts underneath it as bookable units.
                </p>
              </div>
              {venues.length > 0 && (
                <label className="flex flex-col gap-2">
                  <span className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Use existing venue</span>
                  <select
                    value={form.venueId}
                    onChange={e => {
                      const venue = venues.find(v => String(v.id) === e.target.value)
                      setForm({
                        ...form,
                        venueId: e.target.value,
                        venueName: '',
                        address: venue?.address || form.address,
                        latitude: venue?.latitude ?? form.latitude,
                        longitude: venue?.longitude ?? form.longitude,
                      })
                    }}
                    className={fieldClass()}
                  >
                    <option value="">Create a new venue</option>
                    {venues.map(venue => (
                      <option key={venue.id} value={venue.id}>{venue.name} ({venue.courtCount} court{venue.courtCount === 1 ? '' : 's'})</option>
                    ))}
                  </select>
                </label>
              )}
              {!form.venueId && (
                <>
                  <label className="flex flex-col gap-2">
                    <span className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Venue Name</span>
                    <input
                      type="text"
                      placeholder="e.g. Metro Sports Cebu"
                      value={form.venueName}
                      onChange={e => setForm({ ...form, venueName: e.target.value })}
                      className={fieldClass()}
                    />
                  </label>
                  <label className="flex flex-col gap-2">
                    <span className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Venue Address</span>
                    <div className="relative">
                      <MapPin className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                      <input
                        type="text"
                        placeholder="Street, barangay, city"
                        value={form.address}
                        onChange={e => setForm({ ...form, address: e.target.value })}
                        className={fieldClass('pl-12')}
                      />
                    </div>
                  </label>
                </>
              )}
            </div>

            {/* Gallery upload */}
            <div className="owner-panel-muted p-6 sm:p-8 flex flex-col gap-4">
              <span className="text-zinc-600 text-sm font-semibold uppercase leading-5 tracking-wide">Gallery</span>
              <label className="h-64 relative bg-white/60 rounded-lg outline outline-2 outline-offset-[-2px] outline-dashed outline-stone-300 flex flex-col justify-center items-center gap-1 overflow-hidden cursor-pointer hover:bg-white">
                <Upload className="w-6 h-6 text-[var(--pb-teal)]" />
                <span className="text-stone-900 text-sm font-semibold leading-5 tracking-tight">Click to upload court images</span>
                <span className="text-zinc-600 text-xs font-normal leading-4">High-resolution JPEG or PNG, max 10MB</span>
                <input
                  type="file"
                  multiple
                  accept="image/*"
                  onChange={e => setImages(Array.from(e.target.files))}
                  className="hidden"
                />
              </label>
              {images.length > 0 && (
                <p className="text-[var(--pb-teal)] text-sm font-semibold leading-5">{images.length} image(s) selected</p>
              )}
            </div>

            {/* Basic info */}
            <div className="flex flex-col gap-4">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Court Name</label>
                <input
                  type="text"
                  placeholder="e.g. Court 1 - Pickle Court"
                  value={form.name}
                  onChange={e => setForm({ ...form, name: e.target.value })}
                  className={fieldClass()}
                />
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Environment</label>
                  <select
                    value={form.type}
                    onChange={e => setForm({ ...form, type: e.target.value })}
                    className={fieldClass()}
                  >
                    <option>Outdoor</option>
                    <option>Indoor</option>
                  </select>
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Surface Material</label>
                  <select
                    value={form.surfaceType}
                    onChange={e => setForm({ ...form, surfaceType: e.target.value })}
                    className={fieldClass()}
                  >
                    <option value="">Select surface</option>
                    <option>Acrylic (Professional)</option>
                    <option>Cemented</option>
                    <option>Clay</option>
                    <option>Hardcourt</option>
                  </select>
                </div>
              </div>

              <div className="grid grid-cols-2 gap-4">
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Max Players</label>
                  <input
                    type="number"
                    value={form.maxPlayers}
                    onChange={e => setForm({ ...form, maxPlayers: e.target.value })}
                    className={fieldClass()}
                  />
                </div>
                <div className="flex flex-col gap-2">
                  <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Price per Hour (₱)</label>
                  <input
                    type="number"
                    placeholder="350"
                    value={form.pricePerHour}
                    onChange={e => setForm({ ...form, pricePerHour: e.target.value })}
                    className={fieldClass()}
                  />
                </div>
              </div>
            </div>

            {/* Amenities */}
            {/* Payment method */}
            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
              <div>
                <h2 className="text-stone-900 text-xl font-semibold leading-6">Payment Method</h2>
                <p className="text-zinc-600 text-sm font-normal leading-5 mt-1">
                  Choose how bookers pay for this court.
                </p>
              </div>
              <div className="grid grid-cols-2 gap-4">
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'PayAtVenue' })}
                  className={`p-4 rounded-lg outline outline-1 outline-offset-[-1px] text-left transition-colors ${
                    form.paymentMethod === 'PayAtVenue'
                      ? 'outline-[var(--pb-teal)] bg-[#E7EEE9]'
                      : 'outline-neutral-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span className={`text-sm font-semibold block ${form.paymentMethod === 'PayAtVenue' ? 'text-[var(--pb-teal)]' : 'text-stone-900'}`}>
                    Pay at Venue
                  </span>
                  <span className="text-xs text-zinc-600 block mt-1">
                    Bookers reserve now, pay in person on arrival.
                  </span>
                </button>
                <button
                  type="button"
                  onClick={() => setForm({ ...form, paymentMethod: 'Online' })}
                  className={`p-4 rounded-lg outline outline-1 outline-offset-[-1px] text-left transition-colors ${
                    form.paymentMethod === 'Online'
                      ? 'outline-[var(--pb-teal)] bg-[#E7EEE9]'
                      : 'outline-neutral-200 bg-white hover:bg-stone-50'
                  }`}
                >
                  <span className={`text-sm font-semibold block ${form.paymentMethod === 'Online' ? 'text-[var(--pb-teal)]' : 'text-stone-900'}`}>
                    Pay Online (Xendit)
                  </span>
                  <span className="text-xs text-zinc-600 block mt-1">
                    Bookers pay online at checkout through Xendit.
                  </span>
                </button>
              </div>
            </div>
            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-4">
              <div>
                <h2 className="text-stone-900 text-xl font-semibold leading-6">Player-Hosted Open Play</h2>
                <p className="text-zinc-600 text-sm font-normal leading-5 mt-1">
                  Let players turn a confirmed booking into a joinable open-play session with a QR code.
                </p>
              </div>
              <label className="flex items-start gap-3 rounded-lg bg-white p-4 outline outline-1 outline-neutral-200 cursor-pointer">
                <input
                  type="checkbox"
                  checked={form.allowOpenPlay}
                  onChange={e => setForm({ ...form, allowOpenPlay: e.target.checked })}
                  className="mt-1 h-4 w-4 accent-[var(--pb-teal)]"
                />
                <span>
                  <span className="block text-sm font-semibold text-stone-900">Allow Open Play bookings</span>
                  <span className="block text-xs text-zinc-600 mt-1">
                    The court still requires owner confirmation before players can join.
                  </span>
                </span>
              </label>
            </div>
            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
              <h2 className="text-stone-900 text-xl font-semibold leading-6">Facility Amenities</h2>
              <div className="grid grid-cols-4 gap-4">
                {AMENITIES_OPTIONS.map(a => {
                  const selected = amenities.includes(a)
                  return (
                    <button
                      key={a}
                      type="button"
                      onClick={() => toggleAmenity(a)}
                      className={`p-4 rounded-lg outline outline-1 outline-offset-[-1px] flex items-center gap-3 text-left transition-colors ${
                        selected ? 'outline-[var(--pb-teal)] bg-[#E7EEE9]' : 'outline-neutral-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-[var(--pb-teal)] border-[var(--pb-teal)]' : 'bg-white border-neutral-200'
                      }`}>
                        {selected && <span className="w-2 h-2 bg-white rounded-[1px]" />}
                      </span>
                      <span className={`text-xs font-medium leading-4 ${selected ? 'text-[var(--pb-teal)]' : 'text-stone-900'}`}>
                        {a}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Operating schedule */}
            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
              <h2 className="text-stone-900 text-xl font-semibold leading-6">Operating Schedule</h2>
              <div className="flex flex-col gap-4">
                {SCHEDULE_ROWS.map((row, i) => (
                  <div
                    key={row.label}
                    className={`py-3 flex justify-between items-center ${i < SCHEDULE_ROWS.length - 1 ? 'border-b border-zinc-100' : ''}`}
                  >
                    <span className="w-32 text-stone-900 text-sm font-semibold leading-5 tracking-tight">{row.label}</span>
                    <div className="flex items-center gap-4">
                      <input
                        type="time"
                        value={form[row.openKey].substring(0, 5)}
                        onChange={e => setForm({ ...form, [row.openKey]: e.target.value + ':00' })}
                        className="bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 px-3 py-2 text-base font-normal text-stone-900"
                      />
                      <span className="text-zinc-600 text-base font-normal leading-6">to</span>
                      <input
                        type="time"
                        value={form[row.closeKey].substring(0, 5)}
                        onChange={e => setForm({ ...form, [row.closeKey]: e.target.value + ':00' })}
                        className="bg-white rounded-sm outline outline-1 outline-offset-[-1px] outline-neutral-200 px-3 py-2 text-base font-normal text-stone-900"
                      />
                    </div>
                  </div>
                ))}
              </div>
            </div>

            {/* External URL + description */}
            <div className="owner-panel p-6 sm:p-8 flex flex-col gap-6">
              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">External Booking URL (Optional)</label>
                <div className="relative">
                  <LinkIcon className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="https://yourclub.com/book"
                    value={form.externalBookingUrl}
                    onChange={e => setForm({ ...form, externalBookingUrl: e.target.value })}
                    className={fieldClass('pl-12')}
                  />
                </div>
                <p className="px-1 text-zinc-600 text-xs font-normal leading-4">
                  If you use a third-party booking system, link it here.
                </p>
              </div>

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Court Description</label>
                <textarea
                  placeholder="Describe what makes this court unique, player expectations, or local club rules..."
                  value={form.description}
                  onChange={e => setForm({ ...form, description: e.target.value })}
                  rows={4}
                  className={fieldClass('resize-y')}
                />
              </div>
            </div>

            {/* Location */}
            {!form.venueId && <div className="owner-panel p-6 sm:p-8 flex flex-col gap-4">
              <h2 className="text-stone-900 text-xl font-semibold leading-6">Court Location</h2>
              <LocationPicker
                onLocationChange={(location) => {
                  setForm({
                    ...form,
                    latitude: location.latitude,
                    longitude: location.longitude,
                  })
                }}
              />
              <p className="text-zinc-600 text-sm font-normal leading-5">
                Latitude: {form.latitude}
                <br />
                Longitude: {form.longitude}
              </p>
            </div>}

            {error && (
              <p className="text-red-600 text-sm font-normal leading-5">{error}</p>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-neutral-200 flex justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/owner/dashboard')}
                className="owner-secondary-btn px-8 py-3 text-sm leading-5 tracking-tight"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="owner-primary-btn px-12 py-3 disabled:opacity-70 disabled:cursor-not-allowed text-lg leading-6 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Court'}
              </button>
            </div>
          </div>
        </main>

        {/* Footer */}
        <footer className="w-full px-4 sm:px-8 py-10 bg-[var(--pb-navy)] border-t border-white/10 flex justify-between items-center flex-wrap gap-6">
          <div className="flex flex-col gap-2">
            <span className="owner-brand text-xl font-bold leading-6">PickleBook</span>
            <span className="text-stone-400 text-base font-normal leading-6">© 2026 PickleBook. High-performance court management.</span>
          </div>
          <div className="flex gap-6">
            <span className="text-stone-300 text-xs font-medium leading-4">Privacy Policy</span>
            <span className="text-stone-300 text-xs font-medium leading-4">Terms of Service</span>
            <span className="text-stone-300 text-xs font-medium leading-4">Contact Support</span>
          </div>
        </footer>
      </div>
    </div>
  )
}

export default AddCourtPage
