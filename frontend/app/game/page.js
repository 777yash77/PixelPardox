'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPIDEY_GAME_QUOTES = [
  "🕸️ 'Take a deep breath, web-slinger! Optical physics is on your side!'",
  "🕷️ 'Stage 0 has 30 questions in 30m. Quality over speed!'",
  "⚡ 'In Round 1, check pupil reflections and light sources!'",
  "🎯 'Need a hint? Click [Ask Spidey for a Clue] anytime!'",
  "🛡️ 'Believe in your preparation! Great teams stay calm under pressure!'"
]

const DEADPOOL_GAME_QUOTES = [
  "🌮 'Maximum Effort! Show these AI neural nets who's boss!'",
  "⚔️ 'One bad guess is -5 points. Click with your brain, not your elbow!'",
  "💥 'Stuck on a tricky image? Ask your boy Wade for a clue!'",
  "🕶️ 'You guys are gonna win this thing! Just don't panic!'",
  "🍕 'Fuel up on chimichangas and trust your instincts!'"
]

export default function GameArena() {
  const router = useRouter()
  const [token, setToken] = useState('')
  const [team, setTeam] = useState({
    teamName: '',
    teamId: '',
    score: 0,
    roundNumber: 1,
    isEliminated: false,
    id: null
  })
  const [participantName, setParticipantName] = useState('')

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

  const [localEndTime, setLocalEndTime] = useState(0)
  const [showModelSelect, setShowModelSelect] = useState(false)

  // Prelims State
  const [prelimQuestions, setPrelimQuestions] = useState([])
  const [prelimAnswers, setPrelimAnswers] = useState({})
  const [prelimStatus, setPrelimStatus] = useState('NOT_STARTED')
  const [prelimTimeLeft, setPrelimTimeLeft] = useState(30 * 60)

  // Webcam Ref
  const videoRef = useRef(null)
  const canvasRef = useRef(null)

  // WebSocket Ref
  const wsRef = useRef(null)

  // Superhero Clues & Arena Companion State
  const [activeClue, setActiveClue] = useState(null)
  const [isDeadpoolChatOpen, setIsDeadpoolChatOpen] = useState(false)
  const [isSpideyChatOpen, setIsSpideyChatOpen] = useState(false)
  const [spideyQuoteIdx, setSpideyQuoteIdx] = useState(0)
  const [deadpoolQuoteIdx, setDeadpoolQuoteIdx] = useState(0)
  const [isDeadpoolTyping, setIsDeadpoolTyping] = useState(false)
  const [isSpideyTyping, setIsSpideyTyping] = useState(false)
  const [deadpoolInput, setDeadpoolInput] = useState('')
  const [spideyInput, setSpideyInput] = useState('')
  const deadpoolChatBottomRef = useRef(null)
  const spideyChatBottomRef = useRef(null)

  const [deadpoolMessages, setDeadpoolMessages] = useState([
    {
      sender: 'deadpool',
      text: "Yo candidate! I'm in your game arena! Need a clue for the current round? Hit 'Ask Deadpool for a Clue' or click me! Maximum Effort!"
    }
  ])
  const [spideyMessages, setSpideyMessages] = useState([
    {
      sender: 'spidey',
      text: "Spider-Man checking in! I'm here to provide scientific forensic guidance and help your squad keep your cool. Click 'Ask Spidey for a Clue' anytime!"
    }
  ])

  // MediaRecorder Ref for silent recording
  const mediaRecorderRef = useRef(null)

  // Silent webcam recording logic
  useEffect(() => {
    if (prelimStatus === 'IN_PROGRESS' && videoRef.current && videoRef.current.srcObject) {
      try {
        const stream = videoRef.current.srcObject;
        let recorder;
        try {
          recorder = new MediaRecorder(stream, { mimeType: 'video/webm' });
        } catch (e) {
          recorder = new MediaRecorder(stream);
        }
        
        mediaRecorderRef.current = recorder;
        const chunks = [];
        recorder.ondataavailable = e => {
          if (e.data && e.data.size > 0) chunks.push(e.data);
        };
        recorder.onstop = async () => {
          const blob = new Blob(chunks, { type: 'video/webm' });
          const formData = new FormData();
          formData.append('file', blob, 'webcam.webm');
          formData.append('participantName', participantName || 'Unknown');
          try {
            await fetch('http://localhost:8080/api/game/prelims/video', {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
          } catch(err) {
            console.error("Failed to upload recording", err);
          }
        };

        // Start recording
        recorder.start(1000);
        // Stop after 60 seconds
        setTimeout(() => {
          if (recorder.state !== 'inactive') {
            recorder.stop();
          }
        }, 60000);
      } catch (err) {
        console.error("Error starting recording:", err);
      }
    }
  }, [prelimStatus, token, participantName])

  // 1. Authenticate & Initialize
  useEffect(() => {
    const storedToken = localStorage.getItem('token')
    if (!storedToken) {
      router.push('/login')
      return
    }
    setToken(storedToken)
    const storedParticipant = localStorage.getItem('participantName') || 'Unknown'
    setParticipantName(storedParticipant)
    
    // Fetch initial data
    fetchTeamProfile(storedToken)
    fetchGameState()
    fetchQuestions(storedToken)
    fetchPrelimQuestions(storedToken)
    fetchLeaderboard()

    // Start Webcam
    startWebcam()
  }, [])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Webcam access denied:", err)
    }
  }

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

  // Prelims timer
  useEffect(() => {
    let interval
    if (gameState.activeRound === 1 && prelimStatus === 'IN_PROGRESS' && prelimTimeLeft > 0) {
      interval = setInterval(() => setPrelimTimeLeft(t => t - 1), 1000)
    } else if (prelimTimeLeft <= 0 && prelimStatus === 'IN_PROGRESS') {
      handlePrelimSubmit()
    }
    return () => clearInterval(interval)
  }, [gameState.activeRound, prelimStatus, prelimTimeLeft])

  // Camera broadcasting
  useEffect(() => {
    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && team.id) {
        const context = canvasRef.current.getContext('2d')
        context.drawImage(videoRef.current, 0, 0, 160, 120) // low res
        const frame = canvasRef.current.toDataURL('image/jpeg', 0.5)
        wsRef.current.send(JSON.stringify({
          type: 'CAMERA_FRAME',
          payload: { teamId: team.id, participantName, frame }
        }))
      }
    }, 5000) // every 5 seconds
    return () => clearInterval(interval)
  }, [team.id, participantName])

  // 4. HTTP API calls
  const fetchTeamProfile = async (tok) => {
    try {
      // Find team details in leaderboard
      const res = await fetch('http://localhost:8080/api/game/leaderboard')
      if (res.ok) {
        const data = await res.json()
        const teamId = localStorage.getItem('teamId')
        const profile = data.find(u => u.teamId === teamId)
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

  const fetchPrelimQuestions = async (tok) => {
    try {
      const res = await fetch('http://localhost:8080/api/game/prelims/questions', {
        headers: { 'Authorization': `Bearer ${tok || token}` }
      })
      if (res.ok) {
        const data = await res.json()
        setPrelimQuestions(data)
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
            const teamId = localStorage.getItem('teamId')
            const profile = message.payload.find(u => u.teamId === teamId)
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
    const isRound1 = gameState.activeRound === 2 || gameState.activeRound === 1
    const payload = {
      questionId: gameState.activeQuestionId,
      chosenAnswer: isRound1 ? round1Answer.chosen : '',
      bonusAnswer: isRound1 ? round1Answer.bonus : '',
      textSubmission: isRound1 ? '' : textSubmission
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
    const isRound1 = gameState.activeRound === 2 || gameState.activeRound === 1
    if (isRound1 && round1Answer.chosen) {
      handleSubmitAnswer()
    } else if (gameState.activeRound > 2 && textSubmission.trim()) {
      handleSubmitAnswer()
    } else {
      setSubmitted(true) // lock controls and display timeout
    }
  }

  const handlePrelimStart = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/game/prelims/start', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantName })
      })
      if (res.ok) {
        const attempt = await res.json()
        const startEpoch = attempt.startedAt || Date.now()
        localStorage.setItem('prelimStartTime_' + participantName, startEpoch.toString())
        const elapsed = Math.floor((Date.now() - startEpoch) / 1000)
        setPrelimTimeLeft(Math.max(0, 1800 - elapsed))
        setPrelimStatus('IN_PROGRESS')
      } else {
        const data = await res.json()
        if (data.message === 'Quiz already submitted' || data.message?.includes('COMPLETED')) {
           setPrelimStatus('COMPLETED')
        }
      }
    } catch (err) {
      console.error(err)
    }
  }

  const handlePrelimSubmit = async () => {
    try {
      const res = await fetch('http://localhost:8080/api/game/prelims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantName, answers: prelimAnswers })
      })
      if (res.ok) {
        setPrelimStatus('COMPLETED')
        localStorage.removeItem('prelimStartTime_' + participantName)
        fetchTeamProfile(token)
      }
    } catch (err) {
      console.error(err)
    }
  }

  // Auto-scroll chat windows in Arena
  useEffect(() => {
    if (isDeadpoolChatOpen) {
      deadpoolChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [deadpoolMessages, isDeadpoolChatOpen, isDeadpoolTyping])

  useEffect(() => {
    if (isSpideyChatOpen) {
      spideyChatBottomRef.current?.scrollIntoView({ behavior: 'smooth' })
    }
  }, [spideyMessages, isSpideyChatOpen, isSpideyTyping])

  // Periodic quote rotation
  useEffect(() => {
    const spideyTimer = setInterval(() => {
      setSpideyQuoteIdx(prev => (prev + 1) % SPIDEY_GAME_QUOTES.length)
    }, 6000)
    const deadpoolTimer = setInterval(() => {
      setDeadpoolQuoteIdx(prev => (prev + 1) % DEADPOOL_GAME_QUOTES.length)
    }, 7000)
    return () => {
      clearInterval(spideyTimer)
      clearInterval(deadpoolTimer)
    }
  }, [])

  // Reveal In-Game Clue
  const handleGetClue = (hero) => {
    let title = ''
    let text = ''

    if (gameState.activeRound === 1) { // Stage 0 Quiz
      if (hero === 'spidey') {
        title = "Spider-Man's Scientific Quiz Intel (Stage 0)"
        text = "🕸️ Peter Parker's Strategy:\n• Focus on AI fundamentals: Transformers use self-attention mechanisms; Diffusion models denoise step-by-step from Gaussian noise; GANs rely on an adversarial min-max objective.\n• Negative Marking Defense: Correct is +10, but Wrong is -5! Rule out two impossible answers first. If you still have no clue, leaving it blank (0 pts) protects your team average!"
      } else {
        title = "Deadpool's Chaos Clue (Stage 0 Quiz)"
        text = "🌮 Wade's Survival Protocol:\n• Pro tip: If an option has super specific technical jargon and is longer than the others, that's usually the right one! Professors get lazy writing fake distractors!\n• Don't guess wildly! One wrong click deletes half a correct answer. Maximum Effort, trust your preparation!"
      }
    } else if (gameState.activeRound === 2) { // Stage 1 Pixel Detective
      if (hero === 'spidey') {
        title = "Spider-Man's Optical Forensics (Round 1)"
        text = "🕸️ Peter Parker's Optical Breakdown (40s):\n• Lighting Coherence: Real camera flashes create sharp, unified specular dots in both pupils. AI frequently renders mismatched iris reflections.\n• Model Tells:\n  - Midjourney v6: High cinematic contrast, warm rim lighting, glossy skin.\n  - Flux: Hyper-detailed skin pores and fabric weaves, but background text is often slightly warped.\n  - DALL-E 3: Smooth, illustrative color blending.\n• Lock in the model for the full 10 points!"
      } else {
        title = "Deadpool's Visual Scan (Round 1)"
        text = "🌮 Wade's Anomaly Test:\n• Zoom in on the ears, teeth, and jewelry! Does a necklace disappear behind an earlobe? Do the teeth look like a single white picket fence? If YES, hit AI and pick the generator before the 40s timer buzzes!\n• If it looks like a grainy candid phone picture with bad lighting, it's 100% REAL. Maximum Effort!"
      }
    } else if (gameState.activeRound === 3) { // Stage 2 The Glitch Hunt
      if (hero === 'spidey') {
        title = "Spider-Man's Forensic Glitch Scan (Round 2)"
        text = "🕸️ Peter Parker's Glitch Analysis (45s):\n• Look for geometric violations: Sunglasses temples that don't rest on ears, clothing seams that change texture halfway, or contradictory shadow directions.\n• Writing Strategy: When typing your submission, be concise and specific (e.g., 'Unnatural hand geometry with inconsistent knuckle count' or 'Shadow angle directly opposes primary light source')."
      } else {
        title = "Deadpool's Glitch Hunter (Round 2)"
        text = "🌮 Wade's Glitch Radar:\n• Scan the background! AI loves to hide weird glitches where it thinks nobody is looking—extra fingers, melted car wheels, or floating street lamps.\n• Type the glitch out clearly and submit before the 45 seconds run out!"
      }
    } else if (gameState.activeRound === 4) { // Stage 3 Prompt Wars
      if (hero === 'spidey') {
        title = "Spider-Man's Prompt Reconstruction (Round 3)"
        text = "🕸️ Peter Parker's Reverse Prompting (75s):\n• Progressive Zoom deduction: Notice whether the texture is an Octane 3D render, photographic film (Kodak 35mm), or digital painting.\n• Essential Keywords: Include 'volumetric lighting', 'cinematic lighting', '8k photorealistic', 'octane render', 'macro photography', 'bokeh'!"
      } else {
        title = "Deadpool's Prompt Mastermind (Round 3)"
        text = "🌮 Wade's Prompt Clue:\n• Think like a prompt artist trying to sound like a genius! Throw in terms like 'cyberpunk', 'hyper-detailed', 'neon', 'unreal engine 5', 'dramatic lighting'!\n• Submit early so your timestamp locks in first on the leaderboard!"
      }
    } else {
      if (hero === 'spidey') {
        title = "Spider-Man's Tactical Advice"
        text = "🕸️ Stay focused, coordinate your team roles, and keep an eye on the cyber timer. Great teams succeed by staying calm under pressure!"
      } else {
        title = "Deadpool's Pre-Match Hype"
        text = "🌮 Stretch those clicking fingers, take a sip of water, and prepare for Maximum Effort! You've got this!"
      }
    }

    setActiveClue({ hero, title, text })

    if (hero === 'spidey') {
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'spidey', text: `💡 [CLUE REVEALED]: ${text}` }
      ])
    } else {
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'deadpool', text: `💡 [CLUE REVEALED]: ${text}` }
      ])
    }
  }

  // Deadpool Arena Chat Input
  const handleSendDeadpoolArena = (e) => {
    e.preventDefault()
    if (!deadpoolInput.trim()) return
    const userText = deadpoolInput.trim()
    const query = userText.toLowerCase()
    setDeadpoolInput('')

    let reply = "Stay focused on the round, rookie! Click 'Ask Deadpool for a Clue' if you want tactical hints for this exact question!"
    if (query.includes('clue') || query.includes('hint') || query.includes('help')) {
      handleGetClue('deadpool')
      return
    } else if (query.includes('spidey') || query.includes('peter')) {
      reply = "Spidey's over on the right giving nerdy lectures on physics. Click his widget if you want textbook formulas!"
    } else if (query.includes('negative') || query.includes('-5') || query.includes('penalty')) {
      reply = "Remember: One wrong guess in Stage 0 is -5 points! Leaving it blank is 0. Don't throw away your team's hard work!"
    } else if (query.includes('time') || query.includes('clock')) {
      reply = "Keep your eyes on the cyber countdown! When it hits zero, it auto-submits. Move fast and strike hard!"
    } else if (query.includes('win') || query.includes('scared') || query.includes('nervous')) {
      reply = "Nervous?! You have Deadpool in your corner! Take a breath, trust your eyes, and unleash MAXIMUM EFFORT!"
    }

    setDeadpoolMessages(prev => [
      ...prev,
      { sender: 'user', text: userText }
    ])
    setIsDeadpoolTyping(true)
    setTimeout(() => {
      setIsDeadpoolTyping(false)
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'deadpool', text: reply }
      ])
    }, 400)
  }

  // Spidey Arena Chat Input
  const handleSendSpideyArena = (e) => {
    e.preventDefault()
    if (!spideyInput.trim()) return
    const userText = spideyInput.trim()
    const query = userText.toLowerCase()
    setSpideyInput('')

    let reply = "I'm monitoring the competition feeds! Click 'Ask Spidey for a Clue' for optical and forensic hints on this question!"
    if (query.includes('clue') || query.includes('hint') || query.includes('help')) {
      handleGetClue('spidey')
      return
    } else if (query.includes('deadpool') || query.includes('wade')) {
      reply = "Wade's just hyped on tacos over on the left! Focus on the details and you'll do great!"
    } else if (query.includes('time') || query.includes('clock') || query.includes('timer')) {
      reply = "Pacing is everything! 40s in R1, 45s in R2, 75s in R3, and 30m in the Quiz. Don't rush into reckless errors!"
    } else if (query.includes('strategy') || query.includes('points') || query.includes('score')) {
      reply = "In Round 1, spotting the generator model grabs you the full 10 points. In Stage 0, protect your team average from negative marks!"
    }

    setSpideyMessages(prev => [
      ...prev,
      { sender: 'user', text: userText }
    ])
    setIsSpideyTyping(true)
    setTimeout(() => {
      setIsSpideyTyping(false)
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'spidey', text: reply }
      ])
    }, 400)
  }

  const handleLogout = () => {
    localStorage.clear()
    router.push('/')
  }

  return (
    <div className="page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <video ref={videoRef} autoPlay playsInline muted style={{ display: 'none' }} />
      <canvas ref={canvasRef} width="160" height="120" style={{ display: 'none' }} />
      {/* Top Banner */}
      <nav className="glass-panel" style={{ margin: '16px', padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px' }}>
        <div>
          <span style={{ fontSize: '0.85rem', textTransform: 'uppercase', color: 'var(--color-neon-blue)', fontWeight: 600, letterSpacing: '1px' }}>LOGIN 2026: The Last Human</span>
          <h2 style={{ fontSize: '1.2rem', marginTop: '2px', textTransform: 'uppercase' }} className="glitch-text" data-text={`TEAM: ${team.teamName}`}>TEAM: {team.teamName}</h2>
        </div>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ textAlign: 'right' }}>
            <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>Total Score:</span>
            <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: 'var(--color-neon-blue)', textShadow: '0 0 10px rgba(255,59,59,0.5)' }}>{team.score} Points</div>
          </div>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 14px', fontSize: '0.8rem' }}>Logout</button>
        </div>
      </nav>

      {/* Main Container */}
      <main className="container" style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', paddingBottom: '60px' }}>
        
        {/* ELIMINATED VIEW */}
        {team.isEliminated ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px', border: '1px solid var(--color-primary-blue)' }}>
            <span className="badge badge-eliminated" style={{ padding: '8px 16px', fontSize: '0.9rem', marginBottom: '16px' }}>Eliminated</span>
            <h2 className="glitch-text" data-text="GAME OVER FOR TEAM" style={{ fontSize: '2rem', marginBottom: '12px', textTransform: 'uppercase' }}>Game Over for Team</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Your team has been eliminated in the qualification round. You can continue spectating the remaining rounds on the projector display.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '16px', textTransform: 'uppercase' }}>Current Standings</h3>
              <div style={{ maxHeight: '200px', overflowY: 'auto' }}>
                {leaderboard.slice(0, 5).map((u, i) => (
                  <div key={u.id} style={{ display: 'flex', justifyContent: 'space-between', padding: '8px 0', borderBottom: '1px solid rgba(255,255,255,0.04)' }}>
                    <span>{i + 1}. {u.teamName}</span>
                    <span style={{ fontWeight: 'bold', color: 'var(--color-neon-blue)' }}>{u.score} pts</span>
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
                <div className="float-bounce" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(224,27,34,0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-blue)' }} />
                </div>
                <h2 className="glitch-text" data-text="WAITING ROOM" style={{ fontSize: '1.75rem', marginBottom: '12px', textTransform: 'uppercase' }}>WAITING ROOM</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  Registration is complete. Please wait for the event coordinators to initiate the rounds. The screen will synchronize automatically when the game begins.
                </p>
                <div className="shimmer-bg" style={{ padding: '16px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div className="typing-cursor" style={{ fontWeight: '600', color: 'var(--color-neon-blue)', marginTop: '4px' }}>Awaiting Host Command</div>
                </div>
              </div>
            )}

            {/* STAGE 0: PRELIMS MCQ QUIZ (Self-Paced, 30 Questions, strictly 30 mins) */}
            {gameState.activeRound === 1 && (
              <div style={{ marginTop: '20px' }}>
                <div className="glass-panel" style={{ padding: '32px' }}>
                  {prelimStatus === 'NOT_STARTED' && (
                    <div style={{ textAlign: 'center' }}>
                      <div style={{ background: 'rgba(255, 20, 147, 0.1)', border: '1px solid #ff1493', color: '#ff5c93', borderRadius: '8px', padding: '16px', fontSize: '0.9rem', marginBottom: '24px', textAlign: 'left', lineHeight: '1.5' }}>
                        <strong style={{ display: 'block', marginBottom: '8px', fontSize: '1rem', color: '#fff' }}>⚠️ STAGE 0 RULES & SCORING</strong>
                        <ul style={{ margin: 0, paddingLeft: '20px' }}>
                          <li><strong>Questions:</strong> Exactly 30 MCQ questions.</li>
                          <li><strong>Strict Timing:</strong> Strictly 30 minutes once started. Auto-submits when time expires.</li>
                          <li><strong>Scoring Formula:</strong> Correct choice = <strong>+10 points</strong>, Wrong answer = <strong>-5 points</strong> (Negative marking). Unanswered = 0.</li>
                          <li><strong>Team Average:</strong> Team score is calculated as the sum of all members' scores divided by your registered team size (2–4).</li>
                          <li><strong>Silent Monitoring:</strong> 1-minute webcam anti-cheat verification operates in the background.</li>
                        </ul>
                      </div>
                      <h2 style={{ marginBottom: '16px', color: 'var(--color-primary-blue, #E01B22)' }}>Stage 0: Prelims (30 Questions)</h2>
                      <p style={{ color: 'var(--text-secondary)', marginBottom: '24px' }}>
                        Welcome to the Prelims! You have strictly 30 minutes to complete the 30-question quiz. Read each question carefully.
                      </p>
                      <button className="btn-primary" onClick={handlePrelimStart}>Acknowledge & Start Quiz</button>
                    </div>
                  )}
                  {prelimStatus === 'IN_PROGRESS' && (
                    <div>
                      <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '16px', color: '#ff1493', fontWeight: 'bold' }}>
                        <span>Time Left:</span>
                        <span>{Math.floor(prelimTimeLeft / 60)}:{String(prelimTimeLeft % 60).padStart(2, '0')}</span>
                      </div>

                      {/* Superhero Clue Bar for Stage 0 */}
                      <div className="superhero-clue-bar">
                        <button type="button" onClick={() => handleGetClue('spidey')} className="clue-btn-spidey">
                          🕸️ Ask Spidey for a Clue
                        </button>
                        <button type="button" onClick={() => handleGetClue('deadpool')} className="clue-btn-deadpool">
                          🌮 Ask Deadpool for a Clue
                        </button>
                      </div>

                      {activeClue && (
                        <div className={`active-clue-card ${activeClue.hero}`}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                              <span style={{ fontSize: '1.4rem' }}>{activeClue.hero === 'spidey' ? '🕷️' : '🌮'}</span>
                              <strong style={{ color: activeClue.hero === 'spidey' ? '#38BDF8' : '#FF4D4D', fontSize: '0.95rem' }}>
                                {activeClue.title}
                              </strong>
                            </div>
                            <button 
                              type="button"
                              onClick={() => setActiveClue(null)}
                              style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 6px' }}
                            >
                              ✕
                            </button>
                          </div>
                          <div style={{ color: '#F3F4F6', fontSize: '0.86rem', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                            {activeClue.text}
                          </div>
                        </div>
                      )}
                      {prelimQuestions.map((q, idx) => (
                        <div key={q.id} className="stagger-fade-in" style={{ marginBottom: '24px', paddingBottom: '24px', borderBottom: '1px solid rgba(255,255,255,0.1)', animationDelay: `${idx * 0.05}s` }}>
                          <p style={{ fontWeight: 'bold', marginBottom: '12px', color: 'var(--text-white)' }}>{idx + 1}. {q.questionText}</p>
                          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                            {['optionA', 'optionB', 'optionC', 'optionD'].map((opt) => (
                              <label key={opt} style={{ 
                                display: 'flex', alignItems: 'center', gap: '10px', cursor: 'pointer',
                                padding: '10px 14px', borderRadius: '6px',
                                border: prelimAnswers[q.id] === q[opt] ? '1px solid var(--color-primary-blue)' : '1px solid rgba(255,255,255,0.08)',
                                background: prelimAnswers[q.id] === q[opt] ? 'rgba(224,27,34,0.1)' : 'transparent',
                                transition: 'all 0.2s ease'
                              }}>
                                <input 
                                  type="radio" 
                                  name={`q-${q.id}`} 
                                  value={q[opt]} 
                                  checked={prelimAnswers[q.id] === q[opt]}
                                  onChange={() => setPrelimAnswers({ ...prelimAnswers, [q.id]: q[opt] })}
                                  style={{ accentColor: 'var(--color-primary-blue)' }}
                                />
                                <span style={{ color: prelimAnswers[q.id] === q[opt] ? 'var(--text-white)' : 'var(--text-secondary)' }}>{q[opt]}</span>
                              </label>
                            ))}
                          </div>
                        </div>
                      ))}
                      <button className="btn-primary" style={{ width: '100%' }} onClick={handlePrelimSubmit}>Submit Quiz</button>
                    </div>
                  )}
                  {prelimStatus === 'COMPLETED' && (
                    <div style={{ textAlign: 'center' }}>
                      <div className="lock-in-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(224,27,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-primary-blue)' }}>
                        <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-neon-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline className="draw-check" points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h2 className="scale-pop" style={{ marginBottom: '16px', color: 'var(--color-neon-blue)', textTransform: 'uppercase' }}>Quiz Submitted!</h2>
                      <p style={{ color: 'var(--text-secondary)' }}>
                        Please wait for the other participants to finish.
                      </p>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGES 1 TO 4: LIVE PROJECTOR VISUAL QUESTIONS */}
            {gameState.activeRound > 1 && gameState.activeRound < 5 && (
              <div>
                {!gameState.activeQuestionId ? (
                  <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                    <h2 style={{ fontSize: '1.5rem', marginBottom: '8px' }}>
                      {gameState.activeRound === 2 && 'Stage 1: Pixel Detective'}
                      {gameState.activeRound === 3 && 'Stage 2: The Glitch Hunt'}
                      {gameState.activeRound === 4 && 'Stage 3: Prompt Wars'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)' }}>
                      Get ready! Waiting for the organizers to launch the next image question...
                    </p>
                  </div>
                ) : (
                  <div style={{ marginTop: '20px' }}>
                    {/* Header: Timer & Round info */}
                    <div className={`glass-panel ${timeLeft > 0 && timeLeft < 10 ? 'ring-pulse' : ''}`} style={{ padding: '16px 24px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', borderColor: timeLeft < 10 && timeLeft > 0 ? 'var(--color-primary-blue)' : 'var(--card-border)' }}>
                      <div>
                        <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Current Stage</span>
                        <h3 style={{ fontSize: '1.1rem', textTransform: 'uppercase' }}>
                          {gameState.activeRound === 2 && 'Stage 1: Pixel Detective'}
                          {gameState.activeRound === 3 && 'Stage 2: The Glitch Hunt'}
                          {gameState.activeRound === 4 && 'Stage 3: Prompt Wars'}
                        </h3>
                      </div>
                      
                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Time Remaining:</span>
                        <div style={{ fontSize: '1.75rem', fontWeight: 'bold', fontFamily: 'var(--font-display)', color: timeLeft < 10 ? 'var(--color-neon-blue)' : '#fff', textShadow: timeLeft < 10 && timeLeft > 0 ? '0 0 15px rgba(224,27,34,0.7)' : 'none' }} className={timeLeft < 5 && timeLeft > 0 ? 'blink' : ''}>
                          {timeLeft > 0 ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}` : '00:00'}
                        </div>
                      </div>
                    </div>

                    {/* Superhero Clue Station for Stages 1 to 4 */}
                    <div className="superhero-clue-bar">
                      <button type="button" onClick={() => handleGetClue('spidey')} className="clue-btn-spidey">
                        🕸️ Ask Spidey for a Clue
                      </button>
                      <button type="button" onClick={() => handleGetClue('deadpool')} className="clue-btn-deadpool">
                        🌮 Ask Deadpool for a Clue
                      </button>
                    </div>

                    {activeClue && (
                      <div className={`active-clue-card ${activeClue.hero}`}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                          <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                            <span style={{ fontSize: '1.4rem' }}>{activeClue.hero === 'spidey' ? '🕷️' : '🌮'}</span>
                            <strong style={{ color: activeClue.hero === 'spidey' ? '#38BDF8' : '#FF4D4D', fontSize: '0.95rem' }}>
                              {activeClue.title}
                            </strong>
                          </div>
                          <button 
                            type="button"
                            onClick={() => setActiveClue(null)}
                            style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '2px 6px' }}
                          >
                            ✕
                          </button>
                        </div>
                        <div style={{ color: '#F3F4F6', fontSize: '0.86rem', lineHeight: '1.55', whiteSpace: 'pre-line' }}>
                          {activeClue.text}
                        </div>
                      </div>
                    )}

                    {/* Image Area for activeRound > 1 */}
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

                    {/* SUBMITTED WAITING SCREEN (for image rounds) */}
                    {submitted ? (
                      <div className="glass-panel" style={{ padding: '32px', textAlign: 'center' }}>
                        <div className="lock-in-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(224,27,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-primary-blue)' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-neon-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline className="draw-check" points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <h3 className="scale-pop" style={{ textTransform: 'uppercase' }}>Response Locked In</h3>
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
                          {/* STAGE 1 FORM */}
                          {gameState.activeRound === 2 && (
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

                          {/* STAGE 2 FORM */}
                          {gameState.activeRound === 3 && (
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

                          {/* STAGE 3 FORM */}
                          {gameState.activeRound === 4 && (
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

                          <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '16px' }}
                            disabled={gameState.activeRound === 2 && !round1Answer.chosen}
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
                <h1 className="glitch-text" data-text="EVENT COMPLETED" style={{ fontSize: '2.5rem', marginBottom: '8px', textTransform: 'uppercase' }}>EVENT COMPLETED!</h1>
                <p style={{ color: 'var(--text-secondary)', marginBottom: '32px' }}>
                  The Pixel Paradox: AI or Reality challenge has ended. Thank you for participating!
                </p>
                
                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', textTransform: 'uppercase' }}>Final Scoreboard Standing</h3>
                <div className="glass-panel" style={{ padding: '16px', maxWidth: '500px', margin: '0 auto' }}>
                  {leaderboard.map((u, i) => (
                    <div 
                      key={u.id} 
                      className="stagger-fade-in"
                      style={{ 
                        display: 'flex', 
                        justifyContent: 'space-between', 
                        padding: '12px 8px', 
                        borderBottom: i < leaderboard.length - 1 ? '1px solid rgba(255,255,255,0.04)' : 'none',
                        background: u.teamId === team.teamId ? 'rgba(224,27,34,0.08)' : 'transparent',
                        fontWeight: u.teamId === team.teamId ? 'bold' : 'normal',
                        borderRadius: '4px',
                        animationDelay: `${i * 0.08}s`
                      }}
                    >
                      <span>{i === 0 ? '🏆' : i === 1 ? '🥈' : i === 2 ? '🥉' : `${i + 1}.`} {u.teamName} {u.teamId === team.teamId && ' (You)'}</span>
                      <span style={{ color: 'var(--color-neon-blue)', fontWeight: 'bold' }}>{u.score} pts</span>
                    </div>
                  ))}
                </div>
              </div>
            )}

            {/* ROUND 6: EVALUATING RESULTS */}
            {gameState.activeRound === 6 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div className="float-bounce" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(224, 27, 34, 0.1)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 24px' }}>
                  <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: 'var(--color-primary-blue)' }} />
                </div>
                <h2 className="glitch-text" data-text="EVALUATING RESULTS" style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff', textTransform: 'uppercase' }}>Evaluating Results...</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  The organizers are currently reviewing submissions and grading the recent round.
                </p>
                <div className="shimmer-bg" style={{ padding: '16px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div className="typing-cursor" style={{ fontWeight: '600', color: 'var(--color-neon-blue)', marginTop: '4px' }}>Results will be announced shortly. Please stand by</div>
                </div>
              </div>
            )}

            {/* ROUND 7: BREAK TIME */}
            {gameState.activeRound === 7 && (
              <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', marginTop: '40px' }}>
                <div className="float-bounce" style={{ fontSize: '4rem', marginBottom: '16px' }}>☕</div>
                <h2 style={{ fontSize: '2rem', marginBottom: '16px', color: '#fff', textTransform: 'uppercase' }}>Break Time</h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1.1rem', maxWidth: '500px', margin: '0 auto 24px', lineHeight: 1.6 }}>
                  The event is currently paused for a short break. Feel free to stretch your legs and grab some refreshments!
                </p>
                <div className="shimmer-bg" style={{ padding: '16px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                  <div style={{ fontWeight: '600', color: 'var(--color-neon-blue)', marginTop: '4px' }}>Event is paused. We will resume shortly.</div>
                </div>
              </div>
            )}
          </div>
        )}
      </main>

      {/* ========================================================= */}
      {/* LEFT SIDE: DEADPOOL MERC-BOT COMPANION IN GAME ARENA */}
      {/* ========================================================= */}
      <div className="sticky-deadpool-bar">
        {isDeadpoolChatOpen ? (
          <div className="deadpool-chat-window">
            <div style={{ background: 'linear-gradient(135deg, #E23636 0%, #850B12 100%)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#FFF', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center' }}>
                  <svg viewBox="0 0 64 64" style={{ width: '90%', height: '90%' }}>
                    <circle cx="32" cy="32" r="28" fill="#C51B24" />
                    <ellipse cx="20" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(8 20 32)" />
                    <ellipse cx="44" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(-8 44 32)" />
                    <path d="M15,31 Q20,29 25,32 Q20,35 15,31 Z" fill="#FFFFFF" />
                    <path d="M49,31 Q44,29 39,32 Q44,35 49,31 Z" fill="#FFFFFF" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Deadpool's Arena Coach</div>
                  <div style={{ fontSize: '0.7rem', color: '#FACC15' }}>● Clue Provider &amp; Hype Man</div>
                </div>
              </div>
              <button 
                onClick={() => setIsDeadpoolChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px', maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {deadpoolMessages.map((msg, idx) => (
                <div key={idx} className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '2px', color: msg.sender === 'user' ? '#FFF' : '#FF4D4D' }}>
                    {msg.sender === 'user' ? 'You' : 'Deadpool'}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                </div>
              ))}
              {isDeadpoolTyping && (
                <div className="chat-bubble-bot" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#FF4D4D', fontWeight: 'bold' }}>Deadpool is crafting a clue</span>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              )}
              <div ref={deadpoolChatBottomRef} />
            </div>

            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                type="button"
                onClick={() => handleGetClue('deadpool')}
                className="clue-btn-deadpool"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem' }}
              >
                🌮 Reveal Active Clue for this Round!
              </button>
            </div>

            <form onSubmit={handleSendDeadpoolArena} style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0A0406' }}>
              <input 
                type="text"
                placeholder="Ask Wade anything..."
                value={deadpoolInput}
                onChange={(e) => setDeadpoolInput(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', color: '#FFF', borderRadius: '6px', padding: '8px 12px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ background: '#E23636', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 14px', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div 
            className="deadpool-speech card-hover-lift" 
            onClick={() => setIsDeadpoolChatOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to talk to Deadpool!"
          >
            {DEADPOOL_GAME_QUOTES[deadpoolQuoteIdx]}
            <div style={{ fontSize: '0.7rem', color: '#FACC15', marginTop: '4px', textAlign: 'left' }}>
              [Click Deadpool for Coach Clues 💬]
            </div>
          </div>
        )}

        <div 
          className="deadpool-floating"
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsDeadpoolChatOpen(prev => !prev)}
        >
          <div style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #7F1D1D 100%)',
            border: '2.5px solid #E23636',
            boxShadow: '0 8px 24px rgba(226, 54, 54, 0.7), 0 0 16px rgba(0, 0, 0, 0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <svg viewBox="0 0 64 64" style={{ width: '85%', height: '85%' }}>
              <circle cx="32" cy="32" r="28" fill="#C51B24" />
              <ellipse cx="20" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(8 20 32)" />
              <ellipse cx="44" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(-8 44 32)" />
              <path d="M15,31 Q20,29 25,32 Q20,35 15,31 Z" fill="#FFFFFF" />
              <path d="M49,31 Q44,29 39,32 Q44,35 49,31 Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>
      </div>

      {/* ========================================================= */}
      {/* RIGHT SIDE: SPIDER-MAN WEB-BOT COMPANION IN GAME ARENA */}
      {/* ========================================================= */}
      <div className="sticky-spidey-bar">
        {isSpideyChatOpen ? (
          <div className="spidey-chat-window">
            <div style={{ background: 'linear-gradient(135deg, #0284C7 0%, #1E3A8A 100%)', padding: '12px 16px', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#D81E27', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #FFF' }}>
                  <svg viewBox="0 0 64 64" style={{ width: '85%', height: '85%' }}>
                    <circle cx="32" cy="32" r="30" fill="#D81E27" />
                    <path d="M32 2 L32 62 M2 32 L62 32" stroke="#850B12" strokeWidth="1.5" />
                    <polygon points="14,30 29,36 28,24 16,18" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                    <polygon points="50,30 35,36 36,24 48,18" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Spidey's Forensic Web-Bot</div>
                  <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>● Tactical Intel &amp; Science</div>
                </div>
              </div>
              <button 
                onClick={() => setIsSpideyChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            <div style={{ padding: '14px', maxHeight: '250px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
              {spideyMessages.map((msg, idx) => (
                <div key={idx} className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-spidey'}>
                  <div style={{ fontSize: '0.7rem', fontWeight: 'bold', marginBottom: '2px', color: msg.sender === 'user' ? '#FFF' : '#38BDF8' }}>
                    {msg.sender === 'user' ? 'You' : 'Spider-Man'}
                  </div>
                  <div style={{ whiteSpace: 'pre-line' }}>{msg.text}</div>
                </div>
              ))}
              {isSpideyTyping && (
                <div className="chat-bubble-spidey" style={{ display: 'inline-flex', alignItems: 'center', gap: '6px' }}>
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 'bold' }}>Spider-Man is calculating optics</span>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              )}
              <div ref={spideyChatBottomRef} />
            </div>

            <div style={{ padding: '8px 12px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '6px' }}>
              <button 
                type="button"
                onClick={() => handleGetClue('spidey')}
                className="clue-btn-spidey"
                style={{ width: '100%', justifyContent: 'center', padding: '8px 12px', fontSize: '0.8rem' }}
              >
                🕸️ Reveal Optical Clue for this Round!
              </button>
            </div>

            <form onSubmit={handleSendSpideyArena} style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#060B12' }}>
              <input 
                type="text"
                placeholder="Ask Spider-Man anything..."
                value={spideyInput}
                onChange={(e) => setSpideyInput(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(56,189,248,0.2)', color: '#FFF', borderRadius: '6px', padding: '8px 12px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ background: '#0284C7', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 14px', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
              >
                Send
              </button>
            </form>
          </div>
        ) : (
          <div 
            className="spidey-speech card-hover-lift" 
            onClick={() => setIsSpideyChatOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to talk to Spider-Man!"
          >
            {SPIDEY_GAME_QUOTES[spideyQuoteIdx]}
            <div style={{ fontSize: '0.7rem', color: '#FACC15', marginTop: '4px', textAlign: 'right' }}>
              [Click Spidey for Science Clues 💬]
            </div>
          </div>
        )}

        <div 
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsSpideyChatOpen(prev => !prev)}
        >
          <div className="spider-sense-active" style={{
            position: 'absolute',
            top: '-16px',
            width: '50px',
            height: '25px',
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 60 30" fill="none">
              <path d="M12,25 Q30,2 48,25" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
              <path d="M5,20 Q30,-8 55,20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
            </svg>
          </div>

          <div className="spidey-floating" style={{
            width: '60px',
            height: '60px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #7F1D1D 100%)',
            border: '2px solid #E01B22',
            boxShadow: '0 8px 24px rgba(224, 27, 34, 0.6), 0 0 16px rgba(250, 204, 21, 0.3)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            overflow: 'hidden'
          }}>
            <svg viewBox="0 0 64 64" style={{ width: '85%', height: '85%' }}>
              <circle cx="32" cy="32" r="30" fill="#D81E27" stroke="#180407" strokeWidth="2" />
              <path d="M32 2 L32 62 M2 32 L62 32 M10 10 L54 54 M10 54 L54 10" stroke="#850B12" strokeWidth="1.2" />
              <polygon points="14,30 29,36 28,24 16,18" fill="#FFFFFF" stroke="#0A0607" strokeWidth="2.5" strokeLinejoin="round" />
              <polygon points="50,30 35,36 36,24 48,18" fill="#FFFFFF" stroke="#0A0607" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
