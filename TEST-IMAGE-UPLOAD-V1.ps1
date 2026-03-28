# 測試用法：
# .\TEST-IMAGE-UPLOAD-V1.ps1 -InputPath 'C:\path\to\image.jpg'

param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath
)

$workspace = Split-Path -Parent $MyInvocation.MyCommand.Path
$outputDir = Join-Path $workspace 'tmp\compressed'
$outputPath = Join-Path $outputDir (([System.IO.Path]::GetFileNameWithoutExtension($InputPath)) + '.jpg')

powershell -ExecutionPolicy Bypass -File (Join-Path $workspace 'compress-cheque-image.ps1') `
  -InputPath $InputPath `
  -OutputPath $OutputPath `
  -MaxLongEdge 1600 `
  -TargetKB 200 `
  -MaxKB 300 `
  -InitialQuality 70 `
  -MinQuality 45
