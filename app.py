#!/usr/bin/env python
"""
Example application views.

Note that `render_template` is wrapped with `make_response` in all application
routes. While not necessary for most Flask apps, it is required in the
App Template for static publishing.
"""

import app_config
import csv
import logging
import oauth
import static
import us

from copydoc import CopyDoc
from flask import Flask, make_response, render_template
from render_utils import make_context, smarty_filter, urlencode_filter, markdown_filter
from werkzeug.debug import DebuggedApplication

app = Flask(__name__)
app.debug = app_config.DEBUG

app.add_template_filter(smarty_filter, name='smarty')
app.add_template_filter(urlencode_filter, name='urlencode')
app.add_template_filter(markdown_filter, name='markdown')

logging.basicConfig(format=app_config.LOG_FORMAT)
logger = logging.getLogger(__name__)
logger.setLevel(app_config.LOG_LEVEL)


@app.route('/')
@oauth.oauth_required
def index():
    """
    Example view demonstrating rendering a simple HTML page.
    """
    context = make_context()
    context['initial_card'] = context['COPY']['content']['initial_card'].__unicode__()
    context['cards'] = _make_card_list()
    context['us_states'] = us.states.STATES_AND_TERRITORIES
    return make_response(render_template('index.html', **context))


def _make_card_list():
    """
    Make list of id, html pairs
    """
    cards = []

    with open('data/doclist.csv', 'r') as f:
        reader = csv.reader(f)
        ids = [item[0] for item in list(reader)]

    ids = sorted(ids)

    for id in ids:
        with open('data/%s.html' % id, 'r') as f:
            html = f.read()
        cards.append([id, CopyDoc(html)])

    return cards


app.register_blueprint(static.static)
app.register_blueprint(oauth.oauth)

# Enable Werkzeug debug pages
if app_config.DEBUG:
    wsgi_app = DebuggedApplication(app, evalex=False)
else:
    wsgi_app = app

# Catch attempts to run the app directly
if __name__ == '__main__':
    logging.error('This command has been removed! Please run "fab app" instead!')
