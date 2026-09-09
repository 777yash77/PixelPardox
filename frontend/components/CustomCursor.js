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
    const MAX_TRAIL = 26
    const particles = []
    const shockwaves = []

    // Multiverse Chromatic Spectrum: Spidey Blue & Cyan, Dark Sapphire Blue, Deadpool Crimson, Scarlet Red, Fiery Orangish
    const colors = [
      { r: 2,   g: 132, b: 199 }, // Spidey Electric Blue
      { r: 56,  g: 189, b: 248 }, // Neon Blue / Cyan
      { r: 29,  g: 78,  b: 216 }, // Deep Sapphire Blue
      { r: 224, g: 27,  b: 34  }, // Deadpool Crimson Red
      { r: 239, g: 68,  b: 68  }, // Bright Scarlet Red
      { r: 249, g: 115, b: 22  }, // Fiery Orangish Accent
      { r: 255, g: 255, b: 255 }, // Pure White Starlight
    ]

    const addParticles = (x, y, count = 2, speed = 1.3) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const s = Math.random() * speed + 0.3
        const c = colors[Math.floor(Math.random() * colors.length)]
        particles.push({
          x, y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          size: Math.random() * 2.8 + 1,
          color: c,
          alpha: 1,
          decay: Math.random() * 0.032 + 0.018
        })
      }
      if (particles.length > 100) particles.splice(0, particles.length - 100)
    }

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY

      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      trail.push({ x: mouseX, y: mouseY, age: 0 })
      if (trail.length > MAX_TRAIL) trail.shift()
      if (Math.random() > 0.28) addParticles(mouseX, mouseY, 1, 0.9)

      const target = e.target
      if (target) {
        const interactive = target.closest(
          'button, a, input, textarea, select, ' +
          '.chat-chip, .chat-chip-spidey, .quiz-option-card, .model-chip-btn, ' +
          '.duel-choice-btn, .card-hover-lift, .comic-card, .btn-primary, .btn-secondary, [role="button"]'
        )
        setIsHovered(!!interactive)
      }
    }

    const onMouseDown = (e) => {
      setIsClicking(true)
      // Triple multicolored shockwaves: Electric Blue -> Deadpool Crimson -> Fiery Orangish
      shockwaves.push(
        { x: e.clientX, y: e.clientY, radius: 4,  maxRadius: 52, alpha: 0.95, color: '#38BDF8', lineWidth: 2.8 },
        { x: e.clientX, y: e.clientY, radius: 2,  maxRadius: 40, alpha: 0.85, color: '#EF4444', lineWidth: 2.0 },
        { x: e.clientX, y: e.clientY, radius: 1,  maxRadius: 28, alpha: 0.75, color: '#F97316', lineWidth: 1.6 }
      )
      addParticles(e.clientX, e.clientY, 20, 3.8)
    }

    const onMouseUp = () => setIsClicking(false)
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

      // Smooth lerp follower ring
      ringX += (mouseX - ringX) * 0.18
      ringY += (mouseY - ringY) * 0.18
      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }

      // Multiverse Dual Spotlight (Spidey Electric Blue core + Deadpool Crimson halo)
      const spot = ctx.createRadialGradient(ringX, ringY, 0, ringX, ringY, 190)
      spot.addColorStop(0,   'rgba(56, 189, 248, 0.08)')
      spot.addColorStop(0.35, 'rgba(0, 136, 255, 0.04)')
      spot.addColorStop(0.65, 'rgba(224, 27, 34, 0.035)')
      spot.addColorStop(1,   'rgba(0, 0, 0, 0)')
      ctx.fillStyle = spot
      ctx.beginPath()
      ctx.arc(ringX, ringY, 190, 0, Math.PI * 2)
      ctx.fill()

      // Chromatic Multicolor Ribbon Trail
      if (trail.length > 2) {
        for (let i = 0; i < trail.length - 1; i++) {
          const p1 = trail[i], p2 = trail[i + 1]
          const ratio = i / trail.length
          const alpha = ratio * 0.55
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          
          // Color cycles between Electric Blue, Darkish Blue, Deadpool Red, and Fiery Orangish
          if (i % 4 === 0) {
            ctx.strokeStyle = `rgba(56, 189, 248, ${alpha})`
          } else if (i % 4 === 1) {
            ctx.strokeStyle = `rgba(2, 132, 199, ${alpha})`
          } else if (i % 4 === 2) {
            ctx.strokeStyle = `rgba(239, 68, 68, ${alpha})`
          } else {
            ctx.strokeStyle = `rgba(249, 115, 22, ${alpha * 0.9})`
          }
          ctx.lineWidth = ratio * 2.8 + 0.6
          ctx.lineCap = 'round'
          ctx.stroke()

          // Subtle silk web connector sparks
          if (i > 2 && Math.random() > 0.65) {
            const pOld = trail[i - 2]
            if (Math.hypot(p2.x - pOld.x, p2.y - pOld.y) < 90) {
              ctx.beginPath()
              ctx.moveTo(pOld.x, pOld.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = i % 2 === 0 ? `rgba(56, 189, 248, ${alpha * 0.35})` : `rgba(255, 120, 120, ${alpha * 0.35})`
              ctx.lineWidth = 0.65
              ctx.stroke()
            }
          }
        }
      }
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age++
        if (trail[i].age > 18) trail.splice(i, 1)
      }

      // Multicolored Spectrum Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx; p.y += p.vy
        p.vx *= 0.94; p.vy *= 0.94
        p.alpha -= p.decay
        if (p.alpha <= 0) { particles.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle   = `rgba(${p.color.r},${p.color.g},${p.color.b},${p.alpha})`
        ctx.shadowColor = `rgba(${p.color.r},${p.color.g},${p.color.b},0.85)`
        ctx.shadowBlur  = 9
        ctx.fill()
        ctx.shadowBlur  = 0
      }

      // Multicolored Expanding Shockwaves
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i]
        sw.radius += 2.6; sw.alpha -= 0.04
        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) { shockwaves.splice(i, 1); continue }
        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.strokeStyle = sw.color
        ctx.globalAlpha = sw.alpha
        ctx.lineWidth   = sw.lineWidth || 2
        ctx.shadowColor = sw.color
        ctx.shadowBlur  = 14
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
  }, [isVisible])

  return (
    <div style={{ pointerEvents: 'none' }}>
      {/* Multiverse trail canvas */}
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

      {/* Lagging circular follower reticle */}
      <div
        ref={cursorRingRef}
        className={`cyber-cursor-ring ${isHovered ? 'cursor-hover' : ''} ${isClicking ? 'cursor-clicking' : ''}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      >
        <div className="cursor-dashed-ring" />
        <div className="cursor-red-ring" />
      </div>

      {/* Zero-latency center crosshair dot */}
      <div
        ref={cursorDotRef}
        className={`cyber-cursor-dot ${isHovered ? 'dot-hover' : ''} ${isClicking ? 'dot-clicking' : ''}`}
        style={{ opacity: isVisible ? 1 : 0 }}
      />
    </div>
  )
}
