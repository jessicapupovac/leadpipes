import boto3
import decimal
import time
import uuid

from boto3.dynamodb.conditions import Key
from boto3.dynamodb.types import DYNAMODB_CONTEXT
from collections import Mapping, Sequence, Set

# Inhibit Inexact Exceptions
DYNAMODB_CONTEXT.traps[decimal.Inexact] = 0
# Inhibit Rounded Exceptions
DYNAMODB_CONTEXT.traps[decimal.Rounded] = 0


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

    session_table = resource.Table('LeadPipesSession')
    session_query = session_table.query(
        KeyConditionExpression=Key('sessionid').eq(event.get('sessionid'))
    )

    if not len(session_query['Items']):
        return {'errorMessage': 'session error'}

    item = _sanitize({
        'id': unicode(uuid.uuid4()),
        'timestamp': unicode(time.time()),
        'sessionid': event.get('sessionid'),
        'email': event.get('email'),
        'name': event.get('name'),
        'pipetype': event.get('pipetype'),
        'address': event.get('address'),
        'city': event.get('city'),
        'state': event.get('state')
    })

    response_table = resource.Table('LeadPipesResponse')
    response_table.put_item(Item=item)

    return {'message': 'Form submitted successfully.'.format(**event)}
