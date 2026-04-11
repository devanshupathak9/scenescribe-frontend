import { useState, useRef, useEffect } from 'react'
import { api } from '../api.js'

const OTP_LENGTH = 6

function pwStrength(pw) {
  let s = 0
  if (pw.length >= 8) s++
  if (/[A-Z]/.test(pw)) s++
  if (/[0-9]/.test(pw)) s++
  if (/[^a-zA-Z0-9]/.test(pw)) s++
  return s
}

// ── Icons ────────────────────────────────────────────────────────────
function IconEnvelope({ size = 14, color = 'white' }) {
  return (
    <svg width={size} height={size} viewBox="0 0 24 24" fill="none">
      <rect x="2" y="4" width="20" height="16" rx="2" stroke={color} strokeWidth="1.8" />
      <path d="M2 7l10 7 10-7" stroke={color} strokeWidth="1.8" strokeLinejoin="round" />
    </svg>
  )
}

function IconPlay() {
  return (
    <svg width="11" height="11" viewBox="0 0 12 12" fill="none" stroke="#e8ff47" strokeWidth="1.6" strokeLinejoin="round">
      <path d="M2.5 1.5l8 4.5-8 4.5V1.5z" />
    </svg>
  )
}

function IconTrend() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#e8ff47" strokeWidth="1.5" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="1,9 4,5 7,7 11,2" />
      <polyline points="8,2 11,2 11,5" />
    </svg>
  )
}

function IconClock() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" stroke="#e8ff47" strokeWidth="1.5" strokeLinecap="round">
      <circle cx="6" cy="6" r="5" />
      <polyline points="6,3 6,6 8.5,7.5" />
    </svg>
  )
}

function IconCheck() {
  return (
    <svg width="30" height="30" viewBox="0 0 30 30" fill="none" stroke="#4ade80" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round">
      <polyline points="5,15 12,22 25,8" />
    </svg>
  )
}

// ── Left Panel ───────────────────────────────────────────────────────
function LeftPanel() {
  return (
    <div className="ap-left">
      <div className="ap-orb ap-orb-1" />
      <div className="ap-orb ap-orb-2" />
      <div className="ap-orb ap-orb-3" />
      <div className="ap-left-inner">

        {/* Brand */}
        <div className="ap-brand">
          <div className="ap-brand-icon">
            <IconEnvelope size={14} color="white" />
          </div>
          <span className="ap-brand-name">
            <span className="ap-scene">Scene</span><span className="ap-scribe">Scribe</span>
          </span>
        </div>

        {/* Badge */}
        <div className="ap-badge">✓&nbsp;&nbsp;AI English practice</div>

        {/* Headline */}
        <h2 className="ap-headline">
          Watch.<br />
          Describe.<br />
          <span className="ap-headline-acc">Get fluent.</span>
        </h2>

        {/* Body */}
        <p className="ap-body-copy">
          Real video scenes. No textbooks, no drills. Describe what you see, get instant AI feedback, and build real fluency — one scene a day.
        </p>

        {/* Testimonial */}
        <div className="ap-testimonial">
          <p className="ap-quote">"I improved more in 2 weeks of SceneScribe than months of grammar exercises."</p>
          <p className="ap-attr">— Priya S., intermediate learner</p>
        </div>

        {/* Features */}
        <div className="ap-features">
          {[
            { icon: <IconPlay />, label: 'Fresh scene every day', sub: '30-second real-world video, new every morning' },
            { icon: <IconTrend />, label: 'Scored on 3 dimensions', sub: 'Grammar, vocabulary and clarity out of 10' },
            { icon: <IconClock />, label: 'Streak worth protecting', sub: 'Daily habit tracker with personal bests' },
          ].map(({ icon, label, sub }) => (
            <div key={label} className="ap-feature">
              <div className="ap-feat-icon">{icon}</div>
              <div className="ap-feat-text">
                <strong>{label}</strong>
                <span>{sub}</span>
              </div>
            </div>
          ))}
        </div>

      </div>
    </div>
  )
}

