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
    <div className="container flex-center page-transition" style={{ minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2.5rem', marginBottom: '8px', letterSpacing: '2px' }} className="glitch-text" data-text={step === 1 ? 'PORTAL LOGIN' : 'IDENTIFY USER'}>
            {step === 1 ? 'PORTAL LOGIN' : 'IDENTIFY USER'}
          </h2>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '4px', textTransform: 'uppercase', letterSpacing: '1px' }}>LOGIN 2026: The Last Human</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,20,147,0.1)', border: '1px solid #ff1493', borderRadius: '8px', padding: '12px', color: '#ff5c93', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        {step === 1 ? (
          <>
            <form onSubmit={handleLogin}>
              <div className="form-group">
                <label className="form-label" htmlFor="teamId">Team ID</label>
                <input
                  type="text"
                  id="teamId"
                  name="teamId"
                  className="form-input"
                  required
                  value={formData.teamId}
                  onChange={handleChange}
                  placeholder="e.g., T-1234"
                />
              </div>

              <div className="form-group">
                <label className="form-label" htmlFor="password">Password</label>
                <input
                  type="password"
                  id="password"
                  name="password"
                  className="form-input"
                  required
                  value={formData.password}
                  onChange={handleChange}
                  placeholder="Enter password"
                />
              </div>

              <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '12px' }} disabled={loading}>
                {loading ? 'Logging in...' : 'Sign In'}
              </button>
            </form>

            <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.9rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
              <p style={{ color: 'var(--text-secondary)' }}>
                New team? <Link href="/register" style={{ color: 'var(--color-neon-blue)', textDecoration: 'none', fontWeight: 'bold' }}>Register here</Link>
              </p>
              <p>
                <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase' }}>&larr; Back to Home</Link>
              </p>
            </div>
          </>
        ) : (
          <div style={{ textAlign: 'center' }}>
            <p style={{ marginBottom: '24px', color: '#fff' }}>Who is taking the quiz right now?</p>
            <form onSubmit={handleSelectParticipant}>
              <div className="form-group" style={{ textAlign: 'left' }}>
                <label className="form-label" htmlFor="participantName">Your Name</label>
                <input
                  type="text"
                  id="participantName"
                  className="form-input"
                  required
                  value={participantName}
                  onChange={(e) => setParticipantName(e.target.value)}
                  placeholder="e.g. Yash"
                />
              </div>
              <button 
                type="submit"
                className="btn-primary" 
                style={{ width: '100%', marginTop: '12px' }}
              >
                Join Game
              </button>
            </form>
            <button 
              onClick={() => {
                localStorage.clear()
                setStep(1)
              }} 
              style={{ marginTop: '24px', background: 'none', border: 'none', color: '#ff6b6b', cursor: 'pointer' }}
            >
              Cancel Login
            </button>
          </div>
        )}
      </div>
    </div>
  )
}
