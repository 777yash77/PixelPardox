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
      
      if (!res.ok) throw new Error('Failed to delete team')
      
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
          leaderName: editTeam.leaderName,
          leaderEmail: editTeam.leaderEmail,
          memberName: editTeam.memberName,
          memberNames: editTeam.memberNames,
          isVerified: editTeam.isVerified
        })
      })
      
      if (!res.ok) throw new Error('Failed to update team')
      
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
      minHeight: '100vh', padding: '40px 16px', background: 'var(--color-bg, #0a0e1a)', color: '#fff',
      fontFamily: 'system-ui, -apple-system, sans-serif'
    }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        
        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px' }}>
          <div>
            <h1 style={{ margin: '0 0 8px', fontSize: '2rem', background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>
              Admin Panel
            </h1>
            <p style={{ margin: 0, color: '#8c9cb6' }}>Manage Registered Teams</p>
          </div>
          <Link href="/admin" style={{
            padding: '8px 16px', border: '1px solid rgba(255,255,255,0.2)', borderRadius: '8px', 
            textDecoration: 'none', color: '#fff', background: 'rgba(255,255,255,0.05)'
          }}>
            ← Back to Dashboard
          </Link>
        </div>

        {error ? (
          <div style={{ background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.4)', borderRadius: '8px', padding: '16px', color: '#ff8080' }}>
            {error}
          </div>
        ) : loading ? (
          <div style={{ textAlign: 'center', padding: '60px', color: '#8c9cb6' }}>Loading teams...</div>
        ) : (
          <div style={{
            background: 'rgba(255,255,255,0.02)', border: '1px solid rgba(255,255,255,0.1)', 
            borderRadius: '12px', overflow: 'hidden'
          }}>
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ background: 'rgba(0,0,0,0.2)', borderBottom: '1px solid rgba(255,255,255,0.1)' }}>
                  <th style={{ padding: '16px', color: '#a8b8cf', fontWeight: '600' }}>Team Name</th>
                  <th style={{ padding: '16px', color: '#a8b8cf', fontWeight: '600' }}>Leader</th>
                  <th style={{ padding: '16px', color: '#a8b8cf', fontWeight: '600' }}>Members</th>
                  <th style={{ padding: '16px', color: '#a8b8cf', fontWeight: '600' }}>Status</th>
                  <th style={{ padding: '16px', color: '#a8b8cf', fontWeight: '600', textAlign: 'right' }}>Actions</th>
                </tr>
              </thead>
              <tbody>
                {teams.length === 0 ? (
                  <tr>
                    <td colSpan="5" style={{ padding: '32px', textAlign: 'center', color: '#8c9cb6' }}>
                      No teams registered yet.
                    </td>
                  </tr>
                ) : (
                  teams.map((team, idx) => {
                    const extraMembers = team.memberNames || []
                    const allMembers = [team.leaderName, team.memberName, ...extraMembers].filter(Boolean)
                    
                    return (
                      <tr key={team.id} style={{ borderBottom: idx === teams.length - 1 ? 'none' : '1px solid rgba(255,255,255,0.05)' }}>
                        <td style={{ padding: '16px' }}>
                          <strong style={{ color: '#fff' }}>{team.teamName}</strong>
                          <div style={{ fontSize: '0.8rem', color: '#8c9cb6', marginTop: '4px' }}>{team.leaderEmail}</div>
                        </td>
                        <td style={{ padding: '16px', color: '#fff' }}>{team.leaderName}</td>
                        <td style={{ padding: '16px' }}>
                          <div style={{ fontSize: '0.85rem', color: '#a8b8cf', lineHeight: '1.4' }}>
                            {allMembers.map((m, i) => (
                              <div key={i}>{i+1}. {m}</div>
                            ))}
                          </div>
                        </td>
                        <td style={{ padding: '16px' }}>
                          {team.isVerified ? (
                            <span style={{ padding: '4px 8px', background: 'rgba(0,255,100,0.1)', color: '#00ff64', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>VERIFIED</span>
                          ) : (
                            <span style={{ padding: '4px 8px', background: 'rgba(255,200,0,0.1)', color: '#ffc800', borderRadius: '4px', fontSize: '0.75rem', fontWeight: '600' }}>PENDING OTP</span>
                          )}
                        </td>
                        <td style={{ padding: '16px', textAlign: 'right' }}>
                          <button 
                            onClick={() => setEditTeam({...team})}
                            style={{
                              background: 'rgba(50,200,255,0.1)', border: '1px solid rgba(50,200,255,0.3)', 
                              color: '#32c8ff', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
                              marginRight: '8px', transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(50,200,255,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(50,200,255,0.1)'}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => setDeleteId(team.id)}
                            style={{
                              background: 'rgba(255,50,50,0.1)', border: '1px solid rgba(255,50,50,0.3)', 
                              color: '#ff8080', borderRadius: '6px', padding: '6px 12px', cursor: 'pointer',
                              transition: 'all 0.2s'
                            }}
                            onMouseOver={e => e.currentTarget.style.background = 'rgba(255,50,50,0.2)'}
                            onMouseOut={e => e.currentTarget.style.background = 'rgba(255,50,50,0.1)'}
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
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', zIndex: 100
        }}>
          <div style={{
            background: '#111524', border: '1px solid rgba(255,50,50,0.3)', 
            padding: '32px', borderRadius: '16px', maxWidth: '400px', width: '100%', textAlign: 'center'
          }}>
            <div style={{ fontSize: '3rem', marginBottom: '16px' }}>⚠️</div>
            <h3 style={{ margin: '0 0 12px', fontSize: '1.4rem' }}>Confirm Deletion</h3>
            <p style={{ color: '#8c9cb6', marginBottom: '24px' }}>
              Are you sure you want to delete this team? This action cannot be undone.
            </p>
            <div style={{ display: 'flex', gap: '12px' }}>
              <button onClick={() => setDeleteId(null)} style={{
                flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                color: '#fff', borderRadius: '8px', cursor: 'pointer'
              }}>Cancel</button>
              <button onClick={handleDelete} style={{
                flex: 1, padding: '12px', background: '#ff3333', border: 'none',
                color: '#fff', borderRadius: '8px', cursor: 'pointer', fontWeight: '600'
              }}>Delete Team</button>
            </div>
          </div>
        </div>
      )}

      {/* Edit Modal */}
      {editTeam && (
        <div style={{
          position: 'fixed', top: 0, left: 0, right: 0, bottom: 0, 
          background: 'rgba(0,0,0,0.8)', display: 'flex', alignItems: 'center', justifyContent: 'center',
          backdropFilter: 'blur(4px)', zIndex: 100, padding: '20px'
        }}>
          <div style={{
            background: '#111524', border: '1px solid rgba(0,210,255,0.3)', 
            padding: '32px', borderRadius: '16px', maxWidth: '500px', width: '100%', maxHeight: '90vh', overflowY: 'auto'
          }}>
            <h3 style={{ margin: '0 0 20px', fontSize: '1.4rem', color: '#00d2ff' }}>Edit Team: {editTeam.teamName}</h3>
            <form onSubmit={handleUpdate}>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a8b8cf', fontSize: '0.85rem' }}>Team Name</label>
                <input type="text" value={editTeam.teamName} onChange={e => setEditTeam({...editTeam, teamName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a8b8cf', fontSize: '0.85rem' }}>Leader Name</label>
                <input type="text" value={editTeam.leaderName} onChange={e => setEditTeam({...editTeam, leaderName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a8b8cf', fontSize: '0.85rem' }}>Leader Email</label>
                <input type="email" value={editTeam.leaderEmail} onChange={e => setEditTeam({...editTeam, leaderEmail: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a8b8cf', fontSize: '0.85rem' }}>Member 2 Name</label>
                <input type="text" value={editTeam.memberName || ''} onChange={e => setEditTeam({...editTeam, memberName: e.target.value})} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' }} required />
              </div>
              <div style={{ marginBottom: '12px' }}>
                <label style={{ display: 'block', marginBottom: '4px', color: '#a8b8cf', fontSize: '0.85rem' }}>Extra Members (comma separated)</label>
                <input type="text" value={(editTeam.memberNames || []).join(', ')} onChange={e => {
                  const arr = e.target.value.split(',').map(s => s.trim())
                  setEditTeam({...editTeam, memberNames: arr})
                }} style={{ width: '100%', padding: '10px', borderRadius: '6px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#fff', boxSizing: 'border-box' }} />
              </div>
              <div style={{ marginBottom: '24px', display: 'flex', alignItems: 'center', gap: '8px' }}>
                <input type="checkbox" id="isVerified" checked={editTeam.isVerified} onChange={e => setEditTeam({...editTeam, isVerified: e.target.checked})} />
                <label htmlFor="isVerified" style={{ color: '#a8b8cf', fontSize: '0.9rem' }}>Is Verified (OTP)</label>
              </div>

              <div style={{ display: 'flex', gap: '12px' }}>
                <button type="button" onClick={() => setEditTeam(null)} style={{
                  flex: 1, padding: '12px', background: 'transparent', border: '1px solid rgba(255,255,255,0.2)',
                  color: '#fff', borderRadius: '8px', cursor: 'pointer'
                }}>Cancel</button>
                <button type="submit" disabled={updateLoading} style={{
                  flex: 1, padding: '12px', background: 'linear-gradient(135deg, #00d2ff, #7b2ff7)', border: 'none',
                  color: '#fff', borderRadius: '8px', cursor: updateLoading ? 'not-allowed' : 'pointer', fontWeight: '600'
                }}>{updateLoading ? 'Saving...' : 'Save Changes'}</button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  )
}
