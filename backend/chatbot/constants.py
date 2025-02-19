from enum import Enum

class SupportedModels(str, Enum):
    gpt_4o = "gpt-4o"
    gpt_4 = "gpt-4"
    gpt_4_turbo = "gpt-4-turbo"
    gpt_3_5_turbo = "gpt-3.5-turbo"


class ErrorCodes(str, Enum):
    INVALID_REQUEST = "INVALID_REQUEST"
