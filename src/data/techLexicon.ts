import type { TechTerm } from '../types';

/**
 * Technology lexicon used by the JD analyzer.
 * aliases: lowercase phrases matched on word boundaries.
 * dungHas=false marks stacks outside Dũng's proven work (they lower Stack Alignment).
 */
export const TECH_LEXICON: TechTerm[] = [
  // ── Programmatic video / media ─────────────────────────────
  { id: 'remotion', label: 'Remotion', aliases: ['remotion'], niches: ['video'], difficulty: 4, dungHas: true, implies: ['react', 'ffmpeg', 'nodejs'] },
  { id: 'ffmpeg', label: 'FFmpeg', aliases: ['ffmpeg', 'ffprobe', 'libx264'], niches: ['video'], difficulty: 3, dungHas: true },
  { id: 'nvenc', label: 'NVIDIA NVENC / CUDA', aliases: ['nvenc', 'h264_nvenc', 'hevc_nvenc', 'cuda', 'gpu render', 'gpu rendering', 'gpu acceleration', 'gpu-accelerated', 'hardware encoding', 'rtx'], niches: ['video', 'localai'], difficulty: 4, dungHas: true },
  { id: 'whisper', label: 'Whisper / Faster-Whisper', aliases: ['whisper', 'faster-whisper', 'whisperx', 'speech to text', 'speech-to-text', 'transcription', 'transcribe', 'stt'], niches: ['video', 'localai'], difficulty: 3, dungHas: true, implies: ['nvenc', 'python'] },
  { id: 'captions', label: 'Animated Captions / Subtitles', aliases: ['captions', 'caption', 'subtitles', 'subtitle', 'karaoke', 'srt', 'word-level timestamps', 'burned-in'], niches: ['video'], difficulty: 3, dungHas: true, implies: ['whisper'] },
  { id: 'shortform', label: 'TikTok / Reels / Shorts', aliases: ['tiktok', 'reels', 'shorts', 'youtube shorts', 'instagram reels', 'faceless', 'short-form', 'short form', 'vertical video', '9:16'], niches: ['video'], difficulty: 2, dungHas: true },
  { id: 'youtube', label: 'YouTube automation', aliases: ['youtube', 'yt channel', 'youtube channel', 'youtube api'], niches: ['video'], difficulty: 2, dungHas: true },
  { id: 'videoeditor', label: 'Browser video editor / timeline', aliases: ['video editor', 'video editing app', 'timeline editor', 'video timeline', 'multi-track', 'multitrack', 'capcut', 'premiere', 'non-linear editor', 'nle', 'keyframe', 'keyframes'], niches: ['video'], difficulty: 4, dungHas: true, implies: ['react', 'ffmpeg', 'canvas'] },
  { id: 'motion', label: 'Motion graphics (GSAP / Lottie)', aliases: ['motion graphics', 'gsap', 'lottie', 'after effects', 'animated chart', 'animated charts', 'kinetic typography', 'ken burns'], niches: ['video'], difficulty: 3, dungHas: true },
  { id: 'loudness', label: 'Audio loudness (EBU R128)', aliases: ['loudness', 'lufs', 'ebu r128', 'loudnorm', 'audio normalization', 'normalize audio', 'audio levels'], niches: ['video'], difficulty: 3, dungHas: true },
  { id: 'silence', label: 'Silence / filler removal', aliases: ['silence removal', 'remove silences', 'cut silences', 'jump cut', 'jump cuts', 'filler words', 'dead air'], niches: ['video'], difficulty: 3, dungHas: true, implies: ['whisper', 'ffmpeg'] },
  { id: 'videoqa', label: 'Video QA metrics (SSIM / MAD)', aliases: ['ssim', 'vmaf', 'psnr', 'quality metrics', 'scene detection', 'shot detection'], niches: ['video'], difficulty: 4, dungHas: true },
  { id: 'canvas', label: 'Canvas / WebCodecs', aliases: ['canvas', 'webcodecs', 'webgl canvas', 'ffmpeg.wasm', 'wasm'], niches: ['video', '3d'], difficulty: 4, dungHas: true },

  // ── Agents / automation ────────────────────────────────────
  { id: 'mcp', label: 'MCP (Model Context Protocol)', aliases: ['mcp', 'model context protocol', 'mcp server', 'mcp servers'], niches: ['agents'], difficulty: 4, dungHas: true, implies: ['nodejs', 'llm'] },
  { id: 'cdp', label: 'Chrome DevTools Protocol', aliases: ['cdp', 'chrome devtools protocol', 'devtools protocol', 'chrome-devtools', 'real chrome', 'chrome extension', 'mv3', 'manifest v3'], niches: ['agents'], difficulty: 4, dungHas: true },
  { id: 'playwright', label: 'Playwright / Puppeteer / Selenium', aliases: ['playwright', 'puppeteer', 'selenium', 'headless', 'headless browser', 'browser automation', 'web automation', 'scraping', 'scraper', 'web scraping', 'crawler'], niches: ['agents'], difficulty: 3, dungHas: true, implies: ['cdp'] },
  { id: 'antibot', label: 'Anti-bot / Cloudflare handling', aliases: ['cloudflare', 'captcha', 'recaptcha', 'anti-bot', 'antibot', 'bot detection', 'fingerprint', 'fingerprinting', 'blocked'], niches: ['agents'], difficulty: 5, dungHas: true, implies: ['cdp'] },
  { id: 'claude', label: 'Claude API / Claude Code', aliases: ['claude', 'claude code', 'anthropic', 'sonnet', 'opus'], niches: ['agents'], difficulty: 3, dungHas: true, implies: ['llm'] },
  { id: 'openai', label: 'OpenAI API / Codex', aliases: ['openai', 'gpt-4', 'gpt-4o', 'gpt-5', 'chatgpt', 'codex', 'codex cli'], niches: ['agents'], difficulty: 2, dungHas: true, implies: ['llm'] },
  { id: 'gemini', label: 'Gemini / Antigravity', aliases: ['gemini', 'antigravity', 'vertex ai'], niches: ['agents'], difficulty: 2, dungHas: true, implies: ['llm'] },
  { id: 'llm', label: 'LLM integration', aliases: ['llm', 'llms', 'large language model', 'gpt', 'prompt engineering', 'function calling', 'tool calling', 'tool use'], niches: ['agents'], difficulty: 3, dungHas: true },
  { id: 'multiagent', label: 'Multi-agent orchestration', aliases: ['multi-agent', 'multi agent', 'multiagent', 'agent orchestration', 'orchestrator', 'orchestration', 'autonomous agent', 'autonomous agents', 'ai agent', 'ai agents', 'agentic', 'crewai', 'autogen', 'langgraph'], niches: ['agents'], difficulty: 5, dungHas: true, implies: ['llm', 'nodejs'] },
  { id: 'langchain', label: 'LangChain / RAG', aliases: ['langchain', 'llamaindex', 'rag', 'retrieval augmented', 'vector database', 'embeddings', 'pinecone'], niches: ['agents'], difficulty: 3, dungHas: true },
  { id: 'ollama', label: 'Local LLM (Ollama)', aliases: ['ollama', 'local llm', 'local llms', 'llama.cpp', 'lm studio', 'self-hosted llm', 'qwen', 'gemma', 'gpt-oss'], niches: ['agents', 'localai'], difficulty: 3, dungHas: true },
  { id: 'desktop', label: 'Windows desktop automation (UIA / AHK / Win32)', aliases: ['desktop automation', 'ui automation', 'uia', 'autohotkey', 'ahk', 'win32', 'pywinauto', 'rpa', 'windows automation', 'desktop app automation'], niches: ['agents'], difficulty: 4, dungHas: true },
  { id: 'n8n', label: 'n8n / Make / Zapier', aliases: ['n8n', 'make.com', 'zapier', 'integromat', 'workflow automation'], niches: ['agents'], difficulty: 2, dungHas: true },
  { id: 'qa', label: 'Automated QA / test gates', aliases: ['automated tests', 'unit tests', 'test coverage', 'qa', 'quality assurance', 'acceptance tests', 'ci/cd', 'vitest', 'pytest', 'jest'], niches: ['agents', 'video'], difficulty: 2, dungHas: true },
  { id: 'telegram', label: 'Telegram / Zalo / chat bots', aliases: ['telegram bot', 'telegram', 'zalo', 'discord bot', 'slack bot', 'whatsapp api'], niches: ['agents'], difficulty: 2, dungHas: true },

  // ── Local AI / Image / Voice ───────────────────────────────
  { id: 'comfyui', label: 'ComfyUI workflows', aliases: ['comfyui', 'comfy ui', 'comfy workflow', 'custom nodes'], niches: ['localai'], difficulty: 4, dungHas: true, implies: ['python', 'nvenc'] },
  { id: 'stablediffusion', label: 'Stable Diffusion / Flux / LoRA', aliases: ['stable diffusion', 'sdxl', 'flux', 'lora', 'controlnet', 'inpainting', 'img2img', 'qwen image', 'diffusion'], niches: ['localai'], difficulty: 4, dungHas: true, implies: ['comfyui'] },
  { id: 'faceswap', label: 'Face swap', aliases: ['face swap', 'face-swap', 'faceswap', 'face replacement', 'reactor', 'insightface', 'ip-adapter', 'instantid'], niches: ['localai'], difficulty: 4, dungHas: true, implies: ['comfyui'] },
  { id: 'bgremoval', label: 'Background removal (BiRefNet / rembg)', aliases: ['background removal', 'remove background', 'remove the background', 'bg removal', 'birefnet', 'rembg', 'cutout', 'transparent background', 'alpha matte'], niches: ['localai'], difficulty: 3, dungHas: true },
  { id: 'tts', label: 'TTS / Voice cloning', aliases: ['tts', 'text to speech', 'text-to-speech', 'voice cloning', 'voice clone', 'cloned voice', 'voiceover', 'voice over', 'elevenlabs', 'fish speech', 'f5-tts', 'xtts', 'coqui', 'qwen3-tts', 'synthetic voice'], niches: ['localai', 'video'], difficulty: 4, dungHas: true },
  { id: 'python', label: 'Python', aliases: ['python', 'fastapi', 'flask', 'django', 'pydantic'], niches: ['localai', 'agents'], difficulty: 2, dungHas: true },
  { id: 'gpuserver', label: 'Self-hosted GPU inference', aliases: ['self-hosted', 'on-prem', 'on premise', 'runpod', 'local gpu', 'gpu server', 'vram', 'inference server', 'offline'], niches: ['localai'], difficulty: 4, dungHas: true },
  { id: 'ocr', label: 'Document layout / OCR', aliases: ['ocr', 'id card', 'passport', 'document scan', 'a4 layout', '300 dpi', 'print layout'], niches: ['localai'], difficulty: 3, dungHas: true },
  { id: 'vision', label: 'AI Vision analysis', aliases: ['computer vision', 'ai vision', 'opencv', 'yolo', 'image classification', 'object detection', 'vision model'], niches: ['localai', 'video'], difficulty: 4, dungHas: true },

  // ── 3D / Blender ───────────────────────────────────────────
  { id: 'threejs', label: 'Three.js / WebGL', aliases: ['three.js', 'threejs', 'three js', 'webgl', 'react three fiber', 'r3f', 'babylon.js', 'webgpu'], niches: ['3d'], difficulty: 4, dungHas: true, implies: ['react'] },
  { id: 'blender', label: 'Blender Python / MCP', aliases: ['blender', 'bpy', 'blender python', 'blender mcp'], niches: ['3d'], difficulty: 4, dungHas: true },
  { id: 'glb', label: 'GLB / glTF assets', aliases: ['glb', 'gltf', '.glb', 'fbx', '3d model', '3d models', '3d assets', 'mixamo'], niches: ['3d'], difficulty: 3, dungHas: true },
  { id: 'rigging', label: 'Rigging & animation', aliases: ['rigging', 'rigged', 'rig', 'skeleton', 'bones', 'skinning', 'walk cycle', 'animation retargeting', 'retargeting', 'inverse kinematics', 'ik'], niches: ['3d'], difficulty: 5, dungHas: true, implies: ['blender', 'glb'] },
  { id: 'avatar', label: '3D avatars / virtual office', aliases: ['avatar', 'avatars', '3d avatar', 'virtual office', 'metaverse', '3d office', 'digital human', 'npc'], niches: ['3d'], difficulty: 4, dungHas: true, implies: ['threejs', 'glb'] },
  { id: 'gamedev', label: 'Game dev / modding', aliases: ['game', 'multiplayer', 'modding', 'mod', 'witcher', "ren'py", 'renpy', 'socket.io', 'websocket', 'websockets'], niches: ['3d'], difficulty: 3, dungHas: true },
  { id: 'reverse', label: 'Reverse engineering', aliases: ['reverse engineer', 'reverse engineering', 'reverse-engineer', 'decompile', 'deobfuscate', 'asar', 'electron app', 'bundle analysis', 'undocumented api', 'private api'], niches: ['3d', 'agents'], difficulty: 5, dungHas: true, implies: ['electron', 'nodejs'] },
  { id: 'electron', label: 'Electron / desktop apps', aliases: ['electron', 'tauri', 'desktop app', 'desktop application'], niches: ['agents', '3d'], difficulty: 3, dungHas: true },

  // ── OTA / E-commerce ───────────────────────────────────────
  { id: 'channex', label: 'Channex / Channel manager', aliases: ['channex', 'channel manager', 'siteminder', 'cloudbeds', 'bluejay', 'pms', 'property management system'], niches: ['ota'], difficulty: 4, dungHas: true },
  { id: 'ota', label: 'OTA (Booking.com / Agoda / Expedia / Trip.com)', aliases: ['booking.com', 'agoda', 'expedia', 'trip.com', 'airbnb', 'ota', 'otas', 'online travel agency', 'extranet'], niches: ['ota'], difficulty: 3, dungHas: true },
  { id: 'rateparity', label: 'Rate parity / revenue ops', aliases: ['rate parity', 'parity', 'net rate', 'gross rate', 'rate plan', 'rate plans', 'room availability', 'inventory sync', 'overbooking', 'cancellation policy', 'revenue management'], niches: ['ota'], difficulty: 4, dungHas: true, implies: ['playwright', 'cdp'] },
  { id: 'hotel', label: 'Hotel / hospitality ops', aliases: ['hotel', 'hotels', 'hospitality', 'rooms', 'reservations', 'booking engine'], niches: ['ota'], difficulty: 2, dungHas: true },
  { id: 'affiliate', label: 'Affiliate / Shopee / e-commerce', aliases: ['affiliate', 'shopee', 'lazada', 'amazon affiliate', 'e-commerce', 'ecommerce', 'product catalog', 'cart'], niches: ['ota'], difficulty: 2, dungHas: true },
  { id: 'excel', label: 'Excel / CSV / Sheets', aliases: ['excel', 'csv', 'google sheets', 'spreadsheet', 'xlsx'], niches: ['ota'], difficulty: 1, dungHas: true },
  { id: 'social', label: 'Social media automation', aliases: ['facebook', 'instagram', 'social media', 'auto comment', 'comment bot', 'yt-dlp', 'competitor analysis'], niches: ['ota', 'agents'], difficulty: 2, dungHas: true },
  { id: 'dashboard', label: 'Dashboard / Admin UI', aliases: ['dashboard', 'admin panel', 'analytics dashboard', 'web dashboard'], niches: ['ota', 'agents'], difficulty: 2, dungHas: true, implies: ['react'] },

  // ── Web foundations ────────────────────────────────────────
  { id: 'react', label: 'React / TypeScript', aliases: ['react', 'reactjs', 'react.js', 'typescript', 'next.js', 'nextjs', 'vite', 'tailwind'], niches: ['video', '3d', 'ota', 'agents'], difficulty: 2, dungHas: true },
  { id: 'nodejs', label: 'Node.js / Express', aliases: ['node.js', 'nodejs', 'node', 'express', 'nestjs'], niches: ['agents', 'video'], difficulty: 2, dungHas: true },
  { id: 'docker', label: 'Docker / Linux / WSL2', aliases: ['docker', 'wsl', 'wsl2', 'linux', 'kubernetes', 'aws', 'gcp'], niches: ['agents', 'localai'], difficulty: 2, dungHas: true },
  { id: 'api', label: 'REST / Webhooks', aliases: ['rest api', 'restful', 'webhook', 'webhooks', 'graphql', 'api integration'], niches: ['agents', 'ota'], difficulty: 2, dungHas: true },
  { id: 'database', label: 'Database (Postgres / SQLite / Supabase)', aliases: ['postgres', 'postgresql', 'sqlite', 'supabase', 'mongodb', 'firebase', 'redis', 'mysql'], niches: ['agents', 'ota'], difficulty: 2, dungHas: true },
  { id: 'queue', label: 'Job queue / batch processing', aliases: ['queue', 'job queue', 'bullmq', 'celery', 'batch processing', 'bulk', 'parallel', 'concurrency', 'worker'], niches: ['video', 'localai', 'agents'], difficulty: 3, dungHas: true },

  // ── Out of scope (lower alignment) ─────────────────────────
  { id: 'wordpress', label: 'WordPress / Wix / Webflow', aliases: ['wordpress', 'wix', 'webflow', 'squarespace', 'elementor', 'woocommerce'], niches: [], difficulty: 1, dungHas: false },
  { id: 'php', label: 'PHP / Laravel', aliases: ['php', 'laravel', 'symfony'], niches: [], difficulty: 2, dungHas: false },
  { id: 'mobile', label: 'Native mobile (Swift / Kotlin / Flutter)', aliases: ['swift', 'kotlin', 'flutter', 'react native', 'ios app', 'android app', 'swiftui'], niches: [], difficulty: 3, dungHas: false },
  { id: 'unity', label: 'Unity / Unreal (C#/C++)', aliases: ['unity', 'unity3d', 'unreal', 'unreal engine', 'c#'], niches: [], difficulty: 4, dungHas: false },
  { id: 'salesforce', label: 'Salesforce / SAP / ERP', aliases: ['salesforce', 'sap', 'dynamics 365', 'netsuite', 'odoo'], niches: [], difficulty: 3, dungHas: false },
  { id: 'blockchain', label: 'Blockchain / Solidity', aliases: ['solidity', 'smart contract', 'smart contracts', 'web3', 'blockchain', 'nft'], niches: [], difficulty: 4, dungHas: false },
  { id: 'dataentry', label: 'Data entry / VA tasks', aliases: ['data entry', 'virtual assistant', 'copy paste', 'copy-paste', 'cold calling'], niches: [], difficulty: 1, dungHas: false },
];

export const LEXICON_BY_ID: Record<string, TechTerm> = Object.fromEntries(
  TECH_LEXICON.map((t) => [t.id, t]),
);
