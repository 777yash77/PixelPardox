'use client'

import { useState, useEffect, useRef } from 'react'
import Link from 'next/link'

const SPIDEY_QUOTES = [
  "🕸️ 'With great computing power comes strict deadlines and negative marking!'",
  "⚡ 'Stage 0: 30 MCQs in 30 minutes. Correct is +10, but a wrong guess costs you -5!'",
  "🎯 'In Round 1, identifying the exact AI model earns you the full 10 points.'",
  "🔬 'Real camera lenses create consistent sensor noise. Diffusion models produce waxy plastic skin.'",
  "⏱️ '40s in Round 1, 45s in Round 2, 75s in Grand Finale. Stay calm and observe the physics.'",
  "🕷️ 'If I had a dollar for every time Wade gave terrible tournament advice, I could finally pay rent.'",
  "💡 'Check the specular reflections on both irises. Light sources don't lie, but neural networks do.'",
  "🛡️ 'Good teams communicate under pressure. Panicked teams click randomly and lose points.'"
]

const DEADPOOL_QUOTES = [
  "⚔️ 'Hey! I am a mercenary with weapons, not an LLM. Stop typing prompts at me!'",
  "⚡ 'Stage 0 has minus five negative marks! Stop guessing like you're playing the lottery!'",
  "🎯 'Pro tip: If the portrait has fourteen teeth on the top and three on the bottom, it is AI.'",
  "☕ 'The tournament coordinators built this on black coffee and sheer spite. Show some respect.'",
  "🕶️ 'Maximum Effort! If your teammate tries to guess blindly, slap their hand away from the trackpad.'",
  "🎬 'Look at Peter on the right, stressing over photon angles. Just pick an answer, nerd!'",
  "🦄 'I put twenty dollars on your squad winning this. Don't embarrass me in front of Spider-Man.'",
  "🚨 'Inspecting element won't show you the answers, genius. The verification is server-side.'"
]

// Multi-scenario Roast Battles between Deadpool & Spider-Man
const ROAST_BATTLES = [
  {
    tag: "RENT vs FREELANCE",
    deadpool: "Look at Peter Parker over there, squinting at pixel reflections like an exhausted graduate student whose stipend got cancelled. Peter, your arch-nemesis isn't Doctor Octopus—it's your monthly rent. Maybe ask Tony Stark's estate for minimum wage instead of giving free forensic lectures!",
    spidey: "Wade, you're an armed mercenary who literally asked the tournament proctor if you could submit answers by shooting the display. The only reason you understand AI hallucinations is because your entire medical history is an uncontrolled biological error.",
    deadpoolEnd: "Hey! Katanas have a 99% success rate for hardware troubleshooting! Ask any qualified technician!"
  },
  {
    tag: "OPTICS vs CHAOS",
    deadpool: "Peter's entire strategy is writing a peer-reviewed academic thesis on why an eyelid reflection has inconsistent photon diffraction. Bro, by the time you finish your physics monologue, the 40-second timer hits zero and your squad is in fourteenth place!",
    spidey: "And your strategy in Stage 0 was answering multiple-choice questions with skull emojis, racking up minus eighty points, and blaming the compiler for having 'hostile vibes'. Contestants, please don't let Wade near your mouse.",
    deadpoolEnd: "That wasn't guessing, Parker! That was tactical psychological warfare against the database!"
  },
  {
    tag: "PROMPT REALITY",
    deadpool: "Peter thinks prompt engineering requires 'syntactic semantic alignment'. I just mashed the keyboard with my forehead and got 10 points! Enjoy your calculus, web-head!",
    spidey: "You typed three swear words and Midjourney had a stroke trying to render a tactical unicorn inside a microwave. Stick to swordplay, Wade, and let the students use real prompt tokens.",
    deadpoolEnd: "Excuse me! That tactical microwave unicorn was an avant-garde masterpiece!"
  }
]

const SPIDEY_ROAST_BATTLES = [
  {
    tag: "EXAM DISASTER",
    spidey: "Quick tournament update on Wade: In his practice test for Stage 0, he clicked every answer blindly, scored minus 120 points, and blamed the database for having 'bad aura'. Please do not adopt his strategy.",
    deadpool: "I was stress-testing the scoring boundary conditions, Parker! That's called quality assurance, look it up!",
    spideyEnd: "You don't stress-test a multiple-choice quiz by getting every single question wrong, Wade."
  },
  {
    tag: "NEURAL TERROR",
    spidey: "Wade claims he's a prompt engineer. Last week he gave the diffusion model four hundred buzzwords and the server ran out of memory trying to understand what an 'explosive avocado' looked like.",
    deadpool: "It was an artistic statement on the fragility of organic produce! You have no culture!",
    spideyEnd: "It crashed the graphics driver, Wade. That's not culture, that's a kernel panic."
  }
]

// 5 Pre-set Default Trolls: Deadpool roasting Spider-Man (1 single hilarious paragraph each)
const DEADPOOL_SPIDEY_TROLLS = [
  "🎯 Peter Parker is literally the only superhero in the Marvel universe whose greatest nemesis isn't Thanos or Green Goblin—it's his overdue apartment rent. Look at him over there on the right, squinting at pixel reflections like a stressed engineering student who forgot he had an exam today. Hey Pete, instead of calculating cornea diffraction angles, maybe ask Mr. Stark's foundation for minimum wage so your landlord stops threatening eviction! 😂💀",
  "📢 You want to know why Peter is useless in a fast-paced competition? Because while normal human beings analyze the picture and lock in their choice, Peter spends 38 seconds writing a peer-reviewed dissertation on why a synthetic eyelash has irregular specular highlights. By the time he finishes his optical physics monologue, the countdown buzzer goes off and his team drops four spots on the leaderboard! 📸🕸️",
  "🤖 Peter acts like the insufferable class topper who reminds the professor they forgot to assign weekend homework. If you get flagged for opening another browser tab, he won't just report you—he'll deliver a 20-minute sermon about 'great responsibility' while hanging upside down from the ceiling like a glorified bat. Don't listen to the boy scout, trust your instincts, and take the points! 💥🍕",
  "🎯 Have you ever seen Peter try to order food at a takeout counter? He calculates the nutritional density per cent, compares it with his daily caloric expenditure, realizes he's fifty cents short, and ends up eating half a cold bagel behind a dumpster while explaining photon scattering to a pigeon. The guy has the proportional strength of a spider and the purchasing power of a medieval peasant! 🥯🕊️",
  "📢 Peter's greatest achievement in computer forensics was spending forty-five minutes proving that an AI-generated cat had an unnatural pixel gradient in its whiskers. Meanwhile, the bank across the street was being robbed by Rhino in broad daylight. Priorities, Spidey! The pixels aren't going to mug your aunt! 🦏💥"
]

// 5 Pre-set Default Trolls: Spider-Man roasting Deadpool (1 single hilarious paragraph each)
const SPIDEY_DEADPOOL_TROLLS = [
  "🕸️ Wade likes to talk big, but let's remember this is an elite technical forensics competition and he is an armed mercenary who literally asked security if he could submit answers by stabbing the monitor with a katana. The only reason he understands neural hallucinations is because his entire medical record is an uncontrolled biological disaster. Do not take technical advice from a man who uses edged weapons as trackpad pointers! 🦨😷",
  "🕷️ Wade's tournament strategy is essentially playing Russian roulette with a 4-option multiple-choice exam. In his practice test for Stage 0, he clicked every single answer without reading the questions, scored minus 120 points, and then filed an official complaint claiming the scoring database had 'negative aura'. If your teammate starts guessing like Wade, take their mouse away immediately! 📉😂",
  "🔬 Have you ever seen Wade attempt AI prompt engineering? He gave the diffusion model four hundred random buzzwords, and the GPU ran out of video memory trying to figure out what a 'tactical explosive avocado' was supposed to look like. He doesn't understand diffusion models—he thinks neural networks are caught in commercial fishing nets. Stick to actual pixel analysis, contestants! 🌮💀",
  "🕷️ Wade's idea of artificial intelligence is shouting loudly at his toaster until it pops out burnt waffles. During our system test yesterday, he tried to plug an HDMI cable directly into his forehead because he thought 'cybernetic bandwidth' worked via cranial osmosis. I have seen kindergarteners with better hardware comprehension. Please keep him away from the power strip! 🧇⚡",
  "🔬 Wade claims he has an advanced algorithm for Stage 2 deepfake detection. His method? If the subject in the photo looks more attractive than him, he declares it a synthetic forgery out of pure professional jealousy. If we used his criteria, ninety-nine percent of the global population would be classified as deepfakes! Stick to actual forensic anatomy, everyone! 🪞💀"
]

