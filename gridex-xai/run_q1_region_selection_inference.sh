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
MODEL_ID="${MODEL_ID:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/final_run/GRPO-1/stage2_grpo1_from_v44_ckpt2579_1epoch/v0-20260301-102003/checkpoint-1500-merged}"
META_JSON="${META_JSON:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/final_run/data/stage1_query1_val_swift.json}"
OUTPUT_BASE_DIR="${OUTPUT_BASE_DIR:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/qwen_infer_only/q1}"
SHARD_COUNT="${SHARD_COUNT:-4}"
OVERWRITE="${OVERWRITE:-1}"
RUN_TAG="${RUN_TAG:-q1_infer_$(date +%Y%m%d_%H%M%S)}"

MODEL_TAG="$(basename "${MODEL_ID%/}" | tr -cs 'A-Za-z0-9._-' '_')"
RUN_DIR="${OUTPUT_BASE_DIR%/}/${MODEL_TAG}/${RUN_TAG}"

# Placeholder output root for Q1 predictions. Pass this path to the Q2 script as Q1_OUTPUT_ROOT.
Q1_OUTPUT_ROOT="${Q1_OUTPUT_ROOT:-${RUN_DIR}/merged_for_q2}"
MERGED_DIR="${Q1_OUTPUT_ROOT}"

mkdir -p "${RUN_DIR}" "${MERGED_DIR}"

echo "[run] QWEN_VL_DIR=${QWEN_VL_DIR}"
echo "[run] MODEL_ID=${MODEL_ID}"
echo "[run] META_JSON=${META_JSON}"
echo "[run] RUN_DIR=${RUN_DIR}"
echo "[run] MERGED_DIR=${MERGED_DIR}"
echo "[run] SHARD_COUNT=${SHARD_COUNT}"

conda activate vllm
cd "${SCRIPT_DIR}"
MODEL_ID="${MODEL_ID}" \
OUTPUT_BASE_DIR="${OUTPUT_BASE_DIR}" \
META_JSON="${META_JSON}" \
RUN_TAG="${RUN_TAG}" \
SHARD_COUNT="${SHARD_COUNT}" \
OVERWRITE="${OVERWRITE}" \
SCRIPT_DIR_OVERRIDE="${QWEN_VL_DIR}" \
  bash "${SCRIPT_DIR}/internal_launchers/launch_q1_region_selection_shards.sh"

for shard_dir in "${RUN_DIR}"/shard_*_of_${SHARD_COUNT}; do
  if [ -d "${shard_dir}" ]; then
    cp -rn "${shard_dir}"/* "${MERGED_DIR}/" || true
  fi
done

echo "[done] q1_run_dir=${RUN_DIR}"
echo "[done] q1_output_root=${MERGED_DIR}"
echo "[done] q2_input_hint=Q1_OUTPUT_ROOT=${MERGED_DIR}"
