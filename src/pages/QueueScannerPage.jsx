import { useEffect, useId, useRef, useState } from 'react'
import { useNavigate } from 'react-router-dom'
import { Camera, Keyboard, QrCode, RotateCcw } from 'lucide-react'
import Navbar from '../components/Navbar'

const COLORS = {
  navy: '#0B2A38',
  navyDeep: '#071D27',
  teal: '#0F6B5C',
  citron: '#D7E22B',
  chalk: '#EEF1EA',
  chalkDim: '#DCE1D6',
  ink: '#101817',
  inkMute: '#5B6864',
}

const LAST_QUEUE_KEY = 'picklebook_last_queue'

function getQueueDestination(value) {
  const raw = String(value || '').trim()
  if (!raw) return null

  const directCode = raw.toUpperCase()
  if (/^[A-Z2-9]{4,8}$/.test(directCode)) {
    return `/join?code=${encodeURIComponent(directCode)}`
  }

  try {
    const url = new URL(raw)
    const code = url.searchParams.get('code')
    const queueCode = url.searchParams.get('queueCode')

    if (url.pathname === '/join' && code) {
      return `/join?code=${encodeURIComponent(code.toUpperCase())}`
    }

    if (url.pathname.startsWith('/open-play/') && queueCode) {
      return `${url.pathname}?queueCode=${encodeURIComponent(queueCode.toUpperCase())}`
    }
  } catch {
    return null
  }

  return null
}

