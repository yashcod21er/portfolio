"""
Image-to-video with LTX-Video 0.9.5 (2B), sized for an 8 GB GPU and 16 GB of RAM.

  python gen.py <image> <out.mp4> [--frames 97] [--steps 40] [--seed 7] [--w 768] [--h 576]

Memory plan:
  1. T5-XXL text encoder runs alone on the CPU, prompt embeddings are kept, encoder freed.
  2. The video pipeline loads WITHOUT the text encoder; model CPU offload moves the
     transformer / VAE onto the GPU only while each one runs; VAE decodes in tiles.
"""
import argparse
import gc
import time

import torch
from diffusers import LTXConditionPipeline
from diffusers.pipelines.ltx.pipeline_ltx_condition import LTXVideoCondition
from diffusers.utils import export_to_video, load_image
from transformers import BitsAndBytesConfig, T5EncoderModel, T5TokenizerFast

REPO = "Lightricks/LTX-Video-0.9.5"
MAX_LEN = 256

PROMPT = (
    "A young man with curly black hair, dark sunglasses and a short beard, wearing an open-collared "
    "white shirt, sits in front of a weathered ochre wall. He slowly turns his head to look to his left, "
    "then slowly turns to look to his right, then turns back to face the camera and gives a slight, "
    "confident smile. His body stays still. Static camera, soft natural daylight, realistic skin texture, "
    "sharp focus, cinematic, high detail."
)
NEGATIVE = (
    "worst quality, low quality, blurry, jittery, inconsistent motion, distorted face, deformed face, "
    "morphing, warping, extra limbs, extra fingers, camera movement, zoom, text, watermark"
)

ap = argparse.ArgumentParser()
ap.add_argument("image")
ap.add_argument("out")
ap.add_argument("--frames", type=int, default=97)  # must be 8k+1
ap.add_argument("--steps", type=int, default=40)
ap.add_argument("--seed", type=int, default=7)
ap.add_argument("--w", type=int, default=768)  # multiples of 32
ap.add_argument("--h", type=int, default=576)
ap.add_argument("--prompt", default=PROMPT)
a = ap.parse_args()

t0 = time.time()
dtype = torch.bfloat16

# ---- 1. prompt embeddings: T5-XXL in 8-bit on the GPU (~5 GB), then freed -------------
print("Encoding prompt (T5 8-bit on GPU)…", flush=True)
tok = T5TokenizerFast.from_pretrained(REPO, subfolder="tokenizer")
enc = T5EncoderModel.from_pretrained(
    REPO,
    subfolder="text_encoder",
    quantization_config=BitsAndBytesConfig(load_in_8bit=True),
    torch_dtype=torch.float16,
    device_map="cuda",
    low_cpu_mem_usage=True,
)


@torch.no_grad()
def embed(text: str):
    t = tok([text], padding="max_length", max_length=MAX_LEN, truncation=True, add_special_tokens=True, return_tensors="pt")
    e = enc(t.input_ids.to("cuda"), attention_mask=t.attention_mask.to("cuda"))[0]
    return e.to("cpu", dtype), t.attention_mask


pe, pm = embed(a.prompt)
ne, nm = embed(NEGATIVE)
del enc
gc.collect()
torch.cuda.empty_cache()
print(f"  done in {time.time() - t0:.0f}s", flush=True)

# ---- 2. video pipeline without the text encoder, all on the GPU (2B bf16 ≈ 4 GB) ----------
pipe = LTXConditionPipeline.from_pretrained(REPO, text_encoder=None, tokenizer=None, torch_dtype=dtype)
pipe.to("cuda")
pipe.vae.enable_tiling()

image = load_image(a.image).convert("RGB").resize((a.w, a.h))
cond = LTXVideoCondition(image=image, frame_index=0)

print(f"Generating {a.frames} frames at {a.w}x{a.h}, {a.steps} steps…", flush=True)
t1 = time.time()
video = pipe(
    conditions=[cond],
    # the pipeline does not move caller-supplied embeddings to its device
    prompt_embeds=pe.to("cuda"),
    prompt_attention_mask=pm.to("cuda"),
    negative_prompt_embeds=ne.to("cuda"),
    negative_prompt_attention_mask=nm.to("cuda"),
    width=a.w,
    height=a.h,
    num_frames=a.frames,
    frame_rate=24,
    num_inference_steps=a.steps,
    guidance_scale=3.0,
    decode_timestep=0.05,
    decode_noise_scale=0.025,
    generator=torch.Generator("cpu").manual_seed(a.seed),
).frames[0]
print(f"  generated in {time.time() - t1:.0f}s; peak VRAM {torch.cuda.max_memory_allocated() / 1e9:.1f} GB", flush=True)

export_to_video(video, a.out, fps=24)
print(f"Saved {a.out} ({len(video)} frames) — total {time.time() - t0:.0f}s", flush=True)
