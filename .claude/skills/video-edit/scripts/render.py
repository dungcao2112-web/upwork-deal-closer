#!/usr/bin/env python3
"""Render a video from an edit table (Markdown table or CSV) using ffmpeg.

Columns (header names, case-insensitive; only `source` is required):
  source      path to video / image / color:#RRGGBB
  start       in-point  (seconds or HH:MM:SS(.ms)), default 0
  end         out-point (seconds or timecode); for images/colors = duration
  speed       playback speed, default 1 (0.5 = slow-mo, 2 = fast)
  volume      clip audio volume, default 1 (0 = mute)
  text        overlay text (optional)
  pos         text position: top | center | bottom (default bottom)
  fade        fade in/out seconds at clip edges, default 0
  transition  crossfade INTO the next clip: fade|wipeleft|slideleft|dissolve|... (xfade names)
  tdur        transition duration seconds, default 0.5

Usage:
  python3 render.py edit.md -o out.mp4 [--size 1920x1080] [--fps 30]
                    [--music bgm.mp3 --music-volume 0.25] [--preview]
"""
import argparse, csv, os, re, shutil, subprocess, sys, tempfile

IMG_EXT = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}
FONT_CANDIDATES = [
    "/usr/share/fonts/truetype/dejavu/DejaVuSans-Bold.ttf",
    "/System/Library/Fonts/Supplemental/Arial Bold.ttf",
    "C:/Windows/Fonts/arialbd.ttf",
]


def die(msg):
    sys.exit(f"[video-edit] ERROR: {msg}")


def tc(v, default=None):
    v = (v or "").strip()
    if not v:
        return default
    if ":" in v:
        sec = 0.0
        for part in v.split(":"):
            sec = sec * 60 + float(part)
        return sec
    return float(v)


def read_table(path):
    text = open(path, encoding="utf-8").read()
    if path.lower().endswith(".csv"):
        rows = list(csv.DictReader(text.splitlines()))
    else:  # markdown table
        lines = [l.strip() for l in text.splitlines() if l.strip().startswith("|")]
        lines = [l for l in lines if not re.fullmatch(r"\|[\s:\-|]+\|", l)]
        if not lines:
            die("no markdown table found")
        split = lambda l: [c.strip() for c in l.strip("|").split("|")]
        head = [h.lower() for h in split(lines[0])]
        rows = [dict(zip(head, split(l))) for l in lines[1:]]
    rows = [{k.strip().lower(): (v or "").strip() for k, v in r.items()} for r in rows]
    rows = [r for r in rows if r.get("source")]
    if not rows:
        die("table has no rows with a `source`")
    return rows


def probe_duration(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-show_entries", "format=duration", "-of", "csv=p=0", path],
        capture_output=True, text=True).stdout.strip()
    return float(out) if out else 0.0


def has_audio(path):
    out = subprocess.run(
        ["ffprobe", "-v", "error", "-select_streams", "a", "-show_entries", "stream=index",
         "-of", "csv=p=0", path], capture_output=True, text=True).stdout.strip()
    return bool(out)


def atempo_chain(speed):
    parts, s = [], speed
    while s > 2.0:
        parts.append("atempo=2.0"); s /= 2.0
    while s < 0.5:
        parts.append("atempo=0.5"); s /= 0.5
    parts.append(f"atempo={s:.4f}")
    return ",".join(parts)


