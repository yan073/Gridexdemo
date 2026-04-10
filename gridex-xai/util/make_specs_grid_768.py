#!/usr/bin/env python3
import argparse
import csv
from pathlib import Path
from typing import List, Tuple

import librosa
import matplotlib.cm as cm
import numpy as np
from PIL import Image, ImageDraw, ImageFont

SR = 16000
N_MELS = 128
N_FFT = 1024
HOP = 256
IMAGE_SIZE = 768
GRID_SIZE = 4
LINE_WIDTH = 2
FONT_SIZE = 18


def audio_to_spec_image(
    audio_path: Path,
) -> Image.Image:
    y, _ = librosa.load(audio_path, sr=SR, mono=True)
    mel = librosa.feature.melspectrogram(
        y=y,
        sr=SR,
        n_mels=N_MELS,
        n_fft=N_FFT,
        hop_length=HOP,
        power=2.0,
    )
    mel_db = librosa.power_to_db(mel, ref=1.0, top_db=60.0)
    mel_norm = (mel_db + 60.0) / 60.0
    mel_color = cm.get_cmap("magma")(mel_norm)
    mel_img = (mel_color[:, :, :3] * 255.0).clip(0, 255).astype(np.uint8)

    # Flip vertically so low frequency is shown at the bottom.
    mel_img = np.flipud(mel_img)
    return Image.fromarray(mel_img, mode="RGB").resize((IMAGE_SIZE, IMAGE_SIZE), Image.BICUBIC)


def draw_numbered_grid(spec_img: Image.Image) -> Image.Image:
    overlay = spec_img.copy()
    draw = ImageDraw.Draw(overlay)
    width, height = overlay.size
    cell_w = width / GRID_SIZE
    cell_h = height / GRID_SIZE

    try:
        font = ImageFont.truetype("assets/arial.ttf", FONT_SIZE)
    except OSError:
        font = ImageFont.load_default()

    for idx in range(1, GRID_SIZE):
        x = round(idx * cell_w)
        y = round(idx * cell_h)
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255), width=LINE_WIDTH)
        draw.line([(0, y), (width, y)], fill=(255, 255, 255), width=LINE_WIDTH)

    region_id = 1
    for row in range(GRID_SIZE):
        for col in range(GRID_SIZE):
            center_x = round((col + 0.5) * cell_w)
            center_y = round((row + 0.5) * cell_h)
            text = str(region_id)
            bbox = draw.textbbox((0, 0), text, font=font)
            text_w = bbox[2] - bbox[0]
            text_h = bbox[3] - bbox[1]
            left = center_x - text_w // 2
            top = center_y - text_h // 2

            draw.rectangle(
                [(left - 2, top - 1), (left + text_w + 2, top + text_h + 1)],
                fill=(96, 96, 96),
            )
            draw.text((left, top), text, font=font, fill=(255, 255, 255))
            region_id += 1

    return overlay


def save_spec_and_grid(audio_path: Path, out_path: Path) -> None:
    spec_img = audio_to_spec_image(audio_path)
    out_path.parent.mkdir(parents=True, exist_ok=True)
    spec_img.save(out_path)

    grid_img = draw_numbered_grid(spec_img)
    grid_out = out_path.with_name(f"{out_path.stem}_grid{GRID_SIZE}x{GRID_SIZE}{out_path.suffix}")
    grid_img.save(grid_out)


def collect_from_in_dir(in_dir: Path) -> List[Tuple[Path, Path]]:
    audios = sorted(list(in_dir.rglob("*.wav")) + list(in_dir.rglob("*.flac")))
    if not audios:
        raise SystemExit(f"No .wav/.flac files found under {in_dir}")
    return [(a, a.relative_to(in_dir).with_suffix(".png")) for a in audios]


def collect_from_pairs_csv(pairs_csv: Path, audio_col: str) -> List[Tuple[Path, Path]]:
    seen = set()
    pairs: List[Tuple[Path, Path]] = []
    with open(pairs_csv, "r", encoding="utf-8", newline="") as f:
        reader = csv.DictReader(f)
        if reader.fieldnames is None or audio_col not in reader.fieldnames:
            raise SystemExit(f"CSV must contain column '{audio_col}'")
        for row in reader:
            audio_str = str(row[audio_col]).strip()
            if not audio_str:
                continue
            audio_path = Path(audio_str)
            key = str(audio_path)
            if key in seen:
                continue
            seen.add(key)
            pairs.append((audio_path, Path(f"{audio_path.stem}.png")))
    if not pairs:
        raise SystemExit(f"No valid audio paths found in column '{audio_col}' from {pairs_csv}")
    return pairs


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate 768x768 mel spectrogram PNGs and numbered 4x4 grid overlays from audio."
    )
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--in-dir", type=str, help="Input root scanned recursively for .wav/.flac")
    src.add_argument("--pairs-csv", type=str, help="CSV file containing audio paths")

    parser.add_argument(
        "--pairs-audio-col",
        type=str,
        default="real_path",
        help="Audio path column when using --pairs-csv",
    )
    parser.add_argument("--out-dir", required=True)

    parser.add_argument("--overwrite", action="store_true", default=False)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)

    if args.in_dir:
        all_pairs = collect_from_in_dir(Path(args.in_dir))
    else:
        all_pairs = collect_from_pairs_csv(Path(args.pairs_csv), args.pairs_audio_col)

    pairs = all_pairs
    total = len(pairs)
    written = 0
    skipped_existing = 0
    missing_audio = 0

    print(f"source_total={len(all_pairs)} out_dir={out_dir}")

    for i, (audio_path, out_rel) in enumerate(pairs, 1):
        out_path = out_dir / out_rel
        grid_out = out_path.with_name(f"{out_path.stem}_grid{GRID_SIZE}x{GRID_SIZE}{out_path.suffix}")

        if out_path.exists() and grid_out.exists() and not args.overwrite:
            skipped_existing += 1
        elif not audio_path.exists():
            missing_audio += 1
        else:
            print(f"[{i}/{total}] generating {out_rel}")
            save_spec_and_grid(audio_path=audio_path, out_path=out_path)
            written += 1

        print(
            f"[{i}/{total}] written={written} skipped_existing={skipped_existing} "
            f"missing_audio={missing_audio}"
        )

    print(
        f"Done. total={total} written={written} skipped_existing={skipped_existing} "
        f"missing_audio={missing_audio} out_dir={out_dir}"
    )


if __name__ == "__main__":
    main()
