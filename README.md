# 🎯 Upwork Deal Closer & Portfolio Matcher Studio

**Trạm Chỉ Huy Săn Việc & Chốt Thầu Upwork** của anh Dũng (AI Automation Architect).

Anh dán JD Upwork vào (hoặc chọn 1 trong 8 Job mẫu). Ngay lập tức, **chạy hoàn toàn trên máy, không cần API key**, hệ thống sẽ:

1. Chấm **Win-Rate 0–100%** theo 5 chỉ số, bóc tách nỗi đau của khách, red flags và **bẫy kỹ thuật ẩn**.
2. Chọn đúng **dự án thực chiến** trong kho 7 dự án của Dũng, kèm **kịch bản Loom 90 giây** (song ngữ EN/VI).
3. Sinh **3 bản Cover Letter tiếng Anh** (Prototype-First, Technical Architect, 7-Gate Delivery), có ghi chú chiến thuật tiếng Việt và kiểm tra Hook 2 dòng đầu.
4. Tính **3 mức giá bid**, trừ 10% phí Upwork, ra **Net USD/VNĐ**, **$/giờ thực làm**, và chia **Milestones** cộng đúng 100%.
5. Sinh **chuỗi Boolean Search** cho 5 ngách, kèm Title/Overview/Skills cho Specialized Profile.
6. Quản lý phễu bằng **Kanban CRM**, có thống kê, kéo-thả và Export/Import JSON/CSV.

---

## 🚀 Chạy nhanh

```bash
npm install
```

```bash
npm run dev
```

Mở http://localhost:5173

| Lệnh | Mục đích |
|---|---|
| `npm run dev` | Dev server (Vite) |
| `npm test` | 180 test tự động (Vitest) |
| `npm run build` | Typecheck strict + build production vào `dist/` |
| `npm run preview` | Xem bản build |
| `node scripts/ui-check.cjs ./screenshots` | Kiểm tra UI thật bằng Playwright (39 bước, cần `npm run dev` chạy song song) |

---

## 🧭 Hướng dẫn sử dụng: nộp 1 đơn trong dưới 60 giây

1. **🔍 Phân hệ 1 · JD Analyzer.** Dán tiêu đề và JD, điền ngân sách và thông tin khách (quốc gia, Payment Verified, tổng chi, hire rate, số proposals). Win-Rate cập nhật ngay khi gõ. Xem verdict `MUST-BID / STRONG / CONSIDER / SKIP`.
2. **🏆 Phân hệ 2 · Portfolio & Loom.** Dự án khớp nhất được xếp đầu. Tick chọn thêm dự án phụ. Bấm **Copy kịch bản** để quay Loom 90 giây theo từng mốc 0:00 → 1:30. Tab **Quản lý Kho Dự Án** cho phép thêm/sửa/xóa dự án (lưu `localStorage`).
3. **✍️ Phân hệ 3 · Proposal Studio.** Chọn giọng điệu (Punchy / Deep Technical / Executive). Bật/tắt 3 câu hỏi chốt và sơ đồ kiến trúc (ASCII hoặc Mermaid). Xem **Above-the-Fold Preview**: mô phỏng 2 dòng khách thấy kèm điểm Hook A–F. Có thể sửa trực tiếp, chế độ **So sánh 3 bản**, rồi bấm **Copy Proposal**.
4. **💰 Phân hệ 4 · Bid & Milestones.** Chọn mức giá → **Copy trọn bộ Milestones** hoặc copy từng dòng để dán vào form Upwork.
5. **💾 Lưu vào Pipeline CRM** (nút trên header). Lưu trọn bộ Job, Win-Rate, dự án, proposal đang chọn, milestones, connects.
6. **📋 Phân hệ 6 · Kanban.** Kéo-thả hoặc bấm ←/→ để chuyển giai đoạn. Bấm vào thẻ để ghi chú, chỉnh connects/giá. Export JSON/CSV để sao lưu.
7. **📡 Phân hệ 5 · Niche Radar.** Mỗi sáng chọn ngách → tick từ khóa → **Mở trang tìm kiếm Upwork**.

Ô **Tìm nhanh** trên header tìm được Job mẫu, dự án, deal và phân hệ.

