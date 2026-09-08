'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const SPIDEY_GAME_QUOTES = [
  "🕸️ 'Take a steady breath! Optical physics and photon diffraction are on your side.'",
  "🕷️ 'Stage 0 is 30 questions in 30 minutes. Quality over reckless haste—protect your score from -5 penalties!'",
  "⚡ 'In Round 1, inspect iris highlights. Diffusion models almost always mismatch ambient light reflections.'",
  "🎯 'Need forensic analysis? Click [Ask Spidey for a Clue] anytime!'",
  "🔬 'Check lens edge chromatic aberration. Real glass produces subtle color fringing; AI renders uniform blur.'",
  "🛡️ 'Stay calm when the timer turns red. Great teams win by staying composed under pressure.'",
  "☕ 'Ignore Wade over on the left trying to juggle weapons in the server room. Focus on the pixel boundaries.'",
  "🕷️ 'Look closely at ear cartilage and hair roots. AI consistently fails anatomical transitions.'"
]

const DEADPOOL_GAME_QUOTES = [
  "🌮 'Maximum Effort! Show these neural networks what actual human intelligence looks like!'",
  "⚔️ 'A wrong guess is minus five points. Click with your brain, not your panic, rookie!'",
  "💥 'Stuck on a suspicious pixel? Click [Ask Deadpool for a Clue] before you guess blindly!'",
  "🕶️ 'Trust your preparation! Just don't let your teammate start clicking random answers!'",
  "🍕 'Focus up! A lead on the leaderboard is won on precision, not speed!'",
  "🚨 'Stop sweating on the mouse! You are going to short-circuit the trackpad!'",
  "🦄 'I put twenty bucks on your squad. Don't make me lose money to Peter Parker!'",
  "🎬 'Relax your shoulders, take a breath, and lock in the answer before the red timer hits zero!'"
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
  const [currentPrelimIdx, setCurrentPrelimIdx] = useState(0)
  const [flaggedQuestions, setFlaggedQuestions] = useState(new Set())
  const [showConfirmSubmitModal, setShowConfirmSubmitModal] = useState(false)

  // Tournament Protocol Acknowledgment Modal
  const [showAcknowledgeModal, setShowAcknowledgeModal] = useState(false)
  const [hasAcknowledged, setHasAcknowledged] = useState(false)

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
    
    // Restore Prelims Quiz Progress if actively in progress
    const savedStartTime = localStorage.getItem('prelimStartTime_' + storedParticipant)
    if (savedStartTime) {
      const startEpoch = parseInt(savedStartTime, 10)
      const elapsed = Math.floor((Date.now() - startEpoch) / 1000)
      if (elapsed < 1800) {
        setPrelimTimeLeft(1800 - elapsed)
        setPrelimStatus('IN_PROGRESS')
      } else {
        setPrelimTimeLeft(0)
        setPrelimStatus('COMPLETED')
      }
    }
    const savedAnswers = localStorage.getItem('prelimAnswers_' + storedParticipant)
    if (savedAnswers) {
      try {
        setPrelimAnswers(JSON.parse(savedAnswers))
      } catch (e) {
        console.error("Failed to parse saved prelim answers", e)
      }
    }
    const savedFlagged = localStorage.getItem('prelimFlagged_' + storedParticipant)
    if (savedFlagged) {
      try {
        setFlaggedQuestions(new Set(JSON.parse(savedFlagged)))
      } catch (e) {
        console.error("Failed to parse saved prelim flagged questions", e)
      }
    }
    const savedIdx = localStorage.getItem('prelimIdx_' + storedParticipant)
    if (savedIdx) {
      const idx = parseInt(savedIdx, 10)
      if (!isNaN(idx) && idx >= 0) {
        setCurrentPrelimIdx(idx)
      }
    }

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

  // Sync answers to state & localStorage
  const handleAnswerSelect = (questionId, optionValue) => {
    setPrelimAnswers(prev => {
      const next = { ...prev, [questionId]: optionValue }
      if (participantName) {
        localStorage.setItem('prelimAnswers_' + participantName, JSON.stringify(next))
      }
      return next
    })
  }

  // Clear answer from question
  const handleClearAnswer = (questionId) => {
    setPrelimAnswers(prev => {
      const next = { ...prev }
      delete next[questionId]
      if (participantName) {
        localStorage.setItem('prelimAnswers_' + participantName, JSON.stringify(next))
      }
      return next
    })
  }

  // Toggle flag status for question
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      if (participantName) {
        localStorage.setItem('prelimFlagged_' + participantName, JSON.stringify(Array.from(next)))
      }
      return next
    })
  }

  // Question navigation with index persistence
  const handleSelectQuestion = (idx) => {
    if (idx >= 0 && idx < (prelimQuestions.length || 30)) {
      setCurrentPrelimIdx(idx)
      if (participantName) {
        localStorage.setItem('prelimIdx_' + participantName, idx.toString())
      }
    }
  }

  // Keyboard navigation for Stage 0 Quiz
  useEffect(() => {
    const handleKeyDown = (e) => {
      // Don't intercept if typing in chat, inputs, or when modals are active
      if (['INPUT', 'TEXTAREA'].includes(e.target?.tagName)) return
      if (showAcknowledgeModal || showConfirmSubmitModal) return
      if (gameState.activeRound !== 1 || prelimStatus !== 'IN_PROGRESS') return
      if (!prelimQuestions || prelimQuestions.length === 0) return

      const total = prelimQuestions.length || 30
      const currentQ = prelimQuestions[currentPrelimIdx]

      if (e.key === 'ArrowLeft') {
        e.preventDefault()
        handleSelectQuestion(Math.max(0, currentPrelimIdx - 1))
      } else if (e.key === 'ArrowRight') {
        e.preventDefault()
        handleSelectQuestion(Math.min(total - 1, currentPrelimIdx + 1))
      } else if (e.key === 'f' || e.key === 'F') {
        e.preventDefault()
        if (currentQ) handleToggleFlag(currentQ.id)
      } else if (currentQ) {
        if (e.key === '1' || e.key === 'a' || e.key === 'A') {
          e.preventDefault()
          handleAnswerSelect(currentQ.id, currentQ.optionA)
        } else if (e.key === '2' || e.key === 'b' || e.key === 'B') {
          e.preventDefault()
          handleAnswerSelect(currentQ.id, currentQ.optionB)
        } else if (e.key === '3' || e.key === 'c' || e.key === 'C') {
          e.preventDefault()
          handleAnswerSelect(currentQ.id, currentQ.optionC)
        } else if (e.key === '4' || e.key === 'd' || e.key === 'D') {
          e.preventDefault()
          handleAnswerSelect(currentQ.id, currentQ.optionD)
        }
      }
    }

    window.addEventListener('keydown', handleKeyDown)
    return () => window.removeEventListener('keydown', handleKeyDown)
  }, [gameState.activeRound, prelimStatus, prelimQuestions, currentPrelimIdx, showAcknowledgeModal, showConfirmSubmitModal, participantName])

  const handlePrelimSubmit = async () => {
    setShowConfirmSubmitModal(false)
    try {
      const res = await fetch('http://localhost:8080/api/game/prelims/submit', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantName, answers: prelimAnswers })
      })
      if (res.ok) {
        setPrelimStatus('COMPLETED')
        localStorage.removeItem('prelimStartTime_' + participantName)
        localStorage.removeItem('prelimAnswers_' + participantName)
        localStorage.removeItem('prelimFlagged_' + participantName)
        localStorage.removeItem('prelimIdx_' + participantName)
        fetchTeamProfile(token)
      } else {
        const data = await res.json()
        if (data.message === 'Quiz already submitted' || data.message?.includes('COMPLETED')) {
          setPrelimStatus('COMPLETED')
          localStorage.removeItem('prelimStartTime_' + participantName)
          localStorage.removeItem('prelimAnswers_' + participantName)
          localStorage.removeItem('prelimFlagged_' + participantName)
          localStorage.removeItem('prelimIdx_' + participantName)
        }
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
    <div className="page-transition" suppressHydrationWarning style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column' }}>
      <video ref={videoRef} autoPlay playsInline muted suppressHydrationWarning style={{ display: 'none' }} />
      <canvas ref={canvasRef} width="160" height="120" style={{ display: 'none' }} />
      {/* Top Cyber HUD Navigation Banner */}
      <nav className="arena-hud-nav" suppressHydrationWarning>
        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', flexDirection: 'column' }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '4px' }}>
              <span className="live-telemetry-pill">
                <span className="live-pulse-dot" />
                Live Tournament Link
              </span>
              <span style={{ fontSize: '0.72rem', color: '#FACC15', fontWeight: 'bold', letterSpacing: '1px' }}>
                LOGIN 2026 • NEURAL ARENA
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glitch-text" data-text={`TEAM: ${team.teamName}`}>
              <span>TEAM: {team.teamName}</span>
              {participantName && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', textTransform: 'none' }}>
                  Pilot: {participantName}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          {/* Quick Clue Shortcut Buttons in Nav */}
          <div style={{ display: 'flex', gap: '8px' }}>
            <button 
              type="button" 
              onClick={() => handleGetClue('spidey')}
              className="clue-btn-spidey"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              title="Get Science & Optical Clue from Peter Parker"
            >
              🕸️ Spidey Intel
            </button>
            <button 
              type="button" 
              onClick={() => handleGetClue('deadpool')}
              className="clue-btn-deadpool"
              style={{ padding: '6px 12px', fontSize: '0.76rem' }}
              title="Get Tactical Clue from Deadpool"
            >
              🌮 Wade Clue
            </button>
            <button
              type="button"
              onClick={() => setShowAcknowledgeModal(true)}
              style={{
                background: 'rgba(250, 204, 21, 0.12)',
                border: '1px solid #FACC15',
                color: '#FACC15',
                padding: '6px 12px',
                borderRadius: '6px',
                fontSize: '0.76rem',
                fontWeight: 'bold',
                cursor: 'pointer',
                display: 'flex',
                alignItems: 'center',
                gap: '5px',
                transition: 'all 0.2s ease'
              }}
              title="Review Tournament Protocols & Context"
            >
              📜 Protocols
            </button>
          </div>

          {/* Cyber Score Pill */}
          <div className="cyber-score-pill">
            <span style={{ fontSize: '0.68rem', color: '#FACC15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
              Live Score
            </span>
            <div style={{ fontSize: '1.35rem', fontWeight: '900', color: '#FFF', textShadow: '0 0 10px rgba(255,59,59,0.7)', fontFamily: 'var(--font-display)' }}>
              {team.score} <span style={{ fontSize: '0.8rem', color: '#FF6B6B' }}>PTS</span>
            </div>
          </div>

          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.8rem', borderColor: 'rgba(255,255,255,0.15)' }}>
            Exit Arena
          </button>
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
          <div style={{ maxWidth: '1100px', margin: '0 auto', width: '100%' }}>
            
            {/* ROUND 0: WAITING IN LOBBY */}
            {gameState.activeRound === 0 && (
              <div className="glass-panel" style={{ padding: '44px 32px', textAlign: 'center', marginTop: '30px' }}>
                <div className="float-bounce" style={{
                  width: '90px',
                  height: '90px',
                  borderRadius: '50%',
                  background: 'radial-gradient(circle, rgba(224,27,34,0.2) 0%, rgba(14,7,10,0.8) 100%)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                  margin: '0 auto 24px',
                  border: '2px solid #E01B22',
                  boxShadow: '0 0 25px rgba(224, 27, 34, 0.4)'
                }}>
                  <div className="pulse-glow" style={{ width: '45px', height: '45px', borderRadius: '50%', background: 'var(--color-primary-blue)' }} />
                </div>

                <div style={{ display: 'inline-block', marginBottom: '12px' }}>
                  <span className="shimmer-badge" style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '0.78rem', color: '#FACC15', border: '1px solid #FACC15' }}>
                    LOBBY TELEMETRY ACTIVE
                  </span>
                </div>

                <h2 className="glitch-text" data-text="TOURNAMENT COMMAND BRIEFING" style={{ fontSize: '2rem', marginBottom: '12px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                  TOURNAMENT COMMAND BRIEFING
                </h2>
                <p style={{ color: 'var(--text-secondary)', fontSize: '1rem', maxWidth: '560px', margin: '0 auto 28px', lineHeight: 1.6 }}>
                  Team <strong style={{ color: '#FFF' }}>{team.teamName}</strong> is registered and locked in. Please stand by while event coordinators launch the tournament rounds.
                </p>

                {/* Stage Protocol Cards */}
                <div style={{
                  display: 'grid',
                  gridTemplateColumns: 'repeat(auto-fit, minmax(170px, 1fr))',
                  gap: '12px',
                  maxWidth: '740px',
                  margin: '0 auto 28px',
                  textAlign: 'left'
                }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(224,27,34,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#FF6B6B', fontWeight: 'bold' }}>STAGE 0: PRELIMS</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>30 MCQs / 30 Mins</div>
                    <div style={{ fontSize: '0.72rem', color: '#FACC15' }}>+10 Correct / -5 Wrong</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 'bold' }}>STAGE 1: DETECTIVE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>10 Pixels / 40s</div>
                    <div style={{ fontSize: '0.72rem', color: '#4ADE80' }}>Authenticity &amp; Model ID</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(168,85,247,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#C084FC', fontWeight: 'bold' }}>STAGE 2: INPAINTING</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>7 Challenges / 45s</div>
                    <div style={{ fontSize: '0.72rem', color: '#DDD6FE' }}>Glitch Artifact Scan</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(250,204,21,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#FACC15', fontWeight: 'bold' }}>STAGE 3: PROMPT DUEL</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>5 Prompts / 75s</div>
                    <div style={{ fontSize: '0.72rem', color: '#93C5FD' }}>Semantic Prompt Match</div>
                  </div>
                </div>

                <div className="shimmer-bg" style={{ padding: '14px 24px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)' }}>
                  <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>System Status</span>
                  <div className="typing-cursor" style={{ fontWeight: '700', color: 'var(--color-neon-blue)', marginTop: '4px', fontSize: '0.95rem' }}>
                    Awaiting Host Command Transmission...
                  </div>
                </div>
              </div>
            )}

            {/* STAGE 0: PRELIMS MCQ QUIZ (Self-Paced, 30 Questions, strictly 30 mins) */}
            {gameState.activeRound === 1 && (
              <div style={{ marginTop: '20px' }}>
                <div className="glass-panel" style={{ padding: '32px' }}>
                  {prelimStatus === 'NOT_STARTED' && (
                    <div>
                      {/* High-Impact Cyber Stage Briefing Card */}
                      <div className="stage-briefing-box">
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '10px' }}>
                          <span style={{ fontSize: '1.2rem' }}>⚠️</span>
                          <span style={{ fontSize: '0.85rem', fontWeight: '800', color: '#FF4D4D', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                            STAGE 0 RULES &amp; SCORING FORMULA
                          </span>
                        </div>
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))', gap: '10px', margin: '14px 0 16px' }}>
                          <div style={{ background: 'rgba(34, 197, 94, 0.1)', border: '1px solid #22C55E', borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#86EFAC', fontWeight: 'bold' }}>CORRECT ANSWER</div>
                            <div style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 'bold' }}>+10 Points</div>
                          </div>
                          <div style={{ background: 'rgba(239, 68, 68, 0.1)', border: '1px solid #EF4444', borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#FCA5A5', fontWeight: 'bold' }}>NEGATIVE MARKING</div>
                            <div style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 'bold' }}>-5 Points</div>
                          </div>
                          <div style={{ background: 'rgba(250, 204, 21, 0.1)', border: '1px solid #FACC15', borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#FDE047', fontWeight: 'bold' }}>UNANSWERED</div>
                            <div style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 'bold' }}>0 Points (Safe)</div>
                          </div>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                          <li><strong>30 Questions:</strong> Thoroughly test AI fundamentals, diffusion architectures, GANs, and deepfake forensics.</li>
                          <li><strong>Strict 30-Minute Timer:</strong> Quiz auto-submits precisely when the countdown reaches 00:00.</li>
                          <li><strong>Team Average:</strong> Final team prelim score is the sum of all members divided by team size.</li>
                          <li><strong>Silent Monitoring:</strong> Automated webcam periodic invigilation runs smoothly in the background.</li>
                        </ul>
                      </div>

                      <div style={{ textAlign: 'center', marginTop: '24px' }}>
                        <h2 style={{ marginBottom: '12px', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          Stage 0: Prelims Challenge
                        </h2>
                        <p style={{ color: 'var(--text-secondary)', marginBottom: '24px', maxWidth: '520px', margin: '0 auto 24px' }}>
                          Ready your optical acuity and neural logic. Once initiated, your personal 30-minute timer begins.
                        </p>
                        <button 
                          className="btn-primary" 
                          style={{ padding: '14px 32px', fontSize: '1.05rem', boxShadow: '0 0 20px rgba(224, 27, 34, 0.45)' }} 
                          onClick={() => setShowAcknowledgeModal(true)}
                        >
                          ⚡ Acknowledge Protocols &amp; Start Quiz →
                        </button>
                      </div>
                    </div>
                  )}

                  {prelimStatus === 'IN_PROGRESS' && (
                    <div>
                      {/* Stage 0 Header HUD */}
                      <div style={{
                        display: 'flex',
                        justifyContent: 'space-between',
                        alignItems: 'center',
                        padding: '14px 20px',
                        background: 'rgba(255, 255, 255, 0.03)',
                        border: '1.5px solid rgba(224, 27, 34, 0.35)',
                        borderRadius: '10px',
                        marginBottom: '16px'
                      }}>
                        <div>
                          <span style={{ fontSize: '0.72rem', color: '#FF6B6B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
                            STAGE 0: PRELIMS
                          </span>
                          <span style={{ fontSize: '0.95rem', color: '#FFF', fontWeight: '600' }}>
                            30 Questions (+10 / -5 Penalty)
                          </span>
                        </div>

                        <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                          <div style={{ textAlign: 'right' }}>
                            <span style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px' }}>Time Left</span>
                            <div style={{
                              fontFamily: 'var(--font-display)',
                              fontSize: '1.65rem',
                              fontWeight: '900',
                              color: prelimTimeLeft < 300 ? '#EF4444' : '#FACC15',
                              textShadow: prelimTimeLeft < 300 ? '0 0 12px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(250, 204, 21, 0.4)'
                            }} className={prelimTimeLeft < 180 ? 'blink' : ''}>
                              {Math.floor(prelimTimeLeft / 60)}:{String(prelimTimeLeft % 60).padStart(2, '0')}
                            </div>
                          </div>
                        </div>
                      </div>

                      {/* Question Progress Bar */}
                      <div style={{ marginBottom: '20px' }}>
                        <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '6px' }}>
                          <span>Answered: <strong style={{ color: '#FFF' }}>{Object.keys(prelimAnswers).length}</strong> of 30 questions</span>
                          <span style={{ color: '#FACC15', fontWeight: 'bold' }}>{Math.round((Object.keys(prelimAnswers).length / 30) * 100)}% Complete</span>
                        </div>
                        <div className="arena-progress-container" style={{ margin: 0 }}>
                          <div className="arena-progress-bar" style={{ width: `${(Object.keys(prelimAnswers).length / 30) * 100}%` }} />
                        </div>
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

                      {/* Single-Question Navigator Layout */}
                      <div className="quiz-stage-layout">

                        {/* LEFT: Single Question Panel */}
                        <div>
                          {prelimQuestions.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                              <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E01B22', margin: '0 auto 16px' }} />
                              <div style={{ color: '#FACC15', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '6px' }}>
                                Establishing Neural Connection...
                              </div>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>
                                Retrieving Stage 0 Prelims question bank from secure tournament host.
                              </p>
                            </div>
                          ) : (() => {
                            const totalQuestions = prelimQuestions.length
                            const safeIdx = Math.min(Math.max(0, currentPrelimIdx), totalQuestions - 1)
                            const q = prelimQuestions[safeIdx]
                            if (!q) return null

                            const isAnswered = !!prelimAnswers[q.id]
                            const isFlagged = flaggedQuestions.has(q.id)

                            return (
                              <div className="stagger-fade-in" key={q.id} style={{ animationDuration: '0.25s' }}>
                                {/* Question Header & Status */}
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '14px', flexWrap: 'wrap', gap: '8px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      background: isAnswered ? 'rgba(74, 222, 128, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                      color: isAnswered ? '#4ADE80' : '#FFF',
                                      fontSize: '0.78rem',
                                      fontWeight: '800',
                                      padding: '5px 14px',
                                      borderRadius: '6px',
                                      border: `1px solid ${isAnswered ? '#4ADE80' : 'rgba(255,255,255,0.18)'}`,
                                      letterSpacing: '0.5px'
                                    }}>
                                      QUESTION {safeIdx + 1} OF {totalQuestions}
                                    </span>
                                    {isAnswered && (
                                      <span style={{ fontSize: '0.8rem', color: '#4ADE80', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ✓ Answered
                                      </span>
                                    )}
                                    {isFlagged && (
                                      <span style={{ fontSize: '0.8rem', color: '#FACC15', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        🚩 Flagged for Review
                                      </span>
                                    )}
                                    {!isAnswered && !isFlagged && (
                                      <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)' }}>○ Not answered</span>
                                    )}
                                  </div>

                                  {/* Flag / Unflag Button */}
                                  <button
                                    type="button"
                                    onClick={() => handleToggleFlag(q.id)}
                                    style={{
                                      background: isFlagged ? 'rgba(250,204,21,0.18)' : 'rgba(255,255,255,0.05)',
                                      border: `1.5px solid ${isFlagged ? '#FACC15' : 'rgba(255,255,255,0.14)'}`,
                                      color: isFlagged ? '#FACC15' : 'var(--text-secondary)',
                                      padding: '6px 14px',
                                      borderRadius: '6px',
                                      fontSize: '0.8rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.2s ease',
                                      display: 'flex',
                                      alignItems: 'center',
                                      gap: '6px',
                                      boxShadow: isFlagged ? '0 0 12px rgba(250,204,21,0.35)' : 'none'
                                    }}
                                    title="Shortcut: Press 'F' to toggle flag"
                                  >
                                    {isFlagged ? '🚩 Flagged (Press F)' : '🏳️ Flag for Review (F)'}
                                  </button>
                                </div>

                                {/* Question Text Card */}
                                <div style={{
                                  background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.01) 100%)',
                                  border: '1.5px solid rgba(255, 255, 255, 0.09)',
                                  borderRadius: '12px',
                                  padding: '22px 24px',
                                  marginBottom: '18px',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                                }}>
                                  <p style={{ fontWeight: '600', fontSize: '1.08rem', color: 'var(--text-white)', lineHeight: '1.65', margin: 0 }}>
                                    {q.questionText}
                                  </p>
                                </div>

                                {/* Options */}
                                <div style={{ display: 'flex', flexDirection: 'column', gap: '11px', marginBottom: '22px' }}>
                                  {['optionA', 'optionB', 'optionC', 'optionD'].map((opt, optIdx) => {
                                    const letter = ['A', 'B', 'C', 'D'][optIdx]
                                    const isSelected = prelimAnswers[q.id] === q[opt]
                                    return (
                                      <div
                                        key={opt}
                                        className={`quiz-option-card ${isSelected ? 'selected' : ''}`}
                                        onClick={() => handleAnswerSelect(q.id, q[opt])}
                                        style={{ cursor: 'pointer', transition: 'all 0.18s ease' }}
                                        title={`Shortcut: Press ${optIdx + 1} or ${letter}`}
                                      >
                                        <div className="option-letter-badge" style={{ background: isSelected ? '#E01B22' : undefined }}>
                                          {letter}
                                        </div>
                                        <span style={{
                                          color: isSelected ? '#FFF' : 'var(--text-primary)',
                                          fontSize: '0.94rem',
                                          lineHeight: '1.45',
                                          fontWeight: isSelected ? '700' : 'normal'
                                        }}>
                                          {q[opt]}
                                        </span>
                                      </div>
                                    )
                                  })}
                                </div>

                                {/* Controls row: Prev / Clear / Next */}
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                  <button
                                    type="button"
                                    disabled={safeIdx === 0}
                                    onClick={() => handleSelectQuestion(safeIdx - 1)}
                                    style={{
                                      padding: '11px 22px',
                                      background: safeIdx === 0 ? 'rgba(255,255,255,0.04)' : 'rgba(255,255,255,0.09)',
                                      border: '1px solid rgba(255,255,255,0.14)',
                                      color: safeIdx === 0 ? 'var(--text-dim)' : '#FFF',
                                      borderRadius: '8px',
                                      fontWeight: '700',
                                      cursor: safeIdx === 0 ? 'not-allowed' : 'pointer',
                                      fontSize: '0.88rem',
                                      transition: 'all 0.2s ease'
                                    }}
                                  >
                                    ← Prev (←)
                                  </button>

                                  <div style={{ display: 'flex', gap: '8px', alignItems: 'center' }}>
                                    {isAnswered && (
                                      <button
                                        type="button"
                                        onClick={() => handleClearAnswer(q.id)}
                                        style={{
                                          padding: '10px 18px',
                                          background: 'rgba(239,68,68,0.12)',
                                          border: '1px solid rgba(239,68,68,0.45)',
                                          color: '#EF4444',
                                          borderRadius: '8px',
                                          fontWeight: '700',
                                          cursor: 'pointer',
                                          fontSize: '0.84rem',
                                          transition: 'all 0.2s ease'
                                        }}
                                      >
                                        ✕ Clear Answer
                                      </button>
                                    )}
                                  </div>

                                  {safeIdx < totalQuestions - 1 ? (
                                    <button
                                      type="button"
                                      onClick={() => handleSelectQuestion(safeIdx + 1)}
                                      style={{
                                        padding: '11px 24px',
                                        background: 'rgba(224,27,34,0.22)',
                                        border: '1px solid rgba(224,27,34,0.5)',
                                        color: '#FFF',
                                        borderRadius: '8px',
                                        fontWeight: '700',
                                        cursor: 'pointer',
                                        fontSize: '0.88rem',
                                        transition: 'all 0.2s ease',
                                        boxShadow: '0 0 12px rgba(224,27,34,0.25)'
                                      }}
                                    >
                                      Next → (→)
                                    </button>
                                  ) : (
                                    <button
                                      type="button"
                                      onClick={() => setShowConfirmSubmitModal(true)}
                                      style={{
                                        padding: '11px 26px',
                                        background: 'linear-gradient(135deg, #E01B22, #FF4D4D)',
                                        border: 'none',
                                        color: '#FFF',
                                        borderRadius: '8px',
                                        fontWeight: '800',
                                        cursor: 'pointer',
                                        fontSize: '0.92rem',
                                        boxShadow: '0 0 20px rgba(224,27,34,0.6)'
                                      }}
                                    >
                                      ⚡ Finalize &amp; Submit Quiz
                                    </button>
                                  )}
                                </div>

                                {/* Hotkey reminder */}
                                <div style={{ fontSize: '0.72rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '14px', letterSpacing: '0.4px' }}>
                                  💡 Hotkeys: <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>←</kbd> <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>→</kbd> to Navigate • <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>1-4</kbd> / <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>A-D</kbd> to Select • <kbd style={{ background: 'rgba(255,255,255,0.08)', padding: '2px 6px', borderRadius: '4px' }}>F</kbd> to Flag
                                </div>
                              </div>
                            )
                          })()}
                        </div>

                        {/* RIGHT: Sticky Question Navigator Panel */}
                        <div style={{ position: 'sticky', top: '20px' }}>
                          <div style={{
                            background: 'linear-gradient(145deg, rgba(255,255,255,0.04) 0%, rgba(255,255,255,0.02) 100%)',
                            border: '1px solid rgba(255,255,255,0.09)',
                            borderRadius: '12px',
                            padding: '16px',
                            marginBottom: '14px',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.5)'
                          }}>
                            <div style={{ fontSize: '0.74rem', color: '#FACC15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '12px' }}>
                              Question Matrix ({prelimQuestions.length || 30})
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                              <span style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#4ADE80', display: 'inline-block' }} /> Answered
                              </span>
                              <span style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#FACC15', display: 'inline-block' }} /> Flagged
                              </span>
                              <span style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: 'rgba(255,255,255,0.12)', display: 'inline-block' }} /> Unanswered
                              </span>
                            </div>

                            {/* Number Grid */}
                            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(5, 1fr)', gap: '6px' }}>
                              {prelimQuestions.map((q, idx) => {
                                const isAnswered = !!prelimAnswers[q.id]
                                const isFlagged = flaggedQuestions.has(q.id)
                                const isCurrent = idx === currentPrelimIdx
                                let bg = 'rgba(255,255,255,0.06)'
                                let border = '1px solid rgba(255,255,255,0.1)'
                                let color = 'var(--text-secondary)'
                                if (isAnswered) { bg = 'rgba(74,222,128,0.16)'; border = '1px solid #4ADE80'; color = '#4ADE80' }
                                if (isFlagged && !isAnswered) { bg = 'rgba(250,204,21,0.18)'; border = '1.5px solid #FACC15'; color = '#FACC15' }
                                if (isFlagged && isAnswered) { bg = 'rgba(250,204,21,0.14)'; border = '1.8px solid #FACC15'; color = '#FACC15' }
                                if (isCurrent) { border = '2px solid #E01B22'; color = '#FFF' }
                                return (
                                  <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => handleSelectQuestion(idx)}
                                    style={{
                                      background: isCurrent ? 'rgba(224,27,34,0.3)' : bg,
                                      border,
                                      color,
                                      borderRadius: '6px',
                                      padding: '6px 2px',
                                      fontSize: '0.74rem',
                                      fontWeight: isCurrent ? '800' : '600',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease',
                                      lineHeight: '1',
                                      textAlign: 'center',
                                      boxShadow: isCurrent ? '0 0 10px rgba(224,27,34,0.5)' : 'none'
                                    }}
                                    title={`Q${idx + 1}: ${isAnswered ? 'Answered' : isFlagged ? 'Flagged' : 'Unanswered'}`}
                                  >
                                    {isFlagged ? '🚩' : idx + 1}
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Summary Stats */}
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress Telemetry</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#4ADE80' }}>✓ Answered</span>
                                <strong style={{ color: '#FFF' }}>{Object.keys(prelimAnswers).length}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#FACC15' }}>🚩 Flagged for Review</span>
                                <strong style={{ color: '#FFF' }}>{flaggedQuestions.size}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>○ Left Blank</span>
                                <strong style={{ color: '#FFF' }}>{Math.max(0, (prelimQuestions.length || 30) - Object.keys(prelimAnswers).length)}</strong>
                              </div>
                            </div>
                            <div className="arena-progress-container" style={{ margin: '10px 0 0', height: '6px' }}>
                              <div className="arena-progress-bar" style={{ width: `${(Object.keys(prelimAnswers).length / Math.max(prelimQuestions.length, 1)) * 100}%` }} />
                            </div>
                          </div>

                          {/* Final Submit Button in Navigator */}
                          <button
                            type="button"
                            className="btn-primary"
                            style={{ width: '100%', padding: '13px', fontSize: '0.92rem', borderRadius: '8px', boxShadow: '0 0 16px rgba(224,27,34,0.45)' }}
                            onClick={() => setShowConfirmSubmitModal(true)}
                          >
                            ⚡ Finalize &amp; Submit
                          </button>
                        </div>
                      </div>
                    </div>
                  )}

                  {prelimStatus === 'COMPLETED' && (
                    <div style={{ textAlign: 'center', padding: '30px 20px' }}>
                      <div className="lock-in-pulse" style={{ width: '84px', height: '84px', borderRadius: '50%', background: 'rgba(224,27,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '2.5px solid var(--color-primary-blue)' }}>
                        <svg width="40" height="40" viewBox="0 0 24 24" fill="none" stroke="var(--color-neon-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                          <polyline className="draw-check" points="20 6 9 17 4 12" />
                        </svg>
                      </div>
                      <h2 className="scale-pop" style={{ marginBottom: '12px', color: 'var(--color-neon-blue)', textTransform: 'uppercase', letterSpacing: '1px' }}>
                        Prelims Quiz Submitted!
                      </h2>
                      <p style={{ color: 'var(--text-secondary)', maxWidth: '500px', margin: '0 auto 20px', lineHeight: '1.6' }}>
                        Your answers have been stored and scored. Please wait for other participants to conclude. The screen will automatically progress when coordinators initiate Stage 1.
                      </p>
                      <div className="shimmer-bg" style={{ padding: '12px 24px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)' }}>
                        <span className="typing-cursor" style={{ fontSize: '0.85rem', color: '#FACC15', fontWeight: 'bold' }}>
                          Synchronizing with Main Leaderboard...
                        </span>
                      </div>
                    </div>
                  )}
                </div>
              </div>
            )}

            {/* STAGES 1 TO 4: LIVE PROJECTOR VISUAL QUESTIONS */}
            {gameState.activeRound > 1 && gameState.activeRound < 5 && (
              <div>
                {!gameState.activeQuestionId ? (
                  <div className="glass-panel" style={{ padding: '48px 32px', textAlign: 'center', marginTop: '30px' }}>
                    <div className="float-bounce" style={{ width: '70px', height: '70px', borderRadius: '50%', background: 'rgba(224, 27, 34, 0.12)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 20px', border: '1.5px solid rgba(224, 27, 34, 0.4)' }}>
                      <span style={{ fontSize: '1.8rem' }}>📡</span>
                    </div>
                    <h2 style={{ fontSize: '1.6rem', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '1px' }}>
                      {gameState.activeRound === 2 && 'Stage 1: Pixel Detective'}
                      {gameState.activeRound === 3 && 'Stage 2: The Glitch Hunt'}
                      {gameState.activeRound === 4 && 'Stage 3: Prompt Wars'}
                    </h2>
                    <p style={{ color: 'var(--text-secondary)', maxWidth: '520px', margin: '0 auto', lineHeight: '1.6' }}>
                      Synchronized to Main Stage Screen. Waiting for the organizers to launch the next visual challenge...
                    </p>
                    <div className="shimmer-bg" style={{ padding: '12px 24px', borderRadius: '8px', display: 'inline-block', border: '1px solid var(--card-border)', marginTop: '24px' }}>
                      <span className="typing-cursor" style={{ fontSize: '0.84rem', color: 'var(--color-neon-blue)', fontWeight: 'bold' }}>
                        Awaiting Next Neural Transmission
                      </span>
                    </div>
                  </div>
                ) : (
                  <div style={{ marginTop: '20px' }}>
                    {/* Header: Timer & Round info */}
                    <div className={`glass-panel ${timeLeft > 0 && timeLeft < 10 ? 'ring-pulse' : ''}`} style={{
                      padding: '16px 24px',
                      display: 'flex',
                      justifyContent: 'space-between',
                      alignItems: 'center',
                      marginBottom: '20px',
                      borderColor: timeLeft < 10 && timeLeft > 0 ? '#E01B22' : 'var(--card-border)'
                    }}>
                      <div>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '4px' }}>
                          <span className="badge badge-active" style={{ fontSize: '0.7rem', padding: '2px 8px' }}>
                            ROUND {gameState.activeRound - 1} ACTIVE
                          </span>
                          <span style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: 'bold' }}>
                            QUESTION #{gameState.activeQuestionId}
                          </span>
                        </div>
                        <h3 style={{ fontSize: '1.15rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                          {gameState.activeRound === 2 && 'Stage 1: Pixel Detective'}
                          {gameState.activeRound === 3 && 'Stage 2: The Glitch Hunt'}
                          {gameState.activeRound === 4 && 'Stage 3: Prompt Wars'}
                        </h3>
                      </div>

                      <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                        <div style={{ textAlign: 'right' }}>
                          <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>Countdown</span>
                          <div style={{
                            fontSize: '1.85rem',
                            fontWeight: '900',
                            fontFamily: 'var(--font-display)',
                            color: timeLeft < 10 ? 'var(--color-neon-blue)' : '#FFF',
                            textShadow: timeLeft < 10 && timeLeft > 0 ? '0 0 16px rgba(224,27,34,0.8)' : '0 0 8px rgba(255,255,255,0.2)'
                          }} className={timeLeft < 5 && timeLeft > 0 ? 'blink' : ''}>
                            {timeLeft > 0 ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}` : '00:00'}
                          </div>
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

                    {/* Image Viewport with Cyber Forensics Frame */}
                    {currentQuestion && (
                      <div className="flex-center" style={{ marginBottom: '24px' }}>
                        <div className="image-viewport-frame" style={{ width: '100%', maxWidth: '640px' }}>
                          <div className="hud-corner-tl" />
                          <div className="hud-corner-tr" />
                          <div className="hud-corner-bl" />
                          <div className="hud-corner-br" />
                          <div className="forensic-scan-line" />

                          {/* Top telemetry bar over image */}
                          <div style={{
                            position: 'absolute',
                            top: '10px',
                            left: '32px',
                            right: '32px',
                            display: 'flex',
                            justifyContent: 'space-between',
                            alignItems: 'center',
                            zIndex: 5,
                            pointerEvents: 'none'
                          }}>
                            <span style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid #E01B22', color: '#FF4D4D', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold', letterSpacing: '1px' }}>
                              NEURAL FORENSIC FEED • ACTIVE
                            </span>
                            {gameState.activeRound === 4 && (
                              <span style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid #FACC15', color: '#FACC15', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                FOCAL REVEAL: {gameState.zoomLevel || 10}%
                              </span>
                            )}
                          </div>

                          {currentQuestion.imageUrl ? (
                            gameState.activeRound === 4 ? (
                              <div style={{ width: '100%', height: '360px', overflow: 'hidden', position: 'relative' }}>
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
                              <div style={{ width: '100%', background: '#070405', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '300px' }}>
                                <img 
                                  src={`http://localhost:8080${currentQuestion.imageUrl}`} 
                                  alt="quiz visual" 
                                  style={{ width: '100%', height: 'auto', display: 'block', maxHeight: '420px', objectFit: 'contain' }}
                                />
                              </div>
                            )
                          ) : (
                            <div style={{ width: '100%', minHeight: '260px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                              <span className="pulse-dot" style={{ width: '12px', height: '12px', background: '#E01B22' }} />
                              <span style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Acquiring Visual Uplink...</span>
                            </div>
                          )}
                        </div>
                      </div>
                    )}

                    {/* SUBMITTED WAITING SCREEN (for image rounds) */}
                    {submitted ? (
                      <div className="glass-panel" style={{ padding: '36px', textAlign: 'center' }}>
                        <div className="lock-in-pulse" style={{ width: '80px', height: '80px', borderRadius: '50%', background: 'rgba(224,27,34,0.15)', display: 'flex', alignItems: 'center', justifyContent: 'center', margin: '0 auto 16px', border: '2px solid var(--color-primary-blue)' }}>
                          <svg width="36" height="36" viewBox="0 0 24 24" fill="none" stroke="var(--color-neon-blue)" strokeWidth="3" strokeLinecap="round" strokeLinejoin="round">
                            <polyline className="draw-check" points="20 6 9 17 4 12" />
                          </svg>
                        </div>
                        <h3 className="scale-pop" style={{ textTransform: 'uppercase', letterSpacing: '1px', color: '#FFF' }}>Response Locked In</h3>
                        <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', marginTop: '8px', maxWidth: '480px', margin: '8px auto 0' }}>
                          Your forensic analysis has been encrypted and submitted. Stand by for timer expiration or the next visual target!
                        </p>
                      </div>
                    ) : (
                      /* ACTIVE SUBMISSION FORM */
                      <div className="glass-panel" style={{ padding: '32px' }}>
                        {submitError && (
                          <div style={{ background: 'rgba(239, 68, 68, 0.15)', border: '1px solid #EF4444', color: '#FCA5A5', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '20px' }}>
                            {submitError}
                          </div>
                        )}

                        <form onSubmit={handleSubmitAnswer}>
                          {/* STAGE 1 FORM */}
                          {gameState.activeRound === 2 && (
                            <div>
                              <h4 style={{ fontSize: '1.05rem', marginBottom: '18px', color: '#fff', textAlign: 'center', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Forensic Classification: Authentic or Synthetic AI?
                              </h4>
                              
                              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px', marginBottom: '24px' }}>
                                <button
                                  type="button"
                                  className={`duel-choice-btn duel-choice-real ${round1Answer.chosen === 'REAL' ? 'active' : ''}`}
                                  onClick={() => setRound1Answer({ ...round1Answer, chosen: 'REAL' })}
                                >
                                  <span style={{ fontSize: '1.8rem' }}>📷</span>
                                  <span>Authentic Photo</span>
                                  <span style={{ fontSize: '0.72rem', opacity: 0.8, textTransform: 'none', fontWeight: 'normal' }}>Captured with optical camera</span>
                                </button>

                                <button
                                  type="button"
                                  className={`duel-choice-btn duel-choice-ai ${round1Answer.chosen === 'AI' ? 'active' : ''}`}
                                  onClick={() => {
                                    setRound1Answer({ ...round1Answer, chosen: 'AI' })
                                    setShowModelSelect(true)
                                  }}
                                >
                                  <span style={{ fontSize: '1.8rem' }}>🤖</span>
                                  <span>Synthetic AI</span>
                                  <span style={{ fontSize: '0.72rem', opacity: 0.8, textTransform: 'none', fontWeight: 'normal' }}>Diffusion / GAN Generated</span>
                                </button>
                              </div>

                              {/* Bonus Model Guess */}
                              {round1Answer.chosen === 'AI' && (
                                <div style={{ animation: 'staggerFadeIn 0.3s ease-out', marginTop: '20px', background: 'rgba(255,255,255,0.02)', padding: '18px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.25)' }}>
                                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                                    <label className="form-label" style={{ color: '#38BDF8', fontWeight: 'bold' }}>
                                      🎯 {currentQuestion?.bonusQuestion || 'Identify the AI Generator Model (+Bonus Pts)'}:
                                    </label>
                                    {round1Answer.bonus && (
                                      <span style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: 'bold' }}>
                                        Selected: {round1Answer.bonus}
                                      </span>
                                    )}
                                  </div>

                                  <div className="model-grid">
                                    {[
                                      { name: 'Midjourney', icon: '🎨' },
                                      { name: 'DALL-E 3', icon: '🌌' },
                                      { name: 'Stable Diffusion', icon: '⚡' },
                                      { name: 'Adobe Firefly', icon: '🔥' },
                                      { name: 'Flux', icon: '🔮' },
                                      { name: 'Claude', icon: '🧠' },
                                      { name: 'Gemini', icon: '💎' },
                                      { name: 'ChatGPT', icon: '💬' }
                                    ].map(m => (
                                      <button
                                        key={m.name}
                                        type="button"
                                        className={`model-chip-btn ${round1Answer.bonus === m.name ? 'selected' : ''}`}
                                        onClick={() => setRound1Answer({ ...round1Answer, bonus: m.name })}
                                      >
                                        <span>{m.icon}</span>
                                        <span>{m.name}</span>
                                      </button>
                                    ))}
                                  </div>
                                </div>
                              )}
                            </div>
                          )}

                          {/* STAGE 2 FORM */}
                          {gameState.activeRound === 3 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>
                                  Glitch Hunt: Document Neural Artifacts &amp; Visual Anomalies
                                </h4>
                                {currentQuestion?.isLightning && (
                                  <span className="shimmer-badge" style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', color: '#FACC15', border: '1px solid #FACC15' }}>
                                    ⚡ LIGHTNING ROUND • SPEED BONUS
                                  </span>
                                )}
                              </div>

                              {/* Quick helper tags */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Quick Insert:</span>
                                {[
                                  'Asymmetrical iris reflections',
                                  'Extra / melted knuckles',
                                  'Collar edge blending artifact',
                                  'Inconsistent directional shadow',
                                  'Warped background lines',
                                  'Excessive synthetic skin blur'
                                ].map(tag => (
                                  <button
                                    key={tag}
                                    type="button"
                                    className="quick-tag-chip"
                                    onClick={() => {
                                      setTextSubmission(prev => prev ? `${prev}, ${tag}` : tag)
                                    }}
                                  >
                                    + {tag}
                                  </button>
                                ))}
                              </div>

                              <div className="cyber-terminal-container">
                                <div className="cyber-terminal-header">
                                  <span>FORENSIC LOG • REPORT ENTRY</span>
                                  <span>{textSubmission.length} chars</span>
                                </div>
                                <textarea
                                  className="cyber-terminal-textarea"
                                  rows={4}
                                  required
                                  value={textSubmission}
                                  onChange={(e) => setTextSubmission(e.target.value)}
                                  placeholder="Describe anomalous reflections, bad shadows, extra fingers, text warping, etc..."
                                />
                              </div>
                            </div>
                          )}

                          {/* STAGE 3 FORM */}
                          {gameState.activeRound === 4 && (
                            <div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                                <h4 style={{ fontSize: '1.05rem', color: '#fff' }}>
                                  Prompt Wars • Reverse-Engineer the Generation Tokens
                                </h4>
                                <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 'bold' }}>
                                  Resolution Stage: {gameState.zoomLevel || 10}%
                                </span>
                              </div>

                              {/* Quick prompt token chips */}
                              <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '12px' }}>
                                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', alignSelf: 'center' }}>Key Tokens:</span>
                                {[
                                  'cinematic lighting',
                                  'volumetric fog',
                                  'octane render 3D',
                                  'photorealistic 8k',
                                  'macro close-up',
                                  'cyberpunk neon palette',
                                  'shallow depth of field'
                                ].map(token => (
                                  <button
                                    key={token}
                                    type="button"
                                    className="quick-tag-chip"
                                    onClick={() => {
                                      setTextSubmission(prev => prev ? `${prev}, ${token}` : token)
                                    }}
                                  >
                                    + {token}
                                  </button>
                                ))}
                              </div>

                              <div className="cyber-terminal-container">
                                <div className="cyber-terminal-header">
                                  <span>PROMPT SYNTAX BUFFER</span>
                                  <span>{textSubmission.length} chars</span>
                                </div>
                                <textarea
                                  className="cyber-terminal-textarea"
                                  rows={4}
                                  required
                                  value={textSubmission}
                                  onChange={(e) => setTextSubmission(e.target.value)}
                                  placeholder="Write the prompt tokens, subject, medium, lighting, and camera composition here..."
                                />
                              </div>
                            </div>
                          )}

                          <button 
                            type="submit" 
                            className="btn-primary" 
                            style={{ width: '100%', marginTop: '20px', padding: '14px', fontSize: '1.02rem' }}
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

      {/* ========================================================= */}
      {/* TOURNAMENT PROTOCOL ACKNOWLEDGEMENT POPUP MODAL          */}
      {/* ========================================================= */}
      {showAcknowledgeModal && (
        <div style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100%',
          height: '100%',
          background: 'rgba(5, 2, 4, 0.88)',
          backdropFilter: 'blur(12px)',
          zIndex: 9999,
          display: 'flex',
          alignItems: 'center',
          justifyContent: 'center',
          padding: '20px'
        }}>
          <div className="comic-card" style={{
            maxWidth: '580px',
            width: '100%',
            background: '#0F080B',
            border: '2px solid #E01B22',
            borderRadius: '16px',
            padding: '28px',
            boxShadow: '0 20px 50px rgba(0,0,0,0.95), 0 0 32px rgba(224, 27, 34, 0.4)',
            animation: 'scalePop 0.3s cubic-bezier(0.34, 1.56, 0.64, 1)',
            position: 'relative'
          }}>
            {/* Top Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '18px', borderBottom: '1px solid rgba(224, 27, 34, 0.3)', paddingBottom: '14px' }}>
              <span style={{ fontSize: '2.2rem' }}>🛡️</span>
              <div>
                <h3 style={{ fontSize: '1.35rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Tournament Protocol Acknowledgement
                </h3>
                <span style={{ fontSize: '0.75rem', color: '#FACC15', fontWeight: '800', letterSpacing: '1px' }}>
                  LOGIN 2026 • STAGE 0 PRELIMS CONTEXT
                </span>
              </div>
            </div>

            {/* Context & Ground Rules */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '20px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #38BDF8' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px' }}>⏱️ Strict 30-Minute Timer</strong>
                Your personal countdown begins immediately upon confirmation. Once active, the timer cannot be paused, reset, or refreshed. The quiz auto-submits strictly at 00:00.
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #EF4444' }}>
                <strong style={{ color: '#FF4D4D', display: 'block', marginBottom: '2px' }}>⚠️ Scoring &amp; Penalty Context</strong>
                Each correct answer awards <strong>+10 Points</strong>. Each incorrect guess deducts <strong>-5 Points (Negative Marking)</strong>. Unanswered questions yield 0 points. Do not blind-guess!
              </div>

              <div style={{ background: 'rgba(255, 255, 255, 0.03)', padding: '12px 14px', borderRadius: '8px', borderLeft: '3px solid #FACC15' }}>
                <strong style={{ color: '#FACC15', display: 'block', marginBottom: '2px' }}>📷 Automated Silent Invigilation</strong>
                Webcam snapshots are captured periodically in the background during the test to verify academic honesty and individual completion.
              </div>
            </div>

            {/* Required Consent Checkbox */}
            <label style={{
              display: 'flex',
              alignItems: 'flex-start',
              gap: '12px',
              background: hasAcknowledged ? 'rgba(74, 222, 128, 0.12)' : 'rgba(224, 27, 34, 0.08)',
              border: `1.5px solid ${hasAcknowledged ? '#4ADE80' : 'rgba(224, 27, 34, 0.5)'}`,
              borderRadius: '10px',
              padding: '14px',
              cursor: 'pointer',
              transition: 'all 0.25s ease',
              marginBottom: '22px'
            }}>
              <input 
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '18px',
                  height: '18px',
                  cursor: 'pointer',
                  accentColor: '#E01B22'
                }}
              />
              <span style={{ fontSize: '0.86rem', color: '#FFF', lineHeight: '1.45' }}>
                I have read and acknowledge the tournament context: <strong>30 questions in 30 minutes</strong>, the <strong>-5 penalty for wrong answers</strong>, and consent to <strong>automated webcam proctoring</strong>.
              </span>
            </label>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'flex-end', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => {
                  setShowAcknowledgeModal(false)
                  setHasAcknowledged(false)
                }}
                style={{ padding: '10px 20px', fontSize: '0.88rem' }}
              >
                Cancel / Return
              </button>
              <button
                type="button"
                className="btn-primary"
                disabled={!hasAcknowledged}
                onClick={() => {
                  setShowAcknowledgeModal(false)
                  handlePrelimStart()
                }}
                style={{
                  padding: '10px 24px',
                  fontSize: '0.92rem',
                  opacity: hasAcknowledged ? 1 : 0.45,
                  cursor: hasAcknowledged ? 'pointer' : 'not-allowed',
                  boxShadow: hasAcknowledged ? '0 0 20px rgba(224, 27, 34, 0.65)' : 'none'
                }}
              >
                Confirm &amp; Launch Quiz 🚀
              </button>
            </div>
          </div>
        </div>
      )}

      {/* ========================================================= */}
      {/* STAGE 0 SUBMIT CONFIRMATION MODAL                         */}
      {/* ========================================================= */}
      {showConfirmSubmitModal && (
        <div className="quiz-confirm-backdrop">
          <div className="quiz-confirm-modal">
            <div style={{ display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '56px', height: '56px', borderRadius: '50%', background: 'rgba(224,27,34,0.15)', border: '2px solid #E01B22', margin: '0 auto 16px', boxShadow: '0 0 20px rgba(224,27,34,0.4)' }}>
              <span style={{ fontSize: '1.8rem' }}>🔒</span>
            </div>

            <h3 style={{ fontSize: '1.4rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
              Finalize Stage 0 Prelims?
            </h3>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5', marginBottom: '20px' }}>
              Review your submission telemetry before locking in your answers. Once submitted, answers cannot be edited.
            </p>

            {/* Telemetry Breakdown Card */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(3, 1fr)',
              gap: '10px',
              marginBottom: '20px',
              textAlign: 'center'
            }}>
              <div style={{ background: 'rgba(74,222,128,0.1)', border: '1px solid #4ADE80', borderRadius: '8px', padding: '12px 8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#4ADE80', fontWeight: 'bold' }}>ANSWERED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFF' }}>{Object.keys(prelimAnswers).length}</div>
                <div style={{ fontSize: '0.65rem', color: '#86EFAC' }}>+10 pts if correct</div>
              </div>

              <div style={{ background: 'rgba(250,204,21,0.1)', border: '1px solid #FACC15', borderRadius: '8px', padding: '12px 8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#FACC15', fontWeight: 'bold' }}>FLAGGED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFF' }}>{flaggedQuestions.size}</div>
                <div style={{ fontSize: '0.65rem', color: '#FDE047' }}>Needs review</div>
              </div>

              <div style={{ background: 'rgba(255,255,255,0.04)', border: '1px solid rgba(255,255,255,0.15)', borderRadius: '8px', padding: '12px 8px' }}>
                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', fontWeight: 'bold' }}>LEFT BLANK</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFF' }}>
                  {Math.max(0, (prelimQuestions.length || 30) - Object.keys(prelimAnswers).length)}
                </div>
                <div style={{ fontSize: '0.65rem', color: 'var(--text-dim)' }}>0 pts (Safe)</div>
              </div>
            </div>

            {/* Negative Marking Reassurance Alert */}
            <div style={{
              background: 'rgba(224, 27, 34, 0.08)',
              border: '1px solid rgba(224, 27, 34, 0.35)',
              borderRadius: '8px',
              padding: '12px 14px',
              textAlign: 'left',
              marginBottom: '24px',
              fontSize: '0.82rem',
              color: 'var(--text-secondary)',
              lineHeight: '1.45'
            }}>
              <strong style={{ color: '#FF6B6B', display: 'block', marginBottom: '2px' }}>⚠️ Scoring Reminder:</strong>
              Leaving questions blank protects your team average from the <strong>-5 penalty</strong>. Random guesses can severely harm your placement!
            </div>

            {/* Action Buttons */}
            <div style={{ display: 'flex', justifyContent: 'center', gap: '12px' }}>
              <button
                type="button"
                className="btn-secondary"
                onClick={() => setShowConfirmSubmitModal(false)}
                style={{ padding: '11px 22px', fontSize: '0.88rem' }}
              >
                ← Keep Reviewing
              </button>
              <button
                type="button"
                className="btn-primary"
                onClick={handlePrelimSubmit}
                style={{
                  padding: '11px 26px',
                  fontSize: '0.92rem',
                  boxShadow: '0 0 20px rgba(224, 27, 34, 0.6)'
                }}
              >
                ⚡ Yes, Lock In &amp; Submit
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  )
}
