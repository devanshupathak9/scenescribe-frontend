import { useState, useEffect } from 'react'
import { useParams, Link } from 'react-router-dom'
import { api } from '../api.js'

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

function SentenceBlock({ label, text, accentColor }) {
  if (!text) return null
  return (
    <div className="sentence-block" style={{ borderLeftColor: accentColor }}>
      <div className="sentence-label">{label}</div>
      <div className="sentence-text">{text}</div>
    </div>
  )
}

export default function Feedback() {
  const { id } = useParams()
  const [data, setData]       = useState(null)
  const [loading, setLoading] = useState(true)
  const [error, setError]     = useState('')

  useEffect(() => {
    api.get(`/profile/history/${id}`)
      .then(res => setData(res.data))
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id])

  if (loading) {
    return <div className="loading-state"><span className="spinner" /> Loading feedback…</div>
  }

  if (error) {
    return (
      <div className="container page">
        <div className="error-msg">{error}</div>
        <Link to="/" className="btn-secondary" style={{ marginTop: '16px', display: 'inline-block' }}>← Back</Link>
      </div>
    )
  }

  const {
    video, response_text, input_type, score, breakdown,
    feedback, improved_ai_response, ideal_sentence, date,
  } = data

  const formattedDate = new Date(date).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' })

  return (
    <div className="container page">
      <div className="section-label" style={{ marginBottom: '16px' }}>
        {formattedDate} — {video?.title}
      </div>

      {/* 1 · User sentence + scores */}
      <div className="card result-card">
        <div className={`input-badge${input_type === 'microphone' ? ' input-badge--mic' : ' input-badge--kb'}`}>
          {input_type === 'microphone' ? 'via microphone' : 'via keyboard'}
        </div>

        <div className="user-response-box">{response_text}</div>

        <div className="score-row">
          <ScoreRing score={score} />
          <div className="score-details">
            <div className="score-label">Overall score</div>
            <div className="score-display">
              <span className="score-big">{score}</span>
              <span className="score-denom">/ 10</span>
            </div>
            <div className="score-praise" style={{ color: score >= 7 ? 'var(--success)' : score >= 5 ? 'var(--warning)' : 'var(--danger)' }}>
              {score >= 9 ? 'Excellent!' : score >= 7 ? 'Great work!' : score >= 5 ? 'Good effort!' : 'Keep practicing!'}
            </div>
          </div>
        </div>

        {breakdown && (
          <div className="breakdown-grid">
            {[['grammar', 'Grammar'], ['vocabulary', 'Vocabulary'], ['clarity', 'Clarity']].map(([k, label]) => {
              const v = breakdown[k]
              const color = v >= 8 ? '#4ade80' : v >= 5 ? '#f59e0b' : '#f87171'
              return (
                <div key={k} className="breakdown-cell">
                  <div className="breakdown-value" style={{ color }}>{v ?? '–'}</div>
                  <div className="breakdown-label">{label}</div>
                </div>
              )
            })}
          </div>
        )}
      </div>

      {/* 2 · AI feedback */}
      <div className="card" style={{ marginTop: '12px' }}>
        <div className="section-label" style={{ marginBottom: '14px' }}>AI Feedback</div>

        <SentenceBlock label="Improved sentence" text={improved_ai_response} accentColor="#7c6fef" />
        <SentenceBlock label="Ideal sentence"    text={ideal_sentence}       accentColor="#e8ff47" />

        {feedback?.issues?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div className="suggestions-sublabel">Issues</div>
            <ul className="feedback-list" style={{ marginTop: '8px' }}>
              {feedback.issues.map((item, i) => (
                <li key={i} className="feedback-item feedback-item--issue">{item}</li>
              ))}
            </ul>
          </div>
        )}

        {feedback?.suggestions?.length > 0 && (
          <div style={{ marginTop: '14px' }}>
            <div className="suggestions-sublabel">Suggestions</div>
            <ul className="feedback-list" style={{ marginTop: '8px' }}>
              {feedback.suggestions.map((item, i) => (
                <li key={i} className="feedback-item feedback-item--suggestion">{item}</li>
              ))}
            </ul>
          </div>
        )}
      </div>

      {/* 3 · Admin section */}
      <div className="card" style={{ marginTop: '12px' }}>
        <div className="section-label" style={{ marginBottom: '14px' }}>Admin</div>
        <SentenceBlock label="Admin sentence" text={video?.description}      accentColor="#888896" />
        <SentenceBlock label="Notes"          text={video?.additional_notes} accentColor="#555566" />
      </div>

      <div style={{ display: 'flex', gap: '10px', marginTop: '20px', flexWrap: 'wrap' }}>
        <Link to="/profile" className="btn-secondary">← Back to Profile</Link>
        <Link to="/" className="btn-primary">Today's Scene</Link>
      </div>
    </div>
  )
}
