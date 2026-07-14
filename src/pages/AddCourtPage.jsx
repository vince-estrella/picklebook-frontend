import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  LayoutDashboard,
  MapPin,
  CalendarCheck,
  Users,
  CreditCard,
  FileText,
  ArrowLeft,
  Upload,
  Link as LinkIcon,
} from 'lucide-react'
import api from '../services/api'
import LocationPicker from '../components/LocationPicker'

const AMENITIES_OPTIONS = ['Night Lighting', 'Free WiFi', 'Parking', 'Locker Rooms', 'Water Station', 'Paddle Rental', 'Changing Rooms', 'Ample Parking']

const NAV_ITEMS = [
  { label: 'Dashboard', path: '/owner/dashboard', icon: LayoutDashboard },
  { label: 'Manage Courts', path: '/owner/courts', icon: MapPin },
  { label: 'Bookings', path: '/owner/bookings', icon: CalendarCheck },
  { label: 'Users', path: '/owner/users', icon: Users },
  { label: 'Payments', path: '/owner/payments', icon: CreditCard },
  { label: 'Reports', path: '/owner/reports', icon: FileText },
]

const SCHEDULE_ROWS = [
  { label: 'Mon - Fri', openKey: 'monFriOpen', closeKey: 'monFriClose' },
  { label: 'Saturday', openKey: 'satOpen', closeKey: 'satClose' },
  { label: 'Sunday', openKey: 'sunOpen', closeKey: 'sunClose' },
]

function fieldClass(extra = '') {
  return `w-full bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-neutral-200 px-4 py-4 text-base font-normal text-stone-900 placeholder:text-gray-400 focus:outline-emerald-700 focus:outline-2 ${extra}`
}

