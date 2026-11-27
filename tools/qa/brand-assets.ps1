# Verify the generated PIM brand assets (sizes, transparency, icon entries).
# Usage: pwsh -NoProfile -File tools/qa/brand-assets.ps1
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$root = Resolve-Path (Join-Path $PSScriptRoot '..\..')
$images = Join-Path $root 'plugins\themes\pustakaMinang\images'
$failures = New-Object System.Collections.Generic.List[string]

function Test-Image([string]$path, [scriptblock]$check) {
    if (-not (Test-Path $path)) { $failures.Add("missing: $path"); return }
    $img = [System.Drawing.Bitmap]::FromFile($path)
    try { & $check $img (Get-Item $path).Length } finally { $img.Dispose() }
}
function Get-CornerAlpha($img) {
    @($img.GetPixel(0, 0).A, $img.GetPixel($img.Width - 1, 0).A, $img.GetPixel(0, $img.Height - 1).A, $img.GetPixel($img.Width - 1, $img.Height - 1).A)
}

Test-Image (Join-Path $images 'pim-logo.png') {
    param($img, $bytes)
    if ($img.Height -ne 240) { $failures.Add("pim-logo.png height $($img.Height), expected 240") }
    if (-not [System.Drawing.Image]::IsAlphaPixelFormat($img.PixelFormat)) { $failures.Add('pim-logo.png has no alpha channel') }
    if ((Get-CornerAlpha $img | Measure-Object -Maximum).Maximum -ne 0) { $failures.Add('pim-logo.png corners are not transparent') }
    if ($bytes -gt 120KB) { $failures.Add("pim-logo.png is $bytes bytes (max 120 KB)") }
}
Test-Image (Join-Path $root 'logo.png') {
    param($img, $bytes)
    if ($img.Width -lt 900 -or $img.Width -gt 1600) { $failures.Add("logo.png width $($img.Width), expected 900-1600") }
    if ((Get-CornerAlpha $img | Measure-Object -Maximum).Maximum -ne 0) { $failures.Add('logo.png corners are not transparent') }
    if ($bytes -gt 600KB) { $failures.Add("logo.png is $bytes bytes (max 600 KB)") }
}
Test-Image (Join-Path $images 'favicon-32.png') {
    param($img, $bytes)
    if ($img.Width -ne 32 -or $img.Height -ne 32) { $failures.Add("favicon-32.png is $($img.Width)x$($img.Height)") }
    if ((Get-CornerAlpha $img | Measure-Object -Maximum).Maximum -ne 0) { $failures.Add('favicon-32.png corners are not transparent') }
}
Test-Image (Join-Path $images 'apple-touch-icon.png') {
    param($img, $bytes)
    if ($img.Width -ne 180 -or $img.Height -ne 180) { $failures.Add("apple-touch-icon.png is $($img.Width)x$($img.Height)") }
    $corner = $img.GetPixel(0, 0)
    if ($corner.A -ne 255 -or $corner.R -ne 255 -or $corner.G -ne 255 -or $corner.B -ne 255) { $failures.Add('apple-touch-icon.png corners must be opaque white') }
}
Test-Image (Join-Path $root 'tools\brand\out\pageHeaderTitleImage_en.png') {
    param($img, $bytes)
    if ($img.Width -ne 836 -or $img.Height -ne 470) { $failures.Add("pageHeaderTitleImage_en.png is $($img.Width)x$($img.Height), expected 836x470") }
    if ((Get-CornerAlpha $img | Measure-Object -Maximum).Maximum -ne 0) { $failures.Add('pageHeaderTitleImage_en.png corners are not transparent') }
    if ($bytes -gt 200KB) { $failures.Add("pageHeaderTitleImage_en.png is $bytes bytes (max 200 KB)") }
}

$ico = Join-Path $root 'favicon.ico'
if (-not (Test-Path $ico)) { $failures.Add('missing: favicon.ico') } else {
    $b = [System.IO.File]::ReadAllBytes($ico)
    if ($b[0] -ne 0 -or $b[1] -ne 0 -or $b[2] -ne 1 -or $b[3] -ne 0) { $failures.Add('favicon.ico header is not an icon') }
    $count = [BitConverter]::ToUInt16($b, 4)
    if ($count -ne 3) { $failures.Add("favicon.ico has $count images, expected 3") } else {
        $sizes = @()
        for ($i = 0; $i -lt 3; $i++) {
            $e = 6 + 16 * $i
            $sizes += [int]$b[$e]
            $offset = [BitConverter]::ToUInt32($b, $e + 12)
            if ($b[$offset] -ne 0x89 -or $b[$offset + 1] -ne 0x50) { $failures.Add("favicon.ico entry $i is not PNG data") }
        }
        if (($sizes -join ',') -ne '16,32,48') { $failures.Add("favicon.ico sizes $($sizes -join ','), expected 16,32,48") }
    }
}

if ($failures.Count) { $failures | ForEach-Object { Write-Error "FAIL: $_" -ErrorAction Continue }; exit 1 }
'PASS: PIM brand assets have expected sizes, transparency and icon entries.'
