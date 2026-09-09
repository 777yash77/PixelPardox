'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminRecordings() {
  const router = useRouter()
  const [recordings, setRecordings] = useState([])
  const [token, setToken] = useState('')
  const [loading, setLoading] = useState(true)

  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!storedToken || role !== 'ROLE_ADMIN') {
      router.push('/login')
      return
    }
    setToken(storedToken)
    fetchRecordings(storedToken)
  }, [])

  const fetchRecordings = async (authToken) => {
    try {
      const res = await fetch('http://localhost:8080/api/admin/recordings', {
        headers: { 'Authorization': `Bearer ${authToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setRecordings(data)
      }
    } catch (err) {
      console.error(err)
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async (id) => {
    if (!confirm('Delete this recording permanently?')) return
    try {
      const res = await fetch(`http://localhost:8080/api/admin/recordings/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        setRecordings(recordings.filter(r => r.id !== id))
      }
    } catch (err) {
      console.error(err)
    }
  }

  return (
    <div style={{ minHeight: '100vh', padding: '40px', background: '#060812', color: '#E8E8E8' }}>
      <div style={{ maxWidth: '1750px', width: '100%', margin: '0 auto' }}>
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ fontSize: '2rem', marginBottom: '8px', fontWeight: 'bold' }}>
              <span style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #E01B22 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>Webcam Recordings</span> (Prelims Anti-Cheat)
            </h1>
            <p style={{ color: 'var(--text-secondary, #A0A0A0)', margin: 0 }}>
              Review silent 1-minute webcam recordings captured during Stage 0 Prelims to ensure fair competition.
            </p>
          </div>
          <Link href="/admin" className="btn-secondary" style={{ padding: '8px 16px', borderRadius: '8px', textDecoration: 'none', color: '#fff', fontSize: '0.9rem' }}>
            ← Back to Dashboard
          </Link>
        </div>

        {loading ? (
          <p style={{ color: 'var(--text-secondary)' }}>Loading recordings...</p>
        ) : recordings.length === 0 ? (
          <div className="glass-panel" style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
            <p style={{ fontSize: '1.1rem', marginBottom: '8px' }}>No webcam recordings received yet.</p>
            <p style={{ fontSize: '0.85rem' }}>Recordings will appear here automatically as participants begin their Stage 0 Prelims.</p>
          </div>
        ) : (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(340px, 1fr))', gap: '24px' }}>
            {recordings.map(rec => (
              <div key={rec.id} className="glass-panel" style={{ padding: '16px', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                <div style={{ marginBottom: '12px', display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start' }}>
                  <div>
                    <h3 style={{ fontSize: '1.1rem', margin: '0 0 4px 0', fontWeight: 'bold', color: '#fff' }}>
                      {rec.participantName}
                    </h3>
                    <span style={{ fontSize: '0.8rem', color: '#38BDF8', fontWeight: '600' }}>Team ID: {rec.teamId}</span>
                  </div>
                  <span className="badge badge-active" style={{ fontSize: '0.7rem', background: 'rgba(56,189,248,0.15)', borderColor: '#38BDF8', color: '#38BDF8' }}>
                    Stage 0
                  </span>
                </div>
                
                <video 
                  src={`http://localhost:8080${rec.videoUrl}`} 
                  controls 
                  style={{ width: '100%', height: '200px', objectFit: 'cover', borderRadius: '8px', background: '#000', marginBottom: '16px', border: '1px solid rgba(56,189,248,0.2)' }}
                />
                
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                    {new Date(rec.recordedAt).toLocaleString()}
                  </span>
                  <button 
                    onClick={() => handleDelete(rec.id)}
                    className="btn-secondary"
                    style={{ borderColor: '#E01B22', color: '#FF4D4D', padding: '6px 14px', fontSize: '0.8rem' }}
                  >
                    Delete
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  )
}
