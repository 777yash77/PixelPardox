'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const SPIDEY_QUOTES = [
  "🕸️ 'With great computing power comes strict deadlines and great responsibility!'",
  "⚡ 'Stage 0: 30 MCQs in strictly 30 mins! (+10 correct, -5 for blind guesses!)'",
  "🎯 'In Round 1, spot the exact AI model (Midjourney vs Flux) for maximum 10 points!'",
  "🔬 'My Spider-Sense detects deepfakes faster than any external proctor!'",
  "⏱️ '40s in R1, 45s in R2, 75s in Grand Finale! Keep calm and trust optical physics!'",
  "☕ 'Coffee break after the round! Right now, keep your eyes locked on the pixel reflections!'"
]

const DEADPOOL_QUOTES = [
  "⚔️ 'Hey! I am a mercenary with swords, not JARVIS or ChatGPT!'",
  "🍕 'Did someone say free victory pizza?! Win Pixel Paradox and treat your squad!'",
  "🤖 'Pro tip: If a character has 8 fingers and 3 ears, it is AI, genius!'",
  "⚡ 'Stage 0 has -5 negative marking! Stop blind guessing like a panicked rookie!'",
  "💥 'The tournament coordinators built this event with coffee and zero sleep. Respect!'",
  "🕶️ 'Maximum Effort! Don't let your careless teammate tank your score to -40!'"
]

// Deadpool Technical Questions (Scoring, Rules, AI Detection, Prompts)
const DEADPOOL_TECH_FAQ = [
  {
    q: "Why is blind guessing suicidal in Stage 0 (-5 penalty)?",
    a: "Math time, rookie! With 4 options, a random guess has a 25% chance of +10 and a 75% chance of -5. Expected value = (0.25 × 10) - (0.75 × 5) = -1.25 points per guess! If you guess 20 questions blindly, you lose 25 points! If you don't know, skip it (0 pts)!"
  },
  {
    q: "How to grab full 10 points in Round 1 (Pixel Detective)?",
    a: "40 seconds timer! If it's a real camera photo = 10 pts. If it's AI generated and you guess the exact model (Midjourney v6, DALL-E 3, Flux) = 10 pts. If you guess AI right but pick the wrong model, you still get 8 pts. Wrong answer = 0 pts!"
  },
  {
    q: "What is Cosine Similarity in Stage 3 Prompt Duel?",
    a: "Cosine Similarity = (A · B) / (||A|| ||B||). In plain English: the server converts your prompt words into mathematical vectors using CLIP neural networks. The closer your descriptive angle is to the original prompt, the closer your score is to 100%!"
  },
  {
    q: "Physical camera sensor noise vs AI smoothing—how to spot?",
    a: "Real DSLR cameras take photos with natural ISO grain, chromatic aberration (purple and green fringes at lens edges), and sharp individual hair strands. AI models smudge hair into smooth noodles and make skin look like plastic butter!"
  },
  {
    q: "What is the best 30-minute time management strategy for Stage 0?",
    a: "30 questions in 30 minutes means you have 60 seconds per question! Don't sprint like you're running for the last train! Spend 40 seconds analyzing, 10 seconds answering, and leave doubt questions for a second pass!"
  },
  {
    q: "Ask Spidey-bug, he may know! 🕸️",
    a: "REFER_TO_SPIDEY" // ONLY THIS explicit choice switches to Spidey
  }
]

// Deadpool Non-Technical / Fun & Banter Questions (Jokes, Trolls, strictly English)
const DEADPOOL_NON_TECH_FAQ = [
  {
    q: "Hey, are you like ChatGPT or JARVIS?",
    a: "Hey! I am a mercenary with swords, not JARVIS! Do I look like a British AI butler in a titanium suit?! I slice through bad pixels and break the fourth wall. Ask me about tournament scoring or tell me to troll Spidey!"
  },
  {
    q: "Troll Spider-Man right now! 🎯",
    a: "TROLL_SPIDEY_GAG"
  },
  {
    q: "Can we bribe the judges with pizza or snacks?",
    a: "Tempting offer! But the tournament coordinators are strictly professional—they will gladly eat your pizza and still deduct -5 marks if your answer is wrong! Focus on the pixels!"
  },
  {
    q: "Can I inspect element or view page source to find the answers?",
    a: "Look at you, Mr. Hacker! You think the organizers learned web development from a five-minute tutorial? Everything is verified server-side on Spring Boot. Stop inspecting element and use your eyeballs!"
  },
  {
    q: "What happens if our squad gets -40 in Stage 0?",
    a: "Then your team score goes down in tournament history like the Titanic! The coordinators will probably make you clean all the lab keyboards with a toothbrush. Stop guessing blindly!"
  },
  {
    q: "Can we use ChatGPT on our phones during the round?",
    a: "Oh please try! The automated webcam proctor monitors your face. The moment your eyes dart down like a guilty suspect, the system flags your workstation and banishes your team to the shadow realm!"
  }
]

// Spider-Man Technical Questions (Forensics, Anatomy, Optical Physics)
const SPIDEY_TECH_FAQ = [
  {
    q: "How to distinguish Midjourney v6 vs Flux.1 vs DALL-E 3?",
    a: "Here is Peter Parker's forensic breakdown:\n• Midjourney v6: Cinematic rim lighting, subtle waxy subsurface scattering on skin, painterly artistic flair in the background.\n• Flux.1: Incredible microtexture on fabric, perfect legible English text on signs, but occasional background geometric perspective errors.\n• DALL-E 3: Saturated pastel colors, cartoonish smoothness, ultra-clean commercial look without realistic camera lens imperfections."
  },
  {
    q: "Why do AI diffusion models struggle with drawing human hands?",
    a: "Biomechanical complexity! A human hand has 27 bones, 34 muscles, and hundreds of complex rotational angles. 2D diffusion models don't possess 3D skeletal kinematic models—they just predict statistical pixel clusters, leading to extra fingers or melted knuckles!"
  },
  {
    q: "What is the 3-Point Scan for Stage 2 Deepfake Forensics (45s)?",
    a: "In 45 seconds, execute Peter's 3-Point Scan:\n1) Iris Reflection: Check if both eyes reflect the same ambient light source.\n2) Ear Cartilage: Check if left and right ears have natural symmetrical folds.\n3) Boundary Artifacts: Look for compression mismatches and blurred blending where the neck meets clothing collar!"
  },
  {
    q: "What are the rules and timers for all 4 rounds?",
    a: "• Stage 0 (Prelims): 30 MCQs, strictly 30 mins (+10 correct, -5 wrong).\n• Stage 1 (Pixel Detective): 10 questions, 40s each, real-time leaderboard.\n• Stage 2 (Deepfake Diagnostics): 7 challenges, 45s each.\n• Stage 3 (Prompt Duel Finale): 5 rounds, 75s each with progressive 10% zoom steps!"
  },
  {
    q: "How does progressive 10% zoom work in Stage 3?",
    a: "In Round 3, each pixel image reveals in progressive 10% zoom steps every few seconds. Early zoom challenges your macro-composition instincts (style, medium, artist), while full resolution lets you catch fine details (textures, lighting tokens)!"
  },
  {
    q: "Ask the guy in red spandex on the left! 🌮",
    a: "REFER_TO_DEADPOOL" // ONLY THIS explicit choice switches to Deadpool
  }
]

