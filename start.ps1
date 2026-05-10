# MPBS Project Startup Script
# This script ensures backend starts and is ready before launching frontend

Write-Host "========================================" -ForegroundColor Cyan
Write-Host "   MPBS Project Startup" -ForegroundColor Cyan
Write-Host "========================================" -ForegroundColor Cyan
Write-Host ""

# Function to check if backend is ready
function Test-BackendReady {
    try {
        $response = Invoke-WebRequest -Uri "http://localhost:4000/health" -Method GET -UseBasicParsing -TimeoutSec 2 -ErrorAction Stop
        return $response.StatusCode -eq 200
    } catch {
        return $false
    }
}

# Function to start backend
function Start-Backend {
    Write-Host "[1/3] Starting Backend Server..." -ForegroundColor Yellow
    
    # Kill any existing node processes on port 4000
    $existingProcess = Get-NetTCPConnection -LocalPort 4000 -ErrorAction SilentlyContinue | Select-Object -ExpandProperty OwningProcess -First 1
    if ($existingProcess) {
        Write-Host "  → Stopping existing process on port 4000..." -ForegroundColor Gray
        Stop-Process -Id $existingProcess -Force -ErrorAction SilentlyContinue
        Start-Sleep -Seconds 2
    }
    
    # Start backend in new window
    $backendPath = Join-Path $PSScriptRoot "backend"
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$backendPath'; npm run dev" -WindowStyle Normal
    
    # Wait for backend to be ready
    Write-Host "  → Waiting for backend to be ready..." -ForegroundColor Gray
    $maxWait = 30
    $waited = 0
    while (-not (Test-BackendReady) -and $waited -lt $maxWait) {
        Start-Sleep -Seconds 1
        $waited++
        Write-Host "." -NoNewline -ForegroundColor Gray
    }
    Write-Host ""
    
    if (Test-BackendReady) {
        Write-Host "  ✓ Backend is ready!" -ForegroundColor Green
        return $true
    } else {
        Write-Host "  ✗ Backend failed to start within ${maxWait}s" -ForegroundColor Red
        return $false
    }
}

# Function to start frontend
function Start-Frontend {
    Write-Host "[2/3] Starting Frontend Server..." -ForegroundColor Yellow
    Start-Process powershell -ArgumentList "-NoExit", "-Command", "cd '$PSScriptRoot'; npm run dev" -WindowStyle Normal
    Write-Host "  ✓ Frontend server started!" -ForegroundColor Green
}

# Main execution
try {
    # Start backend
    if (-not (Start-Backend)) {
        Write-Host ""
        Write-Host "Failed to start backend. Please check backend/src/server.js for errors." -ForegroundColor Red
        exit 1
    }
    
    Start-Sleep -Seconds 1
    
    # Start frontend
    Start-Frontend
    
    Write-Host ""
    Write-Host "[3/3] Both servers are running!" -ForegroundColor Green
    Write-Host ""
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host "  🚀 Backend:  http://localhost:4000" -ForegroundColor Green
    Write-Host "  🌐 Frontend: http://localhost:5173" -ForegroundColor Green
    Write-Host "========================================" -ForegroundColor Cyan
    Write-Host ""
    Write-Host "Press any key to exit..." -ForegroundColor Gray
    $null = $Host.UI.RawUI.ReadKey("NoEcho,IncludeKeyDown")
    
} catch {
    Write-Host ""
    Write-Host "Error: $_" -ForegroundColor Red
    exit 1
}
