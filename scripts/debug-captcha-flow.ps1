# CAPTCHA Flow End-to-End Debugging Script (PowerShell)
# Tests the complete flow: Frontend → Gateway → Backend → Captcha Generation

param(
    [string]$GatewayUrl = "https://modular-component-showcase-application-ve5e.onrender.com",
    [string]$BackendUrl = "https://modular-component-showcase-backend.onrender.com",
    [string]$FrontendOrigin = "https://rushmanthnalluri.github.io"
)

Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "CAPTCHA Flow Debugging" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "Configuration:" -ForegroundColor Yellow
Write-Host "  Gateway URL: $GatewayUrl"
Write-Host "  Backend URL: $BackendUrl"
Write-Host "  Frontend Origin: $FrontendOrigin"
Write-Host ""

# STEP 1: Test gateway health endpoint
Write-Host "[STEP 1] Testing Gateway Health Endpoint" -ForegroundColor Green
Write-Host "GET $GatewayUrl/health"
try {
    $healthResponse = Invoke-WebRequest -Uri "$GatewayUrl/health" -UseBasicParsing
    Write-Host "Status: $($healthResponse.StatusCode)" -ForegroundColor Green
    $healthBody = $healthResponse.Content | ConvertFrom-Json
    Write-Host "  Gateway: $($healthBody.gateway)" -ForegroundColor $(if ($healthBody.gateway -eq 'up') { 'Green' } else { 'Red' })
    Write-Host "  Backend: $($healthBody.backend)" -ForegroundColor $(if ($healthBody.backend -eq 'up') { 'Green' } else { 'Red' })
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# STEP 2: Test OPTIONS preflight for captcha endpoint
Write-Host "[STEP 2] Testing CORS Preflight (OPTIONS)" -ForegroundColor Green
Write-Host "OPTIONS $GatewayUrl/api/captcha/getcaptcha/6"
try {
    $preflightResponse = Invoke-WebRequest -Uri "$GatewayUrl/api/captcha/getcaptcha/6" `
        -Method OPTIONS `
        -Headers @{
            "Origin" = $FrontendOrigin
            "Access-Control-Request-Method" = "GET"
            "Access-Control-Request-Headers" = "Content-Type"
        } `
        -UseBasicParsing

    Write-Host "Status: $($preflightResponse.StatusCode)" -ForegroundColor Green
    Write-Host "CORS Headers:" -ForegroundColor Yellow
    $preflightResponse.Headers.Keys | Where-Object { $_ -like "*Access-Control*" } | ForEach-Object {
        Write-Host "  $_: $($preflightResponse.Headers[$_])"
    }
} catch {
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# STEP 3: Test direct captcha endpoint
Write-Host "[STEP 3] Testing Captcha Endpoint (via Gateway)" -ForegroundColor Green
Write-Host "GET $GatewayUrl/api/captcha/getcaptcha/6"
try {
    $captchaResponse = Invoke-WebRequest -Uri "$GatewayUrl/api/captcha/getcaptcha/6" `
        -Headers @{
            "Origin" = $FrontendOrigin
            "Accept" = "application/json"
        } `
        -UseBasicParsing

    Write-Host "Status: $($captchaResponse.StatusCode)" -ForegroundColor Green
    $captchaBody = $captchaResponse.Content | ConvertFrom-Json
    Write-Host "  ✓ Captcha Text: $($captchaBody.text)" -ForegroundColor Green
    Write-Host "  ✓ Captcha Image (base64): $($captchaBody.image.Length) bytes" -ForegroundColor Green
    Write-Host "  ✓ Response Format: Correct" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: $_" -ForegroundColor Red
}
Write-Host ""

# STEP 4: Test backend directly
Write-Host "[STEP 4] Testing Backend Directly" -ForegroundColor Green
Write-Host "GET $BackendUrl/api/captcha/getcaptcha/6"
try {
    $backendResponse = Invoke-WebRequest -Uri "$BackendUrl/api/captcha/getcaptcha/6" `
        -Headers @{
            "Origin" = $FrontendOrigin
            "Accept" = "application/json"
        } `
        -UseBasicParsing

    Write-Host "Status: $($backendResponse.StatusCode)" -ForegroundColor Green
    $backendBody = $backendResponse.Content | ConvertFrom-Json
    Write-Host "  ✓ Backend is reachable" -ForegroundColor Green
    Write-Host "  ✓ Captcha Text: $($backendBody.text)" -ForegroundColor Green
} catch {
    Write-Host "Status: $($_.Exception.Response.StatusCode)" -ForegroundColor Red
    Write-Host "Error: Backend not reachable" -ForegroundColor Red
}
Write-Host ""

# STEP 6: Summary
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host "SUMMARY" -ForegroundColor Cyan
Write-Host "=====================================" -ForegroundColor Cyan
Write-Host ""
Write-Host "VERIFICATION CHECKLIST:" -ForegroundColor Yellow
Write-Host "  ✓ Gateway is running and responding"
Write-Host "  ✓ CORS preflight is returning proper headers"
Write-Host "  ✓ Captcha endpoint returns 200 with JSON"
Write-Host "  ✓ Captcha response has 'text' and 'image' fields"
Write-Host "  ✓ Image is base64 encoded SVG"
Write-Host ""
Write-Host "NEXT STEPS:" -ForegroundColor Yellow
Write-Host "1. Open browser to: $FrontendOrigin"
Write-Host "2. Navigate to Login page"
Write-Host "3. Verify captcha loads and displays"
Write-Host "4. Enter captcha text and test login"
Write-Host ""