// Spider-Man Non-Technical / Fun & Banter Questions
const SPIDEY_NON_TECH_FAQ = [
  {
    q: "What does your Spider-Sense say about Deadpool?",
    a: "My Spider-Sense has had a massive headache ever since Wade entered the room! He tried to plug a toaster directly into the main server rack! Don't listen to his chaotic advice—stick to science and logic!"
  },
  {
    q: "How to stay calm when the 40-second timer turns red?",
    a: "Take a deep breath! Web-shooters require precision, and so does pixel forensics. Zoom in on the eyes, check the shadow angles, eliminate two bad choices, and lock in your answer with 5 seconds to spare!"
  },
  {
    q: "Do only textbook geniuses win Pixel Paradox?",
    a: "Not at all! Pixel forensics is not about memorizing definitions—it's about sharp observation, pattern recognition, and staying calm under ticking clocks. Teams with great teamwork win this all the time!"
  },
  {
    q: "Can our team share answers in a chat group?",
    a: "Absolutely not! Peter Parker stands for honesty and fair play! Besides, the automated webcam invigilation and tab-switch monitor will flag you immediately. Play fair and win on genuine merit!"
  },
  {
    q: "What happens if we troll Deadpool?",
    a: "Haha! Wade pretends to be fearless, but if you challenge his logic or remind him that Peter Parker has an actual science degree, he gets totally roasted! Click 'Ask the guy on the left' to see him in action!"
  }
]

