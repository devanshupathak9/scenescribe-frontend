import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}?rel=0`
}

function ScoreRing({ score }) {
  const r = 28
  const cx = 36
  const cy = 36
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 10)
  return (
    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle
        cx={cx} cy={cy} r={r} fill="none"
        stroke="#e8ff47" strokeWidth="6"
        strokeLinecap="round"
        strokeDasharray={circumference}
        strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }}
      />
      <text
        x={cx} y={cy + 1}
        textAnchor="middle" dominantBaseline="middle"
        fill="#f0f0f0"
        fontSize="20" fontFamily="Syne" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}
      >
        {score}
      </text>
    </svg>
  )
}

function ScoreCell({ value, label }) {
  const color = value >= 8 ? '#4ade80' : value >= 5 ? '#f59e0b' : '#f87171'
  return (
    <div className="breakdown-cell">
      <div className="breakdown-value" style={{ color }}>{value ?? '–'}</div>
      <div className="breakdown-label">{label}</div>
    </div>
  )
}

function SentenceBlock({ label, text, accentColor }) {
  if (!text) return null
  return (
    <div className="sentence-block" style={{ borderLeftColor: accentColor }}>
      <div className="sentence-label">{label}</div>
      <div className="sentence-text">{text}</div>
    </div>
  )
}

export default function Home({ user }) {
  const [data, setData] = useState(null)          // full API response data
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [text, setText] = useState('')
  const [inputType, setInputType] = useState('keyboard')
  const [submitting, setSubmitting] = useState(false)
  const [submitError, setSubmitError] = useState('')
  const [isRecording, setIsRecording] = useState(false)
  const recognitionRef = useRef(null)

  useEffect(() => {
    api.get('/dashboard/today')
      .then(res => setData(res.data))
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
    setInputType('microphone')
  }

  function stopRecording() {
    recognitionRef.current?.stop()
    recognitionRef.current = null
    setIsRecording(false)
  }

  async function handleSubmit() {
    if (text.trim().length < 10) {
      setSubmitError('Please write at least 10 characters describing the scene.')
      return
    }
    setSubmitting(true)
    setSubmitError('')
    try {
      const res = await api.post('/dashboard/submit', {
        video_id: data.video.video_id,
        response_text: text.trim(),
        input_type: inputType,
      })
      // Update local state with submission result
      setData(prev => ({
        ...prev,
        status: 'submitted',
        submission: {
          ...res.data,
          response_text: text.trim(),
        },
      }))
    } catch (err) {
      setSubmitError(err.message)
    } finally {
      setSubmitting(false)
    }
  }

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner" />
        Loading today's scene…
      </div>
    )
  }

  if (error) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>No scene available today</h3>
          <p>{error}</p>
        </div>
      </div>
    )
  }

  const { status, video, submission } = data
  const today = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const embedUrl = getYouTubeEmbedUrl(video.video_url)

  return (
    <div className="container page">
      <div className="section-label">Today's Scene — {today}</div>

      {/* Video Block */}
      <div className={`video-block${status === 'submitted' ? ' video-block--small' : ''}`}>
        {embedUrl ? (
          <iframe
            src={embedUrl}
            title={video.title}
            allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
            allowFullScreen
          />
        ) : (
          <div className="video-placeholder">No video available</div>
        )}
        {video.video_url && (
          <div className="video-url-badge">{video.video_url.replace('https://', '')}</div>
        )}
      </div>

      {/* BEFORE SUBMISSION */}
      {status === 'pending' && (
        <div className="card input-card">
          <div className="section-label" style={{ marginBottom: '10px' }}>Your description</div>
          <div className="input-row">
            <textarea
              className="desc-textarea"
              placeholder="Describe what's happening in the video…"
              value={text}
              onChange={e => { setText(e.target.value); setInputType('keyboard'); setSubmitError('') }}
              rows={4}
            />
            <button
              className={`mic-btn${isRecording ? ' mic-btn--active' : ''}`}
              onClick={isRecording ? stopRecording : startRecording}
              title={isRecording ? 'Stop recording' : 'Voice input'}
            >
              <svg width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
                <path d="M12 1a3 3 0 0 0-3 3v8a3 3 0 0 0 6 0V4a3 3 0 0 0-3-3z" />
                <path d="M19 10v2a7 7 0 0 1-14 0v-2" />
                <line x1="12" y1="19" x2="12" y2="23" />
                <line x1="8" y1="23" x2="16" y2="23" />
              </svg>
            </button>
          </div>
          {isRecording && <div className="recording-indicator">● Listening…</div>}
          {submitError && <div className="error-msg">{submitError}</div>}
          <button
            className="btn-primary btn-full"
            onClick={handleSubmit}
            disabled={submitting || text.trim().length < 10}
          >
            {submitting ? <><span className="spinner" /> Analysing with AI…</> : 'Submit description'}
          </button>
        </div>
      )}

      {/* AFTER SUBMISSION */}
      {status === 'submitted' && submission && (
        <>
          {/* Response + Score Card */}
          <div className="card result-card">
            {/* Input type badge */}
            <div className={`input-badge${submission.input_type === 'microphone' ? ' input-badge--mic' : ' input-badge--kb'}`}>
              {submission.input_type === 'microphone' ? 'via microphone' : 'via keyboard'}
            </div>

            {/* User's response */}
            <div className="user-response-box">
              {submission.response_text}
            </div>

            {/* Score row */}
            <div className="score-row">
              <ScoreRing score={submission.score} />
              <div className="score-details">
                <div className="score-label">Overall score</div>
                <div className="score-display">
                  <span className="score-big">{submission.score}</span>
                  <span className="score-denom">/ 10</span>
                </div>
                <div className="score-praise">
                  {submission.score >= 9 ? 'Excellent!' : submission.score >= 7 ? 'Great work!' : submission.score >= 5 ? 'Good effort!' : 'Keep practicing!'}
                </div>
              </div>
            </div>

            {/* Score breakdown */}
            {submission.breakdown && (
              <div className="breakdown-grid">
                <ScoreCell value={submission.breakdown.grammar} label="Grammar" />
                <ScoreCell value={submission.breakdown.vocabulary} label="Vocabulary" />
                <ScoreCell value={submission.breakdown.clarity} label="Clarity" />
              </div>
            )}
          </div>

          {/* Sentences Card */}
          <div className="card" style={{ marginTop: '12px' }}>
            <div className="section-label" style={{ marginBottom: '14px' }}>Sentences</div>
            <SentenceBlock label="Your response" text={submission.response_text} accentColor="#888896" />
            <SentenceBlock label="AI suggested" text={submission.feedback?.ai_suggestion} accentColor="#7c6fef" />
            <SentenceBlock label="Admin reference" text={video.reference_description} accentColor="#e8ff47" />
          </div>

          {/* Suggestions Card */}
          {(submission.feedback?.vocab_notes?.length > 0 || submission.feedback?.grammar_notes?.length > 0) && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div className="section-label" style={{ marginBottom: '14px' }}>Suggestions</div>

              {submission.feedback.vocab_notes?.length > 0 && (
                <div className="suggestions-section">
                  <div className="suggestions-sublabel">Better vocabulary</div>
                  <div className="chips-row">
                    {submission.feedback.vocab_notes.map((note, i) => (
                      <span key={i} className="chip chip--vocab">{note}</span>
                    ))}
                  </div>
                </div>
              )}

              {submission.feedback.grammar_notes?.length > 0 && (
                <div className="suggestions-section" style={{ marginTop: '12px' }}>
                  <div className="suggestions-sublabel">Grammar fixes</div>
                  <div className="chips-row">
                    {submission.feedback.grammar_notes.map((note, i) => (
                      <span key={i} className="chip chip--grammar">{note}</span>
                    ))}
                  </div>
                </div>
              )}
            </div>
          )}

          {/* Corrections */}
          {submission.feedback?.corrections?.length > 0 && (
            <div className="card" style={{ marginTop: '12px' }}>
              <div className="section-label" style={{ marginBottom: '14px' }}>Corrections</div>
              {submission.feedback.corrections.map((c, i) => (
                <div key={i} className="correction-item">
                  <div className="correction-original">✗ {c.original}</div>
                  <div className="correction-corrected">✓ {c.corrected}</div>
                  {c.explanation && <div className="correction-explanation">{c.explanation}</div>}
                </div>
              ))}
            </div>
          )}
        </>
      )}
    </div>
  )
}
