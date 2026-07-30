// ---------------------------------------------------------------------------
// CHANGES TO QueueManager.jsx
// ---------------------------------------------------------------------------

// 1) Add these imports at the top of the file, alongside the existing ones:
//
//    import { FaImage, FaSpinner } from 'react-icons/fa'
//    import api from '../services/api'
//
// 2) Add this to the <style> block inside the main component (anywhere in
//    the template string is fine) so the "reading names..." spinner spins:
//
//    .qm-spin { animation: qm-spin 0.8s linear infinite; }
//    @keyframes qm-spin { from { transform: rotate(0deg); } to { transform: rotate(360deg); } }
//
// 3) Replace the existing `AddPlayerModal` function with the one below.
//    Everything else in the file (addPlayers, showAddModal, etc.) stays
//    exactly the same — addPlayers already accepts an array of
//    { name, skill } entries, which is all this sends it.
// ---------------------------------------------------------------------------

function tabStyle(active) {
  return {
    flex: 1,
    padding: '9px 12px',
    borderRadius: '6px',
    border: `1.5px solid ${active ? COLORS.teal : '#D5DAD1'}`,
    background: active ? '#E7EEE9' : '#fff',
    color: active ? COLORS.teal : COLORS.inkMute,
    fontSize: '13px',
    fontWeight: 600,
    cursor: 'pointer',
    display: 'inline-flex',
    alignItems: 'center',
    justifyContent: 'center',
    gap: '6px',
  }
}

const uploadBoxStyle = {
  display: 'flex',
  flexDirection: 'column',
  alignItems: 'center',
  justifyContent: 'center',
  gap: '8px',
  padding: '32px 16px',
  border: `1.5px dashed ${COLORS.chalkDim}`,
  borderRadius: '10px',
  cursor: 'pointer',
  color: COLORS.inkMute,
  fontSize: '13px',
  textAlign: 'center',
}

