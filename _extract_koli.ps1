Add-Type -AssemblyName System.IO.Compression.FileSystem
$zipPath = 'e:\c++\koli.zip'
$dest = 'e:\Elva MILK\MPBS-Frontend\_koli_src'
$ErrorActionPreference = 'Stop'
$files = @(
  'koli/login-ui/public/cow.png',
  'koli/login-ui/public/cow2.png',
  'koli/login-ui/public/logo1.png',
  'koli/login-ui/public/vite.svg',
  'koli/login-ui/src/App.css',
  'koli/login-ui/src/App.jsx',
  'koli/login-ui/src/index.css',
  'koli/login-ui/src/LoginPage.jsx',
  'koli/login-ui/src/main.jsx',
  'koli/login-ui/src/ready.jsx',
  'koli/login-ui/src/assets/logo1.png',
  'koli/login-ui/src/assets/react.svg'
)
$zip = [System.IO.Compression.ZipFile]::OpenRead($zipPath)
foreach ($name in $files) {
  $entry = $zip.GetEntry($name)
  if (-not $entry) { Write-Host "missing: $name"; continue }
  $target = Join-Path $dest $entry.FullName
  $dir = Split-Path $target -Parent
  if (-not (Test-Path $dir)) { New-Item -ItemType Directory -Path $dir -Force | Out-Null }
  [System.IO.Compression.ZipFileExtensions]::ExtractToFile($entry, $target, $true)
}
$zip.Dispose()
