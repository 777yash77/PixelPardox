'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [showPassword, setShowPassword] = useState(false)

  const [formData, setFormData] = useState({
    teamName: '',
    teamId: '',
    password: '',
    teamSize: '2'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleSelectSize = (size) => {
    setFormData({ ...formData, teamSize: size })
  }

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    if (!formData.teamName.trim() || !formData.teamId.trim() || !formData.password.trim()) {
      setError('All fields are required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, teamSize: parseInt(formData.teamSize) }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/login?registered=1')
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch {
      setError('Cannot connect to authentication server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
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
          
          {/* LEFT COLUMN: SQUAD COMMISSIONING INTELLIGENCE (Spider-Man Blue Theme with Horizontal Dashboard Grid) */}
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
                  MULTIVERSE PROTOCOL • SQUAD COMMISSIONING
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
                SQUAD ROSTER COMMISSIONING
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.94rem', lineHeight: '1.65', marginBottom: '24px' }}>
                Establish your team identity and configure member roster before entering the neural battleground. Each registered squad member participates under your collective banner.
              </p>

              {/* Tactical Briefing Protocol Cards (Horizontal Sub-Grid) */}
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(230px, 1fr))', gap: '14px' }}>
                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>👥</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>SQUAD FORMATION FORMAT</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>2 - 4 PILOTS</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Form a Duo, Trio, or Quad unit. Each pilot logs into the arena portal using your squad credentials and enters their personal operative handle.
                  </p>
                </div>

                <div className="auth-briefing-item">
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>⚡</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>COLLECTIVE AGGREGATION</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>AVERAGE SCORE</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Your tournament qualifying position is determined by averaging scores across all squad members. Assemble teammates with complementary forensic skills!
                  </p>
                </div>

                <div className="auth-briefing-item" style={{ gridColumn: '1 / -1' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '6px' }}>
                    <span style={{ fontSize: '1.15rem' }}>🛡️</span>
                    <span style={{ fontSize: '0.86rem', fontWeight: 800, color: '#7DD3FC', letterSpacing: '0.5px' }}>MULTIVERSE TOURNAMENT PATH</span>
                    <span style={{ marginLeft: 'auto', background: 'rgba(56, 189, 248, 0.2)', border: '1px solid rgba(56, 189, 248, 0.45)', borderRadius: '4px', padding: '2px 8px', fontSize: '0.7rem', color: '#FFF', fontWeight: 700 }}>4 ROUNDS</span>
                  </div>
                  <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0, lineHeight: 1.45 }}>
                    Survive Stage 0 Prelims to unlock Stage 1 Pixel Detective, Stage 2 Audio Deepfake Matrix, and the Grand Multiverse Showdown.
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
                  "Pick teammates who know their AI artifacts! Duo, Trio, or Quad — maximum effort!"
                </div>
              </div>
            </div>
          </div>

          {/* RIGHT COLUMN: CENTRAL REGISTRATION TERMINAL CARD (Deadpool Crimson Red Theme) */}
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
                <Link href="/login" className="auth-nav-tab">
                  <span>🔑 SQUAD SIGN IN</span>
                </Link>
                <Link href="/register" className="auth-nav-tab active-register">
                  <span>🛡️ REGISTER SQUAD</span>
                </Link>
              </div>

              {/* Header Telemetry */}
              <div style={{ textAlign: 'center', marginBottom: '22px' }}>
                <div style={{
                  display: 'inline-flex',
                  alignItems: 'center',
                  gap: '8px',
                  background: 'rgba(224, 27, 34, 0.12)',
                  border: '1px solid rgba(224, 27, 34, 0.35)',
                  padding: '5px 16px',
                  borderRadius: '24px',
                  marginBottom: '12px',
                  backdropFilter: 'blur(10px)'
                }}>
                  <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#EF4444' }} />
                  <span style={{ fontSize: '0.72rem', color: '#FF6B6B', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                    COMMISSIONING 2026 • SQUAD ENROLLMENT
                  </span>
                </div>

                <h2 style={{
                  fontSize: '2.1rem',
                  marginBottom: '6px'
                }} className="auth-title-cinematic">
                  REGISTER SQUAD
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', letterSpacing: '0.5px', margin: 0, lineHeight: 1.5 }}>
                  Establish squad credentials to compete in Stage 0 &amp; live tournament rounds
                </p>
              </div>

              {error && (
                <div style={{
                  background: 'rgba(239, 68, 68, 0.12)',
                  border: '1.5px solid #EF4444',
                  borderRadius: '8px',
                  padding: '12px 16px',
                  color: '#FCA5A5',
                  fontSize: '0.86rem',
                  marginBottom: '18px',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '8px',
                  animation: 'ruleCardSlideIn 0.3s ease-out'
                }}>
                  <span>⚠️</span>
                  <span>{error}</span>
                </div>
              )}

              <form onSubmit={handleRegister}>
                {/* Widescreen 2-Column Row for Team Name and Team ID */}
                <div className="auth-form-row-2col">
                  <div>
                    <label htmlFor="teamName" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      TEAM NAME <span style={{ color: '#FF6B6B' }}>*</span>
                    </label>
                    <div className="auth-input-container">
                      <span className="auth-input-icon">🏷️</span>
                      <input
                        type="text"
                        id="teamName"
                        name="teamName"
                        className="auth-input-field"
                        required
                        value={formData.teamName}
                        onChange={handleChange}
                        placeholder="e.g., Cyber Knights"
                      />
                    </div>
                  </div>

                  <div>
                    <label htmlFor="teamId" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                      TEAM ID (UNIQUE LOGIN ID) <span style={{ color: '#FF6B6B' }}>*</span>
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
                        placeholder="e.g., T-101"
                      />
                    </div>
                  </div>
                </div>

                {/* Team Access Password */}
                <div style={{ marginBottom: '18px' }}>
                  <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
                    TEAM ACCESS PASSWORD <span style={{ color: '#FF6B6B' }}>*</span>
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
                      placeholder="Choose a secure team password"
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

                {/* Squad Size Selector Chips */}
                <div style={{ marginBottom: '16px' }}>
                  <label style={{
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: 'var(--text-primary)',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    marginBottom: '8px',
                    letterSpacing: '0.8px'
                  }}>
                    <span>SQUAD SIZE FORMAT <span style={{ color: '#FF6B6B' }}>*</span></span>
                    <span style={{ fontSize: '0.72rem', color: '#FF7B7B', fontWeight: '700', letterSpacing: '0.5px' }}>
                      ⚡ {formData.teamSize} PILOTS CONFIGURED
                    </span>
                  </label>

                  <div className="squad-size-grid">
                    {[
                      { size: '2', title: '2 Members', sub: 'Duo Strike', icon: '👥' },
                      { size: '3', title: '3 Members', sub: 'Trio Assault', icon: '⚡' },
                      { size: '4', title: '4 Members', sub: 'Quad Force', icon: '🛡️' },
                    ].map((item) => {
                      const isSelected = formData.teamSize === item.size
                      return (
                        <button
                          key={item.size}
                          type="button"
                          onClick={() => handleSelectSize(item.size)}
                          className={`squad-size-chip ${isSelected ? 'selected' : ''}`}
                        >
                          <span style={{ fontSize: '1.15rem', marginBottom: '2px' }}>{item.icon}</span>
                          <span style={{ fontSize: '0.86rem', fontWeight: '800' }}>{item.title}</span>
                          <span className="chip-badge" style={{ fontSize: '0.68rem', opacity: isSelected ? 1 : 0.65, letterSpacing: '0.5px' }}>
                            {item.sub}
                          </span>
                          {isSelected && (
                            <span style={{ fontSize: '0.62rem', color: '#FF6B6B', fontWeight: 900, marginTop: '2px', letterSpacing: '0.5px' }}>
                              ✓ SELECTED
                            </span>
                          )}
                        </button>
                      )
                    })}
                  </div>
                </div>

                {/* Dynamic Squad Roster Matrix */}
                <div style={{ marginBottom: '22px' }}>
                  <div style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: 700, letterSpacing: '0.8px', textTransform: 'uppercase', marginBottom: '8px' }}>
                    Active Squad Roster Allocation:
                  </div>
                  <div className="squad-roster-matrix">
                    {[1, 2, 3, 4].map((slot) => {
                      const isActive = slot <= parseInt(formData.teamSize)
                      return (
                        <div key={slot} className={`squad-roster-slot ${isActive ? 'active' : ''}`}>
                          <div className="slot-badge">{slot === 1 ? 'LEAD' : `P0${slot}`}</div>
                          <div className="slot-title">{slot === 1 ? 'Squad Lead' : `Pilot 0${slot}`}</div>
                          <div className="slot-status">{isActive ? '✓ ACTIVE' : 'STANDBY'}</div>
                        </div>
                      )
                    })}
                  </div>
                </div>

                {/* Submit Button */}
                <button
                  type="submit"
                  disabled={loading}
                  className="btn-primary-red"
                  style={{
                    width: '100%',
                    padding: '14px',
                    fontSize: '0.98rem',
                    fontWeight: '800',
                    letterSpacing: '1.2px',
                    borderRadius: '8px',
                    boxShadow: '0 0 24px rgba(224, 27, 34, 0.6)'
                  }}
                >
                  {loading ? 'Transmitting Squad Intel...' : '⚡ LOCK IN & REGISTER SQUAD ➔'}
                </button>
              </form>

              {/* Footer Navigation */}
              <div style={{ marginTop: '22px', textAlign: 'center', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                  Already registered?{' '}
                  <Link href="/login" style={{ color: '#FF4D4D', textDecoration: 'none', fontWeight: '700' }}>
                    Sign in here ➔
                  </Link>
                </p>
                <p style={{ margin: 0 }}>
                  <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                    &larr; Return to Home Command
                  </Link>
                </p>
              </div>
            </div>

            {/* Footer Security Watermark */}
            <div style={{ marginTop: '22px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
              🔒 256-BIT TELEMETRY ENCRYPTION • NEURAL COMBAT ENGINE
            </div>
          </div>
        </div>
      </div>
    </div>
  )
}
