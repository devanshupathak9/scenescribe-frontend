import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

export default function Home({ user, updateUser }) {
  const [scene, setScene] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [tab, setTab] = useState('theory')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/scenes/today')
      .then(setScene)
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function startRecording() {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'
    recognitionRef.current = recognition

    let finalTranscript = text

    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) {
          finalTranscript += e.results[i][0].transcript + ' '
        } else {
          interim += e.results[i][0].transcript
        }
      }
      setText(finalTranscript + interim)
    }

    recognition.onerror = () => setIsRecording(false)
    recognition.onend = () => {
      setText(finalTranscript.trim())
      setIsRecording(false)
    }

    recognition.start()
    setIsRecording(true)
  }

  function stopRecording() {
    if (recognitionRef.current) {
      recognitionRef.current.stop()
      recognitionRef.current = null
    }
    setIsRecording(false)
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (text.trim().length < 10) {
      setSubmitError('Please write at least 10 characters describing the scene.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const result = await api.post('/submissions', {
        scene_id: scene.id,
        text_content: text.trim(),
      })
      updateUser({
        ...user,
        streak: result.new_streak,
        total_points: result.total_points,
      })
      navigate(`/feedback/${result.submission_id}`, { state: result })
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner spinner-lg" />
        Loading today's scene…
      </div>
    )
  }

  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">
          <span className="icon">🎬</span>
          <h3>No scene available today</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const difficultyBadge = {
    easy: 'badge-green',
    intermediate: 'badge-orange',
    hard: 'badge-purple',
  }[scene.difficulty] || 'badge-blue'

  return (
    <div className="container page">
      <div className="today-badge">
        📅 Today's Scene
      </div>

      {/* Video Player */}
      <div className="scene-video-wrap">
        <video
          src={scene.video_url}
          controls
          preload="metadata"
          key={scene.id}
        />
      </div>

      {/* Scene header */}
      <div className="scene-header">
        <div>
          <h1 className="scene-title">{scene.title}</h1>
          <div className="scene-meta">
            <span className={`badge ${difficultyBadge}`}>{scene.difficulty}</span>
            <span className="badge badge-blue">{scene.language}</span>
            {scene.submission_count > 0 && (
              <span className="badge badge-purple">
                {scene.submission_count} submissions
              </span>
            )}
          </div>
          {scene.description && (
            <p style={{ color: 'var(--text-2)', fontSize: '0.875rem', marginTop: '10px', maxWidth: '600px' }}>
              {scene.description}
            </p>
          )}
        </div>
      </div>

      {/* Tabs */}
      <div className="tabs">
        <button
          className={`tab-btn${tab === 'theory' ? ' active' : ''}`}
          onClick={() => setTab('theory')}
        >
          📚 Theory
        </button>
        <button
          className={`tab-btn${tab === 'describe' ? ' active' : ''}`}
          onClick={() => setTab('describe')}
        >
          ✍️ Describe
        </button>
      </div>

      {/* Theory tab */}
      {tab === 'theory' && (
        <div>
          {scene.vocabularies?.length > 0 && (
            <>
              <p className="section-title">Vocabulary</p>
              <div className="vocab-grid">
                {scene.vocabularies.map(v => (
                  <div className="vocab-card" key={v.id}>
                    <div className="vocab-word">{v.word}</div>
                    <div className="vocab-def">{v.definition}</div>
                    {v.example && <div className="vocab-example">"{v.example}"</div>}
                  </div>
                ))}
              </div>
            </>
          )}

          {scene.grammars?.length > 0 && (
            <>
              <p className="section-title">Grammar Patterns</p>
              <div className="grammar-list">
                {scene.grammars.map(g => (
                  <div className="grammar-item" key={g.id}>
                    <div className="grammar-pattern">{g.pattern}</div>
                    <div className="grammar-explanation">{g.explanation}</div>
                    {g.example && (
                      <div className="vocab-example" style={{ marginTop: '6px' }}>"{g.example}"</div>
                    )}
                  </div>
                ))}
              </div>
            </>
          )}

          {!scene.vocabularies?.length && !scene.grammars?.length && (
            <div className="empty-state">
              <span className="icon">📝</span>
              <h3>No theory content</h3>
              <p>Jump to the Describe tab and start writing!</p>
            </div>
          )}

          <div style={{ marginTop: '24px' }}>
            <button className="btn btn-primary" onClick={() => setTab('describe')}>
              Ready to describe →
            </button>
          </div>
        </div>
      )}

      {/* Describe tab */}
      {tab === 'describe' && (
        <form onSubmit={handleSubmit} className="describe-section">
          <div>
            <label className="form-label">Your description</label>
            <textarea
              className="form-input"
              placeholder="Watch the video and describe what you see. Try to use the vocabulary and grammar patterns from the Theory tab…"
              value={text}
              onChange={e => { setText(e.target.value); setSubmitError('') }}
              rows={7}
            />
            <div className="char-count">{text.length} characters</div>
          </div>

          <div className="voice-controls">
            {SpeechRecognition ? (
              <button
                type="button"
                className={`btn-record${isRecording ? ' recording' : ''}`}
                onClick={isRecording ? stopRecording : startRecording}
              >
                <span className="record-dot" />
                {isRecording ? 'Stop Recording' : 'Voice Input'}
              </button>
            ) : (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
                Voice input requires Chrome/Edge
              </span>
            )}
            {isRecording && (
              <span style={{ fontSize: '0.8rem', color: 'var(--danger)', fontWeight: 600 }}>
                Listening…
              </span>
            )}
          </div>

          {submitError && <div className="error-msg">{submitError}</div>}

          <div className="submit-row">
            <button
              type="submit"
              className="btn btn-primary btn-lg"
              disabled={submitting || text.trim().length < 10}
            >
              {submitting
                ? <><span className="spinner" /> Processing with AI…</>
                : '⚡ Submit for Feedback'
              }
            </button>
            <span style={{ fontSize: '0.78rem', color: 'var(--text-muted)' }}>
              Min. 10 characters
            </span>
          </div>
        </form>
      )}
    </div>
  )
}
