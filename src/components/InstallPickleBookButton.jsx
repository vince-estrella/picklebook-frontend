import { useEffect, useState } from 'react'
import { Download, X } from 'lucide-react'
import {
  getDeferredInstallPrompt,
  isIosDevice,
  isStandalonePwa,
  promptInstall,
  subscribeInstallPrompt,
} from '../lib/pwa'

function getManualInstallCopy() {
  const ua = window.navigator.userAgent
  if (/android/i.test(ua)) {
    return 'Open the browser menu, then choose Install app or Add to Home screen.'
  }
  if (/edg/i.test(ua)) {
    return 'Open the browser menu, then choose Apps > Install this site as an app.'
  }
  if (/chrome|chromium/i.test(ua)) {
    return 'Open the browser menu, then choose Save and share > Install PickleBook.'
  }
  return 'Use your browser menu and choose Install app or Add to Home Screen.'
}

function InstallPickleBookButton({ compact = false }) {
  const [installPrompt, setInstallPrompt] = useState(getDeferredInstallPrompt())
  const [showHelp, setShowHelp] = useState(false)

  useEffect(() => subscribeInstallPrompt(setInstallPrompt), [])

  if (isStandalonePwa()) return null

  const handleInstall = async () => {
    if (installPrompt) {
      await promptInstall()
      return
    }
    setShowHelp(true)
  }

  const helpTitle = isIosDevice() ? 'Install on iPhone' : 'Install PickleBook'
  const helpText = isIosDevice()
    ? 'Tap Share, then choose Add to Home Screen.'
    : getManualInstallCopy()

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

      {showHelp && (
        <div className="absolute right-0 top-full mt-2 w-72 rounded-lg border border-slate-200 bg-white p-4 shadow-xl z-50">
          <div className="flex items-start justify-between gap-3">
            <div>
              <p className="text-sm font-bold text-slate-900">{helpTitle}</p>
              <p className="text-sm text-slate-600 mt-1">{helpText}</p>
              {!installPrompt && !isIosDevice() && (
                <p className="text-xs text-slate-500 mt-2">
                  If the install option is missing, refresh once after the page fully loads.
                </p>
              )}
            </div>
            <button
              type="button"
              onClick={() => setShowHelp(false)}
              className="p-1 rounded-md hover:bg-slate-100"
              aria-label="Close install instructions"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>
      )}
    </div>
  )
}

export default InstallPickleBookButton
