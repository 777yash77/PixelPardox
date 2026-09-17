'use client'

import { useState } from 'react'
import Link from 'next/link'

export default function Home() {
  const [selectedRoundTab, setSelectedRoundTab] = useState(0)

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '100px' }}>
      {/* Spider-Web Corner Accents (Left: Crimson Red, Right: Cyan Blue) */}
      <svg className="web-accent" style={{ top: 0, left: 0, width: '240px', height: '240px' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.6" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,75 C60,75 80,85 90,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="0" x2="75" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
      </svg>

      <svg className="web-accent" style={{ top: 0, right: 0, width: '240px', height: '240px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#38BDF8" strokeWidth="0.8" opacity="0.65" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.45" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.45" />
        <path d="M0,75 C60,75 80,85 90,100" fill="none" stroke="#38BDF8" strokeWidth="0.5" opacity="0.45" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#38BDF8" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="0" x2="75" y2="100" stroke="#38BDF8" strokeWidth="0.5" opacity="0.5" />
      </svg>

      {/* Main Content Container — Expansive Width, Clean Stacked Spacing */}
      <div className="container page-transition" style={{ maxWidth: 'min(1560px, 94vw)', margin: '0 auto', padding: 'clamp(20px, 3vw, 36px) clamp(16px, 3.5vw, 48px) 60px', position: 'relative', zIndex: 40 }}>

        {/* Multiverse Header Banner — Perfectly Centered, Balanced Gaps & Clean Cinematic Alignment */}
        <header style={{
          display: 'flex',
          flexDirection: 'column',
          alignItems: 'center',
          justifyContent: 'center',
          textAlign: 'center',
          width: '100%',
          maxWidth: '1080px',
          margin: '0 auto 52px auto',
          paddingTop: 'clamp(20px, 3.2vw, 40px)',
          paddingLeft: '16px',
          paddingRight: '16px',
          position: 'relative',
          zIndex: 40
        }}>
          {/* Live Multiverse Status Telemetry Banner (Blue & Red Duality) */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.24) 0%, rgba(10, 14, 24, 0.92) 50%, rgba(224, 27, 34, 0.24) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            borderRadius: '24px',
            padding: '7px 22px',
            margin: '0 auto 20px auto',
            position: 'relative',
            zIndex: 40,
            boxShadow: '0 0 22px rgba(2, 132, 199, 0.25), inset 0 0 10px rgba(224, 27, 34, 0.18)'
          }}>
            <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#38BDF8', boxShadow: '0 0 8px #38BDF8', flexShrink: 0 }} />
            <span style={{ fontSize: '0.78rem', color: '#FFF', fontWeight: '800', letterSpacing: '1.4px', textTransform: 'uppercase', fontFamily: 'var(--font-display)', textAlign: 'center' }}>
              MULTIVERSE CLUSTER ONLINE • 4 FORENSIC STAGES ACTIVE • REAL-TIME ENGINE
            </span>
            <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#EF4444', boxShadow: '0 0 8px #EF4444', flexShrink: 0 }} />
          </div>

          {/* Protocol & Department Badges */}
          <div style={{
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '12px',
            margin: '0 auto 24px auto',
            flexWrap: 'wrap',
            position: 'relative',
            zIndex: 40
          }}>
            <span className="shimmer-badge" style={{
              border: '1px solid #38BDF8',
              color: '#38BDF8',
              padding: '6px 18px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '800',
              letterSpacing: '1.4px',
              boxShadow: '0 0 14px rgba(56, 189, 248, 0.35)',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              LOGIN 2026 • MULTIVERSE PROTOCOL
            </span>
            <span style={{
              background: 'rgba(224, 27, 34, 0.14)',
              border: '1px solid rgba(224, 27, 34, 0.5)',
              color: '#FF7B7B',
              padding: '6px 18px',
              borderRadius: '6px',
              fontSize: '0.82rem',
              fontWeight: '700',
              letterSpacing: '1px',
              display: 'inline-flex',
              alignItems: 'center',
              justifyContent: 'center'
            }}>
              ⚡ DEPT OF COMPUTER APPLICATIONS
            </span>
          </div>

          {/* Main Title Heading — Centered Horizontally & Vertically Balanced */}
          <h1 className="hero-title-cinematic" style={{
            fontSize: 'clamp(2.8rem, 6.8vw, 5.2rem)',
            margin: '0 auto 24px auto',
            position: 'relative',
            zIndex: 40,
            textAlign: 'center',
            display: 'inline-block'
          }}>
            PIXEL PARADOX
          </h1>

          {/* Subtitle Heading Tagline — Centered with Balanced Gap */}
          <div style={{
            display: 'inline-flex',
            alignItems: 'center',
            justifyContent: 'center',
            gap: '10px',
            fontSize: 'clamp(0.92rem, 1.8vw, 1.22rem)',
            fontWeight: '800',
            color: '#7DD3FC',
            letterSpacing: '2.5px',
            textTransform: 'uppercase',
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.32) 0%, rgba(10, 14, 24, 0.94) 50%, rgba(224, 27, 34, 0.32) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            padding: '9px 26px',
            borderRadius: '28px',
            textShadow: '0 0 14px rgba(56,189,248,0.7)',
            margin: '0 auto 24px auto',
            position: 'relative',
            zIndex: 40,
            transform: 'translateZ(0)',
            boxShadow: '0 6px 24px rgba(0, 136, 255, 0.25)'
          }}>
            <span style={{ color: '#38BDF8', flexShrink: 0 }}>⚡</span>
            <span>THE REALITY GLITCH — REAL OR AI?</span>
            <span style={{ color: '#FF4D4D', flexShrink: 0 }}>⚡</span>
          </div>

          {/* Cinematic Lead Description — Centered with Comfortable Reading Width */}
          <p style={{
            maxWidth: '820px',
            margin: '0 auto',
            color: 'var(--text-secondary)',
            fontSize: '1.08rem',
            lineHeight: '1.75',
            position: 'relative',
            zIndex: 40,
            textAlign: 'center'
          }}>
            Step inside the high-stakes Multiverse of Generative AI. Decode neural hallucinations, separate authentic photos from synthetic deepfakes, and prove your team is the sharpest in the multiverse!
          </p>
        </header>

        {/* Quick Action Station Cards (Balanced 2-Column Multiverse Duel Layout) */}
        <div style={{
          display: 'grid',
          gridTemplateColumns: 'repeat(auto-fit, minmax(340px, 1fr))',
          gap: '32px',
          marginBottom: '80px'
        }}>
          {/* CARD 01: ONBOARDING (Electric Blue Theme) */}
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <div className="comic-card card-hover-lift cyber-card-blue" style={{
              padding: '24px 22px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '110px', height: '110px', background: 'radial-gradient(circle at top right, rgba(56,189,248,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#7DD3FC', fontWeight: '900', letterSpacing: '1.5px', background: 'rgba(2,132,199,0.22)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(56,189,248,0.5)' }}>
                    STEP 01: ONBOARDING
                  </span>
                  <span className="badge" style={{ background: 'rgba(56,189,248,0.18)', color: '#38BDF8', borderColor: '#0284C7' }}>Teams of 2–3</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: '#FFF' }}>
                  Assemble Your Team
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.55' }}>
                  Register squad credentials with Team Leader ID and operative roster. Once registered, immediately access Stage 0 Prelims!
                </p>
              </div>
              <span className="btn-primary-blue" style={{ marginTop: '18px', width: '100%', fontSize: '0.92rem', textAlign: 'center', display: 'block', padding: '12px', borderRadius: '8px' }}>
                Register Squad ➔
              </span>
            </div>
          </Link>

          {/* CARD 02: BATTLEGROUND (Crimson Red Theme) */}
          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div className="comic-card card-hover-lift cyber-card-red" style={{
              padding: '24px 22px',
              height: '100%',
              display: 'flex',
              flexDirection: 'column',
              justifyContent: 'space-between',
              boxShadow: '0 8px 32px rgba(0,0,0,0.65)',
              position: 'relative',
              overflow: 'hidden'
            }}>
              <div style={{ position: 'absolute', top: 0, right: 0, width: '110px', height: '110px', background: 'radial-gradient(circle at top right, rgba(224,27,34,0.25) 0%, transparent 70%)', pointerEvents: 'none' }} />
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '12px' }}>
                  <span style={{ fontSize: '0.74rem', color: '#FF7B7B', fontWeight: '900', letterSpacing: '1.5px', background: 'rgba(224,27,34,0.18)', padding: '4px 10px', borderRadius: '4px', border: '1px solid rgba(224,27,34,0.5)' }}>
                    STEP 02: BATTLEGROUND
                  </span>
                  <span className="badge" style={{ background: 'rgba(224,27,34,0.2)', color: '#FF4D4D', borderColor: '#E01B22' }}>Live Arena</span>
                </div>
                <h3 style={{ fontSize: '1.45rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px', color: '#FFF' }}>
                  Enter Battle Arena
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.92rem', lineHeight: '1.55' }}>
                  Sign in with Team ID &amp; Password. Tackle the 30-MCQ Prelims, followed by real-time projected visual challenges.
                </p>
              </div>
              <span className="btn-primary-red" style={{ marginTop: '18px', width: '100%', fontSize: '0.92rem', textAlign: 'center', display: 'block', padding: '12px', borderRadius: '8px' }}>
                Access Arena Portal ➔
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* MULTIVERSE STAGE PIPELINE CONDUIT (FLOW FROM 0 TO PODIUM) */}
        {/* ========================================================= */}
        <section style={{ marginBottom: '60px' }}>
          <div style={{
            background: 'linear-gradient(135deg, rgba(14, 22, 38, 0.75) 0%, rgba(26, 12, 18, 0.75) 100%)',
            border: '1.5px solid rgba(56, 189, 248, 0.25)',
            borderRadius: '14px',
            padding: '20px 24px',
            boxShadow: '0 8px 30px rgba(0, 0, 0, 0.5)'
          }}>
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '16px', flexWrap: 'wrap', gap: '10px' }}>
              <div>
                <span style={{ fontSize: '0.74rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '1.4px', textTransform: 'uppercase' }}>
                  TOURNAMENT BATTLE CONDUIT
                </span>
                <h3 style={{ fontSize: '1.35rem', margin: '4px 0 0 0', textTransform: 'uppercase', letterSpacing: '0.8px' }}>
                  The 4-Stage Multiverse Gauntlet
                </h3>
              </div>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#34D399' }} />
                <span style={{ fontSize: '0.76rem', color: '#34D399', fontWeight: 'bold' }}>All 4 Battle Protocols Loaded</span>
              </div>
            </div>

            {/* Pipeline Stage Conduit Flow */}
            <div style={{
              display: 'grid',
              gridTemplateColumns: 'repeat(auto-fit, minmax(210px, 1fr))',
              gap: '12px',
              position: 'relative'
            }}>
              {/* Stage 0 */}
              <div style={{
                background: 'rgba(56, 189, 248, 0.08)',
                border: '1.5px solid rgba(56, 189, 248, 0.4)',
                borderRadius: '10px',
                padding: '14px 16px',
                position: 'relative'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: '900', letterSpacing: '0.8px' }}>STAGE 0</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(56, 189, 248, 0.15)', color: '#7DD3FC', padding: '2px 6px', borderRadius: '4px' }}>30 Mins</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#FFF', marginBottom: '4px' }}>MCQ Screening</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>30 Questions • (+10 / -5 Penalty) • Squad Combined</div>
              </div>

              {/* Stage 1 */}
              <div style={{
                background: 'rgba(2, 132, 199, 0.08)',
                border: '1.5px solid rgba(2, 132, 199, 0.4)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: '900', letterSpacing: '0.8px' }}>STAGE 1</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(2, 132, 199, 0.15)', color: '#BAE6FD', padding: '2px 6px', borderRadius: '4px' }}>40s / Pixel</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#FFF', marginBottom: '4px' }}>Pixel Detective</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>10 Projected Images • Real vs AI &amp; Model Identification</div>
              </div>

              {/* Stage 2 */}
              <div style={{
                background: 'rgba(224, 27, 34, 0.08)',
                border: '1.5px solid rgba(224, 27, 34, 0.4)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#FF7B7B', fontWeight: '900', letterSpacing: '0.8px' }}>STAGE 2</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(224, 27, 34, 0.15)', color: '#FECACA', padding: '2px 6px', borderRadius: '4px' }}>45s / Target</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#FFF', marginBottom: '4px' }}>The Glitch Hunt</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>7 Inpainting Challenges • Anomaly &amp; Artifact Deduction</div>
              </div>

              {/* Stage 3 */}
              <div style={{
                background: 'rgba(249, 115, 22, 0.08)',
                border: '1.5px solid rgba(249, 115, 22, 0.4)',
                borderRadius: '10px',
                padding: '14px 16px'
              }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '6px' }}>
                  <span style={{ fontSize: '0.7rem', color: '#FB923C', fontWeight: '900', letterSpacing: '0.8px' }}>STAGE 3</span>
                  <span style={{ fontSize: '0.68rem', background: 'rgba(249, 115, 22, 0.15)', color: '#FED7AA', padding: '2px 6px', borderRadius: '4px' }}>75s / Duel</span>
                </div>
                <div style={{ fontWeight: 'bold', fontSize: '1.05rem', color: '#FFF', marginBottom: '4px' }}>Prompt Wars</div>
                <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)' }}>5 Showdowns • Reverse Semantic Reconstruction &amp; CLIP</div>
              </div>
            </div>
          </div>
        </section>

        {/* ========================================================= */}
        {/* INTERACTIVE ROUND DEEP-DIVE STATION (ALL 4 ROUNDS DETAILED) */}
        {/* ========================================================= */}
        <section className="comic-card" style={{ padding: '40px 32px', marginBottom: '60px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '28px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span style={{ color: '#E01B22', fontSize: '0.82rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Complete Tournament Intelligence
              </span>
              <h2 style={{ fontSize: '1.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Detailed Round Protocols &amp; Rules
              </h2>
            </div>
            <div style={{ background: 'rgba(224, 27, 34, 0.12)', border: '1px solid #E01B22', color: '#FF6B6B', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="live-pulse-dot" style={{ width: '8px', height: '8px', background: '#EF4444', borderRadius: '50%' }}></span>
              Live Real-Time Scoring
            </div>
          </div>

          {/* Interactive Round Selectors */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '28px', flexWrap: 'wrap' }}>
            {[
              { idx: 0, label: 'Stage 0: Prelims MCQ', badge: '30 Qs / 30m' },
              { idx: 1, label: 'Stage 1: Pixel Detective', badge: '10 Qs / 40s' },
              { idx: 2, label: 'Stage 2: The Glitch Hunt', badge: '7 Qs / 45s' },
              { idx: 3, label: 'Stage 3: Prompt Wars', badge: '5 Qs / 75s' }
            ].map(tab => (
              <button
                key={tab.idx}
                className={`round-tab-btn ${selectedRoundTab === tab.idx ? 'active' : ''}`}
                onClick={() => setSelectedRoundTab(tab.idx)}
              >
                {tab.label} <span style={{ opacity: 0.75, fontSize: '0.75rem', marginLeft: '4px' }}>({tab.badge})</span>
              </button>
            ))}
          </div>

          {/* Detailed Content Panel for Selected Round */}
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '28px', border: '1px solid rgba(224,27,34,0.2)' }}>
            {selectedRoundTab === 0 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 0: PRELIMS</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Multiverse Gauntlet (MCQ Quiz)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF8080', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ Strictly 30 Minutes</span>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF6B6B', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>📝 30 MCQs</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  Stage 0 is a self-paced technical screening challenge. Each registered team member logs in on their own workstation and completes the 30 questions independently. The test locks and auto-submits strictly after 30 minutes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(224,27,34,0.1)', border: '1px solid rgba(224,27,34,0.4)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FFF', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>+10 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Awarded for every correct answer selected.</div>
                  </div>
                  <div style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FF4D4D', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>-5 Points Penalty</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Deducted for incorrect answers (Negative Marking).</div>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.1)', border: '1px solid rgba(56,189,248,0.35)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>Squad Summation Formula</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sum of all member scores combined directly together for team total.</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #E01B22', fontSize: '0.88rem' }}>
                  <strong style={{ color: '#FF6B6B' }}>🛡️ Anti-Cheat Protocol:</strong> Real-time anti-cheat and randomized question delivery operate during the exam to ensure total academic integrity. Results are scored automatically by the engine with zero wait time.
                </div>
              </div>
            )}

            {selectedRoundTab === 1 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 1: PROJECTED</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Pixel Detective (Real vs AI)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF8080', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 40 Seconds / Pixel</span>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF6B6B', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>🖼️ 10 Questions</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  Teams gather around the main projector display where 10 ultra-realistic images are projected for 40 seconds each. Teams must lock in whether the visual is an authentic photograph or generated by an AI model.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(224,27,34,0.1)', border: '1px solid rgba(224,27,34,0.4)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FFF', fontWeight: 'bold', fontSize: '1rem' }}>+10 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Real image correctly identified, OR AI image + correct model name.</div>
                  </div>
                  <div style={{ background: 'rgba(224,27,34,0.08)', border: '1px solid rgba(224,27,34,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FF8080', fontWeight: 'bold', fontSize: '1rem' }}>+8 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>AI image correctly identified, but model guess is wrong or blank.</div>
                  </div>
                  <div style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FF4D4D', fontWeight: 'bold', fontSize: '1rem' }}>0 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Incorrect classification (e.g. AI called Real). Auto-graded!</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #E01B22', fontSize: '0.88rem' }}>
                  <strong style={{ color: '#FF4D4D' }}>🎯 Generator Models to Master:</strong> Midjourney v6, DALL-E 3, Stable Diffusion XL, Flux.1, Adobe Firefly, Claude, and Gemini.
                </div>
              </div>
            )}

            {selectedRoundTab === 2 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 2: ARTIFACTS</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>The Glitch Hunt (Artifact Investigation)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF8080', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 45 Seconds / Pixel</span>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF6B6B', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>🔍 7 Questions</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  AI images may look breathtaking at first glance, but neural algorithms often glitch on physics. In this stage, teams examine 7 photorealistic visuals and write down specific physical anomalies before the 45-second timer expires.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FFF' }}>1. Physical Inconsistencies:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Impossible mirror reflections, disagreeing light sources, missing object shadows.</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FFF' }}>2. Anatomical Distortions:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Fused fingers, asymmetric earlobes, misaligned pupils, repeating dental patterns.</p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FF6B6B' }}>⚡ Lightning Round:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Surprise rapid-fire images where the fastest descriptive submissions earn extra points.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRoundTab === 3 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 3: GRAND FINALE</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Prompt Wars (Showdown &amp; Reverse Engineering)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF8080', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 75 Seconds / Visual</span>
                    <span style={{ background: 'rgba(224,27,34,0.15)', border: '1px solid rgba(224,27,34,0.5)', color: '#FF6B6B', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>👑 5 Showdowns</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  The premier grand finale! The highest-ranking finalist squads clash in a battle of reverse prompt deduction and deepfake provenance forensics.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FF6B6B', fontSize: '0.95rem' }}>🔬 Progressive Resolution Reveal:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                      Visuals start with progressive focal magnification. The projection reveals sequential details towards full 100% view. The earlier you reconstruct the prompt semantics, the higher your score.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FF4D4D', fontSize: '0.95rem' }}>🏆 Winner Takes All Podium:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                      Judges evaluate prompt parameter precision, stylistic keywords (octane render, volumetric lighting, focal lengths), and technical justification.
                    </p>
                  </div>
                </div>
              </div>
            )}
          </div>
        </section>

        {/* Multiverse Protocol Lore Card */}
        <section className="comic-card" style={{ padding: '32px 28px', marginBottom: '60px', borderLeft: '4px solid #38BDF8', borderRight: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <span style={{ fontSize: '1.6rem' }}>⚡</span>
            <div>
              <h3 style={{ fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '1px', margin: 0 }}>
                Rules of Engagement • Multiverse Protocol
              </h3>
              <span style={{ fontSize: '0.78rem', color: '#38BDF8', fontWeight: 'bold', letterSpacing: '1px' }}>FAIR PLAY &amp; PROTOCOLS STRICTLY ENFORCED</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.55' }}>
            <div style={{ background: 'rgba(255,255,255,0.025)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#0284C7', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>01</span>
                <strong style={{ color: '#FFF' }}>Automated Scoring Matrix:</strong>
              </div>
              <p style={{ margin: 0 }}>
                Quiz (30 questions, strictly 30 min timer) and Round 1 (10 pixels, 40s each) calculate scores automatically with instant tournament engine sync.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.025)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(224,27,34,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: '#E01B22', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>02</span>
                <strong style={{ color: '#FFF' }}>Anti-Cheat Protocol:</strong>
              </div>
              <p style={{ margin: 0 }}>
                During Stage 0, participant attempts are evaluated to ensure honest testing. The organizer console monitors scores and progress in real time.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.025)', padding: '16px', borderRadius: '10px', border: '1px solid rgba(56,189,248,0.18)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '8px', marginBottom: '8px' }}>
                <span style={{ background: 'linear-gradient(90deg, #0284C7, #E01B22)', color: '#FFF', padding: '2px 8px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>03</span>
                <strong style={{ color: '#FFF' }}>Stage Timers Are Absolute:</strong>
              </div>
              <p style={{ margin: 0 }}>
                When the timer expires, answers lock and submit automatically. Stay focused and keep an eye on the cyber timer!
              </p>
            </div>
          </div>
        </section>

        {/* ═══════════════════════════════════════════════════════ */}
        {/* PREMIUM FOOTER WITH HELP DESK & STUDENT COORDINATOR CARDS */}
        {/* ═══════════════════════════════════════════════════════ */}
        <footer style={{
          borderTop: '1px solid rgba(255,255,255,0.07)',
          marginTop: '36px',
          paddingTop: '48px',
          paddingBottom: '48px'
        }}>
          {/* Dual-accent header strip */}
          <div style={{
            height: '3px',
            background: 'linear-gradient(90deg, #0284C7 0%, rgba(255,255,255,0.06) 45%, rgba(255,255,255,0.06) 55%, #E01B22 100%)',
            borderRadius: '2px',
            marginBottom: '36px'
          }} />

          {/* Event Identity Row */}
          <div style={{ textAlign: 'center', marginBottom: '32px' }}>
            <div style={{
              display: 'inline-flex',
              alignItems: 'center',
              gap: '10px',
              background: 'linear-gradient(90deg, rgba(2,132,199,0.18) 0%, rgba(10,14,24,0.8) 50%, rgba(224,27,34,0.18) 100%)',
              border: '1px solid rgba(56,189,248,0.3)',
              borderRadius: '30px',
              padding: '8px 20px',
              marginBottom: '14px'
            }}>
              <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>⚡ PIXEL PARADOX 2026</span>
              <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '0.7rem', color: '#FF6B6B', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>HELP DESK &amp; STUDENT COORDINATORS ⚡</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 6px 0' }}>
              Organized by the <strong style={{ color: '#FFF' }}>Department of Computer Applications (MCA)</strong> — PSG College of Technology, Coimbatore
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: 0 }}>
              Need assistance during Stage 0 Prelims, technical setup, or live challenges? Reach out to the student coordinators below.
            </p>
          </div>

          {/* Coordinator Contact Cards */}
          <div style={{ marginBottom: '32px' }}>
            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '20px', maxWidth: '820px', margin: '0 auto' }}>

              {/* Vignesh M Card */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(24, 12, 18, 0.95) 0%, rgba(13, 9, 14, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: '4px solid #E01B22',
                borderRadius: '12px',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFF', letterSpacing: '0.5px' }}>
                      Vignesh M
                    </div>
                    <span style={{ fontSize: '0.62rem', background: 'rgba(239, 68, 68, 0.18)', color: '#FCA5A5', border: '1px solid rgba(239, 68, 68, 0.4)', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.6px' }}>
                      COORDINATOR
                    </span>
                  </div>

                  <a
                    href="tel:+919042223938"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      textDecoration: 'none',
                      margin: '4px 0 10px 0',
                      transition: 'opacity 0.2s ease'
                    }}
                    title="Call Vignesh M"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span style={{ color: '#10B981', fontFamily: 'monospace, sans-serif', fontSize: '1.12rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                      +91 9042223938
                    </span>
                  </a>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    MCA • Dept. of Computer Applications
                  </div>
                </div>

                <a
                  href="mailto:25MX356@psgtech.ac.in?subject=Pixel%20Paradox%20Support"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(239, 68, 68, 0.12)',
                    border: '1px solid rgba(239, 68, 68, 0.4)',
                    color: '#FCA5A5',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✉️ 25MX356@psgtech.ac.in
                </a>
              </div>

              {/* Yashwanth R T Card */}
              <div style={{
                background: 'linear-gradient(145deg, rgba(12, 20, 32, 0.95) 0%, rgba(9, 13, 22, 0.95) 100%)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderLeft: '4px solid #38BDF8',
                borderRadius: '12px',
                padding: '22px 24px',
                display: 'flex',
                flexDirection: 'column',
                justifyContent: 'space-between',
                boxShadow: '0 8px 30px rgba(0, 0, 0, 0.55)'
              }}>
                <div>
                  <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                    <div style={{ fontSize: '1.25rem', fontWeight: '800', color: '#FFF', letterSpacing: '0.5px' }}>
                      Yashwanth R T
                    </div>
                    <span style={{ fontSize: '0.62rem', background: 'rgba(56, 189, 248, 0.18)', color: '#7DD3FC', border: '1px solid rgba(56, 189, 248, 0.4)', padding: '2px 8px', borderRadius: '4px', fontWeight: '800', letterSpacing: '0.6px' }}>
                      COORDINATOR
                    </span>
                  </div>

                  <a
                    href="tel:+917094674171"
                    style={{
                      display: 'inline-flex',
                      alignItems: 'center',
                      gap: '10px',
                      textDecoration: 'none',
                      margin: '4px 0 10px 0',
                      transition: 'opacity 0.2s ease'
                    }}
                    title="Call Yashwanth R T"
                  >
                    <svg viewBox="0 0 24 24" width="18" height="18" fill="none" stroke="#10B981" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" style={{ flexShrink: 0 }}>
                      <path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z" />
                    </svg>
                    <span style={{ color: '#10B981', fontFamily: 'monospace, sans-serif', fontSize: '1.12rem', fontWeight: '800', letterSpacing: '0.5px' }}>
                      +91 7094674171
                    </span>
                  </a>

                  <div style={{ fontSize: '0.78rem', color: 'var(--text-secondary)', marginBottom: '14px' }}>
                    MCA • Dept. of Computer Applications
                  </div>
                </div>

                <a
                  href="mailto:25mx360@psgtech.ac.in?subject=Pixel%20Paradox%20Support"
                  style={{
                    display: 'inline-flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    gap: '6px',
                    background: 'rgba(56, 189, 248, 0.12)',
                    border: '1px solid rgba(56, 189, 248, 0.4)',
                    color: '#7DD3FC',
                    padding: '8px 14px',
                    borderRadius: '8px',
                    fontSize: '0.8rem',
                    fontWeight: '700',
                    textDecoration: 'none',
                    transition: 'all 0.2s ease'
                  }}
                >
                  ✉️ 25mx360@psgtech.ac.in
                </a>
              </div>

            </div>
          </div>

          {/* Quick Help & Protocols Checklist */}
          <div style={{
            background: 'rgba(255, 255, 255, 0.025)',
            border: '1px solid rgba(255, 255, 255, 0.08)',
            borderLeft: '4px solid #38BDF8',
            borderRadius: '10px',
            padding: '16px 20px',
            maxWidth: '820px',
            margin: '0 auto 32px',
            fontSize: '0.86rem',
            color: 'var(--text-secondary)',
            lineHeight: '1.65'
          }}>
            <strong style={{ color: '#FFF' }}>💡 Multiverse Help &amp; Exam Checklist:</strong>
            <ul style={{ margin: '8px 0 0 18px', padding: 0 }}>
              <li><strong>Academic Integrity:</strong> All questions and answers are randomized per participant and verified on the server in real-time.</li>
              <li><strong>Stage 0 Prelims:</strong> 30 Multiple Choice Questions in strictly 30 minutes. Correct answers award +10 points; wrong answers deduct -5 points.</li>
              <li><strong>Squad Summation:</strong> Member scores under the same registered Team ID add directly together into the team total.</li>
              <li><strong>Disconnections:</strong> If your network drops, simply log back in with your Team ID and member name to resume your active test.</li>
            </ul>
          </div>

          {/* Bottom nav links */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <Link href="/login" style={{ color: '#FF7B7B', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              🔑 Team Login
            </Link>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>•</span>
            <Link href="/register" style={{ color: '#86EFAC', textDecoration: 'none', fontSize: '0.82rem', fontWeight: '600', display: 'inline-flex', alignItems: 'center', gap: '4px', padding: '6px 12px', borderRadius: '8px' }}>
              📋 Team Register
            </Link>
          </div>

          {/* Bottom meta line */}
          <div style={{ textAlign: 'center', color: 'rgba(255,255,255,0.22)', fontSize: '0.75rem', display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap' }}>
            <span>Pixel Paradox Engine v2.6</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>Next.js &amp; Spring Boot</span>
            <span style={{ opacity: 0.4 }}>•</span>
            <span>PSG College of Technology © 2026</span>
          </div>
        </footer>
      </div>
    </div>
  )
}
