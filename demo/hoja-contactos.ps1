# Hoja de contactos de demo\material\capturas (miniaturas con nombre y tamaño) para revisar el material de un vistazo.
# Uso: .\demo\hoja-contactos.ps1 [-Out ruta.png] [-Filter "0*.png"]
param([string]$Out = (Join-Path $PSScriptRoot "material\hoja-contactos.png"), [string]$Filter = "0*.png")
Add-Type -AssemblyName System.Drawing
$files = Get-ChildItem (Join-Path $PSScriptRoot "material\capturas") -Filter $Filter | Sort-Object Name
$cw = 640; $ch = 400; $cols = 3; $rows = [Math]::Ceiling($files.Count / $cols)
$sheet = New-Object System.Drawing.Bitmap ($cw * $cols), (($ch + 24) * $rows)
$g = [System.Drawing.Graphics]::FromImage($sheet); $g.Clear([System.Drawing.Color]::White)
$g.InterpolationMode = 'HighQualityBicubic'; $font = New-Object System.Drawing.Font "Segoe UI", 11
for ($i = 0; $i -lt $files.Count; $i++) {
    $im = [System.Drawing.Image]::FromFile($files[$i].FullName)
    $s = [Math]::Min($cw / $im.Width, $ch / $im.Height)
    $x = ($i % $cols) * $cw; $y = [Math]::Floor($i / $cols) * ($ch + 24)
    $g.DrawImage($im, [int]$x, [int]($y + 24), [int]($im.Width * $s), [int]($im.Height * $s))
    $g.DrawString("$($files[$i].Name)  $($im.Width)x$($im.Height)", $font, [System.Drawing.Brushes]::Black, $x + 4, $y + 2)
    $im.Dispose()
}
$sheet.Save($Out); $g.Dispose(); $sheet.Dispose()
$Out
