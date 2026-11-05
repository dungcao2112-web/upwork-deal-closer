import type { SampleJob } from '../types';

/** 8 realistic Upwork job posts across Dũng's 5 niches (Quick-Load presets). */
export const SAMPLE_JOBS: SampleJob[] = [
  {
    id: 'job-faceless-pipeline',
    niche: 'video',
    label: '1. Faceless TikTok/Reels Pipeline (Remotion + Whisper)',
    title: 'Build Automated Faceless TikTok/Reels Video Pipeline with Remotion & Whisper',
    contractType: 'fixed',
    budget: 2500,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'United States', paymentVerified: true, totalSpent: 48000, hireRate: 72, proposals: 14, rating: 4.9 },
    description: `We run 6 faceless TikTok / Instagram Reels / YouTube Shorts channels (history facts, cooking tips, finance). Right now our editors spend 3-4 hours per video doing everything manually in CapCut and we can't scale past 10 videos a day.

We want a fully automated pipeline:
- Input: a script (Google Sheet row or JSON) + voiceover (ElevenLabs or our own TTS)
- Transcribe the voiceover with Whisper to get word-level timestamps
- Generate animated karaoke-style captions (word highlight), b-roll from our stock library, background music with ducking
- Render vertical 9:16 1080x1920 videos with Remotion
- Batch render 50+ videos per day, ideally on GPU
- Export to a folder / Google Drive with a simple dashboard to monitor the queue

Must have experience with Remotion, FFmpeg and Whisper. Please share examples of automated videos you have built. Audio must be consistent across videos (some of our current ones are way too quiet on TikTok).

Budget is fixed for the MVP, with ongoing work for the right person.`,
  },
  {
    id: 'job-mcp-cdp-agent',
    niche: 'agents',
    label: '2. Custom MCP Server & Chrome CDP Browser Agent',
    title: 'Custom MCP Server & Chrome CDP Browser Automation Agent',
    contractType: 'hourly',
    budget: 0,
    hourlyMin: 45,
    hourlyMax: 80,
    client: { country: 'Germany', paymentVerified: true, totalSpent: 120000, hireRate: 65, proposals: 9, rating: 4.8 },
    description: `We are a small SaaS team using Claude Code and Claude Desktop heavily. We need a custom MCP server (TypeScript / Node.js) that lets Claude control a real Chrome browser through the Chrome DevTools Protocol (CDP) to perform research and data-collection tasks on sites we are logged into.

Requirements:
1. MCP server exposing tools: open_tab, navigate, click, type, extract_table, screenshot, wait_for
2. Attach to an existing logged-in Chrome profile (not a fresh headless browser) — our previous Playwright attempt kept getting blocked by Cloudflare
3. Handle long-running tasks without the client timing out
4. Multi-agent mode: a planner agent splits a research task into sub-tasks and runs them in parallel tabs
5. Logging, retries and a simple test suite

Bonus: Windows desktop automation for one internal legacy app (UI Automation / AutoHotkey).

Please describe how you would avoid bot detection and how you handle MCP stdio transport issues.`,
  },
  {
    id: 'job-comfy-faceswap-tts',
    niche: 'localai',
    label: '3. ComfyUI Face-Swap + BG Removal API + Local TTS',
    title: 'ComfyUI Face-Swap & Product Background Removal API + Local TTS',
    contractType: 'fixed',
    budget: 1800,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'United Kingdom', paymentVerified: true, totalSpent: 9500, hireRate: 58, proposals: 22, rating: 4.7 },
    description: `We are an e-commerce marketing agency. We need a self-hosted AI service on our own GPU server (RTX 4090) — no per-image API costs and client photos must never leave our servers.

Scope:
- ComfyUI workflow for face swap (customer selfie onto model photos) that keeps identity and lighting realistic
- Batch background removal for product photos (hundreds per day), clean edges on hair and glass bottles, transparent PNG output
- A FastAPI wrapper with a queue, so our web app can submit jobs and poll status
- Local text-to-speech / voice cloning for product video voiceovers (we tried ElevenLabs but the cost is too high at our volume). Long scripts must sound natural.

Deliverables: Docker setup, API docs, and a short handover call. Previous freelancer delivered a ComfyUI graph that crashed with out-of-memory errors when two requests came in at once.`,
  },
  {
    id: 'job-threejs-office',
    niche: '3d',
    label: '4. Three.js 3D AI Avatar Office + Blender GLB Rigging',
    title: 'Three.js 3D Interactive AI Avatar Office & Blender GLB Rigging',
    contractType: 'fixed',
    budget: 3200,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'Canada', paymentVerified: true, totalSpent: 26000, hireRate: 80, proposals: 6, rating: 5 },
    description: `We are building a "virtual office" for our AI agent product. Each AI agent is represented by a 3D avatar in a browser-based office (Three.js or React Three Fiber). When an agent starts a task it should walk to its desk, sit down and show a status bubble; when idle it can walk around.

Needs:
- Import 6 character models (we have FBX / GLB from different artists) and rig them consistently in Blender — ideally scripted with Blender Python so we can add more later
- Natural walk / sit / turn animations — no foot sliding
- WebSocket connection to our backend for live agent states
- Must run smoothly on a mid-range laptop with 20+ avatars
- Clean, documented code

Please share any Three.js work with animated characters.`,
  },
  {
    id: 'job-hotel-parity',
    niche: 'ota',
    label: '5. Channex / Booking.com Rate Parity Automation',
    title: 'Hotel Channel Manager Channex / Booking.com Rate Parity Automation',
    contractType: 'fixed',
    budget: 1200,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'Vietnam', paymentVerified: true, totalSpent: 3200, hireRate: 45, proposals: 11, rating: 4.6 },
    description: `We manage 4 boutique hotels connected through Channex to Booking.com, Agoda, Expedia and Trip.com. Our revenue team checks rate parity manually every morning which takes 2 hours and we still miss mistakes — last month a wrong rate on Agoda cost us money and we had an overbooking.

We need a tool that:
- Pulls rates and availability from the Channex API
- Checks the actual price shown to guests on each OTA for the next 60 days (incl. taxes, Net vs Gross differences)
- Flags parity issues and cancellation policy mismatches
- Sends a daily Excel report + Telegram alert
- Simple web dashboard to see the issues

Bonus if you have worked with hotel PMS or OTA extranets before.`,
  },
  {
    id: 'job-capcut-clone',
    niche: 'video',
    label: '6. React Browser Video Editor (CapCut-like) + FFmpeg',
    title: 'React Video Editor like CapCut in Browser with FFmpeg Backend',
    contractType: 'fixed',
    budget: 5000,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'Australia', paymentVerified: true, totalSpent: 64000, hireRate: 70, proposals: 31, rating: 4.9 },
    description: `Looking for a senior developer to build a browser-based video editor similar to CapCut for our creator platform.

Features:
- Multi-track timeline (video, overlays, text, audio, captions) with drag, trim, split
- Real-time preview in the browser, smooth at 30fps
- Text overlays, transitions (crossfade), Ken Burns zoom on images
- Auto captions using Whisper with editable subtitles
- Export both 9:16 and 16:9
- Server-side rendering with FFmpeg (Node.js backend), GPU encoding preferred
- React + TypeScript, clean architecture, tests

This is a long-term project; MVP first. Show us a similar editor you have built — we will only consider proposals with real examples.`,
  },
  {
    id: 'job-electron-reverse',
    niche: 'agents',
    label: '7. Reverse Engineer Electron App → Web Dashboard',
    title: 'Reverse Engineer Electron Desktop App & Rebuild Web Dashboard',
    contractType: 'hourly',
    budget: 0,
    hourlyMin: 30,
    hourlyMax: 55,
    client: { country: 'Singapore', paymentVerified: false, totalSpent: 0, hireRate: 0, proposals: 8 },
    description: `We use a legacy Electron desktop app from a vendor that went out of business. There is no documentation. We need someone to reverse engineer the app (app.asar, its private API calls and local database) and rebuild the key features as a modern web dashboard (React).

Tasks:
- Analyze the Electron bundle and document the undocumented API endpoints and data model
- Write a Node.js service that talks to the same backend / local data
- Rebuild 5 core screens as a React dashboard
- Optional: automate a few repetitive actions in the desktop app until the dashboard is ready

This should be quick and easy for an expert. Please contact me on Telegram for faster communication.`,
  },
  {
    id: 'job-multi-agent-orch',
    niche: 'agents',
    label: '8. Multi-Agent Orchestration with Claude Code & Codex CLI',
    title: 'Multi-Agent Orchestration System with Claude Code & Codex CLI',
    contractType: 'fixed',
    budget: 4000,
    hourlyMin: 0,
    hourlyMax: 0,
    client: { country: 'United States', paymentVerified: true, totalSpent: 210000, hireRate: 76, proposals: 12, rating: 4.9 },
    description: `We want to build an internal autonomous engineering system: a "lead" agent (Claude Code) that breaks down tickets and delegates to multiple worker agents (OpenAI Codex CLI, Gemini CLI and local models through Ollama) running in parallel.

Requirements:
- Orchestrator that plans, assigns and tracks tasks across agents
- Shared state so agents don't overwrite each other's work
- Quality gates: every task must be verified by automated checks before it is marked done (we've had agents claim success when tests were failing)
- Cost control — route simple tasks to cheaper/local models
- Real-time dashboard / chat room showing what every agent is doing
- Runs on Windows + WSL2

Please explain your experience with multi-agent systems and how you prevent agents from looping or hallucinating success.`,
  },
];
