# Launch the authoritative BTM BBS server on this Windows PC, localhost only.
# Public access is a SEPARATE, explicit Tailscale Funnel command (see docs).
# Requires Node.js 20+; run as an ordinary user, NOT Administrator.
param(
 [ValidateRange(1024,65535)][int]$Port = 8787
)
Set-StrictMode -Version Latest
$ErrorActionPreference = 'Stop'
$repo = (Resolve-Path (Join-Path $PSScriptRoot '..')).Path
if (-not (Get-Command node -ErrorAction SilentlyContinue)) {
 throw 'Node.js is missing. Install the current Node.js LTS, then rerun.'
}
if (-not (Get-Command npm.cmd -ErrorAction SilentlyContinue)) {
 throw 'npm.cmd is missing. Install the current Node.js LTS, then rerun.'
}
$saveDir = Join-Path ([Environment]::GetFolderPath('LocalApplicationData')) 'BTM\BBS-Saves'
if (-not $saveDir) { throw 'Unable to locate the Windows local app data folder' }
New-Item -ItemType Directory -Path $saveDir -Force | Out-Null
Push-Location $repo
try {
 Write-Host 'Preparing BTM authoritative server (offline/browser assets + ws dependency)...'
 & npm.cmd ci --prefix server --omit=dev --ignore-scripts
 if ($LASTEXITCODE -ne 0) { throw 'Failed to install BTM server dependency' }
 & npm.cmd run build
 if ($LASTEXITCODE -ne 0) { throw 'BTM production build failed; server not exposed' }
 $trusted = @(
  'https://michaelwave369.github.io',
  'https://www.enterthefield.org',
  'https://enterthefield.org',
  'https://phi-field.com'
 )
 $arguments = @('server/index.mjs','--host','127.0.0.1','--port',"$Port",'--save-dir',$saveDir)
 foreach ($origin in $trusted) { $arguments += @('--origin',$origin) }
 Write-Host ""
 Write-Host "BTM local health: http://127.0.0.1:$Port/status"
 Write-Host "Private co-op saves: $saveDir"
 Write-Host 'To open PUBLIC access, use Tailscale Funnel from a separate PowerShell window.'
 Write-Host "tailscale funnel --bg $Port"
 Write-Host 'Use "tailscale funnel status" to copy your *.ts.net address.'
 Write-Host 'After stopping, turn off public access with: tailscale funnel --https=443 off'
 Write-Host 'Press Ctrl+C in this window to stop the BBS game server.'
 & node @arguments
 if ($LASTEXITCODE -ne 0) { throw "BTM host exited with error code $LASTEXITCODE" }
} finally {
 Pop-Location
}
