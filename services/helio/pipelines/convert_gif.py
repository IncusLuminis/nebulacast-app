#!/usr/bin/env python3

from PIL import Image, ImageSequence
from pathlib import Path
import sys

# -----------------------------------------------------------------------------
# Config
# -----------------------------------------------------------------------------
DOWNLOADS_DIR = Path.home() / "Downloads"

OUTPUT_DIR = Path("/Users/mloktionov/PycharmProjects/Personal/nebulacast-app/sites/staging/assets/gifs")

TARGET_SIZE = (64, 64)
COLORS = 32

OUTPUT_DIR.mkdir(parents=True, exist_ok=True)


# -----------------------------------------------------------------------------
# Core
# -----------------------------------------------------------------------------
def compress_gif(filename: str):
    input_path = DOWNLOADS_DIR / filename

    if not input_path.exists():
        raise FileNotFoundError(f"File not found: {input_path}")

    if input_path.suffix.lower() != ".gif":
        raise ValueError("Input file must be a .gif")

    with Image.open(input_path) as im:
        frames = []
        durations = []

        for frame in ImageSequence.Iterator(im):
            frame = frame.convert("RGBA")

            # resize
            frame = frame.resize(TARGET_SIZE, Image.LANCZOS)

            # palette reduction
            frame = frame.convert("P", palette=Image.ADAPTIVE, colors=COLORS)

            frames.append(frame)
            durations.append(frame.info.get("duration", 100))

        output_path = OUTPUT_DIR / filename

        frames[0].save(
            output_path,
            save_all=True,
            append_images=frames[1:],
            loop=0,
            duration=durations,
            optimize=True,
            disposal=2
        )

    print(f"[OK] {input_path} -> {output_path}")


# -----------------------------------------------------------------------------
# CLI
# -----------------------------------------------------------------------------
def main():
    if len(sys.argv) != 2:
        print("Usage: python compress_gif.py <filename.gif>")
        sys.exit(1)

    filename = sys.argv[1]

    try:
        compress_gif(filename)
    except Exception as e:
        print(f"[ERROR] {e}")
        sys.exit(1)


if __name__ == "__main__":
    main()