import { useState } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

export default function Register({ onLogin }) {
  const [form, setForm] = useState({ username: '', email: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)

  function handleChange(e) {
    setForm(f => ({ ...f, [e.target.name]: e.target.value }))
    setError('')
  }

  async function handleSubmit(e) {
    e.preventDefault()
    if (form.password.length < 6) {
      setError('Password must be at least 6 characters')
      return
    }
    setLoading(true)
    setError('')
    try {
      const data = await api.post('/auth/register', form)
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

          <h2 className="auth-headline">Cinema-powered<br />language learning</h2>
          <p className="auth-tagline">
            Watch real movie scenes, describe what you see, and get instant
            AI feedback on vocabulary, grammar, and fluency.
          </p>

          <div className="auth-features">
            <div className="auth-feature">
              <div className="auth-feature-icon">🎯</div>
              <div className="auth-feature-body">
                <strong>AI-Powered Feedback</strong>
                <span>Detailed scores on every submission — strengths, corrections &amp; rewrites</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">🔥</div>
              <div className="auth-feature-body">
                <strong>Daily Streaks</strong>
                <span>Build consistent habits with a new scene every day</span>
              </div>
            </div>
            <div className="auth-feature">
              <div className="auth-feature-icon">📈</div>
              <div className="auth-feature-body">
                <strong>Track Your Progress</strong>
                <span>Points, grades, and a full history of your journey</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">
          <h1 className="auth-form-title">Create account</h1>
          <p className="auth-form-subtitle">Start your language learning journey today</p>

          {error && <div className="error-msg">{error}</div>}

          <form onSubmit={handleSubmit}>
            <div className="form-group">
              <label className="form-label">Username</label>
              <div className="input-icon-wrap">
                <span className="input-icon">👤</span>
                <input
                  className="form-input"
                  type="text"
                  name="username"
                  placeholder="coollearner42"
                  value={form.username}
                  onChange={handleChange}
                  required
                  autoFocus
                />
              </div>
            </div>

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
                  placeholder="Min. 6 characters"
                  value={form.password}
                  onChange={handleChange}
                  required
                  minLength={6}
                />
              </div>
            </div>

            <button
              className="btn btn-primary btn-full btn-lg"
              type="submit"
              disabled={loading}
              style={{ marginTop: 8 }}
            >
              {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
            </button>
          </form>

          <p className="auth-link">
            Already have an account? <Link to="/login">Sign in</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
