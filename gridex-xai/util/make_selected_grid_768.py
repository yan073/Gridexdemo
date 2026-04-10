#!/usr/bin/env python3
import argparse
from pathlib import Path
from typing import List, Optional, Sequence, Tuple

from PIL import Image, ImageDraw, ImageFont

IMAGE_SIZE = 768
GRID_SIZE = 4
LINE_WIDTH = 2
FONT_SIZE = 24
SELECTED_SUFFIX = "_selected_grid4x4"
GRID_SUFFIX = f"_grid{GRID_SIZE}x{GRID_SIZE}"


def get_selected_region_ids(spec_path: Path) -> List[int]:
    # TODO(engineers): Replace these placeholder IDs with the selected region IDs
    # for this spectrogram. This can come from a CSV lookup, model output, or an
    # experiment config keyed by spec_path.stem. Return exactly three 1-based IDs.
    return [1, 2, 3]


def validate_region_ids(region_ids: Sequence[int]) -> List[int]:
    ids = [int(region_id) for region_id in region_ids]
    if len(ids) != 3:
        raise ValueError(f"Expected exactly 3 selected region IDs, got {len(ids)}: {ids}")
    if len(set(ids)) != len(ids):
        raise ValueError(f"Selected region IDs must be distinct: {ids}")

    max_region_id = GRID_SIZE * GRID_SIZE
    invalid = [region_id for region_id in ids if region_id < 1 or region_id > max_region_id]
    if invalid:
        raise ValueError(f"Region IDs must be between 1 and {max_region_id}, got: {invalid}")
    return ids


def region_bounds(region_id: int, width: int, height: int) -> Tuple[int, int, int, int]:
    index = region_id - 1
    row = index // GRID_SIZE
    col = index % GRID_SIZE
    x1 = round(col * width / GRID_SIZE)
    x2 = round((col + 1) * width / GRID_SIZE)
    y1 = round(row * height / GRID_SIZE)
    y2 = round((row + 1) * height / GRID_SIZE)
    return x1, y1, x2, y2


def load_font(size: int) -> ImageFont.ImageFont:
    try:
        return ImageFont.truetype("assets/arial.ttf", size)
    except OSError:
        return ImageFont.load_default()


def blend_image_with_color(img: Image.Image, color: Tuple[int, int, int], alpha: float) -> Image.Image:
    overlay = Image.new("RGB", img.size, color)
    return Image.blend(img.convert("RGB"), overlay, alpha)


def draw_grid(draw: ImageDraw.ImageDraw, width: int, height: int) -> None:
    for idx in range(1, GRID_SIZE):
        x = round(idx * width / GRID_SIZE)
        y = round(idx * height / GRID_SIZE)
        draw.line([(x, 0), (x, height)], fill=(255, 255, 255), width=LINE_WIDTH)
        draw.line([(0, y), (width, y)], fill=(255, 255, 255), width=LINE_WIDTH)


def draw_centered_label(
    draw: ImageDraw.ImageDraw,
    label: str,
    x1: int,
    y1: int,
    x2: int,
    y2: int,
    font: ImageFont.ImageFont,
) -> None:
    bbox = draw.textbbox((0, 0), label, font=font)
    text_w = bbox[2] - bbox[0]
    text_h = bbox[3] - bbox[1]
    left = round((x1 + x2 - text_w) / 2)
    top = round((y1 + y2 - text_h) / 2)
    draw.rectangle(
        [(left - 4, top - 3), (left + text_w + 4, top + text_h + 3)],
        fill=(255, 235, 120),
    )
    draw.text((left, top), label, font=font, fill=(20, 20, 20))


def render_selected_grid(spec_img: Image.Image, selected_region_ids: Sequence[int]) -> Image.Image:
    selected_ids = validate_region_ids(selected_region_ids)
    spec_img = spec_img.convert("RGB").resize((IMAGE_SIZE, IMAGE_SIZE), Image.BICUBIC)

    muted = blend_image_with_color(spec_img, (205, 208, 214), alpha=0.72)
    highlighted = blend_image_with_color(spec_img, (255, 235, 120), alpha=0.68)
    out = muted.copy()

    width, height = out.size
    for region_id in selected_ids:
        box = region_bounds(region_id, width, height)
        out.paste(highlighted.crop(box), box)

    draw = ImageDraw.Draw(out)
    draw_grid(draw, width, height)

    font = load_font(FONT_SIZE)
    for region_id in selected_ids:
        x1, y1, x2, y2 = region_bounds(region_id, width, height)
        draw_centered_label(draw, str(region_id), x1, y1, x2, y2, font)

    return out


def is_step1_spec_png(path: Path) -> bool:
    return path.suffix.lower() == ".png" and not path.stem.endswith(GRID_SUFFIX) and not path.stem.endswith(SELECTED_SUFFIX)


def collect_spec_pngs(in_dir: Path) -> List[Path]:
    specs = sorted(path for path in in_dir.rglob("*.png") if is_step1_spec_png(path))
    if not specs:
        raise SystemExit(f"No step-1 spectrogram PNGs found under {in_dir}")
    return specs


def selected_out_path(spec_path: Path, in_dir: Optional[Path], out_dir: Path) -> Path:
    if in_dir is None:
        rel = spec_path.with_name(f"{spec_path.stem}{SELECTED_SUFFIX}{spec_path.suffix}").name
        return out_dir / rel
    rel = spec_path.relative_to(in_dir)
    return out_dir / rel.with_name(f"{rel.stem}{SELECTED_SUFFIX}{rel.suffix}")


def main() -> None:
    parser = argparse.ArgumentParser(
        description="Generate step-3 selected-region 4x4 grid overlays from 768x768 spectrogram PNGs."
    )
    src = parser.add_mutually_exclusive_group(required=True)
    src.add_argument("--spec-img", type=str, help="Single step-1 spectrogram PNG")
    src.add_argument("--in-dir", type=str, help="Directory containing step-1 spectrogram PNGs")
    parser.add_argument("--out-dir", required=True)
    parser.add_argument("--overwrite", action="store_true", default=False)
    args = parser.parse_args()

    out_dir = Path(args.out_dir)
    in_dir = Path(args.in_dir) if args.in_dir else None
    specs = collect_spec_pngs(in_dir) if in_dir else [Path(args.spec_img)]

    written = 0
    skipped_existing = 0

    for i, spec_path in enumerate(specs, 1):
        out_path = selected_out_path(spec_path, in_dir, out_dir)
        if out_path.exists() and not args.overwrite:
            skipped_existing += 1
        else:
            region_ids = get_selected_region_ids(spec_path)
            selected_grid = render_selected_grid(Image.open(spec_path), region_ids)
            out_path.parent.mkdir(parents=True, exist_ok=True)
            selected_grid.save(out_path)
            written += 1

        print(f"[{i}/{len(specs)}] written={written} skipped_existing={skipped_existing}")

    print(f"Done. total={len(specs)} written={written} skipped_existing={skipped_existing} out_dir={out_dir}")


if __name__ == "__main__":
    main()
