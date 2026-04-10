#!/bin/bash
set -euo pipefail

if [ -f "$HOME/.bashrc" ]; then
  source "$HOME/.bashrc"
fi

if command -v conda >/dev/null 2>&1; then
  eval "$(conda shell.bash hook)"
fi

SCRIPT_DIR="$(cd "$(dirname "${BASH_SOURCE[0]}")/.." && pwd)"

QWEN_VL_DIR="${QWEN_VL_DIR:-${SCRIPT_DIR}}"
Q1_OUTPUT_ROOT="${Q1_OUTPUT_ROOT:-}"
META_CSV="${META_CSV:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/SFT_2turn/stage1_gt_with_transcript.csv}"
MODEL_ID="${MODEL_ID:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/final_run/GRPO-2_Q2_gt_from_predmerged/v6-20260303-213206/v0-20260303-213248/checkpoint-4900-merged}"
OUTPUT_BASE_DIR="${OUTPUT_BASE_DIR:-/datasets/work/dss-deepfake-audio/work/data/datasets/interspeech/qwen_infer_only/q2}"
RUN_TAG="${RUN_TAG:-q2_infer_$(date +%Y%m%d_%H%M%S)}"
SHARD_COUNT="${SHARD_COUNT:-4}"
MAX_CONCURRENT_SHARDS="${MAX_CONCURRENT_SHARDS:-${SHARD_COUNT}}"
OVERWRITE="${OVERWRITE:-1}"
GPU_IDS="${GPU_IDS:-0,1,2,3}"
CONDA_ENV_NAME="${CONDA_ENV_NAME:-vllm}"
MAX_NEW_TOKENS="${MAX_NEW_TOKENS:-600}"
BATCH_SIZE="${BATCH_SIZE:-1}"
DTYPE="${DTYPE:-auto}"
ATTN_IMPLEMENTATION="${ATTN_IMPLEMENTATION:-eager}"
DEVICE_MAP="${DEVICE_MAP:-auto}"
IMAGE_FOLDER="${IMAGE_FOLDER:-}"
IMG_STEM_CONTAINS="${IMG_STEM_CONTAINS:-_LA_D_}"
MAX_ITEMS="${MAX_ITEMS:-}"
PRINT_MESSAGES="${PRINT_MESSAGES:-0}"

# Q2 user prompt placeholder source in q2_prompts/q2_user_prompt.txt:
#   "Explain the spoof artifact for each of the three selected region IDs in {prompt1_output} . This is the transcript for context: {transcript}"
# {prompt1_output} is read from Q1_OUTPUT_ROOT; {transcript} comes from META_CSV.
SYSTEM_FILE="${SYSTEM_FILE:-${QWEN_VL_DIR}/q2_prompts/q2_system_prompt.txt}"
USER_TEMPLATE_FILE="${USER_TEMPLATE_FILE:-${QWEN_VL_DIR}/q2_prompts/q2_user_prompt.txt}"

if [ -z "${Q1_OUTPUT_ROOT}" ]; then
  echo "[error] Q1_OUTPUT_ROOT is required. Use the q1_output_root printed by run_q1_region_selection_inference.sh." >&2
  exit 1
fi

if [ ! -d "${QWEN_VL_DIR}" ]; then
  echo "[error] QWEN_VL_DIR does not exist: ${QWEN_VL_DIR}" >&2
  exit 1
fi
if [ ! -f "${QWEN_VL_DIR}/infer_q2_artifact_explanation_from_q1_json.py" ]; then
  echo "[error] missing Q2 runner: ${QWEN_VL_DIR}/infer_q2_artifact_explanation_from_q1_json.py" >&2
  exit 1
fi
if [ ! -d "${Q1_OUTPUT_ROOT}" ]; then
  echo "[error] Q1_OUTPUT_ROOT does not exist or is not a directory: ${Q1_OUTPUT_ROOT}" >&2
  exit 1
fi
if [ ! -f "${META_CSV}" ]; then
  echo "[error] META_CSV does not exist: ${META_CSV}" >&2
  exit 1
fi
if [ ! -f "${SYSTEM_FILE}" ]; then
  echo "[error] SYSTEM_FILE does not exist: ${SYSTEM_FILE}" >&2
  exit 1
fi
if [ ! -f "${USER_TEMPLATE_FILE}" ]; then
  echo "[error] USER_TEMPLATE_FILE does not exist: ${USER_TEMPLATE_FILE}" >&2
  exit 1
fi

MODEL_TAG="$(basename "${MODEL_ID%/}" | tr -cs 'A-Za-z0-9._-' '_')"
RUN_DIR="${OUTPUT_BASE_DIR%/}/${MODEL_TAG}/${RUN_TAG}"
mkdir -p "${RUN_DIR}" "${RUN_DIR}/logs"

