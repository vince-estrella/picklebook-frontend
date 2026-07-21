import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { AlertCircle, Camera, Check, Loader2 } from 'lucide-react'
import api from '../services/api'
import Navbar from '../components/Navbar'

function StatusMessage({ status }) {
  if (status === 'success') {
    return (
      <p className="flex items-center gap-1.5 text-green-700 text-sm font-medium">
        <Check className="w-4 h-4" /> Saved.
      </p>
    )
  }

  if (status === 'error') {
    return (
      <p className="flex items-center gap-1.5 text-red-600 text-sm font-medium">
        <AlertCircle className="w-4 h-4" /> Something went wrong. Please try again.
      </p>
    )
  }

  return null
}

function PlayerSettingsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)

  const [profile, setProfile] = useState({ email: '', profileImageUrl: '' })
  const [loading, setLoading] = useState(true)

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState('idle')

  const [newEmail, setNewEmail] = useState('')
  const [emailPassword, setEmailPassword] = useState('')
  const [emailStatus, setEmailStatus] = useState('idle')
  const [emailError, setEmailError] = useState('')

  const [currentPassword, setCurrentPassword] = useState('')
  const [newPassword, setNewPassword] = useState('')
  const [confirmPassword, setConfirmPassword] = useState('')
  const [passwordStatus, setPasswordStatus] = useState('idle')
  const [passwordError, setPasswordError] = useState('')

  useEffect(() => {
    if (!localStorage.getItem('playerToken')) {
      navigate('/login')
      return
    }

    api.get('/users/profile')
      .then(res => {
        setProfile(res.data)
        setNewEmail(res.data.email || '')
        setLoading(false)
      })
      .catch(() => {
        setLoading(false)
      })
  }, [navigate])

  const updateStoredPlayer = (updates) => {
    const stored = JSON.parse(localStorage.getItem('player') || '{}')
    localStorage.setItem('player', JSON.stringify({ ...stored, ...updates }))
  }

  const handleAvatarChange = (e) => {
    const file = e.target.files?.[0]
    if (!file) return

    setAvatarFile(file)
    setAvatarStatus('idle')

    const reader = new FileReader()
    reader.onload = () => setAvatarPreview(reader.result)
    reader.readAsDataURL(file)
  }

  const handleAvatarSave = async () => {
    if (!avatarFile) return

    setAvatarStatus('saving')

    try {
      const formData = new FormData()
      formData.append('image', avatarFile)

      const res = await api.post('/users/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })

      const profileImageUrl = res.data?.profileImageUrl || avatarPreview

      setProfile(p => ({ ...p, profileImageUrl }))
      updateStoredPlayer({ profileImageUrl })
      setAvatarFile(null)
      setAvatarStatus('success')
    } catch {
      setAvatarStatus('error')
    }
  }

  const handleEmailSubmit = async (e) => {
    e.preventDefault()
    setEmailError('')

    if (!newEmail || !newEmail.includes('@')) {
      setEmailError('Enter a valid email address.')
      return
    }

    if (!emailPassword) {
      setEmailError('Enter your current password to confirm this change.')
      return
    }

    setEmailStatus('saving')

    try {
      await api.put('/users/email', {
        email: newEmail,
        currentPassword: emailPassword,
      })

      setProfile(p => ({ ...p, email: newEmail }))
      updateStoredPlayer({ email: newEmail })
      setEmailPassword('')
      setEmailStatus('success')
    } catch {
      setEmailStatus('error')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')

    if (!currentPassword) {
      setPasswordError('Enter your current password.')
      return
    }

    if (newPassword.length < 8) {
      setPasswordError('New password must be at least 8 characters.')
      return
    }

    if (newPassword !== confirmPassword) {
      setPasswordError('New password and confirmation do not match.')
      return
    }

    setPasswordStatus('saving')

    try {
      await api.put('/users/password', {
        currentPassword,
        newPassword,
      })

      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus('success')
    } catch {
      setPasswordStatus('error')
    }
  }

  if (loading) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-slate-50 text-slate-500">
        Loading...
      </div>
    )
  }

  const player = JSON.parse(localStorage.getItem('player') || '{}')
  const displayedAvatar = avatarPreview || profile.profileImageUrl || player.profileImageUrl

  return (
    <div className="min-h-screen bg-slate-50">
      <Navbar />

      <header className="bg-green-900 px-6 py-10">
        <div className="max-w-3xl mx-auto">
          <p className="text-green-200 text-xs font-bold uppercase tracking-widest mb-2">
            Player account
          </p>
          <h1 className="text-white text-3xl font-bold">Settings</h1>
        </div>
      </header>

      <main className="max-w-3xl mx-auto px-6 py-8 flex flex-col gap-6">
        <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div>
            <h2 className="text-slate-800 text-lg font-semibold">Profile picture</h2>
            <p className="text-slate-500 text-sm">Shown on your player account.</p>
          </div>

          <div className="flex items-center gap-6 flex-wrap">
            <button
              type="button"
              onClick={() => fileInputRef.current?.click()}
              className="relative w-20 h-20 rounded-full overflow-hidden bg-gray-100 flex items-center justify-center shrink-0 group"
              title="Change photo"
            >
              {displayedAvatar ? (
                <img src={displayedAvatar} className="w-full h-full object-cover" alt="Profile" />
              ) : (
                <span className="text-slate-400 text-2xl font-bold">?</span>
              )}
              <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity">
                <Camera className="w-5 h-5 text-white" />
              </span>
            </button>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*"
              onChange={handleAvatarChange}
              className="hidden"
            />

            <div className="flex flex-col gap-2">
              <div className="flex gap-2 flex-wrap">
                <button
                  type="button"
                  onClick={() => fileInputRef.current?.click()}
                  className="px-4 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm font-medium hover:bg-slate-50"
                >
                  Choose photo
                </button>

                <button
                  type="button"
                  disabled={!avatarFile || avatarStatus === 'saving'}
                  onClick={handleAvatarSave}
                  className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
                >
                  {avatarStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Save photo
                </button>
              </div>

              <StatusMessage status={avatarStatus} />
            </div>
          </div>
        </section>

        <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div>
            <h2 className="text-slate-800 text-lg font-semibold">Email address</h2>
            <p className="text-slate-500 text-sm">
              Currently <span className="font-medium text-slate-700">{profile.email || 'not set'}</span>
            </p>
          </div>

          <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 max-w-sm">
            <label className="flex flex-col gap-1 text-slate-500 text-xs font-medium uppercase tracking-wide">
              New email
              <input
                type="email"
                value={newEmail}
                onChange={e => setNewEmail(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm normal-case tracking-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                placeholder="you@example.com"
              />
            </label>

            <label className="flex flex-col gap-1 text-slate-500 text-xs font-medium uppercase tracking-wide">
              Current password
              <input
                type="password"
                value={emailPassword}
                onChange={e => setEmailPassword(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm normal-case tracking-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                placeholder="Confirm it is you"
              />
            </label>

            {emailError && <p className="text-red-600 text-sm font-medium">{emailError}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={emailStatus === 'saving'}
                className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {emailStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                Update email
              </button>

              <StatusMessage status={emailStatus} />
            </div>
          </form>
        </section>

        <section className="p-6 bg-white rounded-xl shadow-sm border border-slate-200 flex flex-col gap-4">
          <div>
            <h2 className="text-slate-800 text-lg font-semibold">Password</h2>
            <p className="text-slate-500 text-sm">Use at least 8 characters.</p>
          </div>

          <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 max-w-sm">
            <label className="flex flex-col gap-1 text-slate-500 text-xs font-medium uppercase tracking-wide">
              Current password
              <input
                type="password"
                value={currentPassword}
                onChange={e => setCurrentPassword(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm normal-case tracking-normal focus:ring-2 focus:ring-green-700/30 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-slate-500 text-xs font-medium uppercase tracking-wide">
              New password
              <input
                type="password"
                value={newPassword}
                onChange={e => setNewPassword(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm normal-case tracking-normal focus:ring-2 focus:ring-green-700/30 outline-none"
              />
            </label>

            <label className="flex flex-col gap-1 text-slate-500 text-xs font-medium uppercase tracking-wide">
              Confirm new password
              <input
                type="password"
                value={confirmPassword}
                onChange={e => setConfirmPassword(e.target.value)}
                className="px-3 py-2 rounded-lg border border-slate-300 text-slate-800 text-sm normal-case tracking-normal focus:ring-2 focus:ring-green-700/30 outline-none"
              />
            </label>

            {passwordError && <p className="text-red-600 text-sm font-medium">{passwordError}</p>}

            <div className="flex items-center gap-3">
              <button
                type="submit"
                disabled={passwordStatus === 'saving'}
                className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2"
              >
                {passwordStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                Update password
              </button>

              <StatusMessage status={passwordStatus} />
            </div>
          </form>
        </section>
      </main>
    </div>
  )
}

export default PlayerSettingsPage