import { useState, useEffect } from 'react'
import { useParams, useLocation, Link, useNavigate } from 'react-router-dom'
import { api } from '../api.js'

const GRADE_LABELS = { A: 'Excellent!', B: 'Great job!', C: 'Good effort!', D: 'Keep going!', F: 'Keep practicing!' }

function ScoreRing({ score }) {
  return (
    <div
      className="score-ring"
      style={{ '--pct': score }}
    >
      <span className="score-number">{score}</span>
    </div>
  )
}

export default function Feedback() {
  const { id } = useParams()
  const { state } = useLocation()
  const navigate = useNavigate()

  const [data, setData] = useState(null)
  const [loading, setLoading] = useState(!state)
  const [error, setError] = useState('')

  useEffect(() => {
    if (state) {
      setData(state)
      return
    }
    api.get(`/submissions/${id}`)
      .then(sub => {
        setData({
          score: sub.score,
          grade: sub.grade,
          points_awarded: sub.points_awarded,
          feedback: sub.feedback,
          new_streak: null,
          total_points: null,
        })
      })
      .catch(e => setError(e.message))
      .finally(() => setLoading(false))
  }, [id, state])

  if (loading) {
    return (
      <div className="loading-state">
        <span className="spinner spinner-lg" />
        Loading feedback…
      </div>
    )
  }

  if (error) {
    return (
      <div className="container page">
        <div className="error-msg">{error}</div>
        <Link to="/" className="btn btn-secondary">← Back to Home</Link>
      </div>
    )
  }

  const { score, grade, points_awarded, feedback, new_streak, total_points } = data

  return (
    <div className="container page">
      {/* Hero score section */}
      <div className="feedback-hero">
        <ScoreRing score={score} />
        <div className={`grade-badge grade-${grade}`}>{grade}</div>
        <h2 style={{ fontSize: '1.4rem', fontWeight: 700, marginBottom: 8 }}>
          {GRADE_LABELS[grade] || 'Good work!'}
        </h2>
        <p style={{ color: 'var(--text-2)', fontSize: '0.875rem' }}>
          Your scene description has been evaluated
        </p>

        <div className="feedback-stats">
          <div className="feedback-stat">
            <span>⭐</span>
            <span><strong>+{points_awarded}</strong> points earned</span>
          </div>
          {new_streak != null && (
            <div className="feedback-stat">
              <span>🔥</span>
              <span><strong>{new_streak}</strong> day streak</span>
            </div>
          )}
          {total_points != null && (
            <div className="feedback-stat">
              <span>🏆</span>
              <span><strong>{total_points}</strong> total points</span>
            </div>
          )}
        </div>
      </div>

      <div className="feedback-sections">
        {/* Strengths */}
        {feedback.strengths?.length > 0 && (
          <div className="feedback-section">
            <div className="feedback-section-title" style={{ color: 'var(--success)' }}>
              ✅ Strengths
            </div>
            <ul className="feedback-list">
              {feedback.strengths.map((s, i) => (
                <li key={i} data-icon="✓" style={{ color: 'var(--text-2)' }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Improvements */}
        {feedback.improvements?.length > 0 && (
          <div className="feedback-section">
            <div className="feedback-section-title" style={{ color: 'var(--warning)' }}>
              💡 Areas to Improve
            </div>
            <ul className="feedback-list">
              {feedback.improvements.map((s, i) => (
                <li key={i} data-icon="→" style={{ color: 'var(--text-2)' }}>{s}</li>
              ))}
            </ul>
          </div>
        )}

        {/* Corrections */}
        {feedback.corrections?.length > 0 && (
          <div className="feedback-section">
            <div className="feedback-section-title" style={{ color: 'var(--danger)' }}>
              🔧 Corrections
            </div>
            {feedback.corrections.map((c, i) => (
              <div className="correction-item" key={i}>
                <div className="correction-original">✗ {c.original}</div>
                <div className="correction-corrected">✓ {c.corrected}</div>
                <div className="correction-explanation">{c.explanation}</div>
              </div>
            ))}
          </div>
        )}

        {/* Native rewrite */}
        {feedback.native_rewrite && (
          <div className="feedback-section">
            <div className="feedback-section-title" style={{ color: 'var(--info)' }}>
              🗣️ Native Speaker Rewrite
            </div>
            <div className="native-rewrite">
              "{feedback.native_rewrite}"
            </div>
          </div>
        )}
      </div>

      {/* Actions */}
      <div style={{ display: 'flex', gap: '12px', marginTop: '28px', flexWrap: 'wrap' }}>
        <Link to="/" className="btn btn-primary">
          🏠 Back to Home
        </Link>
        <Link to="/profile" className="btn btn-secondary">
          📊 View Profile
        </Link>
      </div>
    </div>
  )
}
