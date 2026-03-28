param(
  [Parameter(Mandatory = $true)]
  [string]$InputPath,

  [Parameter(Mandatory = $true)]
  [string]$OutputPath,

  [int]$MaxLongEdge = 1600,
  [int]$TargetKB = 200,
  [int]$MaxKB = 300,
  [int]$InitialQuality = 70,
  [int]$MinQuality = 45
)

Add-Type -AssemblyName System.Drawing

function Get-JpegCodec {
  [System.Drawing.Imaging.ImageCodecInfo]::GetImageEncoders() |
    Where-Object { $_.MimeType -eq 'image/jpeg' }
}

function Save-Jpeg($bitmap, $path, $quality) {
  $codec = Get-JpegCodec
  $encoder = [System.Drawing.Imaging.Encoder]::Quality
  $params = New-Object System.Drawing.Imaging.EncoderParameters(1)
  $params.Param[0] = New-Object System.Drawing.Imaging.EncoderParameter($encoder, [long]$quality)
  $bitmap.Save($path, $codec, $params)
  $params.Dispose()
}

$inputFull = (Resolve-Path $InputPath).Path
$dir = Split-Path -Parent $OutputPath
if (!(Test-Path $dir)) {
  New-Item -ItemType Directory -Path $dir -Force | Out-Null
}

$image = [System.Drawing.Image]::FromFile($inputFull)
try {
  $ratio = [Math]::Min($MaxLongEdge / [double]([Math]::Max($image.Width, $image.Height)), 1.0)
  $newWidth = [Math]::Max([int]([Math]::Round($image.Width * $ratio)), 1)
  $newHeight = [Math]::Max([int]([Math]::Round($image.Height * $ratio)), 1)

  $bitmap = New-Object System.Drawing.Bitmap($newWidth, $newHeight)
  try {
    $graphics = [System.Drawing.Graphics]::FromImage($bitmap)
    try {
      $graphics.InterpolationMode = [System.Drawing.Drawing2D.InterpolationMode]::HighQualityBicubic
      $graphics.SmoothingMode = [System.Drawing.Drawing2D.SmoothingMode]::HighQuality
      $graphics.PixelOffsetMode = [System.Drawing.Drawing2D.PixelOffsetMode]::HighQuality
      $graphics.CompositingQuality = [System.Drawing.Drawing2D.CompositingQuality]::HighQuality
      $graphics.DrawImage($image, 0, 0, $newWidth, $newHeight)
    }
    finally {
      $graphics.Dispose()
    }

    $quality = $InitialQuality
    do {
      Save-Jpeg -bitmap $bitmap -path $OutputPath -quality $quality
      $sizeKB = [math]::Round(((Get-Item $OutputPath).Length / 1KB), 2)
      if ($sizeKB -le $TargetKB -or $quality -le $MinQuality) {
        break
      }
      $quality -= 5
    } while ($true)

    $finalSizeKB = [math]::Round(((Get-Item $OutputPath).Length / 1KB), 2)
    $status = if ($finalSizeKB -le $MaxKB) { 'ok' } else { 'over-max' }

    [pscustomobject]@{
      ok = $true
      status = $status
      inputPath = $inputFull
      outputPath = (Resolve-Path $OutputPath).Path
      width = $newWidth
      height = $newHeight
      finalQuality = $quality
      finalSizeKB = $finalSizeKB
      targetKB = $TargetKB
      maxKB = $MaxKB
    } | ConvertTo-Json -Depth 4
  }
  finally {
    $bitmap.Dispose()
  }
}
finally {
  $image.Dispose()
}
