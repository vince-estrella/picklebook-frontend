    import { useState } from 'react'
    import { useNavigate } from 'react-router-dom'
    import api from '../services/api'

    function PlayerLoginPage() {
    const navigate = useNavigate()
    const [form, setForm] = useState({ email: '', password: '' })
    const [error, setError] = useState(null)
    const [loading, setLoading] = useState(false)

    const handleLogin = async () => {
        if (!form.email || !form.password) {
        setError('Please fill in all fields.')
        return
        }
        setLoading(true)
        setError(null)
        try {
        const res = await api.post('/users/login', form)
        localStorage.setItem('playerToken', res.data.token)
        localStorage.setItem('player', JSON.stringify({
            id: res.data.id,
            firstName: res.data.firstName,
            lastName: res.data.lastName,
            email: res.data.email,
            phone: res.data.phone,
        }))
        navigate('/my-bookings')
        } catch {
        setError('Invalid email or password.')
        } finally {
        setLoading(false)
        }
    }

    return (
        <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', padding: '48px', background: '#fafafa' }}>
        <div style={{ width: '100%', maxWidth: '380px' }}>
            <h1 style={{ fontSize: '28px', fontWeight: '700', marginBottom: '8px', textAlign: 'center' }}>Log In</h1>
            <p style={{ color: '#6b7280', marginBottom: '32px', fontSize: '14px', textAlign: 'center' }}>Skip retyping your info and see your bookings.</p>

            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Email Address</label>
            <input
            type="email"
            placeholder="you@example.com"
            value={form.email}
            onChange={e => setForm({ ...form, email: e.target.value })}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', marginBottom: '16px', boxSizing: 'border-box' }}
            />

            <label style={{ fontSize: '13px', fontWeight: '600', color: '#374151', display: 'block', marginBottom: '4px' }}>Password</label>
            <input
            type="password"
            placeholder="••••••••"
            value={form.password}
            onChange={e => setForm({ ...form, password: e.target.value })}
            onKeyDown={e => e.key === 'Enter' && handleLogin()}
            style={{ width: '100%', border: '1px solid #e5e7eb', borderRadius: '8px', padding: '10px 12px', fontSize: '14px', marginBottom: '24px', boxSizing: 'border-box' }}
            />

            {error && <p style={{ color: '#dc2626', fontSize: '13px', marginBottom: '16px' }}>{error}</p>}

            <button
            onClick={handleLogin}
            disabled={loading}
            style={{ width: '100%', padding: '12px', borderRadius: '8px', fontWeight: '600', fontSize: '15px', border: 'none', background: '#16a34a', color: 'white', cursor: loading ? 'not-allowed' : 'pointer' }}
            >
            {loading ? 'Logging in...' : 'Log In →'}
            </button>

            <p style={{ textAlign: 'center', fontSize: '13px', color: '#6b7280', marginTop: '20px' }}>
            Don't have an account?{' '}
            <span onClick={() => navigate('/register')} style={{ color: '#16a34a', fontWeight: '600', cursor: 'pointer' }}>
                Register
            </span>
            </p>
        </div>
        </div>
    )
    }

    export default PlayerLoginPage