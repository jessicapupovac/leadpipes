import boto3
import geocoder
import json

ADDRESS_TEMPLATE = '{address}, {city}, {state}'


def lambda_handler(event, context):
    """
    Return a UUID.
    """
    full_address = ADDRESS_TEMPLATE.format(**event)
    g = geocoder.google(full_address)
    client = boto3.client('dynamodb')

    client.put_item(
        TableName='LeadPipesSubmission',
        Item={
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
