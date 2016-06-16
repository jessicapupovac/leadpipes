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

@task
def move_copydocs_to_content_directory():
    with open('data/doclist.csv', 'r') as f:
        reader = csv.reader(f)
        ids = [item[0] for item in list(reader)]

    ids = sorted(ids)

    for id in ids:
        with open('data/%s.html' % id, 'r') as f:
            html = f.read()

        with codecs.open('content/%s.html' % id, 'w', 'utf-8') as f:
            doc = CopyDoc(html)
            soup = BeautifulSoup(doc.__unicode__(), 'html.parser')
            f.write(soup.prettify(formatter='html'))
