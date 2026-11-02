# Graba el demo del plugin en Revit: vista 3D → Exportar → resultado → Resumen junto al modelo → Presentar.
# Graba el monitor donde está Revit con ffmpeg (gdigrab, con cursor) y mueve el mouse de forma suave.
# Las teclas solo se mandan si la ventana al frente es la esperada. Salida: demo\material\revit\revit-demo.mp4
param([double[]]$RestoreZoom, [switch]$Strict, [int]$Fps = 30, [string]$Out = (Join-Path $PSScriptRoot "material\revit\revit-demo.mp4"))
. (Join-Path $PSScriptRoot "revit-ui.ps1")
Add-Type @"
using System; using System.Runtime.InteropServices; using System.Text;
public static class SaFg {
  [DllImport("user32.dll")] public static extern IntPtr GetForegroundWindow();
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern int GetWindowText(IntPtr h, StringBuilder s, int n);
  [DllImport("user32.dll")] public static extern bool GetCursorPos(out POINT p);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, int d, UIntPtr e);
  public struct POINT { public int X; public int Y; }
  [DllImport("user32.dll", CharSet=CharSet.Unicode)] public static extern bool EnumDisplaySettings(string dev, int mode, ref DEVMODE dm);
  [StructLayout(LayoutKind.Sequential, CharSet=CharSet.Unicode)] public struct DEVMODE {
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmDeviceName; public short dmSpecVersion, dmDriverVersion, dmSize, dmDriverExtra; public int dmFields;
    public int dmPositionX, dmPositionY, dmDisplayOrientation, dmDisplayFixedOutput; public short dmColor, dmDuplex, dmYResolution, dmTTOption, dmCollate;
    [MarshalAs(UnmanagedType.ByValTStr, SizeConst=32)] public string dmFormName; public short dmLogPixels; public int dmBitsPerPel, dmPelsWidth, dmPelsHeight, dmDisplayFlags, dmDisplayFrequency; }
  public static int[] Pels(string dev) { var d = new DEVMODE(); d.dmSize = (short)Marshal.SizeOf(d); EnumDisplaySettings(dev, -1, ref d); return new[] { d.dmPositionX, d.dmPositionY, d.dmPelsWidth, d.dmPelsHeight }; }
  public static string Title() { var s = new StringBuilder(512); GetWindowText(GetForegroundWindow(), s, 512); return s.ToString(); }
}
"@ -ErrorAction SilentlyContinue
New-Item -ItemType Directory -Force -Path (Split-Path $Out) | Out-Null

$script:lastPos = $null
function Assert-Quiet {
    # Si el cursor no está donde lo dejó el script, alguien está usando el mouse: se detiene la toma
    $p = New-Object SaFg+POINT; [void][SaFg]::GetCursorPos([ref]$p)
    if ($script:lastPos -and ([Math]::Abs($p.X - $script:lastPos[0]) -gt 3 -or [Math]::Abs($p.Y - $script:lastPos[1]) -gt 3)) {
        if ($Strict) { throw "El mouse se movió fuera del script: se detiene la toma" }
        # Sin -Strict solo se avisa: los clics y la rueda siguen protegidos por la prueba de qué ventana hay debajo
        Write-Warning "El cursor estaba en ($($p.X), $($p.Y)) y no en ($($script:lastPos -join ', '))"
    }
    $p
}
function Assert-Under([double]$X, [double]$Y, [int[]]$Pids, [string]$What) {
    $e = $AE::FromPoint((New-Object System.Windows.Point $X, $Y))
    if ($Pids -notcontains $e.Current.ProcessId) { throw "Debajo de ($X, $Y) no está $What (pid $($e.Current.ProcessId), '$($e.Current.Name)'): no hago clic" }
}
function Move-Smooth([double]$X, [double]$Y, [double]$Sec = 0.7) {
    $p = Assert-Quiet
    $n = [Math]::Max(12, [int]($Sec * 60))
    for ($i = 1; $i -le $n; $i++) {
        $t = $i / $n; $e = 1 - [Math]::Pow(1 - $t, 3)  # easeOutCubic
        [void][SaWin]::SetCursorPos([int]($p.X + ($X - $p.X) * $e), [int]($p.Y + ($Y - $p.Y) * $e))
        Start-Sleep -Milliseconds ([int](1000 * $Sec / $n))
    }
    $script:lastPos = @([int]$X, [int]$Y)
}
function Click-Smooth($el, [double]$Sec = 0.7) {
    $r = $el.Current.BoundingRectangle
    Move-Smooth ($r.X + $r.Width / 2) ($r.Y + $r.Height / 2) $Sec
    Start-Sleep -Milliseconds 120
    [void](Assert-Quiet)
    $hit = $AE::FromPoint((New-Object System.Windows.Point ($r.X + $r.Width / 2), ($r.Y + $r.Height / 2)))
    if ($hit.Current.ProcessId -ne $el.Current.ProcessId) { throw "Debajo de '$($el.Current.Name)' hay otra ventana (pid $($hit.Current.ProcessId)): no hago clic" }
    [SaWin]::Click([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2))
}
function Wheel([int]$Notches, [int[]]$Pids, [string]$What) {
    $p = Assert-Quiet; Assert-Under $p.X $p.Y $Pids $What
    for ($i = 0; $i -lt [Math]::Abs($Notches); $i++) { [SaFg]::mouse_event(0x0800, 0, 0, 120 * [Math]::Sign($Notches), [UIntPtr]::Zero); Start-Sleep -Milliseconds 260 }
}
function Send-KeyTo([string]$TitleLike, [string]$Keys) {
    $t = [SaFg]::Title()
    if ($t -notlike $TitleLike) { Write-Warning "No mando '$Keys': al frente está '$t'"; return $false }
    [System.Windows.Forms.SendKeys]::SendWait($Keys); $true
}
function Edge-SA { $AE::RootElement.FindAll($TS::Children, [System.Windows.Automation.Condition]::TrueCondition) | Where-Object { $_.Current.Name -eq 'Space Analytics' -and -not $_.Current.BoundingRectangle.IsEmpty } }