function AddPlayerModal({ onClose, onAdd }) {
  const [mode, setMode] = useState('type') // 'type' | 'screenshot'

  // ---- "type names" mode state (unchanged behavior) ----
  const [namesText, setNamesText] = useState('')
  const [skill, setSkill] = useState(DEFAULT_SKILL)
  const entries = useMemo(() => parseBulkInput(namesText, skill), [namesText, skill])
  const validCount = entries.filter(e => e.name.trim()).length

  // ---- "import screenshot" mode state ----
  const [imageFile, setImageFile] = useState(null)
  const [imagePreview, setImagePreview] = useState(null)
  const [extracting, setExtracting] = useState(false)
  const [extractError, setExtractError] = useState('')
  const [extractedPlayers, setExtractedPlayers] = useState(null) // [{ name, skill, include }]

  const handleImageSelect = (e) => {
    const file = e.target.files?.[0]
    if (!file) return
    setImageFile(file)
    setExtractError('')
    setExtractedPlayers(null)
    const reader = new FileReader()
    reader.onload = () => setImagePreview(reader.result)
    reader.readAsDataURL(file)
  }

  const resetScreenshot = () => {
    setImageFile(null)
    setImagePreview(null)
    setExtractedPlayers(null)
    setExtractError('')
  }

  const extractNames = async () => {
    if (!imageFile) return
    setExtracting(true)
    setExtractError('')
    try {
      const formData = new FormData()
      formData.append('image', imageFile)
      const res = await api.post('/players/extract-names', formData, {
        headers: { 'Content-Type': 'multipart/form-data' },
      })
      const names = Array.isArray(res.data?.names) ? res.data.names : []
      if (names.length === 0) {
        setExtractError('Couldn\u2019t find any names in that screenshot. Try a clearer crop.')
        return
      }
      setExtractedPlayers(names.map(n => ({ name: n, skill: DEFAULT_SKILL, include: true })))
    } catch {
      setExtractError('Couldn\u2019t read that screenshot. Try again, or type names manually instead.')
    } finally {
      setExtracting(false)
    }
  }

  const updateExtracted = (idx, patch) => {
    setExtractedPlayers(prev => prev.map((p, i) => (i === idx ? { ...p, ...patch } : p)))
  }

  const includedCount = extractedPlayers
    ? extractedPlayers.filter(p => p.include && p.name.trim()).length
    : 0

  const handleSubmit = (e) => {
    e.preventDefault()
    if (mode === 'screenshot' && extractedPlayers) {
      const toAdd = extractedPlayers
        .filter(p => p.include && p.name.trim())
        .map(p => ({ name: p.name.trim(), skill: p.skill }))
      onAdd(toAdd)
    } else {
      onAdd(entries)
    }
  }

  const canSubmit = mode === 'type' ? validCount > 0 : includedCount > 0
  const submitLabel = mode === 'type'
    ? (validCount > 0 ? `Add ${validCount} Player${validCount > 1 ? 's' : ''}` : 'Add Players')
    : (includedCount > 0 ? `Add ${includedCount} Player${includedCount > 1 ? 's' : ''}` : 'Add Players')

  return (
    <Modal title="Add Players" onClose={onClose} width={480}>
      <form onSubmit={handleSubmit}>
        <div style={{ display: 'flex', gap: '8px', marginBottom: '18px' }}>
          <button type="button" style={tabStyle(mode === 'type')} onClick={() => setMode('type')}>
            Type Names
          </button>
          <button type="button" style={tabStyle(mode === 'screenshot')} onClick={() => setMode('screenshot')}>
            <FaImage size={11} /> Import Screenshot
          </button>
        </div>

        {mode === 'type' ? (
          <>
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>
              Player names
            </label>
            <p style={{ fontSize: '11.5px', color: COLORS.inkMute, margin: '0 0 8px' }}>
              One player per line. Add a skill per line too, like "Jane Smith, Intermediate" — otherwise the default below is used.
            </p>
            <textarea
              autoFocus
              rows={6}
              value={namesText}
              onChange={e => setNamesText(e.target.value)}
              placeholder={'Jane Smith\nJohn Doe, Intermediate\nAlex Rivera'}
              style={{ ...inputStyle, resize: 'vertical', marginBottom: '16px', lineHeight: 1.5 }}
            />
            <label style={{ fontSize: '12.5px', fontWeight: 600, color: COLORS.inkMute, display: 'block', marginBottom: '6px' }}>
              Default skill level
            </label>
            <select value={skill} onChange={e => setSkill(e.target.value)} style={{ ...inputStyle, marginBottom: '6px' }}>
              {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
            </select>
            <p style={{ fontSize: '11.5px', color: COLORS.inkMute, margin: 0 }}>
              Applied to any name above that doesn't already specify a skill.
            </p>
          </>
        ) : (
          <>
            {!imagePreview && (
              <label style={uploadBoxStyle}>
                <FaImage size={22} />
                <span>
                  <strong style={{ color: COLORS.ink }}>Click to choose a screenshot</strong>
                  <br />
                  e.g. a participant list from another app
                </span>
                <input type="file" accept="image/*" onChange={handleImageSelect} style={{ display: 'none' }} />
              </label>
            )}

            {imagePreview && !extractedPlayers && (
              <div>
                <img
                  src={imagePreview}
                  alt="Selected screenshot"
                  style={{ width: '100%', maxHeight: '220px', objectFit: 'cover', borderRadius: '8px', marginBottom: '12px' }}
                />
                <div style={{ display: 'flex', gap: '8px' }}>
                  <Button type="button" variant="outlineDark" size="sm" onClick={resetScreenshot}>
                    Choose different
                  </Button>
                  <Button
                    type="button"
                    variant="primary"
                    size="sm"
                    onClick={extractNames}
                    disabled={extracting}
                    icon={extracting ? <FaSpinner className="qm-spin" size={12} /> : <FaImage size={12} />}
                  >
                    {extracting ? 'Reading names…' : 'Extract Players'}
                  </Button>
                </div>
              </div>
            )}

            {extractError && (
              <p style={{ color: '#B3453D', fontSize: '12.5px', marginTop: '10px' }}>{extractError}</p>
            )}

            {extractedPlayers && (
              <div>
                <p style={{ fontSize: '12.5px', color: COLORS.inkMute, margin: '0 0 10px' }}>
                  Found {extractedPlayers.length} name{extractedPlayers.length === 1 ? '' : 's'}. Uncheck anything that isn't a player, fix a name if needed, and set each one's skill level.
                </p>
                <div style={{ maxHeight: '280px', overflowY: 'auto', border: `1px solid ${COLORS.chalkDim}`, borderRadius: '8px' }}>
                  {extractedPlayers.map((p, i) => (
                    <div
                      key={i}
                      style={{
                        display: 'flex', alignItems: 'center', gap: '8px', padding: '8px 10px',
                        borderBottom: i < extractedPlayers.length - 1 ? `1px solid ${COLORS.chalkDim}` : 'none',
                      }}
                    >
                      <input
                        type="checkbox"
                        checked={p.include}
                        onChange={e => updateExtracted(i, { include: e.target.checked })}
                      />
                      <input
                        value={p.name}
                        onChange={e => updateExtracted(i, { name: e.target.value })}
                        style={{ ...inputStyle, flex: 1, padding: '6px 8px', fontSize: '13px', opacity: p.include ? 1 : 0.5 }}
                      />
                      <select
                        value={p.skill}
                        onChange={e => updateExtracted(i, { skill: e.target.value })}
                        disabled={!p.include}
                        style={{ ...inputStyle, width: '128px', padding: '6px 8px', fontSize: '12.5px', opacity: p.include ? 1 : 0.5 }}
                      >
                        {SKILL_LEVELS.map(s => <option key={s} value={s}>{s}</option>)}
                      </select>
                    </div>
                  ))}
                </div>
                <button
                  type="button"
                  onClick={resetScreenshot}
                  style={{ marginTop: '10px', fontSize: '12px', color: COLORS.teal, background: 'none', border: 'none', cursor: 'pointer', padding: 0 }}
                >
                  Start over with a different screenshot
                </button>
              </div>
            )}
          </>
        )}

        <div style={{ display: 'flex', gap: '10px', justifyContent: 'flex-end', marginTop: '20px' }}>
          <Button type="button" variant="ghost" onClick={onClose}>Cancel</Button>
          <Button type="submit" variant="primary" disabled={!canSubmit}>{submitLabel}</Button>
        </div>
      </form>
    </Modal>
  )
}
