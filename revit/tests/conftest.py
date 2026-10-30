# -*- coding: utf-8 -*-
"""Los módulos puros de la extensión (lib/sa_model) bajo CPython, como pyRevit pone lib/ en sys.path dentro de Revit."""
import os
import sys

HERE = os.path.dirname(os.path.abspath(__file__))
EXTENSION = os.path.join(HERE, "..", "SpaceAnalytics.extension")
FIXTURES = os.path.join(HERE, "fixtures")
sys.path.insert(0, os.path.join(EXTENSION, "lib"))
