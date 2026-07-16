import {
  FaSearch,
  FaBolt,
  FaHistory
} from 'react-icons/fa'

import { MdOutlineEventAvailable } from 'react-icons/md'

import { useNavigate } from 'react-router-dom'
import Navbar from '../components/Navbar'

const COLORS = {
  primary: '#16a34a',
  primaryHover: '#15803d',
  outline: '#ffffff',
  outlineHover: '#f3f4f6',
}

function HomePage() {
  const navigate = useNavigate()

  return (
    <div style={{ minHeight: '100vh', background: '#fafafa' }}>
      <Navbar />

      {/* Hero Section */}
      <div style={{ maxWidth: '1024px', margin: '0 auto', padding: '80px 32px 60px', display: 'flex', alignItems: 'center', gap: '48px' }}>
        
        {/* Left: Text */}
        <div style={{ flex: 1 }}>
          <h1 style={{ fontSize: '48px', fontWeight: '800', lineHeight: '1.1', marginBottom: '16px', color: '#111827' }}>
            Book Your Court<br />
            <span style={{ color: '#16a34a' }}>In Seconds.</span>
          </h1>
          <p style={{ fontSize: '16px', color: '#6b7280', lineHeight: '1.7', marginBottom: '32px', maxWidth: '420px' }}>
            The high-performance platform for pickleball players. Real-time court availability, instant booking, and effortless schedule management. No fluff, just play.
          </p>
          <div style={{ display: 'flex', gap: '12px' }}>
            <button
              onClick={() => navigate('/courts')}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.primaryHover}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
              style={{ background: COLORS.primary, color: 'white', border: 'none', borderRadius: '8px', padding: '14px 28px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'background 0.15s ease' }}
            >
             <>
  <FaSearch style={{ marginRight: '8px' }} />
  Find Courts
</>
            </button>
            <button
              onClick={() => navigate('/courts')}
              onMouseEnter={e => e.currentTarget.style.background = COLORS.outlineHover}
              onMouseLeave={e => e.currentTarget.style.background = COLORS.outline}
              style={{ background: COLORS.outline, color: '#374151', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '14px 28px', fontWeight: '600', fontSize: '15px', cursor: 'pointer', transition: 'background 0.15s ease' }}
            >
              Book Now
            </button>
          </div>

          {/* Stats */}
          <div style={{ display: 'flex', gap: '32px', marginTop: '48px' }}>
            {[
              { value: '3+', label: 'Active Courts' },
              { value: '100%', label: 'Real-time' },
              { value: 'Free', label: 'To Browse' },
            ].map(stat => (
              <div key={stat.label}>
                <p style={{ fontSize: '24px', fontWeight: '700', color: '#111827', margin: 0 }}>{stat.value}</p>
                <p style={{ fontSize: '13px', color: '#9ca3af', margin: '2px 0 0' }}>{stat.label}</p>
              </div>
            ))}
          </div>
        </div>

        {/* Right: Image */}
        <div style={{ flex: 1, borderRadius: '16px', overflow: 'hidden', height: '360px', background: '#e5e7eb' }}>
          <img
            src="https://res.cloudinary.com/graham-media-group/image/upload/f_auto/q_auto/c_scale,w_640/v1/media/gmg/K475EAGIMRDPVJAUVCTSLLA55A?_a=DAJHqpDbZAAA"
            alt="Pickleball court"
            style={{ width: '100%', height: '100%', objectFit: 'cover' }}
          />
        </div>
      </div>

      {/* Features Section */}
      <div style={{ background: '#f9fafb', padding: '60px 32px' }}>
        <div style={{ maxWidth: '1024px', margin: '0 auto' }}>
          <h2 style={{ fontSize: '28px', fontWeight: '700', textAlign: 'center', marginBottom: '8px' }}>Precision Performance Tools</h2>
          <p style={{ color: '#6b7280', textAlign: 'center', marginBottom: '40px', fontSize: '15px' }}>
            Stripped down to the essentials. Everything you need to manage your game, nothing you don't.
          </p>
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '20px' }}>
            {[
  {
    icon: <FaBolt color="#16a34a" />,
    title: 'Easy Booking',
    desc: 'A streamlined checkout flow designed for speed. Select your time, confirm, and you\'re ready to hit the court.'
  },
  {
    icon: <MdOutlineEventAvailable color="#16a34a" />,
    title: 'Real-Time Availability',
    desc: 'Live syncing with facility calendars. Never worry about double bookings or outdated schedules.'
  },
  {
    icon: <FaHistory color="#16a34a" />,
    title: 'Booking History',
    desc: 'Access your past sessions and upcoming games in one place.'
  }
].map(f => (
              <div key={f.title} style={{ background: 'white', border: '1px solid #e5e7eb', borderRadius: '12px', padding: '24px' }}>
             <div
  style={{
    width: '56px',
    height: '56px',
    borderRadius: '14px',
    background: '#f0fdf4',
    display: 'flex',
    alignItems: 'center',
    justifyContent: 'center',
    fontSize: '24px',
    marginBottom: '18px'
  }}
>
  {f.icon}
</div>
                <h3 style={{ fontWeight: '700', fontSize: '16px', marginBottom: '8px' }}>{f.title}</h3>
                <p style={{ color: '#6b7280', fontSize: '14px', lineHeight: '1.6', margin: 0 }}>{f.desc}</p>
              </div>
            ))}
          </div>
        </div>
      </div>

      {/* CTA Section */}
      <div style={{ background: '#1a1a1a', padding: '60px 32px', textAlign: 'center' }}>
        <h2 style={{ fontSize: '28px', fontWeight: '700', color: 'white', marginBottom: '12px' }}>Ready to secure your court?</h2>
        <p style={{ color: '#9ca3af', marginBottom: '28px', fontSize: '15px' }}>
          Join the high-performance pickleball community today. Simple, fast, and reliable.
        </p>
        <button
  onClick={() => navigate('/courts')}
  onMouseEnter={e => e.currentTarget.style.background = COLORS.primaryHover}
  onMouseLeave={e => e.currentTarget.style.background = COLORS.primary}
  style={{
    background: COLORS.primary,
    color: 'white',
    border: 'none',
    borderRadius: '8px',
    padding: '14px 28px',
    fontWeight: '600',
    fontSize: '15px',
    cursor: 'pointer',
    display: 'flex',
    alignItems: 'center',
    gap: '8px',
    margin: '0 auto',
    transition: 'background 0.15s ease'
  }}
>
  <FaSearch />
  Find Courts
</button>
      </div>

      {/* Footer */}
      <div style={{ background: '#111827', padding: '24px 32px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
        <div>
          <p style={{ color: 'white', fontWeight: '700', fontSize: '16px', margin: 0 }}>PickleBook</p>
          <p style={{ color: '#6b7280', fontSize: '12px', margin: '4px 0 0' }}>High-performance court management.</p>
        </div>
        <div style={{ display: 'flex', gap: '24px' }}>
          {['Privacy Policy', 'Terms of Service', 'Contact Support'].map(link => (
            <span
              key={link}
              onMouseEnter={e => e.currentTarget.style.color = '#ffffff'}
              onMouseLeave={e => e.currentTarget.style.color = '#6b7280'}
              style={{ color: '#6b7280', fontSize: '13px', cursor: 'pointer', transition: 'color 0.15s ease' }}
            >
              {link}
            </span>
          ))}
        </div>
      </div>
    </div>
  )
}

export default HomePage
