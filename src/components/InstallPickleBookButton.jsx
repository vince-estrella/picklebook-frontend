import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import {
  getDeferredInstallPrompt,
  isIosDevice,
  isStandalonePwa,
  promptInstall,
  subscribeInstallPrompt,
} from '../lib/pwa'

function InstallPickleBookButton({ compact = false }) {
  const [installPrompt, setInstallPrompt] = useState(getDeferredInstallPrompt())
  const [showIosHelp, setShowIosHelp] = useState(false)
  const [dismissed, setDismissed] = useState(() => localStorage.getItem('pwaInstallDismissed') === 'true')

  useEffect(() => subscribeInstallPrompt(setInstallPrompt), [])

  if (isStandalonePwa() || dismissed) return null

  const canNativeInstall = Boolean(installPrompt)
  const canShowIosHelp = isIosDevice()
  if (!canNativeInstall && !canShowIosHelp) return null

  const handleInstall = async () => {
    if (canNativeInstall) {
      await promptInstall()
      return
    }
    setShowIosHelp(true)
  }

  const handleDismiss = () => {
    localStorage.setItem('pwaInstallDismissed', 'true')
    setDismissed(true)
  }

  return (
    <div className="relative">
      <button
        type="button"
        onClick={handleInstall}
        className={`inline-flex items-center gap-2 rounded-md border border-slate-200 bg-white font-semibold text-slate-700 hover:bg-slate-50 ${
          compact ? 'px-3 py-2 text-xs' : 'px-4 py-2 text-sm'
        }`}
      >
        <Download className="w-4 h-4" />
        <span className={compact ? 'hidden sm:inline' : ''}>Install PickleBook</span>
      </button>

      {showIosHelp && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl z-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">Install on iPhone</p>
              <p className="text-sm text-slate-600 mt-1">
                Tap Share, then choose Add to Home Screen.
              </p>
            </div>
            <button type="button" onClick={() => setShowIosHelp(false)} className="p-1 rounded-md hover:bg-slate-100" aria-label="Close install instructions">
              <X className="w-4 h-4" />
            </button>
          </div>
          <button type="button" onClick={handleDismiss} className="mt-3 text-xs font-semibold text-slate-500 hover:text-slate-900">
            Do not show again
          </button>
        </div>
      )}
    </div>
  )
}

export default InstallPickleBookButton