// 12 Hilarious Stand-Alone Jokes: Deadpool
const DEADPOOL_JOKES_POOL = [
  "🎨 Why did the neural network break up with the graphic designer? Because every single time they held hands, it tried to give them seven fingers, two left thumbs, and an elbow growing out of their collarbone! And then when asked to apologize, it hallucinated a four-page apology letter in ancient Latin signed by Napoleon Bonaparte! 😂💀",
  "🍹 A machine learning engineer, a cyber criminal, and me walk into a bar. The engineer orders a beer, the criminal tries to steal the tap, and I shoot the jukebox because it was playing smooth jazz. The bartender looks at us and screams, 'Is this an armed robbery or an unhandled null pointer exception?!' Both, baby! Maximum Effort! 💥🍸",
  "🦝 You want to know real comedy? Look at someone who studied for three weeks, opens Stage 0, and gets the first question wrong with a minus-five deduction. They sit there staring at the screen with the exact facial expression of a raccoon watching its cotton candy dissolve in a puddle of water. Don't be that raccoon, rookie! 💀🍕",
  "🍟 Why don't diffusion models ever get invited to family dinner? Because whenever you ask them to pass the salt, they generate a hyper-realistic 8K photorealistic render of an astronaut riding an explosive taco through the rings of Saturn! Just give me the table salt, Midjourney, my french fries are getting cold! 🚀🌮",
  "🦶 My financial advisor asked me why I haven't invested in generative AI startups. I told him: 'Look, why would I buy stock in an algorithm that can write an eight-hundred-word Shakespearean sonnet, but still thinks a human foot has three heels and fourteen toes?' If I want that kind of anatomical nightmare, I can just look in the mirror! 🪞💀",
  "💻 What did the database say when the panicked contestant tried to spam submit answers in the final three seconds? 'Error 404: Dignity Not Found. Would you like to roll back this life decision to the previous stable commit?' You can't out-bluff a backend server with raw emotional desperation, kids! 🔥🎮",
  "🌮 What happens when you train a multi-billion parameter diffusion model inside Wade Wilson's apartment? The GPU gets so hot that I used the graphics card as a panini press for my chimichangas! Sure, the loss function didn't converge, but the melted cheddar had an incredible hyper-realistic crust! 10 out of 10 benchmark performance! 🔥🧀",
  "📹 What's the fastest physical phenomenon known to modern science? The speed of light? Quantum entanglement? Nope! It's the speed of an engineering student slamming their laptop screen shut when their roommate walks into the proctored webcam frame wearing nothing but a towel and a dream! You can't outrun the invigilator, kids! 🏃💨",
  "🤖 I asked a conversational AI to plan the ultimate bank heist. It hallucinated a seventeen-step tactical infiltration plan involving helium balloons, three titanium poodles, and a certificate of authenticity signed by Abraham Lincoln. I was about to execute it until Peter pointed out step four required breaking the second law of thermodynamics. AI has zero respect for physics or felony law! 🎈🐩",
  "💻 You want to know what true fear looks like? Reading a senior developer's Git commit history at 3:45 AM before tournament launch:\nCommit 1: 'Refactored scoring engine.'\nCommit 2: 'Fixed minor null pointer.'\nCommit 3: 'Why is it doing this?'\nCommit 4: 'GOD PLEASE HELP ME.'\nCommit 5: 'Final fix (I will cry if this breaks).'\nCommit 6: 'asdasdasd fuck.'\nCommit 7: 'Working now, do not touch or breathe on this branch.' That's not code, that's trauma documented in version control! 💀📉",
  "📄 A guy showed me his resume and under 'Core Technical Competencies' it literally said: 'Senior Prompt Sorcerer & Prompt Alchemist'. Bro, you type adjectives into a Discord bot textbox while drinking iced oat milk lattes! You're not Merlin casting fireballs, you're a guy texting a GPU! If that qualifies as engineering, then ordering from the McDonald's drive-thru makes me an executive culinary architect! 🍟🧙‍♂️",
  "🚨 What happens when Stack Overflow goes down for forty minutes? Global software engineering grinds to a dead halt. Satellites fall from low Earth orbit, smart refrigerators start speaking Aramaic, and three hundred thousand developers sit in absolute darkness realizing they don't actually know how to reverse a linked list without copying line seven from an Indian teenager's blog! 📉😱"
]

// 12 Hilarious Stand-Alone Jokes: Spider-Man
const SPIDEY_JOKES_POOL = [
  "🐱 Why do AI models struggle so much with quantum physics? Because the moment you observe them, their probability wave collapses into four extra fingers and a waxy plastic forehead! Schrödinger's cat isn't dead or alive—in Midjourney, it's just a feline with three tails and ears rendered inside its mouth! ⚛️🔬",
  "🖥️ Wade asked me earlier why my code wasn't compiling. I told him there was a bug in line forty-two. He immediately drew dual katanas and sliced my monitor into three pieces shouting 'I neutralized the pest, Parker!' That monitor cost me three weeks of Daily Bugle freelance photo checks. Rest in peace, LCD display! 🕸️💸",
  "📐 There are 10 types of contestants in Pixel Paradox: Those who understand binary classification and specular photon reflections, and those who ask Wade Wilson for advice and end up with a negative integer score that defies Euclidean mathematics! 😂📊",
  "☕ Why was the AI prompt engineer kicked out of the coffee shop? Because they walked up to the barista and shouted: 'A high-contrast cinematic espresso, highly detailed, photorealistic, 8K resolution, unreal engine 5 render, volumetric steam, octane, trending on Artstation!' The barista just handed them tap water and told them to touch grass. 🌿🥤",
  "🕷️ How does Peter Parker debug recursive neural networks? Step 1: Set a breakpoint. Step 2: Formulate an empirical hypothesis. Step 3: Wade kicks the server rack because the cooling fans 'were humming off-key'. Step 4: Cry softly into my spider-mask while calculating how many days late my apartment rent is. 💸🥲",
  "🧪 An artificial neural network walks into a chemistry lab. The professor asks, 'Can you synthesize this organic hydrocarbon chain?' The AI smiles confidently, outputs an impossible molecule with fifteen covalent bonds per carbon, and says 'Source: Trust me, I have 175 billion parameters.' Check your sources before submitting, folks! 🔬🧬",
  "📸 J. Jonah Jameson called me into his office screaming: 'Parker! I need exclusive 8K front-page photos of Spider-Man fighting Electro in the middle of a thunderstorm, perfectly lit, ISO 100, zero motion blur, and I will pay you four dollars and fifty cents cash!' I told him: 'Mr. Jameson, at that shutter speed and price point, even quantum mechanics refuses to generate photons!' He threw a stapler at my head. Freelance journalism is wonderful! 📰💸",
  "📉 How do neural networks navigate high-dimensional loss landscapes? Exactly like Peter Parker trying to pay his rent: blindly stumbling downhill in the dark, hoping they don't get trapped in a devastating local minimum, and praying that the learning rate doesn't explode and leave them homeless on 23rd Street! 🕸️🏚️",
  "🖥️ Wade walked up to me with a smoking dual-slot graphics card and asked: 'Hey Pete, if I pour liquid nitrogen directly into the fan bearings, will my prompts render in twelve dimensions?' I looked at the motherboard—he had secured the heat sink with masking tape and two bubblegum wrappers. I didn't even call a technician; I just called the New York fire department in advance. 🔥🚒",
  "🦷 Why are dentists terrified of generative AI? Because every time a diffusion model renders a smiling family portrait, it hallucinates thirty-six front incisors, three rows of molars, and a canine growing directly out of the uvula! It looks less like a toothpaste commercial and more like an anatomical diagram of a Great White Shark having an existential crisis! 🦈🪥",
  "🎨 A computer science professor asked the class: 'What is the hardest unsolved problem in computer science? P versus NP? Byzantine fault tolerance? The halting problem?' A student in the back raised a trembling hand and whispered: 'Vertically centering a div inside a flexbox container without breaking mobile Safari.' The professor burst into tears and dismissed class thirty minutes early. 😭💻",
  "🧠 Why did the machine learning model fail its real-world road test? Because during training, the engineer overfitted it on ten thousand pictures of cats. When deployed to an autonomous vehicle, it refused to stop at red lights, but screeched to a halt every time it saw a cardboard box in the middle of the street and tried to sit inside it! 📦🚗"
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
    q: "How do GANs compare to Diffusion Models in forensics?",
    a: "Comic book analogy time! GANs are like me and Spider-Man fighting in an alley: the Generator is a master art forger trying to paint a fake Rembrandt, and the Discriminator is Spidey inspecting it with his magnifying glass saying 'Fake!' They train by trying to fool each other until mode collapse happens and the generator only draws pictures of frogs. Diffusion models are smarter—they take a picture, destroy it with pure static noise like a broken TV, and train a neural network to walk backward step-by-step and reconstruct the image from scratch! Diffusion wins on detail, GANs win on speed! 🎨💥"
  },
  {
    q: "How do you detect AI cloned voice and deepfake audio?",
    a: "Listen with your ears, not your feelings! AI voice models clone acoustic pitch, but they choke on biological respiratory mechanics! Real humans breathe between sentences, have subtle glottal stops, and their vocal cadence changes with emotional emphasis. AI voice clones speak in an unvarying acoustic plane with zero room reverberation changes and unnatural robotic micro-pauses. Also check viseme-phoneme synchronization—if their mouth makes an 'O' shape while saying 'B', it's a deepfake! 🎙️👂"
  },
  {
    q: "What is Inpainting vs Outpainting in Stage 2 (The Glitch Hunt)?",
    a: "Inpainting is cosmetic surgery for pixels: you draw a mask inside an existing image (like erasing an ex-partner's face) and the neural model fills in the blank space. Glitches happen at the mask boundary edges—lighting mismatches and blurred textures! Outpainting is expanding the universe: taking a portrait and generating new background pixels beyond the original canvas borders. If the vanishing point of the road doesn't match the horizon in the outpainted background, you found the glitch! 🔍🖼️"
  },
  {
    q: "What is Frequency Domain (FFT) analysis in deepfake detection?",
    a: "Math weapon! When neural networks upscale images using transposed convolutions, they leave invisible periodic grid fingerprints—like checkerboard tire tracks in snow! A Fast Fourier Transform (FFT) converts pixel spatial coordinates into frequency spectrum wavelengths. In real DSLR photos, frequencies decay smoothly in concentric circles. In AI fakes, the FFT spectrum reveals weird bright white dots and cross-shaped artifacts! It's like infrared goggles for pixel fraud! 🔬📊"
  },
  {
    q: "How do CLIP vectors score our prompts in Stage 3 Prompt Wars?",
    a: "CLIP (Contrastive Language-Image Pretraining) is bilingual—it speaks both pixels and English tokens! It converts an image into a 512-dimensional numerical coordinate vector, and does the exact same thing to your typed prompt words. Then it calculates the cosine angle between the two vectors: Cosine Similarity = (A · B) / (||A|| ||B||). If your prompt points in the exact same multi-dimensional direction as the target visual, the cosine score approaches 1.0 (100%)! Miss the style keyword, and your angle shoots off into outer space! 🚀🎯"
  },
  {
    q: "Ask Spidey-bug, he may know! 🕸️",
    a: "REFER_TO_SPIDEY" // ONLY THIS explicit choice switches to Spidey
  }
]

