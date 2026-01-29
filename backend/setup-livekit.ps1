# LiveKit Configuration Script
# This script creates the .env file with LiveKit credentials

$envContent = @"
PORT=4000
MONGODB_URI=mongodb://localhost:27017/command-center
JWT_SECRET=your-secret-key-change-in-production
NODE_ENV=development
FRONTEND_URL=http://localhost:3000

# LiveKit Configuration
LIVEKIT_URL=wss://family-tree-z2e5ucpb.livekit.cloud
LIVEKIT_API_KEY=APIEQoDjNRiSxUA
LIVEKIT_API_SECRET=eeIs6xFAcMHNGRX24uF2lQ3AxESAS5TGeRwkdOfUwc4A
"@

$envPath = Join-Path $PSScriptRoot ".env"

if (Test-Path $envPath) {
    Write-Host "⚠️  .env file already exists. Backing up to .env.backup..." -ForegroundColor Yellow
    Copy-Item $envPath "$envPath.backup"
}

$envContent | Out-File -FilePath $envPath -Encoding utf8 -NoNewline

Write-Host "✅ LiveKit configuration saved to backend/.env" -ForegroundColor Green
Write-Host "`nConfiguration:" -ForegroundColor Cyan
Write-Host "  LIVEKIT_URL: wss://family-tree-z2e5ucpb.livekit.cloud" -ForegroundColor White
Write-Host "  LIVEKIT_API_KEY: APIEQoDjNRiSxUA" -ForegroundColor White
Write-Host "  LIVEKIT_API_SECRET: [Configured]`n" -ForegroundColor White
Write-Host "📝 Please restart your backend server to apply changes." -ForegroundColor Yellow