export default function Home() {
  const [spideyQuoteIndex, setSpideyQuoteIndex] = useState(0)
  const [deadpoolQuoteIndex, setDeadpoolQuoteIndex] = useState(0)
  const [selectedRoundTab, setSelectedRoundTab] = useState(0)
  const [showSpideyThwip, setShowSpideyThwip] = useState(false)
  const [showDeadpoolPop, setShowDeadpoolPop] = useState(false)

  // Typing simulation state
  const [isDeadpoolTyping, setIsDeadpoolTyping] = useState(false)
  const [isSpideyTyping, setIsSpideyTyping] = useState(false)

  // Chat Category States
  const [deadpoolCategory, setDeadpoolCategory] = useState('technical')
  const [spideyCategory, setSpideyCategory] = useState('technical')

  // Deadpool Chatbot State
  const [isDeadpoolChatOpen, setIsDeadpoolChatOpen] = useState(false)
  const [deadpoolMessages, setDeadpoolMessages] = useState([
    {
      sender: 'deadpool',
      text: "Yo! I'm Deadpool, your friendly neighborhood Merc-With-A-Chat. Pick a question below, or hit 'Ask Spidey-bug' if you want Peter's nerd science!"
    }
  ])
  const [deadpoolInput, setDeadpoolInput] = useState('')
  const deadpoolChatBottomRef = useRef(null)

  // Spider-Man Chatbot State
  const [isSpideyChatOpen, setIsSpideyChatOpen] = useState(false)
  const [spideyMessages, setSpideyMessages] = useState([
    {
      sender: 'spidey',
      text: "Hey there! Spider-Man here! 🕸️ Need real tactical advice for Pixel Paradox? Ask me below, and don't let Wade convince you to guess blindly!"
    }
  ])
  const [spideyInput, setSpideyInput] = useState('')
  const spideyChatBottomRef = useRef(null)

  // Auto-scroll chat windows
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
      setSpideyQuoteIndex(prev => (prev + 1) % SPIDEY_QUOTES.length)
    }, 6000)

    const deadpoolTimer = setInterval(() => {
      setDeadpoolQuoteIndex(prev => (prev + 1) % DEADPOOL_QUOTES.length)
    }, 7000)

    return () => {
      clearInterval(spideyTimer)
      clearInterval(deadpoolTimer)
    }
  }, [])

  // Deadpool Question Click Handler
  const handleDeadpoolAsk = (q, a) => {
    if (a === 'TROLL_SPIDEY_GAG') {
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsDeadpoolTyping(true)

      setTimeout(() => {
        setIsDeadpoolTyping(false)
        // Step 1: Deadpool roasts Spidey in clean sharp English
        setDeadpoolMessages(prev => [
          ...prev,
          { 
            sender: 'deadpool', 
            text: "🎯 HEY SPIDER-NERD! Look at Peter Parker over there—acting like the class teacher's pet who reminds the professor to collect homework! Whining about radioactive spider bites while wearing blue-and-red long johns! Did your aunt knit those tights for you?! Hahaha! 😂💀" 
          }
        ])

        // Step 2: Spidey delivers a sharp witty English comeback
        setTimeout(() => {
          setDeadpoolMessages(prev => [
            ...prev,
            {
              sender: 'spidey',
              text: "🕸️ Oh please, Wade! At least I have an accredited science degree and don't talk to invisible cameras! Focus on the pixel forensics instead of giving unsolicited lectures to the contestants! 😂"
            },
            {
              sender: 'deadpool',
              text: "💥 Big talk from someone who swings on string! Pizza is on you if my squad takes first place on the leaderboard!"
            }
          ])
        }, 1100)
      }, 500)
      return
    }

    if (a === 'REFER_TO_SPIDEY') {
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsDeadpoolTyping(true)

      setTimeout(() => {
        setIsDeadpoolTyping(false)
        setDeadpoolMessages(prev => [
          ...prev,
          { 
            sender: 'deadpool', 
            text: "Whoa whoa! Do I look like a scientific calculator with swords?! I barely passed 8th grade! Ask Spidey-bug he may know! 🕸️ Sending you to web-head on the right right now..." 
          }
        ])

        // Handoff to Spidey
        setTimeout(() => {
          setIsDeadpoolChatOpen(false)
          setIsSpideyChatOpen(true)
          setSpideyMessages(prev => [
            ...prev,
            { 
              sender: 'spidey', 
              text: `🕸️ Spider-Man checking in! Wade just bailed on: "${q}"? Figures! Don't worry, Peter Parker has the actual scientific answer for you!` 
            }
          ])
        }, 800)
      }, 500)
      return
    }

    setDeadpoolMessages(prev => [
      ...prev,
      { sender: 'user', text: q }
    ])
    setIsDeadpoolTyping(true)

    setTimeout(() => {
      setIsDeadpoolTyping(false)
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'deadpool', text: a }
      ])
    }, 450)
  }

  // Spidey Question Click Handler
  const handleSpideyAsk = (q, a) => {
    if (a === 'REFER_TO_DEADPOOL') {
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsSpideyTyping(true)

      setTimeout(() => {
        setIsSpideyTyping(false)
        setSpideyMessages(prev => [
          ...prev,
          { 
            sender: 'spidey', 
            text: "Transferring you over to Wade on the left! Hold onto your web-shooters, fourth-wall chaos incoming... 🌮" 
          }
        ])

        // Handoff to Deadpool
        setTimeout(() => {
          setIsSpideyChatOpen(false)
          setIsDeadpoolChatOpen(true)
          setDeadpoolMessages(prev => [
            ...prev,
            { 
              sender: 'deadpool', 
              text: "🌮 MAXIMUM EFFORT! Did Parker get on his high moral horse again? You came to the right mercenary! What kind of mischief are we planning?" 
            }
          ])
        }, 800)
      }, 500)
      return
    }

    setSpideyMessages(prev => [
      ...prev,
      { sender: 'user', text: q }
    ])
    setIsSpideyTyping(true)

    setTimeout(() => {
      setIsSpideyTyping(false)
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'spidey', text: a }
      ])
    }, 450)
  }

  // Custom Deadpool Input
  const handleSendDeadpoolCustom = (e) => {
    e.preventDefault()
    if (!deadpoolInput.trim()) return

    const query = deadpoolInput.trim().toLowerCase()
    const userText = deadpoolInput.trim()
    setDeadpoolInput('')

    let answer = "Hey! I am a mercenary with swords, not JARVIS or ChatGPT! I don't calculate your team attendance, I slice through bad pixels and hunt for pizza. Check the Technical Rules or Fun & Trolls tabs above, or click 'Ask Spidey-bug'!"

    if (query.includes('jarvis') || query.includes('ai bot') || query.includes('robot') || query.includes('chatgpt') || query.includes('assistant')) {
      answer = "Hey! I am a mercenary with swords, not JARVIS! You think Tony Stark built me? No way! I am pure chaotic energy fueled by coffee and maximum effort!"
    } else if (query.includes('troll') || query.includes('roast spidey') || query.includes('roast spider') || query.includes('attack spidey')) {
      handleDeadpoolAsk("Troll Spider-Man right now! 🎯", "TROLL_SPIDEY_GAG")
      return
    } else if (query.includes('spidey') || query.includes('peter') || query.includes('spider') || query.includes('math') || query.includes('formula') || query.includes('science')) {
      answer = "Peter? He's over on the right side having an existential crisis about responsibility. Click 'Ask Spidey-bug' below to bother him!"
    } else if (query.includes('stage 0') || query.includes('prelim') || query.includes('quiz') || query.includes('negative') || query.includes('-5') || query.includes('guess')) {
      answer = DEADPOOL_TECH_FAQ[0].a
    } else if (query.includes('round 1') || query.includes('stage 1') || query.includes('detective') || query.includes('points') || query.includes('10 points')) {
      answer = DEADPOOL_TECH_FAQ[1].a
    } else if (query.includes('coordinator') || query.includes('organizer') || query.includes('author') || query.includes('creator') || query.includes('director')) {
      answer = "The tournament coordinators are the architects behind this competition! They wrote the code, tuned the -5 penalty, and spent days debugging routes. Bow before the organizers!"
    } else if (query.includes('cheat') || query.includes('camera') || query.includes('webcam') || query.includes('phone') || query.includes('whatsapp')) {
      answer = DEADPOOL_NON_TECH_FAQ[5].a
    } else if (query.includes('food') || query.includes('pizza') || query.includes('snack') || query.includes('bribe') || query.includes('coffee')) {
      answer = DEADPOOL_NON_TECH_FAQ[2].a
    } else if (query.includes('inspect') || query.includes('source') || query.includes('hack')) {
      answer = DEADPOOL_NON_TECH_FAQ[3].a
    } else if (query.includes('finger') || query.includes('hand') || query.includes('midjourney')) {
      answer = "Pro tip: If the character has 11 fingers and ears growing out of their neck, it's AI! For real optical science, click 'Ask Spidey-bug he may know! 🕸️'!"
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
        { sender: 'deadpool', text: answer }
      ])
    }, 450)
  }

  // Custom Spidey Input
  const handleSendSpideyCustom = (e) => {
    e.preventDefault()
    if (!spideyInput.trim()) return

    const query = spideyInput.trim().toLowerCase()
    const userText = spideyInput.trim()
    setSpideyInput('')

    let answer = "Hmm, my Spider-Sense didn't catch that clearly. Try asking about Stage 0 negative marks, Round 1 AI generators (Midjourney vs Flux), or click one of the quick questions below!"

    if (query.includes('deadpool') || query.includes('wade') || query.includes('pizza') || query.includes('snack') || query.includes('bribe')) {
      answer = SPIDEY_NON_TECH_FAQ[0].a
    } else if (query.includes('round 1') || query.includes('model') || query.includes('flux') || query.includes('midjourney') || query.includes('dall-e')) {
      answer = SPIDEY_TECH_FAQ[0].a
    } else if (query.includes('coordinator') || query.includes('organizer') || query.includes('director')) {
      answer = "The tournament coordinators designed the 4 stages, set the timers, and built the live leaderboard. Give it your 100%!"
    } else if (query.includes('stage 0') || query.includes('prelim') || query.includes('negative') || query.includes('-5') || query.includes('rule')) {
      answer = SPIDEY_TECH_FAQ[3].a
    } else if (query.includes('hand') || query.includes('finger') || query.includes('anatomy')) {
      answer = SPIDEY_TECH_FAQ[1].a
    } else if (query.includes('round 2') || query.includes('deepfake') || query.includes('eye') || query.includes('scan')) {
      answer = SPIDEY_TECH_FAQ[2].a
    } else if (query.includes('round 3') || query.includes('zoom') || query.includes('prompt')) {
      answer = SPIDEY_TECH_FAQ[4].a
    } else if (query.includes('hi') || query.includes('hello') || query.includes('hey')) {
      answer = "Hello there! Peter Parker here. Ready to test your AI detection skills? Ask me anything about the four rounds, or ask about Wade on the left if you want a laugh!"
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
        { sender: 'spidey', text: answer }
      ])
    }, 450)
  }

  return (
    <div style={{ minHeight: '100vh', position: 'relative', overflowX: 'hidden', paddingBottom: '100px' }}>
      {/* Spider-Web Corner Accents */}
      <svg className="web-accent" style={{ top: 0, left: 0, width: '220px', height: '220px' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.6" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,75 C60,75 80,85 90,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="0" x2="75" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
      </svg>

      <svg className="web-accent" style={{ top: 0, right: 0, width: '220px', height: '220px', transform: 'scaleX(-1)' }} viewBox="0 0 100 100">
        <path d="M0,0 L100,0 C70,10 40,40 30,100 L0,100 Z" fill="none" stroke="#E01B22" strokeWidth="0.8" opacity="0.6" />
        <path d="M0,25 C30,25 50,45 55,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <path d="M0,50 C40,50 65,65 75,100" fill="none" stroke="#E01B22" strokeWidth="0.5" opacity="0.4" />
        <line x1="0" y1="0" x2="30" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
        <line x1="0" y1="0" x2="75" y2="100" stroke="#E01B22" strokeWidth="0.5" opacity="0.5" />
      </svg>

      {/* TOP-RIGHT: REALISTIC SWINGING SPIDER-MAN WITH ELASTIC SILK */}
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: '7%',
          zIndex: 40,
          pointerEvents: 'auto',
          cursor: 'pointer'
        }}
        onClick={() => {
          setShowSpideyThwip(true)
          setIsSpideyChatOpen(true)
          setTimeout(() => setShowSpideyThwip(false), 1200)
        }}
        onMouseEnter={() => setShowSpideyThwip(true)}
        onMouseLeave={() => setShowSpideyThwip(false)}
        title="Click Spidey to Chat!"
      >
        <div className="spidey-swinging-pro" style={{ display: 'flex', flexDirection: 'column', alignItems: 'center' }}>
          {/* Elastic Silk Line */}
          <div className="web-elastic-line" style={{
            width: '2.5px',
            background: 'linear-gradient(to bottom, #FFFFFF 0%, rgba(255,255,255,0.9) 60%, #E01B22 100%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.8), 0 0 18px rgba(224,27,34,0.6)'
          }} />

          {/* Upside-Down Spidey Avatar */}
          <div style={{
            position: 'relative',
            width: '74px',
            height: '90px',
            transform: 'rotate(180deg)',
            filter: 'drop-shadow(0 8px 18px rgba(224,27,34,0.7))'
          }}>
            {/* THWIP Action Pop */}
            {showSpideyThwip && (
              <div className="comic-badge-thwip">THWIP!</div>
            )}

            {/* Spider-Sense Radiating Crown */}
            <div className="spider-sense-intense" style={{
              position: 'absolute',
              top: '-18px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '56px',
              height: '28px',
              pointerEvents: 'none'
            }}>
              <svg viewBox="0 0 56 28" fill="none">
                <path d="M10,24 Q28,-2 46,24" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
                <path d="M4,18 Q28,-10 52,18" stroke="#EF4444" strokeWidth="2.2" strokeLinecap="round" strokeDasharray="4 2" />
                <path d="M18,25 Q28,8 38,25" stroke="#FACC15" strokeWidth="1.8" strokeLinecap="round" />
              </svg>
            </div>

            {/* Spider-Man Mask SVG */}
            <svg viewBox="0 0 64 80" style={{ width: '100%', height: '100%' }}>
              <path 
                d="M32 4 C16 4, 6 22, 6 48 C6 66, 20 76, 32 76 C44 76, 58 66, 58 48 C58 22, 48 4, 32 4 Z" 
                fill="#D81E27" 
                stroke="#0A0607" 
                strokeWidth="2.8" 
              />
              <path d="M32 4 L32 76 M6 48 Q32 48 58 48 M10 32 Q32 30 54 32 M12 62 Q32 66 52 62 M18 16 Q32 18 46 16" stroke="#7A0A10" strokeWidth="1.2" fill="none" opacity="0.9" />
              <line x1="32" y1="48" x2="10" y2="24" stroke="#7A0A10" strokeWidth="1" />
              <line x1="32" y1="48" x2="54" y2="24" stroke="#7A0A10" strokeWidth="1" />
              <line x1="32" y1="48" x2="16" y2="70" stroke="#7A0A10" strokeWidth="1" />
              <line x1="32" y1="48" x2="48" y2="70" stroke="#7A0A10" strokeWidth="1" />
              <polygon points="12,38 28,45 27,33 14,27" fill="#FFFFFF" stroke="#0A0607" strokeWidth="3" strokeLinejoin="round" />
              <polygon points="50,38 35,36 37,33 50,27" fill="#FFFFFF" stroke="#0A0607" strokeWidth="3" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>

      {/* TOP-LEFT: DEADPOOL ROASTING INVASION (UPPER BANTER) */}
      <div 
        style={{
          position: 'absolute',
          top: 14,
          left: '7%',
          zIndex: 40,
          cursor: 'pointer',
          display: 'flex',
          alignItems: 'center',
          gap: '10px'
        }}
        onClick={() => {
          setShowDeadpoolPop(true)
          setIsDeadpoolChatOpen(true)
          setTimeout(() => setShowDeadpoolPop(false), 1200)
        }}
        title="Click Deadpool to chat!"
      >
        <div className="deadpool-floating" style={{ position: 'relative' }}>
          {showDeadpoolPop && (
            <div className="comic-badge-maximum">MAXIMUM EFFORT!</div>
          )}
          {/* Deadpool Mask Head */}
          <div style={{
            width: '58px',
            height: '58px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #831015 100%)',
            border: '2.5px solid #000',
            boxShadow: '0 6px 18px rgba(226,54,54,0.6), 0 0 12px rgba(0,0,0,0.8)',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            position: 'relative'
          }}>
            {/* Katana Cross on Back */}
            <div style={{ position: 'absolute', top: '-10px', width: '70px', height: '4px', background: '#9CA3AF', border: '1px solid #111827', transform: 'rotate(35deg)', zIndex: -1, borderRadius: '2px' }} />
            <div style={{ position: 'absolute', top: '-10px', width: '70px', height: '4px', background: '#9CA3AF', border: '1px solid #111827', transform: 'rotate(-35deg)', zIndex: -1, borderRadius: '2px' }} />
            
            <svg viewBox="0 0 64 64" style={{ width: '85%', height: '85%' }}>
              <circle cx="32" cy="32" r="28" fill="#C51B24" />
              <ellipse cx="20" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(8 20 32)" />
              <ellipse cx="44" cy="32" rx="10" ry="16" fill="#140608" transform="rotate(-8 44 32)" />
              <path d="M15,31 Q20,29 25,32 Q20,35 15,31 Z" fill="#FFFFFF" />
              <path d="M49,31 Q44,29 39,32 Q44,35 49,31 Z" fill="#FFFFFF" />
            </svg>
          </div>
        </div>

        <div style={{
          background: 'rgba(226, 54, 54, 0.15)',
          border: '1px solid #E23636',
          borderRadius: '8px',
          padding: '6px 12px',
          color: '#FFF',
          fontSize: '0.78rem',
          fontWeight: 'bold',
          display: 'flex',
          flexDirection: 'column'
        }}>
          <span style={{ color: '#FACC15', fontSize: '0.7rem' }}>⚔️ DEADPOOL // MERC-BOT</span>
          <span>Click to Open Chatbot</span>
        </div>
      </div>

      {/* Main Content Container */}
      <div className="container page-transition" style={{ maxWidth: '1100px', margin: '0 auto', padding: '36px 20px' }}>
        
        {/* Multiverse Header Banner */}
        <header style={{ textAlign: 'center', marginBottom: '40px', position: 'relative' }}>
          <div style={{ display: 'inline-flex', alignItems: 'center', gap: '10px', marginBottom: '14px', flexWrap: 'wrap', justifyContent: 'center' }}>
            <span className="shimmer-badge" style={{ 
              border: '1px solid #E01B22', 
              color: '#FF4D4D', 
              padding: '4px 14px', 
              borderRadius: '6px', 
              fontSize: '0.82rem', 
              fontWeight: '800',
              letterSpacing: '1.5px',
              boxShadow: '0 0 14px rgba(224, 27, 34, 0.4)'
            }}>
              LOGIN 2026 // MULTIVERSE PROTOCOL
            </span>
            <span style={{ 
              background: 'rgba(250, 204, 21, 0.12)', 
              border: '1px solid #FACC15', 
              color: '#FACC15', 
              padding: '4px 12px', 
              borderRadius: '6px', 
              fontSize: '0.82rem', 
              fontWeight: '700',
              letterSpacing: '1px'
            }}>
              ⚡ DEPT OF COMPUTER APPLICATIONS
            </span>
          </div>

          <h1 className="glitch-text hero-floating-anim" data-text="PIXEL PARADOX" style={{ 
            fontSize: 'clamp(2.8rem, 7vw, 4.8rem)', 
            letterSpacing: '3px',
            lineHeight: 1.05,
            marginBottom: '8px',
            textTransform: 'uppercase',
            filter: 'drop-shadow(0 0 20px rgba(224, 27, 34, 0.4))'
          }}>
            PIXEL PARADOX
          </h1>

          <div style={{ 
            display: 'inline-block',
            fontSize: 'clamp(1.1rem, 2.5vw, 1.6rem)', 
            fontWeight: '600', 
            color: '#FF4D4D', 
            letterSpacing: '3px',
            textTransform: 'uppercase',
            textShadow: '0 0 16px rgba(224,27,34,0.7)',
            marginBottom: '16px'
          }}>
            THE REALITY GLITCH // REAL OR AI?
          </div>

          <p style={{ maxWidth: '820px', margin: '0 auto', color: 'var(--text-secondary)', fontSize: '1.05rem', lineHeight: '1.6' }}>
            Step inside the high-stakes Multiverse of Generative AI. Decode neural hallucinations, separate authentic photos from synthetic deepfakes, and prove your team is the sharpest in the multiverse!
          </p>

          {/* Interactive Live Tournament Metrics Ribbon */}
          <div style={{
            display: 'grid',
            gridTemplateColumns: 'repeat(auto-fit, minmax(180px, 1fr))',
            gap: '12px',
            maxWidth: '920px',
            margin: '28px auto 0',
            textAlign: 'left'
          }}>
            <div className="interactive-stat-box" style={{ padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#FF6B6B', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Stage 0 // Prelims</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#FFF' }}>30 Qs / 30 Mins</div>
              <div style={{ fontSize: '0.75rem', color: '#FACC15' }}>+10 Correct / -5 Penalty</div>
            </div>

            <div className="interactive-stat-box" style={{ padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#38BDF8', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Stage 1 // Detective</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#FFF' }}>10 Pixels / 40s</div>
              <div style={{ fontSize: '0.75rem', color: '#4ADE80' }}>Real (10) | AI Model (10)</div>
            </div>

            <div className="interactive-stat-box" style={{ padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#A78BFA', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Stage 2 // Inpainting</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#FFF' }}>7 Challenges / 45s</div>
              <div style={{ fontSize: '0.75rem', color: '#C084FC' }}>Forensic Artifact Scan</div>
            </div>

            <div className="interactive-stat-box" style={{ padding: '12px 16px', borderRadius: '10px' }}>
              <div style={{ fontSize: '0.72rem', color: '#FACC15', fontWeight: 'bold', textTransform: 'uppercase', letterSpacing: '1px' }}>Stage 3 // Grand Finale</div>
              <div style={{ fontSize: '1.15rem', fontWeight: 'bold', color: '#FFF' }}>5 Prompts / 75s</div>
              <div style={{ fontSize: '0.75rem', color: '#38BDF8' }}>10% Zoom Step Duel</div>
            </div>
          </div>
        </header>

        {/* Quick Action Station Cards */}
        <div style={{ 
          display: 'grid', 
          gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', 
          gap: '20px', 
          marginBottom: '44px' 
        }}>
          <Link href="/register" style={{ textDecoration: 'none' }}>
            <div className="comic-card card-hover-lift" style={{ padding: '26px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #E01B22' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🕸️</span>
                  <span className="badge" style={{ background: 'rgba(224,27,34,0.2)', color: '#FF4D4D', borderColor: '#E01B22' }}>Teams of 2-4</span>
                </div>
                <h3 style={{ fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Assemble Your Team
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  Register your squad with Team Leader &amp; member credentials. Prepare for Stage 0 Prelims!
                </p>
              </div>
              <span className="btn-primary" style={{ marginTop: '20px', width: '100%', fontSize: '0.9rem' }}>
                Register Squad →
              </span>
            </div>
          </Link>

          <Link href="/login" style={{ textDecoration: 'none' }}>
            <div className="comic-card card-hover-lift" style={{ padding: '26px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #38BDF8' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>⚡</span>
                  <span className="badge" style={{ background: 'rgba(56,189,248,0.15)', color: '#38BDF8', borderColor: '#38BDF8' }}>Game Arena</span>
                </div>
                <h3 style={{ fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Enter Battle Arena
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  Sign in with Team ID &amp; Password. Jump directly to Stage 0 Prelims or projected live questions.
                </p>
              </div>
              <span className="btn-secondary" style={{ marginTop: '20px', width: '100%', fontSize: '0.9rem', borderColor: 'rgba(56,189,248,0.4)', color: '#38BDF8' }}>
                Sign In Portal →
              </span>
            </div>
          </Link>

          <Link href="/leaderboard" style={{ textDecoration: 'none' }}>
            <div className="comic-card card-hover-lift" style={{ padding: '26px', height: '100%', display: 'flex', flexDirection: 'column', justifyContent: 'space-between', borderLeft: '4px solid #FACC15' }}>
              <div>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '10px' }}>
                  <span style={{ fontSize: '1.5rem' }}>🏆</span>
                  <span className="badge" style={{ background: 'rgba(250,204,21,0.15)', color: '#FACC15', borderColor: '#FACC15' }}>Automated Live</span>
                </div>
                <h3 style={{ fontSize: '1.35rem', textTransform: 'uppercase', letterSpacing: '1px', marginBottom: '8px' }}>
                  Live Leaderboard
                </h3>
                <p style={{ color: 'var(--text-secondary)', fontSize: '0.88rem', lineHeight: '1.5' }}>
                  Standings updated automatically in real time for Stage 0 &amp; 1 with zero manual grading delay.
                </p>
              </div>
              <span className="btn-secondary" style={{ marginTop: '20px', width: '100%', fontSize: '0.9rem', borderColor: 'rgba(250,204,21,0.4)', color: '#FACC15' }}>
                View Standings →
              </span>
            </div>
          </Link>
        </div>

        {/* ========================================================= */}
        {/* INTERACTIVE ROUND DEEP-DIVE STATION (ALL 4 ROUNDS DETAILED) */}
        {/* ========================================================= */}
        <section className="comic-card" style={{ padding: '32px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '24px', flexWrap: 'wrap', gap: '14px' }}>
            <div>
              <span style={{ color: '#E01B22', fontSize: '0.82rem', fontWeight: 'bold', letterSpacing: '2px', textTransform: 'uppercase' }}>
                Complete Tournament Intelligence
              </span>
              <h2 style={{ fontSize: '1.9rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Detailed Round Protocols &amp; Rules
              </h2>
            </div>
            <div style={{ background: 'rgba(74, 222, 128, 0.1)', border: '1px solid #4ADE80', color: '#4ADE80', padding: '6px 14px', borderRadius: '20px', fontSize: '0.82rem', fontWeight: 'bold', display: 'flex', alignItems: 'center', gap: '6px' }}>
              <span className="pulse-dot" style={{ width: '8px', height: '8px', background: '#4ADE80', borderRadius: '50%' }}></span>
              Live Real-Time Scoring
            </div>
          </div>

          {/* Interactive Round Selectors */}
          <div style={{ display: 'flex', gap: '10px', marginBottom: '24px', flexWrap: 'wrap' }}>
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
          <div style={{ background: 'rgba(0,0,0,0.4)', borderRadius: '12px', padding: '24px', border: '1px solid rgba(255,255,255,0.06)' }}>
            {selectedRoundTab === 0 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 0 // PRELIMS</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Multiverse Gauntlet (MCQ Quiz)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid #FACC15', color: '#FACC15', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ Strictly 30 Minutes</span>
                    <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>📝 30 MCQs</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  Stage 0 is a self-paced technical screening challenge. Each registered team member logs in on their own workstation and completes the 30 questions independently. The test locks and auto-submits strictly after 30 minutes.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(240px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>+10 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Awarded for every correct answer selected.</div>
                  </div>
                  <div style={{ background: 'rgba(224,27,34,0.08)', border: '1px solid rgba(224,27,34,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FF4D4D', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>-5 Points Penalty</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Deducted for incorrect answers (Negative Marking).</div>
                  </div>
                  <div style={{ background: 'rgba(250,204,21,0.08)', border: '1px solid rgba(250,204,21,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#FACC15', fontWeight: 'bold', fontSize: '1rem', marginBottom: '4px' }}>Team Average Formula</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem' }}>Sum of all member scores / registered team size (2–4).</div>
                  </div>
                </div>

                <div style={{ background: 'rgba(255,255,255,0.03)', padding: '14px', borderRadius: '8px', borderLeft: '3px solid #38BDF8', fontSize: '0.88rem' }}>
                  <strong style={{ color: '#38BDF8' }}>🛡️ Anti-Cheat Protocol:</strong> Silent 1-minute webcam invigilation operates during the exam to ensure total academic integrity. Results are scored automatically by the engine with zero wait time.
                </div>
              </div>
            )}

            {selectedRoundTab === 1 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 1 // PROJECTED</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Pixel Detective (Real vs AI)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid #FACC15', color: '#FACC15', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 40 Seconds / Pixel</span>
                    <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>🖼️ 10 Questions</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  Teams gather around the main projector display where 10 ultra-realistic images are projected for 40 seconds each. Teams must lock in whether the visual is an authentic photograph or generated by an AI model.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(220px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(74,222,128,0.08)', border: '1px solid rgba(74,222,128,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#4ADE80', fontWeight: 'bold', fontSize: '1rem' }}>+10 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Real image correctly identified, OR AI image + correct model name.</div>
                  </div>
                  <div style={{ background: 'rgba(56,189,248,0.08)', border: '1px solid rgba(56,189,248,0.3)', padding: '14px', borderRadius: '8px' }}>
                    <div style={{ color: '#38BDF8', fontWeight: 'bold', fontSize: '1rem' }}>+8 Points</div>
                    <div style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>AI image correctly identified, but model guess is wrong or blank.</div>
                  </div>
                  <div style={{ background: 'rgba(224,27,34,0.08)', border: '1px solid rgba(224,27,34,0.3)', padding: '14px', borderRadius: '8px' }}>
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
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 2 // ARTIFACTS</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>The Glitch Hunt (Artifact Investigation)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid #FACC15', color: '#FACC15', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 45 Seconds / Pixel</span>
                    <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>🔍 7 Questions</span>
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
                    <strong style={{ color: '#FACC15' }}>⚡ Lightning Round:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '4px' }}>Surprise rapid-fire images where the fastest descriptive submissions earn extra points.</p>
                  </div>
                </div>
              </div>
            )}

            {selectedRoundTab === 3 && (
              <div className="stagger-fade-in">
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'flex-start', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
                  <div>
                    <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 10px', borderRadius: '4px', fontSize: '0.75rem', fontWeight: 'bold' }}>STAGE 3 // GRAND FINALE</span>
                    <h3 style={{ fontSize: '1.45rem', marginTop: '6px' }}>Prompt Wars (Showdown &amp; Reverse Engineering)</h3>
                  </div>
                  <div style={{ display: 'flex', gap: '8px' }}>
                    <span style={{ background: 'rgba(250,204,21,0.15)', border: '1px solid #FACC15', color: '#FACC15', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>⏱️ 75 Seconds / Visual</span>
                    <span style={{ background: 'rgba(56,189,248,0.15)', border: '1px solid #38BDF8', color: '#38BDF8', padding: '4px 12px', borderRadius: '6px', fontSize: '0.85rem', fontWeight: 'bold' }}>👑 5 Showdowns</span>
                  </div>
                </div>

                <p style={{ color: 'var(--text-secondary)', lineHeight: '1.6', marginBottom: '20px' }}>
                  The premier grand finale! The highest-ranking finalist squads clash in a battle of reverse prompt deduction and deepfake provenance forensics.
                </p>

                <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(260px, 1fr))', gap: '16px', marginBottom: '20px' }}>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#38BDF8', fontSize: '0.95rem' }}>🔬 Progressive Zoom Reveal:</strong>
                    <p style={{ color: 'var(--text-secondary)', fontSize: '0.85rem', marginTop: '6px' }}>
                      Visuals start at extreme 10% zoom magnification. Admin reveals 25%, 50%, 75%, and 100% full view. The earlier you reconstruct the exact prompt semantics, the higher your score.
                    </p>
                  </div>
                  <div style={{ background: 'rgba(255,255,255,0.03)', padding: '16px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.08)' }}>
                    <strong style={{ color: '#FACC15', fontSize: '0.95rem' }}>🏆 Winner Takes All Podium:</strong>
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
        <section className="comic-card" style={{ padding: '32px', marginBottom: '48px' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '14px', marginBottom: '16px' }}>
            <span style={{ fontSize: '1.8rem' }}>🕷️</span>
            <div>
              <h3 style={{ fontSize: '1.3rem', textTransform: 'uppercase', letterSpacing: '1px' }}>
                Rules of Engagement // Multiverse Protocol
              </h3>
              <span style={{ fontSize: '0.8rem', color: '#FF4D4D' }}>FAIR PLAY &amp; PROTOCOLS STRICTLY ENFORCED</span>
            </div>
          </div>

          <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(280px, 1fr))', gap: '18px', fontSize: '0.9rem', color: 'var(--text-secondary)', lineHeight: '1.6' }}>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <strong style={{ color: '#FFF' }}>1. Automated Stage 0 &amp; 1:</strong>
              <p style={{ marginTop: '4px' }}>
                Quiz (30 questions, strictly 30 min timer) and Round 1 (10 pixels, 40s each) calculate scores automatically with instant leaderboard broadcast.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <strong style={{ color: '#FFF' }}>2. Silent Invigilation:</strong>
              <p style={{ marginTop: '4px' }}>
                During Stage 0, participant webcams capture snapshots to ensure honest testing. The organizer console monitors all feeds in real time.
              </p>
            </div>
            <div style={{ background: 'rgba(255,255,255,0.02)', padding: '14px', borderRadius: '8px', border: '1px solid rgba(255,255,255,0.04)' }}>
              <strong style={{ color: '#FFF' }}>3. Stage Timers Are Absolute:</strong>
              <p style={{ marginTop: '4px' }}>
                When the timer expires, answers lock and submit automatically. Stay focused and keep an eye on the cyber timer!
              </p>
            </div>
          </div>
        </section>

        {/* Footer */}
        <footer style={{ textAlign: 'center', color: 'var(--text-dim)', fontSize: '0.85rem', borderTop: '1px solid rgba(255,255,255,0.08)', paddingTop: '24px' }}>
          <div style={{ marginBottom: '8px', color: '#FF4D4D', fontWeight: 'bold' }}>
            LOGIN 2026 // DEPARTMENT OF COMPUTER APPLICATIONS
          </div>
          <p>Organized by: <strong>Department of Computer Applications (MCA)</strong></p>
          <p style={{ marginTop: '4px', fontSize: '0.78rem', color: 'var(--text-dim)' }}>
            Pixel Paradox Engine v2.6 • Powered by Next.js &amp; Spring Boot
          </p>
        </footer>
      </div>

      {/* ========================================================= */}
      {/* LEFT SIDE: DEADPOOL MERC-WITH-A-CHAT & AUTOMATED CHATBOT */}
      {/* ========================================================= */}
      <div className="sticky-deadpool-bar">
        {/* Chatbot Window (Toggleable) */}
        {isDeadpoolChatOpen ? (
          <div className="deadpool-chat-window">
            {/* Header */}
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
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Deadpool's Merc-Bot</div>
                  <div style={{ fontSize: '0.7rem', color: '#FACC15' }}>● Fourth Wall Breaker // Online</div>
                </div>
              </div>
              <button 
                onClick={() => setIsDeadpoolChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ padding: '14px', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                  <span style={{ fontSize: '0.75rem', color: '#FF4D4D', fontWeight: 'bold' }}>Deadpool is crafting a roast</span>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              )}
              <div ref={deadpoolChatBottomRef} />
            </div>

            {/* Dynamic Popping Suggestion & Suggested Question Chips */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
                <button
                  type="button"
                  className={`cat-tab-btn ${deadpoolCategory === 'technical' ? 'active deadpool' : ''}`}
                  onClick={() => setDeadpoolCategory('technical')}
                  style={{ flex: 1 }}
                >
                  🔬 Technical Rules
                </button>
                <button
                  type="button"
                  className={`cat-tab-btn ${deadpoolCategory === 'non-technical' ? 'active deadpool' : ''}`}
                  onClick={() => setDeadpoolCategory('non-technical')}
                  style={{ flex: 1 }}
                >
                  🌮 Fun & Trolls
                </button>
              </div>

              {/* Highlighted Popping Suggestion Pill */}
              <div 
                className="popping-suggestion-pill"
                onClick={() => handleDeadpoolAsk("Ask Spidey-bug, he may know! 🕸️", "REFER_TO_SPIDEY")}
                style={{
                  background: 'linear-gradient(135deg, rgba(250, 204, 21, 0.18) 0%, rgba(226, 54, 54, 0.28) 100%)',
                  border: '1.5px solid #FACC15',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#FACC15',
                  fontSize: '0.76rem',
                  fontWeight: 'bold'
                }}
                title="Click to transfer to Spider-Man!"
              >
                <span>💥 'Ask Spidey-bug he may know!' 🕸️</span>
                <span style={{ background: '#FACC15', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem' }}>SWITCH ➔</span>
              </div>

              <span style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                {deadpoolCategory === 'technical' ? 'Tournament Rules & AI Hints:' : 'Fourth-Wall Banter & Trolls:'}
              </span>
              {(deadpoolCategory === 'technical' ? DEADPOOL_TECH_FAQ : DEADPOOL_NON_TECH_FAQ).map((faq, idx) => (
                <div 
                  key={idx} 
                  className="chat-chip"
                  onClick={() => handleDeadpoolAsk(faq.q, faq.a)}
                >
                  ⚡ {faq.q}
                </div>
              ))}

              {/* Quick Cross-Handoff Button */}
              <div 
                className="cross-char-pill-spidey"
                onClick={() => handleDeadpoolAsk("Ask Spidey-bug, he may know! 🕸️", "REFER_TO_SPIDEY")}
                style={{ marginTop: '4px' }}
              >
                <span>🕸️ Need scientific optical physics?</span>
                <span>Ask Spidey ➔</span>
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendDeadpoolCustom} style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#0A0406' }}>
              <input 
                type="text"
                placeholder="Ask Deadpool anything..."
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
          /* Speech Bubble when Closed */
          <div 
            className="deadpool-speech card-hover-lift" 
            onClick={() => setIsDeadpoolChatOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to open Deadpool's Chatbot!"
          >
            {DEADPOOL_QUOTES[deadpoolQuoteIndex]}
            <div style={{ fontSize: '0.7rem', color: '#FACC15', marginTop: '4px', textAlign: 'left' }}>
              [Click Deadpool to Chat 💬]
            </div>
          </div>
        )}

        {/* Floating Deadpool Mask Action Icon */}
        <div 
          className="deadpool-floating"
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsDeadpoolChatOpen(prev => !prev)}
        >
          <div style={{
            width: '64px',
            height: '64px',
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
      {/* RIGHT SIDE: SPIDER-MAN STICKY WIDGET & SPIDEY'S CHATBOT */}
      {/* ========================================================= */}
      <div className="sticky-spidey-bar">
        {/* Spidey Chatbot Window (Toggleable) */}
        {isSpideyChatOpen ? (
          <div className="spidey-chat-window">
            {/* Header */}
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
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Spidey's Web-Bot</div>
                  <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>● Peter Parker // Tactical Assistant</div>
                </div>
              </div>
              <button 
                onClick={() => setIsSpideyChatOpen(false)}
                style={{ background: 'none', border: 'none', color: '#FFF', fontSize: '1.2rem', cursor: 'pointer', padding: '4px' }}
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div style={{ padding: '14px', maxHeight: '280px', overflowY: 'auto', display: 'flex', flexDirection: 'column' }}>
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
                  <span style={{ fontSize: '0.75rem', color: '#38BDF8', fontWeight: 'bold' }}>Spider-Man is calculating</span>
                  <span className="typing-dot" /><span className="typing-dot" /><span className="typing-dot" />
                </div>
              )}
              <div ref={spideyChatBottomRef} />
            </div>

            {/* Dynamic Popping Suggestion & Suggested Question Chips */}
            <div style={{ padding: '10px 14px', borderTop: '1px solid rgba(255,255,255,0.06)', background: 'rgba(0,0,0,0.3)', display: 'flex', flexDirection: 'column', gap: '6px', maxHeight: '180px', overflowY: 'auto' }}>
              {/* Category Filter Tabs */}
              <div style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
                <button
                  type="button"
                  className={`cat-tab-btn ${spideyCategory === 'technical' ? 'active spidey' : ''}`}
                  onClick={() => setSpideyCategory('technical')}
                  style={{ flex: 1 }}
                >
                  🔬 Forensics & Science
                </button>
                <button
                  type="button"
                  className={`cat-tab-btn ${spideyCategory === 'non-technical' ? 'active spidey' : ''}`}
                  onClick={() => setSpideyCategory('non-technical')}
                  style={{ flex: 1 }}
                >
                  🕷️ Spidey Quips
                </button>
              </div>

              {/* Highlighted Popping Suggestion Pill */}
              <div 
                className="popping-suggestion-pill"
                onClick={() => handleSpideyAsk("Ask the guy in red spandex on the left! 🌮", "REFER_TO_DEADPOOL")}
                style={{
                  background: 'linear-gradient(135deg, rgba(56, 189, 248, 0.18) 0%, rgba(226, 54, 54, 0.25) 100%)',
                  border: '1.5px solid #38BDF8',
                  borderRadius: '8px',
                  padding: '7px 10px',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'space-between',
                  color: '#38BDF8',
                  fontSize: '0.76rem',
                  fontWeight: 'bold'
                }}
                title="Click to transfer to Deadpool!"
              >
                <span>🕷️ 'Ask the guy in red spandex on the left!' 🌮</span>
                <span style={{ background: '#38BDF8', color: '#000', padding: '2px 8px', borderRadius: '4px', fontSize: '0.68rem' }}>SWITCH ➔</span>
              </div>

              <span style={{ fontSize: '0.68rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '2px' }}>
                {spideyCategory === 'technical' ? 'Forensic Science & Strategies:' : 'Spidey Banter & Advice:'}
              </span>
              {(spideyCategory === 'technical' ? SPIDEY_TECH_FAQ : SPIDEY_NON_TECH_FAQ).map((faq, idx) => (
                <div 
                  key={idx} 
                  className="chat-chip-spidey"
                  onClick={() => handleSpideyAsk(faq.q, faq.a)}
                >
                  🕸️ {faq.q}
                </div>
              ))}

              {/* Quick Cross-Handoff Button */}
              <div 
                className="cross-char-pill-deadpool"
                onClick={() => handleSpideyAsk("Ask the guy in red spandex on the left! 🌮", "REFER_TO_DEADPOOL")}
                style={{ marginTop: '4px' }}
              >
                <span>🌮 Need chaotic chimichangas &amp; roasts?</span>
                <span>Ask Wade ➔</span>
              </div>
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendSpideyCustom} style={{ display: 'flex', padding: '10px 12px', borderTop: '1px solid rgba(255,255,255,0.08)', background: '#060B12' }}>
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
          /* Speech Bubble when Closed */
          <div 
            className="spidey-speech card-hover-lift" 
            onClick={() => setIsSpideyChatOpen(true)}
            style={{ cursor: 'pointer' }}
            title="Click to open Spider-Man's Chatbot!"
          >
            {SPIDEY_QUOTES[spideyQuoteIndex]}
            <div style={{ fontSize: '0.7rem', color: '#FACC15', marginTop: '4px', textAlign: 'right' }}>
              [Click Spidey to Chat 💬]
            </div>
          </div>
        )}

        {/* Floating Spidey Action Icon with Spider-Sense */}
        <div 
          style={{ position: 'relative', cursor: 'pointer', display: 'flex', alignItems: 'center', justifyContent: 'center' }}
          onClick={() => setIsSpideyChatOpen(prev => !prev)}
        >
          {/* Spider-Sense Radiating Aura */}
          <div className="spider-sense-active" style={{
            position: 'absolute',
            top: '-18px',
            width: '60px',
            height: '30px',
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 60 30" fill="none">
              <path d="M12,25 Q30,2 48,25" stroke="#FACC15" strokeWidth="3" strokeLinecap="round" />
              <path d="M5,20 Q30,-8 55,20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
            </svg>
          </div>

          {/* Spider-Man Hanging Circle Avatar */}
          <div className="spidey-floating" style={{
            width: '64px',
            height: '64px',
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
              <circle cx="32" cy="32" r="14" fill="none" stroke="#850B12" strokeWidth="1.2" />
              <circle cx="32" cy="32" r="22" fill="none" stroke="#850B12" strokeWidth="1.2" />
              <polygon points="14,30 29,36 28,24 16,18" fill="#FFFFFF" stroke="#0A0607" strokeWidth="2.5" strokeLinejoin="round" />
              <polygon points="50,30 35,36 36,24 48,18" fill="#FFFFFF" stroke="#0A0607" strokeWidth="2.5" strokeLinejoin="round" />
            </svg>
          </div>
        </div>
      </div>
    </div>
  )
}
