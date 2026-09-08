'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const STAGE_NAMES = {
  0: 'Stage 0: Lobby',
  1: 'Stage 0: Prelims (Quiz)',
  2: 'Stage 1: Pixel Detective',
  3: 'Stage 2: The Glitch Hunt',
  4: 'Stage 3: Prompt Wars',
  5: 'Podium / Finished'
}

export default function LeaderboardPage() {
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const wsRef = useRef(null)

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/game/leaderboard')
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
    fetchLeaderboard()
    const pollInterval = setInterval(fetchLeaderboard, 5000)

    // Setup live websocket
    try {
      const ws = new WebSocket('ws://localhost:8080/ws')
      wsRef.current = ws

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
  }, [])

  const top3 = leaderboard.slice(0, 3)

  return (
    <div style={{ minHeight: '100vh', padding: '32px 20px', background: '#0A0607', color: '#E8E8E8' }}>
      <div style={{ maxWidth: '1000px', margin: '0 auto' }}>
        {/* Navigation & Header */}
        <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '32px', flexWrap: 'wrap', gap: '16px' }}>
          <div>
            <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
              <span style={{ fontSize: '0.8rem', color: '#FF4D4D', fontWeight: 'bold', letterSpacing: '1px' }}>LOGIN 2026 • MULTIVERSE</span>
            </div>
            <h1 className="glitch-text" data-text="LIVE LEADERBOARD" style={{ fontSize: 'clamp(1.8rem, 4vw, 2.5rem)', textTransform: 'uppercase', letterSpacing: '2px' }}>
              LIVE LEADERBOARD
            </h1>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', margin: 0 }}>
              Real-time standings across all stages • Automated scoring active for Stage 0 &amp; Stage 1
            </p>
          </div>

          <div style={{ display: 'flex', gap: '10px' }}>
            <Link href="/" className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none', color: '#FFF' }}>
              ← Home
            </Link>
            <Link href="/login" className="btn-primary" style={{ padding: '8px 16px', fontSize: '0.85rem', textDecoration: 'none' }}>
              Enter Portal
            </Link>
          </div>
        </header>

        {/* Live Status & Interactive Search Filter Bar */}
        <div className="glass-panel" style={{ padding: '14px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="pulse-dot" style={{ width: '10px', height: '10px', background: '#4ADE80', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '700', color: '#4ADE80' }}>TELEMETRY UPLINK ACTIVE</span>
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
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                padding: '5px 12px',
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
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
            {/* 2nd Place */}
            <div className="comic-card card-hover-lift" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #C0C0C0', background: 'rgba(192, 192, 192, 0.05)', boxShadow: '0 8px 24px rgba(192, 192, 192, 0.15)', height: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🥈</div>
              <div style={{ fontSize: '0.75rem', color: '#C0C0C0', fontWeight: '800', letterSpacing: '1px' }}>2ND PLACE • SILVER</div>
              <h3 style={{ fontSize: '1.2rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[1].teamName}
              </h3>
              <div style={{ fontSize: '1.6rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {top3[1].totalScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>pts</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="comic-card card-hover-lift" style={{ padding: '24px', textAlign: 'center', borderTop: '4px solid #FACC15', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(250, 204, 21, 0.08)', boxShadow: '0 12px 32px rgba(250, 204, 21, 0.25)', transform: 'scale(1.03)' }}>
              <div style={{ fontSize: '2.6rem', marginBottom: '4px' }}>👑</div>
              <div style={{ fontSize: '0.82rem', color: '#FACC15', fontWeight: '900', letterSpacing: '1.5px' }}>CHAMPION • 1ST PLACE</div>
              <h3 style={{ fontSize: '1.35rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[0].teamName}
              </h3>
              <div style={{ fontSize: '2.1rem', fontWeight: '900', color: '#FACC15', fontFamily: 'var(--font-display)' }}>
                {top3[0].totalScore} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="comic-card card-hover-lift" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #CD7F32', background: 'rgba(205, 127, 50, 0.05)', boxShadow: '0 8px 24px rgba(205, 127, 50, 0.15)', height: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥉</div>
              <div style={{ fontSize: '0.75rem', color: '#CD7F32', fontWeight: '800', letterSpacing: '1px' }}>3RD PLACE • BRONZE</div>
              <h3 style={{ fontSize: '1.15rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[2].teamName}
              </h3>
              <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {top3[2].totalScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>pts</span>
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
              No teams registered yet. Be the first squad to register!
              <div style={{ marginTop: '16px' }}>
                <Link href="/register" className="btn-primary" style={{ padding: '8px 18px', textDecoration: 'none' }}>
                  Register Team
                </Link>
              </div>
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(224,27,34,0.3)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '14px 12px', color: '#FF6B6B', width: '80px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Team Dossier</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Stage</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Live Score</th>
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
                          : (idx === 0 ? 'rgba(250,204,21,0.05)' : (idx === 1 ? 'rgba(192,192,192,0.03)' : (idx === 2 ? 'rgba(205,127,50,0.03)' : 'transparent'))),
                        transition: 'background 0.2s ease'
                      }}
                    >
                      <td style={{ padding: '16px 12px', fontWeight: '900', fontSize: '1.05rem', color: idx === 0 ? '#FACC15' : (idx === 1 ? '#E2E8F0' : (idx === 2 ? '#F97316' : 'var(--text-secondary)')) }}>
                        {idx === 0 ? '👑 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `#${idx + 1}`))}
                      </td>
                      <td style={{ padding: '16px 12px' }}>
                        <div style={{ fontWeight: '700', fontSize: '1.02rem', color: '#FFF', letterSpacing: '0.5px' }}>{team.teamName}</div>
                        <span style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>TID: {team.teamId} • {team.teamSize || 2} Pilots</span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center' }}>
                        <span className="badge" style={{ fontSize: '0.76rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.12)', color: '#FFF' }}>
                          {STAGE_NAMES[team.currentRound] || `Stage ${team.currentRound}`}
                        </span>
                      </td>
                      <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '900', fontSize: '1.35rem', color: '#FFF', fontFamily: 'var(--font-display)', textShadow: '0 0 12px rgba(224,27,34,0.6)' }}>
                        {team.totalScore} <span style={{ fontSize: '0.75rem', color: '#FF6B6B' }}>PTS</span>
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
