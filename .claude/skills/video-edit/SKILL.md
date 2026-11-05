---
name: video-edit
description: Edit videos on the local machine fully by AI using an "edit table" (bảng dựng) — a Markdown/CSV table where each row is a clip (source, in/out, speed, volume, text overlay, fade, transition). Use when the user asks to cut, trim, join/ghép, speed up/slow down, add text/subtitles, transitions, background music, or make a short/reel/montage from local video or image files. Renders with ffmpeg.
---

# Video Edit bằng bảng dựng (AI-driven)

AI làm toàn bộ: quét media → lập bảng dựng → render → kiểm tra → sửa bảng → render lại.
Người dùng chỉ cần nói mục tiêu ("ghép 3 clip thành reel 30s, có chữ, nhạc nền").

## Yêu cầu
- `ffmpeg` + `ffprobe` trong PATH, `python3`.
  Cài nếu thiếu: macOS `brew install ffmpeg` · Ubuntu `sudo apt install ffmpeg` · Windows `winget install ffmpeg`.

Scripts (đường dẫn tương đối với thư mục skill này):
- `scripts/scan.py` — quét file/thư mục, in thông tin media + bảng dựng mẫu.
- `scripts/render.py` — đọc bảng dựng và xuất video.

## Quy trình (làm tự động, không hỏi lại trừ khi thiếu thông tin quan trọng)

1. **Quét media**
   ```bash
   python3 <skill>/scripts/scan.py <thư_mục_media> --scenes -o <thư_mục_media>/edit.md
   ```
   `--scenes` tự cắt theo cảnh để AI chọn đoạn hay. Bỏ `--scenes` nếu chỉ cần mỗi file 1 dòng.

2. **Lập bảng dựng** — sửa `edit.md` theo yêu cầu người dùng: chọn/xoá/sắp xếp dòng,
   chỉnh `start`/`end`, thêm `text`, `transition`… Luôn **hiển thị bảng cho người dùng** trong chat.

3. **Render nháp nhanh** (1/3 độ phân giải) để kiểm tra:
   ```bash
   python3 <skill>/scripts/render.py edit.md -o draft.mp4 --preview
   ```

4. **Tự kiểm tra**: `ffprobe` thời lượng; trích vài khung hình để xem bằng mắt:
   ```bash
   ffmpeg -v error -i draft.mp4 -vf "fps=1/3,scale=480:-2,tile=4x2" -frames:v 1 contact.png
   ```
   Đọc ảnh `contact.png` (Read tool) → nếu sai chữ/cảnh/thứ tự thì sửa bảng, render lại.

5. **Render bản cuối**:
   ```bash
   python3 <skill>/scripts/render.py edit.md -o final.mp4 [--size 1080x1920] [--music bgm.mp3 --music-volume 0.2]
   ```
   Báo đường dẫn file, thời lượng, và bảng dựng cuối cùng.

## Định dạng bảng dựng

Chỉ cột `source` là bắt buộc. Đường dẫn `source` tương đối so với file bảng.

| # | source | start | end | speed | volume | text | pos | fade | transition | tdur |
|---|--------|-------|-----|-------|--------|------|-----|------|------------|------|
| 1 | color:#000000 | 0 | 2 | 1 | 1 | Tiêu đề video | center | 0.5 | fade | 0.5 |
| 2 | clips/a.mp4 | 00:00:05 | 00:00:12.5 | 1 | 1 | Cảnh mở đầu | bottom | 0 | cut | |
| 3 | clips/b.mp4 | 3 | 9 | 2 | 0 |  |  | 0 | wipeleft | 0.7 |
| 4 | img/logo.png | 0 | 3 | 1 | 1 | Cảm ơn đã xem! | bottom | 0.5 |  | |

| Cột | Ý nghĩa | Mặc định |
|---|---|---|
| source | file video, ảnh (png/jpg/webp), hoặc `color:#RRGGBB` (màn nền) | — |
| start / end | điểm vào/ra (giây hoặc `HH:MM:SS.ms`). Ảnh/màu: `end-start` = thời lượng | 0 / hết clip |
| speed | tốc độ (0.5 slow-mo, 2 tua nhanh) — tự chỉnh pitch audio | 1 |
| volume | âm lượng clip (0 = tắt tiếng) | 1 |
| text | chữ phủ lên clip; xuống dòng dùng `\n` | — |
| pos | vị trí chữ: `top` / `center` / `bottom` | bottom |
| fade | fade in/out ở 2 đầu clip (giây) | 0 |
| transition | chuyển cảnh **sang clip kế tiếp**: `cut`, `fade`, `dissolve`, `wipeleft`, `wiperight`, `slideleft`, `slideup`, `circleopen`, `radial`, `zoomin`… (tên filter xfade) | cut |
| tdur | thời lượng chuyển cảnh (giây) | 0.5 |

Cũng chấp nhận file `.csv` với cùng tên cột.

## Tuỳ chọn render
- `--size WxH` — 1920x1080 (YouTube), **1080x1920 (TikTok/Reels/Shorts)**, 1080x1080 (vuông). Clip khác tỉ lệ tự letterbox.
- `--fps 30`, `--crf 20` (nhỏ hơn = nét hơn), `--preset medium`.
- `--music file.mp3 --music-volume 0.25` — nhạc nền lặp lại, trộn với tiếng clip.
- `--preview` — nháp nhanh độ phân giải thấp.

## Mẹo cho AI
- Muốn tạo **phụ đề** cho video có lời: nếu máy có `whisper` (`pip install openai-whisper`), chạy
  `whisper a.mp4 --model small --output_format srt`, rồi chia thành các dòng bảng với `text` theo từng câu
  (cùng `source`, `start`/`end` theo timestamp SRT, transition `cut`).
- Video dài cần **highlight**: dùng `scan.py --scenes`, chọn cảnh theo yêu cầu, tổng thời lượng ≈ mục tiêu.
- Tổng thời lượng ≈ Σ((end−start)/speed) − Σ(tdur của các transition).
- Lỗi ffmpeg: script in lệnh lỗi; kiểm tra đường dẫn `source`, `end > start`, và `start` < độ dài clip.
- Không ghi đè file gốc của người dùng; xuất ra file mới.