# ---- preparación (fuera de la toma)
$w = Get-RevitWindow
if (-not $w) { throw "No encuentro la ventana de Revit" }
$h = [IntPtr]$w.Current.NativeWindowHandle
$scr = [System.Windows.Forms.Screen]::FromHandle($h)
$screen = $scr.Bounds                      # coordenadas de UIA y del cursor (este proceso)
$pels = [SaFg]::Pels($scr.DeviceName)      # resolución física: la que graba gdigrab
"Monitor de Revit: $screen · físico $($pels[2])x$($pels[3])"
# Resúmenes viejos abiertos (perfil 'navegador'): se cierran para que Presentar no herede su tamaño
Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -match 'HSBC Space Analytics\\navegador' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
# Cinta en la pestaña Space Analytics (UIA, sin mover el mouse)
$tab = $w.FindAll($TS::Descendants, (New-Object System.Windows.Automation.PropertyCondition($AE::NameProperty, "Space Analytics"))) | Where-Object { $_.Current.ControlType.ProgrammaticName -eq "ControlType.Button" } | Select-Object -First 1
if ($tab) { Invoke-Ui $tab; Start-Sleep 1 }
# -RestoreZoom x,y,n: deshace n pasos de rueda en ese punto (la toma fallida del 2 nov acercó 3 en 894.6,1908)
if ($RestoreZoom) {
    [void][SaWin]::SetForegroundWindow($h); Start-Sleep 0.5
    [void][SaWin]::SetCursorPos([int]$RestoreZoom[0], [int]$RestoreZoom[1]); $script:lastPos = @([int]$RestoreZoom[0], [int]$RestoreZoom[1])
    Wheel (-1 * [int]$RestoreZoom[2]) @($w.Current.ProcessId) 'la vista de Revit'; Start-Sleep 1
}
$btnExp = Find-Ui $w "Exportar" "Button"; $btnPres = Find-Ui $w "Presentar" "Button"
if (-not $btnExp -or -not $btnPres) { throw "No encuentro los botones de la pestaña Space Analytics" }
[void][SaWin]::SetForegroundWindow($h); Start-Sleep 1
Move-Smooth ($screen.X + $screen.Width * 0.6) ($screen.Y + $screen.Height * 0.6) 0.3

