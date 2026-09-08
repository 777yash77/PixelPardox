'use client'

import { useState } from 'react'
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
        setError(data.message || 'Login failed')
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
      setError('Please enter your name.')
      return
    }
    localStorage.setItem('participantName', participantName)
    router.push('/game')
  }

  return (
    <div className="container flex-center page-transition" style={{ minHeight: '100vh', padding: '40px 16px', position: 'relative' }}>
      <div className="glass-panel" style={{
        width: '100%',
        maxWidth: '460px',
        padding: '38px',
        border: '1.5px solid rgba(224, 27, 34, 0.45)',
        background: 'linear-gradient(145deg, rgba(24, 10, 14, 0.96) 0%, rgba(10, 5, 8, 0.98) 100%)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(224, 27, 34, 0.25)',
        position: 'relative',
        overflow: 'hidden'
      }}>
        {/* Top telemetry tag */}
        <div style={{ textAlign: 'center', marginBottom: '24px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(224, 27, 34, 0.12)', border: '1px solid rgba(224, 27, 34, 0.4)', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>
            <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#22C55E' }} />
            <span style={{ fontSize: '0.72rem', color: '#FF6B6B', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              LOGIN 2026 • ARENA ACCESS
            </span>
          </div>

          <h2 style={{ fontSize: '2.2rem', marginBottom: '6px', letterSpacing: '2px', textTransform: 'uppercase' }} className="glitch-text" data-text={step === 1 ? 'PORTAL LOGIN' : 'IDENTIFY PILOT'}>
            {step === 1 ? 'PORTAL LOGIN' : 'IDENTIFY PILOT'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.84rem', letterSpacing: '0.8px', margin: 0 }}>
            {step === 1 ? 'Enter squad credentials to initialize neural link' : 'Specify which team pilot is navigating this session'}
          </p>
        </div>

        {error && (
          <div style={{ background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #EF4444', borderRadius: '8px', padding: '12px 16px', color: '#FCA5A5', fontSize: '0.86rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px' }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        {step === 1 ? (
          <>
            <form onSubmit={handleLogin}>
              <div className="form-group" style={{ marginBottom: '18px' }}>
                <label className="form-label" htmlFor="teamId" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  TEAM ID / USERNAME
                </label>
                <input
                  type="text"
                  id="teamId"
                  name="teamId"
                  className="form-input"
                  required
                  value={formData.teamId}
                  onChange={handleChange}
                  placeholder="e.g., T-101 or team_cyber"
                  style={{ borderRadius: '8px', padding: '12px 14px', fontSize: '0.95rem' }}
                />
              </div>

              <div className="form-group" style={{ marginBottom: '24px' }}>
                <label className="form-label" htmlFor="password" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '700', letterSpacing: '0.5px' }}>
                  SECURITY ACCESS KEY / PASSWORD
                </label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="••••••••••••"
                  style={{ borderRadius: '8px', padding: '12px 14px', fontSize: '0.95rem' }}
                />
              </div>

              <button 
                type="submit" 
                className="btn-primary" 
                style={{ width: '100%', padding: '13px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1px', borderRadius: '8px', boxShadow: '0 0 20px rgba(224, 27, 34, 0.5)' }} 
                disabled={loading}
              >
                {loading ? 'Authenticating Uplink...' : '⚡ Launch Into Arena'}
              </button>
            </form>

            <div style={{ marginTop: '26px', textAlign: 'center', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '10px' }}>
              <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
                Unregistered squad?{' '}
                <Link href="/register" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: 'bold' }}>
                  Register Team Here →
                </Link>
              </p>
              <p style={{ margin: 0 }}>
                <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
                  &larr; Return to Home Command
                </Link>
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', borderRadius: '10px', padding: '12px 16px', marginBottom: '22px' }}>
              <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 'bold', display: 'block', marginBottom: '2px' }}>
                INDIVIDUAL TELEMETRY
              </span>
              <p style={{ fontSize: '0.85rem', color: '#FFF', margin: 0 }}>
                Each teammate attempts Stage 0 individually. Your personal score directly factors into the team average.
              </p>
            </div>

            <form onSubmit={handleSelectParticipant}>
              <div className="form-group" style={{ textAlign: 'left', marginBottom: '20px' }}>
                <label className="form-label" htmlFor="participantName" style={{ fontSize: '0.82rem', color: 'var(--text-primary)', fontWeight: '700' }}>
                  PILOT / PARTICIPANT NAME
                </label>
                <input
                  type="text"
                  id="participantName"
                  className="form-input"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g., Yash, Vignesh, Alex..."
                  style={{ borderRadius: '8px', padding: '12px 14px', fontSize: '0.95rem' }}
                />
              </div>

              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', padding: '13px', fontSize: '0.98rem', fontWeight: '800', letterSpacing: '1px', borderRadius: '8px', boxShadow: '0 0 20px rgba(224, 27, 34, 0.5)' }}
              >
                ⚡ Enter Arena &amp; Begin
              </button>
            </form>

            <button 
              onClick={() => {
                localStorage.clear()
                setStep(1)
              }} 
              style={{ marginTop: '22px', background: 'none', border: 'none', color: '#FF6B6B', cursor: 'pointer', fontSize: '0.82rem', fontWeight: 'bold' }}
            >
              ← Cancel &amp; Switch Team
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
