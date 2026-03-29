import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Login({ onLogin }) {
  const [form, setForm] = useState({ email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    setLoading(true)
    setError('')
    try {
      const data = await api.post('/auth/login', form)
      onLogin(data.user, data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  return (
    <div className="auth-page">
      {/* ── Left branding panel ── */}
      <div className="auth-left">
        <div className="auth-orb auth-orb-1" />
        <div className="auth-orb auth-orb-2" />
        <div className="auth-orb auth-orb-3" />

        <div className="auth-brand">
          <div className="auth-wordmark">
            <div className="auth-wordmark-icon">🎬</div>
            <span className="auth-wordmark-text">SceneScribe</span>
          </div>

          <h2 className="auth-headline">Welcome back,<br />keep scribing</h2>
          <p className="auth-tagline">
            Your streak is waiting. Watch today's scene, describe it, and
            earn your points — all in under 5 minutes.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">⚡</div>
              <div className="auth-feature-body">
                <strong>Quick Daily Challenge</strong>
                <span>One scene per day — takes just a few minutes</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🏆</div>
              <div className="auth-feature-body">
                <strong>Earn Points &amp; Grades</strong>
                <span>A–F grading with detailed AI corrections</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🗣️</div>
              <div className="auth-feature-body">
                <strong>Voice or Text</strong>
                <span>Describe scenes by typing or speaking — your choice</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Welcome back</h1>
          <p className="auth-form-subtitle">Sign in to continue your streak</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Email</label>
              <div className="input-icon-wrap">
                <span className="input-icon">✉️</span>
                <input
                  className="form-input"
                  type="email"
                  name="email"
                  placeholder="you@example.com"
                  value={form.email}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

            <div className="form-group">
              <label className="form-label">Password</label>
              <div className="input-icon-wrap">
                <span className="input-icon">🔒</span>
                <input
                  className="form-input"
                  type="password"
                  name="password"
                  placeholder="••••••••"
                  value={form.password}
                  onChange={handleChange}
                  required
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <><span className="spinner" /> Signing in…</> : 'Sign In →'}
            </button>
          </form>

          <p className="auth-link">
            Don't have an account? <Link to="/register">Create one free</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
