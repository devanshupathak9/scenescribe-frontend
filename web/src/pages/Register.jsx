import { useState, useRef, useEffect } from 'react'
import { Link } from 'react-router-dom'
import { api } from '../api.js'

const OTP_LENGTH = 6

export default function Register({ onLogin }) {
  const [step, setStep] = useState(1)
  const [email, setEmail] = useState('')
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [form, setForm] = useState({ user_name: '', password: '' })
  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [resendMsg, setResendMsg] = useState('')

  const otpRefs = useRef([])

  // Countdown timer for the resend cooldown
  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  // Auto-focus first OTP box when step 2 mounts
  useEffect(() => {
    if (step === 2) otpRefs.current[0]?.focus()
  }, [step])

  // ── Step 1 — send OTP ──────────────────────────────────────────────
  async function handleSendOTP() {
    if (!email.trim()) { setError('Email is required'); return }
    setLoading(true)
    setError('')
    try {
      await api.post('/auth/register', { email: email.trim() })
      setStep(2)
      setResendCooldown(30)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    setResendMsg('')
    try {
      await api.post('/auth/register', { email })
      setResendCooldown(30)
      setOtp(Array(OTP_LENGTH).fill(''))
      otpRefs.current[0]?.focus()
      setResendMsg('A new code has been sent!')
      setTimeout(() => setResendMsg(''), 4000)
    } catch (err) {
      setError(err.message)
    }
  }

  // ── OTP box handlers ───────────────────────────────────────────────
  function handleOtpChange(index, value) {
    // Handle paste into any box — grab up to 6 digits
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      const next = [...otp]
      for (let i = 0; i < OTP_LENGTH; i++) next[i] = digits[i] || ''
      setOtp(next)
      const focusIndex = Math.min(digits.length, OTP_LENGTH - 1)
      otpRefs.current[focusIndex]?.focus()
      return
    }
    const digit = value.replace(/\D/g, '')
    const next = [...otp]
    next[index] = digit
    setOtp(next)
    setError('')
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKeyDown(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) {
      otpRefs.current[index - 1]?.focus()
    }
  }

  // ── Step 2 — verify OTP + complete registration ────────────────────
  async function handleVerify() {
    const otpStr = otp.join('')
    if (otpStr.length < OTP_LENGTH) { setError('Please enter the full 6-digit code'); return }
    if (!form.user_name.trim()) { setError('Username is required'); return }
    if (form.user_name.trim().length < 3) { setError('Username must be at least 3 characters'); return }
    if (!form.password) { setError('Password is required'); return }
    if (form.password.length < 6) { setError('Password must be at least 6 characters'); return }

    setLoading(true)
    setError('')
    try {
      const res = await api.post('/auth/verify', {
        email,
        otp: otpStr,
        user_name: form.user_name.trim(),
        password: form.password,
      })
      onLogin(res.data.user, res.data.token)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  function goBackToEmail() {
    setStep(1)
    setError('')
    setResendMsg('')
    setOtp(Array(OTP_LENGTH).fill(''))
  }

  // ── Render ─────────────────────────────────────────────────────────
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

          {step === 1 ? (
            <>
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
            </>
          ) : (
            <>
              <h2 className="auth-headline">Check your<br />inbox</h2>
              <p className="auth-tagline">
                We sent a 6-digit verification code to{' '}
                <strong style={{ color: 'var(--text)' }}>{email}</strong>.
                Enter it below, then pick a username and password to finish setting up.
              </p>
              <div className="auth-features">
                <div className="auth-feature">
                  <div className="auth-feature-icon">📧</div>
                  <div className="auth-feature-body">
                    <strong>Can't find the email?</strong>
                    <span>Check your spam or junk folder — it can sometimes end up there.</span>
                  </div>
                </div>
                <div className="auth-feature">
                  <div className="auth-feature-icon">⏱️</div>
                  <div className="auth-feature-body">
                    <strong>Code expires in 10 minutes</strong>
                    <span>Use the resend button if your code has expired.</span>
                  </div>
                </div>
              </div>
            </>
          )}
        </div>
      </div>

      {/* ── Right form panel ── */}
      <div className="auth-right">
        <div className="auth-form-wrap">

          {step === 1 ? (
            /* ── Step 1: email ── */
            <>
              <h1 className="auth-form-title">Create account</h1>
              <p className="auth-form-subtitle">Enter your email to get started</p>

              {error && <div className="error-msg">{error}</div>}

              <div className="form-group">
                <label className="form-label">Email</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">✉️</span>
                  <input
                    className="form-input"
                    type="email"
                    placeholder="you@example.com"
                    value={email}
                    onChange={e => { setEmail(e.target.value); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleSendOTP()}
                    autoFocus
                  />
                </div>
              </div>

              <button
                className="btn-primary btn-full btn-lg"
                type="button"
                onClick={handleSendOTP}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? <><span className="spinner" /> Sending code…</> : 'Send verification code →'}
              </button>

              <p className="auth-link">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          ) : (
            /* ── Step 2: OTP + account setup ── */
            <>
              <h1 className="auth-form-title">Verify email</h1>
              <p className="auth-form-subtitle" style={{ marginBottom: 4 }}>
                Code sent to <strong style={{ color: 'var(--text)' }}>{email}</strong>
              </p>
              <button
                type="button"
                onClick={goBackToEmail}
                style={{
                  background: 'none', border: 'none',
                  color: 'var(--yellow)', fontSize: 12,
                  cursor: 'pointer', padding: 0, marginBottom: 22,
                }}
              >
                ← Change email
              </button>

              {error && <div className="error-msg">{error}</div>}
              {resendMsg && <div className="success-msg" style={{ marginBottom: 12 }}>{resendMsg}</div>}

              {/* OTP boxes */}
              <div className="form-group">
                <label className="form-label">Verification code</label>
                <div className="otp-row">
                  {otp.map((digit, i) => (
                    <input
                      key={i}
                      ref={el => (otpRefs.current[i] = el)}
                      className="otp-input"
                      type="text"
                      inputMode="numeric"
                      maxLength={6}
                      value={digit}
                      onChange={e => handleOtpChange(i, e.target.value)}
                      onKeyDown={e => handleOtpKeyDown(i, e)}
                      onFocus={e => e.target.select()}
                    />
                  ))}
                </div>
                <div style={{ marginTop: 8, textAlign: 'right' }}>
                  <button
                    type="button"
                    onClick={handleResend}
                    disabled={resendCooldown > 0}
                    style={{
                      background: 'none', border: 'none', padding: 0,
                      color: resendCooldown > 0 ? 'var(--muted)' : 'var(--yellow)',
                      fontSize: 12,
                      cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer',
                    }}
                  >
                    {resendCooldown > 0 ? `Resend code in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </div>
              </div>

              {/* Username */}
              <div className="form-group">
                <label className="form-label">Username</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">👤</span>
                  <input
                    className="form-input"
                    type="text"
                    placeholder="coollearner42"
                    value={form.user_name}
                    onChange={e => { setForm(f => ({ ...f, user_name: e.target.value })); setError('') }}
                  />
                </div>
              </div>

              {/* Password */}
              <div className="form-group">
                <label className="form-label">Password</label>
                <div className="input-icon-wrap">
                  <span className="input-icon">🔒</span>
                  <input
                    className="form-input"
                    type="password"
                    placeholder="Min. 6 characters"
                    value={form.password}
                    onChange={e => { setForm(f => ({ ...f, password: e.target.value })); setError('') }}
                    onKeyDown={e => e.key === 'Enter' && handleVerify()}
                  />
                </div>
              </div>

              <button
                className="btn-primary btn-full btn-lg"
                type="button"
                onClick={handleVerify}
                disabled={loading}
                style={{ marginTop: 8 }}
              >
                {loading ? <><span className="spinner" /> Creating account…</> : 'Create Account →'}
              </button>

              <p className="auth-link">
                Already have an account? <Link to="/login">Sign in</Link>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