echo "[run] QWEN_VL_DIR=${QWEN_VL_DIR}"
echo "[run] MODEL_ID=${MODEL_ID}"
echo "[run] META_CSV=${META_CSV}"
echo "[run] Q1_OUTPUT_ROOT=${Q1_OUTPUT_ROOT}"
echo "[run] RUN_DIR=${RUN_DIR}"
echo "[run] SHARD_COUNT=${SHARD_COUNT}"
echo "[run] MAX_CONCURRENT_SHARDS=${MAX_CONCURRENT_SHARDS}"
echo "[run] GPU_IDS=${GPU_IDS}"
echo "[run] SYSTEM_FILE=${SYSTEM_FILE}"
echo "[run] USER_TEMPLATE_FILE=${USER_TEMPLATE_FILE}"

conda activate "${CONDA_ENV_NAME}"

IFS=',' read -r -a GPU_ID_ARRAY <<< "${GPU_IDS}"
if [ "${#GPU_ID_ARRAY[@]}" -eq 0 ]; then
  echo "[error] GPU_IDS must contain at least one GPU id." >&2
  exit 1
fi

pids=()
shards=()

wait_for_one_if_needed() {
  while [ "${#pids[@]}" -ge "${MAX_CONCURRENT_SHARDS}" ]; do
    local pid="${pids[0]}"
    local shard="${shards[0]}"
    if wait "${pid}"; then
      echo "[ok] shard=${shard} pid=${pid}"
    else
      echo "[fail] shard=${shard} pid=${pid}" >&2
      tail -n 80 "${RUN_DIR}/logs/q2_shard_${shard}_${RUN_TAG}.log" || true
      exit 1
    fi
    pids=("${pids[@]:1}")
    shards=("${shards[@]:1}")
  done
}

for ((shard_id=0; shard_id<SHARD_COUNT; shard_id++)); do
  wait_for_one_if_needed

  gpu="${GPU_ID_ARRAY[$((shard_id % ${#GPU_ID_ARRAY[@]}))]}"
  shard_dir="${RUN_DIR}/shard_${shard_id}_of_${SHARD_COUNT}"
  out_jsonl="${RUN_DIR}/qwen_query2_outputs_shard_${shard_id}.jsonl"
  log_file="${RUN_DIR}/logs/q2_shard_${shard_id}_${RUN_TAG}.log"
  mkdir -p "${shard_dir}"

  cmd=(python -u "${QWEN_VL_DIR}/infer_q2_artifact_explanation_from_q1_json.py"
    --model-id "${MODEL_ID}"
    --meta-csv "${META_CSV}"
    --image-folder "${IMAGE_FOLDER}"
    --prompt1-json-root "${Q1_OUTPUT_ROOT}"
    --img-stem-contains "${IMG_STEM_CONTAINS}"
    --num-shards "${SHARD_COUNT}"
    --shard-id "${shard_id}"
    --system-file "${SYSTEM_FILE}"
    --user-template-file "${USER_TEMPLATE_FILE}"
    --device-map "${DEVICE_MAP}"
    --dtype "${DTYPE}"
    --attn-implementation "${ATTN_IMPLEMENTATION}"
    --max-new-tokens "${MAX_NEW_TOKENS}"
    --batch-size "${BATCH_SIZE}"
    --output-dir "${shard_dir}"
    --output-jsonl "${out_jsonl}")

  if [ -n "${MAX_ITEMS}" ]; then
    cmd+=(--max-items "${MAX_ITEMS}")
  fi
  if [ "${OVERWRITE}" = "1" ]; then
    cmd+=(--overwrite)
  fi
  if [ "${PRINT_MESSAGES}" = "1" ]; then
    cmd+=(--print-messages)
  fi

  echo "[launch] shard=${shard_id} gpu=${gpu} log=${log_file}"
  CUDA_VISIBLE_DEVICES="${gpu}" "${cmd[@]}" > "${log_file}" 2>&1 &
  pids+=("$!")
  shards+=("${shard_id}")
done

fail=0
set +e
for idx in "${!pids[@]}"; do
  pid="${pids[$idx]}"
  shard="${shards[$idx]}"
  wait "${pid}"
  rc=$?
  if [ "${rc}" -ne 0 ]; then
    fail=1
    echo "[fail] shard=${shard} pid=${pid} rc=${rc}" >&2
    tail -n 80 "${RUN_DIR}/logs/q2_shard_${shard}_${RUN_TAG}.log" || true
  else
    echo "[ok] shard=${shard} pid=${pid}"
  fi
done
set -e

if [ "${fail}" -ne 0 ]; then
  echo "[done] one or more Q2 shards failed." >&2
  exit 1
fi

MERGED_JSONL="${RUN_DIR}/qwen_query2_outputs.jsonl"
rm -f "${MERGED_JSONL}"
for ((shard_id=0; shard_id<SHARD_COUNT; shard_id++)); do
  shard_jsonl="${RUN_DIR}/qwen_query2_outputs_shard_${shard_id}.jsonl"
  if [ -f "${shard_jsonl}" ]; then
    cat "${shard_jsonl}" >> "${MERGED_JSONL}"
  fi
done

echo "[done] q2_run_dir=${RUN_DIR}"
echo "[done] q2_result_jsonl=${MERGED_JSONL}"
