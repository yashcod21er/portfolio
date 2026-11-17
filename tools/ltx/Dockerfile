# Linux runtime for LTX-Video on an RTX 50-series GPU (needs CUDA 12.8 PyTorch builds).
FROM python:3.12-slim
ENV PIP_NO_CACHE_DIR=1 PYTHONUNBUFFERED=1 HF_HUB_DISABLE_TELEMETRY=1
RUN pip install --default-timeout=120 torch==2.7.1 --index-url https://download.pytorch.org/whl/cu128
RUN pip install --default-timeout=120 "diffusers==0.34.0" "transformers==4.53.2" "accelerate==1.8.1" \
    sentencepiece protobuf imageio imageio-ffmpeg "bitsandbytes==0.46.1"
# bitsandbytes' Triton kernels compile a small CUDA helper at import time
RUN apt-get update && apt-get install -y --no-install-recommends gcc libc6-dev && rm -rf /var/lib/apt/lists/*
WORKDIR /work
