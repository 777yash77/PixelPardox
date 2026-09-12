'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_BASE_URL } from '@/lib/api'

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

  const [memberNamesList, setMemberNamesList] = useState([])

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const params = new URLSearchParams(window.location.search)
      if (params.get('registered') === '1') {
        setRegisteredSuccess(true)
      }
      if (params.get('teamId')) {
        setFormData(prev => ({ ...prev, teamId: params.get('teamId') }))
      }
      const savedMembers = localStorage.getItem('memberNames')
      if (savedMembers) {
        const members = savedMembers.split(',').map(s => s.trim()).filter(Boolean)
        setMemberNamesList(members)
      }
      const token = localStorage.getItem('token')
      const role = localStorage.getItem('role')
      if (token && role === 'ROLE_TEAM' && !localStorage.getItem('participantName')) {
        setStep(2)
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
      const response = await fetch(`${API_BASE_URL}/api/auth/login`, {
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
        localStorage.setItem('teamSize', data.teamSize || '2')
        localStorage.setItem('memberNames', data.memberNames || '')

        if (data.memberNames) {
          const members = data.memberNames.split(',').map(s => s.trim()).filter(Boolean)
          setMemberNamesList(members)
        }

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
      padding: '30px 20px',
      width: '100%'
    }}>
      {/* Spider-Web Corner Accents (Left: Spidey Blue, Right: Deadpool Red) */}
      <svg className="web-accent" style={{ top: 0, left: 0, width: '240px', height: '240px' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.6" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#38BDF8" strokeWidth="0.5" opacity="0.45" />
      </svg>

      <svg className="web-accent" style={{ top: 0, right: 0, width: '240px', height: '240px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.6" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.45" />
      </svg>

      {/* Atmospheric Ambient Glow Orbs behind Cards (Dual Blue & Red) */}
      <div className="auth-ambient-glow cyan" style={{ top: '20%', left: '22%', transform: 'translate(-50%, -20%)' }} />
      <div className="auth-ambient-glow red" style={{ bottom: '15%', right: '15%', transform: 'translate(20%, 15%)' }} />

      {/* EXPANSIVE DUAL-COLUMN COMMAND WRAPPER (Widescreen Horizontal Space Utilization) */}
      <div className="auth-command-wrapper">
        {/* Top Breadcrumb Navigation */}
        <div style={{ marginBottom: '14px', display: 'flex', alignItems: 'center', justifyContent: 'space-between' }}>
          <Link href="/" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px', color: 'var(--text-secondary)', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '700', textTransform: 'uppercase', letterSpacing: '1px' }}>
            <span>&larr;</span> <span>Home Command</span>
          </Link>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: 800, background: 'rgba(56,189,248,0.12)', border: '1px solid rgba(56,189,248,0.3)', padding: '3px 10px', borderRadius: '12px' }}>
              🕷️ SPIDEY MENTOR ACTIVE
            </span>
            <span style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: 800, background: 'rgba(224,27,34,0.12)', border: '1px solid rgba(224,27,34,0.3)', padding: '3px 10px', borderRadius: '12px' }}>
              ⚔️ DEADPOOL LIVE
            </span>
          </div>
        </div>

        <div className="auth-command-grid">

          {/* LEFT COLUMN: MULTIVERSE BRIEFING & TELEMETRY (Spider-Man Blue Theme with Horizontal Dashboard Grid) */}
          <div className="auth-briefing-panel">
            <div>
              {/* Telemetry Pill */}
              <div style={{
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px',
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid rgba(56, 189, 248, 0.4)',
                padding: '6px 16px',
                borderRadius: '24px',
                marginBottom: '20px'
              }}>
                <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#38BDF8' }} />
                <span style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  MULTIVERSE PROTOCOL • MISSION INTELLIGENCE
                </span>
              </div>

              <h3 style={{
                fontSize: '2.1rem',
                fontWeight: 800,
                marginBottom: '14px',
                letterSpacing: '-0.01em',
                background: 'linear-gradient(135deg, #FFF 0%, #BAE6FD 50%, #38BDF8 100%)',
                WebkitBackgroundClip: 'text',
                WebkitTextFillColor: 'transparent'
              }}>
                BATTLE ARENA ACCESS CLEARANCE
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '24px' }}>
                Welcome to Pixel Paradox. Authenticate your squad credentials on the terminal to synchronize with the neural forensic mainframe and initialize Stage 0 Prelims.
              </p>

              {/* Tactical Briefing Dashboard Cards (Horizontal Sub-Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>⏱️</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>STAGE 0 PRELIMS</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>30m</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    30 MCQs strictly timed. Auto-locks upon completion and aggregates your team average.
                  </p>
                </div>

                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>🎯</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>SCORING RULES</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>+10 / -5</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Correct answer awards <strong style={{ color: '#7DD3FC' }}>+10 pts</strong>. Incorrect deducts <strong style={{ color: '#FF7B7B' }}>-5 pts</strong>.
                  </p>
                </div>

                <div className="auth-briefing-item" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>👁️</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>AI INVIGILATION PROTOCOL</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>SILENT WEBCAM</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Continuous silent snapshot monitoring maintains tournament integrity. Keep focus on the active exam window.
                  </p>
                </div>
              </div>
            </div>

            {/* Mascot Tactical Comms Stream */}
            <div style={{ marginTop: '24px', paddingTop: '18px', borderTop: '1px solid rgba(56, 189, 248, 0.25)', display: 'flex', alignItems: 'center', gap: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(56, 189, 248, 0.35) 0%, transparent 70%)', border: '1.5px solid #38BDF8', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/spiderman_model.png" alt="Spider-Man" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
                <div style={{ width: '46px', height: '46px', borderRadius: '50%', background: 'radial-gradient(circle, rgba(224, 27, 34, 0.35) 0%, transparent 70%)', border: '1.5px solid #E01B22', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', flexShrink: 0 }}>
                  <img src="/deadpool_model.png" alt="Deadpool" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
                </div>
              </div>
              <div style={{ flex: 1 }}>
                <div style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: 800, letterSpacing: '0.8px', textTransform: 'uppercase' }}>
                  TACTICAL COMMS STREAM
                </div>
                <div style={{ fontSize: '0.84rem', color: 'var(--text-primary)', fontStyle: 'italic', marginTop: '2px' }}>
                  "Sign in, trust your instincts, and conquer the neural synthetic matrix with Maximum Effort!"
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CENTRAL AUTHENTICATION TERMINAL CARD (Deadpool Crimson Red Theme) */}
          <div className="glass-panel" style={{
            padding: '38px 34px',
            border: '1.5px solid rgba(224, 27, 34, 0.45)',
            borderTop: '2px solid rgba(255, 110, 110, 0.65)',
            background: 'linear-gradient(160deg, rgba(26, 10, 15, 0.96) 0%, rgba(10, 5, 8, 0.98) 100%)',
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
                  <span style={{ fontSize: '0.72rem', color: '#FF7B7B', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    LOGIN 2026 • NEURAL LINK TERMINAL
                  </span>
                </div>

                <h2 style={{
                  fontSize: '2.1rem',
                  marginBottom: '8px'
                }} className="auth-title-cinematic">
                  {step === 1 ? 'PORTAL LOGIN' : 'SELECT TEAM MEMBER'}
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
                    <div className="auth-form-row-2col">
                      <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="teamId" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                          TEAM ID / USERNAME <span style={{ color: '#FF6B6B' }}>*</span>
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

                      <div style={{ marginBottom: '18px' }}>
                        <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                          ACCESS KEY / PASSWORD <span style={{ color: '#FF6B6B' }}>*</span>
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
                    </div>

                    <button
                      type="submit"
                      className="btn-primary-red"
                      style={{ width: '100%', padding: '14px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1.2px', borderRadius: '8px', marginTop: '10px' }}
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

                  <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '14px 16px', marginBottom: '22px' }}>
                    <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 'bold', display: 'block', marginBottom: '4px', letterSpacing: '1px' }}>
                      STAGE 0 SQUAD TELEMETRY
                    </span>
                    <p style={{ fontSize: '0.86rem', color: '#FFF', margin: 0, lineHeight: '1.5' }}>
                      All registered team members in Team <strong>{formData.teamId.toUpperCase()}</strong> attempt Stage 0 independently. Your individual score directly adds into your team's total leaderboard score.
                    </p>
                  </div>

                  {memberNamesList.length > 0 && (
                    <div style={{ marginBottom: '20px' }}>
                      <span style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: 'bold', letterSpacing: '0.8px', display: 'block', marginBottom: '8px', textTransform: 'uppercase' }}>
                        Select Your Registered Member Profile:
                      </span>
                      <div style={{ display: 'flex', gap: '8px', flexWrap: 'wrap', justifyContent: 'center' }}>
                        {memberNamesList.map(name => {
                          const isChosen = participantName === name
                          return (
                            <button
                              key={name}
                              type="button"
                              onClick={() => setParticipantName(name)}
                              className="btn-secondary"
                              style={{
                                padding: '8px 14px',
                                fontSize: '0.82rem',
                                borderColor: isChosen ? '#38BDF8' : 'rgba(255,255,255,0.2)',
                                background: isChosen ? 'rgba(56,189,248,0.2)' : 'rgba(255,255,255,0.05)',
                                color: isChosen ? '#38BDF8' : '#FFF',
                                fontWeight: isChosen ? '800' : '600'
                              }}
                            >
                              👤 {name} {isChosen && '✓'}
                            </button>
                          )
                        })}
                      </div>
                    </div>
                  )}

                  <form onSubmit={handleSelectParticipant}>
                    <div style={{ textAlign: 'left', marginBottom: '22px' }}>
                      <label htmlFor="participantName" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                        TEAM MEMBER NAME {memberNamesList.length > 0 && '(OR TYPE CUSTOM)'}
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
                      className="btn-primary-red"
                      style={{ width: '100%', padding: '14px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1.2px', borderRadius: '8px' }}
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
              🔒 256-BIT TELEMETRY ENCRYPTION • TOURNAMENT ENGINES SYNCHRONIZED
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
