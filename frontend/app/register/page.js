'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
    const [loading, setLoading] = useState(false)
    const [error, setError] = useState('')

  const [formData, setFormData] = useState({
    teamName: '',
    teamId: '',
    password: '',
    teamSize: '2'
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
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
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }



  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', background: 'var(--color-bg, #0a0e1a)', position: 'relative'
    }}>

      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px',
        padding: '38px',
        border: '1.5px solid rgba(224, 27, 34, 0.45)',
        background: 'linear-gradient(145deg, rgba(24, 10, 14, 0.96) 0%, rgba(10, 5, 8, 0.98) 100%)',
        boxShadow: '0 20px 60px rgba(0, 0, 0, 0.9), 0 0 30px rgba(224, 27, 34, 0.25)',
        borderRadius: '16px',
        position: 'relative',
        overflow: 'hidden'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '28px' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', background: 'rgba(224, 27, 34, 0.12)', border: '1px solid rgba(224, 27, 34, 0.4)', padding: '4px 14px', borderRadius: '20px', marginBottom: '14px' }}>
            <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#38BDF8' }} />
            <span style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
              LOGIN 2026 • SQUAD PROTOCOL
            </span>
          </div>

          <h1 className="glitch-text" data-text="REGISTER SQUAD" style={{
            fontSize: '2.3rem', fontWeight: '800', margin: '0 0 6px 0', letterSpacing: '2px', textTransform: 'uppercase'
          }}>REGISTER SQUAD</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '4px', letterSpacing: '0.5px' }}>
            Create team credentials to compete in Stage 0 &amp; live tournament rounds
          </p>
        </div>

        {error && (
          <div style={{
            background: 'rgba(239, 68, 68, 0.12)', border: '1.5px solid #EF4444',
            borderRadius: '8px', padding: '12px 16px', color: '#FCA5A5',
            fontSize: '0.86rem', marginBottom: '20px', display: 'flex', alignItems: 'center', gap: '8px'
          }}>
            <span>⚠️</span>
            <span>{error}</span>
          </div>
        )}

        <form onSubmit={handleRegister}>

          {/* Team Name */}
          <Field label="TEAM NAME" id="teamName" name="teamName" placeholder="e.g., Cyber Knights, Neural Hackers"
            value={formData.teamName} onChange={handleChange} required />

          {/* Team ID */}
          <Field label="TEAM ID (UNIQUE LOGIN ID)" id="teamId" name="teamId"
            placeholder="e.g., T-101 or team_knights" value={formData.teamId} onChange={handleChange} required />

          {/* Password */}
          <Field label="TEAM ACCESS PASSWORD" id="password" name="password" type="password"
            placeholder="Choose secure team password" value={formData.password} onChange={handleChange} required />

          {/* Team Size */}
          <div style={{ marginBottom: '20px' }}>
            <label htmlFor="teamSize" style={{
              display: 'flex', alignItems: 'center', gap: '8px',
              color: 'var(--text-primary)', fontSize: '0.82rem', fontWeight: '700', marginBottom: '6px', letterSpacing: '0.5px'
            }}>
              SQUAD SIZE
            </label>
            <select
              id="teamSize"
              name="teamSize"
              value={formData.teamSize}
              onChange={handleChange}
              className="form-input"
              style={{
                width: '100%', padding: '12px 14px', borderRadius: '8px',
                color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box',
                background: 'rgba(255, 255, 255, 0.05)', border: '1px solid rgba(255, 255, 255, 0.15)'
              }}
            >
              <option value="2" style={{color: '#000'}}>2 Members</option>
              <option value="3" style={{color: '#000'}}>3 Members</option>
              <option value="4" style={{color: '#000'}}>4 Members</option>
            </select>
          </div>

          <button type="submit" disabled={loading} className="btn-primary" style={{
            width: '100%', marginTop: '16px', padding: '14px',
            fontSize: '1rem', fontWeight: '800', letterSpacing: '1px', borderRadius: '8px',
            boxShadow: '0 0 20px rgba(224, 27, 34, 0.5)'
          }}>
            {loading ? 'Transmitting Squad Intel...' : '⚡ LOCK IN & REGISTER SQUAD →'}
          </button>
        </form>

        <div style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.88rem', display: 'flex', flexDirection: 'column', gap: '8px' }}>
          <p style={{ color: 'var(--text-secondary)', margin: 0 }}>
            Already registered?{' '}
            <Link href="/login" style={{ color: '#38BDF8', textDecoration: 'none', fontWeight: '700' }}>
              Sign in here →
            </Link>
          </p>
          <p style={{ margin: 0 }}>
            <Link href="/" style={{ color: 'var(--text-dim)', textDecoration: 'none', fontSize: '0.8rem', textTransform: 'uppercase', letterSpacing: '0.5px' }}>
              &larr; Return to Home Command
            </Link>
          </p>
        </div>
      </div>
    </div>
  )
}

function Field({ label, id, name, type = 'text', placeholder, value, onChange, required, badge }) {
  return (
    <div style={{ marginBottom: '16px' }}>
      <label htmlFor={id} style={{
        display: 'flex', alignItems: 'center', gap: '8px',
        color: '#a8b8cf', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px'
      }}>
        {label}
        {badge && (
          <span style={{
            background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)',
            borderRadius: '4px', padding: '1px 6px', fontSize: '0.65rem',
            color: '#fff', fontWeight: '700', letterSpacing: '0.5px'
          }}>{badge}</span>
        )}
        {required && <span style={{ color: '#ff6b6b' }}>*</span>}
      </label>
      <input
        type={type}
        id={id}
        name={name}
        placeholder={placeholder}
        value={value}
        onChange={onChange}
        required={required}
        className="form-input"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '6px',
          color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
        }}
      />
    </div>
  )
}
