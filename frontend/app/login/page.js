'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Login() {
  const router = useRouter()
  const [formData, setFormData] = useState({
    email: '',
    password: '',
  })
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')

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
        localStorage.setItem('email', data.email)

        if (data.role === 'ROLE_ADMIN') {
          router.push('/admin')
        } else {
          router.push('/game')
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

  return (
    <div className="container flex-center page-transition" style={{ minHeight: '100vh' }}>
      <div className="glass-panel" style={{ width: '100%', maxWidth: '440px', padding: '40px' }}>
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <h2 style={{ fontSize: '2rem' }} className="cyan-gradient-text">Portal Login</h2>
          <p style={{ color: '#8c9cb6', fontSize: '0.9rem', marginTop: '4px' }}>Pixel Paradox: AI or Reality?</p>
        </div>

        {error && (
          <div style={{ background: 'rgba(255,20,147,0.1)', border: '1px solid #ff1493', borderRadius: '8px', padding: '12px', color: '#ff5c93', fontSize: '0.85rem', marginBottom: '20px' }}>
            {error}
          </div>
        )}

        <form onSubmit={handleLogin}>
          <div className="form-group">
            <label className="form-label" htmlFor="email">Email Address</label>
            <input
              type="email"
              id="email"
              name="email"
              className="form-input"
              required
              value={formData.email}
              onChange={handleChange}
              placeholder="e.g., team@gmail.com"
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
          <p style={{ color: '#8c9cb6' }}>
            New team? <Link href="/register" style={{ color: '#00d2ff', textDecoration: 'none' }}>Register here</Link>
          </p>
          <p>
            <Link href="/" style={{ color: '#5c6c84', textDecoration: 'none', fontSize: '0.8rem' }}>&larr; Back to Home</Link>
          </p>
        </div>
      </div>
    </div>
  )
}
