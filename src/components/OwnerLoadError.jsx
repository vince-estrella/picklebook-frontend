import { RefreshCw } from 'lucide-react'

function OwnerLoadError({
  title = 'Could not load this page',
  message = 'Check your connection and try again.',
  onRetry,
}) {
  return (
    <section className="owner-panel p-6 sm:p-8 text-center flex flex-col items-center gap-3">
      <div className="w-11 h-11 rounded-full bg-amber-50 text-amber-700 flex items-center justify-center">
        <RefreshCw className="w-5 h-5" />
      </div>
      <div>
        <h2 className="text-slate-900 text-lg font-bold">{title}</h2>
        <p className="text-slate-500 text-sm mt-1">{message}</p>
      </div>
      {onRetry && (
        <button
          type="button"
          onClick={onRetry}
          className="owner-primary-btn px-4 py-2 text-sm inline-flex items-center gap-2"
        >
          <RefreshCw className="w-4 h-4" />
          Retry
        </button>
      )}
    </section>
  )
}

export default OwnerLoadError
