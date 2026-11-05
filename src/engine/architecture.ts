import type { ArchitectureDiagram, ArchitectureStage, JobAnalysis, NicheId } from '../types';

interface StageTpl extends ArchitectureStage {
  /** include only when one of these lexicon ids is detected (empty = always) */
  when?: string[];
  /** include only when one of these ids is strongly present (in title or mentioned 2+ times) */
  whenStrong?: string[];
}

const PIPELINES: Record<NicheId, { title: string; stages: StageTpl[] }> = {
  video: {
    title: 'Automated Video Pipeline',
    stages: [
      { id: 'input', label: 'Script / Footage Input', detail: 'Sheet row · JSON · raw clips' },
      { id: 'tts', label: 'Voiceover (TTS)', detail: 'local TTS / ElevenLabs · chunked', when: ['tts'] },
      { id: 'asr', label: 'Faster-Whisper CUDA', detail: 'word timestamps + hallucination guard', when: ['whisper', 'captions', 'silence'] },
      { id: 'cut', label: 'AI Cut Planner', detail: 'silences · stutters → cut.json', when: ['silence', 'whisper', 'videoeditor'] },
      { id: 'editor', label: 'Timeline Editor UI', detail: 'React multi-track · 30fps canvas preview', whenStrong: ['videoeditor', 'canvas'] },
      { id: 'compose', label: 'Remotion Composition', detail: 'captions · b-roll · motion graphics' },
      { id: 'render', label: 'FFmpeg NVENC Render', detail: 'hybrid CPU+GPU · libx264 fallback' },
      { id: 'audio', label: 'EBU R128 2-pass', detail: 'loudnorm → -14 LUFS' },
      { id: 'qa', label: 'Automated QA', detail: 'ffprobe · SSIM · LUFS report' },
      { id: 'out', label: 'Delivery', detail: 'Drive / S3 / dashboard queue' },
    ],
  },
  agents: {
    title: 'Multi-Agent Automation Architecture',
    stages: [
      { id: 'trigger', label: 'Trigger / Ticket', detail: 'API · schedule · chat command' },
      { id: 'planner', label: 'CEO Planner Agent', detail: 'Claude · task graph · STATE.md' },
      { id: 'workers', label: 'Parallel Workers', detail: 'Codex · Gemini · local LLM (Ollama)', when: ['multiagent', 'openai', 'gemini', 'ollama'] },
      { id: 'mcp', label: 'MCP Tool Server', detail: 'typed tools · progress streaming', when: ['mcp', 'claude'] },
      { id: 'browser', label: 'Real Chrome via CDP', detail: 'logged-in profile · MV3 relay', when: ['cdp', 'playwright', 'antibot'] },
      { id: 'desktop', label: 'Desktop Driver', detail: 'UIA · AutoHotkey v2 · Win32', when: ['desktop', 'electron'] },
      { id: 'reverse', label: 'Bundle Analysis', detail: 'asar unpack · IPC/API trace', when: ['reverse'] },
      { id: 'gates', label: '7-Gate QA (G0→G6)', detail: 'independent acceptance scripts' },
      { id: 'dash', label: 'Live Dashboard / Task Room', detail: 'WebSocket status · logs · alerts' },
    ],
  },
  localai: {
    title: 'Self-Hosted AI Service Architecture',
    stages: [
      { id: 'client', label: 'Client App / API Call', detail: 'upload images · text' },
      { id: 'api', label: 'FastAPI Gateway', detail: 'auth · job queue · status polling' },
      { id: 'queue', label: 'GPU Job Queue', detail: 'serialized heavy graphs · VRAM guard' },
      { id: 'comfy', label: 'ComfyUI Workflows', detail: 'face swap · text removal', when: ['comfyui', 'faceswap', 'stablediffusion'] },
      { id: 'bg', label: 'BiRefNet / rembg', detail: 'batch cut-outs · alpha auto-crop', when: ['bgremoval'] },
      { id: 'tts', label: 'TTS Gateway', detail: 'voice clone · breath-aware chunking', when: ['tts'] },
      { id: 'post', label: 'Post-processing', detail: 'level matching · format export' },
      { id: 'store', label: 'Storage + Webhook', detail: 'local disk / S3 · callback' },
    ],
  },
  '3d': {
    title: '3D Web Scene Architecture',
    stages: [
      { id: 'assets', label: 'Source Models', detail: 'FBX / GLB from artists' },
      { id: 'blender', label: 'Blender Auto-Rig', detail: 'Python/MCP · 17-bone humanoid', when: ['blender', 'rigging', 'glb'] },
      { id: 'glb', label: 'Optimized GLB', detail: 'shared materials · compressed' },
      { id: 'scene', label: 'Three.js Scene', detail: 'instancing · LOD · lighting' },
      { id: 'loco', label: 'Locomotion Controller', detail: 'stride-locked walk · skeleton post-fix', when: ['rigging', 'avatar'] },
      { id: 'reverse', label: 'Legacy Bundle Analysis', detail: 'asar · IPC · private API map', when: ['reverse'] },
      { id: 'ws', label: 'WebSocket State Bridge', detail: 'live agent / app states' },
      { id: 'ui', label: 'React UI / Dashboard', detail: 'status bubbles · controls' },
    ],
  },
  ota: {
    title: 'OTA Rate-Parity Automation',
    stages: [
      { id: 'cm', label: 'Channex / PMS API', detail: 'rates · availability · restrictions' },
      { id: 'browser', label: 'Guest-Price Reader', detail: 'real Chrome CDP on each OTA' },
      { id: 'norm', label: 'Normalizer', detail: 'Net/Gross · taxes · currency' },
      { id: 'parity', label: 'Parity & Policy Checker', detail: 'rate diff · cancellation mismatch' },
      { id: 'push', label: 'ARI Updater', detail: 'batched push · read-back verify', when: ['channex', 'rateparity'] },
      { id: 'report', label: 'Excel / CSV Report', detail: 'daily owner report', when: ['excel', 'rateparity', 'ota'] },
      { id: 'alert', label: 'Alerts', detail: 'Telegram / email', when: ['telegram', 'rateparity'] },
      { id: 'dash', label: 'Web Dashboard', detail: 'React · issues by property/date' },
    ],
  },
};

