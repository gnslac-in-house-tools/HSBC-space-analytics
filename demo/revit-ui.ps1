# Control de Revit para el material del demo: ventana a tamaño fijo, clics por UI Automation y capturas.
# Uso:  . .\demo\revit-ui.ps1   (dot-source) y luego las funciones Get-RevitWindow, Set-WindowRect, Find-Ui,
#       Invoke-Ui, Save-Snap, Wait-Ui. Las capturas van a demo\material\capturas\.
# Solo usa Windows: System.Windows.Automation (UIA) y System.Drawing; no instala nada.

Add-Type -AssemblyName UIAutomationClient, UIAutomationTypes, System.Drawing, System.Windows.Forms
Add-Type @"
using System;
using System.Runtime.InteropServices;
public static class SaWin {
  [DllImport("user32.dll")] public static extern bool SetForegroundWindow(IntPtr h);
  [DllImport("user32.dll")] public static extern bool ShowWindow(IntPtr h, int cmd);
  [DllImport("user32.dll")] public static extern bool MoveWindow(IntPtr h, int x, int y, int w, int hgt, bool repaint);
  [DllImport("user32.dll")] public static extern bool SetCursorPos(int x, int y);
  [DllImport("user32.dll")] public static extern void mouse_event(uint f, uint dx, uint dy, uint d, UIntPtr e);
  [DllImport("user32.dll")] public static extern bool SetProcessDPIAware();
  public static void Click(int x, int y) { SetCursorPos(x, y); mouse_event(2,0,0,0,UIntPtr.Zero); mouse_event(4,0,0,0,UIntPtr.Zero); }
}
"@ -ErrorAction SilentlyContinue
[void][SaWin]::SetProcessDPIAware()

$script:SaOut = Join-Path $PSScriptRoot "material\capturas"
New-Item -ItemType Directory -Force -Path $script:SaOut | Out-Null
$AE = [System.Windows.Automation.AutomationElement]
$TS = [System.Windows.Automation.TreeScope]

function Get-TopWindow([string]$TitleLike) {
    # Ventana principal de cualquier proceso cuyo título contenga $TitleLike
    $cond = [System.Windows.Automation.Condition]::TrueCondition
    $AE::RootElement.FindAll($TS::Children, $cond) | Where-Object { $_.Current.Name -like "*$TitleLike*" } | Select-Object -First 1
}

function Get-RevitWindow { Get-TopWindow "Autodesk Revit" }

function Get-RevitDialog([string]$TitleLike) {
    # Ventanas de los botones (WPF con dueño): cuelgan de la ventana principal de Revit, no de la raíz
    $w = Get-RevitWindow
    if (-not $w) { return $null }
    $cond = New-Object System.Windows.Automation.PropertyCondition($AE::ControlTypeProperty, [System.Windows.Automation.ControlType]::Window)
    $w.FindAll($TS::Children, $cond) | Where-Object { $_.Current.Name -like "*$TitleLike*" } | Select-Object -First 1
}

function Start-FrameGrab([int]$X, [int]$Y, [int]$W, [int]$H, [string]$Prefix, [int]$Count = 90, [int]$EveryMs = 700) {
    # Cuadros sueltos de una región mientras Revit está ocupado (UIA se bloquea); devuelve el job
    Start-Job -ScriptBlock { param($x, $y, $w, $h, $out, $pre, $n, $ms)
        Add-Type -AssemblyName System.Drawing
        for ($i = 0; $i -lt $n; $i++) {
            $bmp = New-Object System.Drawing.Bitmap $w, $h; $g = [System.Drawing.Graphics]::FromImage($bmp)
            $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size); $bmp.Save((Join-Path $out ("{0}-{1:D3}.png" -f $pre, $i)))
            $g.Dispose(); $bmp.Dispose(); Start-Sleep -Milliseconds $ms
        }
    } -ArgumentList $X, $Y, $W, $H, $script:SaOut, $Prefix, $Count, $EveryMs
}

