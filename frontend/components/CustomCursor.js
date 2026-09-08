'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const canvasRef = useRef(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  // ── Step 1: Check device & show cursor elements ──────────────────────────────
  useEffect(() => {
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    // Inject style that overrides cursor:none on ALL elements (incl. inline cursor:pointer)
    const styleTag = document.createElement('style')
    styleTag.id = 'cyber-cursor-override'
    styleTag.textContent = `html, html *, html *::before, html *::after { cursor: none !important; }`
    document.head.appendChild(styleTag)

    setIsVisible(true)

    return () => {
      const tag = document.getElementById('cyber-cursor-override')
      if (tag) tag.remove()
    }
  }, [])

  // ── Step 2: Canvas & animation — runs AFTER isVisible=true mounts the elements ─
  useEffect(() => {
    if (!isVisible) return

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY

    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    const trail = []
    const MAX_TRAIL = 24
    const particles = []
    const shockwaves = []

    const colors = [
      { r: 224, g: 27,  b: 34  },
      { r: 56,  g: 189, b: 248 },
      { r: 250, g: 204, b: 21  },
      { r: 255, g: 77,  b: 77  },
    ]

    const addParticles = (x, y, count = 2, speed = 1.2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const s = Math.random() * speed + 0.3
        const c = colors[Math.floor(Math.random() * colors.length)]
        particles.push({ x, y, vx: Math.cos(angle) * s, vy: Math.sin(angle) * s,
          size: Math.random() * 2.8 + 1, color: c, alpha: 1,
          decay: Math.random() * 0.035 + 0.02 })
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90)
    }

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      trail.push({ x: mouseX, y: mouseY, age: 0 })
      if (trail.length > MAX_TRAIL) trail.shift()
      if (Math.random() > 0.35) addParticles(mouseX, mouseY, 1, 0.8)

      const target = e.target
      if (target) {
        const interactive = target.closest(
          'button, a, input, textarea, select, ' +
          '.chat-chip, .chat-chip-spidey, .quiz-option-card, .model-chip-btn, ' +
          '.duel-choice-btn, .card-hover-lift, .comic-card, [role="button"]'
        )
        setIsHovered(!!interactive)
      }
    }

    const onMouseDown = (e) => {
      setIsClicking(true)
      shockwaves.push(
        { x: e.clientX, y: e.clientY, radius: 4,  maxRadius: 48, alpha: 0.95, color: '#E01B22', lineWidth: 2.5 },
        { x: e.clientX, y: e.clientY, radius: 1,  maxRadius: 36, alpha: 0.85, color: '#38BDF8', lineWidth: 1.8 }
      )
      addParticles(e.clientX, e.clientY, 16, 3.6)
    }

    const onMouseUp    = () => setIsClicking(false)
    const onMouseLeave = () => {
      if (cursorDotRef.current)  cursorDotRef.current.style.opacity  = '0'
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0'
    }
    const onMouseEnter = () => {
      if (cursorDotRef.current)  cursorDotRef.current.style.opacity  = '1'
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '1'
    }

    window.addEventListener('mousemove',  onMouseMove,  { passive: true })
    window.addEventListener('mousedown',  onMouseDown)
    window.addEventListener('mouseup',    onMouseUp)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // Lerp follower ring
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }

      // Spotlight
      const spot = ctx.createRadialGradient(ringX, ringY, 0, ringX, ringY, 180)
      spot.addColorStop(0,   'rgba(224,27,34,0.07)')
      spot.addColorStop(0.4, 'rgba(56,189,248,0.04)')
      spot.addColorStop(1,   'rgba(0,0,0,0)')
      ctx.fillStyle = spot
      ctx.beginPath()
      ctx.arc(ringX, ringY, 180, 0, Math.PI * 2)
      ctx.fill()

      // Trail
      if (trail.length > 2) {
        for (let i = 0; i < trail.length - 1; i++) {
          const p1 = trail[i], p2 = trail[i + 1]
          const ratio = i / trail.length
          const alpha = ratio * 0.45
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = i % 2 === 0 ? `rgba(224,27,34,${alpha})` : `rgba(56,189,248,${alpha})`
          ctx.lineWidth = ratio * 2.5 + 0.5
          ctx.lineCap = 'round'
          ctx.stroke()
          if (i > 2 && Math.random() > 0.6) {
            const pOld = trail[i - 2]
            if (Math.hypot(p2.x - pOld.x, p2.y - pOld.y) < 85) {
              ctx.beginPath()
              ctx.moveTo(pOld.x, pOld.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(250,204,21,${alpha * 0.3})`
              ctx.lineWidth = 0.6
              ctx.stroke()
            }
          }
        }
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++
        if (trail[i].age > 18) trail.splice(i, 1)
      }

      // Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.vx *= 0.94; p.vy *= 0.94
        p.alpha -= p.decay
        if (p.alpha <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle   = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`
        ctx.shadowColor = `rgba(${p.color.r},${p.color.g},${p.color.b},0.8)`
        ctx.shadowBlur  = 8
        ctx.fill()
        ctx.shadowBlur  = 0
      }

      // Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i]
        sw.radius += 2.5; sw.alpha -= 0.04
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) { shockwaves.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.strokeStyle = sw.color
        ctx.globalAlpha = sw.alpha
        ctx.lineWidth   = sw.lineWidth || 2
        ctx.shadowColor = sw.color
        ctx.shadowBlur  = 12
        ctx.stroke()
        ctx.globalAlpha = 1
        ctx.shadowBlur  = 0
      }

      animationFrameId = requestAnimationFrame(render)
    }
    render()

    return () => {
      window.removeEventListener('resize',    handleResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup',   onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      cancelAnimationFrame(animationFrameId)
    }
  }, [isVisible]) // ← runs again when isVisible flips true

  // Always render the elements; hide with opacity until visible
  return (
    <div style={{ pointerEvents: 'none' }}>
      {/* Trail canvas */}
      <canvas
        ref={canvasRef}
        className="cyber-cursor-canvas"
        style={{
          position: 'fixed', top: 0, left: 0,
          width: '100vw', height: '100vh',
          pointerEvents: 'none', zIndex: 999990,
          opacity: isVisible ? 1 : 0,
        }}
      />

      {/* Lagging reticle */}
      <div
        ref={cursorRingRef}
        className={`cyber-cursor-ring ${isHovered ? 'cursor-hover' : ''} ${isClicking ? 'cursor-clicking' : ''}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div className="cursor-dashed-ring" />
        <div className="cursor-red-ring" />
      </div>

      {/* Zero-latency center dot */}
      <div
        ref={cursorDotRef}
        className={`cyber-cursor-dot ${isHovered ? 'dot-hover' : ''} ${isClicking ? 'dot-clicking' : ''}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      />
    </div>
  )
}