# ---- grabación
$psi = New-Object System.Diagnostics.ProcessStartInfo "ffmpeg"
$psi.Arguments = "-hide_banner -loglevel error -y -f gdigrab -framerate $Fps -draw_mouse 1 -offset_x $($screen.X) -offset_y $($screen.Y) -video_size $($pels[2])x$($pels[3]) -i desktop -vf scale=1920:-2:flags=lanczos -c:v libx264 -preset veryfast -crf 18 -pix_fmt yuv420p `"$Out`""
$psi.UseShellExecute = $false; $psi.RedirectStandardInput = $true
$ff = [System.Diagnostics.Process]::Start($psi)
$t0 = Get-Date
# Registro del cursor cada 50 ms (para saber qué lo mueve si se mueve solo)
$cursorLog = [IO.Path]::ChangeExtension($Out, '.cursor.csv')
$cursorJob = Start-Job -ScriptBlock { param($f, $t0)
    Add-Type -AssemblyName System.Windows.Forms
    while ($true) { $p = [System.Windows.Forms.Cursor]::Position; "{0:N2},{1},{2}" -f ((Get-Date) - $t0).TotalSeconds, $p.X, $p.Y | Add-Content $f; Start-Sleep -Milliseconds 50 }
} -ArgumentList $cursorLog, $t0
Remove-Item $cursorLog -ErrorAction SilentlyContinue
$marks = [ordered]@{}
function Mark([string]$Id) { $marks[$Id] = [Math]::Round(((Get-Date) - $t0).TotalSeconds, 2); "  {0,6:N2} s  {1}" -f $marks[$Id], $Id }
try {
    Start-Sleep 1.5; Mark 'vista-3d'
    # Acercar la vista 3D hacia el edificio (zoom de vista: no cambia el modelo)
    Move-Smooth ($screen.X + $screen.Width * 0.44) ($screen.Y + $screen.Height * 0.52) 0.9
    $revitPid = $w.Current.ProcessId
    Wheel 3 @($revitPid) 'la vista de Revit'; Start-Sleep 1.2; Mark 'zoom'

    # Exportar
    Click-Smooth $btnExp 1.0; Mark 'exportar-clic'
    $ew = Wait-Ui { Get-RevitDialog "Exportar" } 30
    if (-not $ew) { throw "No apareció la ventana de Exportar" }
    Start-Sleep 2.2
    Click-Smooth (Find-Ui $ew "Exportar" "Button") 0.8; Mark 'exportar-ok'
    $done = Wait-Ui { $e = Get-RevitDialog "Exportar"; if ($e -and (Find-Ui $e "LISTO*" -Like)) { $e } } 120
    if (-not $done) { throw "La exportación no terminó" }
    Mark 'exportar-listo'; Start-Sleep 3.5

    # Resumen desde la ventana de Exportar
    Click-Smooth (Find-Ui $done "Resumen" "Button") 0.8; Mark 'resumen-clic'
    $sum = Wait-Ui { Edge-SA | Select-Object -First 1 } 30
    if (-not $sum) { throw "No apareció el resumen" }
    $hs = [IntPtr]$sum.Current.NativeWindowHandle
    $sw = 440; $sh = [Math]::Min(860, $screen.Height - 120)
    # Dos veces: la primera la cambia de monitor (y de escala) y Edge reajusta el tamaño; la segunda lo fija
    for ($k = 0; $k -lt 2; $k++) { [void][SaWin]::MoveWindow($hs, $screen.X + $screen.Width - $sw - 24, $screen.Y + 70, $sw, $sh, $true); Start-Sleep -Milliseconds 400 }
    [void][SaWin]::SetForegroundWindow($hs)
    Start-Sleep 4.5; Mark 'resumen-listo'
    Move-Smooth ($screen.X + $screen.Width - $sw / 2 - 24) ($screen.Y + 70 + $sh * 0.55) 0.8
    Wheel -4 @($sum.Current.ProcessId) 'el resumen'; Start-Sleep 1.5; Wheel 4 @($sum.Current.ProcessId) 'el resumen'; Start-Sleep 1.2; Mark 'resumen-recorrido'

    # Cerrar el resumen (botón ✕ de la ventana) y Presentar desde la cinta
    $close = Find-Ui $sum "Close" "Button"; if (-not $close) { $close = Find-Ui $sum "Cerrar" "Button" }
    if ($close) { Click-Smooth $close 0.6 } else { [void][SaWin]::SetForegroundWindow($hs); [void](Send-KeyTo 'Space Analytics*' '%{F4}') }
    Start-Sleep 1.5
    Get-CimInstance Win32_Process -Filter "Name='msedge.exe'" | Where-Object { $_.CommandLine -match 'HSBC Space Analytics\\navegador(?!-presentar)' } | ForEach-Object { Stop-Process -Id $_.ProcessId -Force -ErrorAction SilentlyContinue }
    [void][SaWin]::SetForegroundWindow($h); Start-Sleep 0.6
    Click-Smooth $btnPres 1.0; Mark 'presentar-clic'
    $pr = Wait-Ui { Edge-SA | Select-Object -First 1 } 30
    if (-not $pr) { throw "No apareció la presentación" }
    $hp = [IntPtr]$pr.Current.NativeWindowHandle
    if (-not $screen.Contains([System.Drawing.Point]::new([int]$pr.Current.BoundingRectangle.X + 50, [int]$pr.Current.BoundingRectangle.Y + 50))) {
        [void][SaWin]::ShowWindow($hp, 9); [void][SaWin]::MoveWindow($hp, $screen.X, $screen.Y, $screen.Width, $screen.Height, $true); [void][SaWin]::ShowWindow($hp, 3)
    }
    [void][SaWin]::SetForegroundWindow($hp)
    Start-Sleep 4; Mark 'presentar-portada'
    # Botón → de la barra inferior (el contenido web no sale en UIA): posición relativa a la ventana maximizada
    $rp = $pr.Current.BoundingRectangle
    $nx = $rp.X + $rp.Width * 0.0865; $ny = $rp.Y + $rp.Height * 0.963
    for ($i = 1; $i -le 4; $i++) {
        Move-Smooth $nx $ny 0.6; Start-Sleep -Milliseconds 120
        Assert-Under $nx $ny @($pr.Current.ProcessId) 'la presentación'
        [SaWin]::Click([int]$nx, [int]$ny); Start-Sleep 3.2; Mark "presentar-$($i + 1)"
    }
    $close = Find-Ui $pr "Close" "Button"
    if ($close) { Click-Smooth $close 0.7 }; Start-Sleep 2; Mark 'fin'
} finally {
    $ff.StandardInput.Write('q'); $ff.StandardInput.Close(); [void]$ff.WaitForExit(20000)
    Stop-Job $cursorJob; Remove-Job $cursorJob -Force
    $marks | ConvertTo-Json | Set-Content -Encoding utf8 ([IO.Path]::ChangeExtension($Out, '.marks.json'))
    "✓ $Out"
}
