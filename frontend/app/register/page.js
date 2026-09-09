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
      padding: '40px 16px'
    }}>
      {/* Spider-Web Corner Accents */}
      <svg className="web-accent" style={{ top: 0, left: 0, width: '220px', height: '220px' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.5" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.35" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.35" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
      </svg>

      <svg className="web-accent" style={{ top: 0, right: 0, width: '220px', height: '220px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.5" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.35" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.35" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#38BDF8" strokeWidth="0.5" opacity="0.4" />
      </svg>

      {/* Atmospheric Ambient Glow Orb behind Card */}
      <div className="auth-ambient-glow cyan" />

      {/* LEFT SIDE: DEADPOOL PERCH MASCOT */}
      <div className="auth-page-mascot-left">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="deadpool-speech card-hover-lift" style={{ maxWidth: '185px', fontSize: '0.74rem', marginBottom: '8px', borderLeft: '3px solid #E23636' }}>
            <div style={{ fontSize: '0.62rem', color: '#FACC15', fontWeight: 900, marginBottom: '2px', letterSpacing: '0.5px' }}>⚡ MAXIMUM EFFORT!</div>
            ⚔️ "Pick teammates who know what an algorithm is. Please!"
          </div>
          <div style={{ width: '68px', height: '110px', filter: 'drop-shadow(0 8px 18px rgba(226,54,54,0.65))' }}>
            <img src="/deadpool_model.png" alt="Deadpool" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* RIGHT SIDE: SPIDER-MAN SWINGING MASCOT */}
      <div className="auth-page-mascot-right">
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          <div className="spidey-speech card-hover-lift" style={{ maxWidth: '185px', fontSize: '0.74rem', marginBottom: '8px', borderLeft: '3px solid #38BDF8' }}>
            <div style={{ fontSize: '0.62rem', color: '#38BDF8', fontWeight: 900, marginBottom: '2px', letterSpacing: '0.5px' }}>🕸️ THWIP!</div>
            🕸️ "Duo, Trio, or Quad squad! Coordinate and conquer Stage 0!"
          </div>
          <div style={{ width: '68px', height: '110px', filter: 'drop-shadow(0 8px 18px rgba(56,189,248,0.65))' }}>
            <img src="/spiderman_model.png" alt="Spider-Man" style={{ width: '100%', height: '100%', objectFit: 'contain' }} />
          </div>
        </div>
      </div>

      {/* CENTRAL AUTHENTICATION TERMINAL CARD */}
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '520px',
        padding: '38px 32px',
        border: '1.5px solid rgba(56, 189, 248, 0.45)',
        borderTop: '2px solid rgba(125, 211, 252, 0.7)',
        background: 'linear-gradient(160deg, rgba(10, 18, 28, 0.96) 0%, rgba(6, 10, 18, 0.98) 100%)',
        boxShadow: '0 24px 70px rgba(0, 0, 0, 0.95), 0 0 45px rgba(56, 189, 248, 0.22), inset 0 1px 0 rgba(255, 255, 255, 0.12)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden',
        zIndex: 30
      }}>
        {/* HUD Cyber Corners (Cyan Theme) */}
        <div className="cyan-corners">
          <div className="cyber-corner-tl" />
          <div className="cyber-corner-tr" />
          <div className="cyber-corner-bl" />
          <div className="cyber-corner-br" />
        </div>

        {/* Top Scanning Laser Line */}
        <div className="acknowledge-laser-line" />

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
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(56, 189, 248, 0.12)',
            border: '1px solid rgba(56, 189, 248, 0.35)',
            padding: '5px 16px',
            borderRadius: '24px',
            marginBottom: '14px',
            backdropFilter: 'blur(10px)'
          }}>
            <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8' }} />
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              LOGIN 2026 • SQUAD PROTOCOL
            </span>
          </div>

          <h2 style={{
            fontSize: '2.1rem',
            marginBottom: '6px',
            letterSpacing: '2px',
            textTransform: 'uppercase',
            background: 'linear-gradient(180deg, #FFFFFF 25%, #7DD3FC 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent',
            filter: 'drop-shadow(0 0 20px rgba(56, 189, 248, 0.5))'
          }} className="glitch-text" data-text="REGISTER SQUAD">
            REGISTER SQUAD
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', letterSpacing: '0.5px', margin: 0, lineHeight: 1.5 }}>
            Establish your squad credentials to compete in Stage 0 &amp; live tournament rounds
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
            marginBottom: '20px',
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
          {/* Team Name */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="teamName" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
              TEAM NAME <span style={{ color: '#FF6B6B' }}>*</span>
            </label>
            <div className="auth-input-container cyan-focus">
              <span className="auth-input-icon">🏷️</span>
              <input
                type="text"
                id="teamName"
                name="teamName"
                className="auth-input-field"
                required
                value={formData.teamName}
                onChange={handleChange}
                placeholder="e.g., Cyber Knights, Neural Hackers"
              />
            </div>
          </div>

          {/* Team ID */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="teamId" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
              TEAM ID (UNIQUE LOGIN ID) <span style={{ color: '#FF6B6B' }}>*</span>
            </label>
            <div className="auth-input-container cyan-focus">
              <span className="auth-input-icon">🛡️</span>
              <input
                type="text"
                id="teamId"
                name="teamId"
                className="auth-input-field"
                required
                value={formData.teamId}
                onChange={handleChange}
                placeholder="e.g., T-101 or team_knights"
              />
            </div>
          </div>

          {/* Password */}
          <div style={{ marginBottom: '18px' }}>
            <label htmlFor="password" style={{ display: 'block', fontSize: '0.8rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.8px', marginBottom: '6px' }}>
              TEAM ACCESS PASSWORD <span style={{ color: '#FF6B6B' }}>*</span>
            </label>
            <div className="auth-input-container cyan-focus">
              <span className="auth-input-icon">🔑</span>
              <input
                type={showPassword ? 'text' : 'password'}
                id="password"
                name="password"
                className="auth-input-field"
                required
                value={formData.password}
                onChange={handleChange}
                placeholder="Choose secure team password"
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
          <div style={{ marginBottom: '24px' }}>
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
              <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: '700', letterSpacing: '0.5px' }}>
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
                      <span style={{ fontSize: '0.62rem', color: '#38BDF8', fontWeight: 900, marginTop: '2px', letterSpacing: '0.5px' }}>
                        ✓ SELECTED
                      </span>
                    )}
                  </button>
                )
              })}
            </div>
          </div>

          {/* Submit Button */}
          <button
            type="submit"
            disabled={loading}
            className="btn-primary"
            style={{
              width: '100%',
              padding: '14px',
              fontSize: '0.98rem',
              fontWeight: '800',
              letterSpacing: '1.2px',
              borderRadius: '8px',
              boxShadow: '0 4px 24px rgba(2, 132, 199, 0.55), inset 0 1px 2px rgba(255, 255, 255, 0.35)',
              background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)',
              border: '1.5px solid rgba(56, 189, 248, 0.65)',
              transition: 'all 0.25s cubic-bezier(0.34, 1.56, 0.64, 1)'
            }}
          >
            {loading ? 'Transmitting Squad Intel...' : '⚡ LOCK IN & REGISTER SQUAD ➔'}
          </button>
        </form>

        {/* Footer Navigation */}
        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: '700' }}>
              Sign in here ➔
            </Link>
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
              &larr; Return to Home Command
            </Link>
          </p>
        </div>

        {/* Footer Security Watermark */}
        <div style={{ marginTop: '24px', paddingTop: '16px', borderTop: '1px solid rgba(255, 255, 255, 0.06)', textAlign: 'center', fontSize: '0.72rem', color: 'var(--text-dim)', letterSpacing: '1px', textTransform: 'uppercase' }}>
          🔒 256-BIT TELEMETRY ENCRYPTION • LIVE LEADERBOARD SYNC
        </div>
      </div>
    </div>
  )
}
