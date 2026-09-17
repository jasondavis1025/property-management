$ErrorActionPreference = "Stop"
Set-Location (Join-Path $PSScriptRoot "..")

$envFile = Join-Path (Get-Location) ".env.local"
if (-not (Test-Path $envFile)) {
  Write-Error ".env.local not found. Add STRIPE_SECRET_KEY first."
}

Get-Content $envFile | ForEach-Object {
  if ($_ -match "^\s*STRIPE_SECRET_KEY=(.+)$") {
    $env:STRIPE_API_KEY = $matches[1].Trim()
  }
}

if (-not $env:STRIPE_API_KEY) {
  Write-Error "STRIPE_SECRET_KEY missing in .env.local"
}

Write-Host "Forwarding Stripe webhooks to http://localhost:3000/api/stripe/webhook"
Write-Host "Copy the whsec_... line into STRIPE_WEBHOOK_SECRET in .env.local, then restart npm run dev."
Write-Host ""

stripe listen --forward-to localhost:3000/api/stripe/webhook
