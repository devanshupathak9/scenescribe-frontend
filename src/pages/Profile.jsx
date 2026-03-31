import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

const GRADE_COLORS = {
  A: { bg: 'rgba(16,185,129,0.15)', color: '#10b981' },
  B: { bg: 'rgba(59,130,246,0.15)', color: '#3b82f6' },
  C: { bg: 'rgba(245,158,11,0.15)', color: '#f59e0b' },
  D: { bg: 'rgba(249,115,22,0.15)', color: '#f97316' },
  F: { bg: 'rgba(239,68,68,0.15)', color: '#ef4444' },
}

function formatDate(iso) {
  return new Date(iso).toLocaleDateString('en-US', {
    month: 'short', day: 'numeric', year: 'numeric',
  })
}

export default function Profile({ user }) {
  const [profile, setProfile] = useState(null)
  const [history, setHistory] = useState(null)
  const [page, setPage] = useState(1)
  const [loading, setLoading] = useState(true)
  const [histLoading, setHistLoading] = useState(false)

  useEffect(() => {
    api.get('/profile').then(setProfile).catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setHistLoading(true)
    api.get(`/profile/history?page=${page}`)
      .then(setHistory)
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [page])

  const displayUser = profile || user

  return (
    <div className="container page">
      <div className="page-header">
        <div>
          <h1 className="page-title">👤 {displayUser.username}</h1>
          <p className="page-subtitle">{displayUser.email}</p>
        </div>
      </div>

      {/* Stats */}
      <div className="profile-stats">
        <div className="stat-card">
          <span className="stat-icon">🔥</span>
          <div className="stat-value" style={{ color: '#f97316' }}>
            {loading ? '–' : displayUser.streak ?? 0}
          </div>
          <div className="stat-label">Day Streak</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">⭐</span>
          <div className="stat-value" style={{ color: '#eab308' }}>
            {loading ? '–' : displayUser.total_points ?? 0}
          </div>
          <div className="stat-label">Total Points</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📝</span>
          <div className="stat-value" style={{ color: 'var(--accent-light)' }}>
            {history ? history.total : '–'}
          </div>
          <div className="stat-label">Submissions</div>
        </div>
        <div className="stat-card">
          <span className="stat-icon">📊</span>
          <div className="stat-value" style={{ color: 'var(--success)' }}>
            {loading ? '–' : (profile?.average_score ?? '–')}
          </div>
          <div className="stat-label">Avg Score /10</div>
        </div>
      </div>

      {/* History */}
      <div>
        <div className="page-header" style={{ marginBottom: '16px' }}>
          <h2 style={{ fontSize: '1.1rem', fontWeight: 700 }}>Submission History</h2>
        </div>

        {histLoading && (
          <div className="loading-state" style={{ padding: '40px' }}>
            <span className="spinner" />
          </div>
        )}

        {!histLoading && history?.submissions?.length === 0 && (
          <div className="empty-state">
            <span className="icon">🎬</span>
            <h3>No submissions yet</h3>
            <p>Head to the home page to describe your first scene!</p>
            <div style={{ marginTop: '16px' }}>
              <Link to="/" className="btn btn-primary">Start now →</Link>
            </div>
          </div>
        )}

        {!histLoading && history?.submissions?.length > 0 && (
          <>
            <div className="history-list">
              {history.submissions.map(sub => {
                const gc = GRADE_COLORS[sub.grade] || GRADE_COLORS.C
                return (
                  <Link
                    key={sub.id}
                    to={`/feedback/${sub.id}`}
                    className="history-item"
                  >
                    <div
                      className="history-grade"
                      style={{ background: gc.bg, color: gc.color }}
                    >
                      {sub.grade}
                    </div>
                    <div className="history-info">
                      <div className="history-scene">
                        {sub.Scene?.title || 'Scene'}
                      </div>
                      <div className="history-date">
                        {formatDate(sub.createdAt)}
                      </div>
                    </div>
                    <div className="history-right">
                      <div className="history-score" style={{ color: gc.color }}>
                        {sub.score}
                      </div>
                      <div className="history-points">+{sub.points_awarded} pts</div>
                    </div>
                  </Link>
                )
              })}
            </div>

            {/* Pagination */}
            {history.pages > 1 && (
              <div className="pagination">
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => p - 1)}
                  disabled={page === 1}
                >
                  ← Prev
                </button>
                <span style={{ color: 'var(--text-muted)', fontSize: '0.875rem' }}>
                  {page} / {history.pages}
                </span>
                <button
                  className="btn btn-ghost btn-sm"
                  onClick={() => setPage(p => p + 1)}
                  disabled={page === history.pages}
                >
                  Next →
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
