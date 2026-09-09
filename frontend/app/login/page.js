'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    teamId: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [step, setStep] = useState(1) // 1=login, 2=select participant
  const [participantName, setParticipantName] = useState('')
  const [showPassword, setShowPassword] = useState(false)
  const [registeredSuccess, setRegisteredSuccess] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('registered') === '1') {
        setRegisteredSuccess(true)
      }
    }
  }, [])

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleLogin = async (e) => {
    e.preventDefault()
    setLoading(true)
    setError('')

    try {
      const response = await fetch('http://localhost:8080/api/auth/login', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(formData),
      })

      const data = await response.json()

      if (response.ok) {
        // Store JWT token and details in localStorage
        localStorage.setItem('token', data.token)
        localStorage.setItem('role', data.role)
        localStorage.setItem('teamName', data.teamName)
        localStorage.setItem('teamId', data.teamId)

        if (data.role === 'ROLE_ADMIN') {
          router.push('/admin')
        } else {
          setStep(2)
        }
      } else {
        setError(data.message || 'Login failed. Please check credentials.')
      }
    } catch (err) {
      setError('Could not connect to authentication server. Make sure the backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleSelectParticipant = (e) => {
    e.preventDefault()
    if (!participantName.trim()) {
      setError('Please enter your participant name.')
      return
    }
    localStorage.setItem('participantName', participantName)
    router.push('/game')
  }

  return (
    <div style={{
      minHeight: '100vh',
      position: 'relative',
      overflowX: 'hidden',
      display: 'flex',
      alignItems: 'center',
      justifyContent: 'center',
      padding: '40px 20px',
      width: '100%'
    }}>
      {/* Spider-Web Corner Accents (Red & Crimson) */}
      <svg className="web-accent" style={{ top: 0, left: 0, width: '240px', height: '240px' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.55" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.38" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.38" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.45" />
      </svg>

      <svg className="web-accent" style={{ top: 0, right: 0, width: '240px', height: '240px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.55" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.38" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.38" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.45" />
      </svg>

      {/* Atmospheric Ambient Glow Orb behind Cards */}
      <div className="auth-ambient-glow red" style={{ top: '25%', left: '50%', transform: 'translate(-50%, -25%)' }} />

      {/* EXPANSIVE DUAL-COLUMN COMMAND WRAPPER */}
      <div className="auth-command-wrapper">
        <div className="auth-command-grid">
          
          {/* LEFT COLUMN: MULTIVERSE BRIEFING & TELEMETRY */}
          <div className="auth-briefing-panel">
            <div>
              {/* Telemetry Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(224, 27, 34, 0.12)',
                border: '1px solid rgba(224, 27, 34, 0.35)',
                padding: '6px 16px',
                borderRadius: '24px',
                marginBottom: '20px'
              }}>
                <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#EF4444' }} />
                <span style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  MULTIVERSE PROTOCOL • MISSION INTELLIGENCE
                </span>
              </div>

              <h3 style={{
                fontSize: '2rem',
                fontWeight: 800,
                marginBottom: '14px',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #FFF 0%, #FFAAAA 60%, #E01B22 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                BATTLE ARENA ACCESS CLEARANCE
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.6', marginBottom: '26px' }}>
                Welcome to Pixel Paradox. Authenticate your squad credentials on the terminal to synchronize with the neural forensic mainframe and initialize Stage 0 Prelims.
              </p>

              {/* Tactical Briefing Protocol Cards */}
              <div style={{ display: 'flex', flexDirection: 'column', gap: '14px' }}>
                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>⏱️</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FF7B7B', letterSpacing: '0.5px' }}>STAGE 0 PRELIMS PROTOCOL</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(224, 27, 34, 0.25)', border: '1px solid rgba(224, 27, 34, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', color: '#FFF', fontWeight: 700 }}>30 MCQs / 30m</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Each pilot tests individually. Scores are automatically aggregated into your squad's average forensic standing.
                  </p>
                </div>

                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>🎯</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FF7B7B', letterSpacing: '0.5px' }}>SCORING &amp; PENALTIES</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(224, 27, 34, 0.25)', border: '1px solid rgba(224, 27, 34, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', color: '#FFF', fontWeight: 700 }}>+10 / -5</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Precision is paramount. Every verified detection grants <strong style={{ color: '#FF8888' }}>+10 pts</strong>, while neural hallucinations deduct <strong style={{ color: '#FF5555' }}>-5 pts</strong>.
                  </p>
                </div>

                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>👁️</span>
                    <span style={{ fontSize: '0.9rem', fontWeight: 800, color: '#FF7B7B', letterSpacing: '0.5px' }}>AI INVIGILATION MATRIX</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(224, 27, 34, 0.25)', border: '1px solid rgba(224, 27, 34, 0.4)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.72rem', color: '#FFF', fontWeight: 700 }}>SILENT WEBCAM</span>
                  </div>
                  <p style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Continuous neural telemetry ensures fair competition. Focus your attention on the forensics console.
                  </p>
                </div>
              </div>
            </div>

            {/* Mascot Tactical Comms Stream */}
            <div style={{ marginTop: '28px', paddingTop: '20px', borderTop: '1px solid rgba(224, 27, 34, 0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224, 27, 34, 0.35) 0%, transparent 70%)', border: '1.5px solid #E01B22', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/deadpool_model.png" alt="Deadpool" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '48px', height: '48px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224, 27, 34, 0.35) 0%, transparent 70%)', border: '1.5px solid #E01B22', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/spiderman_model.png" alt="Spider-Man" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  TACTICAL COMMS STREAM
                </div>
                <div style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px' }}>
                  "Maximum effort, teams! Sign in, trust your instincts, and conquer the neural synthetic matrix."
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CENTRAL AUTHENTICATION TERMINAL CARD */}
          <div className="glass-panel" style={{
            padding: '38px 32px',
            border: '1.5px solid rgba(224, 27, 34, 0.45)',
            borderTop: '2px solid rgba(255, 110, 110, 0.65)',
            background: 'linear-gradient(160deg, rgba(24, 10, 14, 0.96) 0%, rgba(10, 5, 8, 0.98) 100%)',
            boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(224, 27, 34, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
            borderRadius: '16px',
            position: 'relative',
            overflow: 'hidden',
            display: 'flex',
            flexDirection: 'column',
            justifyContent: 'space-between'
          }}>
            {/* HUD Cyber Corners */}
            <div className="cyber-corner-tl" />
            <div className="cyber-corner-tr" />
            <div className="cyber-corner-bl" />
            <div className="cyber-corner-br" />

            {/* Top Scanning Laser Line */}
            <div className="acknowledge-laser-line" />

            <div>
              {/* Dual Tab Switcher */}
              <div className="auth-nav-tabs">
                <Link href="/login" className="auth-nav-tab active-login">
                  <span>🔑 SQUAD SIGN IN</span>
                </Link>
                <Link href="/register" className="auth-nav-tab">
                  <span>🛡️ REGISTER SQUAD</span>
                </Link>
              </div>

              {/* Registration Success Notification Banner */}
              {registeredSuccess && (
                <div className="auth-success-banner">
                  <span style={{ fontSize: '1.2rem' }}>🎉</span>
                  <div>
                    <div style={{ fontWeight: 800 }}>Squad Registered Successfully!</div>
                    <div style={{ fontSize: '0.78rem', opacity: 0.9 }}>Enter your team credentials below to access the arena.</div>
                  </div>
                </div>
              )}

              {/* Header Telemetry */}
              <div style={{ textAlign: 'center', marginBottom: '24px' }}>
                <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(224, 27, 34, 0.12)', border: '1px solid rgba(224, 27, 34, 0.35)', padding: '5px 16px', borderRadius: '24px', marginBottom: '14px', backdropFilter: 'blur(10px)' }}>
                  <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#EF4444' }} />
                  <span style={{ fontSize: '0.72rem', color: '#FF6B6B', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    LOGIN 2026 • NEURAL LINK TERMINAL
                  </span>
                </div>

                <h2 style={{
                  fontSize: '2.1rem',
                  marginBottom: '8px'
                }} className="auth-title-cinematic">
                  {step === 1 ? 'PORTAL LOGIN' : 'IDENTIFY PILOT'}
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', letterSpacing: '0.5px', margin: 0, lineHeight: 1.5 }}>
                  {step === 1 ? 'Enter squad credentials to initialize cyber arena session' : 'Specify which squad member is attempting this quiz session'}
                </p>
              </div>

              {error && (
                <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.86rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px', animation: 'ruleCardSlideIn 0.3s ease-out' }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              {step === 1 ? (
                <>
                  <form onSubmit={handleLogin}>
                    <div style={{ marginBottom: '18px' }}>
                      <label htmlFor="teamId" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                        TEAM ID / USERNAME
                      </label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">🛡️</span>
                        <input
                          type="text"
                          id="teamId"
                          name="teamId"
                          className="auth-input-field"
                          required
                          value={formData.teamId}
                          onChange={handleChange}
                          placeholder="e.g., T-101 or team_cyber"
                        />
                      </div>
                    </div>

                    <div style={{ marginBottom: '24px' }}>
                      <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                        SECURITY ACCESS KEY / PASSWORD
                      </label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">🔑</span>
                        <input
                          type={showPassword ? 'text' : 'password'}
                          id="password"
                          name="password"
                          className="auth-input-field"
                          required
                          value={formData.password}
                          onChange={handleChange}
                          placeholder="••••••••••••"
                        />
                        <button
                          type="button"
                          onClick={() => setShowPassword(prev => !prev)}
                          className="auth-input-action-btn"
                          title={showPassword ? 'Hide Password' : 'Show Password'}
                        >
                          {showPassword ? '🙈' : '👁️'}
                        </button>
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '14px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1.2px', borderRadius: '8px', boxShadow: '0 0 24px rgba(224, 27, 34, 0.6)' }} 
                      disabled={loading}
                    >
                      {loading ? 'Authenticating Uplink...' : '⚡ LAUNCH INTO ARENA ➔'}
                    </button>
                  </form>

                  <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                    <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                      Unregistered squad?{' '}
                      <Link href="/register" style={{ color: '#FF4D4D', textDecoration: 'none', fontWeight: 'bold' }}>
                        Register Team Here ➔
                      </Link>
                    </p>
                    <p style={{ margin: 0 }}>
                      <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                        &larr; Return to Home Command
                      </Link>
                    </p>
                  </div>
                </>
              ) : (
                <div style={{ textAlign: 'center' }}>
                  <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '58px', height: '58px', borderRadius: '50%', background: 'radial-gradient(circle at 35% 35%, #E01B22 0%, #850B12 100%)', border: '2px solid #FF4D4D', margin: '0 auto 16px auto', boxShadow: '0 0 20px rgba(224, 27, 34, 0.5)' }}>
                    <span style={{ fontSize: '1.8rem' }}>🧑‍🚀</span>
                  </div>

                  <div style={{ background: 'rgba(224, 27, 34, 0.08)', border: '1px solid rgba(224, 27, 34, 0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#FF6B6B', fontWeight: 'bold', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>
                      STAGE 0 INDIVIDUAL TELEMETRY
                    </span>
                    <p style={{ fontSize: '0.86rem', color: '#FFF', margin: 0, lineHeight: '1.5' }}>
                      Each registered teammate attempts Stage 0 independently. Your individual score directly factors into your squad's overall average.
                    </p>
                  </div>

                  <form onSubmit={handleSelectParticipant}>
                    <div style={{ textAlign: 'left', marginBottom: '22px' }}>
                      <label htmlFor="participantName" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                        PILOT / PARTICIPANT NAME
                      </label>
                      <div className="auth-input-container">
                        <span className="auth-input-icon">👤</span>
                        <input
                          type="text"
                          id="participantName"
                          className="auth-input-field"
                          required
                          value={participantName}
                          onChange={(e) => setParticipantName(e.target.value)}
                          placeholder="e.g., Yash, Vignesh, Alex..."
                          autoFocus
                        />
                      </div>
                    </div>

                    <button 
                      type="submit" 
                      className="btn-primary" 
                      style={{ width: '100%', padding: '14px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1.2px', borderRadius: '8px', boxShadow: '0 0 24px rgba(224, 27, 34, 0.6)' }}
                    >
                      ⚡ ENTER ARENA &amp; BEGIN ➔
                    </button>
                  </form>

                  <button 
                    onClick={() => {
                      localStorage.clear()
                      setStep(1)
                    }} 
                    style={{ marginTop: '20px', background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold', letterSpacing: '0.5px' }}
                  >
                    ← Cancel &amp; Switch Team
                  </button>
                </div>
              )}
            </div>

            {/* Footer Security Watermark */}
            <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              🔒 256-BIT TELEMETRY ENCRYPTION • LIVE LEADERBOARD SYNC
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
