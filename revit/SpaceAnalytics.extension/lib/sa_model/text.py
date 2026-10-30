# -*- coding: utf-8 -*-
"""Cómo dicen los diálogos lo que pasó: el resumen al terminar de exportar."""
from __future__ import absolute_import, division, print_function, unicode_literals

from sa_model import roles

MAX_FAILURES = 8


def counts(document):
    """'2 niveles · 14 rooms · …' (solo lo que no está vacío; los rooms siempre)."""
    parts = []
    for key, label in roles.LABELS:
        n = len(document.get(key) or {})
        if n or key == "rooms":
            parts.append("{0} {1}".format(n, label))
    return " · ".join(parts)


def warnings(document, dropped=None, failures=None):
    """Los avisos, en el orden en que importan para la app."""
    out = []
    labels = dict(roles.LABELS)
    if not document.get("rooms"):
        out.append("Sin rooms: la app no tiene grafo de espacios ni rutas (¿rooms sin colocar o sin cerrar?).")
    doors = document.get("doors") or []
    if not doors:
        out.append("Sin puertas: no hay accesos ni conexiones entre rooms.")
    elif not roles.accesses(document):
        out.append("Sin puertas de acceso: ninguna puerta tiene un lado sin room (exterior).")
    if not document.get("floors"):
        out.append("Sin pisos: la retícula se arma dentro de los rooms.")
    unknown = roles.unknown_roles(document)
    if unknown:
        out.append("SA_Rol con valores que la app no conoce: {0} (conoce {1}).".format(
            ", ".join("{0}".format(u) for u in unknown), ", ".join(roles.ROLES)))
    if dropped:
        parts = ["{0} {1}".format(n, labels.get(k, k)) for k, n in sorted(dropped.items()) if n]
        if parts:
            out.append("Omitidos por no tener geometría: {0}.".format(", ".join(parts)))
    if failures:
        lines = ["{0} {1}: {2}".format(labels.get(k, k), i, msg) for k, i, msg in failures[:MAX_FAILURES]]
        more = len(failures) - len(lines)
        tail = "\n  … y {0} más".format(more) if more > 0 else ""
        out.append("{0} elementos fallaron y no se exportaron:\n  {1}{2}".format(
            len(failures), "\n  ".join(lines), tail))
    return out


def skipped_line(skipped):
    """'Omitidos a propósito: 3 demolidos, 1 room sin colocar.' o None."""
    parts = ["{0} {1}".format(n, label) for label, n in sorted((skipped or {}).items()) if n]
    return "Omitidos a propósito: {0}.".format(", ".join(parts)) if parts else None


def summary(document, dropped=None, failures=None, files=None, compared=None, note=None, skipped=None):
    """(mensaje, detalle) para forms.alert. `files` son las rutas escritas; `compared`, las etapas que van en el HTML
    además de la nueva; `note`, algo más que decir (p. ej. que no se encontró la app); `skipped`, {motivo: cuántos}
    de lo que se dejó fuera a propósito (demolidos, rooms sin colocar…)."""
    src = document.get("source") or {}
    msg = "{0} · {1}".format(src.get("file", ""), src.get("stage", ""))
    parts = [counts(document)]
    doors = document.get("doors") or []
    if doors:
        parts.append("Accesos: {0} ({1} con SA_Rol = Entrada).".format(
            len(roles.accesses(document)), len(roles.entrances(document))))
    if src.get("links"):
        parts.append("Vínculos incluidos: {0}.".format(", ".join(src["links"])))
    if compared:
        parts.append("El HTML compara con: {0}.".format(", ".join(compared)))
    found = warnings(document, dropped, failures)
    if found:
        parts.append("Avisos:\n- " + "\n- ".join(found))
    line = skipped_line(skipped)
    if line:
        parts.append(line)
    if note:
        parts.append(note)
    if files:
        parts.append("Archivos:\n" + "\n".join(files))
    return msg, "\n\n".join(parts)