// ── Main Component ───────────────────────────────────────────────────
export default function AuthPage({ onLogin, initialTab = 'register' }) {
  const [tab, setTab] = useState(initialTab)   // 'register' | 'signin'
  const [step, setStep] = useState(1)           // 1 | 2 | 3

  const [regForm, setRegForm] = useState({ firstName: '', lastName: '', email: '', username: '', password: '' })
  const [otp, setOtp] = useState(Array(OTP_LENGTH).fill(''))
  const [loginForm, setLoginForm] = useState({ email: '', password: '' })

  const [error, setError] = useState('')
  const [loading, setLoading] = useState(false)
  const [resendCooldown, setResendCooldown] = useState(0)
  const [successCreds, setSuccessCreds] = useState(null) // { user, token }

  const otpRefs = useRef([])

  function switchTab(t) {
    setTab(t)
    setStep(1)
    setError('')
  }

  useEffect(() => {
    if (resendCooldown <= 0) return
    const timer = setTimeout(() => setResendCooldown(c => c - 1), 1000)
    return () => clearTimeout(timer)
  }, [resendCooldown])

  useEffect(() => {
    if (step === 2) otpRefs.current[0]?.focus()
  }, [step])

  function setReg(field, val) {
    setRegForm(f => ({ ...f, [field]: val }))
    setError('')
  }

  // Step 1 — send OTP
  async function handleRegister() {
    if (!regForm.firstName.trim()) { setError('First name is required'); return }
    if (!regForm.email.trim()) { setError('Email is required'); return }
    if (!regForm.username.trim()) { setError('Username is required'); return }
    if (regForm.username.trim().length < 3) { setError('Username must be at least 3 characters'); return }
    if (!regForm.password) { setError('Password is required'); return }
    if (regForm.password.length < 8) { setError('Password must be at least 8 characters'); return }
    setLoading(true); setError('')
    try {
      await api.post('/auth/register', { email: regForm.email.trim() })
      setStep(2)
      setResendCooldown(30)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // OTP handlers
  function handleOtpChange(index, value) {
    if (value.length > 1) {
      const digits = value.replace(/\D/g, '').slice(0, OTP_LENGTH)
      const next = Array(OTP_LENGTH).fill('')
      for (let i = 0; i < OTP_LENGTH; i++) next[i] = digits[i] || ''
      setOtp(next)
      otpRefs.current[Math.min(digits.length, OTP_LENGTH - 1)]?.focus()
      return
    }
    const digit = value.replace(/\D/g, '')
    const next = [...otp]; next[index] = digit
    setOtp(next); setError('')
    if (digit && index < OTP_LENGTH - 1) otpRefs.current[index + 1]?.focus()
  }

  function handleOtpKey(index, e) {
    if (e.key === 'Backspace' && !otp[index] && index > 0) otpRefs.current[index - 1]?.focus()
  }

  async function handleResend() {
    if (resendCooldown > 0) return
    setError('')
    try {
      await api.post('/auth/register', { email: regForm.email.trim() })
      setResendCooldown(30)
      setOtp(Array(OTP_LENGTH).fill(''))
      otpRefs.current[0]?.focus()
    } catch (err) { setError(err.message) }
  }

  // Step 2 — verify OTP
  async function handleVerify() {
    const code = otp.join('')
    if (code.length < OTP_LENGTH) { setError('Please enter the full 6-digit code'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/verify', {
        email: regForm.email.trim(),
        otp: code,
        user_name: regForm.username.trim(),
        password: regForm.password,
      })
      setSuccessCreds({ user: res.data.user, token: res.data.token })
      setStep(3)
    } catch (err) {
      setError(err.message)
    } finally {
      setLoading(false)
    }
  }

  // Step 3 — go to dashboard
  function handleGoDashboard() {
    if (successCreds) onLogin(successCreds.user, successCreds.token)
  }

  // Sign in
  async function handleSignIn() {
    if (!loginForm.email.trim()) { setError('Email is required'); return }
    if (!loginForm.password) { setError('Password is required'); return }
    setLoading(true); setError('')
    try {
      const res = await api.post('/auth/login', loginForm)
      if (!res.data?.user || !res.data?.token) throw new Error('Unexpected response from server')
      onLogin(res.data.user, res.data.token)
    } catch (err) {
      if (err.message?.toLowerCase().includes('verify your email')) {
        setError('Your email is not verified yet. Please complete registration first.')
      } else {
        setError(err.message)
      }
    } finally {
      setLoading(false)
    }
  }

  const strength = pwStrength(regForm.password)
  const segColors = { 1: '#f87171', 2: '#f59e0b', 3: '#f59e0b', 4: '#4ade80' }
  const otpReady = otp.every(d => d !== '')

  const showSteps = tab === 'register'
  const showTabs = tab === 'signin' || (tab === 'register' && step === 1)

  return (
    <div className="ap-page">
      <LeftPanel />

      <div className="ap-right">
        <div className="ap-right-inner">

          {/* Step indicator */}
          {showSteps && (
            <div className="ap-stepper">
              <div className={`ap-dot ${step >= 2 ? 'ap-dot-done' : 'ap-dot-active'}`} />
              <div className={`ap-line ${step >= 2 ? 'ap-line-done' : ''}`} />
              <div className={`ap-dot ${step === 2 ? 'ap-dot-active' : step > 2 ? 'ap-dot-done' : ''}`} />
              <div className={`ap-line ${step >= 3 ? 'ap-line-done' : ''}`} />
              <div className={`ap-dot ${step === 3 ? 'ap-dot-active' : ''}`} />
            </div>
          )}

          {/* Tab toggle */}
          {showTabs && (
            <div className="ap-tabs">
              <button className={`ap-tab ${tab === 'register' ? 'ap-tab-active' : ''}`} onClick={() => switchTab('register')}>
                Register
              </button>
              <button className={`ap-tab ${tab === 'signin' ? 'ap-tab-active' : ''}`} onClick={() => switchTab('signin')}>
                Sign in
              </button>
            </div>
          )}

          {/* Error banner */}
          {error && <div className="ap-error">{error}</div>}

          {/* ── STEP 1: Register ── */}
          {tab === 'register' && step === 1 && (
            <>
              <div className="ap-form-head">
                <h1 className="ap-form-title">Create your account</h1>
                <p className="ap-form-sub">Free forever. Start your first scene in under 2 minutes.</p>
              </div>

              <div className="ap-row-2">
                <div className="ap-field">
                  <label className="ap-label">FIRST NAME</label>
                  <input className="ap-input" type="text" placeholder="Arjun" value={regForm.firstName}
                    onChange={e => setReg('firstName', e.target.value)} />
                </div>
                <div className="ap-field">
                  <label className="ap-label">LAST NAME</label>
                  <input className="ap-input" type="text" placeholder="Kumar" value={regForm.lastName}
                    onChange={e => setReg('lastName', e.target.value)} />
                </div>
              </div>

              <div className="ap-field">
                <label className="ap-label">EMAIL ADDRESS</label>
                <input className="ap-input" type="email" placeholder="arjun@email.com" value={regForm.email}
                  onChange={e => setReg('email', e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">USERNAME</label>
                <input className="ap-input" type="text" placeholder="arjun_speaks" value={regForm.username}
                  onChange={e => setReg('username', e.target.value)} />
              </div>

              <div className="ap-field">
                <label className="ap-label">PASSWORD</label>
                <input className="ap-input" type="password" placeholder="Min. 8 characters" value={regForm.password}
                  onChange={e => setReg('password', e.target.value)}
                  onKeyDown={e => e.key === 'Enter' && handleRegister()} />
                <div className="ap-strength">
                  {[0, 1, 2, 3].map(i => (
                    <div key={i} className="ap-seg"
                      style={{ background: i < strength ? (segColors[strength] || '#252535') : '#252535' }} />
                  ))}
                </div>
              </div>

              <button className="ap-cta" onClick={handleRegister} disabled={loading}>
                {loading ? <><span className="spinner" /> Creating…</> : 'Create account'}
              </button>

              <p className="ap-footer-note">
                Already have an account?{' '}
                <button className="ap-link-btn" onClick={() => switchTab('signin')}>Sign in</button>
              </p>
            </>
          )}

          {/* ── STEP 2: Verify ── */}
          {tab === 'register' && step === 2 && (
            <>
              <div className="ap-form-head">
                <h1 className="ap-form-title">Check your inbox</h1>
                <p className="ap-form-sub">Enter the 6-digit code we just sent you.</p>
              </div>

              <div className="ap-envelope-block">
                <div className="ap-envelope-icon">
                  <IconEnvelope size={26} color="#e8ff47" />
                </div>
                <p className="ap-sent-to">
                  We sent a 6-digit code to<br />
                  <strong>{regForm.email}</strong>
                </p>
              </div>

              <div className="ap-otp-row">
                {otp.map((digit, i) => (
                  <input
                    key={i}
                    ref={el => (otpRefs.current[i] = el)}
                    className={`ap-otp-box ${digit ? 'ap-otp-filled' : ''}`}
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={digit}
                    onChange={e => handleOtpChange(i, e.target.value)}
                    onKeyDown={e => handleOtpKey(i, e)}
                    onFocus={e => e.target.select()}
                  />
                ))}
              </div>

              <button
                className={`ap-cta ${!otpReady ? 'ap-cta-dim' : ''}`}
                onClick={handleVerify}
                disabled={loading || !otpReady}
              >
                {loading ? <><span className="spinner" /> Verifying…</> : 'Verify email'}
              </button>

              <div className="ap-otp-footer">
                <p className="ap-footer-note">
                  Didn't get it?{' '}
                  <button className="ap-link-btn" onClick={handleResend}
                    style={{ color: resendCooldown > 0 ? '#74748a' : '#e8ff47', cursor: resendCooldown > 0 ? 'not-allowed' : 'pointer' }}>
                    {resendCooldown > 0 ? `Resend in ${resendCooldown}s` : 'Resend code'}
                  </button>
                </p>
                <p className="ap-footer-note">
                  <button className="ap-link-btn" style={{ color: '#74748a' }}
                    onClick={() => { setStep(1); setError(''); setOtp(Array(OTP_LENGTH).fill('')) }}>
                    ← Change email address
                  </button>
                </p>
              </div>
            </>
          )}

          {/* ── STEP 3: Success ── */}
          {tab === 'register' && step === 3 && (
            <div className="ap-success">
              <div className="ap-form-head ap-text-center">
                <h1 className="ap-form-title">Account verified</h1>
                <p className="ap-form-sub">You're all set and ready to start.</p>
              </div>

              <div className="ap-check-circle">
                <IconCheck />
              </div>

              <h3 className="ap-verified-title">You're verified!</h3>
              <p className="ap-verified-body">
                Your email is confirmed. Welcome to SceneScribe — your first scene is ready and waiting.
              </p>

              <button className="ap-cta" onClick={handleGoDashboard} disabled={loading}>
                Go to dashboard →
              </button>
            </div>
          )}

          {/* ── SIGN IN ── */}
          {tab === 'signin' && (
            <>
              <div className="ap-form-head">
                <h1 className="ap-form-title">Welcome back</h1>
                <p className="ap-form-sub">Your streak is waiting. Sign in and keep the momentum going.</p>
              </div>

              <div className="ap-field">
                <label className="ap-label">EMAIL ADDRESS</label>
                <input className="ap-input" type="email" placeholder="arjun@email.com" autoFocus
                  value={loginForm.email}
                  onChange={e => { setLoginForm(f => ({ ...f, email: e.target.value })); setError('') }} />
              </div>

              <div className="ap-field">
                <label className="ap-label">PASSWORD</label>
                <input className="ap-input" type="password" placeholder="Your password"
                  value={loginForm.password}
                  onChange={e => { setLoginForm(f => ({ ...f, password: e.target.value })); setError('') }}
                  onKeyDown={e => e.key === 'Enter' && handleSignIn()} />
                <div className="ap-forgot-wrap">
                  <button className="ap-forgot">Forgot password?</button>
                </div>
              </div>

              <button className="ap-cta" onClick={handleSignIn} disabled={loading}>
                {loading ? <><span className="spinner" /> Signing in…</> : 'Sign in'}
              </button>

              <p className="ap-footer-note">
                No account yet?{' '}
                <button className="ap-link-btn" onClick={() => switchTab('register')}>Create one free</button>
              </p>
            </>
          )}

        </div>
      </div>
    </div>
  )
}
