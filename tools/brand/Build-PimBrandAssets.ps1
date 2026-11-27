# Build the PIM brand assets from the client's HD logo (white background PNG).
# Usage: pwsh -NoProfile -File tools/brand/Build-PimBrandAssets.ps1 -Source "<hd.png>" -RepoRoot .
param(
    [Parameter(Mandatory)] [string] $Source,
    [Parameter(Mandatory)] [string] $RepoRoot
)
$ErrorActionPreference = 'Stop'
Add-Type -AssemblyName System.Drawing
$warm = [System.Drawing.Bitmap]::new(1, 1); [System.Drawing.Graphics]::FromImage($warm).Dispose(); $warm.Dispose()  # load GDI+ assemblies before compiling
$pimRefs = [AppDomain]::CurrentDomain.GetAssemblies() | Where-Object { -not $_.IsDynamic -and $_.Location -and $_.GetName().Name -match "^(System.Private.CoreLib|System.Drawing|System.Private.Windows|System.Runtime|System.Collections|System.ComponentModel|System.Memory|netstandard)" } | ForEach-Object Location | Select-Object -Unique
Add-Type -ReferencedAssemblies $pimRefs -Language CSharp -TypeDefinition @'
using System;
using System.Drawing;
using System.Drawing.Drawing2D;
using System.Drawing.Imaging;
using System.IO;
using System.Runtime.InteropServices;

public static class PimBrand
{
    static byte[] Read(Bitmap bmp, out BitmapData data)
    {
        var rect = new Rectangle(0, 0, bmp.Width, bmp.Height);
        data = bmp.LockBits(rect, ImageLockMode.ReadWrite, PixelFormat.Format32bppArgb);
        var bytes = new byte[data.Stride * bmp.Height];
        Marshal.Copy(data.Scan0, bytes, 0, bytes.Length);
        return bytes;
    }

    // Colour-to-alpha against white: un-composite each pixel from a white background.
    public static Bitmap WhiteToAlpha(Bitmap source, double floor)
    {
        var bmp = new Bitmap(source.Width, source.Height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(bmp)) { g.DrawImage(source, 0, 0, source.Width, source.Height); }
        BitmapData data;
        var px = Read(bmp, out data);
        for (int i = 0; i < px.Length; i += 4)
        {
            double b = px[i], gr = px[i + 1], r = px[i + 2];
            double a = Math.Max(255 - r, Math.Max(255 - gr, 255 - b)) / 255.0;
            if (a <= floor) { px[i] = px[i + 1] = px[i + 2] = px[i + 3] = 0; continue; }
            Func<double, byte> un = c => (byte)Math.Max(0, Math.Min(255, Math.Round(255 - (255 - c) / a)));
            px[i] = un(b); px[i + 1] = un(gr); px[i + 2] = un(r);
            px[i + 3] = (byte)Math.Round(255 * (a - floor) / (1 - floor));
        }
        Marshal.Copy(px, 0, data.Scan0, px.Length);
        bmp.UnlockBits(data);
        return bmp;
    }

    public static Rectangle OpaqueBounds(Bitmap bmp, int threshold)
    {
        BitmapData data;
        var px = Read(bmp, out data);
        bmp.UnlockBits(data);
        int minX = bmp.Width, minY = bmp.Height, maxX = -1, maxY = -1;
        for (int y = 0; y < bmp.Height; y++)
            for (int x = 0; x < bmp.Width; x++)
                if (px[y * data.Stride + x * 4 + 3] > threshold)
                {
                    if (x < minX) minX = x; if (x > maxX) maxX = x;
                    if (y < minY) minY = y; if (y > maxY) maxY = y;
                }
        return Rectangle.FromLTRB(minX, minY, maxX + 1, maxY + 1);
    }

    // First x (from the left) where a run of fully transparent columns at least minGap wide begins.
    public static int EmblemEnd(Bitmap bmp, int threshold, int minGap)
    {
        BitmapData data;
        var px = Read(bmp, out data);
        bmp.UnlockBits(data);
        bool seen = false; int run = 0;
        for (int x = 0; x < bmp.Width; x++)
        {
            bool empty = true;
            for (int y = 0; y < bmp.Height && empty; y++) if (px[y * data.Stride + x * 4 + 3] > threshold) empty = false;
            if (!empty) { seen = true; run = 0; continue; }
            if (seen && ++run >= minGap) return x - run + 1;
        }
        throw new InvalidOperationException("No gap between emblem and wordmark found");
    }

    public static Bitmap Crop(Bitmap bmp, Rectangle r)
    {
        var outBmp = new Bitmap(r.Width, r.Height, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(outBmp)) { g.DrawImage(bmp, new Rectangle(0, 0, r.Width, r.Height), r, GraphicsUnit.Pixel); }
        return outBmp;
    }

    // Draw src scaled to fit inside a w x h canvas with the given padding fraction, centred.
    public static Bitmap Fit(Bitmap src, int w, int h, double pad, Color background)
    {
        var canvas = new Bitmap(w, h, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(canvas))
        using (var attrs = new ImageAttributes())
        {
            g.Clear(background);
            g.CompositingQuality = CompositingQuality.HighQuality;
            g.InterpolationMode = InterpolationMode.HighQualityBicubic;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.SmoothingMode = SmoothingMode.HighQuality;
            attrs.SetWrapMode(WrapMode.TileFlipXY);
            double availW = w * (1 - 2 * pad), availH = h * (1 - 2 * pad);
            double scale = Math.Min(availW / src.Width, availH / src.Height);
            int dw = (int)Math.Round(src.Width * scale), dh = (int)Math.Round(src.Height * scale);
            var dest = new Rectangle((w - dw) / 2, (h - dh) / 2, dw, dh);
            g.DrawImage(src, dest, 0, 0, src.Width, src.Height, GraphicsUnit.Pixel, attrs);
        }
        return canvas;
    }

