# HỒ SƠ NĂNG LỰC & DỰ ÁN THỰC CHIẾN CỦA DŨNG (Upwork) — Dành cho Claude

> Tài liệu nguồn (source of truth) cho ứng dụng **Upwork Deal Closer & Portfolio Matcher Studio**.
> Toàn bộ dữ liệu dưới đây được nhúng vào `src/data/portfolioData.ts`.

## Hồ sơ năng lực & Dự án thực chiến của Dũng:

1. **Định vị chuyên gia (Core Positioning):**
   - Vai trò: AI Automation Architect / Full-Stack AI & Media Tools Developer / Multi-Agent Workflow Engineer / Browser & Desktop Automation Specialist.
   - Thế mạnh độc quyền: Thiết kế & vận hành hệ thống AI tự hành đầu-cuối (End-to-End Autonomous Pipelines) kết hợp LLM (Claude Code/API, OpenAI Codex, Gemini/Antigravity CLI, Local LLMs qua Ollama/AICoworker), trình duyệt thật (Chrome CDP / MCP), điều khiển Windows Desktop (`agent-desktop` UIA, AutoHotkey v2, Win32) và xử lý đa phương tiện bằng GPU NVIDIA RTX 5070 Ti (FFmpeg NVENC, Remotion, Faster-Whisper CUDA, ComfyUI, Local TTS/Voice Cloning).

