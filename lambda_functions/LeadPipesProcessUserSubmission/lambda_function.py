import boto3
import decimal
import json
import time
import uuid

from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import DYNAMODB_CONTEXT
from collections import Mapping, Sequence, Set
from decimal import Decimal
from mapbox import Geocoder

# Inhibit Inexact Exceptions
DYNAMODB_CONTEXT.traps[decimal.Inexact] = 0
# Inhibit Rounded Exceptions
DYNAMODB_CONTEXT.traps[decimal.Rounded] = 0

ADDRESS_TEMPLATE = '{address}, {city}, {state}'


def _sanitize(data):
    """
    Sanitizes an object so it can be updated to dynamodb (recursive).

    See https://github.com/boto/boto3/issues/369#issuecomment-195495046
    """
    if not data and isinstance(data, (basestring, Set)):
        new_data = None  # empty strings/sets are forbidden by dynamodb
    elif isinstance(data, (basestring, bool)):
        new_data = data  # important to handle these one before sequence and int!
    elif isinstance(data, Mapping):
        new_data = {key: _sanitize(data[key]) for key in data}
    elif isinstance(data, Sequence):
        new_data = [_sanitize(item) for item in data]
    elif isinstance(data, Set):
        new_data = {_sanitize(item) for item in data}
    elif isinstance(data, (float, int, long, complex)):
        new_data = decimal.Decimal(data)
    else:
        new_data = data
    return new_data


def lambda_handler(event, context):
    """
    Create a new form response.
    """

    resource = boto3.resource('dynamodb')
    client = boto3.client('dynamodb')

    session_table = resource.Table('LeadPipesSession')
    session_query = session_table.query(
        KeyConditionExpression=Key('sessionid').eq(event.get('sessionid'))
    )

    if not len(session_query['Items']):
        return {'message': 'Bad/missing session ID'}


    config_table = resource.Table('LeadPipesConfig')
    mapbox_api_key_query = config_table.query(
        KeyConditionExpression=Key('key').eq('mapbox_api_key')
    )

    mapbox_api_key = mapbox_api_key_query['Items'][0]['value']

    full_address = ADDRESS_TEMPLATE.format(**event)
    geocoder = Geocoder(access_token=mapbox_api_key)
    geo_resp = geocoder.forward(full_address)

    geo_data = geo_resp.geojson()

    if not len(geo_data['features']):
        return {'message': 'Bad address'}
    else:
        top_hit = geo_data['features'][0]

    item = _sanitize({
            'id': unicode(uuid.uuid4()),
            'timestamp': unicode(time.time()),
            'sessionid': event.get('sessionid'),
            'submitted_address': full_address,
            'processed_address': top_hit.get('place_name', ''),
            'email': event.get('email'),
            'name': event.get('name'),
            'pipetype': event.get('pipe-type'),
            'geometry': top_hit.get('geometry'),
            'geojson': geo_data,
    })

    response_table = resource.Table('LeadPipesResponse')
    response_table.put_item(Item=item)

    return {'message': 'Form from {sessionid} submitted successfully.'.format(**event)}