// Deadpool Non-Technical / Fun & Banter Questions (Jokes, Trolls, strictly English)
const DEADPOOL_NON_TECH_FAQ = [
  {
    q: "Tell me a hilarious joke! 🤣",
    a: "TELL_DEADPOOL_JOKE"
  },
  {
    q: "Troll Spider-Man right now! 🎯",
    a: "TROLL_SPIDEY_GAG"
  },
  {
    q: "Hey, are you like ChatGPT or JARVIS?",
    a: "Do I look like a polite British voice trapped in Tony Stark's thermostat? I am Wade Wilson. I get paid in cash to break things and mock bad life choices. If you want a robot to summarize a PDF, go ask Siri. If you want to survive this leaderboard, listen up."
  },
  {
    q: "Can we bribe the judges with pizza or snacks?",
    a: "I mean, I'll take the pizza. But the coordinators? They'll eat your entire large pepperoni, smile warmly at you, and then let the automated script deduct five points without batting an eye. These people run on cold logic and zero sleep. Your pizza has no power here."
  },
  {
    q: "Why is the website background so futuristic and sleek?",
    a: "Because the developers clearly prioritized dark mode aesthetic over their own circadian rhythms. Look at those glowing cyber lines—that's what forty-eight straight hours of caffeine and existential dread look like rendered in CSS. Appreciate the suffering that went into your UI!"
  },
  {
    q: "Can I inspect element or view page source to find the answers?",
    a: "Oh look, we have a cyber-criminal prodigy! You press F12 in Chrome and suddenly you think you're Neo in the Matrix. Newsflash: the answers are verified on the backend server. The only thing you'll find in the page source is your own reflection looking desperate. Use your eyes on the pixels, rookie."
  },
  {
    q: "What happens if our squad gets -40 in Stage 0?",
    a: "Minus forty? At that point, you haven't just lost the round—you've achieved negative academic standing. The organizers might actually contact your university and revoke your high school diploma. Stop guessing and leave the ones you don't know blank!"
  },
  {
    q: "Can we use ChatGPT on our phones during the round?",
    a: "Go ahead, look down at your phone. The proctoring system has face-tracking algorithms that detect guilt faster than your mother. The moment your eyes wander south of the webcam, your screen locks and you're watching the rest of the tournament from the lobby."
  },
  {
    q: "Is Spider-Man wearing actual pajamas right now?",
    a: "YES! It is literally a reinforced high-tech onesie with eye holes! And he washes it in cold water so the webs don't fade. Do NOT tell him I told you, he gets super defensive about laundry day!"
  },
  {
    q: "What is your secret weapon for winning this tournament?",
    a: "Confidence, sheer chaos, and the fact that I taped an extra set of AAA batteries to the back of my mouse. Also, Peter thinks I don't know that right-clicking opens a context menu, but joke's on him—I use keyboard shortcuts exclusively by punching the number pad! Maximum Effort! 💥🌮"
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
    a: "• Stage 0 (Prelims): 30 MCQs, strictly 30 mins (+10 correct, -5 wrong).\n• Stage 1 (Pixel Detective): 10 questions, 40s each, real-time leaderboard.\n• Stage 2 (Deepfake Diagnostics): 7 challenges, 45s each.\n• Stage 3 (Prompt Duel Finale): 5 rounds, 75s each with progressive resolution reveal!"
  },
  {
    q: "How does progressive resolution reveal work in Stage 3?",
    a: "In Round 3, each pixel image reveals in progressive resolution steps every few seconds. Early reveal challenges your macro-composition instincts (style, medium, artist), while full resolution lets you catch fine details (textures, lighting tokens)!"
  },
  {
    q: "What is Subsurface Scattering (SSS) and how do synthetic models fail it?",
    a: "Biological optical physics! When light hits human skin, it doesn't bounce off like metal. Photons penetrate the epidermis, bounce through translucent subcutaneous tissue, blood vessels, and cartilage, and exit at adjacent points. This produces the characteristic warm pinkish glow on backlit earlobes, nostrils, and fingertips! AI diffusion models lack 3D volumetric light transport equations—they treat skin as a flat 2D surface, resulting in either unlifelike waxy plastic or uniform chalky pigmentation. Check the ears and fingertips against backlighting! 🔬🩸"
  },
  {
    q: "How does Error Level Analysis (ELA) uncover digital inpainting in Stage 2?",
    a: "Compression entropy! When a digital camera saves an image in JPEG format, every 8x8 pixel block compresses uniformly across the image sensor. However, when an adversary inpaints an AI modification into that image, the modified region has a completely different compression generation and error potential! Error Level Analysis (ELA) intentionally resaves the image at a known quality level and computes the pixel difference map. Untouched zones show uniform dark gray noise, while modified AI inpaintings light up with hyper-bright multi-colored error clusters! 📸✨"
  },
  {
    q: "What are Transposed Deconvolution and Checkerboard Artifacts?",
    a: "Neural generator architecture tells! When Generative Adversarial Networks (GANs) or diffusion latent decoders upscale feature maps from low resolution (e.g. 64x64) to high resolution (e.g. 1024x1024), they utilize transposed 2D convolutions (deconvolutions). When the kernel size is not evenly divisible by the stride, overlapping convolution kernels create uneven pixel summation—resulting in a high-frequency checkerboard pattern of alternating bright and dark pixels! Look closely at flat monochromatic regions like skies, walls, and out-of-focus bokeh! ♟️🔬"
  },
  {
    q: "What are the exact forensic fingerprints of Midjourney vs SDXL vs Flux vs Imagen?",
    a: "Here is my peer-reviewed field guide:\n• Midjourney v6: Intense volumetric rim lighting, cinematic 2.39:1 aspect bias, painterly subsurface skin bloom, and stylized chromatic depth.\n• Stable Diffusion XL (SDXL): Micro-blur on background foliage, tendency toward plastic facial skin, and frequent anatomical knuckle distortions in high-contrast hand poses.\n• Flux.1 (Black Forest Labs): Superior high-frequency microtexture (individual pores and linen stitches), crisp alphanumeric typographic rendering, but subtle planar perspective distortion on receding tiled floors.\n• Google Imagen 3: Highly natural photorealistic dynamic range, accurate shadows, but occasionally over-smooths delicate specular iris reflections."
  },
  {
    q: "Why does AI struggle with text spelling and symmetrical geometric reflections?",
    a: "Spatial tokenization constraints! Diffusion models operate in latent space, where CLIP text encoders break words into sub-word tokens (e.g., 'paradox' becomes 'para' + 'dox') rather than individual characters. The neural network learns statistical associations between word vectors and pixel patches, but lacks an internal orthographic character-level buffer! Similarly, diffusion denoisers evaluate local pixel gradients rather than global raytraced mirrors, causing mirror reflections to depict different postures or missing reflections entirely!"
  },
  {
    q: "Ask the guy in red spandex on the left! 🌮",
    a: "REFER_TO_DEADPOOL" // ONLY THIS explicit choice switches to Deadpool
  }
]

