import { useState, useEffect, useRef } from 'react'
import { useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}`
}

const gradeColor = { A: 'badge-green', B: 'badge-blue', C: 'badge-orange', D: 'badge-orange', F: 'badge-purple' }

export default function Home({ user, updateUser }) {
  const [scene, setScene] = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  // submittedResult: { submission_id, score, grade, points_awarded, text_content }
  const [submittedResult, setSubmittedResult] = useState(null)
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)
  const navigate = useNavigate()

  useEffect(() => {
    api.get('/scenes/today')
      .then(data => {
        setScene(data)
        if (data.user_submission) {
          setSubmittedResult({
            submission_id: data.user_submission.id,
            score: data.user_submission.score,
            grade: data.user_submission.grade,
            points_awarded: data.user_submission.points_awarded,
            text_content: data.user_submission.text_content,
          })
        }
      })
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
      setSubmittedResult({
        submission_id: result.submission_id,
        score: result.score,
        grade: result.grade,
        points_awarded: result.points_awarded,
        text_content: text.trim(),
      })
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
        {getYouTubeEmbedUrl(scene.youtube_url) ? (
          <iframe
            src={getYouTubeEmbedUrl(scene.youtube_url)}
            title={scene.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-placeholder">No video available</div>
        )}
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

      {/* ── BEFORE SUBMISSION: only show the describe form ── */}
      {!submittedResult && (
        <form onSubmit={handleSubmit} className="describe-section">
          <p className="section-title">✍️ Describe the Scene</p>
          <div>
            <label className="form-label">Your description</label>
            <textarea
              className="form-input"
              placeholder="Watch the video and describe what you see…"
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

      {/* ── AFTER SUBMISSION: show result + theory, block resubmission ── */}
      {submittedResult && (
        <>
          {/* Score card */}
          <div className="card" style={{ marginTop: '24px' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', flexWrap: 'wrap' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '2.5rem', fontWeight: 700, color: 'var(--primary)' }}>
                  {submittedResult.score}<span style={{ fontSize: '1.2rem', color: 'var(--text-2)' }}>/10</span>
                </div>
                <span className={`badge ${gradeColor[submittedResult.grade] || 'badge-blue'}`} style={{ fontSize: '1rem', padding: '4px 14px' }}>
                  Grade: {submittedResult.grade}
                </span>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontWeight: 600, marginBottom: '4px' }}>✅ Submitted!</div>
                <div style={{ fontSize: '0.85rem', color: 'var(--text-2)' }}>
                  +{submittedResult.points_awarded} pts earned · Come back tomorrow for a new scene
                </div>
              </div>
              <button
                className="btn btn-secondary"
                onClick={() => navigate(`/feedback/${submittedResult.submission_id}`)}
              >
                View Full Feedback →
              </button>
            </div>

            {/* Their submission text */}
            <div style={{ marginTop: '16px' }}>
              <div className="form-label" style={{ marginBottom: '6px' }}>Your submission</div>
              <div style={{
                background: 'var(--surface-2)',
                borderRadius: '8px',
                padding: '12px 16px',
                fontSize: '0.9rem',
                color: 'var(--text-1)',
                lineHeight: 1.6,
                whiteSpace: 'pre-wrap',
              }}>
                {submittedResult.text_content}
              </div>
            </div>
          </div>

          {/* Theory section */}
          <div style={{ marginTop: '32px' }}>
            <p className="section-title">📚 Theory</p>

            {scene.vocabularies?.length > 0 && (
              <>
                <p className="section-title" style={{ fontSize: '0.85rem', marginTop: '12px' }}>Vocabulary</p>
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
                <p className="section-title" style={{ fontSize: '0.85rem', marginTop: '12px' }}>Grammar Patterns</p>
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
                <h3>No theory content for this scene</h3>
              </div>
            )}
          </div>
        </>
      )}
    </div>
  )
}
