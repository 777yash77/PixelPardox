'use client'

import { useState, useEffect } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminTeams() {
  const router = useRouter()
  const [teams, setTeams] = useState([])
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState('')
  const [deleteId, setDeleteId] = useState(null)
  const [editTeam, setEditTeam] = useState(null)
  const [updateLoading, setUpdateLoading] = useState(false)
  
  useEffect(() => {
    fetchTeams()
  }, [])

  const fetchTeams = async () => {
    try {
      const token = localStorage.getItem('token')
      if (!token) {
        router.push('/login')
        return
      }

      const res = await fetch('http://localhost:8080/api/admin/teams', {
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (res.status === 401 || res.status === 403) {
        setError('Unauthorized access. Only admins can view this page.')
        setLoading(false)
        return
      }

      if (!res.ok) throw new Error('Failed to fetch teams')
      
      const data = await res.json()
      setTeams(data)
    } catch (err) {
      setError(err.message || 'Server connection error.')
    } finally {
      setLoading(false)
    }
  }

  const handleDelete = async () => {
    if (!deleteId) return
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/api/admin/teams/${deleteId}`, {
        method: 'DELETE',
        headers: {
          'Authorization': `Bearer ${token}`
        }
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to delete team')
      }
      
      setTeams(teams.filter(t => t.id !== deleteId))
      setDeleteId(null)
    } catch (err) {
      alert(err.message)
    }
  }

  const handleUpdate = async (e) => {
    e.preventDefault()
    setUpdateLoading(true)
    try {
      const token = localStorage.getItem('token')
      const res = await fetch(`http://localhost:8080/api/admin/teams/${editTeam.id}`, {
        method: 'PUT',
        headers: {
          'Authorization': `Bearer ${token}`,
          'Content-Type': 'application/json'
        },
        body: JSON.stringify({
          teamName: editTeam.teamName,
          teamId: editTeam.teamId,
          teamSize: editTeam.teamSize ? parseInt(editTeam.teamSize, 10) : 2,
          isVerified: editTeam.isVerified
        })
      })
      
      if (!res.ok) {
        const data = await res.json().catch(() => ({}))
        throw new Error(data.message || 'Failed to update team')
      }
      
      const updatedTeam = await res.json()
      setTeams(teams.map(t => t.id === updatedTeam.id ? updatedTeam : t))
      setEditTeam(null)
    } catch (err) {
      alert(err.message)
    } finally {
      setUpdateLoading(false)
    }
  }

  return (
    <div style={{
      minHeight: '100vh', padding: '40px 16px', background: '#0A0607', color: '#E8E8E8',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '2rem', fontWeight: 'bold' }}>
              <span style={{ color: 'var(--color-primary-blue, #E01B22)' }}>Registered Teams</span> Management
            </h1>
            <p style={{ margin: 0, color: 'var(--text-secondary, #A0A0A0)' }}>Inspect, edit, and manage teams participating in Pixel Paradox</p>
          </div>
          <Link href="/admin" className="btn-secondary" style={{
            padding: '8px 16px', borderRadius: '8px', 
            textDecoration: 'none', color: '#fff', fontSize: '0.9rem'
          }}>
            ← Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div style={{ background: 'rgba(224,27,34,0.1)', border: '1px solid #E01B22', borderRadius: '8px', padding: '16px', color: '#FF4D4D' }}>
            {error}
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-secondary)' }}>Loading registered teams...</div>
        ) : (
          <div className="glass-panel" style={{ borderRadius: '12px', overflow: 'hidden' }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.3)', borderBottom: '1px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Team Name</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600' }}>Team ID</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Size</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'center' }}>Score</th>
                  <th style={{ padding: '16px', color: 'var(--text-secondary)', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: 'var(--text-dim)' }}>
                      No teams registered yet.
                    </td>
                  </tr>
                ) : (
                  teams.map((team, idx) => {
                    return (
                      <tr key={team.id} style={{ borderBottom: idx === teams.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.04)' }}>
                        <td style={{ padding: '16px' }}>
                          <strong style={{ color: '#fff' }}>{team.teamName}</strong>
                        </td>
                        <td style={{ padding: '16px', color: '#FF4D4D', fontFamily: 'monospace' }}>{team.teamId}</td>
                        <td style={{ padding: '16px', textAlign: 'center', color: 'var(--text-secondary)' }}>{team.teamSize || 2} members</td>
                        <td style={{ padding: '16px', textAlign: 'center', fontWeight: 'bold', color: 'var(--color-primary-blue, #E01B22)' }}>{team.score || 0}</td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setEditTeam({...team})}
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px', fontSize: '0.8rem', marginRight: '8px'
                            }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteId(team.id)}
                            className="btn-secondary"
                            style={{
                              padding: '6px 12px', fontSize: '0.8rem', color: '#FF4D4D', borderColor: 'rgba(224,27,34,0.3)'
                            }}
                          >
                            Delete
                          </button>
                        </td>
                      </tr>
                    )
                  })
                )}
              </tbody>
            </table>
          </div>
        )}
      </div>

      {/* Delete Modal */}
      {deleteId && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', zIndex: 100
        }}>
          <div className="glass-panel" style={{
            padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center',
            borderColor: '#E01B22'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem', color: '#fff' }}>Confirm Deletion</h3>
            <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
              Are you sure you want to delete this team? All associated scores and attempts will be removed.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
              <button onClick={handleDelete} className="btn-primary" style={{ flex: 1, padding: '10px' }}>Delete Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeam && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.85)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', zIndex: 100, padding: '20px'
        }}>
          <div className="glass-panel" style={{
            padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.4rem', color: 'var(--color-primary-blue, #E01B22)' }}>
              Edit Team: {editTeam.teamName}
            </h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Team Name</label>
                <input type="text" value={editTeam.teamName} onChange={e => setEditTeam({...editTeam, teamName: e.target.value})} className="form-input" required />
              </div>
              <div style={{ marginBottom: '14px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Team ID</label>
                <input type="text" value={editTeam.teamId} onChange={e => setEditTeam({...editTeam, teamId: e.target.value})} className="form-input" required />
              </div>
              <div style={{ marginBottom: '20px' }}>
                <label className="form-label" style={{ fontSize: '0.85rem' }}>Team Size (2 - 4)</label>
                <input type="number" min={2} max={4} value={editTeam.teamSize || 2} onChange={e => setEditTeam({...editTeam, teamSize: parseInt(e.target.value)})} className="form-input" required />
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setEditTeam(null)} className="btn-secondary" style={{ flex: 1, padding: '10px' }}>Cancel</button>
                <button type="submit" disabled={updateLoading} className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                  {updateLoading ? 'Saving...' : 'Save Changes'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
