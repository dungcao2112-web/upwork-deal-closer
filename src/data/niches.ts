import type { NicheId, NicheProfile } from '../types';

export const DEFAULT_EXCLUDES = ['wordpress', 'wix', 'data entry', 'virtual assistant', 'shopify theme', 'logo design'];

export const NICHES: NicheProfile[] = [
  {
    id: 'video',
    emoji: '🎬',
    name: 'Programmatic Video & AI Video Editors',
    nameVi: 'Video lập trình & Trình dựng video AI',
    coreTerms: ['remotion', 'ffmpeg', 'whisper', 'nvenc', 'video automation', 'video pipeline'],
    plusTerms: ['captions', 'tiktok', 'reels', 'youtube shorts', 'faceless', 'video editor', 'subtitles', 'motion graphics', 'gsap', 'text to video'],
    defaultExcludes: [...DEFAULT_EXCLUDES, 'video editor needed for youtube vlog'],
    minHourly: 35,
    marketRate: 55,
    profileTitle: 'AI Video Pipeline Engineer | Remotion · FFmpeg NVENC · Whisper',
    profileOverview:
      'I build video systems that edit themselves.\n\n' +
      'If you need hundreds of TikToks, Reels, Shorts or YouTube episodes rendered from scripts, data or raw footage — without an editor in the loop — that is exactly what I run every day:\n\n' +
      '• Programmatic rendering: Remotion + GSAP + FFmpeg on CUDA/NVENC. My hybrid CPU+GPU scheduler renders 6.4x faster at SSIM 0.995.\n' +
      '• AI editing: Faster-Whisper large-v3 transcription with hallucination filtering, automatic silence/stutter cutting, word-level karaoke captions.\n' +
      '• Browser editors: my AI CapCut Studio (React + TS) has a 5-track timeline, 30fps real-time preview and prompt-to-edit commands.\n' +
      '• Broadcast-ready audio: 2-pass EBU R128 to -14 LUFS on every export.\n' +
      '• Proven QA: 82/82 automated tests on my offline conversation-video pipeline.\n\n' +
      'You get a working prototype on your own content in the first milestone, measurable quality (SSIM, LUFS, ffprobe reports) and clean, documented code you own.\n\n' +
      'Send me one example video and your target format — I will reply with how I would automate it.',
    skills: ['Remotion', 'FFmpeg', 'Video Editing Automation', 'Whisper', 'React', 'TypeScript', 'Node.js', 'Python', 'NVIDIA NVENC', 'Motion Graphics', 'GSAP', 'Subtitles & Captions', 'AI Video Generation', 'YouTube Automation', 'TikTok'],
    pipelineVi: 'Script/JSON hoặc footage → Whisper → cut.json → Remotion → NVENC → EBU R128 → QA → xuất bản',
  },
  {
    id: 'agents',
    emoji: '🤖',
    name: 'AI Agents, MCP Servers & Browser/Desktop Automation',
    nameVi: 'AI Agents, MCP Server & Tự động hóa Trình duyệt/Desktop',
    coreTerms: ['mcp server', 'ai agent', 'claude', 'browser automation', 'multi-agent', 'chrome devtools protocol'],
    plusTerms: ['playwright', 'puppeteer', 'cdp', 'autonomous agent', 'claude code', 'openai', 'langgraph', 'desktop automation', 'rpa', 'chrome extension', 'anthropic'],
    defaultExcludes: [...DEFAULT_EXCLUDES, 'chatbot for website', 'customer service'],
    minHourly: 40,
    marketRate: 65,
    profileTitle: 'AI Agent Architect | Claude · MCP Servers · Chrome CDP Automation',
    profileOverview:
      'I build AI agents that actually finish the job — and prove it.\n\n' +
      'My own CEO multi-agent framework runs every day: a Claude planner dispatching Codex CLI, Gemini/Antigravity and local models (Qwen, Gemma, GPT-OSS via Ollama) in parallel, with every task passing a 7-gate QA pipeline (G0→G6) before it counts as done.\n\n' +
      '• MCP servers & tools for Claude Code, Claude Desktop and other MCP clients.\n' +
      '• Real-browser automation over Chrome DevTools Protocol, chrome-devtools MCP and MV3 extensions — no headless fingerprints, no Cloudflare walls.\n' +
      '• Windows desktop automation with UI Automation, AutoHotkey v2 and Win32 (Zalo, Telegram, CapCut, GPMLogin…).\n' +
      '• Cost control: routine steps on local LLMs, frontier models only where they matter.\n\n' +
      'I start with a working agent on your real workflow in milestone one, then harden it with independent acceptance tests.\n\n' +
      'Tell me the workflow you want off your plate — I will reply with an architecture sketch.',
    skills: ['AI Agent Development', 'Model Context Protocol', 'Claude', 'OpenAI API', 'Browser Automation', 'Chrome DevTools Protocol', 'Playwright', 'Puppeteer', 'Node.js', 'TypeScript', 'Python', 'LLM Prompt Engineering', 'Robotic Process Automation', 'AutoHotkey', 'Workflow Automation'],
    pipelineVi: 'Trigger → CEO Planner → Workers song song (Codex/Gemini/Local) → Tools (MCP/CDP/UIA) → QA G0–G6 → Báo cáo',
  },
  {
    id: 'localai',
    emoji: '🎙️',
    name: 'Local AI: Voice Cloning / TTS & ComfyUI Workflows',
    nameVi: 'Local AI: Nhân bản giọng / TTS & ComfyUI',
    coreTerms: ['comfyui', 'voice cloning', 'text to speech', 'face swap', 'background removal', 'stable diffusion'],
    plusTerms: ['tts', 'elevenlabs', 'lora', 'flux', 'birefnet', 'rembg', 'self-hosted', 'local ai', 'gpu', 'controlnet', 'inpainting'],
    defaultExcludes: [...DEFAULT_EXCLUDES, 'photoshop retouching', 'manual editing'],
    minHourly: 35,
    marketRate: 55,
    profileTitle: 'Local AI Engineer | ComfyUI · Voice Cloning TTS · Face Swap',
    profileOverview:
      'Production-grade image and voice AI that runs on your own GPU — no per-call API bills, no data leaving your servers.\n\n' +
      '• ComfyUI workflows exposed as clean APIs: 2-input face swap (Qwen Image 2.1 LoRA), sharpness-preserving text removal, batch BiRefNet/rembg background removal, A4 300-DPI document layout.\n' +
      '• Voice: one TTS gateway over 8 engines (VieNeu-TTS, OmniVoice, Voicebox/Qwen CustomVoice with prosody "instruct", Qwen3-TTS, F5-TTS, Fish Speech, VoiceStudio, ElevenLabs fallback) with breath-aware chunking for long-form narration.\n' +
      '• Built and tested on an NVIDIA RTX 5070 Ti — queueing, VRAM management and progress streaming included.\n\n' +
      'Send me 5 sample images or a script and I will run them through my setup so you can judge the quality before hiring.',
    skills: ['ComfyUI', 'Stable Diffusion', 'Text to Speech', 'Voice Cloning', 'Python', 'Generative AI', 'Image Processing', 'Background Removal', 'Face Swap', 'LoRA Training', 'FastAPI', 'CUDA', 'Computer Vision', 'ElevenLabs', 'AI Image Generation'],
    pipelineVi: 'Upload → Queue → ComfyUI graph / TTS gateway (GPU) → Hậu kỳ (crop alpha, chuẩn hóa âm lượng) → Webhook/Storage',
  },
  {
    id: '3d',
    emoji: '🧊',
    name: '3D Web & Blender Automation',
    nameVi: '3D Web & Tự động hóa Blender',
    coreTerms: ['three.js', 'webgl', 'blender python', 'glb', 'rigging', '3d avatar'],
    plusTerms: ['react three fiber', 'gltf', 'animation', 'walk cycle', 'metaverse', 'virtual office', 'blender', 'reverse engineering', 'electron'],
    defaultExcludes: [...DEFAULT_EXCLUDES, '3d rendering interior', 'architectural visualization'],
    minHourly: 40,
    marketRate: 60,
    profileTitle: 'Three.js & Blender Developer | WebGL 3D Avatars · GLB Rigging',
    profileOverview:
      'I bring 3D characters to life in the browser — and automate the Blender work behind them.\n\n' +
      '• VanPhong3D: a Three.js/WebGL office where avatars mirror live AI-agent activity with real-time hardware telemetry.\n' +
      '• Blender Python API & Blender MCP: one-click 17-bone humanoid rigging for whole character sets (.glb).\n' +
      '• character3d.js: stride-locked walk cycles (no foot sliding at any speed) and a procedural skeleton post-fixer for smooth sit/turn transitions.\n' +
      '• Also: multiplayer Node.js games, Electron/JS bundle reverse engineering, Witcher 3 & Ren\'Py modding.\n\n' +
      'Milestone one is always your models walking in your scene. Send me a GLB and I will show you.',
    skills: ['Three.js', 'WebGL', 'Blender', 'Python', '3D Animation', 'Rigging', 'JavaScript', 'TypeScript', 'React', 'glTF', 'Game Development', 'WebSocket', 'Node.js', 'Reverse Engineering', 'Electron'],
    pipelineVi: 'Model nguồn → Blender auto-rig (Python/MCP) → GLB → Three.js scene → Locomotion controller → WebSocket state',
  },
  {
    id: 'ota',
    emoji: '🏨',
    name: 'OTA Hotel Automation & Affiliate Web Apps',
    nameVi: 'Tự động hóa OTA Khách sạn & Web App Affiliate',
    coreTerms: ['channex', 'channel manager', 'booking.com', 'agoda', 'rate parity', 'hotel automation'],
    plusTerms: ['expedia', 'trip.com', 'pms', 'revenue management', 'shopee', 'affiliate', 'excel', 'dashboard', 'web scraping'],
    defaultExcludes: [...DEFAULT_EXCLUDES, 'cold calling', 'travel agent'],
    minHourly: 30,
    marketRate: 45,
    profileTitle: 'Hotel OTA Automation | Channex · Booking.com · Rate Parity Tools',
    profileOverview:
      'I automate hotel distribution so your revenue team stops checking prices by hand.\n\n' +
      'I run live automation for The L\'anmien Saigon: Bluejay PMS / Channex connected to Booking.com, Agoda, Trip.com and Expedia.\n\n' +
      '• Rate-parity checks against the guest-facing price on every OTA (read in a real browser — not just the API).\n' +
      '• Net vs Gross and tax normalization per channel, cancellation-policy reconciliation, room open/close.\n' +
      '• Excel/CSV reports and dashboards for owners and revenue managers.\n' +
      '• Also: affiliate web apps (React + Vite + Tailwind, Shopee affiliate links) and social/competitor intelligence tools.\n\n' +
      'Give me read access to one property and I will send you a parity report before we sign.',
    skills: ['Hotel Management', 'Channel Manager', 'API Integration', 'Web Scraping', 'Automation', 'React', 'TypeScript', 'Node.js', 'Python', 'Excel', 'Dashboard', 'Booking.com', 'Revenue Management', 'Affiliate Marketing', 'Chrome Extension'],
    pipelineVi: 'Channex/PMS API + Chrome CDP (giá khách thấy) → Chuẩn hóa Net/Gross → So khớp parity & chính sách → Báo cáo/Alert',
  },
];

export const NICHE_BY_ID: Record<NicheId, NicheProfile> = Object.fromEntries(
  NICHES.map((n) => [n.id, n]),
) as Record<NicheId, NicheProfile>;

export const NICHE_IDS: NicheId[] = NICHES.map((n) => n.id);
