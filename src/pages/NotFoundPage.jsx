import { Link } from 'react-router-dom'
import Navbar from '../components/Navbar'

function NotFoundPage() {
  return (
    <div className="min-h-screen bg-gray-50">
      <Navbar />
      <div style={{ maxWidth: '520px', margin: '80px auto', padding: '0 24px', textAlign: 'center' }}>
        <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px' }}>Page Not Found</h1>
        <p style={{ color: '#6b7280', marginBottom: '32px' }}>
          The page you're looking for doesn't exist or may have moved.
        </p>
        <Link
          to="/"
          style={{ display: 'inline-block', padding: '12px 24px', borderRadius: '8px', fontWeight: '600', fontSize: '14px', border: 'none', background: '#16a34a', color: 'white', textDecoration: 'none' }}
        >
          Back to Home
        </Link>
      </div>
    </div>
  )
}

export default NotFoundPage
