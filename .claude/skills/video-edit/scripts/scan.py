#!/usr/bin/env python3
"""Scan a folder of media and print a starter edit table (Markdown) + media info.

Usage: python3 scan.py <folder_or_files...> [--scenes] [-o edit.md]
  --scenes   detect scene cuts in videos and emit one row per scene
"""
import argparse, json, os, re, subprocess, sys

VID = {".mp4", ".mov", ".mkv", ".webm", ".avi", ".m4v"}
IMG = {".png", ".jpg", ".jpeg", ".webp", ".bmp"}


def info(p):
    out = subprocess.run(["ffprobe", "-v", "error", "-show_entries",
                          "format=duration:stream=codec_type,width,height", "-of", "json", p],
                         capture_output=True, text=True).stdout
    d = json.loads(out or "{}")
    v = next((s for s in d.get("streams", []) if s.get("codec_type") == "video"), {})
    a = any(s.get("codec_type") == "audio" for s in d.get("streams", []))
    return float(d.get("format", {}).get("duration") or 0), v.get("width"), v.get("height"), a


def scenes(p, thr=0.35):
    err = subprocess.run(["ffmpeg", "-hide_banner", "-i", p, "-vf",
                          f"select='gt(scene,{thr})',showinfo", "-an", "-f", "null", "-"],
                         capture_output=True, text=True).stderr
    return [float(t) for t in re.findall(r"pts_time:([\d.]+)", err)]


def main():
    ap = argparse.ArgumentParser()
    ap.add_argument("paths", nargs="+")
    ap.add_argument("--scenes", action="store_true")
    ap.add_argument("-o", "--out")
    a = ap.parse_args()
    files = []
    for p in a.paths:
        if os.path.isdir(p):
            files += sorted(os.path.join(p, f) for f in os.listdir(p))
        else:
            files.append(p)
    files = [f for f in files if os.path.splitext(f)[1].lower() in VID | IMG]
    if not files:
        sys.exit("no media found")
    base = os.path.dirname(os.path.abspath(a.out)) if a.out else os.getcwd()

    lines = ["| # | source | start | end | speed | volume | text | pos | fade | transition | tdur |",
             "|---|--------|-------|-----|-------|--------|------|-----|------|------------|------|"]
    report = []
    n = 0
    for f in files:
        rel = os.path.relpath(f, base)
        if os.path.splitext(f)[1].lower() in IMG:
            report.append(f"- {rel}: image")
            n += 1
            lines.append(f"| {n} | {rel} | 0 | 3 | 1 | 1 |  | bottom | 0 | fade | 0.5 |")
            continue
        dur, w, h, aud = info(f)
        report.append(f"- {rel}: {dur:.2f}s {w}x{h} audio={'yes' if aud else 'no'}")
        cuts = [0.0] + (scenes(f) if a.scenes else []) + [dur]
        for s, e in zip(cuts, cuts[1:]):
            if e - s < 0.3:
                continue
            n += 1
            lines.append(f"| {n} | {rel} | {s:.2f} | {e:.2f} | 1 | 1 |  | bottom | 0 | cut | 0.5 |")
    table = "\n".join(lines)
    print("## Media\n" + "\n".join(report) + "\n\n## Edit table\n" + table)
    if a.out:
        open(a.out, "w", encoding="utf-8").write("# Edit table\n\n" + table + "\n")
        print(f"\n[video-edit] wrote {a.out}")


if __name__ == "__main__":
    main()
