import { useState } from 'react'
import { useParams, useNavigate, useLocation } from 'react-router-dom'
import { Flag, ChevronLeft, AlertTriangle, Check } from 'lucide-react'
import Navbar from '../components/Navbar'
import api from '../services/api'

// ── Design tokens — shared with CourtDetailPage / HomePage / QueueManager ──
const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  citronHover: '#C3CC1F',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

const headingStyle = { fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase' }

const REPORT_REASONS = [
  { value: 'INACCURATE', label: 'Inaccurate listing details', body: 'Photos, price, hours, or amenities don\u2019t match reality.' },
  { value: 'UNSAFE', label: 'Safety or maintenance issue', body: 'Damaged surface, broken nets, poor lighting, etc.' },
  { value: 'SCAM', label: 'Suspicious or scam listing', body: 'Requests for payment outside the app, fake availability.' },
  { value: 'INAPPROPRIATE', label: 'Inappropriate content', body: 'Offensive photos or descriptions.' },
  { value: 'DUPLICATE', label: 'Duplicate listing', body: 'This court already exists elsewhere on PickleBook.' },
  { value: 'OTHER', label: 'Something else', body: 'Tell us more in the details box below.' },
]

function ReportListingPage() {
  const { id } = useParams()
  const navigate = useNavigate()
  const location = useLocation()
  const court = location.state?.court || null

  const [reason, setReason] = useState('')
  const [details, setDetails] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [error, setError] = useState('')
  const [submitted, setSubmitted] = useState(false)

  const handleSubmit = async () => {
    if (!reason) {
      setError('Please select a reason for your report.')
      return
    }
    setError('')
    setSubmitting(true)
    try {
      await api.post(`/courts/${id}/report`, { reason, details })
      setSubmitted(true)
      // Give the confirmation a moment to register before routing the
      // report over to the owner-facing dashboard, where it will surface
      // in Notifications / Live activity for review.
      setTimeout(() => {
        navigate('/owner/dashboard', { state: { reportedCourtId: id } })
      }, 1500)
    } catch (e) {
      setError('Something went wrong submitting your report. Please try again.')
    } finally {
      setSubmitting(false)
    }
  }

  return (
    <div className="min-h-screen" style={{ background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .rl-back:hover { color: ${COLORS.navyDeep} !important; }
        .rl-reason:hover { outline-color: ${COLORS.teal} !important; background: #F5F7F3; }
        .rl-submit:not(:disabled):hover { background: ${COLORS.citronHover} !important; }
        .rl-submit:not(:disabled):active { transform: scale(0.98); }
        textarea:focus { outline-color: ${COLORS.teal} !important; }
      `}</style>
      <Navbar />

      <div className="max-w-2xl mx-auto px-6 md:px-12 py-8 flex flex-col gap-6">

        <button
          onClick={() => navigate(-1)}
          className="rl-back inline-flex items-center gap-1 text-sm font-semibold w-fit transition-colors duration-150"
          style={{ color: COLORS.navy }}
        >
          <ChevronLeft size={16} /> Back to listing
        </button>

        {submitted ? (
          <div className="p-8 rounded-2xl flex flex-col items-center text-center gap-3" style={{ background: '#fff', outline: `1px solid ${COLORS.chalkDim}` }}>
            <div className="w-14 h-14 rounded-full flex items-center justify-center" style={{ background: '#E7EEE9' }}>
              <Check size={26} style={{ color: COLORS.teal }} />
            </div>
            <h1 className="text-2xl" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 700 }}>Report submitted</h1>
            <p className="text-base" style={{ color: COLORS.inkMute }}>
              Thanks for flagging this. We're sending you to the dashboard where our team tracks reported listings.
            </p>
          </div>
        ) : (
          <>
            <div className="flex flex-col gap-2">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-full flex items-center justify-center shrink-0" style={{ background: '#FBEDEC' }}>
                  <Flag size={18} style={{ color: '#B3453D' }} />
                </div>
                <h1 className="text-3xl leading-tight" style={{ ...headingStyle, color: COLORS.ink, fontWeight: 800 }}>Report listing</h1>
              </div>
              {court && (
                <p className="text-base" style={{ color: COLORS.inkMute }}>
                  You're reporting <span style={{ color: COLORS.ink, fontWeight: 600 }}>{court.name}</span>
                  {court.address ? ` \u2014 ${court.address}` : ''}.
                </p>
              )}
            </div>

            <div className="p-4 rounded-xl flex items-start gap-3" style={{ background: '#FBFAD9', outline: `1px solid ${COLORS.citron}` }}>
              <AlertTriangle size={18} className="shrink-0 mt-0.5" style={{ color: COLORS.navyDeep }} />
              <p className="text-sm" style={{ color: COLORS.navyDeep }}>
                Reports are reviewed by our team. Please don't use this to dispute a booking \u2014 use "Message Owner" for that instead.
              </p>
            </div>

            <div className="flex flex-col gap-3">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.ink }}>What's the issue?</span>
              <div className="flex flex-col gap-2">
                {REPORT_REASONS.map(r => (
                  <button
                    key={r.value}
                    onClick={() => setReason(r.value)}
                    className="rl-reason text-left p-4 rounded-xl flex items-start gap-3 transition-all duration-150"
                    style={
                      reason === r.value
                        ? { background: '#F5F7F3', outline: `2px solid ${COLORS.teal}` }
                        : { background: '#fff', outline: `1px solid ${COLORS.chalkDim}` }
                    }
                  >
                    <div
                      className="w-4 h-4 rounded-full mt-0.5 shrink-0 flex items-center justify-center"
                      style={{ outline: `2px solid ${reason === r.value ? COLORS.teal : COLORS.chalkDim}` }}
                    >
                      {reason === r.value && <div className="w-2 h-2 rounded-full" style={{ background: COLORS.teal }} />}
                    </div>
                    <div>
                      <p className="text-base font-semibold" style={{ color: COLORS.ink }}>{r.label}</p>
                      <p className="text-sm" style={{ color: COLORS.inkMute }}>{r.body}</p>
                    </div>
                  </button>
                ))}
              </div>
            </div>

            <div className="flex flex-col gap-2">
              <span className="text-xs font-medium uppercase tracking-wide" style={{ color: COLORS.ink }}>Additional details (optional)</span>
              <textarea
                value={details}
                onChange={e => setDetails(e.target.value)}
                rows={4}
                placeholder="Add any extra context that might help our team review this listing..."
                className="w-full p-3 rounded-xl text-base resize-none transition-colors duration-150"
                style={{ outline: `1px solid ${COLORS.chalkDim}`, color: COLORS.ink, background: '#fff' }}
              />
            </div>

            {error && (
              <p className="text-sm font-medium" style={{ color: '#B3453D' }}>{error}</p>
            )}

            <button
              disabled={submitting}
              onClick={handleSubmit}
              className="rl-submit w-full py-3 rounded-xl font-semibold text-base transition-all duration-150"
              style={{
                background: submitting ? COLORS.chalkDim : COLORS.citron,
                color: submitting ? '#93A29C' : COLORS.navyDeep,
                cursor: submitting ? 'not-allowed' : 'pointer',
                boxShadow: submitting ? 'none' : '0 10px 25px rgba(11,42,56,0.15)',
              }}
            >
              {submitting ? 'Submitting...' : 'Submit report'}
            </button>
          </>
        )}
      </div>
    </div>
  )
}

export default ReportListingPage
