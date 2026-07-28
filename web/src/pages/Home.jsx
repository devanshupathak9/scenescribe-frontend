import { useState, useEffect, useRef } from 'react'
import { api } from '../api.js'

const SpeechRecognition = window.SpeechRecognition || window.webkitSpeechRecognition

function getYouTubeEmbedUrl(url) {
  if (!url) return null
  const match = url.match(/(?:youtu\.be\/|youtube\.com\/(?:watch\?v=|embed\/|shorts\/))([A-Za-z0-9_-]{11})/)
  if (!match) return null
  return `https://www.youtube.com/embed/${match[1]}?rel=0`
}

const DIFFICULTY_COLORS = {
  beginner:     '#4ade80',
  intermediate: '#f59e0b',
  advanced:     '#f87171',
}

function ScoreRing({ score }) {
  const r = 28, cx = 36, cy = 36
  const circumference = 2 * Math.PI * r
  const offset = circumference * (1 - score / 10)
  return (
    <svg width="72" height="72" style={{ transform: 'rotate(-90deg)' }}>
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="rgba(255,255,255,0.08)" strokeWidth="6" />
      <circle cx={cx} cy={cy} r={r} fill="none" stroke="#e8ff47" strokeWidth="6"
        strokeLinecap="round" strokeDasharray={circumference} strokeDashoffset={offset}
        style={{ transition: 'stroke-dashoffset 0.6s ease' }} />
      <text x={cx} y={cy + 1} textAnchor="middle" dominantBaseline="middle"
        fill="#f0f0f0" fontSize="20" fontFamily="Syne" fontWeight="700"
        style={{ transform: 'rotate(90deg)', transformOrigin: `${cx}px ${cy}px` }}>
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

// ── Single scene in the carousel ─────────────────────────────────────────────
function SceneSlide({ sceneItem, sceneIdx, input, setInput, onSubmit, startRecording, stopRecording }) {
  const { status, video, submission } = sceneItem
  const { text, inputType, submitting, submitError, isRecording } = input
  const embedUrl = getYouTubeEmbedUrl(video.video_url)

  if (status === 'pending') {
    return (
      <div className="carousel-slide-inner">
        <div className="video-block" style={{ marginBottom: '16px' }}>
          {embedUrl
            ? <iframe src={embedUrl} title={video.title}
                allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
                allowFullScreen />
            : <div className="video-placeholder">No video available</div>
          }
          {video.video_url && (
            <div className="video-url-badge">{video.video_url.replace('https://', '')}</div>
          )}
        </div>

        <div className="card input-card">
          <div className="section-label" style={{ marginBottom: '10px' }}>Your description</div>
          <div className="input-row">
            <textarea className="desc-textarea"
              placeholder="Describe what's happening in the video…"
              value={text}
              onChange={e => setInput(video.video_id, { text: e.target.value, inputType: 'keyboard', submitError: '' })}
              rows={4} />
            <button
              className={`mic-btn${isRecording ? ' mic-btn--active' : ''}`}
              onClick={() => isRecording ? stopRecording(video.video_id) : startRecording(video.video_id)}
              title={isRecording ? 'Stop recording' : 'Voice input'}>
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
          <button className="btn-primary btn-full" onClick={() => onSubmit(sceneItem, sceneIdx)}
            disabled={submitting || text.trim().length < 10}>
            {submitting ? <><span className="spinner" /> Analysing with AI…</> : 'Submit description'}
          </button>
        </div>
      </div>
    )
  }

  // status === 'submitted'
  return (
    <div className="carousel-slide-inner">
      <div className="video-block" style={{ marginBottom: '16px' }}>
        {embedUrl
          ? <iframe src={embedUrl} title={video.title}
              allow="accelerometer; autoplay; clipboard-write; encrypted-media; gyroscope; picture-in-picture"
              allowFullScreen />
          : <div className="video-placeholder">No video available</div>
        }
      </div>

      <div className="card result-card" style={{ marginBottom: '16px' }}>
        <div className={`input-badge${submission.input_type === 'microphone' ? ' input-badge--mic' : ' input-badge--kb'}`}>
          {submission.input_type === 'microphone' ? 'via microphone' : 'via keyboard'}
        </div>

        <div className="user-response-box">{submission.response_text}</div>

        <div className="score-row">
          <ScoreRing score={submission.score} />
          <div className="score-details">
            <div className="score-label">Overall score</div>
            <div className="score-display">
              <span className="score-big">{submission.score}</span>
              <span className="score-denom">/ 10</span>
            </div>
            <div className="score-praise" style={{
              color: submission.score >= 7 ? 'var(--success)' : submission.score >= 5 ? 'var(--warning)' : 'var(--danger)'
            }}>
              {submission.score >= 9 ? 'Excellent!' : submission.score >= 7 ? 'Great work!'
                : submission.score >= 5 ? 'Good effort!' : 'Keep practicing!'}
            </div>
          </div>
        </div>

        {submission.breakdown && (
          <div className="breakdown-grid">
            <ScoreCell value={submission.breakdown.grammar}    label="Grammar"    />
            <ScoreCell value={submission.breakdown.vocabulary} label="Vocabulary" />
            <ScoreCell value={submission.breakdown.clarity}    label="Clarity"    />
          </div>
        )}
      </div>

      <div className="card" style={{ marginBottom: '16px' }}>
        <div className="section-label" style={{ marginBottom: '14px' }}>AI Feedback</div>
        <SentenceBlock label="Improved sentence" text={submission.improved_ai_response} accentColor="#7c6fef" />
        <SentenceBlock label="Ideal sentence"    text={submission.ideal_sentence}       accentColor="#e8ff47" />

        {submission.feedback?.issues?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div className="suggestions-sublabel">Issues</div>
            <ul className="feedback-list" style={{ marginTop: '8px' }}>
              {submission.feedback.issues.map((item, i) => (
                <li key={i} className="feedback-item feedback-item--issue">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {submission.feedback?.suggestions?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div className="suggestions-sublabel">Suggestions</div>
            <ul className="feedback-list" style={{ marginTop: '8px' }}>
              {submission.feedback.suggestions.map((item, i) => (
                <li key={i} className="feedback-item feedback-item--suggestion">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      <div className="card">
        <div className="section-label" style={{ marginBottom: '14px' }}>Reference</div>
        <SentenceBlock label="Admin sentence" text={video.description}      accentColor="#888896" />
        <SentenceBlock label="Notes"          text={video.additional_notes} accentColor="#555566" />
      </div>
    </div>
  )
}

// ── Main Component ────────────────────────────────────────────────────────────
export default function Home({ user }) {
  const [scenes, setScenes]         = useState([])
  const [loading, setLoading]       = useState(true)
  const [error, setError]           = useState('')
  const [currentIdx, setCurrentIdx] = useState(0)
  const [sceneInputs, setSceneInputs] = useState({})  // { [videoId]: { text, inputType, submitting, submitError, isRecording } }
  const recognitionRef = useRef(null)

  useEffect(() => {
    api.get('/dashboard/today')
      .then(res => setScenes(res.data.scenes || []))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [])

  function getInput(videoId) {
    return sceneInputs[videoId] || { text: '', inputType: 'keyboard', submitting: false, submitError: '', isRecording: false }
  }

  const DEFAULT_INPUT = { text: '', inputType: 'keyboard', submitting: false, submitError: '', isRecording: false }

  function setInput(videoId, updates) {
    setSceneInputs(prev => ({
      ...prev,
      [videoId]: { ...(prev[videoId] || DEFAULT_INPUT), ...updates },
    }))
  }

  function startRecording(videoId) {
    if (!SpeechRecognition) {
      alert('Speech recognition is not supported in your browser. Please use Chrome or Edge.')
      return
    }
    if (recognitionRef.current) {
      recognitionRef.current.recognition.stop()
    }
    const recognition = new SpeechRecognition()
    recognition.continuous = true
    recognition.interimResults = true
    recognition.lang = 'en-US'

    let finalText = getInput(videoId).text
    recognition.onresult = (e) => {
      let interim = ''
      for (let i = e.resultIndex; i < e.results.length; i++) {
        if (e.results[i].isFinal) finalText += e.results[i][0].transcript + ' '
        else interim += e.results[i][0].transcript
      }
      setInput(videoId, { text: finalText + interim })
    }
    recognition.onerror = () => setInput(videoId, { isRecording: false })
    recognition.onend   = () => {
      setInput(videoId, { text: finalText.trim(), isRecording: false })
      recognitionRef.current = null
    }
    recognition.start()
    recognitionRef.current = { recognition, videoId }
    setInput(videoId, { isRecording: true, inputType: 'microphone' })
  }

  function stopRecording(videoId) {
    recognitionRef.current?.recognition?.stop()
    recognitionRef.current = null
    setInput(videoId, { isRecording: false })
  }

  async function handleSubmit(sceneItem, sceneIdx) {
    const videoId = sceneItem.video.video_id
    const { text, inputType } = getInput(videoId)

    if (text.trim().length < 10) {
      setInput(videoId, { submitError: 'Please write at least 10 characters describing the scene.' })
      return
    }
    setInput(videoId, { submitting: true, submitError: '' })
    try {
      const res = await api.post('/dashboard/submit', {
        video_id:      videoId,
        response_text: text.trim(),
        input_type:    inputType,
      })
      setScenes(prev => {
        const updated = [...prev]
        updated[sceneIdx] = {
          ...updated[sceneIdx],
          status: 'submitted',
          submission: { ...res.data, response_text: text.trim() },
        }
        return updated
      })
      setInput(videoId, { submitting: false })
    } catch (err) {
      setInput(videoId, { submitting: false, submitError: err.message })
    }
  }

  function goTo(idx) {
    // stop any active recording when switching scenes
    if (recognitionRef.current) {
      recognitionRef.current.recognition.stop()
      recognitionRef.current = null
    }
    setCurrentIdx(idx)
  }

  if (loading) {
    return <div className="loading-state"><span className="spinner" />Loading today's scenes…</div>
  }

  if (error || !scenes.length) {
    return (
      <div className="container page">
        <div className="empty-state">
          <div className="empty-icon">🎬</div>
          <h3>No scene scheduled for today.</h3>
          <p>Check back tomorrow — new content drops daily.</p>
        </div>
      </div>
    )
  }

  const today      = new Date().toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })
  const currentScene = scenes[currentIdx]
  const diffColor  = DIFFICULTY_COLORS[currentScene.video.difficulty] || '#888'
  const completedCount = scenes.filter(s => s.status === 'submitted').length

  return (
    <div className="container page">

      {/* ── Header ─────────────────────────────────────────────────────── */}
      <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '16px', flexWrap: 'wrap' }}>
        <span className="section-label">Today's Scenes — {today}</span>
        {currentScene.video.difficulty && (
          <span className="difficulty-badge" style={{
            background: diffColor + '22',
            color: diffColor,
            borderColor: diffColor + '55',
          }}>
            {currentScene.video.difficulty}
          </span>
        )}
        <span className="scene-progress-badge">
          {completedCount} / {scenes.length} done
        </span>
      </div>

      {/* Scene title */}
      <div style={{ marginBottom: '16px' }}>
        <h2 style={{ fontFamily: 'Syne', fontSize: '1.15rem', fontWeight: 700, color: 'var(--text)', marginBottom: '4px' }}>
          {currentScene.video.title}
        </h2>
      </div>

      {/* ── Carousel nav ───────────────────────────────────────────────── */}
      {scenes.length > 1 && (
        <div className="carousel-nav">
          <button
            className="carousel-nav-btn"
            onClick={() => goTo(Math.max(0, currentIdx - 1))}
            disabled={currentIdx === 0}
            aria-label="Previous scene">
            ←
          </button>

          <div className="carousel-dots">
            {scenes.map((s, i) => (
              <button
                key={i}
                className={`carousel-dot${i === currentIdx ? ' carousel-dot--active' : ''}${s.status === 'submitted' ? ' carousel-dot--done' : ''}`}
                onClick={() => goTo(i)}
                aria-label={`Scene ${i + 1}`}
              />
            ))}
          </div>

          <button
            className="carousel-nav-btn"
            onClick={() => goTo(Math.min(scenes.length - 1, currentIdx + 1))}
            disabled={currentIdx === scenes.length - 1}
            aria-label="Next scene">
            →
          </button>
        </div>
      )}

      {/* Scene counter label */}
      {scenes.length > 1 && (
        <div style={{ textAlign: 'center', marginBottom: '20px', fontSize: '12px', color: 'var(--muted)' }}>
          Scene {currentIdx + 1} of {scenes.length}
        </div>
      )}

      {/* ── Sliding track ──────────────────────────────────────────────── */}
      <div className="carousel-wrapper">
        <div
          className="carousel-track"
          style={{
            width: `${scenes.length * 100}%`,
            transform: `translateX(-${currentIdx * (100 / scenes.length)}%)`,
          }}>
          {scenes.map((sceneItem, idx) => (
            <div
              key={sceneItem.video.video_id}
              className="carousel-slide"
              style={{ width: `${100 / scenes.length}%` }}>
              <SceneSlide
                sceneItem={sceneItem}
                sceneIdx={idx}
                input={getInput(sceneItem.video.video_id)}
                setInput={setInput}
                onSubmit={handleSubmit}
                startRecording={startRecording}
                stopRecording={stopRecording}
              />
            </div>
          ))}
        </div>
      </div>

    </div>
  )
}
