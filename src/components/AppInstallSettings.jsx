import { CheckCircle2, Smartphone } from 'lucide-react'
import InstallPickleBookButton from './InstallPickleBookButton'
import { isIosDevice, isStandalonePwa } from '../lib/pwa'

function AppInstallSettings() {
  const installed = isStandalonePwa()
  const ios = isIosDevice()

  return (
    <section className="p-4 sm:p-6 bg-white rounded-xl shadow-sm outline outline-1 outline-offset-[-1px] outline-stone-300 flex flex-col gap-4">
      <div className="flex items-start justify-between gap-4 flex-wrap">
        <div className="flex items-start gap-3">
          <div className={`w-10 h-10 rounded-full flex items-center justify-center shrink-0 ${installed ? 'bg-green-100 text-green-800' : 'bg-slate-100 text-slate-700'}`}>
            {installed ? <CheckCircle2 className="w-5 h-5" /> : <Smartphone className="w-5 h-5" />}
          </div>
          <div>
            <h2 className="text-slate-800 text-lg font-semibold leading-7">PickleBook app</h2>
            <p className="text-slate-500 text-sm font-normal leading-5">
              {installed
                ? 'Downloaded and running from your Home Screen.'
                : ios
                  ? 'Install from Safari using Share, then Add to Home Screen.'
                  : 'Install PickleBook on this device for a faster app-like experience.'}
            </p>
          </div>
        </div>

        {installed ? (
          <span className="px-3 py-1.5 rounded-full bg-green-100 text-green-800 text-xs font-bold uppercase tracking-wide">
            Downloaded
          </span>
        ) : ios ? (
          <a
            href="/picklebook.mobileconfig"
            className="inline-flex items-center justify-center gap-2 rounded-md border border-slate-200 bg-white px-4 py-2 text-sm font-semibold text-slate-700 hover:bg-slate-50"
          >
            <Smartphone className="w-4 h-4" />
            Download iPhone Profile
          </a>
        ) : (
          <InstallPickleBookButton />
        )}
      </div>
    </section>
  )
}

export default AppInstallSettings
