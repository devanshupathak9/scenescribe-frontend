import { useState, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

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
    api.get('/profile/me')
      .then(res => setProfile(res.data))
      .catch(() => {})
      .finally(() => setLoading(false))
  }, [])

  useEffect(() => {
    setHistLoading(true)
    api.get(`/profile/history?page=${page}`)
      .then(res => setHistory(res))
      .catch(() => {})
      .finally(() => setHistLoading(false))
  }, [page])

  const stats = profile?.stats
  const displayUser = profile?.user || user
  const initials = (displayUser?.user_name || displayUser?.email || 'U')
    .slice(0, 2).toUpperCase()

  return (
    <div className="container page">
      {/* Avatar row */}
      <div className="avatar-row">
        <div className="avatar">{initials}</div>
        <div>
          <div className="avatar-name">{displayUser?.user_name || 'User'}</div>
          <div className="avatar-email">{displayUser?.email}</div>
        </div>
      </div>

      {/* Stats grid */}
      <div className="stats-grid">
        <div className="stat-cell">
          <div className="stat-icon stat-icon--yellow">◆</div>
          <div className="stat-value">{loading ? '–' : stats?.avg_score ?? '–'}</div>
          <div className="stat-label">Average score</div>
        </div>

        <div className="stat-cell">
          <div className="stat-icon stat-icon--purple">◆</div>
          <div className="stat-value">{loading ? '–' : stats?.highest_score ?? '–'}</div>
          <div className="stat-label">Highest score</div>
        </div>

        <div className="streak-card">
          <div className="streak-left">
            <div className="stat-label">Current streak</div>
            <div className="streak-value">🔥 {loading ? '–' : stats?.current_streak ?? 0} days</div>
          </div>
          <div className="streak-right">
            <div className="stat-label">Longest streak</div>
            <div className="streak-longest">{loading ? '–' : stats?.longest_streak ?? 0} days</div>
          </div>
        </div>

        <div className="scenes-card">
          <div>
            <div className="stat-label">Scenes completed</div>
            <div className="stat-value" style={{ marginTop: '4px' }}>{loading ? '–' : stats?.total_completed ?? 0}</div>
          </div>
          <div className="mini-bars">
            {[0.3, 0.5, 0.65, 0.8, 1].map((h, i) => (
              <div key={i} className="mini-bar" style={{ height: `${h * 32}px`, opacity: 0.3 + h * 0.7 }} />
            ))}
          </div>
        </div>
      </div>

      {/* History */}
      <div style={{ marginTop: '28px' }}>
        <div className="section-label" style={{ marginBottom: '14px' }}>Submission history</div>

        {histLoading && (
          <div className="loading-state" style={{ padding: '40px' }}>
            <span className="spinner" />
          </div>
        )}

        {!histLoading && history?.data?.length === 0 && (
          <div className="empty-state">
            <div className="empty-icon">🎬</div>
            <h3>No submissions yet</h3>
            <p>Head to the home page to describe your first scene!</p>
            <Link to="/" className="btn-primary" style={{ marginTop: '16px', display: 'inline-block' }}>Start now →</Link>
          </div>
        )}

        {!histLoading && history?.data?.length > 0 && (
          <>
            <div className="history-list">
              {history.data.map(sub => {
                const color = sub.score >= 8 ? '#4ade80' : sub.score >= 5 ? '#f59e0b' : '#f87171'
                return (
                  <Link key={sub.submission_id} to={`/feedback/${sub.submission_id}`} className="history-item">
                    <div className="history-score-badge" style={{ color, borderColor: `${color}40` }}>
                      {sub.score}
                    </div>
                    <div className="history-info">
                      <div className="history-scene">{sub.scene_title || 'Scene'}</div>
                      <div className="history-date">{formatDate(sub.date)}</div>
                    </div>
                    <div className="history-arrow">→</div>
                  </Link>
                )
              })}
            </div>

            {history.meta?.pages > 1 && (
              <div className="pagination">
                <button className="btn-ghost" onClick={() => setPage(p => p - 1)} disabled={page === 1}>← Prev</button>
                <span className="page-info">{page} / {history.meta.pages}</span>
                <button className="btn-ghost" onClick={() => setPage(p => p + 1)} disabled={page === history.meta.pages}>Next →</button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  )
}
