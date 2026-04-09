import { useState, useEffect } from 'react'
import { api } from '../api.js'

const EMPTY_FORM = {
  date: new Date().toISOString().split('T')[0],
  video_url: '',
  scene_description: '',
  reference_description: '',
  additional_notes: '',
  is_premium: false,
}

function formatDay(dateStr) {
  const d = new Date(dateStr + 'T12:00:00')
  return { day: d.getDate(), month: d.toLocaleString('en-US', { month: 'short' }) }
}

export default function Admin() {
  const [form, setForm] = useState({ ...EMPTY_FORM })
  const [scheduled, setScheduled] = useState([])
  const [saving, setSaving] = useState(false)
  const [saveError, setSaveError] = useState('')
  const [saveSuccess, setSaveSuccess] = useState('')
  const [editId, setEditId] = useState(null)
  const [editForm, setEditForm] = useState({})

  useEffect(() => {
    loadSchedule()
  }, [])

  async function loadSchedule() {
    try {
      const res = await api.get('/admin/schedule')
      setScheduled(res.data || [])
    } catch {
      // silent
    }
  }

  function handleFormChange(e) {
    const { name, value, type, checked } = e.target
    setForm(f => ({ ...f, [name]: type === 'checkbox' ? checked : value }))
    setSaveError('')
    setSaveSuccess('')
  }

  async function handleSchedule() {
    if (!form.date || !form.video_url) {
      setSaveError('Date and YouTube URL are required.')
      return
    }
    setSaving(true)
    setSaveError('')
    setSaveSuccess('')
    try {
      await api.post('/admin/schedule', {
        date: form.date,
        video_url: form.video_url,
        scene_description: form.scene_description || null,
        reference_description: form.reference_description || null,
        additional_notes: form.additional_notes || null,
        is_premium: form.is_premium,
      })
      setSaveSuccess('Video scheduled successfully!')
      setForm({ ...EMPTY_FORM })
      await loadSchedule()
    } catch (err) {
      setSaveError(err.message)
    } finally {
      setSaving(false)
    }
  }

  async function handleDelete(id) {
    if (!confirm('Delete this scheduled video? This cannot be undone.')) return
    try {
      await api.delete(`/admin/schedule/${id}`)
      setScheduled(prev => prev.filter(s => s.video_id !== id))
    } catch (err) {
      alert(err.message)
    }
  }

  function startEdit(item) {
    setEditId(item.video_id)
    setEditForm({
      video_url: item.video_url || '',
      scene_description: item.scene_description || '',
      reference_description: item.reference_description || '',
      additional_notes: item.additional_notes || '',
    })
  }

  async function saveEdit(id) {
    try {
      await api.patch(`/admin/schedule/${id}`, editForm)
      setEditId(null)
      await loadSchedule()
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="container page">
      {/* Navbar label override is handled in Navbar */}

      {/* Schedule Form */}
      <div className="card" style={{ marginBottom: '24px' }}>
        <div className="section-label" style={{ marginBottom: '16px' }}>Schedule a video</div>

        {saveError && <div className="error-msg" style={{ marginBottom: '12px' }}>{saveError}</div>}
        {saveSuccess && <div className="success-msg" style={{ marginBottom: '12px' }}>✓ {saveSuccess}</div>}

        <div className="form-field">
          <label className="field-label">Date</label>
          <input className="field-input" type="date" name="date" value={form.date} onChange={handleFormChange} />
        </div>

        <div className="form-field">
          <label className="field-label">YouTube URL</label>
          <input className="field-input" type="url" name="video_url" value={form.video_url}
            onChange={handleFormChange} placeholder="https://www.youtube.com/watch?v=..." />
        </div>

        <div className="form-field">
          <label className="field-label">Scene description (reference sentence)</label>
          <textarea className="field-input" name="scene_description" value={form.scene_description}
            onChange={handleFormChange} rows={2} placeholder="Brief description of the scene…" />
        </div>

        <div className="form-field">
          <label className="field-label">Reference answer (ideal description for AI scoring)</label>
          <textarea className="field-input" name="reference_description" value={form.reference_description}
            onChange={handleFormChange} rows={3}
            placeholder="Write an ideal description. The AI will compare student submissions against this…" />
        </div>

        <div className="form-field">
          <label className="field-label">Notes (grammar / vocabulary hints) <span style={{ color: 'var(--text-muted)' }}>optional</span></label>
          <textarea className="field-input" name="additional_notes" value={form.additional_notes}
            onChange={handleFormChange} rows={2} placeholder="Optional tips for learners…" />
        </div>

        <div style={{ display: 'flex', justifyContent: 'flex-end', marginTop: '4px' }}>
          <button className="btn-primary" style={{ width: 'auto', padding: '10px 20px' }}
            onClick={handleSchedule} disabled={saving}>
            {saving ? <><span className="spinner" /> Saving…</> : '+ Schedule video'}
          </button>
        </div>
      </div>

      {/* Upcoming Schedule */}
      <div className="section-label" style={{ marginBottom: '14px' }}>Upcoming schedule</div>

      {scheduled.length === 0 && (
        <div className="empty-state">
          <div className="empty-icon">📅</div>
          <h3>No videos scheduled</h3>
          <p>Use the form above to schedule your first video.</p>
        </div>
      )}

      <div className="schedule-list">
        {scheduled.map(item => {
          const { day, month } = formatDay(item.date)
          const isEditing = editId === item.video_id
          return (
            <div key={item.video_id} className="schedule-row">
              <div className="date-badge">
                <div className="date-day">{day}</div>
                <div className="date-month">{month}</div>
              </div>

              {isEditing ? (
                <div className="schedule-edit" style={{ flex: 1, minWidth: 0 }}>
                  <input className="field-input" style={{ marginBottom: '6px' }} value={editForm.video_url}
                    onChange={e => setEditForm(f => ({ ...f, video_url: e.target.value }))}
                    placeholder="YouTube URL" />
                  <textarea className="field-input" rows={2} value={editForm.scene_description}
                    onChange={e => setEditForm(f => ({ ...f, scene_description: e.target.value }))}
                    placeholder="Scene description" style={{ marginBottom: '6px' }} />
                  <div style={{ display: 'flex', gap: '6px' }}>
                    <button className="btn-primary" style={{ width: 'auto', padding: '5px 14px', fontSize: '12px' }}
                      onClick={() => saveEdit(item.video_id)}>Save</button>
                    <button className="btn-ghost" style={{ padding: '5px 14px', fontSize: '12px' }}
                      onClick={() => setEditId(null)}>Cancel</button>
                  </div>
                </div>
              ) : (
                <div className="schedule-meta">
                  <div className="schedule-desc">{item.scene_description || item.title || 'No description'}</div>
                  <div className="schedule-url">{item.video_url}</div>
                </div>
              )}

              {!isEditing && (
                <div className="schedule-actions">
                  <button className="action-btn" onClick={() => startEdit(item)}>Edit</button>
                  <button className="action-btn action-btn--del" onClick={() => handleDelete(item.video_id)}>Del</button>
                </div>
              )}
            </div>
          )
        })}
      </div>
    </div>
  )
}
