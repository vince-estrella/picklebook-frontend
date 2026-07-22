import { useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Mail, Lock, ArrowRight, ArrowLeft, CalendarCheck, Users as UsersIcon } from 'lucide-react'
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
    <div className="min-h-screen w-full px-4 py-10 sm:px-8 sm:py-16 lg:px-12 relative bg-slate-50 flex flex-col justify-center items-center overflow-x-hidden">

      <div className="w-64 h-64 sm:w-96 sm:h-96 -left-20 top-0 absolute bg-green-300/20 rounded-full blur-[50px] pointer-events-none" />
      <div className="w-72 h-72 sm:w-[512px] sm:h-[506px] right-0 bottom-0 absolute bg-rose-200/10 rounded-full blur-3xl pointer-events-none" />

      <button
        type="button"
        onClick={() => navigate('/')}
        className="absolute left-4 top-4 sm:left-8 sm:top-8 z-10 flex items-center gap-1.5 text-neutral-600 text-sm font-semibold hover:text-green-800 transition-colors"
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
              <span className="text-white text-sm font-semibold uppercase leading-4 tracking-wider">Player Perks</span>
            </div>
            <p className="text-white text-3xl font-bold leading-10">
              Book courts in seconds, find local clubs, and track your game.
            </p>
            <div className="pt-2 flex flex-col gap-4">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md flex justify-center items-center shrink-0">
                  <CalendarCheck className="w-4 h-5 text-white" />
                </div>
                <span className="text-white text-base font-normal leading-6">Instant Court Reservations</span>
              </div>
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 bg-white/20 rounded-full backdrop-blur-md flex justify-center items-center shrink-0">
                  <UsersIcon className="w-6 h-3 text-white" />
                </div>
                <span className="text-white text-base font-normal leading-6">Connect with Players</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      <div className="w-full max-w-[672px] flex flex-col gap-5 sm:gap-6 relative z-10 mt-10 sm:mt-0">
        <div className="flex flex-col gap-1">
          <h1 className="text-center text-green-800 text-2xl sm:text-3xl font-bold leading-9 sm:leading-10">PickleBook</h1>
          <p className="text-center text-neutral-700 text-sm sm:text-base font-normal leading-6 px-2">
            Welcome back — log in to manage your bookings
          </p>
        </div>

        <div className="px-5 pt-8 pb-6 sm:px-8 sm:pt-10 sm:pb-8 bg-white/95 rounded-xl shadow-[0px_4px_20px_0px_rgba(15,23,42,0.05)] outline outline-1 outline-offset-[-1px] outline-slate-200 backdrop-blur-md flex flex-col gap-6">

          {/* Player / Owner role pill */}
          <div className="p-1 bg-gray-100 rounded-lg flex justify-between items-center">
            <button
              type="button"
              className="flex-1 px-3 sm:px-4 py-2 bg-white rounded-md shadow-sm text-center text-green-800 text-sm font-bold leading-4 tracking-wide"
            >
              Player
            </button>
            <button
              type="button"
              onClick={() => navigate('/owner/login')}
              className="flex-1 px-3 sm:px-4 py-2 text-center text-neutral-700 text-sm font-semibold leading-4 tracking-wide rounded-md"
            >
              Owner
            </button>
          </div>

          {/* Log In / Register tabs */}
          <div className="p-1 bg-gray-100 rounded-lg flex justify-between items-center">
            <button
              type="button"
              className="flex-1 px-3 sm:px-4 py-2 bg-white rounded-md shadow-sm text-center text-green-800 text-sm font-bold leading-4 tracking-wide"
            >
              Log In
            </button>
            <button
              type="button"
              onClick={() => navigate('/register')}
              className="flex-1 px-3 sm:px-4 py-2 text-center text-neutral-700 text-sm font-semibold leading-4 tracking-wide rounded-md"
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
                  placeholder="you@example.com"
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
          Don't have an account?{' '}
          <button
            type="button"
            onClick={() => navigate('/register')}
            className="text-green-800 font-normal hover:underline"
          >
            Register now
          </button>
        </p>
      </div>
    </div>
  )
}

export default PlayerLoginPage
