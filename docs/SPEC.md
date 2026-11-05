# SPEC — Upwork Deal Closer & Portfolio Matcher Studio

## I. Bối cảnh & mục tiêu cốt lõi
Anh Dũng là **AI Automation Architect / Full-Stack AI & Media Tools Developer / Multi-Agent Workflow Engineer**.
Ứng dụng là **"Trạm Chỉ Huy Săn Việc & Chốt Thầu Upwork (Upwork Deal Closer Command Center)"**:

Dán bất kỳ JD Upwork nào (hoặc chọn từ kho Job mẫu) → hệ thống lập tức:
1. Phân tích sâu, chấm điểm **Win-Rate (0–100%)** theo 5 chỉ số.
2. Bóc tách nỗi đau của khách, cảnh báo rủi ro / bẫy kỹ thuật.
3. Tự chọn **đúng dự án thực chiến** trong kho của Dũng ("Vũ khí chốt khách").
4. Gợi ý **kịch bản quay Loom 90 giây**.
5. Tính **giá Bid + chia Milestones** tối ưu.
6. Vẽ **sơ đồ kiến trúc giải pháp (Mermaid + ASCII)**.
7. Sinh **3 phương án Cover Letter tiếng Anh** (kèm ghi chú chiến thuật tiếng Việt), **1-Click Copy** để nộp đơn < 60 giây.

Nguồn dữ liệu năng lực: `docs/HO_SO_CONG_VIEC_UPWORK_CHO_CLAUDE.md` → `src/data/portfolioData.ts`.

## II. Kiến trúc mã nguồn

```
src/
├── types/index.ts            # Kiểu dữ liệu TypeScript chặt chẽ
├── data/
│   ├── portfolioData.ts      # Định vị + 7 nhóm dự án thực chiến (proof, Loom script, metrics)
│   ├── sampleJobs.ts         # 8 Job Upwork mẫu (5 ngách)
│   ├── niches.ts             # 5 ngách: keyword taxonomy, Boolean, Profile Title/Overview/Skills
│   ├── techLexicon.ts        # Từ điển công nghệ → alias, ngách, độ khó, công nghệ ngầm
│   ├── edgeCases.ts          # Kho bẫy kỹ thuật (trigger → cảnh báo + cách Dũng đã giải)
│   └── sampleDeals.ts        # Dữ liệu CRM mẫu
├── engine/
│   ├── text.ts               # Chuẩn hóa văn bản, đếm từ, so khớp keyword
│   ├── jdAnalyzer.ts         # Trích xuất keyword, ngách, pain points, red flags, edge cases
│   ├── winRateScorer.ts      # 5 chỉ số + tổng Win-Rate
│   ├── portfolioMatcher.ts   # Xếp hạng 7 dự án theo JD
│   ├── proposalGenerator.ts  # 3 góc độ × 3 giọng điệu + câu hỏi + sơ đồ
│   ├── proposalLinter.ts     # Above-the-Fold preview + Hook score + cảnh báo mở đầu sáo rỗng
│   ├── architecture.ts       # Sinh Mermaid + ASCII pipeline theo ngách/keyword
│   ├── bidCalculator.ts      # 3 mức giá, phí Upwork 10%, Net USD/VND, $/giờ thực, Milestones
│   ├── booleanBuilder.ts     # Chuỗi Boolean + URL tìm kiếm Upwork
│   ├── crm.ts                # Pipeline CRM: thống kê, export/import JSON/CSV
│   ├── llmBridge.ts          # Optional: Claude / OpenAI / Gemini / Ollama
│   └── index.ts              # analyzeJob() — chạy toàn bộ pipeline 0ms
├── components/               # 6 phân hệ UI + shared UI
└── __tests__/                # Vitest
```

## III. Yêu cầu chức năng (6 phân hệ)

### 1. 🔍 JD Analyzer & Win-Rate Scorer
- Form: Tiêu đề, JD, Fixed/Hourly, Budget/Rate, Quốc gia, Payment Verified, Tổng chi tiêu, Hire Rate, Số Proposals.
- 8 Job mẫu (Quick-Load):
  1. Build Automated Faceless TikTok/Reels Video Pipeline with Remotion & Whisper
  2. Custom MCP Server & Chrome CDP Browser Automation Agent
  3. ComfyUI Face-Swap & Product Background Removal API + Local TTS
  4. Three.js 3D Interactive AI Avatar Office & Blender GLB Rigging
  5. Hotel Channel Manager Channex / Booking.com Rate Parity Automation
  6. React Video Editor like CapCut in Browser with FFmpeg Backend
  7. Reverse Engineer Electron Desktop App & Rebuild Web Dashboard
  8. Multi-Agent Orchestration System with Claude Code & Codex CLI
