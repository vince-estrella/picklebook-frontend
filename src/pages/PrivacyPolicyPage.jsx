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

const LAST_UPDATED = 'July 19, 2026'

const SECTIONS = [
  {
    id: 'overview',
    title: '1. Overview',
    body: [
      "PickleBook (\"we,\" \"our,\" or \"us\") provides a platform for finding, booking, and organizing pickleball court sessions. This Privacy Policy explains what information we collect, how we use it, and the choices you have.",
      'By creating an account or using PickleBook, you agree to the practices described here. If you don\u2019t agree with any part of this policy, please don\u2019t use the app.',
    ],
  },
  {
    id: 'information-we-collect',
    title: '2. Information We Collect',
    body: [
      'We collect information in a few different ways:',
    ],
    list: [
      'Account information — name, email address, phone number, and password when you register.',
      'Booking information — courts you book, dates and times, and related session details (including Queue Manager data like games played and status).',
      'Payment information — processed through our third-party payment provider; we do not store full card numbers on our servers.',
      'Support messages — content you send through our chat support feature, including which recipient (Admin/Developer or Court Owner) you contacted.',
      'Location information — general location or search area when you look for nearby courts, if you choose to share it.',
      'Device and usage information — IP address, browser type, and how you interact with the app, collected automatically.',
    ],
  },
  {
    id: 'how-we-use-information',
    title: '3. How We Use Your Information',
    list: [
      'To create and manage your account and bookings.',
      'To process payments and send booking confirmations.',
      'To respond to app issues you report through Facebook.',
      'To operate features like the Queue Manager, including tracking games played and match history.',
      'To improve the app, troubleshoot issues, and develop new features.',
      'To send important updates about your bookings or account — we don\u2019t send marketing emails unless you opt in.',
    ],
  },
  {
    id: 'sharing',
    title: '4. How We Share Information',
    body: [
      'We do not sell your personal information. We share it only in these situations:',
    ],
    list: [
      'With court owners, so they can manage bookings at their facility and respond to your support messages.',
      'With service providers who help us operate the app (e.g. payment processing, hosting), under confidentiality obligations.',
      'When required by law, such as in response to a valid legal request.',
      'In connection with a business transfer, such as a merger or acquisition, with notice to you where required.',
    ],
  },
  {
    id: 'cookies',
    title: '5. Cookies & Local Storage',
    body: [
      'PickleBook uses browser storage (cookies and local storage) to keep you signed in, remember your preferences, and support features like the Queue Manager, which currently saves session data locally on your device. You can clear this data at any time through your browser settings, though doing so may reset in-progress sessions.',
    ],
  },
  {
    id: 'data-security',
    title: '6. Data Security',
    body: [
      'We use reasonable technical and organizational measures to protect your information, including encrypted connections (HTTPS) and access controls on our systems. No method of transmission or storage is completely secure, so we can\u2019t guarantee absolute security.',
    ],
  },
  {
    id: 'data-retention',
    title: '7. Data Retention',
    body: [
      'We keep your account and booking information for as long as your account is active, and for a reasonable period afterward to comply with legal obligations, resolve disputes, and enforce our agreements. You can request deletion of your account at any time — see the Your Rights section below.',
    ],
  },
  {
    id: 'childrens-privacy',
    title: '8. Children\u2019s Privacy',
    body: [
      'PickleBook is not directed at children under 13, and we do not knowingly collect personal information from children under 13. If you believe a child has provided us with personal information, please contact us and we will take steps to delete it.',
    ],
  },
  {
    id: 'your-rights',
    title: '9. Your Rights & Choices',
    body: [
      'Depending on your location, you may have the right to access, correct, or delete your personal information, or to object to certain uses of it. To exercise any of these rights, reach out through the Contact Support page and select Admin / Developer — we\u2019ll respond as soon as we can.',
    ],
  },
  {
    id: 'changes',
    title: '10. Changes to This Policy',
    body: [
      `We may update this Privacy Policy from time to time. If we make material changes, we\u2019ll update the "Last updated" date below and, where appropriate, notify you directly.`,
    ],
  },
  {
    id: 'contact',
    title: '11. Contact Us',
    body: [
      'If you have questions about this Privacy Policy or how your information is handled, use the Contact Support page and message one of the listed team members on Facebook.',
    ],
  },
]

