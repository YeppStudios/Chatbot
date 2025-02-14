import arrow


def to_unix_timestamp(date_str: str) -> int:
    """
    Converts a date string to a unix timestamp (seconds since epoch). If the date string cannot be parsed as a valid date format,
    returns the current unix timestamp and prints a warning.

    Args:
        date_str (str): The date string to convert.

    Returns:
        int: The unix timestamp corresponding to the date string.
    """
    try:
        date_obj = arrow.get(date_str)
        return int(date_obj.timestamp())
    except arrow.parser.ParserError:
        print(f"Invalid date format: {date_str}")
        return int(arrow.now().timestamp())
