import { useEffect, useState } from 'react'
import { Bell, Loader2, Send } from 'lucide-react'
import {
  enablePushNotifications,
  getNotificationState,
  pushSupported,
  sendTestPushNotification,
} from '../lib/pushNotifications'

function PushNotificationSettings({ owner = false }) {
  const [state, setState] = useState('checking')
  const [message, setMessage] = useState('')
  const [busy, setBusy] = useState(false)

  useEffect(() => {
    getNotificationState().then(setState).catch(() => setState('unsupported'))
  }, [])

  const handleEnable = async () => {
    setBusy(true)
    setMessage('')
    try {
      await enablePushNotifications()
      setState('enabled')
      setMessage('Push notifications are enabled for this device.')
    } catch (error) {
      setMessage(error.message || 'Could not enable notifications.')
      setState(pushSupported() ? Notification.permission : 'unsupported')
    } finally {
      setBusy(false)
    }
  }

  const handleTest = async () => {
    setBusy(true)
    setMessage('')
    try {
      await sendTestPushNotification()
      setMessage('Test notification sent. It may take a few seconds.')
    } catch {
      setMessage('Could not send a test notification.')
    } finally {
      setBusy(false)
    }
  }

  const unsupported = state === 'unsupported'
  const blocked = state === 'denied'
  const enabled = state === 'enabled'

  return (
    <section className={owner ? 'owner-panel p-4 sm:p-6 flex flex-col gap-4' : ''} style={!owner ? {
      background: '#fff',
      border: '1px solid #dce1d6',
      borderRadius: '8px',
      padding: '24px',
      display: 'flex',
      flexDirection: 'column',
      gap: '14px'
    } : undefined}>
      <div>
        <h2 className={owner ? 'text-slate-800 text-lg font-semibold leading-7' : ''} style={!owner ? { color: '#101817', fontSize: '20px', fontWeight: 700, margin: 0 } : undefined}>
          Notifications
        </h2>
        <p className={owner ? 'text-slate-500 text-sm font-normal leading-5' : ''} style={!owner ? { color: '#5b6864', fontSize: '14px', margin: '4px 0 0' } : undefined}>
          Get booking, message, and open-play updates on this device.
        </p>
      </div>

      {unsupported && (
        <p className="text-sm text-slate-500">This browser does not support web push notifications.</p>
      )}
      {blocked && (
        <p className="text-sm text-red-600">Notifications are blocked. Enable them in your browser settings to use PickleBook alerts.</p>
      )}

      <div className="flex flex-wrap gap-3">
        <button
          type="button"
          onClick={handleEnable}
          disabled={busy || unsupported || blocked || enabled}
          className={owner ? 'owner-primary-btn px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50 disabled:cursor-not-allowed' : 'inline-flex items-center gap-2 rounded-md px-4 py-2 text-sm font-bold disabled:opacity-50 disabled:cursor-not-allowed'}
          style={!owner ? { background: '#d7e22b', color: '#071d27' } : undefined}
        >
          {busy ? <Loader2 className="w-4 h-4 animate-spin" /> : <Bell className="w-4 h-4" />}
          {enabled ? 'Notifications Enabled' : 'Enable Notifications'}
        </button>

        {enabled && (
          <button
            type="button"
            onClick={handleTest}
            disabled={busy}
            className={owner ? 'owner-secondary-btn px-4 py-2 text-sm inline-flex items-center gap-2 disabled:opacity-50' : 'inline-flex items-center gap-2 rounded-md border border-slate-200 px-4 py-2 text-sm font-bold text-slate-700 disabled:opacity-50'}
          >
            <Send className="w-4 h-4" />
            Send Test
          </button>
        )}
      </div>

      {message && <p className={owner ? 'text-sm text-slate-600' : ''} style={!owner ? { color: '#5b6864', fontSize: '13px', margin: 0 } : undefined}>{message}</p>}
    </section>
  )
}

export default PushNotificationSettings
