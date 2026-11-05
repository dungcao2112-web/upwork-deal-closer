import type { CorePositioning, PortfolioProject } from '../types';

/**
 * Source of truth: docs/HO_SO_CONG_VIEC_UPWORK_CHO_CLAUDE.md
 * Real, working prototypes Dũng uses as "closing weapons" on Upwork.
 */

export const CORE_POSITIONING: CorePositioning = {
  name: 'Dũng',
  roles: [
    'AI Automation Architect',
    'Full-Stack AI & Media Tools Developer',
    'Multi-Agent Workflow Engineer',
    'Browser & Desktop Automation Specialist',
  ],
  headlineEn:
    'AI Automation Architect — I build end-to-end autonomous pipelines that combine LLM agents, real-browser control and GPU media processing.',
  uniqueEdgeVi:
    'Thiết kế & vận hành hệ thống AI tự hành đầu-cuối (End-to-End Autonomous Pipelines) kết hợp LLM (Claude Code/API, OpenAI Codex, Gemini/Antigravity CLI, Local LLMs qua Ollama/AICoworker), trình duyệt thật (Chrome CDP / MCP), điều khiển Windows Desktop (agent-desktop UIA, AutoHotkey v2, Win32) và xử lý đa phương tiện bằng GPU NVIDIA RTX 5070 Ti (FFmpeg NVENC, Remotion, Faster-Whisper CUDA, ComfyUI, Local TTS/Voice Cloning).',
  uniqueEdgeEn:
    'I design and operate end-to-end autonomous pipelines: LLM agents (Claude Code/API, OpenAI Codex, Gemini/Antigravity CLI, local LLMs via Ollama), real-browser control (Chrome CDP / MCP), Windows desktop automation (UI Automation, AutoHotkey v2, Win32) and GPU media processing on an NVIDIA RTX 5070 Ti (FFmpeg NVENC, Remotion, Faster-Whisper CUDA, ComfyUI, local TTS / voice cloning).',
  hardware: 'NVIDIA RTX 5070 Ti (CUDA / NVENC)',
  llmStack: ['Claude Code / API', 'OpenAI Codex CLI', 'Gemini / Antigravity CLI', 'Ollama / AICoworker local LLMs'],
  signatureMetrics: [
    { label: 'Render speed-up (hybrid CPU+GPU)', value: '6.4x' },
    { label: 'Quality retained', value: 'SSIM 0.995' },
    { label: 'Broadcast loudness', value: '-14 LUFS (EBU R128 2-pass)' },
    { label: 'Automated tests passing', value: '82/82' },
    { label: 'QA pipeline', value: '7-Gate G0→G6' },
  ],
};

