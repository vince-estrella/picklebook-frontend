import { useEffect, useState } from 'react'
import { Navigate, useLocation } from 'react-router-dom'
import { ensureOwnerSession } from '../lib/ownerSession'
import { ensurePlayerSession } from '../lib/playerSession'

function ProtectedRoute({ role, children }) {
  const location = useLocation()
  const [allowed, setAllowed] = useState(null)

  useEffect(() => {
    let cancelled = false

    async function checkSession() {
      const valid = role === 'owner'
        ? await ensureOwnerSession()
        : await ensurePlayerSession()

      if (!cancelled) setAllowed(valid)
    }

    checkSession()
    return () => { cancelled = true }
  }, [role, location.pathname])

  if (allowed === null) {
    return (
      <div className="min-h-screen bg-slate-50 flex items-center justify-center px-6 text-center text-sm font-semibold text-slate-500">
        Loading PickleBook...
      </div>
    )
  }

  if (!allowed) {
    return (
      <Navigate
        to={role === 'owner' ? '/owner/login' : '/login'}
        replace
        state={{ from: location.pathname }}
      />
    )
  }

  return children
}

export default ProtectedRoute
