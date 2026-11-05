import type { Deal } from '../types';

const d = (daysAgo: number) => new Date(Date.now() - daysAgo * 86400000).toISOString();

/** Seed data so the CRM looks alive on first launch. */
export function sampleDeals(): Deal[] {
  return [
    {
      id: 'deal_seed_1', createdAt: d(12), updatedAt: d(2), stage: 'won', title: 'Automated YouTube Shorts factory (Remotion + ElevenLabs)',
      niche: 'video', contractType: 'fixed', clientCountry: 'United States', winRate: 88, projectIds: ['code-video-render', 'app-video-chia-se'],
      proposalAngle: 'prototype', proposalText: 'I already run a working Remotion and Whisper system…', bidAmount: 2200, milestones: [], connects: 16,
      notes: 'Khách chốt sau khi xem Loom 90s. Milestone 1 đã release.', jobDescription: '', sentAt: d(12), repliedAt: d(11), wonAt: d(9),
    },
    {
      id: 'deal_seed_2', createdAt: d(6), updatedAt: d(1), stage: 'interviewing', title: 'MCP server for internal CRM + Claude Desktop',
      niche: 'agents', contractType: 'hourly', clientCountry: 'Germany', winRate: 91, projectIds: ['ceo-multi-agent'],
      proposalAngle: 'architect', proposalText: 'Your MCP build will hit 2 hidden traps…', bidAmount: 1900, milestones: [], connects: 12,
      notes: 'Hẹn call 15 phút thứ 5. Chuẩn bị demo chrome-devtools MCP.', jobDescription: '', sentAt: d(6), repliedAt: d(3),
    },
    {
      id: 'deal_seed_3', createdAt: d(4), updatedAt: d(4), stage: 'sent', title: 'ComfyUI product photo background removal API',
      niche: 'localai', contractType: 'fixed', clientCountry: 'United Kingdom', winRate: 79, projectIds: ['local-tts-comfyui'],
      proposalAngle: 'delivery', proposalText: 'You never have to take my word for it…', bidAmount: 1500, milestones: [], connects: 12,
      notes: '', jobDescription: '', sentAt: d(4),
    },
    {
      id: 'deal_seed_4', createdAt: d(3), updatedAt: d(3), stage: 'sent', title: 'Three.js avatar walking animation fix (foot sliding)',
      niche: '3d', contractType: 'fixed', clientCountry: 'Canada', winRate: 84, projectIds: ['van-phong-3d'],
      proposalAngle: 'architect', proposalText: 'Your Three.js build will hit 2 hidden traps…', bidAmount: 900, milestones: [], connects: 8,
      notes: 'Gửi kèm GIF stride-locked walk.', jobDescription: '', sentAt: d(3),
    },
    {
      id: 'deal_seed_5', createdAt: d(1), updatedAt: d(1), stage: 'saved', title: 'Agoda / Booking.com rate parity checker for 3 hotels',
      niche: 'ota', contractType: 'fixed', clientCountry: 'Vietnam', winRate: 82, projectIds: ['ecom-ota-social'],
      proposalAngle: 'prototype', proposalText: '', bidAmount: 1100, milestones: [], connects: 0,
      notes: 'Chờ khách trả lời số lượng rate plan.', jobDescription: '',
    },
    {
      id: 'deal_seed_6', createdAt: d(9), updatedAt: d(7), stage: 'archived', title: 'WordPress plugin + data entry (skipped)',
      niche: 'agents', contractType: 'hourly', clientCountry: 'India', winRate: 18, projectIds: [],
      proposalAngle: 'prototype', proposalText: '', bidAmount: 300, milestones: [], connects: 0,
      notes: 'Lệch năng lực, khách chưa verify payment → bỏ qua.', jobDescription: '',
    },
    {
      id: 'deal_seed_7', createdAt: d(15), updatedAt: d(10), stage: 'archived', title: 'Faceless TikTok pipeline (lost to lower bid)',
      niche: 'video', contractType: 'fixed', clientCountry: 'Australia', winRate: 64, projectIds: ['code-video-render'],
      proposalAngle: 'prototype', proposalText: '', bidAmount: 1800, milestones: [], connects: 16,
      notes: 'Khách chọn người giá $600. Bài học: hỏi ngân sách sớm.', jobDescription: '', sentAt: d(15), repliedAt: d(14),
    },
  ];
}
