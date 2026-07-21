import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ArrowLeft, BarChart3, Building2 } from 'lucide-react'
import api from '../services/api'

function OwnerLoginPage() {
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
      const res = await api.post('/courtowners/login', form)
      localStorage.setItem('token', res.data.token)
      localStorage.setItem('owner', JSON.stringify({
        id: res.data.id,
        firstName: res.data.firstName,
        lastName: res.data.lastName,
        email: res.data.email,
      }))
      navigate('/owner/dashboard')
    } catch {
      setError('Invalid email or password.')
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="min-h-screen w-full px-12 py-16 relative bg-slate-50 flex flex-col justify-center items-center overflow-hidden">

      <div className="w-96 h-96 -left-20 top-0 absolute bg-green-300/20 rounded-full blur-[50px] pointer-events-none" />
      <div className="w-[512px] h-[506px] right-0 bottom-0 absolute bg-rose-200/10 rounded-full blur-3xl pointer-events-none" />

      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute left-8 top-8 z-10 flex items-center gap-1.5 text-neutral-600 text-sm font-semibold hover:text-green-800 transition-colors"
      >
        <ArrowLeft className="w-4 h-4" />
        Back to Home
      </button>

      <div className="hidden lg:flex w-96 h-full absolute right-0 top-0 flex-col justify-center overflow-hidden">
        <div className="flex-1 relative flex flex-col justify-center">
          <img className="flex-1 w-full h-full object-cover" src="https://placehold.co/427x1013" alt="" />
          <div className="w-96 h-full absolute inset-0 bg-gradient-to-l from-green-800/0 to-green-800/20" />
          <div className="absolute left-12 bottom-24 pr-8 flex flex-col gap-2">
            <div className="flex items-center gap-2">
              <span className="w-5 h-5 bg-green-300 rounded-sm" />
              <span className="text-white text-sm font-semibold uppercase leading-4 tracking-wider">Owner Perks</span>
            </div>
            <p className="text-white text-3xl font-bold leading-10">
              Manage your courts, track bookings, and grow your facility.
            </p>
            <div className="pt-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md flex justify-center items-center shrink-0">
                  <Building2 className="w-4 h-5 text-white" />
                </div>
                <span className="text-white text-base font-normal leading-6">Manage Your Facilities</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md flex justify-center items-center shrink-0">
                  <BarChart3 className="w-4 h-5 text-white" />
                </div>
                <span className="text-white text-base font-normal leading-6">Track Performance</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[672px] flex flex-col gap-6 relative z-10">
        <div className="flex flex-col gap-1">
          <h1 className="text-center text-green-800 text-3xl font-bold leading-10">PickleBook</h1>
          <p className="text-center text-neutral-700 text-base font-normal leading-6">
            Welcome back — log in to manage your courts
          </p>
        </div>

        <div className="px-8 pt-10 pb-8 bg-white/95 rounded-xl shadow-[0px_4px_20px_0px_rgba(15,23,42,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200 backdrop-blur-md flex flex-col gap-6">

          {/* Player / Owner role pill */}
          <div className="p-1 bg-gray-100 rounded-lg flex justify-between items-center">
            <button
              type="button"
              onClick={() => navigate('/login')}
              className="flex-1 px-4 py-2 text-center text-neutral-700 text-sm font-semibold leading-4 tracking-wide rounded-md"
            >
              Player
            </button>
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-white rounded-md shadow-sm text-center text-green-800 text-sm font-bold leading-4 tracking-wide"
            >
              Owner
            </button>
          </div>

          {/* Log In / Register tabs */}
          <div className="p-1 bg-gray-100 rounded-lg flex justify-between items-center">
            <button
              type="button"
              className="flex-1 px-4 py-2 bg-white rounded-md shadow-sm text-center text-green-800 text-sm font-bold leading-4 tracking-wide"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => navigate('/owner/register')}
              className="flex-1 px-4 py-2 text-center text-neutral-700 text-sm font-semibold leading-4 tracking-wide rounded-md"
            >
              Register
            </button>
          </div>

          <div className="flex flex-col gap-4">
            <div className="pt-1 flex flex-col gap-2">
              <label className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Email Address</label>
              <div className="relative flex flex-col">
                <Mail className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="email"
                  placeholder="name@facility.com"
                  value={form.email}
                  onChange={e => setForm({ ...form, email: e.target.value })}
                  className="pl-10 pr-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-base font-normal text-slate-800 placeholder:text-gray-400 focus:outline-green-700 focus:outline-2"
                />
              </div>
            </div>

            <div className="pt-1 flex flex-col gap-2">
              <label className="text-slate-800 text-sm font-semibold leading-4 tracking-wide">Password</label>
              <div className="relative flex flex-col">
                <Lock className="w-4 h-4 text-stone-400 absolute left-3 top-1/2 -translate-y-1/2" />
                <input
                  type="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={e => setForm({ ...form, password: e.target.value })}
                  onKeyDown={e => e.key === 'Enter' && handleLogin()}
                  className="pl-10 pr-4 py-3 bg-white rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-base font-normal text-slate-800 placeholder:text-gray-400 focus:outline-green-700 focus:outline-2"
                />
              </div>
            </div>

            {error && (
              <p className="text-red-600 text-sm font-normal leading-5">{error}</p>
            )}

            <button
              type="button"
              onClick={handleLogin}
              disabled={loading}
              className="py-4 bg-green-800 hover:bg-green-900 disabled:opacity-70 disabled:cursor-not-allowed rounded-xl shadow-lg flex justify-center items-center gap-2 text-white text-sm font-semibold leading-4 tracking-wide transition-colors"
            >
              {loading ? 'Logging in...' : 'Log In'}
              {!loading && <ArrowRight className="w-4 h-4" />}
            </button>
          </div>
        </div>

        <p className="text-center text-neutral-700 text-sm font-normal leading-5">
          Don't have a facility account?{' '}
          <button
            type="button"
            onClick={() => navigate('/owner/register')}
            className="text-green-800 font-normal hover:underline"
          >
            Register now
          </button>
        </p>
      </div>
    </div>
  )
}

export default OwnerLoginPage
