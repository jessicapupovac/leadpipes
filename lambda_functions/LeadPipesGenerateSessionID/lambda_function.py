import boto3
import time
import uuid


def lambda_handler(event, context):
    """
    Set and return a UUID.
    """
    id = unicode(uuid.uuid4())

    client = boto3.client('dynamodb')
    client.put_item(
        TableName='LeadPipesSession',
        Item={
            'sessionid': {'S': id},
            'timestamp': {'N': unicode(time.time())},
        })

    return id
