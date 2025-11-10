# Backend Server Startup Script
# Run this to start the backend with PDF upload support

# Windows PowerShell
Write-Host "🚀 Starting AI Image Project Backend Server..." -ForegroundColor Green
Write-Host "📁 Location: ai__backend/" -ForegroundColor Yellow

# Navigate to backend directory
Set-Location -Path "ai__backend"

# Check if required files exist
$requiredFiles = @("server.js", "pdf-uploads.js", "pdf-upload-service.js", "package.json")
$missingFiles = @()

foreach ($file in $requiredFiles) {
    if (-not (Test-Path $file)) {
        $missingFiles += $file
    }
}

if ($missingFiles.Count -gt 0) {
    Write-Host "❌ Missing required files:" -ForegroundColor Red
    foreach ($file in $missingFiles) {
        Write-Host "   - $file" -ForegroundColor Red
    }
    Write-Host "Please ensure all backend files are properly created." -ForegroundColor Red
    exit 1
}

# Check if node_modules exist
if (-not (Test-Path "node_modules")) {
    Write-Host "📦 Installing dependencies..." -ForegroundColor Yellow
    npm install
    if ($LASTEXITCODE -ne 0) {
        Write-Host "❌ Failed to install dependencies" -ForegroundColor Red
        exit 1
    }
}

# Check if .env file exists
if (-not (Test-Path ".env")) {
    Write-Host "⚠️  .env file not found. Using default configuration." -ForegroundColor Yellow
}

Write-Host "🔥 Starting server on port 3002..." -ForegroundColor Green
Write-Host "💡 Open http://localhost:3002/health to test" -ForegroundColor Cyan
Write-Host "📄 PDF Upload: http://localhost:3002/api/upload-pdf" -ForegroundColor Cyan
Write-Host "🛑 Press Ctrl+C to stop the server" -ForegroundColor Yellow
Write-Host ""

# Start the server
npm start