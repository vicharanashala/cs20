$ErrorActionPreference = 'Continue'
$start = Get-Date
$startInfo = New-Object System.Diagnostics.ProcessStartInfo
$startInfo.FileName = "npx"
$startInfo.Arguments = "vite --host"
$startInfo.WorkingDirectory = "D:\faq\client"
$startInfo.UseShellExecute = $true
$startInfo.WindowStyle = [System.Diagnostics.ProcessWindowStyle]::Hidden
$process = [System.Diagnostics.Process]::Start($startInfo)
$process.WaitForExit()