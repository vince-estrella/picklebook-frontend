import { useEffect, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import {
  Building2,
  CalendarCheck,
  ExternalLink,
  MapPin,
  Menu,
  Pencil,
  Plus,
  Search,
  Trash2,
} from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'
import OwnerLoadError from '../components/OwnerLoadError'
import { ensureOwnerSession } from '../lib/ownerSession'

function groupCourtsByVenue(courts) {
  const map = new Map()

  courts.forEach((court) => {
    const venue = court.venue || {
      id: null,
      name: 'Ungrouped venue',
      address: court.address,
    }
    const key = venue.id ? `venue-${venue.id}` : `court-${court.id}`

    if (!map.has(key)) {
      map.set(key, {
        key,
        name: venue.name || 'Ungrouped venue',
        address: venue.address || court.address,
        courts: [],
      })
    }

    map.get(key).courts.push(court)
  })

  return [...map.values()].map((venue) => ({
    ...venue,
    minPrice: Math.min(...venue.courts.map((court) => Number(court.pricePerHour) || 0)),
    bookableCount: venue.courts.filter((court) => court.bookingMode !== 'ExternalOnly').length,
    externalCount: venue.courts.filter((court) => court.bookingMode === 'ExternalOnly').length,
  }))
}

function OwnerCourtsPage() {
  const navigate = useNavigate()
  const [courts, setCourts] = useState([])
  const [venues, setVenues] = useState([])
  const [loading, setLoading] = useState(true)
  const [search, setSearch] = useState('')
  const [deletingId, setDeletingId] = useState(null)
  const [deletingVenueId, setDeletingVenueId] = useState(null)
  const [deleteError, setDeleteError] = useState(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)
  const [loadError, setLoadError] = useState('')
  const [retryKey, setRetryKey] = useState(0)

  useEffect(() => {
    let cancelled = false

    async function loadCourts() {
      const valid = await ensureOwnerSession()
      if (cancelled) return
      if (!valid) {
        navigate('/owner/login')
        return
      }

      try {
        setLoadError('')
        const [courtsRes, venuesRes] = await Promise.all([
          api.get('/courts/owner'),
          api.get('/venues/owner'),
        ])
        if (!cancelled) {
          setCourts(courtsRes.data)
          setVenues(Array.isArray(venuesRes.data) ? venuesRes.data : [])
        }
      } catch (err) {
        if (!cancelled && (err.response?.status === 401 || err.response?.status === 403)) {
          navigate('/owner/login')
          return
        }
        if (!cancelled) setLoadError('Could not load your courts.')
      } finally {
        if (!cancelled) setLoading(false)
      }
    }

    loadCourts()
    return () => { cancelled = true }
  }, [navigate, retryKey])

  const handleDelete = async (court) => {
    const confirmed = window.confirm(
      `Delete "${court.name}"? This can't be undone.`
    )
    if (!confirmed) return

    setDeleteError(null)
    setDeletingId(court.id)
    try {
      await api.delete(`/courts/${court.id}`)
      setCourts((prev) => prev.filter((c) => c.id !== court.id))
    } catch (err) {
      const message =
        err?.response?.data ||
        'Failed to delete court. Please try again.'
      setDeleteError(typeof message === 'string' ? message : 'Failed to delete court. Please try again.')
    } finally {
      setDeletingId(null)
    }
  }

  const handleDeleteVenue = async (venue) => {
    const confirmed = window.confirm(`Delete venue "${venue.name}"?`)
    if (!confirmed) return

    setDeleteError(null)
    setDeletingVenueId(venue.id)
    try {
      await api.delete(`/venues/${venue.id}`)
      setVenues((prev) => prev.filter((item) => item.id !== venue.id))
    } catch (err) {
      const message = err?.response?.data || 'Failed to delete venue. Please try again.'
      setDeleteError(typeof message === 'string' ? message : 'Failed to delete venue. Please try again.')
    } finally {
      setDeletingVenueId(null)
    }
  }

  const filteredCourts = courts.filter((court) => {
    const q = search.trim().toLowerCase()
    if (!q) return true
    return (
      court.name?.toLowerCase().includes(q) ||
      court.venue?.name?.toLowerCase().includes(q) ||
      court.address?.toLowerCase().includes(q) ||
      court.bookingMode?.toLowerCase().includes(q)
    )
  })
  const venueGroups = groupCourtsByVenue(filteredCourts)
  const allVenueGroups = groupCourtsByVenue(courts)
  const emptyVenues = venues.filter((venue) => Number(venue.courtCount || 0) === 0)
  const pickleBookCount = courts.filter((court) => court.bookingMode !== 'ExternalOnly').length
  const externalCount = courts.length - pickleBookCount

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center owner-workspace text-slate-500">
        Loading...
      </div>
    )
  }

  if (loadError) {
    return (
      <div className="w-full min-h-screen owner-workspace flex">
        <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />
        <div className="flex-1 p-4 sm:p-6 lg:p-12">
          <OwnerLoadError
            title="Courts did not load"
            message={loadError}
            onRetry={() => {
              setLoading(true)
              setRetryKey((key) => key + 1)
            }}
          />
        </div>
      </div>
    )
  }

  return (
    <div className="w-full min-h-screen owner-workspace flex">
      <OwnerSidebar isOpen={sidebarOpen} onClose={() => setSidebarOpen(false)} />

      <div className="flex-1 flex flex-col min-w-0">
        <header className="owner-topbar px-4 sm:px-6 lg:px-12 py-4 backdrop-blur-md flex justify-between items-center sticky top-0 z-10 gap-3">
          <div className="flex items-center gap-2 min-w-0">
            <button
              onClick={() => setSidebarOpen(true)}
              className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
              aria-label="Open menu"
            >
              <Menu className="w-5 h-5" />
            </button>
            <div className="min-w-0">
              <p className="owner-kicker mb-1">Venue Inventory</p>
              <h1 className="owner-title text-xl sm:text-2xl leading-8 truncate">Manage Courts</h1>
            </div>
          </div>
          <div className="flex items-center gap-2 sm:gap-4">
            <div className="relative hidden sm:block">
              <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
              <input
                type="text"
                value={search}
                onChange={(e) => setSearch(e.target.value)}
                placeholder="Search courts..."
                className="owner-field w-48 md:w-64 pl-10 pr-4 py-2 text-sm font-normal placeholder:text-gray-500"
              />
            </div>
            <button
              onClick={() => navigate('/owner/courts/add')}
              className="owner-primary-btn px-3 sm:px-6 py-2 flex items-center gap-2 text-sm font-medium transition-colors whitespace-nowrap"
            >
              <Plus className="w-4 h-4" />
              <span className="hidden sm:inline">Add Court</span>
            </button>
          </div>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 flex flex-col gap-6">
          <div className="relative sm:hidden">
            <Search className="w-4 h-4 text-neutral-700 absolute left-4 top-1/2 -translate-y-1/2" />
            <input
              type="text"
              value={search}
              onChange={(e) => setSearch(e.target.value)}
              placeholder="Search courts..."
              className="owner-field w-full pl-10 pr-4 py-2 text-sm font-normal placeholder:text-gray-500"
            />
          </div>

          <div className="grid grid-cols-2 lg:grid-cols-4 gap-3">
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Venues</p>
              <p className="text-2xl font-bold text-slate-900">{venues.length || allVenueGroups.length}</p>
            </div>
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500">Courts</p>
              <p className="text-2xl font-bold text-slate-900">{courts.length}</p>
            </div>
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500">PickleBook</p>
              <p className="text-2xl font-bold text-[var(--pb-teal)]">{pickleBookCount}</p>
            </div>
            <div className="owner-stat p-4">
              <p className="text-xs font-bold uppercase text-slate-500">External</p>
              <p className="text-2xl font-bold text-slate-900">{externalCount}</p>
            </div>
          </div>

          {deleteError && (
            <div className="px-4 py-3 bg-red-50 border border-red-200 rounded-lg text-red-700 text-sm">
              {deleteError}
            </div>
          )}

          {emptyVenues.length > 0 && (
            <section className="owner-panel overflow-hidden">
              <div className="p-5 border-b border-stone-200 bg-[#f8faf6]">
                <p className="owner-kicker mb-1">Cleanup</p>
                <h2 className="text-lg font-bold text-slate-900">Empty Venues</h2>
                <p className="mt-1 text-sm text-slate-500">Only venues with no courts can be deleted.</p>
              </div>
              <div className="divide-y divide-stone-100">
                {emptyVenues.map((venue) => (
                  <div key={venue.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-3 sm:justify-between">
                    <div className="min-w-0">
                      <p className="font-semibold text-slate-900 truncate">{venue.name}</p>
                      <p className="mt-1 text-sm text-slate-500 flex items-start gap-1.5">
                        <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                        <span className="line-clamp-2">{venue.address || 'No address saved'}</span>
                      </p>
                    </div>
                    <button
                      type="button"
                      onClick={() => handleDeleteVenue(venue)}
                      disabled={deletingVenueId === venue.id}
                      className="owner-danger-btn px-3 py-2 text-sm inline-flex items-center justify-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      <Trash2 className="w-4 h-4" />
                      {deletingVenueId === venue.id ? 'Deleting...' : 'Delete Venue'}
                    </button>
                  </div>
                ))}
              </div>
            </section>
          )}

          {filteredCourts.length === 0 ? (
            <div className="owner-panel p-10 text-center text-slate-500 text-sm">
              {courts.length === 0
                ? 'No courts yet. Click "Add Court" to get started.'
                : 'No courts match your search.'}
            </div>
          ) : (
            <div className="grid grid-cols-1 xl:grid-cols-2 gap-5">
              {venueGroups.map((venue) => (
                <section key={venue.key} className="owner-panel overflow-hidden">
                  <div className="p-5 border-b border-stone-200 bg-[#f8faf6]">
                    <div className="flex items-start justify-between gap-3">
                      <div className="min-w-0">
                        <p className="owner-kicker mb-1">Venue</p>
                        <h2 className="text-lg font-bold text-slate-900 truncate">{venue.name}</h2>
                        <p className="mt-1 text-sm text-slate-500 flex items-start gap-1.5">
                          <MapPin className="w-4 h-4 mt-0.5 shrink-0" />
                          <span className="line-clamp-2">{venue.address || 'No address saved'}</span>
                        </p>
                      </div>
                      <div className="text-right shrink-0">
                        <p className="text-xs text-slate-500">from</p>
                        <p className="font-bold text-slate-900">PHP {venue.minPrice}/hr</p>
                      </div>
                    </div>
                    <div className="mt-4 flex flex-wrap gap-2">
                      <span className="owner-chip px-3 py-1 text-xs inline-flex items-center gap-1">
                        <Building2 className="w-3.5 h-3.5" />
                        {venue.courts.length} court{venue.courts.length === 1 ? '' : 's'}
                      </span>
                      <span className="owner-chip px-3 py-1 text-xs inline-flex items-center gap-1">
                        <CalendarCheck className="w-3.5 h-3.5" />
                        {venue.bookableCount} PickleBook
                      </span>
                      {venue.externalCount > 0 && (
                        <span className="owner-chip px-3 py-1 text-xs inline-flex items-center gap-1">
                          <ExternalLink className="w-3.5 h-3.5" />
                          {venue.externalCount} external
                        </span>
                      )}
                    </div>
                  </div>

                  <div className="divide-y divide-stone-100">
                    {venue.courts.map((court) => {
                      const externalOnly = court.bookingMode === 'ExternalOnly'
                      return (
                        <div key={court.id} className="p-4 flex flex-col sm:flex-row sm:items-center gap-4">
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div className="w-12 h-12 rounded-lg overflow-hidden bg-gray-100 shrink-0">
                              {court.images?.[0]?.imageUrl ? (
                                <img className="w-full h-full object-cover" src={court.images[0].imageUrl} alt={court.name} />
                              ) : (
                                <div className="w-full h-full flex items-center justify-center text-xs text-slate-400">No img</div>
                              )}
                            </div>
                            <div className="min-w-0">
                              <p className="font-semibold text-slate-900 truncate">{court.name}</p>
                              <div className="mt-1 flex flex-wrap items-center gap-2 text-xs text-slate-500">
                                <span>{court.type || 'Court'}</span>
                                <span>PHP {court.pricePerHour}/hr</span>
                                <span className={`px-2 py-0.5 rounded-full font-bold ${externalOnly ? 'bg-slate-100 text-slate-700' : 'bg-green-50 text-green-700'}`}>
                                  {externalOnly ? 'External only' : 'PickleBook booking'}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="flex sm:justify-end gap-2">
                            <button
                              onClick={() => navigate(`/owner/courts/${court.id}/edit`)}
                              className="owner-icon-btn p-2"
                              title="Edit"
                            >
                              <Pencil className="w-4 h-4" />
                            </button>
                            {!externalOnly && (
                              <button
                                onClick={() => navigate(`/owner/courts/${court.id}/bookings`)}
                                className="owner-icon-btn p-2"
                                title="View bookings"
                              >
                                <CalendarCheck className="w-4 h-4" />
                              </button>
                            )}
                            <button
                              onClick={() => handleDelete(court)}
                              disabled={deletingId === court.id}
                              className="owner-icon-btn p-2 hover:text-red-700 hover:bg-red-50 disabled:opacity-50 disabled:cursor-not-allowed"
                              title="Delete court"
                            >
                              <Trash2 className="w-4 h-4" />
                            </button>
                          </div>
                        </div>
                      )
                    })}
                  </div>
                </section>
              ))}
            </div>
          )}
        </main>
      </div>
    </div>
  )
}

export default OwnerCourtsPage
