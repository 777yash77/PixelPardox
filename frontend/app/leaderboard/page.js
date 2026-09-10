'use client'

import { useState, useEffect, useRef, useMemo } from 'react'
import Link from 'next/link'
import { useRouter } from 'next/navigation'
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api'

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
  const [myTeamId, setMyTeamId] = useState(null)
  const [myParticipantName, setMyParticipantName] = useState(null)
  const [leaderboard, setLeaderboard] = useState([])
  const [loading, setLoading] = useState(true)
  const [lastUpdated, setLastUpdated] = useState(null)
  const [searchQuery, setSearchQuery] = useState('')
  const [statusFilter, setStatusFilter] = useState('ALL') // ALL, QUALIFIED, ELIMINATED, STAGE_0, STAGE_1, STAGE_2, STAGE_3
  const [isProjectorMode, setIsProjectorMode] = useState(false)
  const wsRef = useRef(null)

  // Verify credentials: strictly restricted to organizers / admins
  useEffect(() => {
    if (typeof window !== 'undefined') {
      const role = localStorage.getItem('role')
      if (role !== 'ROLE_ADMIN') {
        // Students strictly blocked from seeing the leaderboard
        router.push(role === 'ROLE_TEAM' ? '/game' : '/login')
        return
      }
      setIsAdmin(true)
      const tid = localStorage.getItem('teamId')
      if (tid) setMyTeamId(tid)
      const pname = localStorage.getItem('participantName')
      if (pname) setMyParticipantName(pname)
    }
  }, [router])

  const fetchLeaderboard = async () => {
    try {
      const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
      if (role !== 'ROLE_ADMIN') return
      const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null
      const res = await fetch(`${API_BASE_URL}/api/game/leaderboard`, {
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

  // WebSocket connection & live polling (Active for all viewers)
  useEffect(() => {
    fetchLeaderboard()
    const pollInterval = setInterval(fetchLeaderboard, 4000)

    try {
      const ws = new WebSocket(WS_BASE_URL)
      wsRef.current = ws

      ws.onopen = () => {
        try {
          const role = typeof window !== 'undefined' ? localStorage.getItem('role') : null
          if (role === 'ROLE_ADMIN') {
            ws.send(JSON.stringify({ type: 'REGISTER_ADMIN' }))
          }
        } catch (e) {
          console.error('Failed to send register message on ws', e)
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
  }, [])

  // Filtered leaderboard
  const filteredLeaderboard = useMemo(() => {
    return leaderboard.filter(team => {
      // Query filter
      const q = searchQuery.trim().toLowerCase()
      if (q) {
        const matchName = team.teamName?.toLowerCase().includes(q)
        const matchId = team.teamId?.toLowerCase().includes(q)
        const matchMembers = team.memberNames?.toLowerCase().includes(q)
        if (!matchName && !matchId && !matchMembers) return false
      }

      // Status filter
      if (statusFilter === 'QUALIFIED' && team.isEliminated) return false
      if (statusFilter === 'ELIMINATED' && !team.isEliminated) return false
      if (statusFilter === 'STAGE_0' && (team.roundNumber ?? team.currentRound ?? 1) !== 1) return false
      if (statusFilter === 'STAGE_1' && (team.roundNumber ?? team.currentRound ?? 1) !== 2) return false
      if (statusFilter === 'STAGE_2' && (team.roundNumber ?? team.currentRound ?? 1) !== 3) return false
      if (statusFilter === 'STAGE_3' && (team.roundNumber ?? team.currentRound ?? 1) !== 4) return false

      return true
    })
  }, [leaderboard, searchQuery, statusFilter])

  // User squad card if identified
  const mySquad = useMemo(() => {
    if (!myTeamId) return null
    const foundIdx = leaderboard.findIndex(t => t.teamId === myTeamId)
    if (foundIdx === -1) return null
    return {
      ...leaderboard[foundIdx],
      rank: foundIdx + 1
    }
  }, [leaderboard, myTeamId])

  const top3 = leaderboard.slice(0, 3)

  if (!isAdmin) {
    return (
      <div style={{ minHeight: '100vh', display: 'flex', alignItems: 'center', justifyContent: 'center', background: '#060812', color: '#E8E8E8' }}>
        <div style={{ textAlign: 'center', padding: '30px' }}>
          <span style={{ fontSize: '2.5rem' }}>🔒</span>
          <h2 style={{ marginTop: '14px', fontSize: '1.4rem', color: '#EF4444' }}>Organizer Access Only</h2>
          <p style={{ color: 'var(--text-secondary)', maxWidth: '420px', margin: '8px auto 0', fontSize: '0.88rem' }}>
            The tournament leaderboard is strictly restricted and reserved for auditorium projection by organizers.
          </p>
        </div>
      </div>
    )
  }

  return (
    <div style={{
      minHeight: '100vh',
      padding: isProjectorMode ? '20px 24px' : '28px 20px',
      background: '#060812',
      color: '#E8E8E8',
      transition: 'all 0.3s ease'
    }}>
      <div style={{ maxWidth: isProjectorMode ? '100%' : '1750px', margin: '0 auto', width: '100%' }}>
        
        {/* Navigation & Header */}
        {!isProjectorMode && (
          <header style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '16px' }}>
            <div>
              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '6px' }}>
                <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#38BDF8' }} />
                <span style={{ fontSize: '0.76rem', color: '#38BDF8', fontWeight: 'bold', letterSpacing: '1.2px', textTransform: 'uppercase' }}>
                  MULTIVERSE TELEMETRY • OFFICIAL STANDINGS
                </span>
                {isAdmin && (
                  <span style={{ fontSize: '0.7rem', background: 'rgba(224, 27, 34, 0.2)', border: '1px solid #E01B22', color: '#FF6B6B', padding: '1px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    ADMIN TERMINAL
                  </span>
                )}
              </div>
              <h1 className="glitch-text" data-text="LIVE MULTIVERSE LEADERBOARD" style={{ fontSize: 'clamp(1.8rem, 3.8vw, 2.6rem)', textTransform: 'uppercase', letterSpacing: '1.5px', margin: 0 }}>
                LIVE MULTIVERSE LEADERBOARD
              </h1>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', margin: '4px 0 0 0' }}>
                Real-time tournament score convergence across all participating squads
              </p>
            </div>

            <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
              <button
                onClick={() => setIsProjectorMode(true)}
                style={{
                  padding: '9px 18px',
                  fontSize: '0.85rem',
                  background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(224, 27, 34, 0.25) 100%)',
                  border: '1.5px solid #F97316',
                  color: '#FFF',
                  borderRadius: '8px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 0 14px rgba(249, 115, 22, 0.35)',
                  transition: 'all 0.2s ease'
                }}
                title="Switch to full-screen high-contrast auditorium projector display"
              >
                <span>📽️</span> Projector Mode
              </button>

              {isAdmin && (
                <Link href="/admin" className="btn-primary-blue" style={{ padding: '9px 18px', fontSize: '0.85rem', textDecoration: 'none', display: 'flex', alignItems: 'center', gap: '6px' }}>
                  <span>⚙️</span> Admin Console
                </Link>
              )}

              <Link href="/game" style={{
                textDecoration: 'none',
                color: '#38BDF8',
                fontSize: '0.85rem',
                fontWeight: '700',
                padding: '9px 16px',
                borderRadius: '8px',
                background: 'rgba(56, 189, 248, 0.1)',
                border: '1px solid rgba(56, 189, 248, 0.35)'
              }}>
                🎮 Game Arena
              </Link>

              <Link href="/" className="btn-secondary" style={{ padding: '9px 16px', fontSize: '0.85rem', textDecoration: 'none', color: '#FFF' }}>
                ← Home
              </Link>
            </div>
          </header>
        )}

        {/* Projector Mode Top Bar */}
        {isProjectorMode && (
          <div style={{
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            padding: '12px 20px',
            marginBottom: '20px',
            background: 'linear-gradient(90deg, rgba(14, 22, 38, 0.95) 0%, rgba(26, 10, 16, 0.95) 100%)',
            border: '2px solid #F97316',
            borderRadius: '12px',
            boxShadow: '0 0 25px rgba(249, 115, 22, 0.3)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.6rem' }}>📽️</span>
              <div>
                <div style={{ fontSize: '0.74rem', color: '#F97316', fontWeight: '900', letterSpacing: '2px', textTransform: 'uppercase' }}>
                  AUDITORIUM SPECTATOR FEED • REAL-TIME
                </div>
                <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFF', letterSpacing: '1px' }}>
                  PIXEL PARADOX CHAMPIONSHIP STANDINGS
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
              <span className="live-pulse-dot" style={{ width: '10px', height: '10px', background: '#38BDF8' }} />
              <span style={{ fontSize: '0.85rem', color: '#7DD3FC', fontWeight: 'bold' }}>
                LIVE TOURNAMENT SYNC {lastUpdated ? `(${lastUpdated})` : ''}
              </span>
              <button
                onClick={() => setIsProjectorMode(false)}
                style={{
                  background: 'rgba(255, 255, 255, 0.12)',
                  border: '1px solid rgba(255, 255, 255, 0.25)',
                  color: '#FFF',
                  padding: '6px 14px',
                  borderRadius: '6px',
                  fontSize: '0.8rem',
                  fontWeight: 'bold',
                  cursor: 'pointer'
                }}
              >
                ✕ Exit Projector View
              </button>
            </div>
          </div>
        )}

        {/* User's Squad Highlighted Banner (if authenticated as team) */}
        {mySquad && !isProjectorMode && (
          <div style={{
            background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.12) 0%, rgba(249, 115, 22, 0.12) 100%)',
            border: '1.8px solid #38BDF8',
            borderRadius: '12px',
            padding: '16px 22px',
            marginBottom: '20px',
            display: 'flex',
            justifyContent: 'space-between',
            alignItems: 'center',
            flexWrap: 'wrap',
            gap: '12px',
            boxShadow: '0 8px 24px rgba(56, 189, 248, 0.25)'
          }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
              <span style={{ fontSize: '1.8rem' }}>⭐</span>
              <div>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                  <span style={{ fontSize: '0.74rem', background: '#0284C7', color: '#FFF', fontWeight: '900', padding: '2px 8px', borderRadius: '4px' }}>
                    YOUR SQUAD DOSSIER
                  </span>
                  <span style={{ fontSize: '0.82rem', color: '#BAE6FD' }}>TID: {mySquad.teamId}</span>
                </div>
                <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#FFF', marginTop: '2px' }}>
                  {mySquad.teamName} {myParticipantName ? `(Terminal: ${myParticipantName})` : ''}
                </div>
              </div>
            </div>

            <div style={{ display: 'flex', alignItems: 'center', gap: '24px' }}>
              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Rank</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: mySquad.rank <= 3 ? '#F97316' : '#38BDF8', fontFamily: 'var(--font-display)' }}>
                  #{mySquad.rank}
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Squad Score</div>
                <div style={{ fontSize: '1.6rem', fontWeight: '900', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                  {mySquad.score ?? mySquad.totalScore ?? 0} <span style={{ fontSize: '0.8rem', color: '#38BDF8' }}>PTS</span>
                </div>
              </div>

              <div style={{ textAlign: 'center' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Status</div>
                <span className={`badge ${mySquad.isEliminated ? 'badge-eliminated' : 'badge-active'}`} style={{ fontSize: '0.76rem', padding: '4px 10px' }}>
                  {mySquad.isEliminated ? 'Eliminated' : 'Qualified'}
                </span>
              </div>
            </div>
          </div>
        )}

        {/* Top 3 Cyber Podium */}
        {top3.length >= 3 && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px', marginBottom: '24px', alignItems: 'flex-end' }}>
            {/* 2nd Place - Spider-Man Cyan */}
            <div className="comic-card card-hover-lift" style={{
              padding: '20px',
              textAlign: 'center',
              borderTop: '4px solid #38BDF8',
              background: 'linear-gradient(160deg, rgba(56, 189, 248, 0.12) 0%, rgba(10, 16, 32, 0.95) 100%)',
              boxShadow: '0 8px 28px rgba(56, 189, 248, 0.22)',
              minHeight: '210px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '2.2rem', marginBottom: '4px' }}>🥈</div>
              <div style={{ fontSize: '0.75rem', color: '#7DD3FC', fontWeight: '800', letterSpacing: '1px' }}>2ND PLACE • RUNNER-UP</div>
              <h3 style={{ fontSize: '1.25rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[1].teamName}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                TID: {top3[1].teamId} {top3[1].memberNames ? `• ${top3[1].memberNames}` : ''}
              </div>
              <div style={{ fontSize: '1.75rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {(top3[1].score ?? top3[1].totalScore ?? 0)} <span style={{ fontSize: '0.8rem', color: '#38BDF8' }}>pts</span>
              </div>
            </div>

            {/* 1st Place - Fiery Orangish & Crimson Red */}
            <div className="comic-card card-hover-lift" style={{
              padding: '24px',
              textAlign: 'center',
              borderTop: '4px solid #F97316',
              minHeight: '245px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center',
              background: 'linear-gradient(155deg, rgba(249, 115, 22, 0.16) 0%, rgba(224, 27, 34, 0.2) 60%, rgba(10, 16, 32, 0.98) 100%)',
              boxShadow: '0 14px 38px rgba(249, 115, 22, 0.35), 0 0 24px rgba(224, 27, 34, 0.25)',
              transform: isProjectorMode ? 'scale(1.04)' : 'scale(1.02)'
            }}>
              <div style={{ fontSize: '2.8rem', marginBottom: '4px' }}>👑</div>
              <div style={{ fontSize: '0.82rem', color: '#F97316', fontWeight: '900', letterSpacing: '1.5px' }}>GRAND CHAMPION • 1ST PLACE</div>
              <h3 style={{ fontSize: '1.45rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[0].teamName}
              </h3>
              <div style={{ fontSize: '0.78rem', color: '#FED7AA', marginBottom: '8px' }}>
                TID: {top3[0].teamId} {top3[0].memberNames ? `• ${top3[0].memberNames}` : ''}
              </div>
              <div style={{ fontSize: '2.3rem', fontWeight: '900', color: '#F97316', fontFamily: 'var(--font-display)', textShadow: '0 0 16px rgba(249, 115, 22, 0.55)' }}>
                {(top3[0].score ?? top3[0].totalScore ?? 0)} <span style={{ fontSize: '0.9rem', color: '#FB923C' }}>pts</span>
              </div>
            </div>

            {/* 3rd Place - Deadpool Crimson Red */}
            <div className="comic-card card-hover-lift" style={{
              padding: '20px',
              textAlign: 'center',
              borderTop: '4px solid #EF4444',
              background: 'linear-gradient(160deg, rgba(239, 68, 68, 0.12) 0%, rgba(10, 16, 32, 0.95) 100%)',
              boxShadow: '0 8px 28px rgba(239, 68, 68, 0.22)',
              minHeight: '200px',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'center'
            }}>
              <div style={{ fontSize: '2rem', marginBottom: '4px' }}>🥉</div>
              <div style={{ fontSize: '0.75rem', color: '#FF7B7B', fontWeight: '800', letterSpacing: '1px' }}>3RD PLACE • BRONZE</div>
              <h3 style={{ fontSize: '1.2rem', margin: '8px 0 4px', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap', color: '#FFF' }}>
                {top3[2].teamName}
              </h3>
              <div style={{ fontSize: '0.78rem', color: 'var(--text-dim)', marginBottom: '8px' }}>
                TID: {top3[2].teamId} {top3[2].memberNames ? `• ${top3[2].memberNames}` : ''}
              </div>
              <div style={{ fontSize: '1.65rem', fontWeight: 'bold', color: '#FFF', fontFamily: 'var(--font-display)' }}>
                {(top3[2].score ?? top3[2].totalScore ?? 0)} <span style={{ fontSize: '0.8rem', color: '#FF7B7B' }}>pts</span>
              </div>
            </div>
          </div>
        )}

        {/* Live Search & Filter Command HUD */}
        <div className="glass-panel" style={{ padding: '16px 20px', marginBottom: '20px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '14px' }}>
          {/* Search Box */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flex: '1 1 320px', maxWidth: '480px' }}>
            <span style={{ fontSize: '1.1rem' }}>🔍</span>
            <input
              type="text"
              value={searchQuery}
              onChange={(e) => setSearchQuery(e.target.value)}
              placeholder="Search by Team Name, Team ID, or Members..."
              style={{
                width: '100%',
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1.5px solid rgba(56, 189, 248, 0.3)',
                borderRadius: '8px',
                padding: '9px 14px',
                color: '#FFF',
                fontSize: '0.85rem',
                outline: 'none'
              }}
            />
            {searchQuery && (
              <button
                onClick={() => setSearchQuery('')}
                style={{
                  background: 'none',
                  border: 'none',
                  color: 'var(--text-dim)',
                  cursor: 'pointer',
                  fontSize: '0.85rem'
                }}
              >
                ✕
              </button>
            )}
          </div>

          {/* Quick Filter Pills */}
          <div style={{ display: 'flex', gap: '6px', flexWrap: 'wrap', alignItems: 'center' }}>
            {[
              { id: 'ALL', label: 'All Squads' },
              { id: 'QUALIFIED', label: 'Qualified Only' },
              { id: 'ELIMINATED', label: 'Eliminated' },
              { id: 'STAGE_0', label: 'Stage 0' },
              { id: 'STAGE_1', label: 'Stage 1' },
              { id: 'STAGE_2', label: 'Stage 2' },
              { id: 'STAGE_3', label: 'Stage 3' }
            ].map(tab => (
              <button
                key={tab.id}
                onClick={() => setStatusFilter(tab.id)}
                style={{
                  background: statusFilter === tab.id ? 'rgba(56, 189, 248, 0.25)' : 'rgba(255, 255, 255, 0.04)',
                  border: `1px solid ${statusFilter === tab.id ? '#38BDF8' : 'rgba(255, 255, 255, 0.12)'}`,
                  color: statusFilter === tab.id ? '#38BDF8' : 'var(--text-secondary)',
                  padding: '5px 12px',
                  borderRadius: '6px',
                  fontSize: '0.78rem',
                  fontWeight: statusFilter === tab.id ? 'bold' : 'normal',
                  cursor: 'pointer',
                  transition: 'all 0.15s ease'
                }}
              >
                {tab.label}
              </button>
            ))}
          </div>

          {/* Refresh & Telemetry status */}
          <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
            {lastUpdated && (
              <span style={{ fontSize: '0.76rem', color: 'var(--text-dim)', background: 'rgba(255,255,255,0.04)', padding: '5px 10px', borderRadius: '4px' }}>
                Synced: {lastUpdated}
              </span>
            )}
            <button
              onClick={fetchLeaderboard}
              style={{
                background: 'rgba(56, 189, 248, 0.12)',
                border: '1px solid #38BDF8',
                color: '#38BDF8',
                padding: '6px 14px',
                borderRadius: '6px',
                fontSize: '0.78rem',
                cursor: 'pointer',
                fontWeight: 'bold',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
            >
              <span>🔄</span> Refresh
            </button>
          </div>
        </div>

        {/* Full Leaderboard Table */}
        <div className="glass-panel" style={{ padding: isProjectorMode ? '20px' : '24px' }}>
          {loading ? (
            <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
              <div className="pulse-dot" style={{ width: '12px', height: '12px', background: '#38BDF8', margin: '0 auto 12px' }} />
              Connecting to central tournament scoring telemetry...
            </div>
          ) : filteredLeaderboard.length === 0 ? (
            <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
              <div style={{ fontSize: '2.5rem', marginBottom: '12px' }}>🔍</div>
              <p style={{ fontSize: '1rem', color: '#FFF', fontWeight: '700', marginBottom: '6px' }}>
                {searchQuery ? `No teams match "${searchQuery}"` : 'No teams found in this category'}
              </p>
              <p style={{ fontSize: '0.85rem', color: 'var(--text-secondary)', marginBottom: '18px' }}>
                Try adjusting your search keywords or switching category filters.
              </p>
              {(searchQuery || statusFilter !== 'ALL') && (
                <button
                  type="button"
                  onClick={() => { setSearchQuery(''); setStatusFilter('ALL'); }}
                  className="btn-secondary"
                  style={{ padding: '8px 18px', fontSize: '0.82rem', borderColor: '#38BDF8', color: '#38BDF8' }}
                >
                  ↺ Reset Search &amp; Filters
                </button>
              )}
            </div>
          ) : (
            <div className="table-responsive" style={{ overflowX: 'auto' }}>
              <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                <thead>
                  <tr style={{ borderBottom: '2px solid rgba(56, 189, 248, 0.3)', background: 'rgba(255,255,255,0.02)' }}>
                    <th style={{ padding: '14px 12px', color: '#38BDF8', width: '90px', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Rank</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Team Dossier &amp; Squad Roster</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Stage</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Computed Squad Score</th>
                    <th style={{ padding: '14px 12px', color: 'var(--text-secondary)', textAlign: 'center', fontSize: '0.78rem', textTransform: 'uppercase', letterSpacing: '1px' }}>Tournament Status</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredLeaderboard.map((team, idx) => {
                    const isMyTeam = myTeamId && team.teamId === myTeamId
                    const actualRank = idx + 1
                    return (
                      <tr
                        key={team.id || team.teamId || idx}
                        style={{
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: isMyTeam
                            ? 'rgba(56, 189, 248, 0.12)'
                            : (team.isEliminated
                              ? 'rgba(224,27,34,0.03)'
                              : (idx === 0 ? 'rgba(249,115,22,0.06)' : (idx === 1 ? 'rgba(56,189,248,0.04)' : (idx === 2 ? 'rgba(239,68,68,0.04)' : 'transparent')))),
                          borderLeft: isMyTeam ? '4px solid #38BDF8' : 'none',
                          transition: 'background 0.2s ease'
                        }}
                      >
                        <td style={{ padding: '16px 12px', fontWeight: '900', fontSize: isProjectorMode ? '1.25rem' : '1.05rem', color: idx === 0 ? '#F97316' : (idx === 1 ? '#38BDF8' : (idx === 2 ? '#FF7B7B' : 'var(--text-secondary)')) }}>
                          {idx === 0 ? '👑 #1' : (idx === 1 ? '🥈 #2' : (idx === 2 ? '🥉 #3' : `#${actualRank}`))}
                        </td>
                        <td style={{ padding: '16px 12px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ fontWeight: '700', fontSize: isProjectorMode ? '1.2rem' : '1.05rem', color: '#FFF', letterSpacing: '0.5px' }}>
                              {team.teamName}
                            </span>
                            {isMyTeam && (
                              <span style={{
                                background: 'linear-gradient(90deg, #0284C7, #38BDF8)',
                                color: '#FFF',
                                fontSize: '0.7rem',
                                fontWeight: '900',
                                padding: '2px 8px',
                                borderRadius: '4px',
                                letterSpacing: '0.5px'
                              }}>
                                ⭐ YOUR SQUAD
                              </span>
                            )}
                          </div>
                          <div style={{ fontSize: '0.76rem', color: 'var(--text-dim)', marginTop: '4px', display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#38BDF8', fontWeight: '600' }}>TID: {team.teamId}</span>
                            <span>•</span>
                            <span>{team.teamSize || 2} Members</span>
                            {team.memberNames && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#E0E7FF', background: 'rgba(56, 189, 248, 0.08)', padding: '2px 8px', borderRadius: '4px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
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
                        <td style={{ padding: '16px 12px', textAlign: 'center', fontWeight: '900', fontSize: isProjectorMode ? '1.6rem' : '1.35rem', color: '#FFF', fontFamily: 'var(--font-display)', textShadow: '0 0 12px rgba(56,189,248,0.5)' }}>
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
                    )
                  })}
                </tbody>
              </table>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
