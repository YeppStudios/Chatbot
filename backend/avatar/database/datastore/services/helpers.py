import uuid
import hashlib


def create_uuid_from_string(val: str) -> str:
    """
    Creates deterministic UUID based on the input string.

    Args:
        val (str): Input string.

    Returns:
        str: String representation of the UUID.
    """
    hex_string = hashlib.md5(val.encode("UTF-8")).hexdigest()
    return str(uuid.UUID(hex=hex_string))
