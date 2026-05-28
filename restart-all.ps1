Stop-Process -Name node -Force -ErrorAction SilentlyContinue
Stop-Process -Name npx -Force -ErrorAction SilentlyContinue
Start-Sleep -Seconds 2

Start-Process -FilePath node -ArgumentList 'server/src/server.js' -WorkingDirectory D:\faq -NoNewWindow
Start-Sleep -Seconds 3

Start-Process -FilePath npx -ArgumentList 'vite','--host' -WorkingDirectory D:\faq\client -NoNewWindow
Start-Sleep -Seconds 5

try {
    $r = Invoke-WebRequest -Uri 'http://localhost:5000/health' -UseBasicParsing -TimeoutSec 3
    Write-Output "Server: $($r.StatusCode) - $($r.Content)"
} catch {
    Write-Output "Server: DOWN - $_"
}

try {
    $r2 = Invoke-WebRequest -Uri 'http://localhost:3000' -UseBasicParsing -TimeoutSec 3
    Write-Output "Client: $($r2.StatusCode) - OK"
} catch {
    Write-Output "Client: DOWN - $_"
}