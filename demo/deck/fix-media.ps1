# Reinserta los videos del deck desde PowerPoint (COM) para que se reproduzcan.
# pptxgenjs escribe un <p:pic> de video sin <p:timing> y con el póster JPEG guardado como .png: PowerPoint no lo reproduce.
# Cada forma "Video <archivo>.mp4" se cambia por una que inserta PowerPoint en el mismo lugar, con su póster,
# inicio automático y en bucle. Busca el archivo en material\clips y material\revit, y el póster en <archivo>-poster.jpg.
# Uso:  pwsh -File fix-media.ps1 -In <deck generado> -Out <deck final>
param([Parameter(Mandatory)][string]$In, [Parameter(Mandatory)][string]$Out)
$ErrorActionPreference = 'Stop'
$M = Resolve-Path (Join-Path $PSScriptRoot '..\material')
$In = (Resolve-Path $In).Path
$Out = [IO.Path]::GetFullPath($Out)

function Find-Media([string]$Name) {
    foreach ($d in 'clips', 'revit') { $p = Join-Path $M "$d\$Name"; if (Test-Path $p) { return $p } }
    throw "No encuentro $Name en material\clips ni material\revit"
}

function Set-AutoPlay($Slide, [string]$ShapeName) {
    $seq = $Slide.TimeLine.MainSequence
    for ($k = 1; $k -le $seq.Count; $k++) {
        $e = $seq.Item($k)
        if ($e.Shape.Name -eq $ShapeName) { $e.Timing.TriggerType = 3; $e.Timing.TriggerDelayTime = 0 }   # msoAnimTriggerAfterPrevious
    }
}

$ppt = New-Object -ComObject PowerPoint.Application
$pr = $ppt.Presentations.Open($In, 0, 0, 0)   # lectura y escritura, sin ventana
try {
    $n = 0
    foreach ($s in $pr.Slides) {
        $videos = @($s.Shapes | Where-Object { $_.Name -like 'Video *.mp4' })
        foreach ($v in $videos) {
            $file = Find-Media ($v.Name -replace '^Video ', '')
            $poster = [IO.Path]::ChangeExtension($file, $null).TrimEnd('.') + '-poster.jpg'
            $l, $t, $w, $h, $name = $v.Left, $v.Top, $v.Width, $v.Height, $v.Name
            $v.Delete()
            $nv = $s.Shapes.AddMediaObject2($file, 0, -1, $l, $t, $w, $h)   # incrustado, no vinculado
            $nv.Name = $name
            $nv.AlternativeText = "Video: $([IO.Path]::GetFileNameWithoutExtension($file))"
            if (Test-Path $poster) { $nv.MediaFormat.SetDisplayPictureFromFile($poster) }
            $ps = $nv.AnimationSettings.PlaySettings
            $ps.PlayOnEntry = -1; $ps.LoopUntilStopped = -1; $ps.HideWhileNotPlaying = 0; $ps.RewindMovie = -1
            # PlayOnEntry deja el efecto "al hacer clic": se pasa a "después del anterior" (= automáticamente al entrar)
            Set-AutoPlay $s $name
            "  diapositiva $($s.SlideIndex): $([IO.Path]::GetFileName($file))"
            $n++
        }
    }
    $pr.SaveAs($Out, 24)   # ppSaveAsOpenXMLPresentation
    "✓ $n videos reinsertados → $Out"
} finally {
    $pr.Close()
}
