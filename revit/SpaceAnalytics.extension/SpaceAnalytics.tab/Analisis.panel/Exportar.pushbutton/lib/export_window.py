# -*- coding: utf-8 -*-
"""La ventana de Exportar (export.xaml, en este mismo botón) con el estilo de la app: elegir los vínculos, leer el
modelo con su avance y mostrar el resumen. La lectura corre dentro de la ventana modal, en el contexto de la API de
Revit como cualquier botón de pyRevit; cada avance deja que WPF se redibuje y atienda Cancelar."""
from __future__ import absolute_import, division, print_function, unicode_literals

import os
import time

import System
from System.Windows import Visibility
from System.Windows.Controls import Border, CheckBox, TextBlock
from System.Windows.Threading import DispatcherPriority
from pyrevit import forms

from sa_revit import shell

PUMP_EVERY = 0.05  # segundos entre redibujos mientras se lee el modelo


class ExportWindow(forms.WPFWindow):
    """`export(vínculos, tick)` hace la exportación y devuelve el informe (text.report más 'html', la ruta del
    HTML escrito o None); `tick(hechos, total)` levanta `cancelled` si se pidió cancelar. Al cerrar, `open_path` es lo
    que hay que abrir en el navegador (o None)."""

    def __init__(self, xaml, mark, info, hint, links, folder, export, cancelled):
        forms.WPFWindow.__init__(self, xaml)
        self.set_icon(mark)
        self.set_image_source(self.mark, mark)
        self.model_info.Text = info
        self.setup_hint.Text = hint
        self._links = []
        for label, inst in links:
            box = CheckBox()
            box.Content = label
            box.IsChecked = True
            box.Style = self.FindResource("Check")
            self.links_panel.Children.Add(box)
            self._links.append((box, inst))
        if not links:
            self.links_card.Visibility = Visibility.Collapsed
        self.dest_path.Text = folder
        self._folder, self._export, self._cancelled = folder, export, cancelled
        self._busy = self._cancel = False
        self._last_pump = 0.0
        self._html = self.open_path = None
        self.Closing += self._closing

    # ---- páginas
    def _page(self, page):
        for p in (self.page_setup, self.page_work, self.page_done):
            p.Visibility = Visibility.Visible if p is page else Visibility.Collapsed

    def _pump(self):
        """Deja que WPF pinte y atienda clics (Cancelar) mientras el código sigue en este hilo."""
        self._last_pump = time.time()
        self.Dispatcher.Invoke(System.Action(lambda: None), DispatcherPriority.Background)

    # ---- eventos del XAML
    def drag_window(self, sender, args):
        try:
            self.DragMove()
        except Exception:
            pass

    def close_click(self, sender, args):
        self.Close()

    def cancel_click(self, sender, args):
        self._cancel = True
        self.cancel_btn.IsEnabled = False
        self.work_detail.Text = "Cancelando…"

    def _closing(self, sender, args):
        if self._busy:  # Esc o ✕ a medio leer: se cancela la lectura en vez de cerrar
            args.Cancel = True
            self.cancel_click(sender, None)

    def export_click(self, sender, args):
        links = [inst for box, inst in self._links if box.IsChecked]
        self._page(self.page_work)
        self._busy, self._cancel = True, False
        self.cancel_btn.IsEnabled = True
        self.progress.Value = 0
        self.work_detail.Text = ""
        self._pump()
        try:
            report = self._export(links, self._tick)
        except self._cancelled:
            self._busy = False
            self._page(self.page_setup)
            self.setup_hint.Text = "Exportación cancelada. No se escribió nada."
            return
        except Exception as ex:
            report = {"title": "No se pudo exportar", "counts": [], "lines": [], "warnings": ["{0}".format(ex)],
                      "files": [], "html": None, "error": True}
        self._busy = False
        self._show(report)

    def _tick(self, done, total):
        if self._cancel:
            raise self._cancelled()
        if time.time() - self._last_pump < PUMP_EVERY and done < total:
            return
        self.progress.Value = done / float(max(total, 1))
        self.work_detail.Text = "{0:,} de {1:,} elementos".format(done, total)
        self.work_title.Text = "Inhala" if int(time.time() / 2) % 2 == 0 else "Exhala"
        self._pump()

    def folder_click(self, sender, args):
        shell.open_path(self._folder)

    def open_click(self, sender, args):
        self.open_path = self._html
        self.Close()

    # ---- resumen
    def _show(self, report):
        self._page(self.page_done)
        warn = report["warnings"]
        self.done_eyebrow.Text = ("NO SE PUDO EXPORTAR" if report.get("error") else
                                  "LISTO · CON AVISOS" if warn else "LISTO")
        if warn:
            self.done_eyebrow.Foreground = self.FindResource("AmberInk")
        self.done_title.Text = report["title"]
        for label in report["counts"]:
            chip = Border()
            chip.Style = self.FindResource("Chip")
            text = TextBlock()
            text.Text = label
            text.FontSize = 11.5
            chip.Child = text
            self.counts_panel.Children.Add(chip)
        self.done_lines.Text = "\n".join(report["lines"])
        if not report["lines"]:
            self.done_lines.Visibility = Visibility.Collapsed
        self.warn_text.Text = "\n".join("•  " + w for w in warn)
        if not warn:
            self.warn_card.Visibility = Visibility.Collapsed
        self.files_text.Text = "\n".join(os.path.basename(f) for f in report["files"]) or "—"
        self._html = report.get("html")
        if not self._html:
            self.open_btn.Visibility = Visibility.Collapsed
