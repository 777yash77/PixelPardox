'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

export default function GameArena() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [team, setTeam] = useState({
    teamName: '',
    leaderEmail: '',
    memberName: '',
    score: 0,
    roundNumber: 1,
    isEliminated: false
  })

  const [gameState, setGameState] = useState({
    activeRound: 0,
    activeQuestionId: null,
    timerDuration: 0,
    questionStartTime: 0,
    timerRunning: false,
    zoomLevel: 100
  })

  // All questions cached locally to match by activeQuestionId
  const [questions, setQuestions] = useState([])
  const [currentQuestion, setCurrentQuestion] = useState(null)

  // Team Inputs
  const [round1Answer, setRound1Answer] = useState({ chosen: '', bonus: '' })
  const [textSubmission, setTextSubmission] = useState('')
  const [submitted, setSubmitted] = useState(false)
  const [submitError, setSubmitError] = useState('')
  
  // Timer countdown
  const [timeLeft, setTimeLeft] = useState(0)

  // Leaderboard
  const [leaderboard, setLeaderboard] = useState([])

  // Clock Skew Fix & Flow Control
  const [localEndTime, setLocalEndTime] = useState(0)
  const [showModelSelect, setShowModelSelect] = useState(false)

  // WebSocket Ref
  const wsRef = useRef(null)

  // 1. Authenticate & Initialize
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
      return
    }
    setToken(storedToken)
    
    // Fetch initial data
    fetchTeamProfile(storedToken)
    fetchGameState()
    fetchQuestions(storedToken)
    fetchLeaderboard()
  }, [])

  // 2. Sync active question details when activeQuestionId changes
  useEffect(() => {
    if (gameState.activeQuestionId) {
      const q = questions.find(item => item.id === gameState.activeQuestionId)
      if (q) {
        setCurrentQuestion(q)
        setSubmitted(false) // reset submission flag for new question
        setSubmitError('')
        setRound1Answer({ chosen: '', bonus: '' })
        setTextSubmission('')
        setShowModelSelect(false)
      } else if (token) {
        // If the question isn't in our local state, it may have been uploaded after we mounted. Refetch!
        setSubmitted(false)
        fetchQuestions(token)
      }
    } else {
      setCurrentQuestion(null)
      setShowModelSelect(false)
    }
  }, [gameState.activeQuestionId, questions, token])

  // 3. Countdown timer logic (Clock Skew Resilient)
  useEffect(() => {
    if (gameState.timerRunning && gameState.timerDuration > 0 && gameState.activeQuestionId) {
      setLocalEndTime(Date.now() + (gameState.timerDuration * 1000))
    }
  }, [gameState.timerRunning, gameState.timerDuration, gameState.activeQuestionId])

  useEffect(() => {
    let interval
    if (gameState.timerRunning && localEndTime > 0) {
      interval = setInterval(() => {
        const remaining = Math.floor((localEndTime - Date.now()) / 1000)
        
        if (remaining <= 0) {
          setTimeLeft(0)
          clearInterval(interval)
          // Auto submit answer if timer runs out and not submitted yet
          if (!submitted && gameState.activeQuestionId) {
            triggerAutoSubmit()
          }
        } else {
          setTimeLeft(remaining)
        }
      }, 250)
    } else {
      setTimeLeft(0)
    }
    return () => clearInterval(interval)
  }, [gameState.timerRunning, localEndTime, submitted, gameState.activeQuestionId])

  // 4. HTTP API calls
  const fetchTeamProfile = async (tok) => {
    try {
      // Find team details in leaderboard
      const res = await fetch('http://localhost:8080/api/game/leaderboard')
      if (res.ok) {
        const data = await res.json()
        const email = localStorage.getItem('email')
        const profile = data.find(u => u.leaderEmail === email)
        if (profile) {
          setTeam(profile)
        }
      }
    } catch (e) {
      console.error(e)
    }
  }

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

  const fetchQuestions = async (tok) => {
    try {
      // Admins are restricted, but teams can pull loaded image metadata to display questions locally
      const res = await fetch('http://localhost:8080/api/game/images', {
        headers: { 'Authorization': `Bearer ${tok || token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuestions(data)
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

  // 5. Native WebSocket implementation
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout = null;

    const setupWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/ws')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Team connected to Game WebSockets')
      }

      ws.onmessage = (event) => {
        const message = JSON.parse(event.data)
        console.log('Team WS Message received:', message)

        if (message.type === 'GAME_STATE') {
          setGameState(message.payload)
          // Refresh team profile state to update score / elimination state
          fetchTeamProfile(token)
        } else if (message.type === 'SCORES_UPDATED') {
          // Leaderboard data arrives directly in the payload
          if (Array.isArray(message.payload)) {
            setLeaderboard(message.payload)
            // Update team profile from leaderboard data
            const email = localStorage.getItem('email')
            const profile = message.payload.find(u => u.leaderEmail === email)
            if (profile) {
              setTeam(profile)
            }
          } else {
            // Fallback: fetch via HTTP if payload is not an array
            fetchLeaderboard()
            fetchTeamProfile(token)
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

    if (token) {
      setupWebSocket()
    }

    return () => {
      isMounted = false
      if (reconnectTimeout) clearTimeout(reconnectTimeout)
      if (wsRef.current) wsRef.current.close()
    }
  }, [token])

  // 6. Submissions
  const handleSubmitAnswer = async (e) => {
    if (e) e.preventDefault()
    if (submitted) return

    setSubmitError('')
    const payload = {
      questionId: gameState.activeQuestionId,
      chosenAnswer: gameState.activeRound === 1 ? round1Answer.chosen : '',
      bonusAnswer: gameState.activeRound === 1 ? round1Answer.bonus : '',
      textSubmission: gameState.activeRound === 1 ? '' : textSubmission
    }

    try {
      const res = await fetch('http://localhost:8080/api/game/submit', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setSubmitted(true)
        fetchTeamProfile(token)
      } else {
        const text = await res.text()
        try {
          const data = JSON.parse(text)
          setSubmitError(data.message || 'Submission failed.')
        } catch (parseErr) {
          setSubmitError(`Server Error (${res.status}): ${text.substring(0, 60)}...`)
        }
      }
    } catch (err) {
      setSubmitError(`Network/Fetch Error: ${err.message}`)
    }
  }

  const triggerAutoSubmit = () => {
    // If Round 1, submit whatever choice they clicked
    if (gameState.activeRound === 1 && round1Answer.chosen) {
      handleSubmitAnswer()
    } else if (gameState.activeRound > 1 && textSubmission.trim()) {
      handleSubmitAnswer()
    } else {
      setSubmitted(true) // lock controls and display timeout
    }
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  return (
    <div className="page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      {/* Top Banner */}
      <nav className="glass-panel" style={{ margin: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: '#00d2ff', fontWeight: 600 }}>Pixel Paradox</span>
          <h2 style={{ fontSize: '1.2rem', marginTop: '2px' }} className="cyan-gradient-text">Team: {team.teamName}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Score:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-cyan)' }}>{team.score} Points</div>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>Logout</button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', paddingBottom: '60px' }}>
        
        {/* ELIMINATED VIEW */}
        {team.isEliminated ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px', border: '1px solid #ff1493' }}>
            <span className="badge badge-eliminated" style={{ padding: '8px 16px', fontSize: '0.9rem', marginBottom: '16px' }}>Eliminated</span>
            <h2 style={{ fontSize: '2rem', marginBottom: '12px' }}>Game Over for Team</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Your team has been eliminated in the qualification round. You can continue spectating the remaining rounds on the projector display.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px' }}>Current Standings</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {leaderboard.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span>{i + 1}. {u.teamName}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-cyan)' }}>{u.score} pts</span>
                  </div>
                ))}
              </div>
            </div>
          </div>
        ) : (
          /* GAME STATE VIEWS */
          <div style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
            
            {/* ROUND 0: WAITING IN LOBBY */}
            {gameState.activeRound === 0 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(0,210,255,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-cyan)' }} />
                </div>
                <h2 style={{ fontSize: '1.75rem', marginBottom: '12px' }}>Waiting Room</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Registration is complete. Please wait for the event coordinators to initiate the rounds. The screen will synchronize automatically when the game begins.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div style={{ fontWeight: '600', color: 'var(--color-cyan)', marginTop: '4px' }}>Awaiting Host Command...</div>
                </div>
              </div>
            )}

            {/* LIVE QUESTIONS */}
            {gameState.activeRound > 0 && gameState.activeRound < 5 && (
              <div>
                {/* No Active Question state */}
                {!gameState.activeQuestionId ? (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>Round {gameState.activeRound}</h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Get ready! Waiting for the organizers to launch the next image question...
                    </p>
                  </div>
                ) : (
                  /* Question Display & Submission Panels */
                  <div style={{ marginTop: '20px' }}>
                    
                    {/* Header: Timer & Round info */}
                    <div className="glass-panel" style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderColor: timeLeft < 5 ? '#ff1493' : 'var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase' }}>Current Stage</span>
                        <h3 style={{ fontSize: '1.1rem' }}>
                          {gameState.activeRound === 1 && 'Round 1: Pixel Detective'}
                          {gameState.activeRound === 2 && 'Round 2: The Glitch Hunt'}
                          {gameState.activeRound === 3 && 'Round 3: Prompt Wars'}
                          {gameState.activeRound === 4 && 'Round 4: Tie-Breaker'}
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Remaining:</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: timeLeft < 5 ? '#ff1493' : '#fff' }} className={timeLeft < 5 && timeLeft > 0 ? 'blink' : ''}>
                          {timeLeft > 0 ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}` : '00:00'}
                        </div>
                      </div>
                    </div>

                    {/* Image Area */}
                    {currentQuestion && (
                      <div className="flex-center" style={{ marginBottom: '24px' }}>
                        {gameState.activeRound === 4 ? (
                          /* TIE BREAKER CSS ZOOM */
                          <div style={{ width: '100%', maxWidth: '500px', height: '350px', overflow: 'hidden', position: 'relative', borderRadius: '12px', border: '1px solid rgba(255,255,255,0.1)' }}>
                            <img 
                              src={`http://localhost:8080${currentQuestion.imageUrl}`} 
                              alt="zoomed" 
                              style={{ 
                                width: '100%', 
                                height: '100%', 
                                objectFit: 'cover', 
                                transform: `scale(${100 / (gameState.zoomLevel || 10)})`,
                                transformOrigin: 'center',
                                transition: 'transform 0.5s ease'
                              }} 
                            />
                          </div>
                        ) : (
                          /* STANDARD IMAGE VIEW */
                          <div style={{ width: '100%', maxWidth: '600px', borderRadius: '12px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)', boxShadow: '0 8px 24px rgba(0,0,0,0.5)' }}>
                            <img 
                              src={`http://localhost:8080${currentQuestion.imageUrl}`} 
                              alt="quiz visual" 
                              style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '400px', objectFit: 'contain', background: '#000' }}
                            />
                          </div>
                        )}
                      </div>
                    )}

                    {/* SUBMITTED WAITING SCREEN */}
                    {submitted ? (
                      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                        <div style={{ color: 'var(--color-cyan)', fontSize: '3rem', marginBottom: '12px' }}>✓</div>
                        <h3>Response Locked In</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginTop: '8px' }}>
                          Your answer has been submitted successfully. Please wait for the current question timer to expire or for the organizers to launch the next image.
                        </p>
                      </div>
                    ) : (
                      /* ACTIVE SUBMISSION FORM */
                      <div className="glass-panel" style={{ padding: '32px' }}>
                        {submitError && (
                          <div style={{ background: 'rgba(255,20,147,0.1)', border: '1px solid #ff1493', color: '#ff5c93', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                            {submitError}
                          </div>
                        )}

                        <form onSubmit={handleSubmitAnswer}>
                          {/* ROUND 1 FORM */}
                          {gameState.activeRound === 1 && (
                            <div>
                              <h4 style={{ fontSize: '1rem', marginBottom: '16px', color: '#fff' }}>Is this photograph Real or AI-Generated?</h4>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <button
                                  type="button"
                                  className={round1Answer.chosen === 'REAL' ? 'btn-primary' : 'btn-secondary'}
                                  onClick={() => setRound1Answer({ ...round1Answer, chosen: 'REAL' })}
                                  style={{ padding: '16px 20px', fontSize: '1.1rem' }}
                                >
                                  📷 Authentic Photo
                                </button>
                                <button
                                  type="button"
                                  className={round1Answer.chosen === 'AI' ? 'btn-primary' : 'btn-secondary'}
                                  onClick={() => {
                                    setRound1Answer({ ...round1Answer, chosen: 'AI' })
                                    setShowModelSelect(true)
                                  }}
                                  style={{ padding: '16px 20px', fontSize: '1.1rem' }}
                                >
                                  🤖 AI Generated
                                </button>
                              </div>

                              {/* Bonus Model Guess */}
                              {round1Answer.chosen === 'AI' && showModelSelect && (
                                <div className="form-group" style={{ animation: 'fadeIn 0.3s ease-out' }}>
                                  <label className="form-label">{currentQuestion?.bonusQuestion || 'Which AI Model was used to generate this image?'}</label>
                                  <select 
                                    className="form-input"
                                    value={round1Answer.bonus}
                                    onChange={(e) => setRound1Answer({ ...round1Answer, bonus: e.target.value })}
                                  >
                                    <option value="">-- Choose AI Model --</option>
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
                            </div>
                          )}

                          {/* ROUND 2 FORM */}
                          {gameState.activeRound === 2 && (
                            <div className="form-group">
                              <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '12px' }}>
                                Glitch Hunt: Identify the hidden AI artifacts or digital anomalies you see.
                              </h4>
                              {currentQuestion?.isLightning && (
                                <p style={{ color: '#ff1493', fontSize: '0.8rem', fontWeight: 'bold', marginBottom: '12px' }}>
                                  ⚡ SURPRISE LIGHTNING IMAGE: Submit quickly for extra bonus points!
                                </p>
                              )}
                              <textarea
                                className="form-input"
                                rows={4}
                                required
                                value={textSubmission}
                                onChange={(e) => setTextSubmission(e.target.value)}
                                placeholder="Describe anomalous reflections, bad shadows, extra fingers, text warping, etc..."
                              />
                            </div>
                          )}

                          {/* ROUND 3 FORM */}
                          {gameState.activeRound === 3 && (
                            <div className="form-group">
                              <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '12px' }}>
                                Prompt Wars / Deepfake Challenge
                              </h4>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '12px' }}>
                                Deduce the generation prompt (for Reverse Prompting) or evaluate authenticity cues with technical justification (for Deepfake Showdown).
                              </p>
                              <textarea
                                className="form-input"
                                rows={4}
                                required
                                value={textSubmission}
                                onChange={(e) => setTextSubmission(e.target.value)}
                                placeholder="Write the prompt phrase or the technical justification details here..."
                              />
                            </div>
                          )}

                          {/* ROUND 4 FORM (TIE BREAKER) */}
                          {gameState.activeRound === 4 && (
                            <div className="form-group">
                              <h4 style={{ fontSize: '1.05rem', color: '#fff', marginBottom: '12px' }}>
                                One Pixel Remaining: Guess the name of the complete image.
                              </h4>
                              <input
                                type="text"
                                className="form-input"
                                required
                                value={textSubmission}
                                onChange={(e) => setTextSubmission(e.target.value)}
                                placeholder="Enter your guess (e.g. Eiffel Tower, Golden Gate Bridge, Tiger)"
                              />
                            </div>
                          )}

                          <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '16px' }}
                            disabled={gameState.activeRound === 1 && !round1Answer.chosen}
                          >
                            Lock In Answer &rarr;
                          </button>
                        </form>
                      </div>
                    )}
                  </div>
                )}
              </div>
            )}

            {/* ROUND 5: GAME COMPLETED */}
            {gameState.activeRound === 5 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <h1 className="cyan-gradient-text" style={{ fontSize: '2.5rem', marginBottom: '8px' }}>Event Completed!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  The Pixel Paradox: AI or Reality challenge has ended. Thank you for participating!
                </p>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px' }}>Final Scoreboard Standing</h3>
                <div className="glass-panel" style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  {leaderboard.map((u, i) => (
                    <div 
                      key={u.id} 
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '12px 8px', 
                        borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: u.leaderEmail === team.leaderEmail ? 'rgba(0,210,255,0.05)' : 'transparent',
                        fontWeight: u.leaderEmail === team.leaderEmail ? 'bold' : 'normal'
                      }}
                    >
                      <span>{i + 1}. {u.teamName} {u.leaderEmail === team.leaderEmail && ' (You)'}</span>
                      <span style={{ color: 'var(--color-cyan)' }}>{u.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROUND 6: EVALUATING RESULTS */}
            {gameState.activeRound === 6 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(123, 47, 247, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#7b2ff7' }} />
                </div>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff' }}>Evaluating Results...</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  The organizers are currently reviewing submissions and grading the recent round.
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div style={{ fontWeight: '600', color: '#7b2ff7', marginTop: '4px' }}>Results will be announced shortly. Please stand by.</div>
                </div>
              </div>
            )}

            {/* ROUND 7: BREAK TIME */}
            {gameState.activeRound === 7 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div style={{ fontSize: '4rem', marginBottom: '16px' }}>☕</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff' }}>Break Time</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  The event is currently paused for a short break. Feel free to stretch your legs and grab some refreshments!
                </p>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', display: 'inline-block' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div style={{ fontWeight: '600', color: '#00d2ff', marginTop: '4px' }}>Event is paused. We will resume shortly.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
