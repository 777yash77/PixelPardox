'use client'

import Link from 'next/link'

export default function Home() {
  return (
    <div className="container page-transition" style={{ minHeight: '100vh', display: 'flex', flexDirection: 'column', justifyContent: 'center', padding: '40px 24px' }}>
      <header style={{ textAlign: 'center', marginBottom: '48px' }}>
        <p style={{ textTransform: 'uppercase', letterSpacing: '4px', fontSize: '0.9rem', color: '#00d2ff', fontWeight: 600 }}>LOGIN&apos;26 — Department of MCA</p>
        <h1 className="glow-text cyan-gradient-text" style={{ fontSize: '3.5rem', marginTop: '12px', lineHeight: 1.1 }}>
          Pixel Paradox
        </h1>
        <p className="glow-text" style={{ fontSize: '1.5rem', color: '#00d2ff', fontWeight: '500', marginTop: '4px' }}>
          AI or Reality?
        </p>
      </header>

      <main style={{ maxWidth: '800px', margin: '0 auto', width: '100%' }}>
        {/* Intro Section */}
        <section className="glass-panel" style={{ padding: '32px', marginBottom: '32px', textAlign: 'center' }}>
          <p style={{ fontStyle: 'italic', fontSize: '1.25rem', color: '#f0f4f8', marginBottom: '20px' }}>
            &ldquo;Some images are captured through lenses. Others are born from algorithms. Can you tell which is which?&rdquo;
          </p>
          <p style={{ color: '#8c9cb6', fontSize: '1rem', lineHeight: 1.6 }}>
            Artificial Intelligence has transformed the way digital content is created, producing highly realistic media that often appear indistinguishable from reality. <strong>Pixel Paradox: AI or Reality?</strong> is an engaging technical event designed to challenge participants&apos; observation skills, logical reasoning, and awareness of generative technologies.
          </p>
        </section>

        {/* Action Buttons */}
        <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(250px, 1fr))', gap: '20px', marginBottom: '40px' }}>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <div className="glass-panel flex-center" style={{ padding: '24px', height: '100%', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: '1px solid rgba(0, 114, 255, 0.3)' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Team Registration</h3>
              <p style={{ color: '#8c9cb6', fontSize: '0.85rem', textAlign: 'center' }}>
                Register your team of 2 participants and verify via Gmail OTP to join the competition.
              </p>
              <span className="btn-primary" style={{ marginTop: '8px', width: '100%' }}>Register Now</span>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div className="glass-panel flex-center" style={{ padding: '24px', height: '100%', flexDirection: 'column', gap: '12px', cursor: 'pointer', border: '1px solid rgba(0, 210, 255, 0.3)' }}>
              <h3 style={{ fontSize: '1.25rem' }}>Portal Login</h3>
              <p style={{ color: '#8c9cb6', fontSize: '0.85rem', textAlign: 'center' }}>
                Sign in to your team dashboard to join live rounds or access the admin control panel.
              </p>
              <span className="btn-secondary" style={{ marginTop: '8px', width: '100%' }}>Login Here</span>
            </div>
          </Link>
        </div>

        {/* Rounds Breakdown */}
        <section className="glass-panel" style={{ padding: '32px' }}>
          <h2 style={{ fontSize: '1.5rem', marginBottom: '20px', borderBottom: '1px solid rgba(255,255,255,0.08)', paddingBottom: '12px' }}>Event Rounds Overview</h2>
          <div style={{ display: 'flex', flexDirection: 'column', gap: '20px' }}>
            <div>
              <h4 style={{ color: '#00d2ff', fontSize: '1.1rem' }}>Round 1 — Pixel Detective</h4>
              <p style={{ color: '#8c9cb6', fontSize: '0.9rem', marginTop: '4px' }}>
                Analyze 20 images shown for 10 seconds each. Identify if they are Real or AI-generated. Answer bonus questions about the AI generator models used. Top 50% teams qualify.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#00d2ff', fontSize: '1.1rem' }}>Round 2 — The Glitch Hunt</h4>
              <p style={{ color: '#8c9cb6', fontSize: '0.9rem', marginTop: '4px' }}>
                Examine 10 highly realistic AI images. Describe hidden inconsistencies like impossible reflections, shadow issues, or extra fingers. Includes a surprise Lightning Round image! Top 10 teams advance.
              </p>
            </div>
            <div>
              <h4 style={{ color: '#00d2ff', fontSize: '1.1rem' }}>Round 3 — Prompt Wars (Grand Finale)</h4>
              <p style={{ color: '#8c9cb6', fontSize: '0.9rem', marginTop: '4px' }}>
                Finalists compete in Reverse Prompting (deduce the prompt that created an image) and Deepfake Showdown (evaluate media samples and justify real/synthetic origins).
              </p>
            </div>
          </div>
        </section>
      </main>

      <footer style={{ marginTop: '48px', textAlign: 'center', color: '#5c6c84', fontSize: '0.85rem' }}>
        <p>Event Coordinators: Yaswanth (25MX360) &amp; Vignesh (25MX356)</p>
      </footer>
    </div>
  )
}