// Spider-Man Non-Technical / Fun & Banter Questions
const SPIDEY_NON_TECH_FAQ = [
  {
    q: "Tell me a nerdy hilarious joke! 🧪🕸️",
    a: "TELL_SPIDEY_JOKE"
  },
  {
    q: "Roast Deadpool right back! 🕷️⚡",
    a: "ROAST_DEADPOOL_GAG"
  },
  {
    q: "What does your Spider-Sense say about Deadpool?",
    a: "My Spider-Sense usually warns me about life-threatening kinetic hazards. Around Wade, it's just a constant low-frequency migraine telling me that someone with zero impulse control is standing behind me with loaded firearms. Ignore him and stick to the scientific methods."
  },
  {
    q: "Why does Wade carry two swords in a computer competition?",
    a: "Security questioned him at registration, and he claimed they were 'analog cable management devices'. He doesn't even know how to write a print statement. Please do not validate his behavior."
  },
  {
    q: "How to stay calm when the 40-second timer turns red?",
    a: "Forty seconds is plenty of time if you don't waste the first thirty panicking. In Round 1, zoom straight to iris reflections and hand contours. If the light source doesn't match both pupils, it's synthetic. Eliminate two options, lock it in, and breathe."
  },
  {
    q: "Can I stuff 500 buzzwords into Stage 3 to get 100% Cosine score?",
    a: "No, that's how people get single-digit similarity scores. CLIP embeddings evaluate semantic meaning and syntactic relationships. If you dump fifty synonyms for 'photorealistic' into the box, the vector distances get completely distorted. Describe the lighting, composition, and subject with precision."
  },
  {
    q: "What should our team do if we panic in Stage 2?",
    a: "Execute the 3-Point Scan: Eyes, Ears, Edges. Don't look at the whole picture at once—AI is good at broad strokes, but it consistently fails fine boundary transitions where hair meets skin or where collars meet necks."
  },
  {
    q: "Can our team share answers in a chat group?",
    a: "Absolutely not! Peter Parker stands for honesty and fair play! Besides, the automated webcam invigilation and tab-switch monitor will flag you immediately. Play fair and win on genuine merit!"
  },
  {
    q: "What's the funniest thing you caught Wade doing during setup?",
    a: "He spent twenty minutes trying to connect his wireless Bluetooth katana to the local Wi-Fi router. When the authentication failed, he filed a hardware ticket alleging that Tony Stark was actively hacking his scabbard. I had to bribe him with three mini tacos just to unplug the Ethernet cable! 🌮📡"
  }
]


