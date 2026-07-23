import {
  FaEnvelope,
  FaPhoneAlt,
  FaMapMarkerAlt,
  FaClock,
  FaInstagram,
  FaFacebookF,
} from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

// ---------------------------------------------------------------------------
// Shared design tokens (match HomePage / QueueManager)
// ---------------------------------------------------------------------------
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

// ---------------------------------------------------------------------------
// Placeholder org info — swap these for your real details.
// ---------------------------------------------------------------------------
const CONTACT_INFO = [
  { icon: FaEnvelope, label: 'Email', value: 'support@picklebook.app', href: 'mailto:support@picklebook.app' },
  { icon: FaPhoneAlt, label: 'Phone', value: '0976 316 9029', href: 'tel:+639763169029' },
  { icon: FaMapMarkerAlt, label: 'Address', value: 'N. Bacalso Avenue, Cebu City, 6000 Cebu, Philippines' },
  { icon: FaClock, label: 'Hours', value: 'Mon – Sun, 7:00 AM – 9:00 PM' },
]

const SOCIALS = [
  { icon: FaInstagram, label: 'Instagram', href: 'https://instagram.com' },
  { icon: FaFacebookF, label: 'Facebook', href: 'https://facebook.com' },
]

function ContactSupportPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .cs-btn:focus-visible { outline: 2px solid ${COLORS.citron}; outline-offset: 2px; }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div style={{ background: COLORS.navy, padding: '48px 32px' }}>
        <div style={{ maxWidth: '720px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            We're here to help
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 4vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
            Contact Support
          </h1>
          <p style={{ color: '#A9B7B2', fontSize: '15px', marginTop: '10px', maxWidth: '520px' }}>
            Reach out to us using any of the details below.
          </p>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div style={{ maxWidth: '720px', margin: '0 auto', padding: '28px 32px 60px' }}>
        <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
          <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '22px' }}>
            <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '18px', margin: '0 0 16px', color: COLORS.ink }}>
              Get in Touch
            </h2>
            <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
              {CONTACT_INFO.map(({ icon: Icon, label, value, href }) => (
                <div key={label} style={{ display: 'flex', gap: '12px', alignItems: 'flex-start' }}>
                  <div style={{
                    width: '36px', height: '36px', borderRadius: '50%', flexShrink: 0,
                    border: `1.5px solid ${COLORS.citron}`, display: 'flex', alignItems: 'center', justifyContent: 'center',
                  }}>
                    <Icon size={14} color={COLORS.navy} />
                  </div>
                  <div>
                    <p style={{ margin: 0, fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>{label}</p>
                    {href ? (
                      <a href={href} style={{ fontSize: '14px', color: COLORS.ink, fontWeight: 600, textDecoration: 'none' }}>{value}</a>
                    ) : (
                      <p style={{ margin: '2px 0 0', fontSize: '14px', color: COLORS.ink, fontWeight: 600 }}>{value}</p>
                    )}
                  </div>
                </div>
              ))}
            </div>

            <div style={{ borderTop: `1px solid ${COLORS.chalkDim}`, marginTop: '20px', paddingTop: '16px' }}>
              <p style={{ margin: '0 0 10px', fontSize: '11px', letterSpacing: '0.06em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600 }}>Follow us</p>
              <div style={{ display: 'flex', gap: '10px' }}>
                {SOCIALS.map(({ icon: Icon, label, href }) => (
                  <a
                    key={label}
                    href={href}
                    target="_blank"
                    rel="noreferrer"
                    title={label}
                    style={{
                      width: '34px', height: '34px', borderRadius: '50%', background: COLORS.chalk,
                      display: 'flex', alignItems: 'center', justifyContent: 'center', color: COLORS.ink,
                    }}
                  >
                    <Icon size={13} />
                  </a>
                ))}
              </div>
            </div>
          </div>

          <div style={{ background: COLORS.navy, borderRadius: '10px', padding: '20px 22px' }}>
            <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
              Response time
            </p>
            <p style={{ color: COLORS.chalk, fontSize: '13.5px', lineHeight: '1.6', margin: 0 }}>
              We typically reply within 24 hours. For urgent day-of court issues, please call us directly
              at the number above for the fastest response.
            </p>
          </div>
        </div>
      </div>

      {/* ================= FOOTER ================= */}
      <div style={{ background: COLORS.navyDeep, padding: '28px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
        <div>
          <p
            onClick={() => navigate('/')}
            style={{ color: COLORS.chalk, fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 700, fontSize: '18px', margin: 0, letterSpacing: '0.02em', cursor: 'pointer' }}
          >
            PICKLEBOOK
          </p>
          <p style={{ color: '#5B6864', fontSize: '12px', margin: '4px 0 0' }}>High-performance court management.</p>
        </div>
      </div>
    </div>
  )
}

export default ContactSupportPage