### Optional Live LLM Bridge
Trong Phân hệ 3 có thể nhập API key Claude / OpenAI / Gemini, hoặc trỏ tới Ollama local (`http://localhost:11434`), để LLM viết lại 1 bản proposal theo yêu cầu đặc biệt. Key chỉ lưu trong trình duyệt. **Không bắt buộc:** mọi tính năng khác chạy offline.

---

## 🧠 Thuật toán (tóm tắt)

**Win-Rate = trung bình có trọng số của 5 chỉ số**

| Chỉ số | Trọng số | Cách tính |
|---|---|---|
| Tech Stack Alignment | 25% | Tỷ trọng công nghệ trong JD mà Dũng đã làm thật (trọng số theo độ khó, mention trong title ×1.6) + độ rộng |
| Ready-to-Demo Prototype | 20% | Điểm khớp của dự án tốt nhất (+ dự án phụ) |
| Technical Moat | 15% | Độ khó TB + số công nghệ khó + số bẫy kỹ thuật |
| Code Reuse & Speed | 15% | % phạm vi đã có module → **Reuse Multiplier 1x–5x** |
| Client & Budget Health | 25% | Payment verified, tổng chi, hire rate, số proposals, ngân sách, red flags |

Ràng buộc cứng: khách chưa verify thanh toán thì Win-Rate tối đa 60%. Đòi liên hệ ngoài Upwork thì trừ thêm điểm.

**Proposal:** mỗi góc độ có một bộ soạn câu theo giới hạn số từ (Angle 1: 130–170 từ, Angle 2 & 3: 180–260 từ). Câu bắt buộc và câu tùy chọn được ghép theo thứ tự ưu tiên. Nội dung lấy từ chính cách viết của khách trong JD, nỗi đau, bẫy kỹ thuật, module tái sử dụng và số đo thật của dự án.

**Bid:** phí Upwork 10% cố định. Fixed-price neo theo ngân sách khách (×0.85 / ×1.0–1.05 / ×1.3). Hourly theo khoảng $/h của khách. Milestones 3 giai đoạn (30/45/25) hoặc 4 giai đoạn (20/35/30/15); phần lẻ dồn vào milestone cuối để tổng luôn khớp giá bid.

---

## 🗂️ Cấu trúc mã nguồn

```
docs/
  HO_SO_CONG_VIEC_UPWORK_CHO_CLAUDE.md   # Hồ sơ năng lực gốc (nguồn dữ liệu)
  SPEC.md                                # Đặc tả
src/
  types/            # Kiểu dữ liệu TypeScript (strict)
  data/             # 7 dự án, 8 Job mẫu, 5 ngách, từ điển công nghệ, kho bẫy kỹ thuật, CRM mẫu
  engine/           # Logic lõi thuần (không phụ thuộc UI)
    jdAnalyzer.ts · winRateScorer.ts · portfolioMatcher.ts · proposalGenerator.ts
    proposalLinter.ts · architecture.ts · bidCalculator.ts · booleanBuilder.ts · crm.ts · llmBridge.ts
  components/       # 6 phân hệ UI + bộ UI dùng chung
  __tests__/        # 180 test Vitest
scripts/ui-check.cjs  # Kiểm thử giao diện thật bằng Playwright
```

**Stack:** React 18 · TypeScript (strict) · Vite 6 · Tailwind CSS 3 · Lucide Icons · Vitest 3.

---

## ✅ Kết quả kiểm thử

- `npm test`: **180/180 pass**. Gồm: chấm điểm từng ngách, khớp đúng dự án cho cả 8 Job, 3 góc độ × 3 giọng điệu × 8 Job đều đúng giới hạn số từ và không có câu mở đầu sáo rỗng, phí 10%, milestones = 100%, Boolean/URL, CRM JSON/CSV round-trip, LLM bridge.
- `npm run build`: 0 lỗi, 0 cảnh báo TypeScript.
- `scripts/ui-check.cjs`: 39/39 bước pass trên Chromium thật (mọi tab, Copy 1 chạm, lưu CRM, kéo-thả, export/import, giữ dữ liệu sau reload, mobile 390px không cuộn ngang), 0 lỗi console.
