#!/usr/bin/env python3
import argparse
import json
import sys
from pathlib import Path


def parse_args():
    parser = argparse.ArgumentParser(
        description="Create word-level timestamps from an audio file and print '[start-end] word' text."
    )
    parser.add_argument("--audio", required=True, help="Input audio file.")
    parser.add_argument(
        "--backend",
        default="auto",
        choices=("auto", "whisperx", "faster-whisper"),
        help="Alignment backend. auto tries whisperx first, then faster-whisper.",
    )
    parser.add_argument("--model", default="small", help="ASR model name or local path.")
    parser.add_argument("--language", default=None, help="Optional language code, e.g. en.")
    parser.add_argument("--device", default="auto", help="auto, cuda, or cpu.")
    parser.add_argument(
        "--compute-type",
        default="auto",
        help="auto, float16, int8, float32, etc. Backend-specific.",
    )
    parser.add_argument("--vad-filter", action="store_true", help="Use VAD filter for faster-whisper backend.")
    parser.add_argument("--output-txt", default=None, help="Output text path. Default: <audio>.word_times.txt")
    parser.add_argument("--output-json", default=None, help="Output JSON path. Default: <audio>.word_times.json")
    parser.add_argument(
        "--output-mfa-json",
        default=None,
        help="Optional MFA-like JSON path with tiers.words.entries = [[start, end, word], ...].",
    )
    return parser.parse_args()


def resolve_device(device):
    if device != "auto":
        return device
    try:
        import torch

        return "cuda" if torch.cuda.is_available() else "cpu"
    except Exception:
        return "cpu"


def resolve_compute_type(compute_type, device):
    if compute_type != "auto":
        return compute_type
    return "float16" if device == "cuda" else "int8"


def normalize_words(words):
    out = []
    for row in words:
        try:
            start = float(row["start"])
            end = float(row["end"])
        except Exception:
            continue
        word = str(row.get("word", "")).strip()
        if not word:
            continue
        out.append({"start": start, "end": end, "word": word})
    return out


def run_whisperx(args, device, compute_type):
    import whisperx

    audio_path = str(Path(args.audio).expanduser().resolve())
    model = whisperx.load_model(args.model, device=device, compute_type=compute_type)
    audio = whisperx.load_audio(audio_path)
    transcribe_kwargs = {}
    if args.language:
        transcribe_kwargs["language"] = args.language
    result = model.transcribe(audio, **transcribe_kwargs)
    language = args.language or result.get("language")
    if not language:
        raise RuntimeError("WhisperX did not detect a language. Pass --language, e.g. --language en.")

    align_model, metadata = whisperx.load_align_model(language_code=language, device=device)
    aligned = whisperx.align(
        result["segments"],
        align_model,
        metadata,
        audio,
        device,
        return_char_alignments=False,
    )
    return normalize_words(aligned.get("word_segments", []))


def run_faster_whisper(args, device, compute_type):
    from faster_whisper import WhisperModel

    model = WhisperModel(args.model, device=device, compute_type=compute_type)
    transcribe_kwargs = {"word_timestamps": True, "vad_filter": bool(args.vad_filter)}
    if args.language:
        transcribe_kwargs["language"] = args.language

    segments, _info = model.transcribe(str(Path(args.audio).expanduser().resolve()), **transcribe_kwargs)
    words = []
    for segment in segments:
        for word in segment.words or []:
            words.append({"start": word.start, "end": word.end, "word": word.word})
    return normalize_words(words)


def get_words(args, device, compute_type):
    backends = ["whisperx", "faster-whisper"] if args.backend == "auto" else [args.backend]
    errors = []
    for backend in backends:
        try:
            if backend == "whisperx":
                return run_whisperx(args, device, compute_type), backend
            if backend == "faster-whisper":
                return run_faster_whisper(args, device, compute_type), backend
        except Exception as exc:
            errors.append(f"{backend}: {exc}")
    raise RuntimeError("No backend succeeded:\n" + "\n".join(errors))


def format_word_times(words):
    return " ".join(f"[{w['start']:.2f}-{w['end']:.2f}] {w['word']}" for w in words)


def main():
    args = parse_args()
    audio = Path(args.audio).expanduser().resolve()
    if not audio.exists():
        raise FileNotFoundError(f"--audio does not exist: {audio}")

    device = resolve_device(args.device)
    compute_type = resolve_compute_type(args.compute_type, device)
    words, backend = get_words(args, device, compute_type)
    text = format_word_times(words)

    out_txt = Path(args.output_txt).expanduser().resolve() if args.output_txt else audio.with_suffix(audio.suffix + ".word_times.txt")
    out_json = Path(args.output_json).expanduser().resolve() if args.output_json else audio.with_suffix(audio.suffix + ".word_times.json")

    out_txt.parent.mkdir(parents=True, exist_ok=True)
    out_json.parent.mkdir(parents=True, exist_ok=True)
    out_txt.write_text(text + "\n", encoding="utf-8")
    out_json.write_text(
        json.dumps(
            {
                "audio": str(audio),
                "backend": backend,
                "model": args.model,
                "language": args.language,
                "words": words,
                "text": text,
            },
            ensure_ascii=False,
            indent=2,
        ),
        encoding="utf-8",
    )

    if args.output_mfa_json:
        out_mfa = Path(args.output_mfa_json).expanduser().resolve()
        out_mfa.parent.mkdir(parents=True, exist_ok=True)
        entries = [[w["start"], w["end"], w["word"]] for w in words]
        out_mfa.write_text(
            json.dumps({"tiers": {"words": {"entries": entries}}}, ensure_ascii=False, indent=2),
            encoding="utf-8",
        )
        print(f"saved_mfa_json: {out_mfa}")

    print(text)
    print(f"saved_txt: {out_txt}")
    print(f"saved_json: {out_json}")
    print(f"backend: {backend}")


if __name__ == "__main__":
    try:
        main()
    except Exception as exc:
        print(f"[error] {exc}", file=sys.stderr)
        sys.exit(1)