export function buildStages(analysis: JobAnalysis, niche: NicheId = analysis.primaryNiche): ArchitectureStage[] {
  const ids = new Set(analysis.keywords.map((k) => k.term.id));
  const strong = new Set(analysis.keywords.filter((k) => k.inTitle || k.count >= 2).map((k) => k.term.id));
  return PIPELINES[niche].stages
    .filter((s) => (!s.when || s.when.some((w) => ids.has(w))) && (!s.whenStrong || s.whenStrong.some((w) => strong.has(w))))
    .map(({ id, label, detail }) => ({ id, label, detail }));
}

export function toMermaid(stages: ArchitectureStage[]): string {
  const safe = (s: string) => s.replace(/["[\]{}()<>]/g, '').replace(/·/g, '-');
  const lines = ['flowchart LR'];
  stages.forEach((s, i) => {
    lines.push(`  S${i}["${safe(s.label)}<br/><small>${safe(s.detail)}</small>"]`);
  });
  for (let i = 0; i < stages.length - 1; i++) lines.push(`  S${i} --> S${i + 1}`);
  return lines.join('\n');
}

export function toAscii(stages: ArchitectureStage[]): string {
  const width = Math.max(...stages.map((s) => Math.max(s.label.length + 6, s.detail.length + 5)), 26) + 2;
  const pad = (t: string) => t + ' '.repeat(Math.max(0, width - 2 - t.length));
  const mid = Math.floor(width / 2);
  const out: string[] = [];
  stages.forEach((s, i) => {
    out.push(`┌${'─'.repeat(width - 2)}┐`);
    out.push(`│${pad(` ${i + 1}. ${s.label}`)}│`);
    out.push(`│${pad(`    ${s.detail}`.slice(0, width - 2))}│`);
    if (i < stages.length - 1) {
      out.push(`└${'─'.repeat(mid - 1)}┬${'─'.repeat(width - mid - 2)}┘`);
      out.push(`${' '.repeat(mid)}▼`);
    } else {
      out.push(`└${'─'.repeat(width - 2)}┘`);
    }
  });
  return out.join('\n');
}

/** Compact one-line pipeline for inline use inside proposals. */
export function toInline(stages: ArchitectureStage[]): string {
  return stages.map((s) => s.label).join(' → ');
}

export function generateArchitecture(analysis: JobAnalysis, niche: NicheId = analysis.primaryNiche): ArchitectureDiagram {
  const stages = buildStages(analysis, niche);
  return {
    title: PIPELINES[niche].title,
    stages,
    mermaid: toMermaid(stages),
    ascii: toAscii(stages),
  };
}
