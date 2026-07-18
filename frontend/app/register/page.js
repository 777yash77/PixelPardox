'use client'

import { useState } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function Register() {
  const router = useRouter()
  const [step, setStep] = useState(1) // 1=form, 2=otp
  const [loading, setLoading] = useState(false)
  const [error, setError] = useState('')
  const [otp, setOtp] = useState('')

  const [otpError, setOtpError] = useState('')
  const [otpLoading, setOtpLoading] = useState(false)

  const [formData, setFormData] = useState({
    teamName: '',
    leaderEmail: '',
    leaderName: '',
    memberName: '',
    password: '',
    memberNames: [''] // start with 1 extra member slot (total = 3)
  })

  const handleChange = (e) => {
    setFormData({ ...formData, [e.target.name]: e.target.value })
  }

  const handleMemberChange = (index, value) => {
    const updated = [...formData.memberNames]
    updated[index] = value
    setFormData({ ...formData, memberNames: updated })
  }

  const addMember = () => {
    if (formData.memberNames.length < 3) {
      setFormData({ ...formData, memberNames: [...formData.memberNames, ''] })
    }
  }

  const removeMember = (index) => {
    const updated = formData.memberNames.filter((_, i) => i !== index)
    setFormData({ ...formData, memberNames: updated })
  }

  const getFilteredMemberNames = () => formData.memberNames.filter(n => n.trim() !== '')
  const totalMembers = () => 1 + 1 + getFilteredMemberNames().length

  const handleRegister = async (e) => {
    e.preventDefault()
    setError('')
    const total = totalMembers()
    if (total < 3 || total > 5) {
      setError(`Team must have 3-5 members. Currently: ${total}`)
      return
    }
    if (!formData.leaderName.trim()) {
      setError('Leader name is required.')
      return
    }
    setLoading(true)
    try {
      const res = await fetch('http://localhost:8080/api/auth/register', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ ...formData, memberNames: getFilteredMemberNames() }),
      })
      const data = await res.json()
      if (res.ok) {
        setStep(2)
      } else {
        setError(data.message || 'Registration failed')
      }
    } catch {
      setError('Cannot connect to server. Make sure backend is running.')
    } finally {
      setLoading(false)
    }
  }

  const handleVerifyOtp = async (e) => {
    e.preventDefault()
    setOtpLoading(true)
    setOtpError('')
    try {
      const res = await fetch('http://localhost:8080/api/auth/verify-otp', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ email: formData.leaderEmail, otp }),
      })
      const data = await res.json()
      if (res.ok) {
        router.push('/login?verified=1')
      } else {
        setOtpError(data.message || 'OTP verification failed')
      }
    } catch {
      setOtpError('Server connection error.')
    } finally {
      setOtpLoading(false)
    }
  }

  const memberLabels = ['Member 2', 'Member 3', 'Member 4', 'Member 5']

  return (
    <div style={{
      minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center',
      padding: '40px 16px', background: 'var(--color-bg, #0a0e1a)'
    }}>
      <style>{`
        .premium-input {
          transition: border-color 0.3s ease, box-shadow 0.3s ease, transform 0.2s ease;
        }
        .premium-input:focus {
          border-color: rgba(0,210,255,0.5) !important;
          box-shadow: 0 0 10px rgba(0,210,255,0.2);
          transform: translateY(-1px);
        }
        .premium-btn {
          transition: transform 0.2s ease, box-shadow 0.3s ease, filter 0.3s ease;
        }
        .premium-btn:not(:disabled):hover {
          transform: translateY(-2px);
          box-shadow: 0 8px 20px rgba(123, 47, 247, 0.4);
          filter: brightness(1.1);
        }
        .premium-btn:not(:disabled):active {
          transform: translateY(1px);
        }
      `}</style>
      <div style={{
        width: '100%', maxWidth: '520px',
        background: 'rgba(255,255,255,0.04)',
        border: '1px solid rgba(0,210,255,0.2)',
        borderRadius: '16px', padding: '40px',
        boxShadow: '0 0 60px rgba(0,210,255,0.08)',
        backdropFilter: 'blur(10px)'
      }}>

        {/* Header */}
        <div style={{ textAlign: 'center', marginBottom: '32px' }}>
          <div style={{ fontSize: '2.4rem', marginBottom: '8px' }}>🎮</div>
          <h1 style={{
            fontSize: '1.8rem', fontWeight: '700', margin: '0',
            background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)',
            WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent'
          }}>Register Your Team</h1>
          <p style={{ color: '#8c9cb6', fontSize: '0.9rem', marginTop: '6px' }}>
            Pixel Paradox — LOGIN'26 • Team size: 3–5 members
          </p>
          <div style={{ display: 'flex', justifyContent: 'center', gap: '8px', marginTop: '16px' }}>
            {[1,2].map(s => (
              <div key={s} style={{
                width: '28px', height: '4px', borderRadius: '2px',
                background: step >= s ? 'linear-gradient(90deg,#00d2ff,#7b2ff7)' : 'rgba(255,255,255,0.1)',
                transition: 'background 0.3s'
              }} />
            ))}
          </div>
        </div>

        {step === 1 && (
          <>
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

              {/* Leader Email */}
              <Field label="Leader Email (Gmail)" id="leaderEmail" name="leaderEmail" type="email"
                placeholder="leader@gmail.com" value={formData.leaderEmail} onChange={handleChange} required />

              {/* ─── Leader (Member 1) ─── */}
              <div style={{ margin: '24px 0 8px' }}>
                <div style={{
                  display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '12px'
                }}>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,210,255,0.15)' }} />
                  <span style={{ color: '#00d2ff', fontSize: '0.75rem', fontWeight: '600', letterSpacing: '1px' }}>
                    TEAM MEMBERS
                  </span>
                  <div style={{ flex: 1, height: '1px', background: 'rgba(0,210,255,0.15)' }} />
                </div>
              </div>

              <Field label="Member 1 — Leader Name" id="leaderName" name="leaderName"
                placeholder="e.g., Alice" value={formData.leaderName} onChange={handleChange} required
                badge="LEADER" />

              {/* Member 2 (required) */}
              <Field label="Member 2 Name" id="memberName" name="memberName"
                placeholder="e.g., Bob" value={formData.memberName} onChange={handleChange} required />

              {/* Extra members (Member 3, 4, 5) */}
              {formData.memberNames.map((name, idx) => (
                <div key={idx} style={{ position: 'relative' }}>
                  <Field
                    label={`${memberLabels[idx + 1]} Name`}
                    id={`extra_${idx}`}
                    name={`extra_${idx}`}
                    placeholder={`e.g., Member ${idx + 3}`}
                    value={name}
                    onChange={e => handleMemberChange(idx, e.target.value)}
                  />
                  <button type="button" onClick={() => removeMember(idx)} style={{
                    position: 'absolute', top: '32px', right: '10px',
                    background: 'none', border: 'none', color: '#ff6b6b',
                    cursor: 'pointer', fontSize: '1.1rem', lineHeight: 1, padding: '4px'
                  }} title="Remove member">✕</button>
                </div>
              ))}

              {/* Team size indicator */}
              <div style={{
                display: 'flex', justifyContent: 'space-between', alignItems: 'center',
                margin: '12px 0', padding: '10px 14px',
                background: 'rgba(0,210,255,0.05)', borderRadius: '8px',
                border: '1px solid rgba(0,210,255,0.15)'
              }}>
                <span style={{ color: '#8c9cb6', fontSize: '0.85rem' }}>
                  Team size: <strong style={{ color: '#fff' }}>{totalMembers()}</strong> / 5 members
                </span>
                {formData.memberNames.length < 3 && (
                  <button type="button" onClick={addMember} style={{
                    background: 'linear-gradient(135deg,#00d2ff,#7b2ff7)',
                    border: 'none', borderRadius: '6px', color: '#fff',
                    padding: '6px 14px', fontSize: '0.8rem', cursor: 'pointer', fontWeight: '600'
                  }}>+ Add Member</button>
                )}
              </div>

              {/* Password */}
              <Field label="Team Password" id="password" name="password" type="password"
                placeholder="Enter password" value={formData.password} onChange={handleChange} required />

              <button type="submit" disabled={loading} className="premium-btn" style={{
                width: '100%', marginTop: '20px', padding: '14px',
                background: loading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#00d2ff,#7b2ff7)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '1rem', fontWeight: '700', cursor: loading ? 'not-allowed' : 'pointer',
                letterSpacing: '0.5px'
              }}>
                {loading ? 'Registering...' : 'Register Team →'}
              </button>
            </form>

            <p style={{ marginTop: '24px', textAlign: 'center', fontSize: '0.85rem', color: '#8c9cb6' }}>
              Already registered?{' '}
              <Link href="/login" style={{ color: '#00d2ff', textDecoration: 'none', fontWeight: '600' }}>
                Log in here
              </Link>
            </p>
          </>
        )}

        {step === 2 && (
          <div style={{ animation: 'fadeIn 0.3s ease' }}>
            <div style={{ textAlign: 'center', marginBottom: '24px' }}>
              <div style={{ fontSize: '3rem', marginBottom: '8px' }}>📧</div>
              <h2 style={{ color: '#fff', margin: '0 0 8px' }}>Check Your Email</h2>
              <p style={{ color: '#8c9cb6', fontSize: '0.9rem' }}>
                A 6-digit code was sent to <strong style={{ color: '#00d2ff' }}>{formData.leaderEmail}</strong>
              </p>
            </div>


            {otpError && (
              <div style={{
                background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)',
                borderRadius: '8px', padding: '12px', color: '#ff8080',
                fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center'
              }}>{otpError}</div>
            )}

            <form onSubmit={handleVerifyOtp}>
              <label style={{ display: 'block', color: '#8c9cb6', fontSize: '0.85rem', marginBottom: '8px', fontWeight: '500' }}>
                Enter 6-Digit OTP
              </label>
              <input
                type="text"
                maxLength={6}
                required
                value={otp}
                onChange={e => setOtp(e.target.value.replace(/\D/g, ''))}
                placeholder="000000"
                style={{
                  width: '100%', padding: '16px', borderRadius: '10px',
                  background: 'rgba(255,255,255,0.06)', border: '1px solid rgba(0,210,255,0.3)',
                  color: '#fff', fontSize: '2rem', letterSpacing: '10px',
                  textAlign: 'center', fontWeight: '700', outline: 'none', boxSizing: 'border-box'
                }}
              />
              <button type="submit" disabled={otpLoading} className="premium-btn" style={{
                width: '100%', marginTop: '16px', padding: '14px',
                background: otpLoading ? 'rgba(255,255,255,0.1)' : 'linear-gradient(135deg,#00d2ff,#7b2ff7)',
                border: 'none', borderRadius: '10px', color: '#fff',
                fontSize: '1rem', fontWeight: '700', cursor: otpLoading ? 'not-allowed' : 'pointer'
              }}>
                {otpLoading ? 'Verifying...' : '✓ Verify & Complete Registration'}
              </button>
            </form>

            <button onClick={() => setStep(1)} style={{
              width: '100%', marginTop: '12px', padding: '10px',
              background: 'transparent', border: '1px solid rgba(255,255,255,0.15)',
              borderRadius: '10px', color: '#8c9cb6', cursor: 'pointer', fontSize: '0.9rem'
            }}>← Back to Form</button>
          </div>
        )}
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
        className="premium-input"
        style={{
          width: '100%', padding: '12px 14px', borderRadius: '8px',
          background: 'rgba(255,255,255,0.06)',
          border: '1px solid rgba(255,255,255,0.12)',
          color: '#fff', fontSize: '0.95rem', outline: 'none', boxSizing: 'border-box'
        }}
        onFocus={e => e.target.style.borderColor = 'rgba(0,210,255,0.5)'}
        onBlur={e => e.target.style.borderColor = 'rgba(255,255,255,0.12)'}
      />
    </div>
  )
}
