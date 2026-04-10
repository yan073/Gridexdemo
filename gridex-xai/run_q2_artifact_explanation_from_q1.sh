#!/bin/bash
set -euo pipefail

if [ -f "$HOME/.bashrc" ]; then
  source "$HOME/.bashrc"
fi

if command -v conda >/dev/null 2>&1; then
  eval "$(conda shell.bash hook)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")" && pwd)"

QWEN_VL_DIR="${QWEN_VL_DIR:-${SCRIPT_DIR}}"
Q1_OUTPUT_ROOT="${Q1_OUTPUT_ROOT:-}"
META_CSV="${META_CSV:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/SFT_2turn/stage1_gt_with_transcript.csv}"
MODEL_ID="${MODEL_ID:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/final_run/GRPO-2_Q2_gt_from_predmerged/v6-20260303-213206/v0-20260303-213248/checkpoint-4900-merged}"
OUTPUT_BASE_DIR="${OUTPUT_BASE_DIR:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/qwen_infer_only/q2}"
RUN_TAG="${RUN_TAG:-q2_infer_$(date +%Y%m%d_%H%M%S)}"

# Q2 user prompt placeholder source in q2_prompts/q2_user_prompt.txt:
#   "Explain the spoof artifact for each of the three selected region IDs in {prompt1_output} . This is the transcript for context: {transcript}"
# {prompt1_output} is read from Q1_OUTPUT_ROOT; {transcript} comes from META_CSV.

if [ -z "${Q1_OUTPUT_ROOT}" ]; then
  echo "[error] Q1_OUTPUT_ROOT is required. Use the q1_output_root printed by run_q1_region_selection_inference.sh." >&2
  exit 1
fi

QWEN_VL_DIR="${QWEN_VL_DIR}" \
Q1_OUTPUT_ROOT="${Q1_OUTPUT_ROOT}" \
META_CSV="${META_CSV}" \
MODEL_ID="${MODEL_ID}" \
OUTPUT_BASE_DIR="${OUTPUT_BASE_DIR}" \
RUN_TAG="${RUN_TAG}" \
  bash "${SCRIPT_DIR}/internal_launchers/launch_q2_artifact_explanation_shards.sh"
