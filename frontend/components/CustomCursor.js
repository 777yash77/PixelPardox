'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)
  const canvasRef = useRef(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)
  const [hoverType, setHoverType] = useState('') // 'button', 'link', 'input', 'hero'

  useEffect(() => {
    // Check if pointer is fine (desktop/mouse)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    setIsVisible(true)

    let mouseX = window.innerWidth / 2
    let mouseY = window.innerHeight / 2
    let ringX = mouseX
    let ringY = mouseY
    let isMoving = false
    let idleTimeout

    const canvas = canvasRef.current
    if (!canvas) return
    const ctx = canvas.getContext('2d')
    let animationFrameId

    // Resize canvas
    const handleResize = () => {
      canvas.width = window.innerWidth
      canvas.height = window.innerHeight
    }
    handleResize()
    window.addEventListener('resize', handleResize)

    // Trail nodes & particles
    const trail = []
    const MAX_TRAIL = 24
    const particles = []
    const shockwaves = []

    const colors = [
      { r: 224, g: 27, b: 34 },   // Deadpool Red
      { r: 56, g: 189, b: 248 },  // Spidey / Cyber Blue
      { r: 250, g: 204, b: 21 },  // Neon Gold
      { r: 255, g: 77, b: 77 }    // Bright Crimson
    ]

    const addParticles = (x, y, count = 2, speed = 1.2) => {
      for (let i = 0; i < count; i++) {
        const angle = Math.random() * Math.PI * 2
        const s = (Math.random() * speed + 0.3)
        const c = colors[Math.floor(Math.random() * colors.length)]
        particles.push({
          x,
          y,
          vx: Math.cos(angle) * s,
          vy: Math.sin(angle) * s,
          size: Math.random() * 2.8 + 1,
          color: c,
          alpha: 1,
          decay: Math.random() * 0.035 + 0.02
        })
      }
      if (particles.length > 90) particles.splice(0, particles.length - 90)
    }

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY
      isMoving = true

      // Update dot position immediately for 0-latency feedback
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      // Add trail node
      trail.push({ x: mouseX, y: mouseY, alpha: 1, age: 0 })
      if (trail.length > MAX_TRAIL) trail.shift()

      // Add dynamic cyber sparks on move
      if (Math.random() > 0.35) {
        addParticles(mouseX, mouseY, 1, 0.8)
      }

      clearTimeout(idleTimeout)
      idleTimeout = setTimeout(() => {
        isMoving = false
      }, 150)

      // Detect hover target
      const target = e.target
      if (target) {
        const interactive = target.closest('button, a, input, textarea, select, .chat-chip, .chat-chip-spidey, .quiz-option-card, .model-chip-btn, .duel-choice-btn, .card-hover-lift, .comic-card, [role="button"]')
        if (interactive) {
          setIsHovered(true)
          if (interactive.closest('.spidey-swinging-pro') || interactive.closest('.sticky-spidey-bar')) {
            setHoverType('SPIDEY')
          } else if (interactive.closest('.deadpool-swinging-pro') || interactive.closest('.sticky-deadpool-bar')) {
            setHoverType('DEADPOOL')
          } else if (interactive.tagName === 'INPUT' || interactive.tagName === 'TEXTAREA') {
            setHoverType('INPUT')
          } else {
            setHoverType('TARGET')
          }
        } else {
          setIsHovered(false)
          setHoverType('')
        }
      }
    }

    const onMouseDown = (e) => {
      setIsClicking(true)
      // Spawn shockwave ring
      shockwaves.push({
        x: e.clientX,
        y: e.clientY,
        radius: 4,
        maxRadius: 42,
        alpha: 0.9,
        color: Math.random() > 0.5 ? '#E01B22' : '#38BDF8'
      })
      // Burst particles
      addParticles(e.clientX, e.clientY, 12, 3.2)
    }

    const onMouseUp = () => {
      setIsClicking(false)
    }

    const onMouseLeave = () => {
      setIsVisible(false)
    }

    const onMouseEnter = () => {
      setIsVisible(true)
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown)
    window.addEventListener('mouseup', onMouseUp)
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    // Main animation loop
    const render = () => {
      ctx.clearRect(0, 0, canvas.width, canvas.height)

      // 1. Smooth Follower Ring interpolation (Lerp)
      const lerp = 0.18
      ringX += (mouseX - ringX) * lerp
      ringY += (mouseY - ringY) * lerp

      if (cursorRingRef.current) {
        cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
      }

      // 2. Multiverse Flashlight / Neural Spotlight following cursor
      const spotGrad = ctx.createRadialGradient(ringX, ringY, 0, ringX, ringY, 180)
      spotGrad.addColorStop(0, 'rgba(224, 27, 34, 0.07)')
      spotGrad.addColorStop(0.4, 'rgba(56, 189, 248, 0.04)')
      spotGrad.addColorStop(1, 'rgba(0, 0, 0, 0)')
      ctx.fillStyle = spotGrad
      ctx.beginPath()
      ctx.arc(ringX, ringY, 180, 0, Math.PI * 2)
      ctx.fill()

      // 3. Spider-Web & Cyber Ribbon Trail
      if (trail.length > 2) {
        for (let i = 0; i < trail.length - 1; i++) {
          const p1 = trail[i]
          const p2 = trail[i + 1]
          const ratio = i / trail.length
          const alpha = ratio * 0.45

          // Outer glowing web thread
          ctx.beginPath()
          ctx.moveTo(p1.x, p1.y)
          ctx.lineTo(p2.x, p2.y)
          ctx.strokeStyle = i % 2 === 0 ? `rgba(224, 27, 34, ${alpha})` : `rgba(56, 189, 248, ${alpha})`
          ctx.lineWidth = ratio * 2.5 + 0.5
          ctx.lineCap = 'round'
          ctx.stroke()

          // Cross web-tethers between non-adjacent points for neural mesh effect
          if (i > 2 && Math.random() > 0.6) {
            const pOld = trail[i - 2]
            const dist = Math.hypot(p2.x - pOld.x, p2.y - pOld.y)
            if (dist < 85) {
              ctx.beginPath()
              ctx.moveTo(pOld.x, pOld.y)
              ctx.lineTo(p2.x, p2.y)
              ctx.strokeStyle = `rgba(250, 204, 21, ${alpha * 0.3})`
              ctx.lineWidth = 0.6
              ctx.stroke()
            }
          }
        }
      }

      // Age trail
      for (let i = trail.length - 1; i >= 0; i--) {
        trail[i].age += 1
        if (trail[i].age > 18) {
          trail.splice(i, 1)
        }
      }

      // 4. Render and update Cyber Spark Particles
      for (let i = particles.length - 1; i >= 0; i--) {
        const p = particles[i]
        p.x += p.vx
        p.y += p.vy
        p.vx *= 0.94
        p.vy *= 0.94
        p.alpha -= p.decay

        if (p.alpha <= 0) {
          particles.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(p.x, p.y, p.size, 0, Math.PI * 2)
        ctx.fillStyle = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, ${p.alpha})`
        ctx.shadowColor = `rgba(${p.color.r}, ${p.color.g}, ${p.color.b}, 0.8)`
        ctx.shadowBlur = 8
        ctx.fill()
        ctx.shadowBlur = 0 // reset
      }

      // 5. Render Shockwave Rings
      for (let i = shockwaves.length - 1; i >= 0; i--) {
        const sw = shockwaves[i]
        sw.radius += 2.5
        sw.alpha -= 0.04

        if (sw.alpha <= 0 || sw.radius >= sw.maxRadius) {
          shockwaves.splice(i, 1)
          continue
        }

        ctx.beginPath()
        ctx.arc(sw.x, sw.y, sw.radius, 0, Math.PI * 2)
        ctx.strokeStyle = sw.color
        ctx.globalAlpha = sw.alpha
        ctx.lineWidth = 2
        ctx.shadowColor = sw.color
        ctx.shadowBlur = 12
        ctx.stroke()
        ctx.globalAlpha = 1.0
        ctx.shadowBlur = 0
      }

      animationFrameId = requestAnimationFrame(render)
    }

    render()

    return () => {
      window.removeEventListener('resize', handleResize)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      cancelAnimationFrame(animationFrameId)
    }
  }, [])

  return (
    <div style={{ opacity: isVisible ? 1 : 0, transition: 'opacity 0.25s ease', pointerEvents: 'none' }}>
      {/* Background Interactive Multiverse Trail Canvas */}
      <canvas
        ref={canvasRef}
        className="cyber-cursor-canvas"
        style={{
          position: 'fixed',
          top: 0,
          left: 0,
          width: '100vw',
          height: '100vh',
          pointerEvents: 'none',
          zIndex: 999990
        }}
      />

      {/* Trailing Smooth Reticle Follower Ring */}
      <div
        ref={cursorRingRef}
        className={`cyber-cursor-ring ${isHovered ? 'cursor-hover' : ''} ${isClicking ? 'cursor-clicking' : ''}`}
      >
        {/* Reticle Notches */}
        <div className="cursor-bracket bracket-tl" />
        <div className="cursor-bracket bracket-tr" />
        <div className="cursor-bracket bracket-bl" />
        <div className="cursor-bracket bracket-br" />

        {/* Hover Target Badge */}
        {isHovered && hoverType && (
          <div className="cursor-target-label">
            {hoverType === 'SPIDEY' ? '🕷️ THWIP' : hoverType === 'DEADPOOL' ? '🌮 MAXIMUM' : hoverType === 'INPUT' ? '⚡ EDIT' : '🎯 LOCK'}
          </div>
        )}
      </div>

      {/* Real-time Sharp Precision Dot */}
      <div
        ref={cursorDotRef}
        className={`cyber-cursor-dot ${isHovered ? 'dot-hover' : ''} ${isClicking ? 'dot-clicking' : ''}`}
      />
    </div>
  )
}
