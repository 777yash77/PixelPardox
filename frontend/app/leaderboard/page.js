'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'

const STAGE_NAMES = {
  0: 'Stage 0: Lobby',
  1: 'Stage 0: Prelims (Quiz)',
  2: 'Stage 1: Pixel Detective',
  3: 'Stage 2: The Glitch Hunt',
  4: 'Stage 3: Prompt Wars',
  5: 'Podium / Finished'
}

export default function LeaderboardPage() {
  const router = useRouter()
  const [isAdmin, setIsAdmin] = useState(false)
  const [authChecked, setAuthChecked] = useState(false)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const wsRef = useRef(null)

  // Verify role
  useEffect(() => {
    const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
    if (role === 'ROLE_ADMIN') {
      setIsAdmin(true)
    }
    setAuthChecked(true)
  }, [])

  const fetchLeaderboard = async () => {
    try {
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch('http://localhost:8080/api/game/leaderboard', {
        headers: token ? { 'Authorization': `Bearer ${token}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data)
        setLastUpdated(new Date().toLocaleTimeString())
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e)
    } finally {
      setLoading(false)
    }
  }

  useEffect(() => {
    if (!isAdmin) return

    fetchLeaderboard()
    const pollInterval = setInterval(fetchLeaderboard, 5000)

    try {
      const ws = new WebSocket('ws://localhost:8080/ws')
      wsRef.current = ws

      ws.onopen = () => {
        try {
          ws.send(JSON.stringify({ type: 'REGISTER_ADMIN' }))
        } catch (e) {
          console.error('Failed to send REGISTER_ADMIN on ws', e)
        }
      }

      ws.onmessage = (event) => {
        try {
          const msg = JSON.parse(event.data)
          if (msg.type === 'SCORES_UPDATED' || msg.type === 'SUBMISSION') {
            if (Array.isArray(msg.payload)) {
              setLeaderboard(msg.payload)
              setLastUpdated(new Date().toLocaleTimeString())
            } else {
              fetchLeaderboard()
            }
          }
        } catch (err) {
          console.error('WebSocket parse error', err)
        }
      }
    } catch (err) {
      console.error('WebSocket connection error', err)
    }

    return () => {
      clearInterval(pollInterval)
      if (wsRef.current) wsRef.current.close()
    }
  }, [isAdmin])

  // If not admin, show clearance guard screen
  if (authChecked && !isAdmin) {
    return (
      <div style={{
        minHeight: '100vh',
        position: 'relative',
        overflowX: 'hidden',
        display: 'flex',
        alignItems: 'center',
        justifyContent: 'center',
        padding: '30px 20px',
        width: '100%',
        background: '#07060A'
      }}>
        {/* Dual Web Accents */}
        <svg className="web-accent" style={{ top: 0, left: 0, width: '220px', height: '220px' }} viewBox="0 0 100 100">
          <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.6" />
          <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.4" />
          <line x1="0" y1="0" x2="30" y2="100" stroke="#38BDF8" strokeWidth="0.5" opacity="0.45" />
        </svg>

        <svg className="web-accent" style={{ top: 0, right: 0, width: '220px', height: '220px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
          <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.6" />
          <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
          <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.45" />
        </svg>

        <div className="auth-ambient-glow cyan" style={{ top: '25%', left: '30%', transform: 'translate(-50%, -25%)' }} />
        <div className="auth-ambient-glow red" style={{ bottom: '20%', right: '25%', transform: 'translate(20%, 20%)' }} />

        <div className="glass-panel" style={{
          maxWidth: '680px',
          width: '100%',
          padding: '48px 36px',
          textAlign: 'center',
          border: '1.5px solid rgba(224, 27, 34, 0.45)',
          borderTop: '2px solid #FF4D4D',
          borderRadius: '16px',
          position: 'relative',
          background: 'linear-gradient(160deg, rgba(22, 10, 16, 0.95) 0%, rgba(8, 6, 12, 0.98) 100%)',
          boxShadow: '0 24px 70px rgba(0,0,0,0.9), 0 0 45px rgba(224,27,34,0.25)'
        }}>
          <div className="cyber-corner-tl" />
          <div className="cyber-corner-tr" />
          <div className="cyber-corner-bl" />
          <div className="cyber-corner-br" />

          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            gap: '8px',
            background: 'rgba(224, 27, 34, 0.15)',
            border: '1px solid rgba(224, 27, 34, 0.4)',
            padding: '6px 18px',
            borderRadius: '24px',
            marginBottom: '20px'
          }}>
            <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#EF4444' }} />
            <span style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: 800, letterSpacing: '1.4px', textTransform: 'uppercase' }}>
              RESTRICTED CLASSIFIED TELEMETRY
            </span>
          </div>

          <div style={{ fontSize: '3.5rem', marginBottom: '16px' }}>🔒</div>

          <h2 style={{
            fontSize: 'clamp(1.8rem, 3vw, 2.3rem)',
            fontWeight: 900,
            marginBottom: '14px',
            letterSpacing: '0.5px',
            background: 'linear-gradient(135deg, #FFF 0%, #FFB4B4 50%, #E01B22 100%)',
            WebkitBackgroundClip: 'text',
            WebkitTextFillColor: 'transparent'
          }}>
            ADMIN CLEARANCE REQUIRED
          </h2>

          <p style={{ color: 'var(--text-secondary)', fontSize: '0.96rem', lineHeight: '1.7', marginBottom: '28px' }}>
            In accordance with tournament security protocols, real-time leaderboard standings are confidential and restricted exclusively to the <strong>Admin Command Center</strong>. This prevents strategic sniping and ensures fair competitive play across all stages.
          </p>

          <div style={{
            background: 'rgba(56, 189, 248, 0.08)',
            border: '1px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '10px',
            padding: '16px',
            marginBottom: '32px',
            display: 'flex',
            alignItems: 'center',
            gap: '12px',
            textAlign: 'left'
          }}>
            <span style={{ fontSize: '1.4rem' }}>ℹ️</span>
            <div style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', lineHeight: 1.5 }}>
              Administrators may view live scores, evaluate submissions, and execute round cutoffs by signing into the Admin Command Console.
            </div>
          </div>

          <div style={{ display: 'flex', justifyContent: 'center', gap: '14px', flexWrap: 'wrap' }}>
            <Link
              href="/login"
              className="btn-primary-blue"
              style={{
                padding: '12px 28px',
                fontSize: '0.9rem',
                textDecoration: 'none',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '8px'
              }}
            >
              <span>🔑</span> <span>Sign In as Admin</span>
            </Link>

            <Link
              href="/"
              className="btn-secondary"
              style={{
                padding: '12px 24px',
                fontSize: '0.9rem',
                textDecoration: 'none',
                color: '#FFF',
                border: '1px solid rgba(255,255,255,0.2)'
              }}
            >
              &larr; Return to Home Command
            </Link>
          </div>
        </div>
      </div>
    )
  }

  const top3 = leaderboard.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', padding: '32px 20px', background: '#060812', color: '#E8E8E8' }}>
      <div style={{ maxWidth: '1750px', margin: '0 auto', width: '100%' }}>
        {/* Navigation & Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 'bold', letterSpacing: '1.2px' }}>
                ADMIN COMMAND VIEW • MULTIVERSE
              </span>
            </div>
            <h1 className="glitch-text" data-text="LIVE LEADERBOARD" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              LIVE LEADERBOARD
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Real-time standings across all stages • Visible to authorized administrators &amp; live projectors
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/admin" className="btn-primary-blue" style={{ padding: '8px 18px', fontSize: '0.85rem', textDecoration: 'none' }}>
              ⚙️ Admin Control Panel
            </Link>
            <Link href="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', color: '#FFF' }}>
              ← Home
            </Link>
          </div>
        </header>

        {/* Live Status & Interactive Search Filter Bar */}
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="live-pulse-dot" style={{ width: '9px', height: '9px', background: '#38BDF8' }} />
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#7DD3FC' }}>TELEMETRY UPLINK ACTIVE • REAL-TIME SQUAD SCORES</span>
          </div>

          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', flexWrap: 'wrap' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.78rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '4px 10px', borderRadius: '4px' }}>
                Synced: {lastUpdated}
              </span>
            )}
            <button 
              onClick={fetchLeaderboard}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                padding: '5px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                transition: 'all 0.2s ease'
              }}
            >
              🔄 Refresh
            </button>
          </div>
        </div>

        {/* Top 3 Cyber Podium */}
        {top3.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
            {/* 2nd Place */}
            <div className="comic-card card-hover-lift" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #38BDF8', background: 'rgba(56, 189, 248, 0.08)', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.2)', height: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🥈</div>
              <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: '800', letterSpacing: '1px' }}>2ND PLACE • SILVER</div>
              <h3 style={{ fontSize: '1.2rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[1].teamName}
              </h3>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {(top3[1].score ?? top3[1].totalScore ?? 0)} <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>pts</span>
              </div>
            </div>

            {/* 1st Place - Fiery Orangish & Crimson Red */}
            <div className="comic-card card-hover-lift" style={{ padding: '24px', textAlign: 'center', borderTop: '4px solid #F97316', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'linear-gradient(155deg, rgba(249, 115, 22, 0.12) 0%, rgba(224, 27, 34, 0.15) 60%, rgba(10, 16, 32, 0.95) 100%)', boxShadow: '0 12px 32px rgba(249, 115, 22, 0.3), 0 0 20px rgba(224, 27, 34, 0.25)', transform: 'scale(1.03)' }}>
              <div style={{ fontSize: '2.6rem', marginBottom: '4px' }}>👑</div>
              <div style={{ fontSize: '0.82rem', color: '#F97316', fontWeight: '900', letterSpacing: '1.5px' }}>CHAMPION • 1ST PLACE</div>
              <h3 style={{ fontSize: '1.35rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[0].teamName}
              </h3>
              <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#F97316', fontFamily: 'var(--font-display)', textShadow: '0 0 14px rgba(249, 115, 22, 0.5)' }}>
                {(top3[0].score ?? top3[0].totalScore ?? 0)} <span style={{ fontSize: '0.85rem', color: '#FB923C' }}>pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="comic-card card-hover-lift" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #EF4444', background: 'rgba(239, 68, 68, 0.08)', boxShadow: '0 8px 24px rgba(239, 68, 68, 0.2)', height: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥉</div>
              <div style={{ fontSize: '0.75rem', color: '#FF7B7B', fontWeight: '800', letterSpacing: '1px' }}>3RD PLACE • BRONZE</div>
              <h3 style={{ fontSize: '1.15rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[2].teamName}
              </h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {(top3[2].score ?? top3[2].totalScore ?? 0)} <span style={{ fontSize: '0.75rem', color: '#FF7B7B' }}>pts</span>
              </div>
            </div>
          </div>
        )}

        {/* Full Leaderboard Table */}
        <div className="glass-panel" style={{ padding: '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
              Loading standings...
            </div>
          ) : leaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
              No teams registered yet. Teams will populate once registered.
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(56, 189, 248, 0.3)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '14px 12px', color: '#38BDF8', width: '80px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Team Dossier &amp; Squad Roster</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Stage</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Computed Squad Score</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tournament Status</th>
                  </tr>
                </thead>
                <tbody>
                  {leaderboard.map((team, idx) => (
                    <tr 
                      key={team.id} 
                      style={{
                        borderBottom: '1px solid rgba(255,255,255,0.04)',
                        background: team.isEliminated 
                          ? 'rgba(224,27,34,0.03)' 
                          : (idx === 0 ? 'rgba(249,115,22,0.06)' : (idx === 1 ? 'rgba(56,189,248,0.04)' : (idx === 2 ? 'rgba(239,68,68,0.04)' : 'transparent'))),
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '16px 12px', fontWeight: '900', fontSize: '1.05rem', color: idx === 0 ? '#F97316' : (idx === 1 ? '#38BDF8' : (idx === 2 ? '#FF7B7B' : 'var(--text-secondary)')) }}>
                        {idx === 0 ? '👑 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `#${idx + 1}`))}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.05rem', color: '#FFF', letterSpacing: '0.5px' }}>{team.teamName}</div>
                        <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '3px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                          <span style={{ color: '#38BDF8', fontWeight: '600' }}>TID: {team.teamId}</span>
                          <span>•</span>
                          <span>{team.teamSize || 2} Pilots</span>
                          {team.memberNames && (
                            <>
                              <span>•</span>
                              <span style={{ color: '#E0E7FF', background: 'rgba(56, 189, 248, 0.1)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                                🧑‍🚀 {team.memberNames}
                              </span>
                            </>
                          )}
                        </div>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span className="badge" style={{ fontSize: '0.76rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#FFF' }}>
                          {STAGE_NAMES[team.roundNumber !== undefined ? team.roundNumber : (team.currentRound || 1)] || `Stage ${team.roundNumber ?? 1}`}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '900', fontSize: '1.35rem', color: '#FFF', fontFamily: 'var(--font-display)', textShadow: '0 0 12px rgba(56,189,248,0.5)' }}>
                        {(team.score ?? team.totalScore ?? 0)} <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>PTS</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        {team.isEliminated ? (
                          <span className="badge badge-eliminated" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            Eliminated
                          </span>
                        ) : (
                          <span className="badge badge-active" style={{ fontSize: '0.75rem', padding: '4px 10px' }}>
                            Qualified • Active
                          </span>
                        )}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}

