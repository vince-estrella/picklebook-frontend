import { useEffect, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Loader2, Check, AlertCircle, Menu } from 'lucide-react'
import api from '../services/api'
import OwnerSidebar from '../components/OwnerSidebar'

// Small inline status line shown under each form once it's submitted.
function StatusMessage({ status }) {
  if (status === 'success') {
    return (
      <p className="flex items-center gap-1.5 text-green-800 text-sm font-medium">
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

function OwnerSettingsPage() {
  const navigate = useNavigate()
  const fileInputRef = useRef(null)
  const [sidebarOpen, setSidebarOpen] = useState(false)

  const [profile, setProfile] = useState({ email: '', profileImageUrl: '' })
  const [loading, setLoading] = useState(true)

  const [avatarPreview, setAvatarPreview] = useState(null)
  const [avatarFile, setAvatarFile] = useState(null)
  const [avatarStatus, setAvatarStatus] = useState('idle') // idle | saving | success | error

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
    if (!localStorage.getItem('token')) {
      navigate('/owner/login')
      return
    }
    api.get('/owner/profile')
      .then(res => {
        setProfile(res.data)
        setNewEmail(res.data.email || '')
        setLoading(false)
      })
      .catch(() => {
        // Profile endpoint may not exist yet — still let the owner use the forms below.
        setLoading(false)
      })
  }, [])

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
      const res = await api.post('/owner/profile-picture', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      setProfile(p => ({ ...p, profileImageUrl: res.data?.profileImageUrl || avatarPreview }))
      setAvatarStatus('success')
    } catch (err) {
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
      await api.put('/owner/email', { email: newEmail, currentPassword: emailPassword })
      setProfile(p => ({ ...p, email: newEmail }))
      setEmailPassword('')
      setEmailStatus('success')
    } catch (err) {
      setEmailStatus('error')
    }
  }

  const handlePasswordSubmit = async (e) => {
    e.preventDefault()
    setPasswordError('')
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
      await api.put('/owner/password', { currentPassword, newPassword })
      setCurrentPassword('')
      setNewPassword('')
      setConfirmPassword('')
      setPasswordStatus('success')
    } catch (err) {
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

  const displayedAvatar = avatarPreview || profile.profileImageUrl

  return (
    <div className="w-full min-h-screen bg-slate-50 flex">

      {/* Mobile sidebar overlay */}
      {sidebarOpen && (
        <div
          className="fixed inset-0 bg-black/40 z-30 lg:hidden"
          onClick={() => setSidebarOpen(false)}
        />
      )}

      {/* Sidebar — hidden off-canvas on phones, toggled by the header menu button */}
      <div
        className={`fixed lg:sticky top-0 h-screen z-40 transition-transform duration-200 ${
          sidebarOpen ? 'translate-x-0' : '-translate-x-full'
        } lg:translate-x-0`}
      >
        <OwnerSidebar />
      </div>

      <div className="flex-1 flex flex-col min-w-0">

        {/* Topbar */}
        <header className="px-4 sm:px-6 lg:px-12 py-4 bg-slate-50/80 shadow-sm backdrop-blur-md flex items-center gap-3 sticky top-0 z-10">
          <button
            onClick={() => setSidebarOpen(true)}
            className="lg:hidden p-2 -ml-2 rounded-lg text-neutral-700 hover:bg-gray-200 shrink-0"
            aria-label="Open menu"
          >
            <Menu className="w-5 h-5" />
          </button>
          <h1 className="text-green-800 text-xl sm:text-2xl font-bold leading-8 truncate">Account Settings</h1>
        </header>

        <main className="p-4 sm:p-6 lg:p-12 max-w-3xl flex flex-col gap-6 lg:gap-8">

          {/* Profile picture */}
          <section className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
            <div>
              <h2 className="text-slate-800 text-lg font-semibold leading-7">Profile picture</h2>
              <p className="text-slate-500 text-sm font-normal leading-5">Shown to players across the courts you manage.</p>
            </div>

            <div className="flex flex-col sm:flex-row items-center sm:items-center gap-4 sm:gap-6 text-center sm:text-left">
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
                <span className="absolute inset-0 bg-black/40 opacity-0 group-hover:opacity-100 flex items-center justify-center transition-opacity duration-150">
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

              <div className="flex flex-col gap-2 items-center sm:items-start w-full sm:w-auto">
                <div className="flex flex-col xs:flex-row sm:flex-row gap-2 w-full sm:w-auto">
                  <button
                    type="button"
                    onClick={() => fileInputRef.current?.click()}
                    className="px-4 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-medium transition-colors duration-150 hover:bg-gray-100"
                  >
                    Choose photo
                  </button>
                  <button
                    type="button"
                    disabled={!avatarFile || avatarStatus === 'saving'}
                    onClick={handleAvatarSave}
                    className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium transition-colors duration-150 hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                  >
                    {avatarStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                    Save photo
                  </button>
                </div>
                <StatusMessage status={avatarStatus} />
              </div>
            </div>
          </section>

          {/* Email */}
          <section className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
            <div>
              <h2 className="text-slate-800 text-lg font-semibold leading-7">Email address</h2>
              <p className="text-slate-500 text-sm font-normal leading-5 break-words">
                Currently <span className="font-medium text-slate-700">{profile.email || 'not set'}</span>
              </p>
            </div>

            <form onSubmit={handleEmailSubmit} className="flex flex-col gap-4 w-full sm:max-w-sm">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">New email</label>
                <input
                  type="email"
                  value={newEmail}
                  onChange={e => setNewEmail(e.target.value)}
                  className="px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                  placeholder="you@example.com"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">Current password</label>
                <input
                  type="password"
                  value={emailPassword}
                  onChange={e => setEmailPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                  placeholder="Confirm it's you"
                />
              </div>
              {emailError && <p className="text-red-600 text-sm font-medium">{emailError}</p>}
              <div className="flex flex-col xs:flex-row sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={emailStatus === 'saving'}
                  className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium transition-colors duration-150 hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
                >
                  {emailStatus === 'saving' && <Loader2 className="w-4 h-4 animate-spin" />}
                  Update email
                </button>
                <StatusMessage status={emailStatus} />
              </div>
            </form>
          </section>

          {/* Password */}
          <section className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
            <div>
              <h2 className="text-slate-800 text-lg font-semibold leading-7">Password</h2>
              <p className="text-slate-500 text-sm font-normal leading-5">Use at least 8 characters.</p>
            </div>

            <form onSubmit={handlePasswordSubmit} className="flex flex-col gap-4 w-full sm:max-w-sm">
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">Current password</label>
                <input
                  type="password"
                  value={currentPassword}
                  onChange={e => setCurrentPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">New password</label>
                <input
                  type="password"
                  value={newPassword}
                  onChange={e => setNewPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                />
              </div>
              <div className="flex flex-col gap-1">
                <label className="text-slate-500 text-xs font-medium uppercase tracking-wide">Confirm new password</label>
                <input
                  type="password"
                  value={confirmPassword}
                  onChange={e => setConfirmPassword(e.target.value)}
                  className="px-3 py-2 rounded-lg outline outline-1 outline-offset-[-1px] outline-stone-300 text-slate-800 text-sm font-normal focus:ring-2 focus:ring-green-700/30 outline-none"
                />
              </div>
              {passwordError && <p className="text-red-600 text-sm font-medium">{passwordError}</p>}
              <div className="flex flex-col xs:flex-row sm:flex-row items-start sm:items-center gap-3">
                <button
                  type="submit"
                  disabled={passwordStatus === 'saving'}
                  className="px-4 py-2 rounded-lg bg-green-800 text-white text-sm font-medium transition-colors duration-150 hover:bg-green-900 disabled:opacity-40 disabled:cursor-not-allowed flex items-center gap-2 w-fit"
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
    </div>
  )
}

export default OwnerSettingsPage