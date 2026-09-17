'use client'

import { useEffect, useRef, useState } from 'react'

export default function CustomCursor() {
  const cursorDotRef = useRef(null)
  const cursorRingRef = useRef(null)

  const [isVisible, setIsVisible] = useState(false)
  const [isHovered, setIsHovered] = useState(false)
  const [isClicking, setIsClicking] = useState(false)

  useEffect(() => {
    // Only mount on devices that use a mouse / trackpad (fine pointer)
    const isFinePointer = window.matchMedia('(pointer: fine)').matches
    if (!isFinePointer) return

    // Hide default OS cursor smoothly
    const styleTag = document.createElement('style')
    styleTag.id = 'cyber-cursor-override'
    styleTag.textContent = `html, html *, html *::before, html *::after { cursor: none !important; }`
    document.head.appendChild(styleTag)
    setIsVisible(true)

    let mouseX = -100
    let mouseY = -100
    let ringX = -100
    let ringY = -100
    let isMoving = false
    let rafId = null

    const onMouseMove = (e) => {
      mouseX = e.clientX
      mouseY = e.clientY

      // Hardware-accelerated 0ms direct transform on center precision dot
      if (cursorDotRef.current) {
        cursorDotRef.current.style.transform = `translate3d(${mouseX}px, ${mouseY}px, 0)`
      }

      // Fast check for interactive elements without traversing entire DOM tree
      const target = e.target
      if (target) {
        const tagName = target.tagName
        const isInteractive =
          tagName === 'BUTTON' ||
          tagName === 'A' ||
          tagName === 'INPUT' ||
          tagName === 'TEXTAREA' ||
          tagName === 'SELECT' ||
          target.getAttribute('role') === 'button' ||
          (target.closest && target.closest('button, a, input, [role="button"], .round-tab-btn, .card-hover-lift'))
        setIsHovered(!!isInteractive)
      }

      if (!isMoving) {
        isMoving = true
        startLerpLoop()
      }
    }

    const startLerpLoop = () => {
      if (rafId) return
      const updateRing = () => {
        const dx = mouseX - ringX
        const dy = mouseY - ringY
        ringX += dx * 0.28
        ringY += dy * 0.28

        if (cursorRingRef.current) {
          cursorRingRef.current.style.transform = `translate3d(${ringX}px, ${ringY}px, 0)`
        }

        // Only keep RAF going if the ring has distance left to travel (stops when mouse is still!)
        if (Math.abs(dx) > 0.1 || Math.abs(dy) > 0.1) {
          rafId = requestAnimationFrame(updateRing)
        } else {
          rafId = null
          isMoving = false
        }
      }
      rafId = requestAnimationFrame(updateRing)
    }

    const onMouseDown = () => setIsClicking(true)
    const onMouseUp = () => setIsClicking(false)
    const onMouseLeave = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '0'
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '0'
    }
    const onMouseEnter = () => {
      if (cursorDotRef.current) cursorDotRef.current.style.opacity = '1'
      if (cursorRingRef.current) cursorRingRef.current.style.opacity = '1'
    }

    window.addEventListener('mousemove', onMouseMove, { passive: true })
    window.addEventListener('mousedown', onMouseDown, { passive: true })
    window.addEventListener('mouseup', onMouseUp, { passive: true })
    document.addEventListener('mouseleave', onMouseLeave)
    document.addEventListener('mouseenter', onMouseEnter)

    return () => {
      if (rafId) cancelAnimationFrame(rafId)
      window.removeEventListener('mousemove', onMouseMove)
      window.removeEventListener('mousedown', onMouseDown)
      window.removeEventListener('mouseup', onMouseUp)
      document.removeEventListener('mouseleave', onMouseLeave)
      document.removeEventListener('mouseenter', onMouseEnter)
      if (styleTag) styleTag.remove()
    }
  }, [])

  if (!isVisible) return null

  return (
    <div style={{ pointerEvents: 'none', position: 'fixed', top: 0, left: 0, zIndex: 999999 }}>
      {/* Sleek cyber follower reticle */}
      <div
        ref={cursorRingRef}
        className={`cyber-cursor-ring ${isHovered ? 'cursor-hover' : ''} ${isClicking ? 'cursor-clicking' : ''}`}
        style={{ willChange: 'transform' }}
      >
        <div className="cursor-dashed-ring" />
        <div className="cursor-red-ring" />
      </div>

      {/* Zero-latency precision dot */}
      <div
        ref={cursorDotRef}
        className={`cyber-cursor-dot ${isHovered ? 'dot-hover' : ''} ${isClicking ? 'dot-clicking' : ''}`}
        style={{ willChange: 'transform' }}
      />
    </div>
  )
}
