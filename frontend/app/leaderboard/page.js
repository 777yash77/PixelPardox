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
              <span className="marvel-logo" style={{ fontSize: '0.75rem', padding: '2px 8px' }}>MARVEL</span>
              <span style={{ fontSize: '0.8rem', color: '#FF4D4D', fontWeight: 'bold', letterSpacing: '1px' }}>LOGIN 2026</span>
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

        {/* Live Status Bar */}
        <div className="glass-panel" style={{ padding: '12px 20px', marginBottom: '28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '10px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            <span className="pulse-dot" style={{ width: '10px', height: '10px', background: '#4ADE80', borderRadius: '50%' }}></span>
            <span style={{ fontSize: '0.85rem', fontWeight: '600' }}>Live Engine Connected</span>
          </div>
          {lastUpdated && (
            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>
              Last synced at {lastUpdated}
            </span>
          )}
        </div>

        {/* Top 3 Podium (if >= 3 teams) */}
        {top3.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(3, 1fr)', gap: '16px', marginBottom: '32px', alignItems: 'flex-end' }}>
            {/* 2nd Place */}
            <div className="comic-card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #C0C0C0', height: '210px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥈</div>
              <div style={{ fontSize: '0.8rem', color: '#C0C0C0', fontWeight: 'bold' }}>2ND PLACE</div>
              <h3 style={{ fontSize: '1.1rem', margin: '6px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {top3[1].teamName}
              </h3>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#FFF' }}>
                {top3[1].totalScore} <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)' }}>pts</span>
              </div>
            </div>

            {/* 1st Place */}
            <div className="comic-card" style={{ padding: '24px', textAlign: 'center', borderTop: '4px solid #FACC15', height: '240px', display: 'flex', flexDirection: 'column', justifyContent: 'center', background: 'rgba(250, 204, 21, 0.04)' }}>
              <div style={{ fontSize: '2.4rem', marginBottom: '4px' }}>👑</div>
              <div style={{ fontSize: '0.85rem', color: '#FACC15', fontWeight: 'bold', letterSpacing: '1px' }}>LEADER / 1ST</div>
              <h3 style={{ fontSize: '1.25rem', margin: '6px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[0].teamName}
              </h3>
              <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#FACC15' }}>
                {top3[0].totalScore} <span style={{ fontSize: '0.85rem', color: 'var(--text-dim)' }}>pts</span>
              </div>
            </div>

            {/* 3rd Place */}
            <div className="comic-card" style={{ padding: '20px', textAlign: 'center', borderTop: '4px solid #CD7F32', height: '190px', display: 'flex', flexDirection: 'column', justifyContent: 'center' }}>
              <div style={{ fontSize: '1.8rem', marginBottom: '4px' }}>🥉</div>
              <div style={{ fontSize: '0.8rem', color: '#CD7F32', fontWeight: 'bold' }}>3RD PLACE</div>
              <h3 style={{ fontSize: '1.1rem', margin: '6px 0', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                {top3[2].teamName}
              </h3>
              <div style={{ fontSize: '1.4rem', fontWeight: 'bold', color: '#FFF' }}>
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
            <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
              <thead>
                <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', width: '60px' }}>Rank</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)' }}>Team Name</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Current Stage</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Total Score</th>
                  <th style={{ padding: '12px 10px', color: 'var(--text-secondary)', textAlign: 'center' }}>Status</th>
                </tr>
              </thead>
              <tbody>
                {leaderboard.map((team, idx) => (
                  <tr 
                    key={team.id}
                    style={{
                      borderBottom: '1px solid rgba(255,255,255,0.04)',
                      background: team.isEliminated ? 'rgba(224,27,34,0.04)' : (idx === 0 ? 'rgba(250,204,21,0.04)' : 'transparent')
                    }}
                  >
                    <td style={{ padding: '14px 10px', fontWeight: 'bold', fontSize: '1rem', color: idx === 0 ? '#FACC15' : (idx === 1 ? '#C0C0C0' : (idx === 2 ? '#CD7F32' : 'inherit')) }}>
                      {idx === 0 ? '🥇 1' : (idx === 1 ? '🥈 2' : (idx === 2 ? '🥉 3' : `#${idx + 1}`))}
                    </td>
                    <td style={{ padding: '14px 10px' }}>
                      <div style={{ fontWeight: '600', color: '#FFF' }}>{team.teamName}</div>
                      <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>TID: {team.teamId} • {team.teamSize} Members</span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                      <span className="badge" style={{ fontSize: '0.75rem', background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.1)' }}>
                        {STAGE_NAMES[team.currentRound] || `Stage ${team.currentRound}`}
                      </span>
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center', fontWeight: 'bold', fontSize: '1.2rem', color: '#FF4D4D' }}>
                      {team.totalScore}
                    </td>
                    <td style={{ padding: '14px 10px', textAlign: 'center' }}>
                      {team.isEliminated ? (
                        <span className="badge" style={{ background: 'rgba(224,27,34,0.15)', borderColor: '#E01B22', color: '#FF4D4D', fontSize: '0.75rem' }}>
                          Eliminated
                        </span>
                      ) : (
                        <span className="badge" style={{ background: 'rgba(74,222,128,0.15)', borderColor: '#4ADE80', color: '#4ADE80', fontSize: '0.75rem' }}>
                          Qualified / Active
                        </span>
                      )}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          )}
        </div>
      </div>
    </div>
  )
}
