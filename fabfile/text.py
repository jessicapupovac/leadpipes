#!/usr/bin/env python

"""
Commands related to syncing copytext from Google Docs.
"""

import app_config
import csv
import logging

from fabric.api import task
from oauth import get_document, get_spreadsheet, get_credentials

logging.basicConfig(format=app_config.LOG_FORMAT)
logger = logging.getLogger(__name__)
logger.setLevel(app_config.LOG_LEVEL)

FOLDER_URL_TEMPLATE = 'https://www.googleapis.com/drive/v3/files?q=\'%s\'+in+parents'

@task(default=True)
def update():
    """
    Get spreadsheet and documents
    """
    update_docs()
    update_copytext()


@task
def update_docs():
    credentials = get_credentials()
    folder_url = FOLDER_URL_TEMPLATE % app_config.GOOGLE_DOCS_FOLDER_ID
    response = app_config.authomatic.access(credentials, folder_url)

    id_list = []
    for filedata in response.data.get('files', []):
        id_list.append([filedata['name']])
        get_document(filedata['id'], 'data/%s.html' % filedata['name'])

    with open('data/doclist.csv', 'w') as f:
        writer = csv.writer(f)
        writer.writerows(id_list)


@task
def update_copytext():
    """
    Downloads a Google Doc as an Excel file.
    """
    if app_config.COPY_GOOGLE_DOC_KEY == None:
        logger.warn('You have set COPY_GOOGLE_DOC_KEY to None. If you want to use a Google Sheet, set COPY_GOOGLE_DOC_KEY  to the key of your sheet in app_config.py')
        return

    credentials = get_credentials()
    if not credentials:
        print logger.warn('No Google OAuth credentials file found.')
        print logger.warn('Run `fab app` and visit `http://localhost:8000` to generate credentials.')
        return

    get_spreadsheet(app_config.COPY_GOOGLE_DOC_KEY, app_config.COPY_PATH)
