# Generate the hero clip locally with LTX-Video in Docker (RTX GPU required).
#   powershell -ExecutionPolicy Bypass -File tools\ltx\run.ps1
# Resumes the model download where it stopped (Docker volume "yh-hf").
# Output: tools\ltx\clip.mp4   ·   log: tools\ltx\run.log   ·   progress: node tools\ltx\progress.mjs run.log
$ErrorActionPreference = 'Stop'
$here = Split-Path -Parent $MyInvocation.MyCommand.Path

docker info *> $null
if ($LASTEXITCODE -ne 0) { Write-Host 'Start Docker Desktop first, then run this again.'; exit 1 }

docker image inspect yh-ltx *> $null
if ($LASTEXITCODE -ne 0) {
  Write-Host 'Building the generator image (first time only)...'
  docker build -t yh-ltx $here
}
docker volume create yh-hf | Out-Null

function Invoke-Gen([string[]]$extra) {
  $log = Join-Path $here 'run.log'
  # cmd does the redirect: Windows PowerShell would turn the model's stderr warnings
  # into terminating errors and kill the run.
  $cmdline = 'docker run --rm --gpus all -v "' + $here + ':/work" -v yh-hf:/root/.cache/huggingface ' +
             'yh-ltx python gen.py portrait.webp clip.mp4 ' + ($extra -join ' ') + ' > "' + $log + '" 2>&1'
  cmd /c $cmdline
  return $LASTEXITCODE
}

Write-Host 'Downloading the model (resumes) and generating 768x576, 97 frames...'
if ((Invoke-Gen @('--frames', '97', '--steps', '40', '--w', '768', '--h', '576')) -ne 0) {
  Write-Host 'Full size failed (likely GPU memory). Retrying at 640x480, 65 frames...'
  if ((Invoke-Gen @('--frames', '65', '--steps', '35', '--w', '640', '--h', '480')) -ne 0) {
    Write-Host "Generation failed. See $here\run.log"; exit 1
  }
}
Write-Host "Done: $here\clip.mp4"