function QueueScannerPage() {
  const navigate = useNavigate()
  const scannerRef = useRef(null)
  const scannerElementId = `queue-scanner-${useId().replace(/:/g, '')}`
  const [manualCode, setManualCode] = useState('')
  const [status, setStatus] = useState('Tap Start Camera to scan the queue QR.')
  const [scanning, setScanning] = useState(false)
  const [lastQueue, setLastQueue] = useState(() => {
    try {
      return JSON.parse(localStorage.getItem(LAST_QUEUE_KEY) || 'null')
    } catch {
      return null
    }
  })

  useEffect(() => {
    return () => {
      if (scannerRef.current?.isScanning) {
        scannerRef.current.stop().catch(() => {})
      }
      scannerRef.current?.clear?.()
    }
  }, [])

  const openDestination = (destination) => {
    const params = new URLSearchParams(destination.split('?')[1] || '')
    const code = params.get('code') || params.get('queueCode')
    if (code) {
      const saved = { code, path: destination, savedAt: Date.now() }
      localStorage.setItem(LAST_QUEUE_KEY, JSON.stringify(saved))
      setLastQueue(saved)
    }
    navigate(destination)
  }

  const handleScanResult = async (decodedText) => {
    const destination = getQueueDestination(decodedText)
    if (!destination) {
      setStatus('That QR does not look like a PickleBook queue code.')
      return
    }

    setStatus('Queue found. Opening...')
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
    }
    setScanning(false)
    openDestination(destination)
  }

  const startScanner = async () => {
    setStatus('Opening camera...')
    try {
      const { Html5Qrcode } = await import('html5-qrcode')
      if (!scannerRef.current) {
        scannerRef.current = new Html5Qrcode(scannerElementId, false)
      }

      const cameras = await Html5Qrcode.getCameras()
      if (!cameras.length) {
        setStatus('No camera was found on this device.')
        return
      }

      const backCamera = cameras.find((camera) => /back|rear|environment/i.test(camera.label))
      await scannerRef.current.start(
        backCamera?.id || { facingMode: 'environment' },
        { fps: 10, qrbox: { width: 240, height: 240 }, aspectRatio: 1 },
        handleScanResult,
        () => {}
      )
      setScanning(true)
      setStatus('Point your camera at the PickleBook queue QR.')
    } catch (error) {
      setStatus(error?.message || 'Could not start the camera. You can still enter the room code manually.')
    }
  }

  const stopScanner = async () => {
    if (scannerRef.current?.isScanning) {
      await scannerRef.current.stop().catch(() => {})
      scannerRef.current.clear()
    }
    setScanning(false)
    setStatus('Camera paused.')
  }

  const submitManualCode = (event) => {
    event.preventDefault()
    const destination = getQueueDestination(manualCode)
    if (!destination) {
      setStatus('Enter a valid PickleBook queue code or QR link.')
      return
    }
    openDestination(destination)
  }

  return (
    <div style={{ minHeight: '100vh', background: COLORS.chalk, color: COLORS.ink }}>
      <Navbar />
      <main style={{ maxWidth: '520px', margin: '0 auto', padding: '28px 18px 64px', fontFamily: "'Inter', sans-serif" }}>
        <section style={{ background: COLORS.navy, color: '#fff', borderRadius: '14px', padding: '24px', marginBottom: '16px' }}>
          <div style={{ width: '44px', height: '44px', borderRadius: '12px', background: 'rgba(215,226,43,0.14)', color: COLORS.citron, display: 'grid', placeItems: 'center', marginBottom: '14px' }}>
            <QrCode size={24} />
          </div>
          <p style={{ margin: '0 0 8px', color: COLORS.citron, fontSize: '11px', letterSpacing: '0.14em', textTransform: 'uppercase', fontWeight: 800 }}>
            Queue Scanner
          </p>
          <h1 style={{ margin: 0, fontSize: '30px', lineHeight: 1.05, fontWeight: 900 }}>
            Scan to join the line
          </h1>
          <p style={{ margin: '12px 0 0', color: '#C8D3CE', fontSize: '14px', lineHeight: 1.5 }}>
            Scan the QR at the court or from an Open Play host. PickleBook will add you to the right queue and remember it on this device.
          </p>
        </section>

        <section style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '12px', padding: '14px', boxShadow: '0 10px 28px rgba(11,42,56,0.08)' }}>
          <div id={scannerElementId} style={{ overflow: 'hidden', borderRadius: '10px', background: COLORS.navyDeep, minHeight: scanning ? '280px' : '0' }} />

          <div style={{ display: 'flex', gap: '10px', marginTop: scanning ? '14px' : 0 }}>
            <button
              type="button"
              onClick={scanning ? stopScanner : startScanner}
              style={{ flex: 1, border: 'none', borderRadius: '10px', padding: '13px 14px', background: COLORS.citron, color: COLORS.navyDeep, fontWeight: 800, display: 'inline-flex', alignItems: 'center', justifyContent: 'center', gap: '8px' }}
            >
              {scanning ? <RotateCcw size={17} /> : <Camera size={17} />}
              {scanning ? 'Pause Camera' : 'Start Camera'}
            </button>
          </div>

          <p style={{ color: COLORS.inkMute, fontSize: '13px', margin: '12px 2px 0', lineHeight: 1.45 }}>
            {status}
          </p>
        </section>

        <form onSubmit={submitManualCode} style={{ background: '#fff', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '12px', padding: '16px', marginTop: '14px' }}>
          <label style={{ display: 'flex', alignItems: 'center', gap: '8px', color: COLORS.ink, fontWeight: 800, fontSize: '14px', marginBottom: '10px' }}>
            <Keyboard size={16} />
            Enter code instead
          </label>
          <div style={{ display: 'flex', gap: '10px' }}>
            <input
              value={manualCode}
              onChange={(event) => setManualCode(event.target.value.toUpperCase())}
              placeholder="ROOM CODE"
              style={{ flex: 1, minWidth: 0, border: `1px solid ${COLORS.chalkDim}`, borderRadius: '10px', padding: '12px', fontSize: '16px', letterSpacing: '0.14em', fontWeight: 800, color: COLORS.ink }}
            />
            <button type="submit" style={{ border: 'none', borderRadius: '10px', padding: '0 16px', background: COLORS.teal, color: '#fff', fontWeight: 800 }}>
              Join
            </button>
          </div>
        </form>

        {lastQueue?.path && (
          <button
            type="button"
            onClick={() => navigate(lastQueue.path)}
            style={{ width: '100%', marginTop: '14px', border: `1px solid ${COLORS.chalkDim}`, background: '#fff', borderRadius: '12px', padding: '14px', color: COLORS.teal, fontWeight: 800 }}
          >
            Reopen my last queue ({lastQueue.code})
          </button>
        )}
      </main>
    </div>
  )
}

export default QueueScannerPage
