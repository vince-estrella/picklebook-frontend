import { useEffect, useState } from 'react'
import { X, Loader2, AlertCircle, Phone } from 'lucide-react'
import api from '../services/api'

// Formats "HH:MM" or "HH:MM:SS" (24hr) into "h:mm AM/PM"
function formatTime12h(time) {
  if (!time) return ''
  const [hStr, mStr] = time.split(':')
  let h = parseInt(hStr, 10)
  const period = h >= 12 ? 'PM' : 'AM'
  h = h % 12
  if (h === 0) h = 12
  return `${h}:${mStr} ${period}`
}

// Minutes between two "HH:MM:SS" (or "HH:MM") strings
function getDurationMinutes(start, end) {
  if (!start || !end) return 0
  const [sh, sm] = start.split(':').map(Number)
  const [eh, em] = end.split(':').map(Number)
  return (eh * 60 + em) - (sh * 60 + sm)
}

const STATUS_STYLES = {
  Confirmed: 'bg-green-100 text-green-800',
  Pending: 'bg-amber-100 text-amber-800',
  Cancelled: 'bg-red-100 text-red-700',
  Completed: 'bg-slate-200 text-slate-700',
}

// bookingId: which booking to load. onClose: closes the modal.
function BookingReceiptModal({ bookingId, onClose }) {
  const [booking, setBooking] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState(null)

  useEffect(() => {
    setLoading(true)
    setError(null)
    api.get(`/bookings/owner/${bookingId}`)
      .then(res => {
        setBooking(res.data)
        setLoading(false)
      })
      .catch(() => {
        setError('Could not load this booking.')
        setLoading(false)
      })
  }, [bookingId])

  const durationMinutes = booking ? getDurationMinutes(booking.startTime, booking.endTime) : 0

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/40"
      onClick={onClose}
    >
      <div
        onClick={e => e.stopPropagation()}
        className="w-full max-w-md bg-white rounded-2xl shadow-2xl overflow-hidden"
      >
        <div className="px-5 py-4 flex items-center justify-between bg-green-800">
          <p className="text-white text-sm font-semibold">Booking Receipt</p>
          <button onClick={onClose} className="text-white/80 hover:text-white transition-colors duration-150">
            <X className="w-4 h-4" />
          </button>
        </div>

        <div className="p-6">
          {loading ? (
            <div className="flex items-center justify-center gap-2 py-10 text-slate-500 text-sm">
              <Loader2 className="w-4 h-4 animate-spin" /> Loading...
            </div>
          ) : error ? (
            <div className="flex flex-col items-center gap-2 py-10 text-center">
              <AlertCircle className="w-5 h-5 text-amber-500" />
              <p className="text-slate-500 text-sm">{error}</p>
            </div>
          ) : (
            <div className="flex flex-col gap-5">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Booking ID</p>
                  <p className="text-green-700 font-bold text-base">{booking.bookingReference}</p>
                </div>
                <span className={`px-3 py-1 rounded-full text-xs font-bold ${STATUS_STYLES[booking.status] || 'bg-gray-100 text-gray-700'}`}>
                  {booking.status}
                </span>
              </div>

              <div className="pt-4 border-t border-stone-200">
                <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold mb-1">Booked By</p>
                <p className="text-slate-800 text-sm font-semibold">{booking.bookerName}</p>
                <p className="text-slate-500 text-sm inline-flex items-center gap-1 mt-0.5">
                  <Phone className="w-3.5 h-3.5" /> {booking.bookerPhone || '—'}
                </p>
              </div>

              <div className="grid grid-cols-2 gap-4 pt-4 border-t border-stone-200">
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Court</p>
                  <p className="text-slate-800 text-sm font-semibold">{booking.court?.name}</p>
                  <p className="text-slate-500 text-xs">{booking.court?.address}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Date</p>
                  <p className="text-slate-800 text-sm font-semibold">
                    {new Date(booking.date).toLocaleDateString('en-PH', { month: 'long', day: 'numeric', year: 'numeric', timeZone: 'Asia/Manila' })}
                  </p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Time</p>
                  <p className="text-slate-800 text-sm font-semibold">{formatTime12h(booking.startTime)} – {formatTime12h(booking.endTime)}</p>
                </div>
                <div>
                  <p className="text-slate-400 text-xs uppercase tracking-wide font-semibold">Duration</p>
                  <p className="text-slate-800 text-sm font-semibold">{durationMinutes} Mins</p>
                </div>
              </div>

              <div className="pt-4 border-t border-stone-200 flex flex-col gap-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Total Amount</span>
                  <span className="font-bold text-slate-800">₱{Number(booking.amount || 0).toFixed(2)}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Method</span>
                  <span className="font-medium text-slate-700">
                    {booking.paymentMethod === 'Online' ? 'Paid Online (Xendit)' : 'Pay at Venue'}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-500">Payment Status</span>
                  <span className={`font-semibold ${booking.paymentStatus === 'Paid' ? 'text-green-700' : 'text-amber-600'}`}>
                    {booking.paymentStatus}
                  </span>
                </div>
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

export default BookingReceiptModal