function AddCourtPage() {
  const navigate = useNavigate()
  const [form, setForm] = useState({
    name: '',
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
  })
  const [amenities, setAmenities] = useState([])
  const [images, setImages] = useState([])
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState(null)

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
      const courtData = { ...form, amenities: amenities.join(','), pricePerHour: parseFloat(form.pricePerHour), maxPlayers: parseInt(form.maxPlayers) }
      const res = await api.post('/courts', courtData)
      const courtId = res.data.id

      // Upload images if any
      for (const img of images) {
        const formData = new FormData()
        formData.append('file', img)
        await api.post(`/courts/${courtId}/images`, formData, {
          headers: { 'Content-Type': 'multipart/form-data' }
        })
      }

      navigate('/owner/dashboard')
    } catch (err) {
      setError('Failed to save court. Please try again.')
    } finally {
      setLoading(false)
    }
  }

  const currentPath = window.location.pathname

  return (
    <div className="w-full min-h-screen bg-stone-50 flex">

      {/* Sidebar */}
      <aside className="w-64 min-w-[16rem] h-screen sticky top-0 bg-gray-100 border-r border-stone-300 flex flex-col p-4">
        <div className="px-2 py-4">
          <span className="text-green-800 text-2xl font-bold leading-8">PickleBook</span>
        </div>

        <nav className="flex-1 pt-2 flex flex-col gap-1">
          {NAV_ITEMS.map(item => {
            const Icon = item.icon
            const active = currentPath === item.path || (item.path === '/owner/courts' && currentPath.startsWith('/owner/courts'))
            return (
              <button
                key={item.path}
                onClick={() => navigate(item.path)}
                className={`flex items-center gap-3 px-4 py-3 rounded-lg text-sm font-normal leading-5 text-left transition-colors ${
                  active ? 'bg-green-700 text-green-50' : 'text-neutral-700 hover:bg-gray-200'
                }`}
              >
                <Icon className="w-4 h-4 shrink-0" />
                <span>{item.label}</span>
              </button>
            )
          })}
        </nav>
      </aside>

      {/* Main column */}
      <div className="flex-1 flex flex-col items-center">
        <div className="w-full max-w-[896px] px-8 py-12 flex flex-col gap-10">

          {/* Header */}
          <div className="flex justify-between items-end">
            <div>
              <h1 className="text-stone-900 text-3xl font-bold leading-10">Register New Court</h1>
              <p className="text-zinc-600 text-base font-normal leading-6">
                Enter the specific details for your facility to start receiving bookings.
              </p>
            </div>
            <button
              type="button"
              onClick={() => navigate('/owner/dashboard')}
              className="flex items-center gap-2 text-emerald-800 text-base font-normal leading-6 hover:underline shrink-0"
            >
              <ArrowLeft className="w-4 h-4" />
              Back to List
            </button>
          </div>

          <div className="flex flex-col gap-8">

            {/* Gallery upload */}
            <div className="p-8 bg-stone-100 rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-4">
              <span className="text-zinc-600 text-sm font-semibold uppercase leading-5 tracking-wide">Gallery</span>
              <label className="h-64 relative bg-stone-50/50 rounded-xl outline outline-2 outline-offset-[-2px] outline-dashed outline-stone-300 flex flex-col justify-center items-center gap-1 overflow-hidden cursor-pointer hover:bg-stone-50">
                <Upload className="w-6 h-6 text-emerald-800" />
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
                <p className="text-emerald-800 text-sm font-semibold leading-5">{images.length} image(s) selected</p>
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

              <div className="flex flex-col gap-2">
                <label className="text-neutral-700 text-sm font-semibold leading-5 tracking-tight">Full Address</label>
                <div className="relative">
                  <MapPin className="w-4 h-4 text-zinc-500 absolute left-4 top-1/2 -translate-y-1/2" />
                  <input
                    type="text"
                    placeholder="Blk 1, Lot 1, Court 1"
                    value={form.address}
                    onChange={e => setForm({ ...form, address: e.target.value })}
                    className={fieldClass('pl-12')}
                  />
                </div>
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
            <div className="p-8 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-6">
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
                        selected ? 'outline-emerald-700 bg-emerald-50' : 'outline-neutral-200 bg-white hover:bg-stone-50'
                      }`}
                    >
                      <span className={`w-5 h-5 rounded-sm border flex items-center justify-center shrink-0 ${
                        selected ? 'bg-emerald-800 border-emerald-800' : 'bg-white border-neutral-200'
                      }`}>
                        {selected && <span className="w-2 h-2 bg-white rounded-[1px]" />}
                      </span>
                      <span className={`text-xs font-medium leading-4 ${selected ? 'text-emerald-800' : 'text-stone-900'}`}>
                        {a}
                      </span>
                    </button>
                  )
                })}
              </div>
            </div>

            {/* Operating schedule */}
            <div className="p-8 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-6">
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
            <div className="p-8 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-6">
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
            <div className="p-8 bg-white rounded-xl outline outline-1 outline-offset-[-1px] outline-neutral-200 flex flex-col gap-4">
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
            </div>

            {error && (
              <p className="text-red-600 text-sm font-normal leading-5">{error}</p>
            )}

            {/* Actions */}
            <div className="pt-6 border-t border-neutral-200 flex justify-end items-center gap-4">
              <button
                type="button"
                onClick={() => navigate('/owner/dashboard')}
                className="px-8 py-3 rounded-lg text-zinc-600 text-sm font-semibold leading-5 tracking-tight hover:bg-stone-100"
              >
                Discard Draft
              </button>
              <button
                type="button"
                onClick={handleSubmit}
                disabled={loading}
                className="px-12 py-3 bg-emerald-800 hover:bg-emerald-900 disabled:opacity-70 disabled:cursor-not-allowed rounded-lg shadow-md text-white text-xl font-bold leading-6 transition-colors"
              >
                {loading ? 'Saving...' : 'Save Court'}
              </button>
            </div>
          </div>
        </div>

        {/* Footer */}
        <div className="w-full px-8 py-12 bg-stone-100 border-t border-neutral-200 flex justify-between items-center flex-wrap gap-6">
          <div className="flex flex-col gap-2">
            <span className="text-stone-900 text-xl font-bold leading-6">PickleBook</span>
            <span className="text-stone-400 text-base font-normal leading-6">© 2026 PickleBook. High-performance court management.</span>
          </div>
          <div className="flex gap-6">
            <span className="text-stone-400 text-xs font-medium leading-4">Privacy Policy</span>
            <span className="text-stone-400 text-xs font-medium leading-4">Terms of Service</span>
            <span className="text-stone-400 text-xs font-medium leading-4">Contact Support</span>
          </div>
        </div>
      </div>
    </div>
  )
}

export default AddCourtPage
