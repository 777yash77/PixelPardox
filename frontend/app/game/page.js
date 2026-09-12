'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'
import { API_BASE_URL, WS_BASE_URL } from '@/lib/api'

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
  const [myAttempt, setMyAttempt] = useState(null)
  const [isDebriefRefreshing, setIsDebriefRefreshing] = useState(false)

  // Stage 0 Matrix Filter & Forensic Optics State
  const [matrixFilter, setMatrixFilter] = useState('ALL') // ALL, UNANSWERED, FLAGGED
  const [forensicZoom, setForensicZoom] = useState(1) // 1, 1.5, 2, 3
  const [forensicFilter, setForensicFilter] = useState('NORMAL') // NORMAL, CONTRAST, MONO, INVERT

  // Webcam & Question Transition Refs
  const videoRef = useRef(null)
  const canvasRef = useRef(null)
  const webcamStreamRef = useRef(null)
  const lastQuestionIdRef = useRef(null)

  // WebSocket Ref
  const wsRef = useRef(null)

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
            await fetch(`${API_BASE_URL}/api/game/prelims/video`, {
              method: 'POST',
              headers: { 'Authorization': `Bearer ${token}` },
              body: formData
            });
          } catch (err) {
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
    const storedTeamId = localStorage.getItem('teamId') || 'squad'
    const savedAnswers = localStorage.getItem('prelimAnswers_' + storedParticipant)
      || (storedTeamId ? localStorage.getItem('prelimAnswers_team_' + storedTeamId) : null)
      || localStorage.getItem('prelimAnswers_latest')
    if (savedAnswers) {
      try {
        setPrelimAnswers(JSON.parse(savedAnswers))
      } catch (e) {
        console.error("Failed to parse saved prelim answers", e)
      }
    }
    const savedFlagged = localStorage.getItem('prelimFlagged_' + storedParticipant)
      || (storedTeamId ? localStorage.getItem('prelimFlagged_team_' + storedTeamId) : null)
    if (savedFlagged) {
      try {
        setFlaggedQuestions(new Set(JSON.parse(savedFlagged)))
      } catch (e) {
        console.error("Failed to parse saved prelim flagged questions", e)
      }
    }
    const savedIdx = localStorage.getItem('prelimIdx_' + storedParticipant)
      || (storedTeamId ? localStorage.getItem('prelimIdx_team_' + storedTeamId) : null)
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
    checkPrelimAttempt(storedToken, storedParticipant)

    // Start Webcam
    startWebcam()

    return () => {
      stopWebcam()
    }
  }, [])

  const startWebcam = async () => {
    try {
      const stream = await navigator.mediaDevices.getUserMedia({ video: true })
      webcamStreamRef.current = stream
      if (videoRef.current) {
        videoRef.current.srcObject = stream
      }
    } catch (err) {
      console.error("Webcam access denied:", err)
    }
  }

  const stopWebcam = () => {
    if (webcamStreamRef.current) {
      webcamStreamRef.current.getTracks().forEach(track => track.stop())
      webcamStreamRef.current = null
    }
    if (videoRef.current && videoRef.current.srcObject) {
      videoRef.current.srcObject.getTracks().forEach(track => track.stop())
      videoRef.current.srcObject = null
    }
  }

  // 2. Sync active question details when activeQuestionId changes
  useEffect(() => {
    if (gameState.activeQuestionId) {
      const q = questions.find(item => item.id === gameState.activeQuestionId)
      if (q) {
        setCurrentQuestion(q)
        if (lastQuestionIdRef.current !== gameState.activeQuestionId) {
          lastQuestionIdRef.current = gameState.activeQuestionId
          setSubmitted(false) // reset submission flag only when question actually changes
          setSubmitError('')
          setRound1Answer({ chosen: '', bonus: '' })
          setTextSubmission('')
          setShowModelSelect(false)
          setForensicZoom(1)
          setForensicFilter('NORMAL')
        }
      } else if (token) {
        // If the question isn't in our local state, fetch questions
        fetchQuestions(token)
      }
    } else {
      lastQuestionIdRef.current = null
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

  // Camera broadcasting for live invigilation grid
  useEffect(() => {
    if (prelimStatus === 'COMPLETED') return

    const interval = setInterval(() => {
      if (wsRef.current && wsRef.current.readyState === WebSocket.OPEN && videoRef.current && canvasRef.current && (team.teamId || team.id)) {
        try {
          const context = canvasRef.current.getContext('2d')
          context.drawImage(videoRef.current, 0, 0, 160, 120) // low res
          const frame = canvasRef.current.toDataURL('image/jpeg', 0.5)
          wsRef.current.send(JSON.stringify({
            type: 'CAMERA_FRAME',
            payload: { teamId: team.teamId || team.id, participantName, frame }
          }))
        } catch (e) {
          // Ignore frame capture issues
        }
      }
    }, 5000) // every 5 seconds
    return () => clearInterval(interval)
  }, [team.teamId, team.id, participantName, prelimStatus])

  // 4. HTTP API calls
  const fetchTeamProfile = async (tok) => {
    const authToken = tok || token || (typeof window !== 'undefined' ? localStorage.getItem('token') : null)
    const pName = participantName || (typeof window !== 'undefined' ? localStorage.getItem('participantName') : '')
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/my-team`, {
        headers: authToken ? { 'Authorization': `Bearer ${authToken}` } : {}
      })
      if (res.ok) {
        const profile = await res.json()
        setTeam(profile)
        if (profile.attempts && Array.isArray(profile.attempts) && pName) {
          const matchedAttempt = profile.attempts.find(a => a.participantName?.toLowerCase() === pName.toLowerCase())
          if (matchedAttempt) {
            setMyAttempt(matchedAttempt)
            if (matchedAttempt.status === 'COMPLETED') {
              setPrelimStatus('COMPLETED')
              stopWebcam()
            }
          }
        }
      } else {
        const teamId = localStorage.getItem('teamId')
        const storedTeamName = localStorage.getItem('teamName') || ''
        setTeam(prev => ({
          ...prev,
          teamId: teamId || prev.teamId,
          teamName: storedTeamName || prev.teamName
        }))
      }
    } catch (e) {
      console.error(e)
    }
  }

  const checkPrelimAttempt = async (tok, pName) => {
    if (!tok || !pName || pName === 'Unknown') return
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/prelims/attempt?participantName=${encodeURIComponent(pName)}`, {
        headers: { 'Authorization': `Bearer ${tok}` }
      })
      if (res.ok) {
        const attempt = await res.json()
        setMyAttempt(attempt)
        if (attempt.status === 'COMPLETED') {
          setPrelimStatus('COMPLETED')
          stopWebcam()
          localStorage.removeItem('prelimStartTime_' + pName)
          localStorage.removeItem('prelimAnswers_' + pName)
          localStorage.removeItem('prelimFlagged_' + pName)
          localStorage.removeItem('prelimIdx_' + pName)
          fetchTeamProfile(tok)
        } else if (attempt.status === 'IN_PROGRESS' && attempt.startedAt) {
          const elapsed = Math.floor((Date.now() - attempt.startedAt) / 1000)
          if (elapsed < 1800) {
            setPrelimTimeLeft(1800 - elapsed)
            setPrelimStatus('IN_PROGRESS')
            localStorage.setItem('prelimStartTime_' + pName, attempt.startedAt.toString())
          } else {
            setPrelimTimeLeft(0)
            setPrelimStatus('COMPLETED')
            stopWebcam()
            fetchTeamProfile(tok)
          }
        }
      }
    } catch (e) {
      console.error('Failed to check prelim attempt', e)
    }
  }

  const fetchGameState = async () => {
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/state`)
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
      const res = await fetch(`${API_BASE_URL}/api/game/images`, {
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
      const res = await fetch(`${API_BASE_URL}/api/game/prelims/questions`, {
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

  // 5. Native WebSocket implementation
  useEffect(() => {
    let isMounted = true;
    let reconnectTimeout = null;

    const setupWebSocket = () => {
      const ws = new WebSocket(WS_BASE_URL)
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
          // Refresh team's own secure profile when scores change
          fetchTeamProfile(token)
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
      const res = await fetch(`${API_BASE_URL}/api/game/submit`, {
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
      const res = await fetch(`${API_BASE_URL}/api/game/prelims/start`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantName })
      })
      if (res.ok) {
        const attempt = await res.json()
        if (attempt.status === 'COMPLETED') {
          setPrelimStatus('COMPLETED')
          stopWebcam()
          localStorage.removeItem('prelimStartTime_' + participantName)
          localStorage.removeItem('prelimAnswers_' + participantName)
          localStorage.removeItem('prelimFlagged_' + participantName)
          localStorage.removeItem('prelimIdx_' + participantName)
          return
        }
        const startEpoch = attempt.startedAt || Date.now()
        localStorage.setItem('prelimStartTime_' + participantName, startEpoch.toString())
        const elapsed = Math.floor((Date.now() - startEpoch) / 1000)
        setPrelimTimeLeft(Math.max(0, 1800 - elapsed))
        setPrelimStatus('IN_PROGRESS')
      } else {
        const data = await res.json()
        const msg = data.message || ''
        const lowerMsg = msg.toLowerCase()
        if (lowerMsg.includes('already attended') || lowerMsg.includes('already submitted') || lowerMsg.includes('completed')) {
          setPrelimStatus('COMPLETED')
          stopWebcam()
          fetchTeamProfile(token)
          alert(msg || 'You have already attended and completed the quiz.')
        } else {
          alert(msg || 'Unable to start quiz attempt.')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to tournament server: ' + err.message)
    }
  }

  // Resilient multi-key local storage sync for Stage 0 Prelims
  const saveAnswersLocally = (answers) => {
    if (typeof window === 'undefined') return
    const json = JSON.stringify(answers)
    const pName = participantName || localStorage.getItem('participantName')
    if (pName && pName !== 'Unknown') {
      localStorage.setItem('prelimAnswers_' + pName, json)
    }
    const tId = localStorage.getItem('teamId')
    if (tId) {
      localStorage.setItem('prelimAnswers_team_' + tId, json)
    }
    localStorage.setItem('prelimAnswers_latest', json)
  }

  // Sync answers to state & localStorage
  const handleAnswerSelect = (questionId, optionValue) => {
    setPrelimAnswers(prev => {
      const next = { ...prev, [questionId]: optionValue }
      saveAnswersLocally(next)
      return next
    })
  }

  // Clear answer from question
  const handleClearAnswer = (questionId) => {
    setPrelimAnswers(prev => {
      const next = { ...prev }
      delete next[questionId]
      saveAnswersLocally(next)
      return next
    })
  }

  // Toggle flag status for question
  const handleToggleFlag = (questionId) => {
    setFlaggedQuestions(prev => {
      const next = new Set(prev)
      if (next.has(questionId)) next.delete(questionId)
      else next.add(questionId)
      const json = JSON.stringify(Array.from(next))
      const pName = participantName || localStorage.getItem('participantName')
      if (pName && pName !== 'Unknown') {
        localStorage.setItem('prelimFlagged_' + pName, json)
      }
      const tId = localStorage.getItem('teamId')
      if (tId) {
        localStorage.setItem('prelimFlagged_team_' + tId, json)
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
    stopWebcam()
    try {
      const res = await fetch(`${API_BASE_URL}/api/game/prelims/submit`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${token}` },
        body: JSON.stringify({ participantName, answers: prelimAnswers })
      })
      if (res.ok) {
        const attempt = await res.json()
        setMyAttempt(attempt)
        setPrelimStatus('COMPLETED')
        const clearPrelimStorage = () => {
          if (participantName) {
            localStorage.removeItem('prelimStartTime_' + participantName)
            localStorage.removeItem('prelimAnswers_' + participantName)
            localStorage.removeItem('prelimFlagged_' + participantName)
            localStorage.removeItem('prelimIdx_' + participantName)
          }
          const tId = localStorage.getItem('teamId')
          if (tId) {
            localStorage.removeItem('prelimAnswers_team_' + tId)
            localStorage.removeItem('prelimFlagged_team_' + tId)
            localStorage.removeItem('prelimIdx_team_' + tId)
          }
          localStorage.removeItem('prelimAnswers_latest')
        }
        clearPrelimStorage()
        fetchTeamProfile(token)
      } else {
        const data = await res.json()
        const msg = data.message || ''
        const lowerMsg = msg.toLowerCase()
        if (lowerMsg.includes('already submitted') || lowerMsg.includes('completed') || lowerMsg.includes('already attended')) {
          setPrelimStatus('COMPLETED')
          stopWebcam()
          if (participantName) {
            localStorage.removeItem('prelimStartTime_' + participantName)
            localStorage.removeItem('prelimAnswers_' + participantName)
            localStorage.removeItem('prelimFlagged_' + participantName)
            localStorage.removeItem('prelimIdx_' + participantName)
          }
          const tId = localStorage.getItem('teamId')
          if (tId) {
            localStorage.removeItem('prelimAnswers_team_' + tId)
            localStorage.removeItem('prelimFlagged_team_' + tId)
            localStorage.removeItem('prelimIdx_team_' + tId)
          }
          localStorage.removeItem('prelimAnswers_latest')
          fetchTeamProfile(token)
        } else {
          alert(msg || 'Failed to submit quiz attempt.')
        }
      }
    } catch (err) {
      console.error(err)
      alert('Failed to connect to tournament server: ' + err.message)
    }
  }

  // Live polling for squad debrief when prelims are completed
  useEffect(() => {
    if (prelimStatus !== 'COMPLETED' || !token) return
    fetchTeamProfile(token)
    const interval = setInterval(() => {
      fetchTeamProfile(token)
    }, 4000)
    return () => clearInterval(interval)
  }, [prelimStatus, token, participantName])

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
              <span style={{ fontSize: '0.72rem', color: '#F97316', fontWeight: 'bold', letterSpacing: '1px' }}>
                LOGIN 2026 • NEURAL ARENA
              </span>
            </div>
            <h2 style={{ fontSize: '1.25rem', textTransform: 'uppercase', letterSpacing: '1px', display: 'flex', alignItems: 'center', gap: '8px' }} className="glitch-text" data-text={`TEAM: ${team.teamName}`}>
              <span>TEAM: {team.teamName}</span>
              {participantName && (
                <span style={{ fontSize: '0.74rem', color: 'var(--text-secondary)', fontWeight: '600', background: 'rgba(255,255,255,0.06)', padding: '2px 8px', borderRadius: '4px', textTransform: 'none' }}>
                  Member: {participantName}
                </span>
              )}
            </h2>
          </div>
        </div>

        <div style={{ display: 'flex', alignItems: 'center', gap: '16px' }}>
          <div style={{ display: 'flex', gap: '8px' }}>
            <button
              type="button"
              onClick={() => setShowAcknowledgeModal(true)}
              style={{
                background: 'rgba(249, 115, 22, 0.12)',
                border: '1px solid #F97316',
                color: '#F97316',
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
            <span style={{ fontSize: '0.68rem', color: '#F97316', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px', display: 'block' }}>
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
      <main className={`container ${(gameState.activeRound >= 1 && gameState.activeRound <= 4) ? 'quiz-container-wide' : ''}`} style={{ flex: 1, display: 'grid', gridTemplateColumns: '1fr', paddingBottom: '60px' }}>

        {/* ELIMINATED VIEW */}
        {team.isEliminated ? (
          <div className="glass-panel" style={{ padding: '40px', textAlign: 'center', margin: '40px auto', maxWidth: '600px', border: '1px solid var(--color-primary-blue)' }}>
            <span className="badge badge-eliminated" style={{ padding: '8px 16px', fontSize: '0.9rem', marginBottom: '16px' }}>Eliminated</span>
            <h2 className="glitch-text" data-text="GAME OVER FOR TEAM" style={{ fontSize: '2rem', marginBottom: '12px', textTransform: 'uppercase' }}>Game Over for Team</h2>
            <p style={{ color: 'var(--text-secondary)', lineHeight: 1.6, marginBottom: '24px' }}>
              Your team has been eliminated in the qualification round. You can continue spectating the remaining rounds on the projector display.
            </p>
            <div style={{ borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
              <h3 style={{ fontSize: '1.2rem', marginBottom: '12px', textTransform: 'uppercase' }}>Auditorium Telemetry</h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', lineHeight: 1.6, maxWidth: '480px', margin: '0 auto' }}>
                Official tournament progression and live standings are broadcasted live on the main auditorium stage screen.
              </p>
            </div>
          </div>
        ) : (
          /* GAME STATE VIEWS */
          <div style={{ maxWidth: (gameState.activeRound >= 1 && gameState.activeRound <= 4) ? '1560px' : '1100px', margin: '0 auto', width: '100%', transition: 'max-width 0.3s ease' }}>

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
                  <span className="shimmer-badge" style={{ padding: '4px 14px', borderRadius: '6px', fontSize: '0.78rem', color: '#F97316', border: '1px solid #F97316' }}>
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
                    <div style={{ fontSize: '0.72rem', color: '#F97316' }}>+10 Correct / -5 Wrong</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.3)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 'bold' }}>STAGE 1: DETECTIVE</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>10 Pixels / 40s</div>
                    <div style={{ fontSize: '0.72rem', color: '#7DD3FC' }}>Authenticity &amp; Model ID</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(56,189,248,0.25)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 'bold' }}>STAGE 2: INPAINTING</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>7 Challenges / 45s</div>
                    <div style={{ fontSize: '0.72rem', color: '#BAE6FD' }}>Glitch Artifact Scan</div>
                  </div>

                  <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(249,115,22,0.35)', borderRadius: '8px', padding: '12px 14px' }}>
                    <div style={{ fontSize: '0.7rem', color: '#F97316', fontWeight: 'bold' }}>STAGE 3: PROMPT DUEL</div>
                    <div style={{ fontSize: '0.95rem', fontWeight: 'bold', color: '#FFF' }}>5 Prompts / 75s</div>
                    <div style={{ fontSize: '0.72rem', color: '#FB923C' }}>Semantic Prompt Match</div>
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
                          <div style={{ background: 'rgba(249, 115, 22, 0.12)', border: '1px solid #F97316', borderRadius: '6px', padding: '10px 12px' }}>
                            <div style={{ fontSize: '0.72rem', color: '#FB923C', fontWeight: 'bold' }}>UNANSWERED</div>
                            <div style={{ fontSize: '1.15rem', color: '#FFF', fontWeight: 'bold' }}>0 Points (Safe)</div>
                          </div>
                        </div>
                        <ul style={{ margin: 0, paddingLeft: '18px', color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.6' }}>
                          <li><strong>30 Questions:</strong> Thoroughly test AI fundamentals, diffusion architectures, GANs, and deepfake forensics.</li>
                          <li><strong>Strict 30-Minute Timer:</strong> Quiz auto-submits precisely when the countdown reaches 00:00.</li>
                          <li><strong>Squad Summation:</strong> Final team prelim score is the sum of all teammates' scores added directly together.</li>
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
                              color: prelimTimeLeft < 300 ? '#EF4444' : '#F97316',
                              textShadow: prelimTimeLeft < 300 ? '0 0 12px rgba(239, 68, 68, 0.8)' : '0 0 10px rgba(249, 115, 22, 0.45)'
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
                          <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>{Math.round((Object.keys(prelimAnswers).length / 30) * 100)}% Complete</span>
                        </div>
                        <div className="arena-progress-container" style={{ margin: 0 }}>
                          <div className="arena-progress-bar" style={{ width: `${(Object.keys(prelimAnswers).length / 30) * 100}%` }} />
                        </div>
                      </div>

                      {/* Single-Question Navigator Layout */}
                      <div className="quiz-stage-layout">

                        {/* LEFT: Single Question Panel */}
                        <div>
                          {prelimQuestions.length === 0 ? (
                            <div className="glass-panel" style={{ padding: '40px', textAlign: 'center' }}>
                              <div className="pulse-glow" style={{ width: '40px', height: '40px', borderRadius: '50%', background: '#E01B22', margin: '0 auto 16px' }} />
                              <div style={{ color: '#F97316', fontWeight: 'bold', fontSize: '1.05rem', marginBottom: '6px' }}>
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
                                <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
                                    <span style={{
                                      background: isAnswered ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255, 255, 255, 0.06)',
                                      color: isAnswered ? '#38BDF8' : '#FFF',
                                      fontSize: '0.82rem',
                                      fontWeight: '800',
                                      padding: '6px 16px',
                                      borderRadius: '8px',
                                      border: `1.5px solid ${isAnswered ? '#38BDF8' : 'rgba(255,255,255,0.18)'}`,
                                      letterSpacing: '0.6px'
                                    }}>
                                      QUESTION {safeIdx + 1} OF {totalQuestions}
                                    </span>
                                    {isAnswered && (
                                      <span style={{ fontSize: '0.82rem', color: '#38BDF8', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        ✓ Answered
                                      </span>
                                    )}
                                    {isFlagged && (
                                      <span style={{ fontSize: '0.82rem', color: '#F97316', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '4px' }}>
                                        🚩 Flagged for Review
                                      </span>
                                    )}
                                    {!isAnswered && !isFlagged && (
                                      <span style={{ fontSize: '0.82rem', color: 'var(--text-dim)' }}>○ Not answered</span>
                                    )}
                                  </div>

                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px', flexWrap: 'wrap' }}>
                                    {/* Flag / Unflag Button */}
                                    <button
                                      type="button"
                                      onClick={() => handleToggleFlag(q.id)}
                                      style={{
                                        background: isFlagged ? 'rgba(249, 115, 22, 0.2)' : 'rgba(255,255,255,0.05)',
                                        border: `1.5px solid ${isFlagged ? '#F97316' : 'rgba(255,255,255,0.14)'}`,
                                        color: isFlagged ? '#F97316' : 'var(--text-secondary)',
                                        padding: '6px 14px',
                                        borderRadius: '6px',
                                        fontSize: '0.8rem',
                                        fontWeight: 'bold',
                                        cursor: 'pointer',
                                        transition: 'all 0.2s ease',
                                        display: 'flex',
                                        alignItems: 'center',
                                        gap: '6px',
                                        boxShadow: isFlagged ? '0 0 12px rgba(249, 115, 22, 0.4)' : 'none'
                                      }}
                                      title="Shortcut: Press 'F' to toggle flag"
                                    >
                                      {isFlagged ? '🚩 Flagged (Press F)' : '🏳️ Flag for Review (F)'}
                                    </button>
                                  </div>
                                </div>

                                {/* Question Text Card */}
                                <div style={{
                                  background: 'linear-gradient(145deg, rgba(255,255,255,0.05) 0%, rgba(255,255,255,0.015) 100%)',
                                  border: '1.5px solid rgba(255, 255, 255, 0.1)',
                                  borderRadius: '12px',
                                  padding: '24px 28px',
                                  marginBottom: '20px',
                                  boxShadow: '0 8px 24px rgba(0, 0, 0, 0.4)'
                                }}>
                                  <p style={{ fontWeight: '600', fontSize: '1.14rem', color: 'var(--text-white)', lineHeight: '1.7', margin: 0 }}>
                                    {q.questionText}
                                  </p>
                                </div>

                                {/* Options in Responsive 2-Column Grid */}
                                <div className="quiz-options-grid">
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
                                          fontSize: '0.96rem',
                                          lineHeight: '1.5',
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
                                <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)', textAlign: 'center', marginTop: '16px', letterSpacing: '0.4px' }}>
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
                            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px', flexWrap: 'wrap', gap: '6px' }}>
                              <div style={{ fontSize: '0.74rem', color: '#F97316', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>
                                Question Matrix ({prelimQuestions.length || 30})
                              </div>
                              <span style={{ fontSize: '0.68rem', color: '#34D399', background: 'rgba(52, 211, 153, 0.1)', padding: '2px 6px', borderRadius: '4px', border: '1px solid rgba(52, 211, 153, 0.25)' }}>
                                💾 Auto-Saved
                              </span>
                            </div>

                            {/* Quick Filter Pills for Matrix */}
                            <div style={{ display: 'flex', gap: '4px', marginBottom: '12px' }}>
                              {[
                                { id: 'ALL', label: `All (${prelimQuestions.length || 30})` },
                                { id: 'UNANSWERED', label: `Blank (${Math.max(0, (prelimQuestions.length || 30) - Object.keys(prelimAnswers).length)})` },
                                { id: 'FLAGGED', label: `Flagged (${flaggedQuestions.size})` }
                              ].map(pill => (
                                <button
                                  key={pill.id}
                                  type="button"
                                  onClick={() => setMatrixFilter(pill.id)}
                                  style={{
                                    flex: 1,
                                    padding: '4px 2px',
                                    fontSize: '0.68rem',
                                    fontWeight: matrixFilter === pill.id ? 'bold' : 'normal',
                                    background: matrixFilter === pill.id ? 'rgba(56, 189, 248, 0.22)' : 'rgba(255, 255, 255, 0.04)',
                                    border: `1px solid ${matrixFilter === pill.id ? '#38BDF8' : 'rgba(255, 255, 255, 0.1)'}`,
                                    color: matrixFilter === pill.id ? '#38BDF8' : 'var(--text-secondary)',
                                    borderRadius: '4px',
                                    cursor: 'pointer',
                                    transition: 'all 0.15s ease'
                                  }}
                                >
                                  {pill.label}
                                </button>
                              ))}
                            </div>

                            {/* Legend */}
                            <div style={{ display: 'flex', flexWrap: 'wrap', gap: '8px', marginBottom: '14px' }}>
                              <span style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#38BDF8', display: 'inline-block' }} /> Answered
                              </span>
                              <span style={{ fontSize: '0.66rem', display: 'flex', alignItems: 'center', gap: '4px', color: 'var(--text-secondary)' }}>
                                <span style={{ width: '10px', height: '10px', borderRadius: '3px', background: '#F97316', display: 'inline-block' }} /> Flagged
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

                                // Filter check
                                const isDimmed = (matrixFilter === 'UNANSWERED' && isAnswered) || (matrixFilter === 'FLAGGED' && !isFlagged)

                                let bg = 'rgba(255,255,255,0.06)'
                                let border = '1px solid rgba(255,255,255,0.1)'
                                let color = 'var(--text-secondary)'
                                if (isAnswered) { bg = 'rgba(56,189,248,0.16)'; border = '1px solid #38BDF8'; color = '#38BDF8' }
                                if (isFlagged && !isAnswered) { bg = 'rgba(249,115,22,0.2)'; border = '1.5px solid #F97316'; color = '#F97316' }
                                if (isFlagged && isAnswered) { bg = 'rgba(249,115,22,0.15)'; border = '1.8px solid #F97316'; color = '#F97316' }
                                if (isCurrent) { border = '2px solid #E01B22'; color = '#FFF' }
                                return (
                                  <button
                                    key={q.id}
                                    type="button"
                                    onClick={() => handleSelectQuestion(idx)}
                                    style={{
                                      position: 'relative',
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
                                      opacity: isDimmed ? 0.3 : 1,
                                      boxShadow: isCurrent ? '0 0 10px rgba(224,27,34,0.5)' : 'none'
                                    }}
                                    title={`Q${idx + 1}: ${isAnswered ? 'Answered' : isFlagged ? 'Flagged' : 'Unanswered'}`}
                                  >
                                    <span style={{ position: 'relative', display: 'inline-flex', alignItems: 'center', justifyContent: 'center', width: '100%' }}>
                                      {idx + 1}
                                      {isFlagged && <span className="matrix-flag-indicator" />}
                                    </span>
                                  </button>
                                )
                              })}
                            </div>
                          </div>

                          {/* Summary Stats & Risk HUD */}
                          <div style={{ background: 'rgba(255,255,255,0.03)', border: '1px solid rgba(255,255,255,0.08)', borderRadius: '10px', padding: '14px', marginBottom: '14px' }}>
                            <div style={{ fontSize: '0.7rem', color: 'var(--text-secondary)', marginBottom: '8px', textTransform: 'uppercase', letterSpacing: '0.5px' }}>Progress &amp; Score Telemetry</div>
                            <div style={{ display: 'flex', flexDirection: 'column', gap: '6px' }}>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#38BDF8' }}>✓ Answered (+10 pts each)</span>
                                <strong style={{ color: '#FFF' }}>{Object.keys(prelimAnswers).length}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: '#F97316' }}>🚩 Flagged for Review</span>
                                <strong style={{ color: '#FFF' }}>{flaggedQuestions.size}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.8rem' }}>
                                <span style={{ color: 'var(--text-dim)' }}>○ Left Blank (0 penalty)</span>
                                <strong style={{ color: '#FFF' }}>{Math.max(0, (prelimQuestions.length || 30) - Object.keys(prelimAnswers).length)}</strong>
                              </div>
                              <div style={{ display: 'flex', justifyContent: 'space-between', fontSize: '0.82rem', paddingTop: '6px', borderTop: '1px dashed rgba(255,255,255,0.1)' }}>
                                <span style={{ color: '#34D399', fontWeight: 'bold' }}>Potential Max:</span>
                                <strong style={{ color: '#34D399' }}>+{Object.keys(prelimAnswers).length * 10} pts</strong>
                              </div>
                            </div>
                            <div style={{ marginTop: '10px', padding: '7px 9px', background: 'rgba(239, 68, 68, 0.12)', border: '1px solid rgba(239, 68, 68, 0.3)', borderRadius: '6px', fontSize: '0.68rem', color: '#FCA5A5', lineHeight: '1.4' }}>
                              ⚠️ <strong>Scoring Risk:</strong> -5 penalty for wrong answers. Blank questions incur 0 penalty.
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

                  {prelimStatus === 'COMPLETED' && (() => {
                    const registeredList = team.memberNames
                      ? team.memberNames.split(',').map(m => m.trim()).filter(Boolean)
                      : []
                    const attemptNames = (team.attempts || []).map(a => a.participantName).filter(Boolean)
                    const allTeammateNames = Array.from(new Set([
                      ...registeredList,
                      ...attemptNames,
                      participantName
                    ])).filter(Boolean)

                    const teammateCards = allTeammateNames.map(name => {
                      const isMe = name.toLowerCase() === (participantName || '').toLowerCase()
                      const att = (isMe && myAttempt) ? myAttempt : (team.attempts || []).find(a => a.participantName?.toLowerCase() === name.toLowerCase())
                      return {
                        name,
                        isMe,
                        status: att ? att.status : 'NOT_STARTED',
                        score: att?.status === 'COMPLETED' ? (att.score || 0) : 0,
                        completedAt: att?.completedAt
                      }
                    })

                    const squadTotalScore = team.score !== undefined && team.score !== null
                      ? team.score
                      : teammateCards.reduce((sum, t) => sum + t.score, 0)
                    const myScore = myAttempt?.score !== undefined
                      ? myAttempt.score
                      : (teammateCards.find(t => t.isMe)?.score || 0)
                    const completedCount = teammateCards.filter(t => t.status === 'COMPLETED').length

                    return (
                      <div style={{ padding: '10px 0', width: '100%', maxWidth: '1400px', margin: '0 auto' }}>

                        {/* Top Mission Concluded Banner */}
                        <div className="glass-panel" style={{
                          padding: '24px 30px',
                          borderRadius: '16px',
                          border: '1.5px solid rgba(56, 189, 248, 0.4)',
                          background: 'linear-gradient(135deg, rgba(2, 132, 199, 0.12) 0%, rgba(224, 27, 34, 0.12) 50%, rgba(6, 8, 18, 0.95) 100%)',
                          boxShadow: '0 12px 40px rgba(0, 0, 0, 0.6), 0 0 25px rgba(56, 189, 248, 0.2)',
                          marginBottom: '28px',
                          position: 'relative',
                          overflow: 'hidden'
                        }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '16px' }}>
                            <div>
                              <div style={{ display: 'inline-flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                                <span className="live-pulse-dot" style={{ width: '10px', height: '10px', background: '#38BDF8' }} />
                                <span style={{ fontSize: '0.78rem', color: '#7DD3FC', fontWeight: '900', letterSpacing: '1.5px', textTransform: 'uppercase' }}>
                                  COMBAT TELEMETRY SYNCHRONIZED • PRELIMS CONCLUDED
                                </span>
                              </div>
                              <h2 style={{ fontSize: 'clamp(1.6rem, 3.2vw, 2.2rem)', fontWeight: '900', margin: '0 0 8px 0', letterSpacing: '1px' }}>
                                <span style={{ color: '#38BDF8' }}>SQUAD DEBRIEF</span> &amp; <span style={{ color: '#E01B22' }}>SCORE CONVERGENCE</span>
                              </h2>
                              <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', margin: 0, maxWidth: '700px', lineHeight: '1.5' }}>
                                Member submissions under Team ID <strong style={{ color: '#FFF' }}>{team.teamId || 'YOUR TEAM'}</strong> are aggregated into your cumulative team standing in real time.
                              </p>
                            </div>

                            <div style={{ display: 'flex', alignItems: 'center', gap: '12px' }}>
                              <button
                                onClick={async () => {
                                  setIsDebriefRefreshing(true)
                                  await fetchTeamProfile(token)
                                  setTimeout(() => setIsDebriefRefreshing(false), 600)
                                }}
                                className="btn-secondary"
                                style={{
                                  padding: '10px 18px',
                                  fontSize: '0.85rem',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px',
                                  borderColor: '#38BDF8',
                                  color: '#38BDF8',
                                  cursor: 'pointer'
                                }}
                              >
                                <span style={{ display: 'inline-block', transform: isDebriefRefreshing ? 'rotate(360deg)' : 'none', transition: 'transform 0.6s ease' }}>🔄</span>
                                {isDebriefRefreshing ? 'Syncing...' : 'Refresh Telemetry'}
                              </button>
                              <div style={{ padding: '8px 14px', borderRadius: '8px', background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(255,255,255,0.1)', textAlign: 'right' }}>
                                <div style={{ fontSize: '0.7rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Central Uplink</div>
                                <div style={{ fontSize: '0.82rem', fontWeight: 'bold', color: '#10B981' }}>● LIVE BROADCAST</div>
                              </div>
                            </div>
                          </div>
                        </div>

                        {/* 4 Metric Stats Cards Grid */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '18px', marginBottom: '28px' }}>
                          {/* Card 1: Member Personal Score */}
                          <div className="comic-card card-hover-lift" style={{
                            padding: '22px',
                            borderRadius: '12px',
                            borderTop: '4px solid #38BDF8',
                            background: 'rgba(56, 189, 248, 0.06)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                          }}>
                            <div style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              YOUR MEMBER SCORE
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {participantName || 'Member'} <span style={{ fontSize: '0.75rem', color: '#38BDF8' }}>(You)</span>
                            </div>
                            <div style={{ fontSize: '2.3rem', fontWeight: '900', color: '#38BDF8', fontFamily: 'var(--font-display)', margin: '10px 0 6px 0', textShadow: '0 0 16px rgba(56, 189, 248, 0.4)' }}>
                              {myScore >= 0 ? `+${myScore}` : myScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>pts</span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ✓ Answers Evaluated (+10 / -5)
                            </div>
                          </div>

                          {/* Card 2: Squad Aggregate Score (Computed Sum) */}
                          <div className="comic-card card-hover-lift" style={{
                            padding: '22px',
                            borderRadius: '12px',
                            borderTop: '4px solid #F97316',
                            background: 'linear-gradient(145deg, rgba(249, 115, 22, 0.1) 0%, rgba(224, 27, 34, 0.1) 100%)',
                            boxShadow: '0 8px 24px rgba(249, 115, 22, 0.15)'
                          }}>
                            <div style={{ fontSize: '0.74rem', color: '#FB923C', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              SQUAD TOTAL SCORE (SUMMED)
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#FFF', whiteSpace: 'nowrap', overflow: 'hidden', textOverflow: 'ellipsis' }}>
                              {team.teamName || 'Squad Team'}
                            </div>
                            <div style={{ fontSize: '2.3rem', fontWeight: '900', color: '#F97316', fontFamily: 'var(--font-display)', margin: '10px 0 6px 0', textShadow: '0 0 16px rgba(249, 115, 22, 0.4)' }}>
                              {squadTotalScore} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>pts</span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: '#FB923C', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              ⚡ Teammate Scores Combined
                            </div>
                          </div>

                          {/* Card 3: Tournament Standing */}
                          <div className="comic-card card-hover-lift" style={{
                            padding: '22px',
                            borderRadius: '12px',
                            borderTop: '4px solid #E01B22',
                            background: 'rgba(224, 27, 34, 0.06)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                          }}>
                            <div style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              MULTIVERSE STATUS
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#FFF' }}>
                              Squad Qualification
                            </div>
                            <div style={{ fontSize: '1.9rem', fontWeight: '900', color: team.isEliminated ? '#EF4444' : '#38BDF8', fontFamily: 'var(--font-display)', margin: '10px 0 6px 0' }}>
                              {team.isEliminated ? 'ELIMINATED' : 'ACTIVE'}
                            </div>
                            <div style={{ fontSize: '0.76rem', color: team.isEliminated ? '#EF4444' : '#34D399', display: 'flex', alignItems: 'center', gap: '4px' }}>
                              {team.isEliminated ? '⚠️ Elimination Zone' : '🛡️ Qualified Standing'}
                            </div>
                          </div>

                          {/* Card 4: Squad Readiness */}
                          <div className="comic-card card-hover-lift" style={{
                            padding: '22px',
                            borderRadius: '12px',
                            borderTop: '4px solid #818CF8',
                            background: 'rgba(129, 140, 248, 0.06)',
                            boxShadow: '0 8px 24px rgba(0,0,0,0.35)'
                          }}>
                            <div style={{ fontSize: '0.74rem', color: '#A5B4FC', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '4px' }}>
                              SQUAD DEPLOYMENT
                            </div>
                            <div style={{ fontSize: '1.05rem', fontWeight: 'bold', color: '#FFF' }}>
                              Members Finished
                            </div>
                            <div style={{ fontSize: '2.3rem', fontWeight: '900', color: '#A5B4FC', fontFamily: 'var(--font-display)', margin: '10px 0 6px 0' }}>
                              {completedCount} <span style={{ fontSize: '0.9rem', color: 'var(--text-secondary)' }}>/ {allTeammateNames.length} Concluded</span>
                            </div>
                            <div style={{ fontSize: '0.76rem', color: completedCount === allTeammateNames.length ? '#34D399' : '#F59E0B' }}>
                              {completedCount === allTeammateNames.length ? '✓ Entire Squad Completed' : '⏳ Awaiting Teammate Submissions'}
                            </div>
                          </div>
                        </div>

                        {/* Squad Teammates Breakdown & Computation Equation */}
                        <div className="glass-panel" style={{ padding: '26px 30px', borderRadius: '16px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', flexWrap: 'wrap', gap: '12px' }}>
                            <div>
                              <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold', margin: '0 0 4px 0', color: '#FFF' }}>
                                👥 Squad Members Roster &amp; Score Convergence
                              </h3>
                              <p style={{ fontSize: '0.82rem', color: 'var(--text-secondary)', margin: 0 }}>
                                Every teammate registered under Team ID <span style={{ color: '#38BDF8', fontWeight: 'bold' }}>{team.teamId}</span> contributes directly to this combined total.
                              </p>
                            </div>
                            <span className="badge" style={{ background: 'rgba(56, 189, 248, 0.1)', borderColor: '#38BDF8', color: '#38BDF8', padding: '6px 14px', fontSize: '0.82rem' }}>
                              Team Size: {team.teamSize || allTeammateNames.length} Members
                            </span>
                          </div>

                          {/* Live Computation Formula Bar */}
                          <div style={{
                            background: 'rgba(0, 0, 0, 0.35)',
                            border: '1.5px dashed rgba(56, 189, 248, 0.35)',
                            borderRadius: '12px',
                            padding: '16px 20px',
                            marginBottom: '24px',
                            display: 'flex',
                            alignItems: 'center',
                            justifyContent: 'center',
                            flexWrap: 'wrap',
                            gap: '12px'
                          }}>
                            <span style={{ fontSize: '0.8rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
                              SCORE FORMULA:
                            </span>
                            {teammateCards.map((member, idx) => (
                              <div key={member.name} style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                {idx > 0 && <span style={{ color: '#F97316', fontWeight: 'bold', fontSize: '1.2rem' }}>+</span>}
                                <div style={{
                                  background: member.isMe ? 'rgba(56, 189, 248, 0.15)' : 'rgba(255,255,255,0.05)',
                                  border: `1px solid ${member.isMe ? '#38BDF8' : 'rgba(255,255,255,0.15)'}`,
                                  padding: '6px 14px',
                                  borderRadius: '8px',
                                  display: 'flex',
                                  alignItems: 'center',
                                  gap: '8px'
                                }}>
                                  <span style={{ fontSize: '0.85rem', color: member.isMe ? '#38BDF8' : '#FFF', fontWeight: '600' }}>
                                    👤 {member.name} {member.isMe ? '(You)' : ''}:
                                  </span>
                                  <span style={{ fontWeight: '900', color: member.status === 'COMPLETED' ? '#34D399' : '#F59E0B', fontSize: '0.95rem' }}>
                                    {member.status === 'COMPLETED' ? `${member.score >= 0 ? `+${member.score}` : member.score} pts` : 'Pending...'}
                                  </span>
                                </div>
                              </div>
                            ))}
                            <span style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1.3rem' }}>=</span>
                            <div style={{
                              background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.25) 0%, rgba(224, 27, 34, 0.25) 100%)',
                              border: '1.5px solid #F97316',
                              padding: '6px 16px',
                              borderRadius: '8px',
                              boxShadow: '0 0 12px rgba(249, 115, 22, 0.3)'
                            }}>
                              <span style={{ fontSize: '0.8rem', color: '#FB923C', fontWeight: 'bold', textTransform: 'uppercase' }}>Squad Total: </span>
                              <span style={{ fontSize: '1.1rem', fontWeight: '900', color: '#FFF' }}>{squadTotalScore} PTS</span>
                            </div>
                          </div>

                          {/* Teammate Individual Dossier Cards */}
                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '16px' }}>
                            {teammateCards.map((member) => (
                              <div
                                key={member.name}
                                className="comic-card"
                                style={{
                                  padding: '18px 20px',
                                  borderRadius: '12px',
                                  border: member.isMe ? '1.5px solid #38BDF8' : '1px solid rgba(255,255,255,0.1)',
                                  background: member.isMe ? 'rgba(56, 189, 248, 0.05)' : 'rgba(255,255,255,0.02)',
                                  position: 'relative'
                                }}
                              >
                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '14px' }}>
                                  <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                                    <div style={{
                                      width: '40px',
                                      height: '40px',
                                      borderRadius: '50%',
                                      background: member.isMe ? 'rgba(56, 189, 248, 0.2)' : 'rgba(224, 27, 34, 0.15)',
                                      border: `2px solid ${member.isMe ? '#38BDF8' : '#E01B22'}`,
                                      display: 'flex',
                                      alignItems: 'center',
                                      justifyContent: 'center',
                                      fontSize: '1.1rem'
                                    }}>
                                      {member.isMe ? '🕷️' : '⚔️'}
                                    </div>
                                    <div>
                                      <div style={{ fontWeight: 'bold', fontSize: '1rem', color: '#FFF' }}>
                                        {member.name} {member.isMe && <span style={{ fontSize: '0.72rem', color: '#38BDF8' }}>(You)</span>}
                                      </div>
                                      <div style={{ fontSize: '0.74rem', color: 'var(--text-dim)' }}>
                                        {member.isMe ? 'Active Local Terminal' : 'Teammate Terminal'}
                                      </div>
                                    </div>
                                  </div>

                                  {member.status === 'COMPLETED' ? (
                                    <span className="badge" style={{ background: 'rgba(16, 185, 129, 0.15)', borderColor: '#10B981', color: '#34D399', fontSize: '0.72rem' }}>
                                      ✓ Finished
                                    </span>
                                  ) : member.status === 'IN_PROGRESS' ? (
                                    <span className="badge" style={{ background: 'rgba(245, 158, 11, 0.15)', borderColor: '#F59E0B', color: '#FBBF24', fontSize: '0.72rem' }}>
                                      ⏳ In Progress
                                    </span>
                                  ) : (
                                    <span className="badge" style={{ background: 'rgba(255,255,255,0.05)', borderColor: 'rgba(255,255,255,0.15)', color: 'var(--text-dim)', fontSize: '0.72rem' }}>
                                      ⏸ Awaiting
                                    </span>
                                  )}
                                </div>

                                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '10px 14px', background: 'rgba(0,0,0,0.25)', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
                                  <span style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>Score Contribution:</span>
                                  <span style={{ fontSize: '1.25rem', fontWeight: 'bold', color: member.status === 'COMPLETED' ? '#38BDF8' : 'var(--text-dim)' }}>
                                    {member.status === 'COMPLETED' ? `${member.score >= 0 ? `+${member.score}` : member.score} pts` : 'Awaiting Submit'}
                                  </span>
                                </div>
                              </div>
                            ))}
                          </div>
                        </div>

                        {/* Tournament Progression Roadmap */}
                        <div className="glass-panel" style={{ padding: '24px 30px', borderRadius: '16px', marginBottom: '28px', border: '1px solid rgba(255,255,255,0.08)' }}>
                          <div style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '1px', textTransform: 'uppercase', marginBottom: '8px' }}>
                            ARENA FLIGHT PROTOCOL
                          </div>
                          <h3 style={{ fontSize: '1.2rem', margin: '0 0 16px 0', color: '#FFF' }}>
                            Tournament Progression Status
                          </h3>

                          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '14px' }}>
                            {/* Stage 0 */}
                            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(16, 185, 129, 0.08)', border: '1.5px solid #10B981' }}>
                              <div style={{ fontSize: '0.75rem', color: '#34D399', fontWeight: 'bold', marginBottom: '4px' }}>STAGE 0 • PRELIMS</div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#FFF' }}>Multiverse MCQ Quiz</div>
                              <div style={{ fontSize: '0.75rem', color: '#34D399', marginTop: '6px' }}>✓ Completed &amp; Scored</div>
                            </div>

                            {/* Stage 1 */}
                            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(56, 189, 248, 0.1)', border: '1.5px solid #38BDF8' }}>
                              <div style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 'bold', marginBottom: '4px' }}>STAGE 1 • NEXT UP</div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#FFF' }}>Pixel Detective</div>
                              <div style={{ fontSize: '0.75rem', color: '#7DD3FC', marginTop: '6px' }}>⏳ Awaiting Organizer Launch</div>
                            </div>

                            {/* Stage 2 */}
                            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', opacity: 0.65 }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', marginBottom: '4px' }}>STAGE 2 • UPCOMING</div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#FFF' }}>The Glitch Hunt</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>🔒 Locked</div>
                            </div>

                            {/* Stage 3 */}
                            <div style={{ padding: '14px 16px', borderRadius: '10px', background: 'rgba(255, 255, 255, 0.02)', border: '1px solid rgba(255, 255, 255, 0.08)', opacity: 0.65 }}>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', fontWeight: 'bold', marginBottom: '4px' }}>STAGE 3 • UPCOMING</div>
                              <div style={{ fontSize: '0.92rem', fontWeight: 'bold', color: '#FFF' }}>Prompt Wars</div>
                              <div style={{ fontSize: '0.75rem', color: 'var(--text-dim)', marginTop: '6px' }}>🔒 Locked</div>
                            </div>
                          </div>

                          <div style={{ marginTop: '20px', padding: '14px 18px', borderRadius: '8px', background: 'rgba(56, 189, 248, 0.06)', border: '1px solid rgba(56, 189, 248, 0.2)', display: 'flex', alignItems: 'center', gap: '12px' }}>
                            <span style={{ fontSize: '1.4rem' }}>📡</span>
                            <div style={{ fontSize: '0.84rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                              <strong style={{ color: '#FFF' }}>Console Synced to Main Stage:</strong> Do not close or refresh this tab. Once the coordinators initiate Stage 1 on the auditorium projector, this dashboard will automatically transition to the visual challenge screen.
                            </div>
                          </div>
                        </div>

                        {/* Spider-Man & Deadpool Debrief Quotes */}
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px' }}>
                          {/* Spidey Quote */}
                          <div className="comic-card" style={{ padding: '18px 22px', borderLeft: '4px solid #38BDF8', background: 'rgba(56, 189, 248, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.4rem' }}>🕷️</span>
                              <span style={{ fontWeight: 'bold', color: '#38BDF8', fontSize: '0.9rem' }}>Spider-Man's Debrief Intel</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.86rem', color: '#E0E7FF', lineHeight: '1.5', fontStyle: 'italic' }}>
                              "Outstanding focus! Every correct answer scored +10 points and successfully protected your squad from the -5 penalty traps. Stand by for the visual stages—synthetic artifacts will test your optical analysis skills!"
                            </p>
                          </div>

                          {/* Deadpool Quote */}
                          <div className="comic-card" style={{ padding: '18px 22px', borderLeft: '4px solid #E01B22', background: 'rgba(224, 27, 34, 0.05)' }}>
                            <div style={{ display: 'flex', alignItems: 'center', gap: '10px', marginBottom: '8px' }}>
                              <span style={{ fontSize: '1.4rem' }}>⚔️</span>
                              <span style={{ fontWeight: 'bold', color: '#FF4D4D', fontSize: '0.9rem' }}>Deadpool's Tactical Commentary</span>
                            </div>
                            <p style={{ margin: 0, fontSize: '0.86rem', color: '#FFE4E6', lineHeight: '1.5', fontStyle: 'italic' }}>
                              "Maximum Effort! The scores are locked and loaded into the main tournament mainframe! If your teammate is still sweating on their questions, tell them not to choke! We've got a podium to conquer!"
                            </p>
                          </div>
                        </div>

                      </div>
                    )
                  })()}
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
                          <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 'bold' }}>
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

                    <div className="player-arena-layout">
                      {/* Main Challenge Workspace */}
                      <div className="player-main-workspace">
                        {/* Image Viewport with Cyber Forensics Frame */}
                        {currentQuestion && (
                          <div className="flex-center" style={{ marginBottom: '24px' }}>
                            <div className="image-viewport-frame" style={{ width: '100%', maxWidth: '100%' }}>
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
                              <span style={{ background: 'rgba(0,0,0,0.75)', border: '1px solid #F97316', color: '#F97316', padding: '3px 8px', borderRadius: '4px', fontSize: '0.7rem', fontWeight: 'bold' }}>
                                FOCAL REVEAL: {gameState.zoomLevel || 10}%
                              </span>
                            )}
                          </div>

                          {currentQuestion.imageUrl ? (
                            gameState.activeRound === 4 ? (
                              <div style={{ width: '100%', height: '432px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                  src={`${API_BASE_URL}${currentQuestion.imageUrl}`}
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
                              <div style={{ width: '100%', background: '#070405', display: 'flex', alignItems: 'center', justifyContent: 'center', minHeight: '360px', overflow: 'hidden', position: 'relative' }}>
                                <img
                                  src={`${API_BASE_URL}${currentQuestion.imageUrl}`}
                                  alt="quiz visual"
                                  style={{
                                    width: '100%',
                                    height: 'auto',
                                    display: 'block',
                                    maxHeight: '504px',
                                    objectFit: 'contain',
                                    transform: `scale(${forensicZoom})`,
                                    filter: forensicFilter === 'CONTRAST'
                                      ? 'contrast(1.6) saturate(1.3) brightness(1.05)'
                                      : forensicFilter === 'MONO'
                                        ? 'grayscale(1) contrast(1.5)'
                                        : forensicFilter === 'INVERT'
                                          ? 'invert(1) hue-rotate(180deg) contrast(1.3)'
                                          : 'none',
                                    transition: 'transform 0.25s ease, filter 0.2s ease'
                                  }}
                                />
                              </div>
                            )
                          ) : (
                            <div style={{ width: '100%', minHeight: '312px', display: 'flex', flexDirection: 'column', alignItems: 'center', justifyContent: 'center', gap: '10px', color: 'var(--text-secondary)' }}>
                              <span className="pulse-dot" style={{ width: '12px', height: '12px', background: '#E01B22' }} />
                              <span style={{ fontSize: '0.85rem', letterSpacing: '1px', textTransform: 'uppercase' }}>Acquiring Visual Uplink...</span>
                            </div>
                          )}

                          {/* Interactive Forensic Optics Toolbar */}
                          {gameState.activeRound !== 4 && currentQuestion.imageUrl && (
                            <div style={{
                              display: 'flex',
                              justifyContent: 'space-between',
                              alignItems: 'center',
                              background: 'rgba(10, 16, 30, 0.95)',
                              borderTop: '1px solid rgba(56, 189, 248, 0.3)',
                              padding: '10px 16px',
                              flexWrap: 'wrap',
                              gap: '10px'
                            }}>
                              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                                <span style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                  🔬 Magnifier:
                                </span>
                                {[1, 1.5, 2, 3].map(z => (
                                  <button
                                    key={z}
                                    type="button"
                                    onClick={() => setForensicZoom(z)}
                                    style={{
                                      background: forensicZoom === z ? 'rgba(56, 189, 248, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                      border: `1px solid ${forensicZoom === z ? '#38BDF8' : 'rgba(255, 255, 255, 0.15)'}`,
                                      color: forensicZoom === z ? '#38BDF8' : '#CBD5E1',
                                      padding: '3px 10px',
                                      borderRadius: '5px',
                                      fontSize: '0.74rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {z}x
                                  </button>
                                ))}
                                {forensicZoom > 1 && (
                                  <button
                                    type="button"
                                    onClick={() => setForensicZoom(1)}
                                    style={{
                                      background: 'none',
                                      border: 'none',
                                      color: '#F87171',
                                      fontSize: '0.72rem',
                                      cursor: 'pointer',
                                      textDecoration: 'underline'
                                    }}
                                  >
                                    Reset
                                  </button>
                                )}
                              </div>

                              <div style={{ display: 'flex', alignItems: 'center', gap: '6px', flexWrap: 'wrap' }}>
                                <span style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                                  ⚡ Filter:
                                </span>
                                {[
                                  { id: 'NORMAL', label: 'RGB' },
                                  { id: 'CONTRAST', label: 'High Contrast' },
                                  { id: 'MONO', label: 'Forensic Mono' },
                                  { id: 'INVERT', label: 'Lumina Invert' }
                                ].map(f => (
                                  <button
                                    key={f.id}
                                    type="button"
                                    onClick={() => setForensicFilter(f.id)}
                                    style={{
                                      background: forensicFilter === f.id ? 'rgba(224, 27, 34, 0.3)' : 'rgba(255, 255, 255, 0.05)',
                                      border: `1px solid ${forensicFilter === f.id ? '#E01B22' : 'rgba(255, 255, 255, 0.15)'}`,
                                      color: forensicFilter === f.id ? '#FF7B7B' : '#CBD5E1',
                                      padding: '3px 9px',
                                      borderRadius: '5px',
                                      fontSize: '0.72rem',
                                      fontWeight: 'bold',
                                      cursor: 'pointer',
                                      transition: 'all 0.15s ease'
                                    }}
                                  >
                                    {f.label}
                                  </button>
                                ))}
                              </div>
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
                                      <span style={{ fontSize: '0.75rem', color: '#F97316', fontWeight: 'bold' }}>
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
                                  <span className="shimmer-badge" style={{ padding: '3px 10px', borderRadius: '4px', fontSize: '0.72rem', color: '#F97316', border: '1px solid #F97316' }}>
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

                  {/* Sticky Player Sidebar */}
                  <aside className="player-stage-sidebar">
                    {/* 1. Countdown Telemetry Panel */}
                    <div className={`side-telemetry-panel ${timeLeft > 0 && timeLeft < 10 ? 'ring-pulse' : ''}`} style={{ borderColor: timeLeft < 10 && timeLeft > 0 ? '#E01B22' : 'rgba(56, 189, 248, 0.25)' }}>
                      <div className="side-telemetry-header">
                        <span className="side-telemetry-title">
                          <span className="live-pulse-dot" style={{ background: timeLeft < 10 && timeLeft > 0 ? '#EF4444' : '#F97316' }} />
                          Cyber Countdown
                        </span>
                        <span style={{ fontSize: '0.72rem', color: timeLeft < 10 && timeLeft > 0 ? '#EF4444' : '#F97316', fontWeight: 'bold' }}>
                          {timeLeft < 10 && timeLeft > 0 ? 'CRITICAL' : 'IN PROGRESS'}
                        </span>
                      </div>
                      <div style={{ textAlign: 'center', padding: '8px 0' }}>
                        <div style={{
                          fontSize: '2.4rem',
                          fontWeight: '900',
                          fontFamily: 'var(--font-display)',
                          color: timeLeft < 10 && timeLeft > 0 ? '#EF4444' : '#FFF',
                          textShadow: timeLeft < 10 && timeLeft > 0 ? '0 0 16px rgba(239,68,68,0.8)' : '0 0 10px rgba(56,189,248,0.4)',
                          letterSpacing: '2px'
                        }} className={timeLeft < 5 && timeLeft > 0 ? 'blink' : ''}>
                          {timeLeft > 0 ? `${String(Math.floor(timeLeft / 60)).padStart(2, '0')}:${String(timeLeft % 60).padStart(2, '0')}` : '00:00'}
                        </div>
                        <span style={{ fontSize: '0.72rem', color: 'var(--text-secondary)' }}>
                          Auto-locks when timer expires
                        </span>
                      </div>
                    </div>

                    {/* 2. Challenge Telemetry */}
                    <div className="side-telemetry-panel">
                      <div className="side-telemetry-header">
                        <span className="side-telemetry-title">
                          🎯 Stage Telemetry
                        </span>
                        <span style={{
                          fontSize: '0.68rem',
                          color: submitted ? '#34D399' : '#38BDF8',
                          background: submitted ? 'rgba(52,211,153,0.1)' : 'rgba(56,189,248,0.1)',
                          padding: '2px 6px',
                          borderRadius: '4px',
                          border: `1px solid ${submitted ? 'rgba(52,211,153,0.3)' : 'rgba(56,189,248,0.3)'}`
                        }}>
                          {submitted ? '✓ Submitted' : '○ Active Target'}
                        </span>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Active Stage:</span>
                        <strong style={{ color: '#FFF' }}>
                          {gameState.activeRound === 2 && 'Stage 1: Pixel Detective'}
                          {gameState.activeRound === 3 && 'Stage 2: The Glitch Hunt'}
                          {gameState.activeRound === 4 && 'Stage 3: Prompt Wars'}
                        </strong>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Target Number:</span>
                        <strong style={{ color: '#F97316' }}>Question #{gameState.activeQuestionId}</strong>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Scoring Yield:</span>
                        <strong style={{ color: '#38BDF8' }}>
                          {gameState.activeRound === 2 && '10 PTS (+Model Bonus)'}
                          {gameState.activeRound === 3 && 'Glitch Evaluation'}
                          {gameState.activeRound === 4 && 'CLIP Cosine Match'}
                        </strong>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Transmission:</span>
                        <strong style={{ color: submitted ? '#34D399' : '#FBBF24' }}>
                          {submitted ? 'Locked In' : 'Awaiting Input'}
                        </strong>
                      </div>
                    </div>

                    {/* 3. Squad Uplink */}
                    <div className="side-telemetry-panel">
                      <div className="side-telemetry-header">
                        <span className="side-telemetry-title">
                          ⚡ Squad Uplink
                        </span>
                        <span style={{ fontSize: '0.7rem', color: '#10B981', fontWeight: 'bold' }}>● ONLINE</span>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Squad Name:</span>
                        <strong style={{ color: '#FFF' }}>{team.teamName || 'Your Squad'}</strong>
                      </div>
                      <div className="side-telemetry-row">
                        <span>Team ID:</span>
                        <strong style={{ color: '#A5B4FC' }}>{team.teamId || '-'}</strong>
                      </div>
                      {participantName && (
                        <div className="side-telemetry-row">
                          <span>Active Terminal:</span>
                          <strong style={{ color: '#38BDF8' }}>{participantName}</strong>
                        </div>
                      )}
                      <div className="side-telemetry-row">
                        <span>Live Squad Score:</span>
                        <strong style={{ color: '#FF4D4D', fontSize: '1.05rem' }}>{team.score} PTS</strong>
                      </div>
                    </div>

                    {/* 4. Forensic Tips & Protocol */}
                    <div className="side-telemetry-panel" style={{ borderLeft: '3px solid #F97316' }}>
                      <div className="side-telemetry-header">
                        <span className="side-telemetry-title" style={{ color: '#F97316' }}>
                          💡 Forensic Protocol
                        </span>
                      </div>
                      <p style={{ margin: 0, fontSize: '0.78rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
                        {gameState.activeRound === 2 && "Inspect iris glints, hair edge transitions, and ear cartilage. Real camera photos feature natural ISO grain; AI produces hyper-uniform blur."}
                        {gameState.activeRound === 3 && "Document physical discrepancies: mismatched glasses frames, melted jewelry, contradictory shadow angles, or repeating background patterns."}
                        {gameState.activeRound === 4 && "Construct concise prompt tokens specifying subject, artistic medium, lighting environment, and camera angle. Keywords align with CLIP vector embeddings."}
                      </p>
                    </div>
                  </aside>
                </div>
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

                <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', textTransform: 'uppercase' }}>Squad Final Score</h3>
                <div className="glass-panel" style={{ padding: '24px', maxWidth: '440px', margin: '0 auto', border: '1px solid rgba(56, 189, 248, 0.3)' }}>
                  <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#FFF', marginBottom: '6px' }}>
                    {team.teamName || 'Your Squad'}
                  </div>
                  <div style={{ fontSize: '2.5rem', color: 'var(--color-neon-blue)', fontWeight: 'bold', fontFamily: 'var(--font-display)' }}>
                    {team.score || 0} <span style={{ fontSize: '1.1rem', color: 'var(--text-secondary)' }}>pts</span>
                  </div>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.86rem', marginTop: '14px', lineHeight: 1.5 }}>
                    Final podium standings and award announcements are presented exclusively on the organizer auditorium projector!
                  </p>
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

      {/* TOURNAMENT PROTOCOL ACKNOWLEDGEMENT POPUP MODAL          */}
      {/* ========================================================= */}
      {showAcknowledgeModal && (
        <div className="acknowledge-backdrop">
          <div className="acknowledge-modal-container">
            {/* Top Futuristic Laser Scanner */}
            <div className="acknowledge-laser-line" />

            {/* Top Header */}
            <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '20px', borderBottom: '1px solid rgba(224, 27, 34, 0.3)', paddingBottom: '16px' }}>
              <div className="acknowledge-shield-avatar">
                🛡️
              </div>
              <div>
                <h3 style={{ fontSize: '1.4rem', color: '#FFF', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                  Tournament Protocol Acknowledgement
                </h3>
                <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginTop: '4px' }}>
                  <span className="live-pulse-dot" style={{ width: '7px', height: '7px', background: '#F97316', boxShadow: '0 0 8px #F97316' }} />
                  <span style={{ fontSize: '0.74rem', color: '#F97316', fontWeight: '800', letterSpacing: '1.2px' }}>
                    LOGIN 2026 • STAGE 0 PRELIMS CONTEXT
                  </span>
                </div>
              </div>
            </div>

            {/* Context & Ground Rules with Staggered Cascades */}
            <div style={{ display: 'flex', flexDirection: 'column', gap: '12px', marginBottom: '22px', fontSize: '0.88rem', color: 'var(--text-secondary)', lineHeight: '1.5' }}>
              <div className="acknowledge-rule-card" style={{ borderLeft: '3.5px solid #38BDF8', animation: 'ruleCardSlideIn 0.35s ease-out 0.08s both' }}>
                <strong style={{ color: '#38BDF8', display: 'block', marginBottom: '2px', fontSize: '0.92rem' }}>⏱️ Strict 30-Minute Countdown</strong>
                Your personal countdown begins immediately upon confirmation. Once active, the timer cannot be paused, reset, or refreshed. The quiz auto-submits strictly at 00:00.
              </div>

              <div className="acknowledge-rule-card" style={{ borderLeft: '3.5px solid #EF4444', animation: 'ruleCardSlideIn 0.35s ease-out 0.16s both' }}>
                <strong style={{ color: '#FF4D4D', display: 'block', marginBottom: '2px', fontSize: '0.92rem' }}>⚠️ Scoring &amp; Negative Marking Context</strong>
                Each correct answer awards <strong>+10 Points</strong>. Each incorrect guess deducts <strong>-5 Points (Negative Marking)</strong>. Unanswered questions yield 0 points. Do not blind-guess!
              </div>

              <div className="acknowledge-rule-card" style={{ borderLeft: '3.5px solid #F97316', animation: 'ruleCardSlideIn 0.35s ease-out 0.24s both' }}>
                <strong style={{ color: '#F97316', display: 'block', marginBottom: '2px', fontSize: '0.92rem' }}>📷 Automated Silent Invigilation</strong>
                Webcam snapshots are captured periodically in the background during the test to verify academic honesty and individual completion.
              </div>
            </div>

            {/* Required Consent Checkbox with Active Pulse */}
            <label className={`acknowledge-consent-box ${hasAcknowledged ? 'consented' : 'unconsented'}`} style={{ marginBottom: '24px' }}>
              <input
                type="checkbox"
                checked={hasAcknowledged}
                onChange={(e) => setHasAcknowledged(e.target.checked)}
                style={{
                  marginTop: '3px',
                  width: '20px',
                  height: '20px',
                  cursor: 'pointer',
                  accentColor: '#38BDF8',
                  transition: 'transform 0.2s cubic-bezier(0.34, 1.56, 0.64, 1)'
                }}
              />
              <span style={{ fontSize: '0.88rem', color: '#FFF', lineHeight: '1.5' }}>
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
                style={{ padding: '11px 22px', fontSize: '0.9rem' }}
              >
                Cancel / Return
              </button>
              <button
                type="button"
                className={`btn-primary ${hasAcknowledged ? 'acknowledge-launch-btn-active' : ''}`}
                disabled={!hasAcknowledged}
                onClick={() => {
                  setShowAcknowledgeModal(false)
                  handlePrelimStart()
                }}
                style={{
                  padding: '11px 26px',
                  fontSize: '0.95rem',
                  opacity: hasAcknowledged ? 1 : 0.4,
                  cursor: hasAcknowledged ? 'pointer' : 'not-allowed'
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
              <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid #38BDF8', borderRadius: '8px', padding: '12px 8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: 'bold' }}>ANSWERED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFF' }}>{Object.keys(prelimAnswers).length}</div>
                <div style={{ fontSize: '0.65rem', color: '#7DD3FC' }}>+10 pts if correct</div>
              </div>

              <div style={{ background: 'rgba(249,115,22,0.1)', border: '1px solid #F97316', borderRadius: '8px', padding: '12px 8px' }}>
                <div style={{ fontSize: '0.7rem', color: '#F97316', fontWeight: 'bold' }}>FLAGGED</div>
                <div style={{ fontSize: '1.3rem', fontWeight: '900', color: '#FFF' }}>{flaggedQuestions.size}</div>
                <div style={{ fontSize: '0.65rem', color: '#FB923C' }}>Needs review</div>
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