2. **7 Nhóm Dự Án & Sản Phẩm Mẫu Chạy Thật (Working Prototypes để chốt khách Upwork):**
   - **Dự án 1 — AI CapCut Studio (`D:\ai-capcut-studio`, GitHub: `dungcao2112-web/ai-capcut-studio`):**
     - Web App dựng video chuyên nghiệp giao diện CapCut Dark Studio (`React + TypeScript + Vite + Tailwind + Lucide + Node.js/Express`).
     - Hỗ trợ song song **9:16 Reels/TikTok/Shorts (1080×1920)** và **16:9 YouTube (1920×1080)**, Preview thời gian thực 30fps (Ken Burns pan/zoom, crossfade, overlay text cards, karaoke captions) và Multi-track Timeline 5 lớp.
     - **AI Prompt-to-Edit Engine:** Gõ lệnh ngôn ngữ tự nhiên để cắt ghép cảnh, thay thế clip, chỉnh phụ đề, lấp khoảng trống (GAP) và tự động chấm điểm chất lượng hình ảnh (chỉ số chuyển động MAD, độ nét Laplacian).
     - Render phần cứng GPU NVIDIA RTX 5070 Ti (`h264_nvenc`) kèm cầu chì tự động fallback sang CPU (`libx264`).
   - **Dự án 2 — App "Video Chia Sẻ Hội Thoại 2 Người" (`E:\vd chia se`, GitHub: `dungcao2112-web/app-video-chia-se`):**
     - Ứng dụng đóng gói quy trình 10 bước sản xuất video hội thoại split-screen (`1080×1080`, 30fps) chạy cục bộ 100% (Offline/Local AI), đạt **82/82 bài kiểm thử tự động**.
     - Tích hợp **Faster-Whisper (`large-v3` CUDA)** nhận diện giọng nói tiếng Việt, tự động phát hiện đoạn nói vấp, khoảng lặng (theo ngưỡng dBFS) và câu Whisper bịa.
     - AI tự lập danh sách cắt (`cut.json`), trích xuất frame 2fps để chấm điểm chọn cảnh người nghe tự nhiên (`idle.json` — miệng khép, mắt nhìn đúng hướng, không bị bóng ma khi dissolve).
     - Tự động ghép ảnh sản phẩm tách nền (auto-crop sát biên alpha), co giãn thông minh theo thanh cỡ ảnh & % từng mục, xuất video qua **Remotion** kèm chuẩn hóa âm thanh 2 lượt chuẩn EBU R128 (`-14 LUFS`).
   - **Dự án 3 — Hệ thống Render Video Tự Động bằng Code (`Remotion + FFmpeg CUDA/NVENC + GSAP/Hyperframes`):**
     - Dựng video tự động từ kịch bản JSON/Python (`build_video.py`, `gpu_accel.py`) cho kênh YouTube bản đồ lịch sử – địa lý và kênh Reels nấu ăn.
     - Tối ưu hóa đa luồng Hybrid CPU + GPU giúp tăng tốc độ render nhanh gấp **6.4 lần**, giữ chất lượng **SSIM 0.995**.
     - Bộ công cụ tạo Motion Graphics, biểu đồ động (`animated-chart`), tự cắt khoảng lặng (`cut-silences`) và nhúng phụ đề động (`embedded-captions`).
     - Kèm phần mềm Nén Video GPU Hàng Loạt (`D:\NVEnc_Video_Compressor`) có cơ chế SSD Cache tăng tốc đọc/ghi.
   - **Dự án 4 — Kiến trúc Đa Tác Tử (CEO Multi-Agent Framework) & Điều khiển Trình duyệt/Desktop (MCP & CDP):**
     - 1 Agent trung tâm (CEO Claude) lập kế hoạch và điều phối song song: Codex CLI (đa tài khoản), Antigravity CLI (`agy`), AICoworker (`gemini38`, `claude-sonnet`, `claude-opus`, `gpt-oss`, `gemma4`, `qwen35`), Muse AI.
     - Quy trình kiểm soát chất lượng **7 cổng (G0 → G6)**: kiểm tra tiền điều kiện, chạy ẩn dưới nền Windows (`CreateNoWindow`), tự động nghiệm thu độc lập bằng script đo lường (`ffprobe`, SSIM, LUFS), đồng bộ qua `STATE.md` và phòng chat thời gian thực (`task-room.mjs`, `call-agent.mjs`).
     - Kết nối trực tiếp vào trình duyệt Chrome thật qua **Chrome DevTools Protocol (CDP)**, `chrome-devtools` MCP (`--autoConnect`), `chrome-relay`, Chrome Extension MV3 (vượt mọi rào cản anti-bot/Cloudflare).
     - Tích hợp FlowKit (`crisng95/flowkit`) trên WSL2 nối Google Flow; điều khiển ngầm ứng dụng Windows Desktop (Zalo, Telegram, CapCut, GPMLogin, Ezviz...) bằng Windows UI Automation (`agent-desktop`), AutoHotkey v2, Win32 API.
   - **Dự án 5 — Local TTS / Voice Cloning & ComfyUI Image Workflows:**
     - Triển khai & tích hợp API cục bộ cho: **CIT Voice Studio (`VieNeu-TTS-v3-Turbo`)**, **OmniVoice Studio**, **Voicebox (`Qwen CustomVoice` có điều khiển ngữ điệu `instruct`)**, **VoiceStudio**, **Qwen3-TTS**, **viF5TTS**, **Fish Speech**, **ElevenLabs**. Xử lý đọc văn bản dài, chia cụm câu thông minh không đứt hơi, chuẩn hóa âm lượng đồng đều.
     - Thiết kế ComfyUI Workflows tùy chỉnh: hoán đổi khuôn mặt 2 đầu vào (**BFS Qwen Image 2.1 Face-Swap LoRA**), xóa chữ giữ nguyên độ nét ảnh món ăn/sản phẩm, tách nền hàng loạt chất lượng cao (**BiRefNet**, `rembg`), tự động dàn trang giấy tờ CCCD/GPLX lên khổ A4 chuẩn 300 DPI chạy offline bảo mật tuyệt đối.
   - **Dự án 6 — Văn Phòng 3D AI Agents (`VanPhong3D`, GitHub: `dungcao2112-web/van-phong-3d-ai`), Blender MCP & Game Modding / Reverse Engineering:**
     - Ứng dụng không gian Văn phòng 3D trực quan trên trình duyệt (`Three.js / WebGL` + Python Backend) mô phỏng thời gian thực trạng thái làm việc của các AI Agent và giám sát phần cứng (VRAM RTX 5070 Ti, CPU, RAM).
     - Tự động hóa **Blender (Python API & MCP for Blender)** gắn xương hệ Humanoid 17 xương chuẩn cho 5 bộ nhân vật 3D `.glb`, lập trình bộ điều khiển cơ sinh học `character3d.js` (**Stride-Locked Walk Cycle** chống trượt chân, **Procedural Skeleton Post-Fixer** mượt mà khi đi bộ, ngồi làm việc, chuyển hướng).
     - Game Cờ Tỷ Phú Multiplayer Web/Node.js; Dịch ngược ứng dụng với MCP `rea` (JS/Electron/Native bundle analysis); Modding chuyên sâu *The Witcher 3* (WitcherScript/REDengine), *Ren'Py*.
   - **Dự án 7 — E-Commerce / Shopee Affiliate (`Me Sam Shop`), Quản trị OTA Khách sạn (*The L'anmien Saigon*) & Social Intelligence:**
     - Web App tính giỏ đồ đi sinh cho mẹ bầu (`React + Vite + Tailwind`), xuất/nhập Excel/CSV, tự động gắn link Shopee Affiliate và xử lý kho ảnh không nền.
     - Tự động hóa vận hành kênh OTA khách sạn (**Bluejay PMS / Channex** kết nối **Booking.com, Agoda, Trip.com, Expedia**): kiểm tra chéo giá Net/Gross, giá hiển thị phía khách, đóng/mở phòng, đối soát chính sách hoàn hủy.
     - Công cụ quét hàng loạt tab Facebook/Reels trên Chrome sinh bình luận tương tác tự nhiên theo nhân xưng thương hiệu; thu thập & phân tích kênh đối thủ bằng `yt-dlp + ffmpeg + AI Vision`; Desktop App theo dõi hạn mức AI (**AI Quota Tracker**) & hiệu năng hệ thống (**Pulse Neo**).