function PrivacyPolicyPage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .pp-link:hover { color: ${COLORS.chalk} !important; }
        .pp-toc-link:hover { color: ${COLORS.ink} !important; background: ${COLORS.chalkDim}; }
        @media (max-width: 900px) {
          .pp-grid { grid-template-columns: 1fr !important; }
          .pp-toc { display: none !important; }
        }
      `}</style>

      <Navbar />

      {/* ================= HEADER ================= */}
      <div style={{ background: COLORS.navy, padding: '56px 32px' }}>
        <div style={{ maxWidth: '900px', margin: '0 auto' }}>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', letterSpacing: '0.14em', textTransform: 'uppercase', color: COLORS.citron, margin: '0 0 8px' }}>
            Legal
          </p>
          <h1 style={{ fontFamily: "'Big Shoulders Display', sans-serif", fontWeight: 800, fontSize: 'clamp(32px, 4vw, 44px)', color: COLORS.chalk, margin: 0, textTransform: 'uppercase', lineHeight: 1 }}>
            Privacy Policy
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#7C8B85', marginTop: '14px' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px 70px' }}>
        <div className="pp-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px', alignItems: 'start' }}>

          {/* Table of contents */}
          <nav className="pp-toc" style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600, margin: '0 0 8px' }}>
              On this page
            </p>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="pp-toc-link"
                style={{ fontSize: '12.5px', color: COLORS.inkMute, textDecoration: 'none', padding: '5px 8px', borderRadius: '5px', transition: 'background 0.15s ease, color 0.15s ease' }}
              >
                {s.title}
              </a>
            ))}
          </nav>

          {/* Content */}
          <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '36px 40px' }}>
            <p style={{ fontSize: '14.5px', color: COLORS.inkMute, lineHeight: '1.7', margin: '0 0 32px' }}>
              This policy covers the personal information PickleBook collects, how we use it, and the choices you have. The
              details below (contact info, addresses) are placeholders — swap them for your real details if anything's out
              of date.
            </p>

            {SECTIONS.map((s, i) => (
              <section key={s.id} id={s.id} style={{ marginBottom: i === SECTIONS.length - 1 ? 0 : '30px', scrollMarginTop: '24px' }}>
                <h2 style={{ fontFamily: "'Big Shoulders Display', sans-serif", textTransform: 'uppercase', fontSize: '19px', color: COLORS.ink, margin: '0 0 10px' }}>
                  {s.title}
                </h2>
                {s.body?.map((p, idx) => (
                  <p key={idx} style={{ fontSize: '14.5px', color: '#3A4542', lineHeight: '1.75', margin: '0 0 10px' }}>
                    {p}
                  </p>
                ))}
                {s.list && (
                  <ul style={{ margin: '10px 0 0', paddingLeft: '20px', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    {s.list.map((item, idx) => (
                      <li key={idx} style={{ fontSize: '14.5px', color: '#3A4542', lineHeight: '1.7' }}>{item}</li>
                    ))}
                  </ul>
                )}
                {i < SECTIONS.length - 1 && (
                  <div style={{ borderBottom: `1px solid ${COLORS.chalkDim}`, marginTop: '30px' }} />
                )}
              </section>
            ))}
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
        <div style={{ display: 'flex', gap: '24px' }}>
          {[
            { label: 'Terms of Service', path: '/terms' },
            { label: 'Contact Support', path: '/contact' },
          ].map(link => (
            <span
              key={link.label}
              className="pp-link"
              tabIndex={0}
              role="button"
              onClick={() => navigate(link.path)}
              onKeyDown={e => { if (e.key === 'Enter') navigate(link.path) }}
              style={{ color: '#5B6864', fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s ease' }}
            >
              {link.label}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default PrivacyPolicyPage
