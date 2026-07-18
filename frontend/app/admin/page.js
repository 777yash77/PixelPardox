'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function AdminDashboard() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [activeTab, setActiveTab] = useState('control')
  const [gameState, setGameState] = useState({
    activeRound: 0,
    activeQuestionId: null,
    timerDuration: 0,
    questionStartTime: 0,
    timerRunning: false,
    zoomLevel: 100
  })

  // Media Manager State
  const [images, setImages] = useState([])
  const [uploadData, setUploadData] = useState({
    file: null,
    isAi: false,
    modelUsed: '',
    roundNumber: 1,
    bonusQuestion: 'What AI Model was used to generate this image?',
    answerDetails: '',
    glitchCoordinates: '',
    isLightning: false
  })
  const fileInputRef = useRef(null)
  const [uploadStatus, setUploadStatus] = useState({ success: '', error: '' })

  // Control Room State
  const [submissionCount, setSubmissionCount] = useState(0)
  const [timerText, setTimerText] = useState('00:00')

  // Grading State
  const [submissions, setSubmissions] = useState([])
  const [gradeScores, setGradeScores] = useState({}) // submissionId -> score
  const [gradingStatus, setGradingStatus] = useState('')

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([])
  const [advancementStatus, setAdvancementStatus] = useState('')

  // WebSocket Ref
  const wsRef = useRef(null)

  // 1. Verify Admin Status
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    const role = localStorage.getItem('role')
    if (!storedToken || role !== 'ROLE_ADMIN') {
      router.push('/login')
      return
    }
    setToken(storedToken)
    fetchGameState()
    fetchImages(storedToken)
    fetchLeaderboard()
  }, [])

  // Refetch grading submissions when tab changes
  useEffect(() => {
    if (activeTab === 'grading' && token) {
      fetchSubmissionsForGrading()
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard()
    }
  }, [activeTab, gameState.activeRound])

  // Timer Countdown Effect
  useEffect(() => {
    let interval
    if (gameState.timerRunning && gameState.questionStartTime > 0 && gameState.timerDuration > 0) {
      interval = setInterval(() => {
        const elapsed = Math.floor((Date.now() - gameState.questionStartTime) / 1000)
        const remaining = gameState.timerDuration - elapsed
        if (remaining <= 0) {
          setTimerText('TIME UP')
          clearInterval(interval)
        } else {
          const m = String(Math.floor(remaining / 60)).padStart(2, '0')
          const s = String(remaining % 60).padStart(2, '0')
          setTimerText(`${m}:${s}`)
        }
      }, 500)
    } else {
      setTimerText('00:00')
    }
    return () => clearInterval(interval)
  }, [gameState.timerRunning, gameState.questionStartTime, gameState.timerDuration])

  // 2. HTTP Fetch Operations
  const fetchGameState = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/game/state')
      if (res.ok) {
        const data = await res.json()
        setGameState(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchImages = async (tok) => {
    try {
      const res = await fetch('http://localhost:8080/api/game/images', {
        headers: { 'Authorization': `Bearer ${tok || token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/game/leaderboard')
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data)
      }
    } catch (e) {
      console.error(e)
    }
  }

  const fetchSubmissionsForGrading = async () => {
    try {
      const res = await fetch(`http://localhost:8080/api/game/submissions?round=${gameState.activeRound}`, {
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        const isEvaluatingOrBreakRound = gameState.activeRound === 6 || gameState.activeRound === 7

        if (Array.isArray(data) && data.length > 0) {
          setSubmissions(data)
        } else if (!isEvaluatingOrBreakRound) {
          setSubmissions([])
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

  // 3. WebSocket Connection (Native)
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout = null;

    const setupWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/ws')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Admin connected to Game WebSockets')
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('Received WebSocket message:', message)

        if (message.type === 'GAME_STATE') {
          setGameState(message.payload)
          // Reset submission counters on new question
          setSubmissionCount(0)
        } else if (message.type === 'SUBMISSION') {
          setSubmissionCount(prev => prev + 1)
          // If on grading tab, prepend new submission
          setSubmissions(prev => {
            if (prev.some(s => s.id === message.payload.id)) return prev
            return [message.payload, ...prev]
          })
        } else if (message.type === 'SCORES_UPDATED') {
          if (Array.isArray(message.payload)) {
            setLeaderboard(message.payload)
          } else {
            fetchLeaderboard()
          }
        }
      }

      ws.onclose = () => {
        if (isMounted) {
          console.log('WebSocket closed, reconnecting in 3 seconds...')
          reconnectTimeout = setTimeout(setupWebSocket, 3000)
        }
      }
    }

    setupWebSocket()

    return () => {
      isMounted = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) wsRef.current.close()
    }
  }, [])

  // 4. Action Handlers
  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  // Control Room Actions
  const handleUpdateGameState = async (round, qId, timerSec, zoom) => {
    try {
      const res = await fetch('http://localhost:8080/api/game/state/update', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ round, questionId: qId, duration: timerSec, zoom })
      })
      if (res.ok) {
        const data = await res.json()
        setGameState(data)
      }
    } catch (e) {
      alert('Failed to update game state')
    }
  }

  const handleToggleTimer = async (running) => {
    try {
      const res = await fetch(`http://localhost:8080/api/game/state/timer?running=${running}`, {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setGameState(data)
      }
    } catch (e) {
      alert('Failed to update timer status')
    }
  }

  const handleResetGame = async () => {
    if (!confirm('DANGER: Are you absolutely sure you want to RESET the game engine? This will delete ALL submissions and reset all team scores back to 0. Uploaded images will be kept.')) return;
    
    try {
      const res = await fetch('http://localhost:8080/api/game/reset', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('Game Engine successfully reset. All teams are back to 0 points.')
        fetchGameState()
        fetchLeaderboard()
        fetchSubmissionsForGrading()
      } else {
        alert('Failed to reset game engine.')
      }
    } catch (e) {
      alert('Failed to reset game engine (server error).')
    }
  }

  // Media Manager Actions
  const handleUploadChange = (e) => {
    if (e.target.name === 'file') {
      setUploadData({ ...uploadData, file: e.target.files[0] })
    } else if (e.target.type === 'checkbox') {
      setUploadData({ ...uploadData, [e.target.name]: e.target.checked })
    } else {
      setUploadData({ ...uploadData, [e.target.name]: e.target.value })
    }
  }

  const handleUploadSubmit = async (e) => {
    e.preventDefault()
    setUploadStatus({ success: '', error: '' })

    if (!uploadData.file) {
      setUploadStatus({ success: '', error: 'Please choose an image file' })
      return
    }

    const formData = new FormData()
    formData.append('file', uploadData.file)
    formData.append('isAi', uploadData.isAi)
    formData.append('modelUsed', uploadData.isAi ? uploadData.modelUsed : '')
    formData.append('roundNumber', uploadData.roundNumber)
    formData.append('bonusQuestion', uploadData.bonusQuestion)
    formData.append('answerDetails', uploadData.answerDetails)
    formData.append('glitchCoordinates', uploadData.glitchCoordinates)
    formData.append('isLightning', uploadData.isLightning)

    try {
      const res = await fetch('http://localhost:8080/api/game/upload', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` },
        body: formData
      })
      if (res.ok) {
        setUploadStatus({ success: 'Image uploaded successfully!', error: '' })
        setUploadData({
          file: null,
          isAi: false,
          modelUsed: '',
          roundNumber: uploadData.roundNumber, // persist current round
          bonusQuestion: 'What AI Model was used to generate this image?',
          answerDetails: '',
          glitchCoordinates: '',
          isLightning: false
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchImages(token)
      } else {
        const data = await res.json()
        setUploadStatus({ success: '', error: data.message || 'Upload failed' })
      }
    } catch (err) {
      setUploadStatus({ success: '', error: 'Server connection error during upload.' })
    }
  }

  const handleDeleteImage = async (id) => {
    if (!confirm('Are you sure you want to delete this image question?')) return
    try {
      const res = await fetch(`http://localhost:8080/api/game/images/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchImages(token)
      } else {
        alert('Failed to delete image')
      }
    } catch (e) {
      console.error(e)
    }
  }

  // Grading Actions
  const handleGradeSubmit = async (submissionId) => {
    const score = gradeScores[submissionId]
    if (score === undefined || score === '') {
      alert('Please enter a grade score')
      return
    }

    try {
      const res = await fetch('http://localhost:8080/api/game/grade', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ submissionId, score: parseInt(score) })
      })
      if (res.ok) {
        // Remove from list
        setSubmissions(prev => prev.filter(s => s.id !== submissionId))
        setGradingStatus('Score graded successfully!')
        setTimeout(() => setGradingStatus(''), 2500)
      } else {
        alert('Failed to grade submission')
      }
    } catch (e) {
      alert('Error grading submission')
    }
  }

  // Advancement Actions
  const handleAdvanceTeams = async (limitVal, isPct) => {
    const desc = isPct ? `top ${limitVal}%` : `top ${limitVal} teams`
    if (!confirm(`Are you sure you want to advance the ${desc} and eliminate the rest?`)) return
    setAdvancementStatus('Processing team qualifications...')

    try {
      const res = await fetch('http://localhost:8080/api/game/advance-teams', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify({ limitValue: limitVal, isPercent: isPct })
      })
      if (res.ok) {
        setAdvancementStatus('Advancement complete! Round has progressed.')
        fetchGameState()
        fetchLeaderboard()
        setTimeout(() => setAdvancementStatus(''), 4000)
      } else {
        setAdvancementStatus('Error advancing teams.')
      }
    } catch (e) {
      setAdvancementStatus('Server connection error.')
    }
  }

  return (
    <div className="page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Navigation Header */}
      <nav className="glass-panel" style={{ margin: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
          <h1 style={{ fontSize: '1.25rem' }} className="cyan-gradient-text">Pixel Paradox Organizer</h1>
          <span className="badge badge-active">Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: '12px' }}>
          <button onClick={() => router.push('/admin/teams')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Registered Teams</button>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>Logout</button>
        </div>
      </nav>

      {/* Tab Selectors */}
      <div style={{ padding: '0 24px', display: 'flex', gap: '8px', marginBottom: '16px' }}>
        <button 
          onClick={() => setActiveTab('control')} 
          className={activeTab === 'control' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0' }}
        >
          Game Control Room
        </button>
        <button 
          onClick={() => setActiveTab('media')} 
          className={activeTab === 'media' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0' }}
        >
          Media Manager
        </button>
        <button 
          onClick={() => setActiveTab('grading')} 
          className={activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0' }}
        >
          Grading Station ({submissions.length})
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')} 
          className={activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 20px', borderRadius: '8px 8px 0 0' }}
        >
          Real-Time Leaderboard
        </button>
      </div>

      <main className="container" style={{ flex: 1, paddingBottom: '60px' }}>
        {/* TAB 1: CONTROL ROOM */}
        {activeTab === 'control' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(300px, 1fr))', gap: '24px' }}>
            {/* Global Game State Config */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Active Round Config</h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Round:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: 'var(--color-cyan)', marginTop: '4px' }}>
                    {gameState.activeRound === 0 ? '0 (Registration)' : 
                     gameState.activeRound === 5 ? '5 (Game Ended)' : 
                     `Round ${gameState.activeRound}`}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '12px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Question ID:</span>
                  <div style={{ fontSize: '1.5rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {gameState.activeQuestionId || 'None'}
                  </div>
                </div>
              </div>

              {/* Set Round Manual override */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Set Active Round</label>
                <select 
                  className="form-input" 
                  value={gameState.activeRound}
                  onChange={(e) => handleUpdateGameState(Number(e.target.value), null, 0, 100)}
                >
                  <option value={0}>Round 0 - Registration</option>
                  <option value={1}>Round 1 - Pixel Detective</option>
                  <option value={2}>Round 2 - The Glitch Hunt</option>
                  <option value={3}>Round 3 - Prompt Wars</option>
                  <option value={4}>Round 4 - Tie-Breaker</option>
                  <option value={5}>Round 5 - Game Over</option>
                  <option value={6}>Round 6 - Evaluating Results</option>
                  <option value={7}>Round 7 - Break Time</option>
                </select>
              </div>

              {/* Reset Game Engine */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button 
                  onClick={handleResetGame} 
                  style={{ width: '100%', padding: '12px', background: 'rgba(255,20,147,0.1)', border: '1px solid #ff1493', color: '#ff5c93', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⚠️ Reset Game Engine
                </button>
              </div>

              {/* Live Timer control */}
              {gameState.activeQuestionId && (
                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Timer Controls</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#ff1493', fontFamily: 'var(--font-display)' }} className={gameState.timerRunning ? 'blink' : ''}>
                      {timerText}
                    </div>
                    <div>
                      {gameState.timerRunning ? (
                        <button onClick={() => handleToggleTimer(false)} className="btn-secondary" style={{ padding: '8px 16px', background: 'rgba(255,20,147,0.1)', borderColor: '#ff1493', color: '#ff5c93' }}>Pause Timer</button>
                      ) : (
                        <button onClick={() => handleToggleTimer(true)} className="btn-primary" style={{ padding: '8px 16px' }}>Start Timer</button>
                      )}
                    </div>
                  </div>
                  <div style={{ color: 'var(--text-secondary)', fontSize: '0.9rem' }}>
                    Submissions received for active question: <strong style={{ color: '#fff', fontSize: '1.2rem' }}>{submissionCount}</strong>
                  </div>
                </div>
              )}
            </div>

            {/* Images List for Selection */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Round Images</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                Select an image to project to team screens.
              </p>

              {images.filter(img => img.roundNumber === gameState.activeRound).length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                  No images uploaded for Round {gameState.activeRound} yet.
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', maxHeight: '450px', overflowY: 'auto', paddingRight: '4px' }}>
                  {images
                    .filter(img => img.roundNumber === gameState.activeRound)
                    .map((img) => (
                      <div 
                        key={img.id} 
                        className="glass-panel" 
                        style={{ 
                          padding: '12px', 
                          display: 'flex', 
                          gap: '12px', 
                          alignItems: 'center', 
                          borderColor: gameState.activeQuestionId === img.id ? 'var(--color-cyan)' : 'var(--card-border)',
                          background: gameState.activeQuestionId === img.id ? 'rgba(0,210,255,0.05)' : 'var(--card-bg)'
                        }}
                      >
                        <img 
                          src={`http://localhost:8080${img.imageUrl}`} 
                          alt="preview" 
                          style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                        <div style={{ flex: 1, minWidth: 0 }}>
                          <div style={{ fontSize: '0.9rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                            Question ID: {img.id} {img.isLightning && <span style={{ color: '#ff1493', fontSize: '0.75rem' }}>[Lightning]</span>}
                          </div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {img.isAi ? `AI (${img.modelUsed})` : 'Real'}
                          </div>
                        </div>
                        <div style={{ display: 'flex', flexDirection: 'column', gap: '4px' }}>
                          {gameState.activeQuestionId === img.id ? (
                            <button 
                              onClick={() => handleUpdateGameState(gameState.activeRound, null, 0, 100)} 
                              className="btn-secondary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#ff5c93' }}
                            >
                              Stop
                            </button>
                          ) : (
                            <button 
                              onClick={() => handleUpdateGameState(
                                gameState.activeRound, 
                                img.id, 
                                gameState.activeRound === 1 ? 10 : 60, // default timers (10s R1, 60s others)
                                100
                              )} 
                              className="btn-primary" 
                              style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                            >
                              Launch
                            </button>
                          )}
                          
                          {/* Zoom adjustment for Tie-breaker (Round 4) */}
                          {gameState.activeRound === 4 && gameState.activeQuestionId === img.id && (
                            <select 
                              className="form-input" 
                              style={{ padding: '4px', fontSize: '0.7rem', marginTop: '4px' }}
                              value={gameState.zoomLevel}
                              onChange={(e) => handleUpdateGameState(4, img.id, gameState.timerDuration, parseInt(e.target.value))}
                            >
                              <option value={10}>10% Zoom (Hard)</option>
                              <option value={25}>25% Zoom</option>
                              <option value={50}>50% Zoom</option>
                              <option value={75}>75% Zoom</option>
                              <option value={100}>100% Zoom (Full)</option>
                            </select>
                          )}
                        </div>
                      </div>
                    ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* TAB 2: MEDIA MANAGER */}
        {activeTab === 'media' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1fr 1.5fr', gap: '32px' }}>
            {/* Upload Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Upload Game Image</h3>
              
              {uploadStatus.success && <div style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid var(--color-cyan)', color: 'var(--color-cyan)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{uploadStatus.success}</div>}
              {uploadStatus.error && <div style={{ background: 'rgba(255,20,147,0.1)', border: '1px solid #ff1493', color: '#ff5c93', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{uploadStatus.error}</div>}

              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label className="form-label">Target Round</label>
                  <select name="roundNumber" className="form-input" value={uploadData.roundNumber} onChange={handleUploadChange}>
                    <option value={1}>Round 1 - Pixel Detective</option>
                    <option value={2}>Round 2 - The Glitch Hunt</option>
                    <option value={3}>Round 3 - Prompt Wars</option>
                    <option value={4}>Round 4 - Tie-Breaker</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Image File</label>
                  <input ref={fileInputRef} type="file" name="file" className="form-input" required accept="image/*" onChange={handleUploadChange} />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="isAi" checked={uploadData.isAi} onChange={handleUploadChange} style={{ transform: 'scale(1.2)' }} />
                    <span style={{ fontSize: '0.9rem' }}>AI Generated Visual</span>
                  </label>
                  
                  {uploadData.roundNumber === 2 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" name="isLightning" checked={uploadData.isLightning} onChange={handleUploadChange} style={{ transform: 'scale(1.2)' }} />
                      <span style={{ fontSize: '0.9rem', color: '#ff1493' }}>Lightning Round</span>
                    </label>
                  )}
                </div>

                {uploadData.isAi && (
                  <div className="form-group">
                    <label className="form-label">Which AI Model?</label>
                    <select name="modelUsed" className="form-input" value={uploadData.modelUsed} onChange={handleUploadChange}>
                      <option value="">-- Select Model --</option>
                      <option value="Midjourney">Midjourney</option>
                      <option value="DALL-E 3">DALL-E 3</option>
                      <option value="Stable Diffusion">Stable Diffusion</option>
                      <option value="Adobe Firefly">Adobe Firefly</option>
                      <option value="Flux">Flux</option>
                      <option value="Claude">Claude</option>
                      <option value="Gemini">Gemini</option>
                      <option value="ChatGPT">ChatGPT</option>
                    </select>
                  </div>
                )}

                {/* Descriptive answers fields based on target round */}
                {uploadData.roundNumber === 2 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Identify Inconsistencies (Answer details to match/grade)</label>
                      <textarea name="answerDetails" rows={3} className="form-input" value={uploadData.answerDetails} onChange={handleUploadChange} placeholder="e.g., Distorted fingers, incorrect mirror reflection, shadow angles disagree" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Glitch Coordinates (Optional X,Y,Radius description)</label>
                      <input type="text" name="glitchCoordinates" className="form-input" value={uploadData.glitchCoordinates} onChange={handleUploadChange} placeholder="e.g. 240, 180, 20" />
                    </div>
                  </>
                )}

                {uploadData.roundNumber === 3 && (
                  <div className="form-group">
                    <label className="form-label">Original Generation Prompt / Justification Details</label>
                    <textarea name="answerDetails" rows={3} className="form-input" value={uploadData.answerDetails} onChange={handleUploadChange} placeholder="Describe the original prompt or the deepfake cues that make it real/AI." />
                  </div>
                )}

                {uploadData.roundNumber === 4 && (
                  <div className="form-group">
                    <label className="form-label">Correct Name/Object in Image (For Auto-score matching)</label>
                    <input type="text" name="answerDetails" className="form-input" value={uploadData.answerDetails} onChange={handleUploadChange} placeholder="e.g., Eiffel Tower" />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>Upload Image Metadata</button>
              </form>
            </div>

            {/* List & Manage Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>All Uploads Directory</h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                {[1, 2, 3, 4].map(roundNum => {
                  const roundImgs = images.filter(img => img.roundNumber === roundNum)
                  return (
                    <div key={roundNum} style={{ borderBottom: '1px solid rgba(255,255,255,0.04)', paddingBottom: '16px' }}>
                      <h4 style={{ fontSize: '1rem', color: 'var(--color-cyan)', marginBottom: '8px' }}>Round {roundNum} Uploads ({roundImgs.length})</h4>
                      {roundImgs.length === 0 ? (
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No uploads</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(80px, 1fr))', gap: '8px' }}>
                          {roundImgs.map(img => (
                            <div key={img.id} style={{ position: 'relative', width: '80px', height: '80px', borderRadius: '6px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={`http://localhost:8080${img.imageUrl}`} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button 
                                onClick={() => handleDeleteImage(img.id)}
                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(255,20,147,0.85)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
                              >
                                &times;
                              </button>
                            </div>
                          ))}
                        </div>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          </div>
        )}

        {/* TAB 3: GRADING PANEL */}
        {activeTab === 'grading' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Ungraded Submissions (Round {gameState.activeRound})</h3>
            
            {gradingStatus && <div style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid var(--color-cyan)', color: 'var(--color-cyan)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{gradingStatus}</div>}
            
            {submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No pending submissions for grading in the current active round.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {submissions.map((sub) => (
                  <div key={sub.id} className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '150px 1fr 200px', gap: '20px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      <img 
                        src={`http://localhost:8080${sub.imageQuestion.imageUrl}`} 
                        alt="question" 
                        style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                      />
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>Q-ID: {sub.imageQuestion.id}</div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-cyan)', marginBottom: '8px' }}>
                        Team: {sub.user.teamName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Team Submission:</span>
                          <p style={{ marginTop: '4px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{sub.textSubmission || sub.chosenAnswer || 'No text entry'}</p>
                        </div>
                        <div style={{ background: 'rgba(0,210,255,0.02)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(0,210,255,0.08)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--color-cyan)', textTransform: 'uppercase' }}>Expected Answer/Key Details:</span>
                          <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-white)' }}>{sub.imageQuestion.answerDetails || 'None specified'}</p>
                        </div>
                      </div>
                    </div>

                    <div>
                      <div className="form-group" style={{ marginBottom: '12px' }}>
                        <label className="form-label">Award Score Points</label>
                        <input 
                          type="number" 
                          className="form-input" 
                          min={0}
                          max={30}
                          placeholder="e.g. 10" 
                          value={gradeScores[sub.id] || ''}
                          onChange={(e) => setGradeScores({ ...gradeScores, [sub.id]: e.target.value })}
                        />
                      </div>
                      <button 
                        onClick={() => handleGradeSubmit(sub.id)}
                        className="btn-primary" 
                        style={{ width: '100%', padding: '8px' }}
                      >
                        Submit Score
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* TAB 4: LEADERBOARD & ADVANCEMENT */}
        {activeTab === 'leaderboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: '1.5fr 1fr', gap: '32px' }}>
            {/* Live Standing Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Live Leaderboard Standings</h3>
              
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No teams registered yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Rank</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Team Name</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'center' }}>Total Score</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'center' }}>State</th>
                    </tr>
                  </thead>
                  <tbody>
                    {leaderboard.map((team, idx) => (
                      <tr 
                        key={team.id} 
                        style={{ 
                          borderBottom: '1px solid rgba(255,255,255,0.04)',
                          background: team.isEliminated ? 'rgba(255,20,147,0.01)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px' }}>
                          <div>{team.teamName}</div>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>{team.memberName} (ID: {team.id})</span>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '1.1rem', fontWeight: 'bold', color: 'var(--color-cyan)' }}>{team.score}</td>
                        <td style={{ padding: '14px 8px', textAlign: 'center' }}>
                          {team.isEliminated ? (
                            <span className="badge badge-eliminated">Eliminated</span>
                          ) : (
                            <span className="badge badge-active">Active</span>
                          )}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              )}
            </div>

            {/* Advancement Controls */}
            <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>Round Advancement Rules</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px' }}>
                Use these buttons to complete the current round. The platform will sort the teams by score, disqualify the lowest scoring teams, and transition the active round state.
              </p>

              {advancementStatus && (
                <div style={{ background: 'rgba(0,210,255,0.08)', border: '1px solid var(--color-cyan)', color: 'var(--color-cyan)', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                  {advancementStatus}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Round 1 Cutoff</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Qualifies the <strong>Top 50%</strong> of active teams for Glitch Hunt. Resolves ties at the cutoff.</p>
                  <button 
                    onClick={() => handleAdvanceTeams(50, true)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                    disabled={gameState.activeRound !== 1}
                  >
                    Advance Top 50%
                  </button>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '8px' }}>Round 2 Cutoff</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Qualifies the <strong>Top 10</strong> teams for the Grand Finale Prompt Wars.</p>
                  <button 
                    onClick={() => handleAdvanceTeams(10, false)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                    disabled={gameState.activeRound !== 2}
                  >
                    Advance Top 10 Teams
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}
      </main>
    </div>
  )
}