def render_clip(i, r, args, tmp, font):
    W, H = args.size.split("x")
    src = r["source"]
    start = tc(r.get("start"), 0.0)
    end = tc(r.get("end"))
    speed = float(r.get("speed") or 1)
    vol = float(r.get("volume") or 1)
    fade = float(r.get("fade") or 0)
    out = os.path.join(tmp, f"clip{i:03d}.mp4")

    cmd = ["ffmpeg", "-y", "-v", "error"]
    is_color = src.lower().startswith("color:")
    is_img = os.path.splitext(src)[1].lower() in IMG_EXT
    if not is_color and not os.path.exists(src):
        die(f"row {i+1}: source not found: {src}")

    if is_color or is_img:
        dur = (end - start) if end is not None and end > start else (end or 3.0)
        if is_color:
            cmd += ["-f", "lavfi", "-i", f"color=c={src[6:]}:s={W}x{H}:r={args.fps}:d={dur}"]
        else:
            cmd += ["-loop", "1", "-t", str(dur), "-i", src]
        cmd += ["-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo"]
        audio_in, src_audio = "1:a", False
    else:
        if end is None:
            end = probe_duration(src)
        if end <= start:
            die(f"row {i+1}: end ({end}) must be > start ({start})")
        dur = (end - start)
        cmd += ["-ss", str(start), "-t", str(dur), "-i", src]
        src_audio = has_audio(src)
        if not src_audio:
            cmd += ["-f", "lavfi", "-t", str(dur), "-i", "anullsrc=r=48000:cl=stereo"]
        audio_in = "0:a" if src_audio else "1:a"
    out_dur = dur / speed

    vf = [f"scale={W}:{H}:force_original_aspect_ratio=decrease",
          f"pad={W}:{H}:(ow-iw)/2:(oh-ih)/2:black", "setsar=1", f"fps={args.fps}"]
    if speed != 1:
        vf.append(f"setpts=PTS/{speed}")
    else:
        vf.append("setpts=PTS-STARTPTS")
    text = r.get("text")
    if text:
        tf = os.path.join(tmp, f"text{i:03d}.txt")
        open(tf, "w", encoding="utf-8").write(text.replace("\\n", "\n"))
        y = {"top": "h*0.08", "center": "(h-text_h)/2"}.get(r.get("pos", "").lower(), "h*0.85-text_h")
        fontopt = f"fontfile='{font}':" if font else ""
        vf.append(f"drawtext={fontopt}textfile='{tf}':fontcolor=white:fontsize=h/18:"
                  f"box=1:boxcolor=black@0.5:boxborderw=20:x=(w-text_w)/2:y={y}")
    if fade > 0:
        vf += [f"fade=t=in:st=0:d={fade}", f"fade=t=out:st={max(out_dur - fade, 0)}:d={fade}"]
    vf.append("format=yuv420p")

    af = ["aresample=48000", "aformat=channel_layouts=stereo"]
    if src_audio and speed != 1:
        af.append(atempo_chain(speed))
    af.append(f"volume={vol}")
    if fade > 0:
        af += [f"afade=t=in:st=0:d={fade}", f"afade=t=out:st={max(out_dur - fade, 0)}:d={fade}"]

    cmd += ["-filter_complex", f"[0:v]{','.join(vf)}[v];[{audio_in}]{','.join(af)}[a]",
            "-map", "[v]", "-map", "[a]", "-t", f"{out_dur:.3f}",
            "-c:v", "libx264", "-preset", args.preset, "-crf", str(args.crf),
            "-c:a", "aac", "-b:a", "192k", "-ar", "48000", out]
    subprocess.run(cmd, check=True)
    return out, probe_duration(out)


