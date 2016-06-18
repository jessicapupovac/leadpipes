#!/usr/bin/env python

"""
Commands that update or process the application data.
"""
import csv
import codecs

from bs4 import BeautifulSoup
from copydoc import CopyDoc
from fabric.api import task

@task(default=True)
def update():
    """
    Stub function for updating app-specific data.
    """
    pass