- Win-Rate (0–100%) từ 5 chỉ số có thanh tiến trình + giải thích:
  1. Tech Stack Alignment — 2. Ready-to-Demo Prototype Advantage — 3. Technical Moat —
  4. Code Reuse & Speed Multiplier — 5. Client & Budget Health.
- Bóc tách: Core Pain Points, Detected Tech Keywords & Implied Stack, Hidden Edge Cases / Technical Traps.

### 2. 🏆 Portfolio Matcher & Loom Script Builder
- Xếp hạng Top dự án phù hợp (bật/tắt chọn dự án phụ).
- Mỗi dự án: Proof-of-Work paragraph (EN, có số đo thật), Kịch bản Loom 90s (0:00–0:15 / 0:15–0:45 / 0:45–1:30, câu nói EN + dịch VI).
- Portfolio Manager: xem / sửa / thêm dự án (localStorage).

### 3. ✍️ 3-Angle Proposal Studio & Architecture Generator
- Angle 1 Prototype-First (130–170 từ), Angle 2 Technical Architect (180–260 từ), Angle 3 End-to-End Delivery & 7-Gate QA.
- Modifiers: giọng điệu (Punchy / Deep Technical / Executive), 3 câu hỏi chốt, chèn sơ đồ ASCII/Mermaid.
- Above-the-Fold preview (~200 ký tự) + Hook Linter (cảnh báo "Hi, I am an experienced developer…", "Dear Hiring Manager…").
- Optional Live LLM Bridge (Claude / OpenAI / Gemini / Ollama). Mặc định không cần key.

### 4. 💰 Smart Bid & Milestone Calculator
- Thời gian thị trường vs thời gian thực của Dũng (Reuse Multiplier).
- 3 mức giá (Aggressive Win / Optimal Value / Premium Expert), trừ 10% phí Upwork → Net USD + VND, $/giờ thực.
- 3–4 Milestones (tên, %, $, deliverables), tổng = 100% & = giá bid; Copy trọn bộ / từng dòng.

### 5. 📡 Niche Radar & Boolean Generator
- 5 ngách; tick từ khóa cộng thêm, loại trừ; lọc Payment Verified / Budget tối thiểu → Boolean + Copy + mở trang tìm kiếm Upwork.
- Profile Title / Overview / Skills cho từng ngách.

### 6. 📋 Deal Pipeline Kanban & Proposal CRM
- 5 cột: Saved/Analyzing · Proposal Sent · Interviewing/Replied · Won/Active · Archived/Skipped.
- "💾 Lưu vào Pipeline CRM" lưu trọn bộ Job, Win-Rate, dự án, proposal, milestone, connects, ghi chú.
- Analytics: tổng đơn gửi, Reply Rate %, Win Rate %, tổng Connects, tổng giá trị Pipeline.
- Export/Import JSON & CSV, dữ liệu mẫu.

## IV. Quy tắc chấm điểm (tóm tắt)
- **Tech Stack Alignment** = tỷ trọng keyword trong JD mà Dũng đã làm thật (trọng số theo độ hiếm).
- **Prototype Advantage** = điểm khớp của dự án tốt nhất (đã có app chạy thật để demo).
- **Technical Moat** = trung bình độ khó (1–5) của keyword + số bẫy kỹ thuật phát hiện.
- **Code Reuse** = độ phủ module có sẵn → hệ số tăng tốc 1.5x–5x.
- **Client Health** = Payment Verified, tổng chi tiêu, hire rate, số proposals, ngân sách, red flags trong JD.
- **Win-Rate** = trung bình có trọng số (25/20/15/15/25), kẹp 3–97%.

## V. Bid & Milestones
- Phí Upwork cố định 10% (`UPWORK_FEE = 0.10`). Net = Gross × 0.9. VND theo tỷ giá cấu hình (mặc định 25,400).
- Milestones: 3 giai đoạn (≤ $1,500) hoặc 4 giai đoạn; phần trăm cộng đúng 100, số tiền cộng đúng giá bid (làm tròn dồn vào milestone cuối).

## VI. Kiểm thử & nghiệm thu
- `npm test` (Vitest) ≥ 60 test cases: engine + data + CRM.
- `npm run build` (tsc strict + vite) 0 lỗi.
- Kiểm tra UI thực tế bằng Playwright (Chromium) trên dev server.
