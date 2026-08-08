import { FaFacebookF } from 'react-icons/fa'
import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const FONT_IMPORT = `
  @import url('https://fonts.googleapis.com/css2?family=Big+Shoulders+Display:wght@600;700;800&family=Inter:wght@400;500;600;700&family=JetBrains+Mono:wght@500;600&display=swap');
`

const FACEBOOK_PAGE_URL = 'https://www.facebook.com/profile.php?id=61592426682111'

function ContactSupportPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}</style>
      <Navbar />

      <div style={{ background: COLORS.navy, padding: '48px 32px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            App support
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 4vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
            Contact Support
          </h1>
          <p style={{ color: '#A9B7B2', fontSize: '15px', marginTop: '10px', maxWidth: '560px', lineHeight: 1.6 }}>
            For PickleBook app issues, bookings, court listings, or account questions, message our official Facebook page.
          </p>
        </div>
      </div>

      <main style={{ maxWidth: '760px', margin: '0 auto', padding: '28px 32px 60px' }}>
        <section style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '28px', display: 'flex', flexDirection: 'column', gap: '18px' }}>
          <div>
            <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '20px', margin: '0 0 8px', color: COLORS.ink }}>
              Message Picklebook
            </h2>
            <p style={{ margin: 0, fontSize: '14px', color: COLORS.inkMute, lineHeight: 1.6 }}>
              Send a short description of the issue, what page you were using, and a screenshot if you have one. We will reply through Messenger.
            </p>
          </div>

          <div style={{ border: `1px solid ${COLORS.chalkDim}`, borderRadius: '10px', padding: '18px', display: 'flex', alignItems: 'center', justifyContent: 'space-between', gap: '18px', background: COLORS.chalk, flexWrap: 'wrap' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <div style={{ width: '44px', height: '44px', borderRadius: '10px', background: COLORS.navy, color: COLORS.chalk, display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                <FaFacebookF size={18} />
              </div>
              <div>
                <p style={{ fontSize: '16px', color: COLORS.ink, fontWeight: 800, margin: 0 }}>Picklebook Facebook Page</p>
                <p style={{ fontSize: '13px', color: COLORS.inkMute, margin: '4px 0 0' }}>Official support and updates</p>
              </div>
            </div>
            <a
              href={FACEBOOK_PAGE_URL}
              target="_blank"
              rel="noopener noreferrer"
              style={{ background: COLORS.citron, color: COLORS.navyDeep, borderRadius: '8px', padding: '12px 18px', fontWeight: 800, fontSize: '14px', textDecoration: 'none', display: 'inline-flex', alignItems: 'center', gap: '8px' }}
            >
              <FaFacebookF size={14} />
              Message Page
            </a>
          </div>
        </section>
      </main>

      <footer style={{ background: COLORS.navyDeep, padding: '28px 32px' }}>
        <div style={{ maxWidth: '760px', margin: '0 auto' }}>
          <p
            onClick={() => navigate('/')}
            style={{ color: COLORS.chalk, fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 700, fontSize: '18px', margin: 0, letterSpacing: '0.02em', cursor: 'pointer' }}
          >
            PICKLEBOOK
          </p>
          <p style={{ color: '#A9B7B2', fontSize: '12px', margin: '4px 0 0' }}>Court discovery and booking support.</p>
        </div>
      </footer>
    </div>
  )
}

export default ContactSupportPage