def join(clips, rows, args, tmp):
    """Concat clips; apply xfade where a row asks for a transition into the next clip."""
    if len(clips) == 1:
        return clips[0][0]
    inputs, fc = [], []
    for i, (c, _) in enumerate(clips):
        inputs += ["-i", c]
        fc.append(f"[{i}:v]fps={args.fps},format=yuv420p,settb=AVTB[sv{i}]")
        fc.append(f"[{i}:a]aresample=48000[sa{i}]")
    vlab, alab, offset = "[sv0]", "[sa0]", clips[0][1]
    for i in range(1, len(clips)):
        trans = rows[i - 1].get("transition", "").strip().lower()
        td = float(rows[i - 1].get("tdur") or 0.5) if trans and trans != "cut" else 0.0
        td = min(td, clips[i - 1][1] / 2, clips[i][1] / 2)
        nv, na = f"[v{i}]", f"[a{i}]"
        if td > 0:
            offset -= td
            fc.append(f"{vlab}[sv{i}]xfade=transition={trans}:duration={td:.3f}:offset={offset:.3f}{nv}")
            fc.append(f"{alab}[sa{i}]acrossfade=d={td:.3f}{na}")
        else:
            fc.append(f"{vlab}[sv{i}]concat=n=2:v=1:a=0,settb=AVTB{nv}")
            fc.append(f"{alab}[sa{i}]concat=n=2:v=0:a=1{na}")
        vlab, alab = nv, na
        offset += clips[i][1]
    out = os.path.join(tmp, "joined.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", *inputs, "-filter_complex", ";".join(fc),
                    "-map", vlab, "-map", alab, "-c:v", "libx264", "-preset", args.preset,
                    "-crf", str(args.crf), "-c:a", "aac", "-b:a", "192k", out], check=True)
    return out


def add_music(video, args, tmp):
    out = os.path.join(tmp, "music.mp4")
    subprocess.run(["ffmpeg", "-y", "-v", "error", "-i", video, "-stream_loop", "-1", "-i", args.music,
                    "-filter_complex",
                    f"[1:a]volume={args.music_volume}[m];[0:a][m]amix=inputs=2:duration=first:"
                    f"dropout_transition=0:normalize=0[a]",
                    "-map", "0:v", "-map", "[a]", "-c:v", "copy", "-c:a", "aac", "-b:a", "192k",
                    "-shortest", out], check=True)
    return out


def main():
    ap = argparse.ArgumentParser(description=__doc__, formatter_class=argparse.RawDescriptionHelpFormatter)
    ap.add_argument("table")
    ap.add_argument("-o", "--out", default="output.mp4")
    ap.add_argument("--size", default="1920x1080")
    ap.add_argument("--fps", type=int, default=30)
    ap.add_argument("--music")
    ap.add_argument("--music-volume", type=float, default=0.25)
    ap.add_argument("--crf", type=int, default=20)
    ap.add_argument("--preset", default="medium")
    ap.add_argument("--preview", action="store_true", help="fast low-res draft render")
    args = ap.parse_args()
    if not shutil.which("ffmpeg"):
        die("ffmpeg not installed (macOS: brew install ffmpeg | Ubuntu: sudo apt install ffmpeg | Win: winget install ffmpeg)")
    if args.preview:
        w, h = map(int, args.size.split("x"))
        args.size, args.preset, args.crf = f"{w // 3 // 2 * 2}x{h // 3 // 2 * 2}", "ultrafast", 30

    base = os.path.dirname(os.path.abspath(args.table))
    rows = read_table(args.table)
    for r in rows:  # sources are relative to the table file
        s = r["source"]
        if not s.lower().startswith("color:") and not os.path.isabs(s):
            r["source"] = os.path.join(base, s)
    font = next((f for f in FONT_CANDIDATES if os.path.exists(f)), None)

    tmp = tempfile.mkdtemp(prefix="vedit_")
    try:
        clips = []
        for i, r in enumerate(rows):
            print(f"[video-edit] clip {i+1}/{len(rows)}: {os.path.basename(r['source'])}", flush=True)
            clips.append(render_clip(i, r, args, tmp, font))
        print("[video-edit] joining…", flush=True)
        final = join(clips, rows, args, tmp)
        if args.music:
            final = add_music(final, args, tmp)
        shutil.move(final, args.out)
        print(f"[video-edit] DONE -> {args.out} ({probe_duration(args.out):.2f}s)")
    except subprocess.CalledProcessError as e:
        die(f"ffmpeg failed: {' '.join(map(str, e.cmd))[:500]}")
    finally:
        shutil.rmtree(tmp, ignore_errors=True)


if __name__ == "__main__":
    main()