function Set-WindowRect($el, [int]$X = 40, [int]$Y = 40, [int]$W = 1920, [int]$H = 1080) {
    $h = [IntPtr]$el.Current.NativeWindowHandle
    [void][SaWin]::ShowWindow($h, 9)   # SW_RESTORE (sale de maximizado)
    [void][SaWin]::MoveWindow($h, $X, $Y, $W, $H, $true)
    [void][SaWin]::SetForegroundWindow($h)
}

function Find-Ui($root, [string]$Name, [string]$Type = $null, [switch]$Like) {
    # Busca en todo el subárbol por nombre (exacto o -Like con comodines) y, opcional, por ControlType ("Button", "TabItem"…)
    $all = $root.FindAll($TS::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
    foreach ($e in $all) {
        $n = $e.Current.Name
        $ok = if ($Like) { $n -like $Name } else { $n -eq $Name }
        if ($ok -and (-not $Type -or $e.Current.ControlType.ProgrammaticName -eq "ControlType.$Type")) { return $e }
    }
    $null
}

function Wait-Ui([scriptblock]$Probe, [int]$Seconds = 60) {
    $t = [DateTime]::Now.AddSeconds($Seconds)
    while ([DateTime]::Now -lt $t) { $r = & $Probe; if ($r) { return $r }; Start-Sleep -Milliseconds 500 }
    $null
}

function Invoke-Ui($el) {
    # Invoke/Select/Toggle si el control lo ofrece; si no, clic real al centro
    foreach ($p in @([System.Windows.Automation.InvokePattern]::Pattern,
                     [System.Windows.Automation.SelectionItemPattern]::Pattern,
                     [System.Windows.Automation.TogglePattern]::Pattern)) {
        $o = $null
        if ($el.TryGetCurrentPattern($p, [ref]$o)) {
            if ($o -is [System.Windows.Automation.InvokePattern]) { $o.Invoke() }
            elseif ($o -is [System.Windows.Automation.SelectionItemPattern]) { $o.Select() }
            else { $o.Toggle() }
            return
        }
    }
    Click-Ui $el
}

function Click-Ui($el) {
    $r = $el.Current.BoundingRectangle
    [SaWin]::Click([int]($r.X + $r.Width / 2), [int]($r.Y + $r.Height / 2))
}

function Save-Snap([string]$Name, $el = $null, [int]$Pad = 0) {
    # Captura de la ventana/elemento (o de la pantalla principal) a demo\material\capturas\<Name>.png
    if ($el) { $r = $el.Current.BoundingRectangle; $x=[int]$r.X-$Pad; $y=[int]$r.Y-$Pad; $w=[int]$r.Width+2*$Pad; $h=[int]$r.Height+2*$Pad }
    else { $b = [System.Windows.Forms.Screen]::PrimaryScreen.Bounds; $x=$b.X; $y=$b.Y; $w=$b.Width; $h=$b.Height }
    $bmp = New-Object System.Drawing.Bitmap $w, $h
    $g = [System.Drawing.Graphics]::FromImage($bmp)
    $g.CopyFromScreen($x, $y, 0, 0, $bmp.Size)
    $path = Join-Path $script:SaOut "$Name.png"
    $bmp.Save($path, [System.Drawing.Imaging.ImageFormat]::Png)
    $g.Dispose(); $bmp.Dispose()
    $path
}

function Get-UiNames($root, [int]$Max = 80, [string]$Type = $null) {
    # Lista de nombres visibles (para descubrir qué hay en pantalla)
    $all = $root.FindAll($TS::Descendants, [System.Windows.Automation.Condition]::TrueCondition)
    $all | Where-Object { $_.Current.Name -and (-not $Type -or $_.Current.ControlType.ProgrammaticName -eq "ControlType.$Type") } |
        Select-Object -First $Max | ForEach-Object { "{0} | {1}" -f $_.Current.ControlType.ProgrammaticName.Replace('ControlType.',''), $_.Current.Name }
}
