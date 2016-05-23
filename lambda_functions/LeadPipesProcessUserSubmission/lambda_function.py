import boto3
import geocoder
import json
import time
import uuid

ADDRESS_TEMPLATE = '{address}, {city}, {state}'


def lambda_handler(event, context):
    """
    Create a new form response.
    """
    full_address = ADDRESS_TEMPLATE.format(**event)
    g = geocoder.google(full_address)
    client = boto3.client('dynamodb')

    client.put_item(
        TableName='LeadPipesResponse',
        Item={
            'id': {'S': unicode(uuid.uuid4())},
            'timestamp': {'N': unicode(time.time())},
            'sessionid': {'S': event.get('sessionid')},
            'submitted_address': {'S': full_address},
            'processed_address': {'S': g.address},
            'email': {'S': event.get('email')},
            'name': {'S': event.get('name')},
            'lat': {'N': unicode(g.lat)},
            'lng': {'N': unicode(g.lng)},
            'geojson': {'S': json.dumps(g.geojson)},
        }
    )

    return {'message': 'Form from {sessionid} submitted successfully.'.format(**event)}
