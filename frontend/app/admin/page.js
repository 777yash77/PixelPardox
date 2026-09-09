'use client'

import { useState, useEffect, useRef } from 'react'
import { useRouter } from 'next/navigation'
import Link from 'next/link'

const STAGE_NAMES = {
  0: 'Stage 0: Registration / Lobby',
  1: 'Stage 0: Prelims (MCQ Quiz)',
  2: 'Stage 1: Pixel Detective',
  3: 'Stage 2: The Glitch Hunt',
  4: 'Stage 3: Prompt Wars',
  5: 'Stage 5: Game Over / Podium',
  6: 'Evaluating Submissions',
  7: 'Break Between Rounds'
}

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

  // Quiz Manager State (Stage 0 Prelims)
  const [quizQuestions, setQuizQuestions] = useState([])
  const [editingQuizId, setEditingQuizId] = useState(null)
  const [quizForm, setQuizForm] = useState({
    questionText: '',
    optionA: '',
    optionB: '',
    optionC: '',
    optionD: '',
    correctOption: 'A',
    points: 10,
    orderNum: 1,
    active: true
  })
  const [quizStatus, setQuizStatus] = useState({ success: '', error: '' })

  // Media Manager State (Stages 1 - 3)
  const [images, setImages] = useState([])
  const [uploadData, setUploadData] = useState({
    file: null,
    isAi: false,
    modelUsed: '',
    roundNumber: 2, // Default to Stage 1
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
  const [gradingFilterRound, setGradingFilterRound] = useState(0) // 0 = all pending
  const [gradeScores, setGradeScores] = useState({}) // submissionId -> score
  const [gradingStatus, setGradingStatus] = useState('')

  // Leaderboard State
  const [leaderboard, setLeaderboard] = useState([])
  const [advancementStatus, setAdvancementStatus] = useState('')
  const [customAdvance, setCustomAdvance] = useState({ value: 10, isPercent: false })

  // Invigilation State
  const [webcams, setWebcams] = useState({}) // teamId -> { frame, participantName, timestamp }

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
    fetchQuizQuestions(storedToken)
  }, [])

  // Refetch grading submissions when tab changes or filter updates
  useEffect(() => {
    if (activeTab === 'grading' && token) {
      fetchSubmissionsForGrading(gradingFilterRound)
    } else if (activeTab === 'leaderboard') {
      fetchLeaderboard()
    } else if (activeTab === 'quiz' && token) {
      fetchQuizQuestions(token)
    }
  }, [activeTab, gameState.activeRound, gradingFilterRound])

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
      console.error('Failed to fetch game state', e)
    }
  }

  const fetchImages = async (tok) => {
    try {
      const currentToken = tok || token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')
      const res = await fetch('http://localhost:8080/api/game/images', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setImages(data)
      }
    } catch (e) {
      console.error('Failed to fetch images', e)
    }
  }

  const fetchLeaderboard = async () => {
    try {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')
      const res = await fetch('http://localhost:8080/api/game/leaderboard', {
        headers: currentToken ? { 'Authorization': `Bearer ${currentToken}` } : {}
      })
      if (res.ok) {
        const data = await res.json()
        setLeaderboard(data)
      }
    } catch (e) {
      console.error('Failed to fetch leaderboard', e)
    }
  }

  const fetchQuizQuestions = async (tok) => {
    try {
      const currentToken = tok || token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')
      const res = await fetch('http://localhost:8080/api/admin/quiz', {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        setQuizQuestions(data)
        // Auto-update default orderNum for new question
        if (!editingQuizId) {
          setQuizForm(prev => ({ ...prev, orderNum: data.length + 1 }))
        }
      }
    } catch (e) {
      console.error('Failed to fetch quiz questions', e)
    }
  }

  const fetchSubmissionsForGrading = async (roundParam) => {
    try {
      const currentToken = token || (typeof window !== 'undefined' ? localStorage.getItem('token') : '')
      const r = roundParam !== undefined ? roundParam : gradingFilterRound
      const res = await fetch(`http://localhost:8080/api/game/submissions?round=${r}`, {
        headers: { 'Authorization': `Bearer ${currentToken}` }
      })
      if (res.ok) {
        const data = await res.json()
        if (Array.isArray(data)) {
          setSubmissions(data)
        } else {
          setSubmissions([])
        }
      }
    } catch (e) {
      console.error('Failed to fetch submissions', e)
    }
  }

  // 3. WebSocket Connection
  useEffect(() => {
    let isMounted = true
    let reconnectTimeout = null

    const setupWebSocket = () => {
      const ws = new WebSocket('ws://localhost:8080/ws')
      wsRef.current = ws

      ws.onopen = () => {
        console.log('Admin connected to Game WebSockets')
        try {
          ws.send(JSON.stringify({ type: 'REGISTER_ADMIN' }))
        } catch (e) {
          console.error('Failed to register admin session', e)
        }
      }

      ws.onmessage = (event) => {
        try {
          const message = JSON.parse(event.data)
          if (message.type === 'GAME_STATE') {
            setGameState(message.payload)
            setSubmissionCount(0)
          } else if (message.type === 'SUBMISSION') {
            setSubmissionCount(prev => prev + 1)
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
          } else if (message.type === 'CAMERA_FRAME') {
            setWebcams(prev => ({
              ...prev,
              [message.payload.teamId]: {
                frame: message.payload.frame,
                participantName: message.payload.participantName,
                timestamp: Date.now()
              }
            }))
          }
        } catch (err) {
          console.error('Error processing websocket message', err)
        }
      }

      ws.onclose = () => {
        if (isMounted) {
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
    if (!confirm('DANGER: Are you absolutely sure you want to RESET the game engine? This will delete ALL submissions and reset all team scores back to 0. Uploaded images and quiz questions will be preserved.')) return

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

  // Quiz Manager Actions (Stage 0 Prelims)
  const handleQuizFormChange = (e) => {
    const { name, value, type, checked } = e.target
    setQuizForm(prev => ({
      ...prev,
      [name]: type === 'checkbox' ? checked : value
    }))
  }

  const handleSaveQuizQuestion = async (e) => {
    e.preventDefault()
    setQuizStatus({ success: '', error: '' })

    // Resolve correctAnswer based on correctOption choice
    let resolvedAnswer = ''
    if (quizForm.correctOption === 'A') resolvedAnswer = quizForm.optionA
    else if (quizForm.correctOption === 'B') resolvedAnswer = quizForm.optionB
    else if (quizForm.correctOption === 'C') resolvedAnswer = quizForm.optionC
    else if (quizForm.correctOption === 'D') resolvedAnswer = quizForm.optionD

    if (!resolvedAnswer || !resolvedAnswer.trim()) {
      setQuizStatus({ success: '', error: 'The selected correct option cannot be blank.' })
      return
    }

    const payload = {
      questionText: quizForm.questionText.trim(),
      optionA: quizForm.optionA.trim(),
      optionB: quizForm.optionB.trim(),
      optionC: quizForm.optionC.trim(),
      optionD: quizForm.optionD.trim(),
      correctAnswer: resolvedAnswer.trim(),
      points: Number(quizForm.points) || 10,
      orderNum: Number(quizForm.orderNum) || (quizQuestions.length + 1),
      active: quizForm.active
    }

    try {
      const url = editingQuizId
        ? `http://localhost:8080/api/admin/quiz/${editingQuizId}`
        : 'http://localhost:8080/api/admin/quiz'
      const method = editingQuizId ? 'PUT' : 'POST'

      const res = await fetch(url, {
        method,
        headers: {
          'Content-Type': 'application/json',
          'Authorization': `Bearer ${token}`
        },
        body: JSON.stringify(payload)
      })

      if (res.ok) {
        setQuizStatus({
          success: editingQuizId ? 'Question updated successfully!' : 'New question added successfully!',
          error: ''
        })
        setEditingQuizId(null)
        setQuizForm({
          questionText: '',
          optionA: '',
          optionB: '',
          optionC: '',
          optionD: '',
          correctOption: 'A',
          points: 10,
          orderNum: quizQuestions.length + (editingQuizId ? 1 : 2),
          active: true
        })
        fetchQuizQuestions(token)
        setTimeout(() => setQuizStatus({ success: '', error: '' }), 3000)
      } else {
        setQuizStatus({ success: '', error: 'Failed to save question.' })
      }
    } catch (err) {
      setQuizStatus({ success: '', error: 'Server error while saving question.' })
    }
  }

  const handleEditQuestion = (q) => {
    setEditingQuizId(q.id)
    // Detect which option matches correctAnswer
    let opt = 'A'
    if (q.correctAnswer === q.optionB || q.correctAnswer === 'B') opt = 'B'
    else if (q.correctAnswer === q.optionC || q.correctAnswer === 'C') opt = 'C'
    else if (q.correctAnswer === q.optionD || q.correctAnswer === 'D') opt = 'D'

    setQuizForm({
      questionText: q.questionText || '',
      optionA: q.optionA || '',
      optionB: q.optionB || '',
      optionC: q.optionC || '',
      optionD: q.optionD || '',
      correctOption: opt,
      points: q.points || 10,
      orderNum: q.orderNum || 1,
      active: q.active !== false
    })
    window.scrollTo({ top: 0, behavior: 'smooth' })
  }

  const handleCancelEdit = () => {
    setEditingQuizId(null)
    setQuizForm({
      questionText: '',
      optionA: '',
      optionB: '',
      optionC: '',
      optionD: '',
      correctOption: 'A',
      points: 10,
      orderNum: quizQuestions.length + 1,
      active: true
    })
  }

  const handleDeleteQuestion = async (id) => {
    if (!confirm('Are you sure you want to delete this quiz question?')) return
    try {
      const res = await fetch(`http://localhost:8080/api/admin/quiz/${id}`, {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        fetchQuizQuestions(token)
      } else {
        alert('Failed to delete question')
      }
    } catch (e) {
      alert('Error deleting question')
    }
  }

  const handleSeedDefaults = async () => {
    if (!confirm('Seed 20 curated Stage 0 Prelims questions for "LOGIN 2026: The Last Human"?')) return
    try {
      const res = await fetch('http://localhost:8080/api/admin/quiz/seed', {
        method: 'POST',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      const data = await res.json()
      alert(data.message || 'Seeding completed.')
      fetchQuizQuestions(token)
    } catch (e) {
      alert('Error seeding default questions.')
    }
  }

  const handleClearAllQuestions = async () => {
    if (!confirm('DANGER: Delete ALL Prelims quiz questions?')) return
    try {
      const res = await fetch('http://localhost:8080/api/admin/quiz/all', {
        method: 'DELETE',
        headers: { 'Authorization': `Bearer ${token}` }
      })
      if (res.ok) {
        alert('All questions removed.')
        fetchQuizQuestions(token)
      } else {
        alert('Failed to clear questions.')
      }
    } catch (e) {
      alert('Error clearing questions.')
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

    const currentToken = token || localStorage.getItem('token')
    if (!currentToken) {
      setUploadStatus({ success: '', error: 'Session expired or missing token. Please logout and log back in.' })
      router.push('/login')
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
        headers: { 'Authorization': `Bearer ${currentToken}` },
        body: formData
      })
      if (res.ok) {
        setUploadStatus({ success: 'Image uploaded successfully!', error: '' })
        setUploadData({
          file: null,
          isAi: false,
          modelUsed: '',
          roundNumber: uploadData.roundNumber,
          bonusQuestion: 'What AI Model was used to generate this image?',
          answerDetails: '',
          glitchCoordinates: '',
          isLightning: false
        })
        if (fileInputRef.current) fileInputRef.current.value = ''
        fetchImages(currentToken)
      } else if (res.status === 401 || res.status === 403) {
        setUploadStatus({ success: '', error: 'Session expired (HTTP 403 Forbidden). Please click Logout and log in again as admin.' })
      } else {
        let msg = `Upload failed (Status: ${res.status})`
        try {
          const data = await res.json()
          if (data.message) msg = data.message
        } catch (_) {}
        setUploadStatus({ success: '', error: msg })
      }
    } catch (err) {
      setUploadStatus({ success: '', error: 'Network error connecting to backend: ' + err.message })
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
        const err = await res.json().catch(() => ({}))
        alert(err.message || 'Failed to delete image')
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
    <div style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', background: '#060812', color: '#E8E8E8' }}>
      {/* Navigation Header */}
      <nav className="glass-panel" style={{ margin: '16px auto', width: 'calc(100% - 32px)', maxWidth: '1750px', padding: '16px 28px', display: 'flex', justifyContent: 'space-between', alignItems: 'center', borderRadius: '12px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
        <div style={{ display: 'flex', alignItems: 'center', gap: '14px' }}>
          <h1 style={{ fontSize: '1.25rem', fontWeight: 'bold', letterSpacing: '1px' }}>
            <span style={{ background: 'linear-gradient(135deg, #38BDF8 0%, #E01B22 100%)', WebkitBackgroundClip: 'text', WebkitTextFillColor: 'transparent' }}>PIXEL PARADOX</span> ORGANIZER
          </h1>
          <span className="badge badge-active" style={{ background: 'rgba(224,27,34,0.15)', borderColor: '#E01B22', color: '#FF4D4D' }}>Admin Panel</span>
        </div>
        <div style={{ display: 'flex', gap: '10px', alignItems: 'center', flexWrap: 'wrap' }}>
          <Link 
            href="/leaderboard" 
            target="_blank" 
            className="btn-primary" 
            style={{ 
              padding: '8px 16px', 
              fontSize: '0.85rem', 
              textDecoration: 'none', 
              display: 'inline-flex', 
              alignItems: 'center', 
              gap: '6px',
              background: 'linear-gradient(135deg, #0284C7 0%, #E01B22 100%)',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.4)'
            }}
          >
            🏆 Big-Screen Leaderboard ↗
          </Link>
          <button onClick={() => router.push('/admin/teams')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            👥 Registered Teams
          </button>
          <button onClick={() => router.push('/admin/recordings')} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem' }}>
            📹 Webcam Recordings
          </button>
          <button onClick={handleLogout} className="btn-secondary" style={{ padding: '8px 16px', fontSize: '0.85rem', color: '#FF4D4D' }}>
            Logout
          </button>
        </div>
      </nav>

      {/* Tab Selectors */}
      <div style={{ padding: '0 16px', width: '100%', maxWidth: '1750px', margin: '0 auto 16px auto', display: 'flex', gap: '8px', flexWrap: 'wrap' }}>
        <button 
          onClick={() => setActiveTab('control')} 
          className={activeTab === 'control' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          🎮 Game Control Room
        </button>
        <button 
          onClick={() => setActiveTab('quiz')} 
          className={activeTab === 'quiz' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          📝 Quiz Manager (Stage 0) {quizQuestions.length > 0 && <span style={{ marginLeft: '6px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px' }}>{quizQuestions.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('media')} 
          className={activeTab === 'media' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          🖼️ Media Manager (Stages 1-3) {images.length > 0 && <span style={{ marginLeft: '6px', fontSize: '0.75rem', background: 'rgba(255,255,255,0.2)', padding: '2px 6px', borderRadius: '10px' }}>{images.length}</span>}
        </button>
        <button 
          onClick={() => setActiveTab('grading')} 
          className={activeTab === 'grading' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          ⚖️ Grading Station ({submissions.length})
        </button>
        <button 
          onClick={() => setActiveTab('leaderboard')} 
          className={activeTab === 'leaderboard' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          🏆 Real-Time Leaderboard
        </button>
        <button 
          onClick={() => setActiveTab('invigilation')} 
          className={activeTab === 'invigilation' ? 'btn-primary' : 'btn-secondary'}
          style={{ padding: '10px 18px', borderRadius: '8px 8px 0 0', fontWeight: '600' }}
        >
          👁️ Invigilation Grid ({Object.keys(webcams).length})
        </button>
      </div>

      <main style={{ flex: 1, padding: '0 16px 60px 16px', width: '100%', maxWidth: '1750px', margin: '0 auto' }}>
        {/* ========================================================= */}
        {/* TAB 1: CONTROL ROOM */}
        {/* ========================================================= */}
        {activeTab === 'control' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 460px) 1fr', gap: '24px' }}>
            {/* Global Game State Config */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                Active Round Config
              </h3>
              
              <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '20px' }}>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Current Stage:</span>
                  <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '4px' }}>
                    {STAGE_NAMES[gameState.activeRound] || `Round ${gameState.activeRound}`}
                  </div>
                </div>
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Active Question ID:</span>
                  <div style={{ fontSize: '1.25rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                    {gameState.activeRound === 1 ? 'Prelims (Self-Paced)' : (gameState.activeQuestionId || 'None')}
                  </div>
                </div>
              </div>

              {/* Set Round Manual Override */}
              <div className="form-group" style={{ marginBottom: '16px' }}>
                <label className="form-label">Set Active Competition Stage</label>
                <select 
                  className="form-input" 
                  value={gameState.activeRound}
                  onChange={(e) => handleUpdateGameState(Number(e.target.value), null, 0, 100)}
                >
                  <option value={0}>Stage 0 - Registration / Lobby</option>
                  <option value={1}>Stage 0 - Prelims (MCQ Quiz - 30 Qs, strictly 30 mins)</option>
                  <option value={2}>Stage 1 - Pixel Detective (Real vs AI - 10 Qs, 40s each)</option>
                  <option value={3}>Stage 2 - The Glitch Hunt (Spot Inconsistencies - 7 Qs, 45s each)</option>
                  <option value={4}>Stage 3 - Prompt Wars (Prompt Engineering - 5 Qs, 75s each)</option>
                  <option value={5}>Stage 5 - Completed / Winner Podium</option>
                </select>
              </div>

              {/* Reset Game Engine */}
              <div style={{ marginTop: '20px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '16px' }}>
                <button 
                  onClick={handleResetGame} 
                  style={{ width: '100%', padding: '12px', background: 'rgba(224,27,34,0.1)', border: '1px solid #E01B22', color: '#FF4D4D', borderRadius: '8px', cursor: 'pointer', fontWeight: 'bold' }}
                >
                  ⚠️ Reset Game Engine (Scores & Submissions)
                </button>
              </div>

              {/* Live Timer control for image questions */}
              {gameState.activeQuestionId && (
                <div style={{ marginTop: '24px', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '20px' }}>
                  <h4 style={{ marginBottom: '12px' }}>Timer Controls</h4>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '16px', marginBottom: '16px' }}>
                    <div style={{ fontSize: '2.5rem', fontWeight: 'bold', color: '#38BDF8', fontFamily: 'var(--font-display)' }}>
                      {timerText}
                    </div>
                    <div>
                      {gameState.timerRunning ? (
                        <button onClick={() => handleToggleTimer(false)} className="btn-secondary" style={{ padding: '8px 16px', borderColor: '#E01B22', color: '#FF4D4D' }}>Pause Timer</button>
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

            {/* Right Panel: Stage-Specific Controls */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              {gameState.activeRound === 1 ? (
                /* Stage 0 Prelims Dashboard */
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    Stage 0: Prelims MCQ Control
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', marginBottom: '20px', lineHeight: '1.5' }}>
                    Stage 0 is a 30-question MCQ quiz conducted with silent 1-minute webcam invigilation. Each team member takes the test independently (strictly 30 minutes, +10 for correct, -5 for wrong, auto-graded in real-time).
                  </p>

                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '14px', marginBottom: '20px' }}>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Questions Configured:</span>
                      <div style={{ fontSize: '1.8rem', fontWeight: 'bold', color: '#fff', marginTop: '4px' }}>
                        {quizQuestions.length}
                      </div>
                    </div>
                    <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                      <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>Status:</span>
                      <div style={{ fontSize: '1.2rem', fontWeight: 'bold', color: '#38BDF8', marginTop: '8px' }}>
                        ● Active / Open
                      </div>
                    </div>
                  </div>

                  <div style={{ display: 'flex', flexDirection: 'column', gap: '10px' }}>
                    <button 
                      onClick={() => setActiveTab('quiz')} 
                      className="btn-primary" 
                      style={{ padding: '12px 20px', width: '100%' }}
                    >
                      ✏️ Open Quiz Manager to Edit / Add Questions
                    </button>
                    <button 
                      onClick={() => setActiveTab('leaderboard')} 
                      className="btn-secondary" 
                      style={{ padding: '12px 20px', width: '100%' }}
                    >
                      🏆 View Prelims Leaderboard & Cutoffs
                    </button>
                  </div>
                </div>
              ) : (
                /* Stages 1-4 Projector Images */
                <div>
                  <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                    {STAGE_NAMES[gameState.activeRound] || `Stage ${gameState.activeRound}`} Questions
                  </h3>
                  <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '16px' }}>
                    Select an image question to project live to participant screens.
                  </p>

                  {images.filter(img => img.roundNumber === gameState.activeRound).length === 0 ? (
                    <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>
                      No images uploaded for {STAGE_NAMES[gameState.activeRound] || `Stage ${gameState.activeRound}`} yet.
                      <div style={{ marginTop: '12px' }}>
                        <button onClick={() => setActiveTab('media')} className="btn-secondary" style={{ padding: '6px 14px', fontSize: '0.8rem' }}>
                          Go to Media Manager to upload
                        </button>
                      </div>
                    </div>
                  ) : (
                    <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(320px, 1fr))', gap: '12px', maxHeight: '520px', overflowY: 'auto', paddingRight: '4px' }}>
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
                              borderColor: gameState.activeQuestionId === img.id ? '#38BDF8' : 'var(--card-border)',
                              background: gameState.activeQuestionId === img.id ? 'rgba(56,189,248,0.1)' : 'var(--card-bg)'
                            }}
                          >
                            <img 
                              src={`http://localhost:8080${img.imageUrl}`} 
                              alt="preview" 
                              style={{ width: '60px', height: '60px', objectFit: 'cover', borderRadius: '4px', border: '1px solid rgba(255,255,255,0.1)' }}
                            />
                            <div style={{ flex: 1, minWidth: 0 }}>
                              <div style={{ fontSize: '0.9rem', fontWeight: '600', textOverflow: 'ellipsis', overflow: 'hidden', whiteSpace: 'nowrap' }}>
                                Question ID: {img.id} {img.isLightning && <span style={{ color: '#F97316', fontSize: '0.75rem', fontWeight: 'bold' }}>[Lightning ⚡]</span>}
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
                                  style={{ padding: '6px 12px', fontSize: '0.75rem', color: '#FF4D4D' }}
                                >
                                  Stop
                                </button>
                              ) : (
                                <button 
                                  onClick={() => handleUpdateGameState(
                                    gameState.activeRound, 
                                    img.id, 
                                    gameState.activeRound === 2 ? 40 : (gameState.activeRound === 3 ? 45 : (gameState.activeRound === 4 ? 75 : 60)),
                                    100
                                  )} 
                                  className="btn-primary" 
                                  style={{ padding: '6px 12px', fontSize: '0.75rem' }}
                                >
                                  Launch
                                </button>
                              )}
                              
                              {/* Zoom adjustment for Stage 3 */}
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
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 2: QUIZ MANAGER (STAGE 0 PRELIMS MCQS) */}
        {/* ========================================================= */}
        {activeTab === 'quiz' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 460px) 1fr', gap: '28px' }}>
            {/* Form: Add / Edit Question */}
            <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                <h3 style={{ fontSize: '1.2rem', fontWeight: 'bold' }}>
                  {editingQuizId ? `Edit Question #${editingQuizId}` : 'Add New MCQ Question'}
                </h3>
                {editingQuizId && (
                  <button onClick={handleCancelEdit} className="btn-secondary" style={{ padding: '4px 10px', fontSize: '0.75rem' }}>
                    Cancel Edit
                  </button>
                )}
              </div>

              {quizStatus.success && (
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {quizStatus.success}
                </div>
              )}
              {quizStatus.error && (
                <div style={{ background: 'rgba(224, 27, 34, 0.1)', border: '1px solid #E01B22', color: '#FF4D4D', borderRadius: '8px', padding: '10px 14px', fontSize: '0.85rem', marginBottom: '16px' }}>
                  {quizStatus.error}
                </div>
              )}

              <form onSubmit={handleSaveQuizQuestion}>
                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem', marginBottom: '4px' }}>Question Text</label>
                  <textarea 
                    name="questionText" 
                    rows={3} 
                    className="form-input" 
                    required 
                    placeholder="Enter the MCQ question text here..."
                    value={quizForm.questionText} 
                    onChange={handleQuizFormChange} 
                  />
                </div>

                <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', marginBottom: '14px' }}>
                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: quizForm.correctOption === 'A' ? '#38BDF8' : 'var(--text-secondary)' }}>
                      Option A {quizForm.correctOption === 'A' && '✓ (Correct)'}
                    </label>
                    <input 
                      type="text" 
                      name="optionA" 
                      className="form-input" 
                      required 
                      placeholder="Choice A text"
                      value={quizForm.optionA} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: quizForm.correctOption === 'B' ? '#38BDF8' : 'var(--text-secondary)' }}>
                      Option B {quizForm.correctOption === 'B' && '✓ (Correct)'}
                    </label>
                    <input 
                      type="text" 
                      name="optionB" 
                      className="form-input" 
                      required 
                      placeholder="Choice B text"
                      value={quizForm.optionB} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: quizForm.correctOption === 'C' ? '#38BDF8' : 'var(--text-secondary)' }}>
                      Option C {quizForm.correctOption === 'C' && '✓ (Correct)'}
                    </label>
                    <input 
                      type="text" 
                      name="optionC" 
                      className="form-input" 
                      required 
                      placeholder="Choice C text"
                      value={quizForm.optionC} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>

                  <div>
                    <label className="form-label" style={{ fontSize: '0.8rem', color: quizForm.correctOption === 'D' ? '#38BDF8' : 'var(--text-secondary)' }}>
                      Option D {quizForm.correctOption === 'D' && '✓ (Correct)'}
                    </label>
                    <input 
                      type="text" 
                      name="optionD" 
                      className="form-input" 
                      required 
                      placeholder="Choice D text"
                      value={quizForm.optionD} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>
                </div>

                <div className="form-group" style={{ marginBottom: '14px' }}>
                  <label className="form-label" style={{ fontSize: '0.85rem' }}>Select Correct Choice</label>
                  <div style={{ display: 'grid', gridTemplateColumns: 'repeat(4, 1fr)', gap: '8px' }}>
                    {['A', 'B', 'C', 'D'].map(opt => (
                      <button
                        type="button"
                        key={opt}
                        onClick={() => setQuizForm(prev => ({ ...prev, correctOption: opt }))}
                        className={quizForm.correctOption === opt ? 'btn-primary' : 'btn-secondary'}
                        style={{ padding: '8px', textAlign: 'center', fontSize: '0.85rem', fontWeight: 'bold' }}
                      >
                        Option {opt}
                      </button>
                    ))}
                  </div>
                </div>

                <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '12px', marginBottom: '16px' }}>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Order Number</label>
                    <input 
                      type="number" 
                      name="orderNum" 
                      className="form-input" 
                      min={1}
                      value={quizForm.orderNum} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>
                  <div className="form-group">
                    <label className="form-label" style={{ fontSize: '0.8rem' }}>Points Awarded</label>
                    <input 
                      type="number" 
                      name="points" 
                      className="form-input" 
                      min={1}
                      value={quizForm.points} 
                      onChange={handleQuizFormChange} 
                    />
                  </div>
                </div>

                <div style={{ display: 'flex', gap: '10px' }}>
                  <button type="submit" className="btn-primary" style={{ flex: 1, padding: '10px' }}>
                    {editingQuizId ? 'Update Question' : '+ Add Question'}
                  </button>
                  {editingQuizId && (
                    <button type="button" onClick={handleCancelEdit} className="btn-secondary" style={{ padding: '10px 16px' }}>
                      Cancel
                    </button>
                  )}
                </div>
              </form>
            </div>

            {/* List & Bulk Controls */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', flexWrap: 'wrap', gap: '10px' }}>
                <div>
                  <h3 style={{ fontSize: '1.25rem', fontWeight: 'bold' }}>
                    Stage 0 Questions Directory ({quizQuestions.length})
                  </h3>
                  <span style={{ fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                    Total Points: {quizQuestions.reduce((sum, q) => sum + (q.points || 1), 0)} pts
                  </span>
                </div>
                <div style={{ display: 'flex', gap: '8px' }}>
                  <button onClick={handleSeedDefaults} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#38BDF8', color: '#38BDF8', background: 'rgba(56,189,248,0.08)' }}>
                    ⚡ Seed 20 Curated Questions
                  </button>
                  <button onClick={handleClearAllQuestions} className="btn-secondary" style={{ padding: '6px 12px', fontSize: '0.8rem', borderColor: '#E01B22', color: '#FF4D4D' }}>
                    🗑️ Clear All
                  </button>
                </div>
              </div>

              {quizQuestions.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '60px 20px', color: 'var(--text-dim)' }}>
                  <p style={{ fontSize: '1.1rem', marginBottom: '12px' }}>No quiz questions configured for Stage 0 Prelims yet.</p>
                  <p style={{ fontSize: '0.85rem', marginBottom: '20px' }}>You can add questions manually using the form on the left, or click the button below to load 20 pre-configured AI & Deepfake questions.</p>
                  <button onClick={handleSeedDefaults} className="btn-primary" style={{ padding: '10px 20px' }}>
                    ⚡ Seed Default 20 Questions
                  </button>
                </div>
              ) : (
                <div style={{ display: 'flex', flexDirection: 'column', gap: '14px', maxHeight: '720px', overflowY: 'auto', paddingRight: '6px' }}>
                  {quizQuestions.map((q, idx) => (
                    <div 
                      key={q.id} 
                      style={{ 
                        background: editingQuizId === q.id ? 'rgba(56,189,248,0.1)' : 'rgba(255,255,255,0.02)', 
                        borderRadius: '8px', 
                        padding: '16px', 
                        border: editingQuizId === q.id ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.06)' 
                      }}
                    >
                      <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', marginBottom: '10px' }}>
                        <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                          <span style={{ background: 'rgba(255,255,255,0.1)', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>
                            Q{q.orderNum || (idx + 1)}
                          </span>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-secondary)' }}>
                            {q.points || 1} pt
                          </span>
                        </div>
                        <div style={{ display: 'flex', gap: '6px' }}>
                          <button 
                            onClick={() => handleEditQuestion(q)} 
                            className="btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem' }}
                          >
                            Edit
                          </button>
                          <button 
                            onClick={() => handleDeleteQuestion(q.id)} 
                            className="btn-secondary" 
                            style={{ padding: '4px 10px', fontSize: '0.75rem', color: '#FF4D4D', borderColor: 'rgba(224,27,34,0.3)' }}
                          >
                            Delete
                          </button>
                        </div>
                      </div>

                      <p style={{ fontSize: '0.95rem', fontWeight: '600', color: '#fff', marginBottom: '12px', lineHeight: '1.4' }}>
                        {q.questionText}
                      </p>

                      <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(200px, 1fr))', gap: '8px', fontSize: '0.85rem' }}>
                        {[
                          { key: 'A', text: q.optionA },
                          { key: 'B', text: q.optionB },
                          { key: 'C', text: q.optionC },
                          { key: 'D', text: q.optionD }
                        ].map((opt) => {
                          const isCorrect = q.correctAnswer === opt.text || q.correctAnswer === opt.key
                          return (
                            <div 
                              key={opt.key} 
                              style={{ 
                                padding: '8px 12px', 
                                borderRadius: '6px', 
                                background: isCorrect ? 'rgba(56, 189, 248, 0.12)' : 'rgba(0,0,0,0.2)', 
                                border: isCorrect ? '1px solid #38BDF8' : '1px solid rgba(255,255,255,0.04)',
                                color: isCorrect ? '#38BDF8' : 'var(--text-secondary)',
                                display: 'flex',
                                alignItems: 'center',
                                gap: '8px'
                              }}
                            >
                              <strong style={{ minWidth: '16px' }}>{opt.key})</strong>
                              <span style={{ flex: 1 }}>{opt.text}</span>
                              {isCorrect && <span style={{ fontWeight: 'bold' }}>✓</span>}
                            </div>
                          )
                        })}
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 3: MEDIA MANAGER (STAGES 1 - 3) */}
        {/* ========================================================= */}
        {activeTab === 'media' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(380px, 460px) 1fr', gap: '28px' }}>
            {/* Upload Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                Upload Visual Question
              </h3>
              
              {uploadStatus.success && <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{uploadStatus.success}</div>}
              {uploadStatus.error && <div style={{ background: 'rgba(224,27,34,0.1)', border: '1px solid #E01B22', color: '#FF4D4D', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{uploadStatus.error}</div>}

              <form onSubmit={handleUploadSubmit}>
                <div className="form-group">
                  <label className="form-label">Target Competition Stage</label>
                  <select name="roundNumber" className="form-input" value={uploadData.roundNumber} onChange={handleUploadChange}>
                    <option value={2}>Stage 1 - Pixel Detective (Real vs AI — 10 Questions, 40s each)</option>
                    <option value={3}>Stage 2 - The Glitch Hunt (Artifacts / Flaws — 7 Questions, 45s each)</option>
                    <option value={4}>Stage 3 - Prompt Wars (Prompt Engineering — 5 Questions, 75s each)</option>
                  </select>
                </div>

                <div className="form-group">
                  <label className="form-label">Image File</label>
                  <input ref={fileInputRef} type="file" name="file" className="form-input" required accept="image/*" onChange={handleUploadChange} />
                </div>

                <div style={{ display: 'flex', gap: '20px', marginBottom: '20px' }}>
                  <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                    <input type="checkbox" name="isAi" checked={uploadData.isAi} onChange={handleUploadChange} style={{ transform: 'scale(1.2)', accentColor: '#E01B22' }} />
                    <span style={{ fontSize: '0.9rem' }}>AI Generated Visual</span>
                  </label>
                  
                  {uploadData.roundNumber === 3 && (
                    <label style={{ display: 'flex', alignItems: 'center', gap: '8px', cursor: 'pointer' }}>
                      <input type="checkbox" name="isLightning" checked={uploadData.isLightning} onChange={handleUploadChange} style={{ transform: 'scale(1.2)', accentColor: '#E01B22' }} />
                      <span style={{ fontSize: '0.9rem', color: '#FF4D4D' }}>Lightning Round</span>
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

                {uploadData.roundNumber === 3 && (
                  <>
                    <div className="form-group">
                      <label className="form-label">Identify Inconsistencies / Expected Glitch Details</label>
                      <textarea name="answerDetails" rows={3} className="form-input" value={uploadData.answerDetails} onChange={handleUploadChange} placeholder="e.g., Distorted fingers, incorrect mirror reflection, shadow angles disagree" />
                    </div>
                    <div className="form-group">
                      <label className="form-label">Glitch Coordinates (Optional X,Y,Radius description)</label>
                      <input type="text" name="glitchCoordinates" className="form-input" value={uploadData.glitchCoordinates} onChange={handleUploadChange} placeholder="e.g. 240, 180, 20" />
                    </div>
                  </>
                )}

                {uploadData.roundNumber === 4 && (
                  <div className="form-group">
                    <label className="form-label">Original Generation Prompt / Target Details</label>
                    <textarea name="answerDetails" rows={3} className="form-input" value={uploadData.answerDetails} onChange={handleUploadChange} placeholder="Describe the original prompt or the deepfake cues that make it real/AI." />
                  </div>
                )}

                <button type="submit" className="btn-primary" style={{ width: '100%', marginTop: '8px' }}>
                  Upload Image Metadata
                </button>
              </form>
            </div>

            {/* List & Manage Panel */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                All Visual Questions Directory
              </h3>
              
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px', maxHeight: '600px', overflowY: 'auto', paddingRight: '4px' }}>
                {[
                  { round: 2, label: 'Stage 1 - Pixel Detective (Target: 10 Qs, 40s per pixel)' },
                  { round: 3, label: 'Stage 2 - The Glitch Hunt (Target: 7 Qs, 45s per pixel)' },
                  { round: 4, label: 'Stage 3 - Prompt Wars (Target: 5 Qs, 75s per pixel)' }
                ].map(({ round, label }) => {
                  const roundImgs = images.filter(img => img.roundNumber === round)
                  return (
                    <div key={round} style={{ borderBottom: '1px solid rgba(255,255,255,0.06)', paddingBottom: '16px' }}>
                      <h4 style={{ fontSize: '1rem', color: '#38BDF8', marginBottom: '10px' }}>
                        {label} ({roundImgs.length})
                      </h4>
                      {roundImgs.length === 0 ? (
                        <p style={{ color: 'var(--text-dim)', fontSize: '0.85rem' }}>No visual questions uploaded yet</p>
                      ) : (
                        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(110px, 1fr))', gap: '12px' }}>
                          {roundImgs.map(img => (
                            <div key={img.id} style={{ position: 'relative', width: '100%', aspectRatio: '1 / 1', borderRadius: '8px', overflow: 'hidden', border: '1px solid rgba(255,255,255,0.1)' }}>
                              <img src={`http://localhost:8080${img.imageUrl}`} alt="item" style={{ width: '100%', height: '100%', objectFit: 'cover' }} />
                              <button 
                                onClick={() => handleDeleteImage(img.id)}
                                style={{ position: 'absolute', top: '2px', right: '2px', background: 'rgba(224,27,34,0.9)', color: '#fff', border: 'none', borderRadius: '50%', width: '18px', height: '18px', fontSize: '10px', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
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

        {/* ========================================================= */}
        {/* TAB 4: GRADING PANEL */}
        {/* ========================================================= */}
        {activeTab === 'grading' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
              <div>
                <h3 style={{ fontSize: '1.25rem', margin: '0 0 4px 0' }}>
                  Grading Station — Pending Submissions ({submissions.length})
                </h3>
                <p style={{ margin: 0, fontSize: '0.8rem', color: 'var(--text-secondary)' }}>
                  Active Stage: <strong style={{ color: '#38BDF8' }}>{STAGE_NAMES[gameState.activeRound] || `Round ${gameState.activeRound}`}</strong>
                </p>
              </div>
              <div style={{ display: 'flex', gap: '10px', alignItems: 'center' }}>
                <span style={{ fontSize: '0.85rem', color: 'var(--text-secondary)' }}>Filter Stage:</span>
                <select 
                  className="form-input" 
                  style={{ width: 'auto', padding: '6px 12px', fontSize: '0.85rem' }}
                  value={gradingFilterRound}
                  onChange={(e) => {
                    const r = parseInt(e.target.value, 10)
                    setGradingFilterRound(r)
                    fetchSubmissionsForGrading(r)
                  }}
                >
                  <option value={0}>All Pending Submissions (Stage 2 & 3)</option>
                  <option value={3}>Stage 2 - The Glitch Hunt</option>
                  <option value={4}>Stage 3 - Prompt Wars</option>
                  <option value={2}>Stage 1 - Pixel Detective</option>
                </select>
                <button 
                  onClick={() => fetchSubmissionsForGrading(gradingFilterRound)} 
                  className="btn-secondary" 
                  style={{ padding: '6px 14px', fontSize: '0.85rem' }}
                >
                  🔄 Refresh
                </button>
              </div>
            </div>
            
            {gradingStatus && <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px' }}>{gradingStatus}</div>}
            
            {gameState.activeRound <= 2 && gradingFilterRound <= 2 && (
              <div style={{ background: 'rgba(56, 189, 248, 0.08)', border: '1px solid rgba(56, 189, 248, 0.3)', color: '#38BDF8', borderRadius: '8px', padding: '14px 18px', marginBottom: '18px', display: 'flex', alignItems: 'center', gap: '12px' }}>
                <span style={{ fontSize: '1.4rem' }}>⚡</span>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.95rem', marginBottom: '2px' }}>Automated Real-Time Scoring Active</div>
                  <div style={{ fontSize: '0.85rem', opacity: 0.9 }}>
                    Stage 0 (MCQ Quiz) and Stage 1 (Pixel Detective) scores are automatically calculated and updated on the real-time leaderboard immediately upon submission. Use the filter dropdown above to inspect Stage 2 (Glitch Hunt) and Stage 3 (Prompt Wars) manual grading queues at any time.
                  </div>
                </div>
              </div>
            )}

            {submissions.length === 0 ? (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No pending submissions for grading in the current active stage.
              </div>
            ) : (
              <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
                {submissions.map((sub) => (
                  <div key={sub.id} className="glass-panel" style={{ padding: '20px', display: 'grid', gridTemplateColumns: '180px 1fr 220px', gap: '24px', alignItems: 'center' }}>
                    <div style={{ textAlign: 'center' }}>
                      {sub.imageQuestion && sub.imageQuestion.imageUrl ? (
                        <img 
                          src={`http://localhost:8080${sub.imageQuestion.imageUrl}`} 
                          alt="question" 
                          style={{ width: '100%', height: '100px', objectFit: 'cover', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.1)' }}
                        />
                      ) : (
                        <div style={{ width: '100%', height: '100px', background: 'rgba(255,255,255,0.05)', borderRadius: '8px', display: 'flex', alignItems: 'center', justifyContent: 'center', color: 'var(--text-dim)' }}>
                          No Image
                        </div>
                      )}
                      <div style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginTop: '8px' }}>
                        Q-ID: {sub.imageQuestion ? sub.imageQuestion.id : 'N/A'}
                      </div>
                    </div>
                    
                    <div>
                      <div style={{ fontSize: '1.1rem', fontWeight: 'bold', color: '#38BDF8', marginBottom: '8px' }}>
                        Team: {sub.user.teamName}
                      </div>
                      <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '16px' }}>
                        <div style={{ background: 'rgba(0,0,0,0.2)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(255,255,255,0.03)' }}>
                          <span style={{ fontSize: '0.75rem', color: 'var(--text-dim)', textTransform: 'uppercase' }}>Team Submission:</span>
                          <p style={{ marginTop: '4px', fontSize: '0.9rem', whiteSpace: 'pre-wrap' }}>{sub.textSubmission || sub.chosenAnswer || 'No text entry'}</p>
                        </div>
                        <div style={{ background: 'rgba(224,27,34,0.03)', padding: '12px', borderRadius: '6px', border: '1px solid rgba(224,27,34,0.1)' }}>
                          <span style={{ fontSize: '0.75rem', color: '#FF4D4D', textTransform: 'uppercase' }}>Expected Answer/Key Details:</span>
                          <p style={{ marginTop: '4px', fontSize: '0.9rem', color: 'var(--text-white)' }}>{sub.imageQuestion ? (sub.imageQuestion.answerDetails || 'None specified') : 'N/A'}</p>
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

        {/* ========================================================= */}
        {/* TAB 5: LEADERBOARD & ADVANCEMENT */}
        {/* ========================================================= */}
        {activeTab === 'leaderboard' && (
          <div style={{ display: 'grid', gridTemplateColumns: 'minmax(0, 1.8fr) minmax(360px, 1fr)', gap: '28px' }}>
            {/* Live Standings Table */}
            <div className="glass-panel" style={{ padding: '24px' }}>
              <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px', flexWrap: 'wrap', gap: '12px' }}>
                <h3 style={{ fontSize: '1.25rem', margin: 0 }}>
                  Live Leaderboard Standings
                </h3>
                <Link 
                  href="/leaderboard" 
                  target="_blank" 
                  className="btn-primary" 
                  style={{ 
                    padding: '6px 14px', 
                    fontSize: '0.82rem', 
                    textDecoration: 'none', 
                    display: 'inline-flex', 
                    alignItems: 'center', 
                    gap: '6px',
                    background: 'linear-gradient(135deg, #0284C7 0%, #E01B22 100%)'
                  }}
                >
                  🚀 Open Full Big-Screen Projector View ↗
                </Link>
              </div>
              
              {leaderboard.length === 0 ? (
                <div style={{ textAlign: 'center', padding: '40px', color: 'var(--text-dim)' }}>No teams registered yet.</div>
              ) : (
                <table style={{ width: '100%', borderCollapse: 'collapse', textAlign: 'left' }}>
                  <thead>
                    <tr style={{ borderBottom: '2px solid rgba(255,255,255,0.08)' }}>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Rank</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)' }}>Team Dossier</th>
                      <th style={{ padding: '12px 8px', color: 'var(--text-secondary)', textAlign: 'center' }}>Stage</th>
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
                          background: team.isEliminated ? 'rgba(224,27,34,0.03)' : 'transparent'
                        }}
                      >
                        <td style={{ padding: '14px 8px', fontWeight: 'bold' }}>{idx + 1}</td>
                        <td style={{ padding: '14px 8px' }}>
                          <div style={{ fontWeight: '600' }}>{team.teamName}</div>
                          <div style={{ fontSize: '0.75rem', color: 'var(--text-secondary)', marginTop: '2px', display: 'flex', gap: '6px', flexWrap: 'wrap' }}>
                            <span style={{ color: '#38BDF8' }}>TID: {team.teamId}</span>
                            <span>•</span>
                            <span>Size: {team.teamSize}</span>
                            {team.memberNames && (
                              <>
                                <span>•</span>
                                <span style={{ color: '#E0E7FF' }}>🧑‍🚀 {team.memberNames}</span>
                              </>
                            )}
                          </div>
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '0.85rem', color: 'var(--text-secondary)' }}>
                          Stage {team.roundNumber !== undefined ? (team.roundNumber - 1) : 0}
                        </td>
                        <td style={{ padding: '14px 8px', textAlign: 'center', fontSize: '1.2rem', fontWeight: 'bold', color: '#38BDF8' }}>
                          {team.score}
                        </td>
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

            {/* Advancement Rules */}
            <div className="glass-panel" style={{ padding: '24px', height: 'fit-content' }}>
              <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
                Round Advancement Rules
              </h3>
              <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginBottom: '20px', lineHeight: '1.4' }}>
                Sort active teams by score, eliminate the lowest performers, and advance qualified teams to the next stage.
              </p>

              {advancementStatus && (
                <div style={{ background: 'rgba(56, 189, 248, 0.1)', border: '1px solid #38BDF8', color: '#38BDF8', borderRadius: '8px', padding: '12px', fontSize: '0.85rem', marginBottom: '16px', textAlign: 'center' }}>
                  {advancementStatus}
                </div>
              )}

              <div style={{ display: 'flex', flexDirection: 'column', gap: '16px' }}>
                {/* Stage 0 -> Stage 1 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Stage 0 Prelims Cutoff</h4>
                    {gameState.activeRound === 1 && <span style={{ fontSize: '0.75rem', background: 'rgba(56,189,248,0.2)', color: '#38BDF8', padding: '2px 8px', borderRadius: '10px' }}>Active Stage</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Qualifies the <strong>Top 50%</strong> of teams for Stage 1: Pixel Detective.</p>
                  <button 
                    onClick={() => handleAdvanceTeams(50, true)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    Advance Top 50% Teams
                  </button>
                </div>

                {/* Stage 1 -> Stage 2 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Stage 1 Pixel Detective Cutoff</h4>
                    {gameState.activeRound === 2 && <span style={{ fontSize: '0.75rem', background: 'rgba(56,189,248,0.2)', color: '#38BDF8', padding: '2px 8px', borderRadius: '10px' }}>Active Stage</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Qualifies the <strong>Top 10</strong> teams for Stage 2: Glitch Hunt.</p>
                  <button 
                    onClick={() => handleAdvanceTeams(10, false)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    Advance Top 10 Teams
                  </button>
                </div>

                {/* Stage 2 -> Stage 3 */}
                <div style={{ background: 'rgba(255,255,255,0.02)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.05)' }}>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                    <h4 style={{ fontSize: '0.95rem', margin: 0 }}>Stage 2 Glitch Hunt Cutoff</h4>
                    {gameState.activeRound === 3 && <span style={{ fontSize: '0.75rem', background: 'rgba(56,189,248,0.2)', color: '#38BDF8', padding: '2px 8px', borderRadius: '10px' }}>Active Stage</span>}
                  </div>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Qualifies the <strong>Top 5</strong> finalists for Stage 3: Prompt Wars.</p>
                  <button 
                    onClick={() => handleAdvanceTeams(5, false)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px' }}
                  >
                    Advance Top 5 Finalists
                  </button>
                </div>

                {/* Custom Advancement */}
                <div style={{ background: 'rgba(56, 189, 248, 0.05)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(56, 189, 248, 0.2)' }}>
                  <h4 style={{ fontSize: '0.95rem', marginBottom: '6px', color: '#38BDF8' }}>Custom Cutoff Advancement</h4>
                  <p style={{ fontSize: '0.8rem', color: 'var(--text-secondary)', marginBottom: '12px' }}>Advance any number or percentage of top teams to the next stage.</p>
                  <div style={{ display: 'grid', gridTemplateColumns: '1fr 1fr', gap: '8px', marginBottom: '10px' }}>
                    <input 
                      type="number" 
                      min={1} 
                      max={100}
                      className="form-input" 
                      style={{ padding: '8px' }}
                      value={customAdvance.value} 
                      onChange={e => setCustomAdvance({ ...customAdvance, value: Math.max(1, parseInt(e.target.value) || 1) })} 
                    />
                    <select 
                      className="form-input" 
                      style={{ padding: '8px' }}
                      value={customAdvance.isPercent ? 'pct' : 'count'}
                      onChange={e => setCustomAdvance({ ...customAdvance, isPercent: e.target.value === 'pct' })}
                    >
                      <option value="count">Teams (Count)</option>
                      <option value="pct">Percent (%)</option>
                    </select>
                  </div>
                  <button 
                    onClick={() => handleAdvanceTeams(customAdvance.value, customAdvance.isPercent)} 
                    className="btn-primary" 
                    style={{ width: '100%', padding: '10px', background: 'linear-gradient(135deg, #0284C7 0%, #E01B22 100%)' }}
                  >
                    Advance Top {customAdvance.value} {customAdvance.isPercent ? '%' : 'Teams'}
                  </button>
                </div>
              </div>
            </div>
          </div>
        )}

        {/* ========================================================= */}
        {/* TAB 6: INVIGILATION GRID */}
        {/* ========================================================= */}
        {activeTab === 'invigilation' && (
          <div className="glass-panel" style={{ padding: '24px' }}>
            <h3 style={{ fontSize: '1.25rem', marginBottom: '16px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '8px' }}>
              Live Invigilation Cameras ({Object.keys(webcams).length} Active)
            </h3>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(280px, 1fr))', gap: '18px' }}>
              {Object.entries(webcams).map(([teamId, data]) => {
                const isStale = Date.now() - data.timestamp > 15000
                return (
                  <div key={teamId} style={{ background: '#000', borderRadius: '8px', overflow: 'hidden', border: `1px solid ${isStale ? '#E01B22' : 'rgba(255,255,255,0.1)'}`, position: 'relative' }}>
                    <img src={data.frame} alt="webcam" style={{ width: '100%', display: 'block', opacity: isStale ? 0.5 : 1 }} />
                    <div style={{ position: 'absolute', bottom: 0, left: 0, right: 0, padding: '4px 8px', background: 'rgba(0,0,0,0.75)', fontSize: '0.75rem', display: 'flex', justifyContent: 'space-between' }}>
                      <span>TID: {teamId}</span>
                      <span style={{ color: '#FF4D4D' }}>{data.participantName}</span>
                    </div>
                    {isStale && (
                      <div style={{ position: 'absolute', top: '50%', left: '50%', transform: 'translate(-50%, -50%)', color: '#FF4D4D', fontWeight: 'bold', fontSize: '0.8rem', background: 'rgba(0,0,0,0.85)', padding: '4px 8px', borderRadius: '4px' }}>
                        FEED STALE
                      </div>
                    )}
                  </div>
                )
              })}
            </div>
            {Object.keys(webcams).length === 0 && (
              <div style={{ textAlign: 'center', padding: '60px', color: 'var(--text-dim)' }}>
                No active webcam streams currently connected.
              </div>
            )}
          </div>
        )}
      </main>
    </div>
  )
}
