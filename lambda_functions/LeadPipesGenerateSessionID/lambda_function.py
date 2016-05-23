import uuid


def lambda_handler(event, context):
    """
    Return a UUID.
    """
    return unicode(uuid.uuid4())