export default function Home() {
  const [spideyQuoteIndex, setSpideyQuoteIndex] = useState(0)
  const [deadpoolQuoteIndex, setDeadpoolQuoteIndex] = useState(0)
  const [selectedRoundTab, setSelectedRoundTab] = useState(0)
  const [showSpideyThwip, setShowSpideyThwip] = useState(false)
  const [showDeadpoolPop, setShowDeadpoolPop] = useState(false)

  // Interactive Roast Duel State
  const [heroDuelIdx, setHeroDuelIdx] = useState(0)
  const [deadpoolTrollIdx, setDeadpoolTrollIdx] = useState(0)
  const [spideyTrollIdx, setSpideyTrollIdx] = useState(0)
  const [deadpoolJokeIdx, setDeadpoolJokeIdx] = useState(0)
  const [spideyJokeIdx, setSpideyJokeIdx] = useState(0)
  const [comicPopSound, setComicPopSound] = useState('💥 MAXIMUM EFFORT!')


  // Typing simulation state
  const [isDeadpoolTyping, setIsDeadpoolTyping] = useState(false)
  const [isSpideyTyping, setIsSpideyTyping] = useState(false)

  // Mascot Animations State (Strictly Independent Hide/Show for Deadpool & Spider-Man)
  const [hideDeadpoolMascot, setHideDeadpoolMascot] = useState(false)
  const [hideSpideyMascot, setHideSpideyMascot] = useState(false)

  useEffect(() => {
    if (typeof window !== 'undefined') {
      const savedDeadpool = localStorage.getItem('hideDeadpoolMascot')
      const savedSpidey = localStorage.getItem('hideSpideyMascot')
      if (savedDeadpool === 'true') {
        setHideDeadpoolMascot(true)
      } else if (savedDeadpool === 'false') {
        setHideDeadpoolMascot(false)
      }
      if (savedSpidey === 'true') {
        setHideSpideyMascot(true)
      } else if (savedSpidey === 'false') {
        setHideSpideyMascot(false)
      }
      // Clean up legacy key so it never overrides individual mascot states
      localStorage.removeItem('hideMascotAnimations')
    }
  }, [])

  const handleToggleDeadpoolMascot = (hide) => {
    setHideDeadpoolMascot(hide)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideDeadpoolMascot', hide ? 'true' : 'false')
    }
  }

  const handleToggleSpideyMascot = (hide) => {
    setHideSpideyMascot(hide)
    if (typeof window !== 'undefined') {
      localStorage.setItem('hideSpideyMascot', hide ? 'true' : 'false')
    }
  }

  const handleSpideyHideClick = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault()
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
    }
    handleToggleSpideyMascot(true)
  }

  const handleDeadpoolHideClick = (e) => {
    if (e) {
      if (typeof e.preventDefault === 'function') e.preventDefault()
      if (typeof e.stopPropagation === 'function') e.stopPropagation()
    }
    handleToggleDeadpoolMascot(true)
  }

  const handleToggleMascots = (hide) => {
    handleToggleDeadpoolMascot(hide)
    handleToggleSpideyMascot(hide)
  }

  const hideMascotAnimations = hideDeadpoolMascot && hideSpideyMascot

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
  const deadpoolContainerRef = useRef(null)
  const deadpoolChatBodyRef = useRef(null)

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
  const spideyContainerRef = useRef(null)
  const spideyChatBodyRef = useRef(null)

  // Keyboard Escape listener & Click Outside listener to close open chats
  useEffect(() => {
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') {
        setIsDeadpoolChatOpen(false)
        setIsSpideyChatOpen(false)
      }
    }
    const handleClickOutside = (e) => {
      if (isDeadpoolChatOpen && deadpoolContainerRef.current && !deadpoolContainerRef.current.contains(e.target)) {
        setIsDeadpoolChatOpen(false)
      }
      if (isSpideyChatOpen && spideyContainerRef.current && !spideyContainerRef.current.contains(e.target)) {
        setIsSpideyChatOpen(false)
      }
    }
    window.addEventListener('keydown', handleKeyDown)
    document.addEventListener('pointerdown', handleClickOutside)
    return () => {
      window.removeEventListener('keydown', handleKeyDown)
      document.removeEventListener('pointerdown', handleClickOutside)
    }
  }, [isDeadpoolChatOpen, isSpideyChatOpen])

  // Internal smooth auto-scroll for chat body on new messages
  useEffect(() => {
    if (isDeadpoolChatOpen && deadpoolChatBodyRef.current) {
      if (deadpoolMessages.length > 1) {
        deadpoolChatBodyRef.current.scrollTo({
          top: deadpoolChatBodyRef.current.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        deadpoolChatBodyRef.current.scrollTo({
          top: 0,
          behavior: 'auto'
        })
      }
    }
  }, [deadpoolMessages, isDeadpoolChatOpen, isDeadpoolTyping])

  useEffect(() => {
    if (isSpideyChatOpen && spideyChatBodyRef.current) {
      if (spideyMessages.length > 1) {
        spideyChatBodyRef.current.scrollTo({
          top: spideyChatBodyRef.current.scrollHeight,
          behavior: 'smooth'
        })
      } else {
        spideyChatBodyRef.current.scrollTo({
          top: 0,
          behavior: 'auto'
        })
      }
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
    if (a === 'TELL_DEADPOOL_JOKE') {
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsDeadpoolTyping(true)

      const jokeText = DEADPOOL_JOKES_POOL[deadpoolJokeIdx % DEADPOOL_JOKES_POOL.length]
      setDeadpoolJokeIdx(prev => prev + 1)

      setTimeout(() => {
        setIsDeadpoolTyping(false)
        setDeadpoolMessages(prev => [
          ...prev,
          { 
            sender: 'deadpool', 
            text: jokeText 
          }
        ])
      }, 450)
      return
    }

    if (a === 'TROLL_SPIDEY_GAG') {
      setDeadpoolMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsDeadpoolTyping(true)

      const trollText = DEADPOOL_SPIDEY_TROLLS[deadpoolTrollIdx % DEADPOOL_SPIDEY_TROLLS.length]
      setDeadpoolTrollIdx(prev => prev + 1)

      setTimeout(() => {
        setIsDeadpoolTyping(false)
        setDeadpoolMessages(prev => [
          ...prev,
          { 
            sender: 'deadpool', 
            text: trollText 
          }
        ])
      }, 450)
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
    if (a === 'TELL_SPIDEY_JOKE') {
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsSpideyTyping(true)

      const jokeText = SPIDEY_JOKES_POOL[spideyJokeIdx % SPIDEY_JOKES_POOL.length]
      setSpideyJokeIdx(prev => prev + 1)

      setTimeout(() => {
        setIsSpideyTyping(false)
        setSpideyMessages(prev => [
          ...prev,
          { 
            sender: 'spidey', 
            text: jokeText 
          }
        ])
      }, 450)
      return
    }

    if (a === 'ROAST_DEADPOOL_GAG') {
      setSpideyMessages(prev => [
        ...prev,
        { sender: 'user', text: q }
      ])
      setIsSpideyTyping(true)

      const trollText = SPIDEY_DEADPOOL_TROLLS[spideyTrollIdx % SPIDEY_DEADPOOL_TROLLS.length]
      setSpideyTrollIdx(prev => prev + 1)

      setTimeout(() => {
        setIsSpideyTyping(false)
        setSpideyMessages(prev => [
          ...prev,
          { 
            sender: 'spidey', 
            text: trollText 
          }
        ])
      }, 450)
      return
    }

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

    let answer = "I am a mercenary with weapons, not ChatGPT. I don't give resume advice or write poems. Ask me about the tournament rules, tell me to roast Spidey, or click one of the quick questions below!"

    if (query.includes('jarvis') || query.includes('ai bot') || query.includes('robot') || query.includes('chatgpt') || query.includes('assistant')) {
      answer = "Do I look like a British AI assistant trapped in Tony Stark's thermostat? I am Wade Wilson. I get paid in cash to break things and mock bad life choices. If you want a robot to summarize a PDF, go ask Siri. If you want to survive this leaderboard, focus up!"
    } else if (query.includes('troll') || query.includes('roast spidey') || query.includes('roast spider') || query.includes('attack spidey')) {
      handleDeadpoolAsk(userText, "TROLL_SPIDEY_GAG")
      return
    } else if (query.includes('joke') || query.includes('laugh') || query.includes('funny') || query.includes('humor') || query.includes('hilarious') || query.includes('comedy') || query.includes('giggle') || query.includes('make me laugh')) {
      handleDeadpoolAsk(userText, "TELL_DEADPOOL_JOKE")
      return
    } else if (query.includes('pajama') || query.includes('onesie') || query.includes('suit')) {
      answer = DEADPOOL_NON_TECH_FAQ[8].a
    } else if (query.includes('background') || query.includes('theme') || query.includes('design') || query.includes('look')) {
      answer = DEADPOOL_NON_TECH_FAQ[4].a
    } else if (query.includes('spidey') || query.includes('peter') || query.includes('spider') || query.includes('math') || query.includes('formula') || query.includes('science')) {
      answer = "Peter? He's over on the right side having an existential crisis about responsibility. Click 'Ask Spidey-bug' below to bother him!"
    } else if (query.includes('stage 0') || query.includes('prelim') || query.includes('quiz') || query.includes('negative') || query.includes('-5') || query.includes('guess')) {
      answer = DEADPOOL_TECH_FAQ[0].a
    } else if (query.includes('round 1') || query.includes('stage 1') || query.includes('detective') || query.includes('points') || query.includes('10 points')) {
      answer = DEADPOOL_TECH_FAQ[1].a
    } else if (query.includes('coordinator') || query.includes('organizer') || query.includes('author') || query.includes('creator') || query.includes('director')) {
      answer = "The tournament coordinators are the architects behind this competition! They wrote the code, tuned the -5 penalty, and spent days debugging routes. Bow before the organizers!"
    } else if (query.includes('cheat') || query.includes('camera') || query.includes('webcam') || query.includes('phone') || query.includes('whatsapp')) {
      answer = DEADPOOL_NON_TECH_FAQ[7].a
    } else if (query.includes('food') || query.includes('pizza') || query.includes('snack') || query.includes('bribe') || query.includes('coffee')) {
      answer = DEADPOOL_NON_TECH_FAQ[3].a
    } else if (query.includes('inspect') || query.includes('source') || query.includes('hack')) {
      answer = DEADPOOL_NON_TECH_FAQ[5].a
    } else if (query.includes('secret weapon') || query.includes('win') || query.includes('strategy')) {
      answer = DEADPOOL_NON_TECH_FAQ[9].a
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

    let answer = "My Spider-Sense didn't catch that clearly. Try asking about Stage 0 negative marking rules, Round 1 generator signatures (Midjourney vs Flux), or click one of the questions below!"

    if (query.includes('roast') || query.includes('burn') || query.includes('troll wade') || query.includes('troll deadpool')) {
      handleSpideyAsk(userText, "ROAST_DEADPOOL_GAG")
      return
    } else if (query.includes('joke') || query.includes('funny') || query.includes('laugh') || query.includes('humor') || query.includes('hilarious') || query.includes('comedy') || query.includes('giggle') || query.includes('make me laugh')) {
      handleSpideyAsk(userText, "TELL_SPIDEY_JOKE")
      return
    } else if (query.includes('sword') || query.includes('katana')) {
      answer = SPIDEY_NON_TECH_FAQ[3].a
    } else if (query.includes('deadpool') || query.includes('wade') || query.includes('pizza') || query.includes('snack') || query.includes('bribe')) {
      answer = SPIDEY_NON_TECH_FAQ[2].a
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
    } else if (query.includes('wifi') || query.includes('setup') || query.includes('caught')) {
      answer = SPIDEY_NON_TECH_FAQ[8].a
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
      {/* Spider-Web Corner Accents (Left: Deadpool Red, Right: Spidey Blue) */}
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

      {/* TOP-RIGHT: REALISTIC SWINGING SPIDER-MAN FULL BODY MODEL WITH ELASTIC SILK */}
      {!hideSpideyMascot ? (
      <div 
        style={{
          position: 'absolute',
          top: 0,
          right: 'clamp(8px, 1.6vw, 32px)',
          zIndex: 90,
          pointerEvents: 'auto'
        }}
      >
        <div 
          className="spidey-swinging-pro" 
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
          onClick={(e) => {
            if (
              e.target.closest('.mascot-hanging-container') || 
              e.target.closest('.mascot-hanging-red-btn') || 
              e.target.closest('.mascot-hanging-blue-btn')
            ) return
            setShowSpideyThwip(true)
            setIsSpideyChatOpen(true)
            setTimeout(() => setShowSpideyThwip(false), 1400)
          }}
          onMouseEnter={() => setShowSpideyThwip(true)}
          onMouseLeave={() => setShowSpideyThwip(false)}
          title="Click Spider-Man to Chat!"
        >
          {/* Ceiling Web Anchor Splat */}
          <div className="spidey-ceiling-anchor" />

          {/* Elastic Silk Line */}
          <div className="web-elastic-line" style={{
            width: '2.5px',
            background: 'linear-gradient(to bottom, #FFFFFF 0%, rgba(255,255,255,0.95) 45%, #38BDF8 75%, #0284C7 100%)',
            boxShadow: '0 0 10px rgba(255,255,255,0.9), 0 0 20px rgba(56,189,248,0.7)'
          }} />

          {/* Atmospheric Cyan Multiverse Aura */}
          <div className="spidey-multiverse-aura" />

          {/* Full Model Spider-Man Container */}
          <div className="mascot-image-wrapper" style={{
            filter: 'drop-shadow(0 14px 28px rgba(2,132,199,0.75))'
          }}>
            {/* THWIP Action Pop */}
            {showSpideyThwip && (
              <div className="comic-badge-thwip">THWIP!</div>
            )}

            {/* Spider-Sense Radiating Crown (Around Head) */}
            <div className="spider-sense-intense" style={{
              position: 'absolute',
              bottom: '-8px',
              left: '50%',
              transform: 'translateX(-50%)',
              width: '44px',
              height: '22px',
              pointerEvents: 'none'
            }}>
              <svg viewBox="0 0 56 28" fill="none">
                <path d="M10,24 Q28,-2 46,24" stroke="#38BDF8" strokeWidth="3" strokeLinecap="round" />
                <path d="M4,18 Q28,-10 52,18" stroke="#0088FF" strokeWidth="2.4" strokeLinecap="round" strokeDasharray="4 2" />
                <path d="M18,25 Q28,8 38,25" stroke="#F97316" strokeWidth="2" strokeLinecap="round" />
              </svg>
            </div>

            {/* Authentic Cinematic Transparent Spider-Man Model */}
            <img 
              src="/spiderman_model.png" 
              alt="Spider-Man" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                userSelect: 'none',
                pointerEvents: 'none'
              }} 
            />
          </div>

          {/* Spider-Man Callout Tag */}
          <div className="mascot-tag-pill spidey-tag">
            <span>🕷️ SPIDER-MAN • MENTOR</span>
            <span className="mascot-tag-sub">Click to Chat</span>
          </div>

          {/* Small Red Hanging Hide Button — Swings along with Spider-Man! */}
          <div 
            className="mascot-hanging-container"
            onClick={handleSpideyHideClick}
            onPointerDown={handleSpideyHideClick}
            onMouseDown={handleSpideyHideClick}
            onTouchStart={handleSpideyHideClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="mascot-hanging-wire red" />
            <button
              type="button"
              className="mascot-hanging-red-btn"
              onClick={handleSpideyHideClick}
              onPointerDown={handleSpideyHideClick}
              onMouseDown={handleSpideyHideClick}
              onTouchStart={handleSpideyHideClick}
              title="Hide Spider-Man"
              aria-label="Hide Spider-Man"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      ) : (
        /* Hanging restore tab docked to top edge */
        <button
          type="button"
          className="mascot-docked-restore-btn spidey-restore"
          onClick={() => handleToggleSpideyMascot(false)}
          onPointerDown={() => handleToggleSpideyMascot(false)}
          title="Show Spider-Man Animation"
        >
          <span>▼ 🕸️ Spidey</span>
        </button>
      )}

      {/* TOP-LEFT: TACTICAL PERCH DEADPOOL FULL BODY MODEL ON CYBER PLATFORM */}
      {!hideDeadpoolMascot ? (
      <div 
        style={{
          position: 'absolute',
          top: 0,
          left: 'clamp(8px, 1.6vw, 32px)',
          zIndex: 90,
          pointerEvents: 'auto'
        }}
      >
        <div 
          className="deadpool-perch-rig"
          style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', position: 'relative', cursor: 'pointer' }}
          onClick={(e) => {
            if (
              e.target.closest('.mascot-hanging-container') || 
              e.target.closest('.mascot-hanging-blue-btn') ||
              e.target.closest('.mascot-hanging-red-btn')
            ) return
            setShowDeadpoolPop(true)
            setIsDeadpoolChatOpen(true)
            setTimeout(() => setShowDeadpoolPop(false), 1400)
          }}
          onMouseEnter={() => setShowDeadpoolPop(true)}
          onMouseLeave={() => setShowDeadpoolPop(false)}
          title="Click Deadpool to Chat!"
        >
          {/* Dual Tactical Suspension Cables anchoring platform */}
          <div className="deadpool-cables-container">
            <div className="cable-ceiling-clamp-left" />
            <div className="cable-ceiling-clamp-right" />
            <div className="deadpool-cable-left" />
            <div className="deadpool-cable-right" />
          </div>

          {/* Atmospheric Red Multiverse Aura */}
          <div className="deadpool-multiverse-aura" />

          {/* Full Model Deadpool Container */}
          <div className="mascot-image-wrapper" style={{
            filter: 'drop-shadow(0 14px 28px rgba(224,27,34,0.75))'
          }}>
            {/* MAXIMUM EFFORT Action Pop */}
            {showDeadpoolPop && (
              <div className="comic-badge-maximum">MAXIMUM EFFORT!</div>
            )}

            {/* Authentic Cinematic Transparent Deadpool Model */}
            <img 
              src="/deadpool_model.png" 
              alt="Deadpool" 
              style={{ 
                width: '100%', 
                height: '100%', 
                objectFit: 'contain', 
                userSelect: 'none',
                pointerEvents: 'none'
              }} 
            />
          </div>

          {/* High-Tech Tactical Combat Platform directly under boots */}
          <div className="deadpool-combat-platform">
            <div className="platform-thruster-left" />
            <div className="platform-thruster-right" />
            <span style={{ fontSize: '0.48rem', color: '#EF4444', fontFamily: 'monospace', fontWeight: 900, letterSpacing: '0.5px' }}>⚡ PERCH</span>
            <span style={{ fontSize: '0.48rem', color: '#F97316', fontFamily: 'monospace', fontWeight: 900 }}>READY</span>
          </div>

          {/* Deadpool Callout Tag */}
          <div className="mascot-tag-pill deadpool-tag">
            <span>⚔️ DEADPOOL • MERC-BOT</span>
            <span className="mascot-tag-sub">Click to Chat</span>
          </div>

          {/* Small Blue Hanging Hide Button — Floats along with Deadpool! */}
          <div 
            className="mascot-hanging-container"
            onClick={handleDeadpoolHideClick}
            onPointerDown={handleDeadpoolHideClick}
            onMouseDown={handleDeadpoolHideClick}
            onTouchStart={handleDeadpoolHideClick}
            style={{ cursor: 'pointer' }}
          >
            <div className="mascot-hanging-wire" />
            <button
              type="button"
              className="mascot-hanging-blue-btn"
              onClick={handleDeadpoolHideClick}
              onPointerDown={handleDeadpoolHideClick}
              onMouseDown={handleDeadpoolHideClick}
              onTouchStart={handleDeadpoolHideClick}
              title="Hide Deadpool"
              aria-label="Hide Deadpool"
            >
              ✕
            </button>
          </div>
        </div>
      </div>
      ) : (
        /* Hanging restore tab docked to top edge */
        <button
          type="button"
          className="mascot-docked-restore-btn deadpool-restore"
          onClick={() => handleToggleDeadpoolMascot(false)}
          onPointerDown={() => handleToggleDeadpoolMascot(false)}
          title="Show Deadpool Animation"
        >
          <span>▼ 🌮 Deadpool</span>
        </button>
      )}

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
            background: 'linear-gradient(90deg, rgba(2, 132, 199, 0.22) 0%, rgba(224, 27, 34, 0.22) 100%)',
            border: '1px solid rgba(56, 189, 248, 0.45)',
            padding: '9px 26px',
            borderRadius: '28px',
            textShadow: '0 0 14px rgba(56,189,248,0.7)',
            margin: '0 auto 24px auto',
            position: 'relative',
            zIndex: 40,
            backdropFilter: 'blur(12px)',
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
          {/* CARD 01: ONBOARDING (Spider-Man Electric Blue Theme) */}
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

          {/* CARD 02: BATTLEGROUND (Deadpool Crimson Red Theme) */}
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
                  <strong style={{ color: '#FF6B6B' }}>🛡️ Anti-Cheat Protocol:</strong> Silent 1-minute webcam invigilation operates during the exam to ensure total academic integrity. Results are scored automatically by the engine with zero wait time.
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

        {/* ========================================================= */}
        {/* HERO BANTER ROAST DUEL CARD (SLIGHTLY BOTTOM SECTION)     */}
        {/* ========================================================= */}
        <section style={{ maxWidth: '100%', margin: '0 auto 60px' }}>
          <div className="roast-duel-card">
            <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', flexWrap: 'wrap', gap: '12px', marginBottom: '16px' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <span className="comic-bubble-pop">{comicPopSound || '💥 HERO BANTER DUEL'}</span>
                <span style={{ fontSize: '0.85rem', color: '#FF6B6B', fontWeight: 'bold' }}>
                  Matchup {((heroDuelIdx % ROAST_BATTLES.length) + 1)}: {ROAST_BATTLES[heroDuelIdx % ROAST_BATTLES.length].tag}
                </span>
              </div>
              <button
                onClick={() => {
                  setHeroDuelIdx(prev => prev + 1)
                  const sounds = ['💥 MAXIMUM EFFORT!', '🕸️ THWIP!', '🔥 BURRRRN!', '🎬 4TH WALL SMASHED!', '⚡ SPIDER-SENSE TINGLE!']
                  setComicPopSound(sounds[Math.floor(Math.random() * sounds.length)])
                }}
                style={{
                  background: 'linear-gradient(135deg, #E23636 0%, #B91C1C 100%)',
                  color: '#FFF',
                  border: '1.5px solid #FF4D4D',
                  borderRadius: '8px',
                  padding: '8px 18px',
                  cursor: 'pointer',
                  fontWeight: 'bold',
                  fontSize: '0.84rem',
                  display: 'flex',
                  alignItems: 'center',
                  gap: '6px',
                  boxShadow: '0 4px 14px rgba(226, 54, 54, 0.45)',
                  transition: 'all 0.2s ease'
                }}
              >
                <span>🔥 Trigger Next Duel!</span>
              </button>
            </div>

            <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fit, minmax(320px, 1fr))', gap: '18px', position: 'relative' }}>
              <div className="roast-vs-emblem">VS</div>

              {/* Deadpool's Roast */}
              <div className="comic-balloon-deadpool" style={{ background: 'rgba(226, 54, 54, 0.15)', border: '1.5px solid #E23636', borderRadius: '12px', padding: '18px', boxShadow: '0 8px 24px rgba(224, 27, 34, 0.2)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🌮</span>
                    <span style={{ fontWeight: '900', color: '#FF4D4D', fontSize: '0.85rem', letterSpacing: '1px' }}>
                      DEADPOOL • MERC-WITH-A-MOUTH
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#FF8080', background: 'rgba(0,0,0,0.6)', border: '1px solid #E23636', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    🔴 Red Corner
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#FEE2E2', lineHeight: '1.6' }}>
                  {ROAST_BATTLES[heroDuelIdx % ROAST_BATTLES.length].deadpool}
                </p>
              </div>

              {/* Spider-Man's Comeback */}
              <div className="comic-balloon-spidey" style={{ background: 'rgba(2, 132, 199, 0.16)', border: '1.5px solid #0284C7', borderRadius: '12px', padding: '18px', boxShadow: '0 8px 24px rgba(56, 189, 248, 0.22)' }}>
                <div style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', marginBottom: '8px' }}>
                  <div style={{ display: 'flex', alignItems: 'center', gap: '8px' }}>
                    <span style={{ fontSize: '1.2rem' }}>🕷️</span>
                    <span style={{ fontWeight: '900', color: '#38BDF8', fontSize: '0.85rem', letterSpacing: '1px' }}>
                      SPIDER-MAN • SCIENTIFIC RETORT
                    </span>
                  </div>
                  <span style={{ fontSize: '0.7rem', color: '#38BDF8', background: 'rgba(0,0,0,0.6)', border: '1px solid #0284C7', padding: '2px 8px', borderRadius: '4px', fontWeight: 'bold' }}>
                    🔵 Cobalt Corner
                  </span>
                </div>
                <p style={{ fontSize: '0.88rem', color: '#F0F9FF', lineHeight: '1.6' }}>
                  {ROAST_BATTLES[heroDuelIdx % ROAST_BATTLES.length].spidey}
                </p>
                <div style={{ marginTop: '12px', paddingTop: '8px', borderTop: '1px dashed rgba(56, 189, 248, 0.3)', fontSize: '0.82rem', color: '#BAE6FD', fontStyle: 'italic' }}>
                  {ROAST_BATTLES[heroDuelIdx % ROAST_BATTLES.length].deadpoolEnd}
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* Multiverse Protocol Lore Card */}
        <section className="comic-card" style={{ padding: '32px 28px', marginBottom: '60px', borderLeft: '4px solid #38BDF8', borderRight: '4px solid #EF4444' }}>
          <div style={{ display: 'flex', alignItems: 'center', gap: '12px', marginBottom: '18px' }}>
            <span style={{ fontSize: '1.6rem' }}>🕷️</span>
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
                <strong style={{ color: '#FFF' }}>Silent Invigilation:</strong>
              </div>
              <p style={{ margin: 0 }}>
                During Stage 0, participant webcams capture snapshots to ensure honest testing. The organizer console monitors all feeds in real time.
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
              <span style={{ fontSize: '0.7rem', color: '#38BDF8', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>🕷️ PIXEL PARADOX 2026</span>
              <span style={{ width: '1px', height: '14px', background: 'rgba(255,255,255,0.2)' }} />
              <span style={{ fontSize: '0.7rem', color: '#FF6B6B', fontWeight: '800', letterSpacing: '2px', textTransform: 'uppercase' }}>HELP DESK &amp; STUDENT COORDINATORS ⚔️</span>
            </div>
            <p style={{ color: 'var(--text-secondary)', fontSize: '0.9rem', margin: '0 0 6px 0' }}>
              Organized by the <strong style={{ color: '#FFF' }}>Department of Computer Applications (MCA)</strong> — PSG College of Technology, Coimbatore
            </p>
            <p style={{ color: 'rgba(255,255,255,0.5)', fontSize: '0.82rem', margin: 0 }}>
              Need assistance during Stage 0 Prelims, webcam setup, or live challenges? Reach out to the student coordinators below.
            </p>
          </div>

          {/* Coordinator Contact Cards (Matching Uploaded Design) */}
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

                  {/* Green Phone Row Matching Screenshot */}
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

                  {/* Green Phone Row Matching Screenshot */}
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
              <li><strong>Webcam Invigilation:</strong> Allow camera permissions when prompted. The invigilation runs silently in 1-minute intervals.</li>
              <li><strong>Stage 0 Prelims:</strong> 30 Multiple Choice Questions in strictly 30 minutes. Correct answers award +10 points; wrong answers deduct -5 points.</li>
              <li><strong>Squad Summation:</strong> Member scores under the same registered Team ID add directly together into the team total.</li>
              <li><strong>Disconnections:</strong> If your network drops, simply log back in with your Team ID and member name to resume your active test.</li>
            </ul>
          </div>

          {/* Bottom nav links - 1 single, non-duplicate animation toggle and portal links */}
          <div style={{ display: 'flex', justifyContent: 'center', alignItems: 'center', gap: '8px', flexWrap: 'wrap', marginBottom: '20px' }}>
            <button
              type="button"
              onClick={() => handleToggleMascots(!hideMascotAnimations)}
              style={{
                background: 'rgba(255, 255, 255, 0.05)',
                border: '1px solid rgba(255, 255, 255, 0.15)',
                color: hideMascotAnimations ? '#86EFAC' : '#FF7B7B',
                cursor: 'pointer',
                fontSize: '0.82rem',
                fontWeight: '600',
                display: 'inline-flex',
                alignItems: 'center',
                gap: '6px',
                padding: '6px 14px',
                borderRadius: '8px',
                transition: 'all 0.2s ease'
              }}
              title={hideMascotAnimations ? "Show Spider-Man and Deadpool mascot animations" : "Hide Spider-Man and Deadpool mascot animations"}
            >
              {hideMascotAnimations ? "✨ Show Animations" : "🚫 Hide Animations"}
            </button>
            <span style={{ color: 'rgba(255,255,255,0.2)', fontSize: '0.8rem' }}>•</span>
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

      {/* ========================================================= */}
      {/* LEFT SIDE: DEADPOOL MERC-WITH-A-CHAT & AUTOMATED CHATBOT */}
      {/* ========================================================= */}
      <div className="sticky-deadpool-bar" ref={deadpoolContainerRef}>
        {/* Chatbot Window (Toggleable) */}
        {isDeadpoolChatOpen ? (
          <div className="deadpool-chat-window">
            {/* Header */}
            <div className="chat-window-header" style={{ background: 'linear-gradient(135deg, #E23636 0%, #850B12 100%)' }}>
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
                  <div style={{ fontSize: '0.7rem', color: '#F97316' }}>● Fourth Wall Breaker • Online</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsDeadpoolChatOpen(false)}
                className="chat-close-btn"
                title="Close Chat (Esc)"
                aria-label="Close Chat"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div ref={deadpoolChatBodyRef} className="chat-window-body">
              {deadpoolMessages.map((msg, idx) => (
                <div key={idx} className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-bot'}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    marginBottom: '2px', 
                    color: msg.sender === 'user' ? '#FFF' : msg.sender === 'spidey' ? '#38BDF8' : '#FF4D4D' 
                  }}>
                    {msg.sender === 'user' ? 'You' : msg.sender === 'spidey' ? 'Spider-Man' : 'Deadpool'}
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

              {/* Dynamic Interactive Suggestions & Prompts Hub — Seamlessly integrated inside Chat Body */}
              <div className="chat-suggestions-box">
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
                    background: 'linear-gradient(135deg, rgba(249, 115, 22, 0.2) 0%, rgba(226, 54, 54, 0.28) 100%)',
                    border: '1.5px solid #F97316',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#F97316',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title="Click to transfer to Spider-Man!"
                >
                  <span>💥 'Ask Spidey-bug he may know!' 🕸️</span>
                  <span style={{ background: '#F97316', color: '#FFF', padding: '3px 9px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>SWITCH ➔</span>
                </div>

                <div style={{ fontSize: '0.68rem', color: 'var(--text-dim)', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: 800 }}>
                  {deadpoolCategory === 'technical' ? 'Tournament Rules & AI Hints:' : 'Fourth-Wall Banter, Jokes & Trolls:'}
                </div>
                {(deadpoolCategory === 'technical' ? DEADPOOL_TECH_FAQ : DEADPOOL_NON_TECH_FAQ).map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="chat-chip"
                    onClick={() => handleDeadpoolAsk(faq.q, faq.a)}
                  >
                    <span>⚡</span>
                    <span>{faq.q}</span>
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

              <div ref={deadpoolChatBottomRef} />
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendDeadpoolCustom} className="chat-input-bar">
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
            <div style={{ fontSize: '0.7rem', color: '#F97316', marginTop: '4px', textAlign: 'left' }}>
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
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #7F1D1D 100%)',
            border: '2px solid #E23636',
            boxShadow: '0 4px 16px rgba(226, 54, 54, 0.7), 0 0 10px rgba(0, 0, 0, 0.8)',
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
      <div className="sticky-spidey-bar" ref={spideyContainerRef}>
        {/* Spidey Chatbot Window (Toggleable) */}
        {isSpideyChatOpen ? (
          <div className="spidey-chat-window">
            {/* Header */}
            <div className="chat-window-header" style={{ background: 'linear-gradient(135deg, #0284C7 0%, #0369A1 100%)' }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: '10px' }}>
                <div style={{ width: '32px', height: '32px', borderRadius: '50%', background: '#0284C7', overflow: 'hidden', display: 'flex', alignItems: 'center', justifyContent: 'center', border: '1.5px solid #38BDF8' }}>
                  <svg viewBox="0 0 64 64" style={{ width: '85%', height: '85%' }}>
                    <circle cx="32" cy="32" r="30" fill="#0284C7" />
                    <path d="M32 2 L32 62 M2 32 L62 32" stroke="#850B12" strokeWidth="1.5" />
                    <polygon points="14,30 29,36 28,24 16,18" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                    <polygon points="50,30 35,36 36,24 48,18" fill="#FFFFFF" stroke="#000" strokeWidth="2" />
                  </svg>
                </div>
                <div>
                  <div style={{ fontWeight: 'bold', fontSize: '0.9rem', color: '#FFF' }}>Spidey's Web-Bot</div>
                  <div style={{ fontSize: '0.7rem', color: '#38BDF8' }}>● Peter Parker • Tactical Assistant</div>
                </div>
              </div>
              <button 
                type="button"
                onClick={() => setIsSpideyChatOpen(false)}
                className="chat-close-btn"
                title="Close Chat (Esc)"
                aria-label="Close Chat"
              >
                ✕
              </button>
            </div>

            {/* Chat Body */}
            <div ref={spideyChatBodyRef} className="chat-window-body">
              {spideyMessages.map((msg, idx) => (
                <div key={idx} className={msg.sender === 'user' ? 'chat-bubble-user' : 'chat-bubble-spidey'}>
                  <div style={{ 
                    fontSize: '0.7rem', 
                    fontWeight: 'bold', 
                    marginBottom: '2px', 
                    color: msg.sender === 'user' ? '#FFF' : msg.sender === 'deadpool' ? '#FF4D4D' : '#38BDF8' 
                  }}>
                    {msg.sender === 'user' ? 'You' : msg.sender === 'deadpool' ? 'Deadpool' : 'Spider-Man'}
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

              {/* Dynamic Interactive Suggestions & Prompts Hub — Seamlessly integrated inside Chat Body */}
              <div className="chat-suggestions-box">
                {/* Category Filter Tabs */}
                <div style={{ display: 'flex', gap: '6px', margin: '2px 0' }}>
                  <button
                    type="button"
                    className={`cat-tab-btn ${spideyCategory === 'technical' ? 'active spidey' : ''}`}
                    onClick={() => setSpideyCategory('technical')}
                    style={{ flex: 1 }}
                  >
                    🔬 Forensics &amp; Science
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
                    background: 'linear-gradient(135deg, rgba(224, 27, 34, 0.2) 0%, rgba(133, 11, 18, 0.35) 100%)',
                    border: '1.5px solid #E01B22',
                    borderRadius: '8px',
                    padding: '8px 12px',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'space-between',
                    color: '#FF8080',
                    fontSize: '0.78rem',
                    fontWeight: 'bold',
                    cursor: 'pointer'
                  }}
                  title="Click to transfer to Deadpool!"
                >
                  <span>🕷️ 'Ask the guy in red spandex on the left!' 🌮</span>
                  <span style={{ background: '#E01B22', color: '#FFF', padding: '3px 9px', borderRadius: '4px', fontSize: '0.68rem', fontWeight: 800 }}>SWITCH ➔</span>
                </div>

                <div style={{ fontSize: '0.68rem', color: '#38BDF8', textTransform: 'uppercase', letterSpacing: '1px', marginTop: '4px', fontWeight: 800 }}>
                  {spideyCategory === 'technical' ? 'Forensic Science & Strategies:' : 'Spidey Banter, Jokes & Advice:'}
                </div>
                {(spideyCategory === 'technical' ? SPIDEY_TECH_FAQ : SPIDEY_NON_TECH_FAQ).map((faq, idx) => (
                  <div 
                    key={idx} 
                    className="chat-chip-spidey"
                    onClick={() => handleSpideyAsk(faq.q, faq.a)}
                  >
                    <span>🕸️</span>
                    <span>{faq.q}</span>
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

              <div ref={spideyChatBottomRef} />
            </div>

            {/* Custom Input */}
            <form onSubmit={handleSendSpideyCustom} className="chat-input-bar">
              <input 
                type="text"
                placeholder="Ask Spider-Man anything..."
                value={spideyInput}
                onChange={(e) => setSpideyInput(e.target.value)}
                style={{ flex: 1, background: 'rgba(255,255,255,0.05)', border: '1px solid rgba(224,27,34,0.3)', color: '#FFF', borderRadius: '6px', padding: '8px 12px', fontSize: '0.82rem', outline: 'none' }}
              />
              <button 
                type="submit"
                style={{ background: '#E01B22', color: '#FFF', border: 'none', borderRadius: '6px', padding: '8px 14px', marginLeft: '8px', cursor: 'pointer', fontWeight: 'bold', fontSize: '0.8rem' }}
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
            <div style={{ fontSize: '0.7rem', color: '#FF6B6B', marginTop: '4px', textAlign: 'right' }}>
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
            top: '-14px',
            width: '46px',
            height: '23px',
            pointerEvents: 'none'
          }}>
            <svg viewBox="0 0 60 30" fill="none">
              <path d="M12,25 Q30,2 48,25" stroke="#FF4D4D" strokeWidth="3" strokeLinecap="round" />
              <path d="M5,20 Q30,-8 55,20" stroke="#EF4444" strokeWidth="2" strokeLinecap="round" strokeDasharray="4 2" />
            </svg>
          </div>

          {/* Spider-Man Hanging Circle Avatar */}
          <div className="spidey-floating" style={{
            width: '44px',
            height: '44px',
            borderRadius: '50%',
            background: 'radial-gradient(circle at 35% 35%, #EF4444 0%, #7F1D1D 100%)',
            border: '2px solid #E01B22',
            boxShadow: '0 4px 16px rgba(224, 27, 34, 0.6), 0 0 10px rgba(224, 27, 34, 0.3)',
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