export const PORTFOLIO_PROJECTS: PortfolioProject[] = [
  // ── P1 ─────────────────────────────────────────────────────
  {
    id: 'ai-capcut-studio',
    code: 'P1',
    name: 'AI CapCut Studio',
    shortName: 'AI CapCut Studio',
    localPath: 'D:\\ai-capcut-studio',
    github: 'dungcao2112-web/ai-capcut-studio',
    niches: ['video'],
    taglineEn: 'Browser-based CapCut-style video editor with an AI prompt-to-edit engine and NVENC rendering.',
    summaryVi:
      'Web App dựng video giao diện CapCut Dark Studio, 9:16 + 16:9, preview 30fps, timeline 5 lớp, AI Prompt-to-Edit, render NVENC có fallback CPU.',
    stack: ['React', 'TypeScript', 'Vite', 'Tailwind', 'Lucide', 'Node.js/Express', 'FFmpeg', 'NVENC'],
    keywords: ['videoeditor', 'react', 'nodejs', 'ffmpeg', 'nvenc', 'captions', 'shortform', 'youtube', 'motion', 'videoqa', 'canvas', 'llm', 'claude', 'openai'],
    highlightsVi: [
      'Song song 9:16 Reels/TikTok/Shorts (1080×1920) và 16:9 YouTube (1920×1080).',
      'Preview thời gian thực 30fps: Ken Burns pan/zoom, crossfade, overlay text cards, karaoke captions.',
      'Multi-track Timeline 5 lớp.',
      'AI Prompt-to-Edit: lệnh ngôn ngữ tự nhiên để cắt ghép, thay clip, sửa phụ đề, lấp GAP.',
      'Tự chấm điểm chất lượng hình ảnh (chuyển động MAD, độ nét Laplacian).',
      'Render h264_nvenc trên RTX 5070 Ti, cầu chì tự fallback libx264.',
    ],
    metrics: [
      { label: 'Formats', value: '9:16 1080×1920 + 16:9 1920×1080' },
      { label: 'Preview', value: '30fps real-time' },
      { label: 'Timeline', value: '5-track' },
      { label: 'Encoder', value: 'h264_nvenc → libx264 fallback' },
    ],
    proofOfWork:
      'I built AI CapCut Studio — a browser video editor (React + TypeScript + Vite + Node/Express) with a 5-track timeline, real-time 30fps preview (Ken Burns, crossfades, text cards, karaoke captions) and parallel 9:16 / 16:9 exports. Its AI Prompt-to-Edit engine turns plain-English commands ("swap clip 3, fill the gap, tighten captions") into timeline edits, auto-scores shots by motion (MAD) and sharpness (Laplacian), and renders with h264_nvenc on an RTX 5070 Ti with an automatic libx264 fallback fuse.',
    demoAsset: 'Screen recording: type a prompt → timeline updates → NVENC export of 9:16 and 16:9 side by side.',
    reusableModules: [
      'Multi-track timeline engine',
      'Real-time canvas preview renderer',
      'Prompt-to-Edit command parser',
      'Shot quality scorer (MAD / Laplacian)',
      'NVENC render service with CPU fallback',
      'Karaoke caption renderer',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở tab AI CapCut Studio (dark UI) đã nạp sẵn project mẫu 9:16. Để camera nhỏ góc phải.',
        sayEn: 'Hi! Quick 90-second look at a browser video editor I already run in production — this is basically the core of what your job describes.',
        sayVi: 'Chào bạn! 90 giây xem nhanh trình dựng video trên trình duyệt tôi đang chạy thật — đây chính là lõi những gì bạn mô tả.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Gõ lệnh vào ô AI Prompt-to-Edit: "replace clip 3 with the sharpest b-roll and fill the gap". Chỉ vào timeline 5 lớp đang tự cập nhật, bật preview 30fps.',
        sayEn: 'I type a plain-English command and the engine edits the 5-track timeline: it picks the sharpest b-roll using motion and sharpness scores, fills the gap, and keeps captions in sync. Preview stays at 30fps.',
        sayVi: 'Tôi gõ lệnh tiếng Anh thường và engine tự sửa timeline 5 lớp: chọn b-roll nét nhất theo điểm chuyển động & độ nét, lấp khoảng trống, phụ đề vẫn khớp. Preview giữ 30fps.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Bấm Export 9:16 và 16:9 cùng lúc, mở terminal log hiện "h264_nvenc", rồi mở 2 file kết quả.',
        sayEn: 'Export renders on the GPU with NVENC — and if a machine has no NVIDIA card, a fuse falls back to libx264 automatically, so it never breaks in production.',
        sayVi: 'Xuất video render bằng GPU NVENC — máy không có card NVIDIA thì cầu chì tự chuyển sang libx264, không bao giờ vỡ trên production.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại mặt mình, mỉm cười, chốt.',
        sayEn: 'I can adapt this exact codebase to your requirements and show you a working build on your own footage within the first milestone. Talk soon!',
        sayVi: 'Tôi có thể chỉnh chính codebase này theo yêu cầu của bạn và cho bạn xem bản chạy trên chính footage của bạn ngay milestone đầu. Hẹn sớm nói chuyện!',
      },
    ],
  },

  // ── P2 ─────────────────────────────────────────────────────
  {
    id: 'app-video-chia-se',
    code: 'P2',
    name: 'Two-Person Conversation Video App ("Video Chia Sẻ Hội Thoại 2 Người")',
    shortName: 'App Video 2 Người',
    localPath: 'E:\\vd chia se',
    github: 'dungcao2112-web/app-video-chia-se',
    niches: ['video', 'localai'],
    taglineEn: 'Offline 10-step split-screen conversation video pipeline with Faster-Whisper, AI cut lists and Remotion export — 82/82 tests.',
    summaryVi:
      'Đóng gói quy trình 10 bước sản xuất video hội thoại split-screen 1080×1080 chạy offline 100%, Faster-Whisper large-v3 CUDA, cut.json/idle.json tự động, Remotion + EBU R128 -14 LUFS, 82/82 test.',
    stack: ['Python', 'Faster-Whisper large-v3 (CUDA)', 'FFmpeg', 'Remotion', 'React', 'rembg'],
    keywords: ['whisper', 'silence', 'remotion', 'ffmpeg', 'loudness', 'captions', 'nvenc', 'python', 'react', 'qa', 'vision', 'bgremoval', 'gpuserver'],
    highlightsVi: [
      'Quy trình 10 bước, split-screen 1080×1080 @30fps, chạy 100% offline / local AI.',
      'Đạt 82/82 bài kiểm thử tự động.',
      'Faster-Whisper large-v3 CUDA nhận diện tiếng Việt; phát hiện nói vấp, khoảng lặng (dBFS), câu Whisper bịa.',
      'AI tự lập cut.json; trích frame 2fps chấm điểm cảnh người nghe tự nhiên (idle.json).',
      'Ghép ảnh sản phẩm tách nền, auto-crop sát biên alpha, co giãn thông minh.',
      'Xuất Remotion + chuẩn hóa âm thanh 2-pass EBU R128 (-14 LUFS).',
    ],
    metrics: [
      { label: 'Automated tests', value: '82/82 passing' },
      { label: 'ASR', value: 'Faster-Whisper large-v3 CUDA' },
      { label: 'Output', value: '1080×1080 @30fps' },
      { label: 'Loudness', value: '-14 LUFS EBU R128 2-pass' },
    ],
    proofOfWork:
      'I shipped a fully offline 10-step pipeline that turns raw two-person conversations into polished split-screen videos (1080×1080, 30fps) — 82/82 automated tests passing. Faster-Whisper large-v3 on CUDA transcribes, then my code flags stutters, dBFS-based silences and Whisper hallucinations, writes an AI cut list (cut.json), samples frames at 2fps to choose natural listener shots (idle.json: closed mouth, correct gaze, no dissolve ghosting), composites background-removed product images with alpha-tight auto-crop, and exports through Remotion with 2-pass EBU R128 loudness normalization to -14 LUFS.',
    demoAsset: 'Before/after: raw 2-camera footage → cut.json diff → final split-screen video with product overlays.',
    reusableModules: [
      'Whisper hallucination & stutter detector',
      'dBFS silence cutter → cut.json',
      'Listener-shot picker (idle.json, 2fps scoring)',
      'Alpha-tight auto-crop compositor',
      'EBU R128 2-pass loudness normalizer',
      'Remotion split-screen composition',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở thư mục dự án + terminal đang chạy test: hiện dòng "82 passed".',
        sayEn: 'This is an offline video pipeline I built — 82 out of 82 automated tests passing. Let me show you what it does with raw footage in under a minute.',
        sayVi: 'Đây là pipeline video chạy offline tôi xây — 82/82 test tự động đều pass. Để tôi cho bạn xem nó xử lý footage thô trong chưa tới 1 phút.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Mở file transcript Whisper, highlight các dòng bị đánh dấu "hallucination" và "silence". Mở cut.json và idle.json.',
        sayEn: 'Whisper large-v3 runs on my GPU. The pipeline flags stutters, silences by dBFS and the lines Whisper invents during quiet parts — then writes a cut list and picks natural listener shots automatically.',
        sayVi: 'Whisper large-v3 chạy trên GPU. Pipeline đánh dấu chỗ nói vấp, khoảng lặng theo dBFS và những câu Whisper tự bịa ở đoạn yên lặng — rồi tự viết danh sách cắt và chọn cảnh người nghe tự nhiên.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Phát video kết quả split-screen có ảnh sản phẩm tách nền; mở log ffmpeg loudnorm hiện -14 LUFS.',
        sayEn: 'Here is the final split-screen with product overlays, exported through Remotion and normalized to minus 14 LUFS in two passes — so it sounds consistent on every platform.',
        sayVi: 'Đây là video split-screen cuối có ảnh sản phẩm, xuất qua Remotion và chuẩn hóa âm lượng -14 LUFS 2 lượt — nghe đều trên mọi nền tảng.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'I can plug your footage and rules into this same pipeline — happy to run a sample on one of your files first.',
        sayVi: 'Tôi có thể cắm footage và quy tắc của bạn vào chính pipeline này — sẵn sàng chạy thử 1 file của bạn trước.',
      },
    ],
  },

  // ── P3 ─────────────────────────────────────────────────────
  {
    id: 'code-video-render',
    code: 'P3',
    name: 'Programmatic Video Render System (Remotion + FFmpeg CUDA/NVENC + GSAP/Hyperframes)',
    shortName: 'Code Video Render System',
    niches: ['video'],
    taglineEn: 'JSON/Python-scripted video factory with hybrid CPU+GPU rendering — 6.4x faster at SSIM 0.995.',
    summaryVi:
      'Dựng video tự động từ kịch bản JSON/Python cho kênh YouTube bản đồ lịch sử và Reels nấu ăn; hybrid CPU+GPU nhanh 6.4x, SSIM 0.995; animated-chart, cut-silences, embedded-captions; NVEnc Video Compressor có SSD cache.',
    stack: ['Remotion', 'FFmpeg CUDA/NVENC', 'GSAP', 'Hyperframes', 'Python', 'Node.js'],
    keywords: ['remotion', 'ffmpeg', 'nvenc', 'motion', 'captions', 'silence', 'youtube', 'shortform', 'python', 'nodejs', 'videoqa', 'queue', 'react', 'tts'],
    highlightsVi: [
      'Dựng video tự động từ JSON/Python (build_video.py, gpu_accel.py).',
      'Kênh YouTube bản đồ lịch sử – địa lý và kênh Reels nấu ăn.',
      'Hybrid CPU + GPU nhanh gấp 6.4 lần, giữ SSIM 0.995.',
      'Motion Graphics, animated-chart, cut-silences, embedded-captions.',
      'NVEnc Video Compressor hàng loạt có SSD Cache.',
    ],
    metrics: [
      { label: 'Speed-up', value: '6.4x (hybrid CPU+GPU)' },
      { label: 'Quality', value: 'SSIM 0.995' },
      { label: 'Inputs', value: 'JSON / Python scripts' },
      { label: 'Batch compressor', value: 'NVENC + SSD cache' },
    ],
    proofOfWork:
      'I run a code-driven video factory that renders full YouTube and Reels episodes from JSON/Python scripts (build_video.py, gpu_accel.py) with Remotion, GSAP/Hyperframes and FFmpeg on CUDA/NVENC. A hybrid CPU+GPU scheduler made renders 6.4x faster while keeping SSIM at 0.995 versus the CPU baseline. Reusable components include animated charts, automatic silence cutting and embedded animated captions, plus a batch NVENC compressor with an SSD cache layer for high-throughput I/O.',
    demoAsset: 'Side-by-side: JSON script → rendered map-history episode; benchmark table CPU vs hybrid (6.4x, SSIM 0.995).',
    reusableModules: [
      'JSON → Remotion scene compiler',
      'Hybrid CPU+GPU render scheduler (gpu_accel.py)',
      'animated-chart component',
      'cut-silences module',
      'embedded-captions module',
      'Batch NVENC compressor with SSD cache',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở VS Code với file script JSON của 1 tập YouTube bản đồ lịch sử.',
        sayEn: 'This JSON file is an entire YouTube episode. My render system turns it into a finished video — no manual editing at all.',
        sayVi: 'File JSON này là cả một tập YouTube. Hệ thống render của tôi biến nó thành video hoàn chỉnh — không cần dựng tay.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Chạy python build_video.py, chỉ vào log gpu_accel phân luồng CPU/GPU; mở preview Remotion có animated-chart và captions.',
        sayEn: 'It compiles scenes into Remotion, adds animated charts and captions, and a hybrid scheduler splits work between CPU and GPU — that took renders from slow to 6.4 times faster.',
        sayVi: 'Nó biên dịch cảnh vào Remotion, thêm biểu đồ động và phụ đề, bộ lập lịch hybrid chia việc giữa CPU và GPU — giúp render nhanh gấp 6.4 lần.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Mở bảng benchmark (CPU vs Hybrid) + kết quả SSIM 0.995; phát 5 giây video thành phẩm.',
        sayEn: 'And quality is measured, not guessed: SSIM 0.995 against the CPU reference. Here is the final output.',
        sayVi: 'Chất lượng được đo chứ không đoán: SSIM 0.995 so với bản CPU chuẩn. Đây là video thành phẩm.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'Your templates can run on this same engine — I would start by converting one of your videos into a script so you can see it end to end.',
        sayVi: 'Template của bạn có thể chạy trên chính engine này — tôi sẽ bắt đầu bằng việc chuyển 1 video của bạn thành script để bạn xem trọn vẹn.',
      },
    ],
  },

  // ── P4 ─────────────────────────────────────────────────────
  {
    id: 'ceo-multi-agent',
    code: 'P4',
    name: 'CEO Multi-Agent Framework & Browser/Desktop Control (MCP & CDP)',
    shortName: 'CEO Multi-Agent Framework',
    niches: ['agents'],
    taglineEn: 'A CEO agent orchestrating Codex, Gemini and local LLM workers with a 7-gate (G0→G6) QA pipeline and real-Chrome CDP control.',
    summaryVi:
      'CEO Claude điều phối song song Codex CLI, Antigravity CLI, AICoworker, Muse AI; QA 7 cổng G0→G6; Chrome CDP / chrome-devtools MCP / extension MV3; FlowKit WSL2; điều khiển Windows Desktop bằng UIA, AutoHotkey v2, Win32.',
    stack: ['Claude Code', 'Codex CLI', 'Antigravity CLI', 'Ollama/AICoworker', 'Node.js', 'Chrome CDP', 'MCP', 'AutoHotkey v2', 'Win32 UIA', 'WSL2'],
    keywords: ['multiagent', 'claude', 'openai', 'gemini', 'llm', 'ollama', 'mcp', 'cdp', 'playwright', 'antibot', 'desktop', 'nodejs', 'qa', 'docker', 'telegram', 'n8n', 'api', 'electron'],
    highlightsVi: [
      'CEO Claude lập kế hoạch & điều phối song song Codex CLI (đa tài khoản), Antigravity CLI (agy), AICoworker (gemini38, claude-sonnet, claude-opus, gpt-oss, gemma4, qwen35), Muse AI.',
      'QA 7 cổng G0 → G6: tiền điều kiện, chạy ẩn CreateNoWindow, nghiệm thu độc lập bằng ffprobe/SSIM/LUFS, đồng bộ STATE.md, task-room.mjs, call-agent.mjs.',
      'Điều khiển Chrome thật qua CDP, chrome-devtools MCP (--autoConnect), chrome-relay, extension MV3 — vượt anti-bot/Cloudflare.',
      'FlowKit trên WSL2 nối Google Flow; điều khiển ngầm Zalo, Telegram, CapCut, GPMLogin, Ezviz bằng UIA, AutoHotkey v2, Win32.',
    ],
    metrics: [
      { label: 'QA gates', value: '7 (G0→G6)' },
      { label: 'Worker agents', value: 'Codex · Gemini/agy · 6 local/remote models · Muse AI' },
      { label: 'Browser control', value: 'Real Chrome via CDP + MV3' },
      { label: 'Desktop control', value: 'UIA · AutoHotkey v2 · Win32' },
    ],
    proofOfWork:
      'I run my own CEO multi-agent framework daily: a Claude "CEO" agent plans work and dispatches it in parallel to Codex CLI (multi-account), Gemini/Antigravity CLI and local models (Qwen, Gemma, GPT-OSS via Ollama/AICoworker). Every task passes a 7-gate QA pipeline (G0→G6) — preconditions, headless background execution, independent acceptance scripts (ffprobe, SSIM, LUFS) and shared state via STATE.md plus a real-time task room. Agents drive a real Chrome over CDP / chrome-devtools MCP and an MV3 extension (no Cloudflare blocks), and control Windows apps through UI Automation, AutoHotkey v2 and Win32.',
    demoAsset: 'Live task room: CEO agent splits a task → 3 workers run in parallel → G0–G6 gate log turns green.',
    reusableModules: [
      'CEO planner + parallel dispatcher (call-agent.mjs)',
      'Real-time task room (task-room.mjs) + STATE.md sync',
      '7-Gate QA runner (G0→G6)',
      'Chrome CDP / MCP connector (--autoConnect, chrome-relay)',
      'MV3 extension bridge',
      'Windows UIA / AutoHotkey v2 / Win32 driver',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở task-room (cửa sổ chat thời gian thực) và STATE.md cạnh nhau.',
        sayEn: 'This is the multi-agent system I use every day. One CEO agent plans, and several AI workers execute in parallel — let me show you a live task.',
        sayVi: 'Đây là hệ thống đa tác tử tôi dùng hằng ngày. Một agent CEO lập kế hoạch, nhiều AI worker thực thi song song — để tôi cho bạn xem 1 task thật.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Giao 1 task mẫu; chỉ vào các worker Codex / Gemini / Qwen nhận việc song song; mở cửa sổ Chrome thật đang được điều khiển qua CDP.',
        sayEn: 'The CEO splits the job and dispatches Codex, Gemini and a local model at the same time. This agent drives a real Chrome over the DevTools Protocol, so sites with Cloudflare treat it like a normal user.',
        sayVi: 'CEO chia việc và giao đồng thời cho Codex, Gemini và một model local. Agent này điều khiển Chrome thật qua DevTools Protocol nên các site có Cloudflare coi nó như người dùng bình thường.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Mở log 7 cổng G0→G6 chuyển xanh; chỉ vào bước nghiệm thu độc lập.',
        sayEn: 'Nothing is marked done until it passes seven QA gates, G0 to G6, including an independent acceptance script. That is how I keep autonomous agents reliable.',
        sayVi: 'Không việc gì được đánh dấu xong nếu chưa qua 7 cổng QA từ G0 tới G6, gồm script nghiệm thu độc lập. Đó là cách tôi giữ agent tự hành luôn tin cậy.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'I can wire your workflow into this same orchestration layer and show you the first agent running end to end in milestone one.',
        sayVi: 'Tôi có thể nối workflow của bạn vào chính lớp điều phối này và cho bạn xem agent đầu tiên chạy trọn vẹn ở milestone 1.',
      },
    ],
  },

  // ── P5 ─────────────────────────────────────────────────────
  {
    id: 'local-tts-comfyui',
    code: 'P5',
    name: 'Local TTS / Voice Cloning & ComfyUI Image Workflows',
    shortName: 'Local TTS & ComfyUI',
    niches: ['localai'],
    taglineEn: 'Self-hosted TTS/voice-cloning APIs and custom ComfyUI workflows (face swap, text removal, BiRefNet batch cut-outs, A4 300-DPI layout).',
    summaryVi:
      'API cục bộ cho CIT Voice Studio, OmniVoice, Voicebox (Qwen CustomVoice instruct), VoiceStudio, Qwen3-TTS, viF5TTS, Fish Speech, ElevenLabs; ComfyUI face-swap 2 đầu vào (BFS Qwen Image 2.1 LoRA), xóa chữ, tách nền BiRefNet/rembg, dàn trang CCCD/GPLX A4 300 DPI offline.',
    stack: ['ComfyUI', 'Python', 'BiRefNet', 'rembg', 'Qwen Image 2.1 LoRA', 'VieNeu-TTS', 'Qwen3-TTS', 'F5-TTS', 'Fish Speech', 'ElevenLabs'],
    keywords: ['comfyui', 'stablediffusion', 'faceswap', 'bgremoval', 'tts', 'python', 'gpuserver', 'ocr', 'vision', 'api', 'queue', 'nvenc', 'ollama', 'affiliate'],
    highlightsVi: [
      'Tích hợp API cục bộ: CIT Voice Studio (VieNeu-TTS-v3-Turbo), OmniVoice Studio, Voicebox (Qwen CustomVoice + instruct), VoiceStudio, Qwen3-TTS, viF5TTS, Fish Speech, ElevenLabs.',
      'Đọc văn bản dài, chia cụm câu thông minh không đứt hơi, chuẩn hóa âm lượng đồng đều.',
      'ComfyUI face-swap 2 đầu vào (BFS Qwen Image 2.1 Face-Swap LoRA).',
      'Xóa chữ giữ nguyên độ nét ảnh món ăn/sản phẩm; tách nền hàng loạt BiRefNet, rembg.',
      'Dàn trang CCCD/GPLX lên A4 chuẩn 300 DPI, chạy offline bảo mật tuyệt đối.',
    ],
    metrics: [
      { label: 'TTS engines integrated', value: '8' },
      { label: 'Face-swap', value: '2-input BFS Qwen Image 2.1 LoRA' },
      { label: 'Cut-outs', value: 'BiRefNet / rembg batch' },
      { label: 'Print layout', value: 'A4 @ 300 DPI, fully offline' },
    ],
    proofOfWork:
      'I self-host and integrate local voice and image AI behind clean APIs: 8 TTS / voice-cloning engines (VieNeu-TTS-v3-Turbo, OmniVoice, Voicebox with Qwen CustomVoice "instruct" prosody control, Qwen3-TTS, F5-TTS, Fish Speech, VoiceStudio and ElevenLabs as fallback) with smart sentence chunking for long-form reads that never cut mid-breath, plus level-matched output. On the image side I built custom ComfyUI workflows: 2-input face swap (BFS Qwen Image 2.1 Face-Swap LoRA), text removal that preserves food/product sharpness, high-quality batch background removal (BiRefNet, rembg) and offline A4 300-DPI document layout.',
    demoAsset: 'ComfyUI graph → batch of 20 product cut-outs + face-swap before/after; TTS long-form sample with cloned voice.',
    reusableModules: [
      'ComfyUI API runner (queue + websocket progress)',
      '2-input face-swap workflow (Qwen Image 2.1 LoRA)',
      'BiRefNet / rembg batch cut-out service',
      'Text-removal workflow (sharpness-preserving)',
      'Unified TTS gateway (8 engines) with smart chunking',
      'A4 300-DPI layout generator',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở ComfyUI với graph face-swap 2 đầu vào đã nạp sẵn.',
        sayEn: 'Everything you are about to see runs locally on my GPU — no per-image API costs and no data leaving the machine.',
        sayVi: 'Mọi thứ bạn sắp thấy đều chạy cục bộ trên GPU của tôi — không tốn phí API mỗi ảnh và dữ liệu không rời khỏi máy.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Bấm Queue Prompt cho face-swap; sau đó chạy batch tách nền BiRefNet trên thư mục 20 ảnh sản phẩm, mở thư mục kết quả PNG trong suốt.',
        sayEn: 'Here is a two-input face swap built on a Qwen Image LoRA, and here twenty product photos get clean BiRefNet cut-outs in one batch — edges like hair and glass stay crisp.',
        sayVi: 'Đây là face-swap 2 đầu vào dựa trên LoRA Qwen Image, còn đây 20 ảnh sản phẩm được tách nền BiRefNet sạch trong 1 lượt — chi tiết tóc, kính vẫn sắc nét.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Mở TTS gateway, dán đoạn văn dài, chọn giọng clone, phát file audio.',
        sayEn: 'And this is my TTS gateway: one API in front of eight engines. Long text is chunked at natural breath points and levels are matched, so it sounds like one continuous take.',
        sayVi: 'Đây là TTS gateway: 1 API đứng trước 8 engine. Văn bản dài được chia ở điểm ngắt hơi tự nhiên và cân bằng âm lượng, nghe như một lần đọc liền mạch.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'Send me five of your sample images or a script and I will run them through this exact setup so you can judge the quality first.',
        sayVi: 'Gửi tôi 5 ảnh mẫu hoặc 1 kịch bản, tôi chạy qua đúng hệ thống này để bạn đánh giá chất lượng trước.',
      },
    ],
  },

  // ── P6 ─────────────────────────────────────────────────────
  {
    id: 'van-phong-3d',
    code: 'P6',
    name: 'VanPhong3D — 3D AI Agents Office, Blender MCP & Game Modding / Reverse Engineering',
    shortName: 'VanPhong3D',
    localPath: 'VanPhong3D',
    github: 'dungcao2112-web/van-phong-3d-ai',
    niches: ['3d', 'agents'],
    taglineEn: 'Three.js 3D office visualizing live AI-agent activity, Blender-automated 17-bone rigs and a stride-locked walk controller.',
    summaryVi:
      'Văn phòng 3D Three.js/WebGL + Python backend mô phỏng AI Agent & giám sát phần cứng; Blender Python/MCP gắn xương 17 bone cho 5 nhân vật .glb; character3d.js Stride-Locked Walk + Procedural Skeleton Post-Fixer; Cờ Tỷ Phú multiplayer; reverse engineering MCP rea; mod Witcher 3, Ren\'Py.',
    stack: ['Three.js', 'WebGL', 'Python', 'Blender Python API', 'Blender MCP', 'Node.js', 'WebSocket'],
    keywords: ['threejs', 'blender', 'glb', 'rigging', 'avatar', 'gamedev', 'reverse', 'electron', 'python', 'nodejs', 'multiagent', 'react', 'dashboard', 'canvas'],
    highlightsVi: [
      'Văn phòng 3D trên trình duyệt (Three.js/WebGL + Python) mô phỏng thời gian thực trạng thái AI Agent & giám sát VRAM RTX 5070 Ti, CPU, RAM.',
      'Blender Python API & MCP: gắn xương Humanoid 17 bone cho 5 nhân vật .glb.',
      'character3d.js: Stride-Locked Walk Cycle chống trượt chân, Procedural Skeleton Post-Fixer khi đi/ngồi/chuyển hướng.',
      'Game Cờ Tỷ Phú multiplayer Web/Node.js.',
      'Dịch ngược app với MCP rea (JS/Electron/Native bundle); mod The Witcher 3 (WitcherScript/REDengine), Ren\'Py.',
    ],
    metrics: [
      { label: 'Rig', value: '17-bone humanoid × 5 characters' },
      { label: 'Locomotion', value: 'Stride-locked walk (no foot sliding)' },
      { label: 'Telemetry', value: 'Live VRAM / CPU / RAM' },
      { label: 'Engine', value: 'Three.js / WebGL + Python' },
    ],
    proofOfWork:
      'I built VanPhong3D, a browser-based 3D office (Three.js/WebGL + Python backend) where animated avatars mirror what my AI agents are doing in real time, alongside live GPU VRAM/CPU/RAM telemetry. I automated Blender through its Python API and Blender MCP to rig five .glb characters with a standard 17-bone humanoid skeleton, and wrote character3d.js — a stride-locked walk cycle that eliminates foot sliding when speed changes, plus a procedural skeleton post-fixer for smooth walking, sitting and turning. I also reverse-engineer Electron/JS/native bundles (rea MCP) and have shipped a multiplayer Node.js board game and Witcher 3 / Ren\'Py mods.',
    demoAsset: 'Live 3D office: agents walk to desks when tasks start; toggle wireframe to show the 17-bone rig and stride lock.',
    reusableModules: [
      'Three.js scene + GLB loader/instancing',
      'character3d.js stride-locked locomotion',
      'Procedural skeleton post-fixer',
      'Blender Python auto-rig script (17-bone)',
      'WebSocket agent-state bridge',
      'Electron/asar bundle analysis toolkit (rea MCP)',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở VanPhong3D trên Chrome, góc camera nhìn toàn văn phòng 3D, các avatar đang ngồi.',
        sayEn: 'This is a live 3D office I built in Three.js — each avatar is an AI agent, and they move based on what the agents are actually doing.',
        sayVi: 'Đây là văn phòng 3D tôi dựng bằng Three.js — mỗi avatar là 1 AI agent và chúng di chuyển theo việc agent đang làm thật.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Kích hoạt 1 task để avatar đứng dậy đi tới bàn; zoom vào chân; tăng/giảm tốc độ đi để thấy không trượt chân.',
        sayEn: 'Watch the feet: when I change walking speed there is zero foot sliding, because my controller locks the stride to ground distance. The rigs were generated automatically in Blender with Python.',
        sayVi: 'Nhìn vào chân: khi đổi tốc độ đi hoàn toàn không trượt, vì bộ điều khiển khóa sải chân theo quãng đường thực. Bộ xương được tạo tự động trong Blender bằng Python.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Bật chế độ hiển thị xương (17 bone), mở bảng telemetry VRAM/CPU/RAM; mở nhanh script Blender auto-rig.',
        sayEn: 'Here is the 17-bone skeleton and the live hardware panel. The Blender script rigs all five characters in one run, so new models are production-ready in minutes.',
        sayVi: 'Đây là bộ xương 17 bone và bảng phần cứng thời gian thực. Script Blender gắn xương cả 5 nhân vật trong 1 lần chạy, model mới sẵn sàng trong vài phút.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'I can bring your models into this exact pipeline and show them walking in your scene in the first milestone.',
        sayVi: 'Tôi có thể đưa model của bạn vào đúng pipeline này và cho bạn xem chúng đi lại trong scene của bạn ngay milestone đầu.',
      },
    ],
  },

  // ── P7 ─────────────────────────────────────────────────────
  {
    id: 'ecom-ota-social',
    code: 'P7',
    name: 'E-Commerce / Shopee Affiliate (Me Sam Shop), Hotel OTA Ops (The L\'anmien Saigon) & Social Intelligence',
    shortName: 'OTA · Affiliate · Social Intel',
    niches: ['ota', 'agents'],
    taglineEn: 'Hotel channel-manager automation (Channex / Bluejay → Booking.com, Agoda, Trip.com, Expedia), Shopee-affiliate web app and social intelligence tools.',
    summaryVi:
      'Web App giỏ đồ đi sinh (React/Vite/Tailwind) + Excel/CSV + link Shopee Affiliate; tự động hóa OTA khách sạn qua Bluejay PMS / Channex (Booking, Agoda, Trip.com, Expedia): đối chiếu giá Net/Gross, giá hiển thị, đóng/mở phòng, chính sách hủy; quét tab Facebook/Reels sinh bình luận; yt-dlp + ffmpeg + AI Vision; AI Quota Tracker & Pulse Neo.',
    stack: ['React', 'Vite', 'Tailwind', 'Channex API', 'Bluejay PMS', 'Chrome CDP', 'yt-dlp', 'FFmpeg', 'AI Vision', 'Excel/CSV'],
    keywords: ['channex', 'ota', 'rateparity', 'hotel', 'affiliate', 'excel', 'social', 'react', 'dashboard', 'cdp', 'playwright', 'api', 'vision', 'electron', 'antibot'],
    highlightsVi: [
      'Me Sam Shop: tính giỏ đồ đi sinh (React + Vite + Tailwind), xuất/nhập Excel/CSV, tự gắn link Shopee Affiliate, kho ảnh không nền.',
      'OTA khách sạn The L\'anmien Saigon: Bluejay PMS / Channex ↔ Booking.com, Agoda, Trip.com, Expedia — đối chiếu Net/Gross, giá hiển thị phía khách, đóng/mở phòng, chính sách hoàn hủy.',
      'Quét hàng loạt tab Facebook/Reels sinh bình luận tự nhiên theo nhân xưng thương hiệu.',
      'Phân tích kênh đối thủ bằng yt-dlp + ffmpeg + AI Vision.',
      'Desktop App AI Quota Tracker & Pulse Neo.',
    ],
    metrics: [
      { label: 'OTAs reconciled', value: 'Booking.com · Agoda · Trip.com · Expedia' },
      { label: 'Checks', value: 'Net/Gross · guest-facing price · open/close · cancellation' },
      { label: 'Affiliate', value: 'Auto Shopee links + Excel/CSV' },
      { label: 'Social intel', value: 'yt-dlp + ffmpeg + AI Vision' },
    ],
    proofOfWork:
      'I automate live hotel distribution for The L\'anmien Saigon: Bluejay PMS / Channex connected to 4 OTAs (Booking.com, Agoda, Trip.com and Expedia), with scripts that cross-check Net vs Gross rates, verify the price a guest actually sees on each OTA, open/close rooms and reconcile cancellation policies — catching parity breaks before they cost bookings. I also built Me Sam Shop, a React + Vite + Tailwind affiliate web app with Excel/CSV import/export and automatic Shopee affiliate links, plus social-intelligence tools (yt-dlp + ffmpeg + AI Vision competitor analysis) and desktop monitors (AI Quota Tracker, Pulse Neo).',
    demoAsset: 'Parity report: same room/date across 4 OTAs, mismatches highlighted red; Me Sam Shop cart with affiliate links.',
    reusableModules: [
      'Channex API client (rates, availability, restrictions)',
      'Guest-facing price checker (real Chrome CDP)',
      'Net/Gross & cancellation-policy reconciler',
      'Excel/CSV import-export layer',
      'Shopee affiliate link generator',
      'yt-dlp + AI Vision competitor analyzer',
    ],
    loomScript: [
      {
        start: '0:00', end: '0:15',
        actionVi: 'Mở báo cáo parity dạng bảng (4 OTA × các ngày), có ô đỏ lệch giá.',
        sayEn: 'This is a rate-parity report I run for a real hotel in Saigon — same room, same dates, four OTAs, and the red cells are mismatches it caught automatically.',
        sayVi: 'Đây là báo cáo đồng nhất giá tôi chạy cho một khách sạn thật ở Sài Gòn — cùng phòng, cùng ngày, 4 OTA, ô đỏ là chỗ lệch được bắt tự động.',
      },
      {
        start: '0:15', end: '0:45',
        actionVi: 'Chạy script: mở Chrome thật xem giá hiển thị phía khách trên Booking.com/Agoda; mở song song dữ liệu Channex API.',
        sayEn: 'It pulls rates from the channel manager API, then opens a real browser to read the price a guest actually sees — taxes, Net versus Gross, promotions — and compares them.',
        sayVi: 'Nó lấy giá từ API channel manager, rồi mở trình duyệt thật đọc giá khách thực sự thấy — thuế, Net so với Gross, khuyến mãi — và so sánh.',
      },
      {
        start: '0:45', end: '1:15',
        actionVi: 'Chỉ vào cột chính sách hoàn hủy bị lệch và nút đóng/mở phòng; xuất file Excel.',
        sayEn: 'It also checks cancellation policies and can close or open rooms, then exports everything to Excel for the revenue team.',
        sayVi: 'Nó còn kiểm tra chính sách hoàn hủy, có thể đóng/mở phòng, rồi xuất toàn bộ ra Excel cho đội revenue.',
      },
      {
        start: '1:15', end: '1:30',
        actionVi: 'Quay lại camera, chốt.',
        sayEn: 'Give me read access to one property and I will run this parity check on your data before we even start the contract.',
        sayVi: 'Cho tôi quyền đọc 1 khách sạn, tôi sẽ chạy kiểm tra parity trên dữ liệu của bạn trước cả khi bắt đầu hợp đồng.',
      },
    ],
  },
];

export const PROJECT_BY_ID: Record<string, PortfolioProject> = Object.fromEntries(
  PORTFOLIO_PROJECTS.map((p) => [p.id, p]),
);
