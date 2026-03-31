import { useState, useEffect } from 'react'
import { api } from '../api.js'

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

const EMPTY_VOCAB = { word: '', definition: '', example: '' }
const EMPTY_GRAMMAR = { pattern: '', explanation: '', example: '' }

export default function Admin() {
  const [tab, setTab] = useState('upload')
  const [analytics, setAnalytics] = useState(null)
  const [scenes, setScenes] = useState(null)
  const [analyticsLoading, setAnalyticsLoading] = useState(false)
  const [scenesLoading, setScenesLoading] = useState(false)
  const [dateFilter, setDateFilter] = useState('')

  // Upload form state
  const [form, setForm] = useState({
    title: '',
    description: '',
    youtube_url: '',
    reference_description: '',
    publish_date: new Date().toISOString().split('T')[0],
    language: 'English',
    difficulty: 'intermediate',
  })
  const [vocabs, setVocabs] = useState([{ ...EMPTY_VOCAB }])
  const [grammars, setGrammars] = useState([{ ...EMPTY_GRAMMAR }])
  const [uploading, setUploading] = useState(false)
  const [uploadError, setUploadError] = useState('')
  const [uploadSuccess, setUploadSuccess] = useState('')

  useEffect(() => {
    if (tab === 'analytics' && !analytics) {
      setAnalyticsLoading(true)
      api.get('/admin/analytics')
        .then(setAnalytics)
        .catch(() => {})
        .finally(() => setAnalyticsLoading(false))
    }
    if (tab === 'scenes') {
      loadScenes(dateFilter)
    }
  }, [tab])

  function loadScenes(date) {
    setScenesLoading(true)
    const query = date ? `?date=${date}` : ''
    api.get(`/admin/scenes${query}`)
      .then(setScenes)
      .catch(() => {})
      .finally(() => setScenesLoading(false))
  }

  function handleDateFilter(e) {
    const d = e.target.value
    setDateFilter(d)
    loadScenes(d)
  }

  function handleFormChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setUploadError('')
    setUploadSuccess('')
  }

  function updateVocab(i, field, val) {
    setVocabs(v => v.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }
  function addVocab() { setVocabs(v => [...v, { ...EMPTY_VOCAB }]) }
  function removeVocab(i) { setVocabs(v => v.filter((_, idx) => idx !== i)) }

  function updateGrammar(i, field, val) {
    setGrammars(g => g.map((item, idx) => idx === i ? { ...item, [field]: val } : item))
  }
  function addGrammar() { setGrammars(g => [...g, { ...EMPTY_GRAMMAR }]) }
  function removeGrammar(i) { setGrammars(g => g.filter((_, idx) => idx !== i)) }

  async function handleUpload(e) {
    e.preventDefault()
    if (!form.youtube_url) {
      setUploadError('Please provide a YouTube video URL.')
      return
    }
    if (!form.title || !form.publish_date) {
      setUploadError('Title and publish date are required.')
      return
    }

    setUploading(true)
    setUploadError('')
    setUploadSuccess('')

    const filteredVocabs = vocabs.filter(v => v.word.trim() && v.definition.trim())
    const filteredGrammars = grammars.filter(g => g.pattern.trim() && g.explanation.trim())

    try {
      await api.post('/admin/scenes', {
        title: form.title,
        description: form.description,
        youtube_url: form.youtube_url,
        reference_description: form.reference_description,
        publish_date: form.publish_date,
        language: form.language,
        difficulty: form.difficulty,
        vocabularies: filteredVocabs,
        grammars: filteredGrammars,
      })
      setUploadSuccess('Scene created successfully!')
      setForm({
        title: '',
        description: '',
        youtube_url: '',
        reference_description: '',
        publish_date: new Date().toISOString().split('T')[0],
        language: 'English',
        difficulty: 'intermediate',
      })
      setVocabs([{ ...EMPTY_VOCAB }])
      setGrammars([{ ...EMPTY_GRAMMAR }])
      setScenes(null)
    } catch (err) {
      setUploadError(err.message)
    } finally {
      setUploading(false)
    }
  }

  async function handleDeleteScene(id) {
    if (!confirm('Delete this scene? This cannot be undone.')) return
    try {
      await api.delete(`/admin/scenes/${id}`)
      setScenes(prev => prev ? prev.filter(sc => sc.id !== id) : prev)
    } catch (err) {
      alert(err.message)
    }
  }

  return (
    <div className="container-wide page">
      <div className="page-header">
        <div>
          <h1 className="page-title">Admin Dashboard</h1>
          <p className="page-subtitle">Manage scenes and view analytics</p>
        </div>
      </div>

      <div className="tabs">
        <button className={`tab-btn${tab === 'upload' ? ' active' : ''}`} onClick={() => setTab('upload')}>
          Add Scene
        </button>
        <button className={`tab-btn${tab === 'analytics' ? ' active' : ''}`} onClick={() => setTab('analytics')}>
          Analytics
        </button>
        <button className={`tab-btn${tab === 'scenes' ? ' active' : ''}`} onClick={() => setTab('scenes')}>
          All Scenes
        </button>
      </div>

      {/* Upload Scene Tab */}
      {tab === 'upload' && (
        <form onSubmit={handleUpload}>
          {uploadError && <div className="error-msg">{uploadError}</div>}
          {uploadSuccess && <div className="success-msg">✓ {uploadSuccess}</div>}

          <div className="admin-form-grid">
            <div>
              <div className="card" style={{ marginBottom: '16px' }}>
                <h3 style={{ fontWeight: 700, marginBottom: '16px', fontSize: '0.95rem' }}>Scene Details</h3>

                <div className="form-group">
                  <label className="form-label">Title *</label>
                  <input className="form-input" name="title" value={form.title}
                    onChange={handleFormChange} placeholder="e.g. Morning at the Café" required />
                </div>

                <div className="form-group">
                  <label className="form-label">YouTube Video URL *</label>
                  <input className="form-input" name="youtube_url" value={form.youtube_url}
                    onChange={handleFormChange} placeholder="https://www.youtube.com/watch?v=..." required />
                  {form.youtube_url && (
                    <p style={{ fontSize: '0.78rem', color: 'var(--success)', marginTop: '4px' }}>
                      ✓ YouTube URL set
                    </p>
                  )}
                </div>

                <div className="form-group">
                  <label className="form-label">Scene Description</label>
                  <textarea className="form-input" name="description" value={form.description}
                    onChange={handleFormChange} rows={2} placeholder="Brief description of the scene…" />
                </div>

                <div className="form-group">
                  <label className="form-label">Reference Description (benchmark for AI scoring)</label>
                  <textarea className="form-input" name="reference_description" value={form.reference_description}
                    onChange={handleFormChange} rows={4}
                    placeholder="Write an ideal description of this scene. The AI will compare student submissions against this…" />
                </div>

                <div className="admin-meta-grid">
                  <div className="form-group">
                    <label className="form-label">Publish Date *</label>
                    <input className="form-input" type="date" name="publish_date"
                      value={form.publish_date} onChange={handleFormChange} required />
                  </div>
                  <div className="form-group">
                    <label className="form-label">Language</label>
                    <input className="form-input" name="language" value={form.language}
                      onChange={handleFormChange} placeholder="English" />
                  </div>
                </div>

                <div className="form-group">
                  <label className="form-label">Difficulty</label>
                  <select className="form-input" name="difficulty" value={form.difficulty} onChange={handleFormChange}>
                    <option value="beginner">Beginner</option>
                    <option value="intermediate">Intermediate</option>
                    <option value="advanced">Advanced</option>
                  </select>
                </div>
              </div>
            </div>

            <div>
              {/* Vocabulary */}
              <div className="card" style={{ marginBottom: '16px' }}>
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Vocabulary</h3>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addVocab}>+ Add</button>
                </div>
                <div className="dynamic-list">
                  {vocabs.map((v, i) => (
                    <div key={i} className="dynamic-item">
                      <div className="dynamic-item-fields">
                        <input className="form-input" placeholder="Word" value={v.word}
                          onChange={e => updateVocab(i, 'word', e.target.value)} />
                        <input className="form-input" placeholder="Definition" value={v.definition}
                          onChange={e => updateVocab(i, 'definition', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="form-input" placeholder="Example sentence (optional)" value={v.example}
                          onChange={e => updateVocab(i, 'example', e.target.value)} style={{ flex: 1 }} />
                        {vocabs.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeVocab(i)}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>

              {/* Grammar */}
              <div className="card">
                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '12px' }}>
                  <h3 style={{ fontWeight: 700, fontSize: '0.95rem' }}>Grammar Patterns</h3>
                  <button type="button" className="btn btn-ghost btn-sm" onClick={addGrammar}>+ Add</button>
                </div>
                <div className="dynamic-list">
                  {grammars.map((g, i) => (
                    <div key={i} className="dynamic-item">
                      <div className="dynamic-item-fields">
                        <input className="form-input" placeholder="Pattern (e.g. Subject + had + V3)" value={g.pattern}
                          onChange={e => updateGrammar(i, 'pattern', e.target.value)} />
                        <input className="form-input" placeholder="Explanation" value={g.explanation}
                          onChange={e => updateGrammar(i, 'explanation', e.target.value)} />
                      </div>
                      <div style={{ display: 'flex', gap: '8px' }}>
                        <input className="form-input" placeholder="Example (optional)" value={g.example}
                          onChange={e => updateGrammar(i, 'example', e.target.value)} style={{ flex: 1 }} />
                        {grammars.length > 1 && (
                          <button type="button" className="btn btn-danger btn-sm" onClick={() => removeGrammar(i)}>✕</button>
                        )}
                      </div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          </div>

          <div style={{ marginTop: '24px' }}>
            <button type="submit" className="btn btn-primary btn-lg" disabled={uploading}>
              {uploading ? <><span className="spinner" /> Saving…</> : 'Save Scene'}
            </button>
          </div>
        </form>
      )}

      {/* Analytics Tab */}
      {tab === 'analytics' && (
        <div>
          {analyticsLoading && (
            <div className="loading-state"><span className="spinner spinner-lg" /></div>
          )}
          {analytics && (
            <>
              <div className="admin-grid">
                <div className="analytics-card">
                  <div className="label">Total Users</div>
                  <div className="value" style={{ color: 'var(--accent-light)' }}>{analytics.total_users}</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Total Submissions</div>
                  <div className="value" style={{ color: 'var(--success)' }}>{analytics.total_submissions}</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Total Scenes</div>
                  <div className="value" style={{ color: 'var(--info)' }}>{analytics.total_scenes}</div>
                </div>
                <div className="analytics-card">
                  <div className="label">Avg Score (/10)</div>
                  <div className="value" style={{ color: 'var(--warning)' }}>{analytics.average_score}</div>
                </div>
              </div>

              {analytics.recent_submissions?.length > 0 && (
                <div className="card" style={{ overflowX: 'auto' }}>
                  <h3 style={{ fontWeight: 700, marginBottom: '16px' }}>Recent Submissions</h3>
                  <table style={{ width: '100%', borderCollapse: 'collapse', fontSize: '0.875rem', minWidth: '400px' }}>
                    <thead>
                      <tr style={{ color: 'var(--text-muted)', textAlign: 'left' }}>
                        <th style={{ padding: '8px 0', fontWeight: 600 }}>User</th>
                        <th style={{ padding: '8px 0', fontWeight: 600 }}>Scene</th>
                        <th style={{ padding: '8px 0', fontWeight: 600 }}>Score</th>
                        <th style={{ padding: '8px 0', fontWeight: 600 }}>Date</th>
                      </tr>
                    </thead>
                    <tbody>
                      {analytics.recent_submissions.map(sub => (
                        <tr key={sub.id} style={{ borderTop: '1px solid var(--border)' }}>
                          <td style={{ padding: '10px 0', color: 'var(--text-2)' }}>{sub.User?.username}</td>
                          <td style={{ padding: '10px 0', color: 'var(--text-2)' }}>{sub.Scene?.title}</td>
                          <td style={{ padding: '10px 0', fontWeight: 700 }}>{sub.score}/10 <span style={{ color: 'var(--text-muted)', fontWeight: 400 }}>({sub.grade})</span></td>
                          <td style={{ padding: '10px 0', color: 'var(--text-muted)' }}>{formatDate(sub.createdAt)}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              )}
            </>
          )}
        </div>
      )}

      {/* All Scenes Tab */}
      {tab === 'scenes' && (
        <div>
          <div style={{ marginBottom: '16px', display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            <label className="form-label" style={{ margin: 0 }}>Filter by date:</label>
            <input
              className="form-input"
              type="date"
              value={dateFilter}
              onChange={handleDateFilter}
              style={{ width: 'auto' }}
            />
            {dateFilter && (
              <button
                className="btn btn-ghost btn-sm"
                onClick={() => { setDateFilter(''); loadScenes('') }}
              >
                Clear
              </button>
            )}
          </div>

          {scenesLoading && (
            <div className="loading-state"><span className="spinner spinner-lg" /></div>
          )}
          {!scenesLoading && scenes && scenes.length === 0 && (
            <div className="empty-state">
              <span className="icon">🎬</span>
              <h3>No scenes found</h3>
              <p>{dateFilter ? 'No scenes for this date.' : 'Add your first scene using the Add Scene tab.'}</p>
            </div>
          )}
          {!scenesLoading && scenes && scenes.length > 0 && (
            <div>
              {scenes.map(sc => (
                <div key={sc.id} className="scene-list-item">
                  <div style={{ fontSize: '1.5rem' }}>🎬</div>
                  <div className="scene-list-info">
                    <div className="scene-list-title">{sc.title}</div>
                    <div className="scene-list-meta">
                      {formatDate(sc.publish_date)} · {sc.difficulty} · {sc.language} ·{' '}
                      {sc.vocabularies?.length || 0} vocab · {sc.grammars?.length || 0} grammar ·{' '}
                      {sc.submission_count || 0} submissions
                      {sc.reference_description && (
                        <span style={{ color: 'var(--success)', marginLeft: '6px' }}>· reference set</span>
                      )}
                    </div>
                  </div>
                  <button
                    className="btn btn-danger btn-sm"
                    onClick={() => handleDeleteScene(sc.id)}
                  >
                    Delete
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>
      )}
    </div>
  )
}
