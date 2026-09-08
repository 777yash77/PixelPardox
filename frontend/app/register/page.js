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
      padding: '40px 16px', background: 'var(--color-bg, #0a0e1a)'
    }}>

      <div className="glass-panel" style={{
        width: '100%', maxWidth: '520px',
        padding: '40px'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h1 className="glitch-text" data-text="REGISTER TEAM" style={{
            fontSize: '2.5rem', fontWeight: '800', margin: '0 0 8px 0', letterSpacing: '2px', textTransform: 'uppercase'
          }}>REGISTER TEAM</h1>
          <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '6px', textTransform: 'uppercase', letterSpacing: '1px' }}>
            LOGIN 2026: The Last Human
          </p>

            {error && (
              <div style={{
                background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)',
                borderRadius: '8px', padding: '12px 16px', color: '#ff8080',
                fontSize: '0.85rem', marginBottom: '20px'
              }}>{error}</div>
            )}

            <form onSubmit={handleRegister}>

              {/* Team Name */}
              <Field label="Team Name" id="teamName" name="teamName" placeholder="e.g., Cyber Knights"
                value={formData.teamName} onChange={handleChange} required />

              {/* Team ID */}
              <Field label="Team ID (Unique Login ID)" id="teamId" name="teamId"
                placeholder="e.g. T-1234" value={formData.teamId} onChange={handleChange} required />

              {/* Password */}
              <Field label="Team Password" id="password" name="password" type="password"
                placeholder="Enter password" value={formData.password} onChange={handleChange} required />

              {/* Team Size */}
              <div style={{ marginBottom: '16px' }}>
                <label htmlFor="teamSize" style={{
                  display: 'flex', alignItems: 'center', gap: '8px',
                  color: '#a8b8cf', fontSize: '0.85rem', fontWeight: '500', marginBottom: '6px'
                }}>
                  Team Size
                </label>
                <select
                  id="teamSize"
                  name="teamSize"
                  value={formData.teamSize}
                  onChange={handleChange}
                  className="form-input"
                  style={{
                    width: '100%', padding: '12px 14px', borderRadius: '6px',
                    color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
                  }}
                >
                  <option value="2" style={{color: '#000'}}>2 Members</option>
                  <option value="3" style={{color: '#000'}}>3 Members</option>
                  <option value="4" style={{color: '#000'}}>4 Members</option>
                </select>
              </div>

              <button type="submit" disabled={loading} className="btn-primary" style={{
                width: '100%', marginTop: '20px', padding: '14px',
                fontSize: '1rem', fontWeight: '700', letterSpacing: '0.5px'
              }}>
                {loading ? 'Registering...' : 'REGISTER TEAM →'}
              </button>
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
              Already registered?{' '}
              <Link href="/login" style={{ color: 'var(--color-neon-blue)', textDecoration: 'none', fontWeight: '700' }}>
                Log in here
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
