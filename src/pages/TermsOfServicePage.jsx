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
    id: 'acceptance',
    title: '1. Acceptance of Terms',
    body: [
      'These Terms of Service ("Terms") govern your use of PickleBook, including our website, mobile experience, court booking system, and Queue Manager. By creating an account or using PickleBook, you agree to these Terms. If you don\u2019t agree, please don\u2019t use the app.',
    ],
  },
  {
    id: 'eligibility',
    title: '2. Eligibility & Accounts',
    body: [
      'You must be at least 13 years old to create a PickleBook account. You\u2019re responsible for keeping your login credentials secure and for all activity that happens under your account. Let us know right away if you suspect unauthorized access.',
    ],
  },
  {
    id: 'bookings',
    title: '3. Bookings & Cancellations',
    list: [
      'Booking a court reserves that time slot; availability is managed in real time but isn\u2019t guaranteed until you receive a confirmation.',
      'Cancellation windows, fees, and no-show policies are set by the individual court owner and shown at the time of booking.',
      'We may cancel or reschedule a booking if a court becomes unavailable (maintenance, weather, facility closure), and we\u2019ll notify you as soon as possible.',
      'Repeated no-shows or last-minute cancellations may result in booking restrictions on your account.',
    ],
  },
  {
    id: 'payments',
    title: '4. Fees & Payments',
    body: [
      'Court prices are set by each court owner and displayed before you confirm a booking. Payments are processed through our third-party payment provider. Refunds, where applicable, follow the cancellation policy of the specific court and are issued to your original payment method.',
    ],
  },
  {
    id: 'queue-manager',
    title: '5. Queue Manager & Open Play Sessions',
    body: [
      'The Queue Manager helps organizers run open play sessions — assigning players to courts, tracking games played, and rotating players fairly. Match generation uses randomization and fairness rules (like prioritizing players with fewer games played), but we don\u2019t guarantee a specific outcome or pairing on any given round. Session data for Queue Manager is currently stored locally on the organizer\u2019s device.',
    ],
  },
  {
    id: 'court-owners',
    title: '6. Court Owners',
    body: [
      'If you list a court on PickleBook as an owner or facility manager, you\u2019re responsible for keeping your court information, pricing, and availability accurate, and for responding to bookings and support messages in a timely manner. You\u2019re also responsible for the safety and condition of your facility.',
    ],
  },
  {
    id: 'conduct',
    title: '7. User Conduct',
    body: [
      'When using PickleBook, you agree not to:',
    ],
    list: [
      'Use the app for any unlawful purpose or in violation of these Terms.',
      'Interfere with or disrupt the app, its servers, or other users\u2019 sessions.',
      'Attempt to gain unauthorized access to accounts, courts, or systems that aren\u2019t yours.',
      'Harass, abuse, or send inappropriate content to other users, court owners, or our support team through the chat feature.',
      'Misrepresent your identity or impersonate someone else.',
    ],
  },
  {
    id: 'support-chat',
    title: '8. Support Chat',
    body: [
      'Messages sent through Contact Support (to Admin/Developer or a Court Owner) are used only to respond to your request and improve our support process. Please don\u2019t share sensitive information (like full payment card numbers) through chat.',
    ],
  },
  {
    id: 'intellectual-property',
    title: '9. Intellectual Property',
    body: [
      'PickleBook\u2019s name, logo, design, and app content are owned by us or our licensors and protected by intellectual property laws. You may not copy, modify, or distribute our branding or app content without permission.',
    ],
  },
  {
    id: 'disclaimers',
    title: '10. Disclaimers',
    body: [
      'PickleBook is provided "as is." We don\u2019t guarantee that court information, availability, or pricing set by owners is always accurate or up to date, and we\u2019re not responsible for the condition of any court or facility booked through the app.',
    ],
  },
  {
    id: 'liability',
    title: '11. Limitation of Liability',
    body: [
      'To the fullest extent permitted by law, PickleBook is not liable for indirect, incidental, or consequential damages arising from your use of the app, including missed bookings, court conditions, or injuries sustained while playing.',
    ],
  },
  {
    id: 'termination',
    title: '12. Termination',
    body: [
      'We may suspend or terminate your account if you violate these Terms, misuse the platform, or engage in behavior that harms other users, court owners, or PickleBook. You can also close your account at any time by contacting support.',
    ],
  },
  {
    id: 'changes',
    title: '13. Changes to These Terms',
    body: [
      `We may update these Terms from time to time. If we make material changes, we\u2019ll update the "Last updated" date below and, where appropriate, notify you directly. Continuing to use PickleBook after changes take effect means you accept the updated Terms.`,
    ],
  },
  {
    id: 'governing-law',
    title: '14. Governing Law',
    body: [
      'These Terms are governed by the laws of the Philippines, without regard to conflict-of-law principles. Any disputes will be handled in accordance with applicable local regulations.',
    ],
  },
  {
    id: 'contact',
    title: '15. Contact Us',
    body: [
      'Questions about these Terms? Reach us at support@picklebook.app, call 0976 316 9029, or use the chat on our Contact Support page.',
    ],
  },
]

function TermsOfServicePage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, fontFamily: "'Inter', sans-serif" }}>
      <style>{FONT_IMPORT}{`
        .tos-link:hover { color: ${COLORS.chalk} !important; }
        .tos-toc-link:hover { color: ${COLORS.ink} !important; background: ${COLORS.chalkDim}; }
        @media (max-width: 900px) {
          .tos-grid { grid-template-columns: 1fr !important; }
          .tos-toc { display: none !important; }
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
            Terms of Service
          </h1>
          <p style={{ fontFamily: "'JetBrains Mono', monospace", fontSize: '12px', color: '#7C8B85', marginTop: '14px' }}>
            Last updated: {LAST_UPDATED}
          </p>
        </div>
      </div>

      {/* ================= BODY ================= */}
      <div style={{ maxWidth: '900px', margin: '0 auto', padding: '40px 32px 70px' }}>
        <div className="tos-grid" style={{ display: 'grid', gridTemplateColumns: '200px 1fr', gap: '40px', alignItems: 'start' }}>

          {/* Table of contents */}
          <nav className="tos-toc" style={{ position: 'sticky', top: '24px', display: 'flex', flexDirection: 'column', gap: '2px' }}>
            <p style={{ fontSize: '11px', letterSpacing: '0.08em', textTransform: 'uppercase', color: COLORS.inkMute, fontWeight: 600, margin: '0 0 8px' }}>
              On this page
            </p>
            {SECTIONS.map(s => (
              <a
                key={s.id}
                href={`#${s.id}`}
                className="tos-toc-link"
                style={{ fontSize: '12.5px', color: COLORS.inkMute, textDecoration: 'none', padding: '5px 8px', borderRadius: '5px', transition: 'background 0.15s ease, color 0.15s ease' }}
              >
                {s.title}
              </a>
            ))}
          </nav>

          {/* Content */}
          <div style={{ background: '#fff', borderRadius: '10px', border: `1px solid ${COLORS.chalkDim}`, padding: '36px 40px' }}>
            <p style={{ fontSize: '14.5px', color: COLORS.inkMute, lineHeight: '1.7', margin: '0 0 32px' }}>
              These Terms cover how PickleBook works, what\u2019s expected of players and court owners, and the rules
              around bookings, payments, and the Queue Manager. Placeholder details (contact info, governing law) should
              be swapped for your real details before this goes live.
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
            { label: 'Privacy Policy', path: '/privacy-policy' },
            { label: 'Contact Support', path: '/contact' },
          ].map(link => (
            <span
              key={link.label}
              className="tos-link"
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

export default TermsOfServicePage