    // Emblem on a white disc so the dark pen stays visible in dark browser tab strips.
    public static Bitmap Badge(Bitmap src, int size, double pad)
    {
        var canvas = new Bitmap(size, size, PixelFormat.Format32bppArgb);
        using (var g = Graphics.FromImage(canvas))
        using (var mark = Fit(src, size, size, pad, Color.Transparent))
        {
            g.Clear(Color.Transparent);
            g.SmoothingMode = SmoothingMode.AntiAlias;
            g.PixelOffsetMode = PixelOffsetMode.HighQuality;
            g.FillEllipse(Brushes.White, 0, 0, size - 1, size - 1);
            g.DrawImage(mark, 0, 0, size, size);
        }
        return canvas;
    }

    public static Bitmap ToHeight(Bitmap src, int h)
    {
        int w = (int)Math.Round(src.Width * (double)h / src.Height);
        return Fit(src, w, h, 0, Color.Transparent);
    }

    public static void SaveIco(string path, Bitmap[] images)
    {
        var payloads = new byte[images.Length][];
        for (int k = 0; k < images.Length; k++) using (var ms = new MemoryStream()) { images[k].Save(ms, ImageFormat.Png); payloads[k] = ms.ToArray(); }
        using (var fs = new FileStream(path, FileMode.Create))
        using (var bw = new BinaryWriter(fs))
        {
            bw.Write((ushort)0); bw.Write((ushort)1); bw.Write((ushort)images.Length);
            int offset = 6 + 16 * images.Length;
            for (int i = 0; i < images.Length; i++)
            {
                bw.Write((byte)(images[i].Width >= 256 ? 0 : images[i].Width));
                bw.Write((byte)(images[i].Height >= 256 ? 0 : images[i].Height));
                bw.Write((byte)0); bw.Write((byte)0);
                bw.Write((ushort)1); bw.Write((ushort)32);
                bw.Write((uint)payloads[i].Length); bw.Write((uint)offset);
                offset += payloads[i].Length;
            }
            foreach (var p in payloads) bw.Write(p);
        }
    }
}
'@

$root = (Resolve-Path $RepoRoot).Path
$images = Join-Path $root 'plugins\themes\pustakaMinang\images'
$out = Join-Path $root 'tools\brand\out'
New-Item -ItemType Directory -Force $images, $out | Out-Null

$src = [System.Drawing.Bitmap]::FromFile((Resolve-Path $Source).Path)
$alpha = [PimBrand]::WhiteToAlpha($src, 0.04)
$bounds = [PimBrand]::OpaqueBounds($alpha, 8)
$pad = [int][Math]::Round([Math]::Max($bounds.Width, $bounds.Height) * 0.02)
$box = [System.Drawing.Rectangle]::FromLTRB([Math]::Max(0, $bounds.Left - $pad), [Math]::Max(0, $bounds.Top - $pad), [Math]::Min($alpha.Width, $bounds.Right + $pad), [Math]::Min($alpha.Height, $bounds.Bottom + $pad))
$logo = [PimBrand]::Crop($alpha, $box)

$emblemEnd = [PimBrand]::EmblemEnd($logo, 8, [int][Math]::Ceiling($logo.Width * 0.015))
$emblemRaw = [PimBrand]::Crop($logo, [System.Drawing.Rectangle]::new(0, 0, $emblemEnd, $logo.Height))
$emblem = [PimBrand]::Crop($emblemRaw, [PimBrand]::OpaqueBounds($emblemRaw, 8))
$transparent = [System.Drawing.Color]::Transparent

function Save-Png($bitmap, $path) { $bitmap.Save($path, [System.Drawing.Imaging.ImageFormat]::Png); $bitmap.Dispose(); $i = Get-Item $path; '{0} {1:N0} bytes' -f $i.FullName, $i.Length }

$display = [PimBrand]::ToHeight($logo, 240); "pim-logo.png {0}x{1}" -f $display.Width, $display.Height
Save-Png $display (Join-Path $images 'pim-logo.png')
$full = if ($logo.Width -gt 1600) { [PimBrand]::Fit($logo, 1600, [int][Math]::Round($logo.Height * 1600 / $logo.Width), 0, $transparent) } else { $logo.Clone() }
"logo.png {0}x{1}" -f $full.Width, $full.Height
Save-Png $full (Join-Path $root 'logo.png')
Save-Png ([PimBrand]::Fit($logo, 836, 470, 0.06, $transparent)) (Join-Path $out 'pageHeaderTitleImage_en.png')
Save-Png ([PimBrand]::Badge($emblem, 32, 0.14)) (Join-Path $images 'favicon-32.png')
Save-Png ([PimBrand]::Fit($emblem, 180, 180, 0.12, [System.Drawing.Color]::White)) (Join-Path $images 'apple-touch-icon.png')
$icons = @(16, 32, 48 | ForEach-Object { [PimBrand]::Badge($emblem, $_, 0.14) })
[PimBrand]::SaveIco((Join-Path $root 'favicon.ico'), $icons)
$icons | ForEach-Object { $_.Dispose() }
"favicon.ico {0:N0} bytes" -f (Get-Item (Join-Path $root 'favicon.ico')).Length
$src.Dispose(); $alpha.Dispose(); $logo.Dispose(); $emblemRaw.Dispose(); $emblem.Dispose()
