from typing import Any, Optional

def success_response(data: Any = None, message: str = "Success") -> dict:
    response = {"success": True}
    if data is not None:
        response["data"] = data
    response["message"] = message
    return response

def error_response(message: str) -> dict:
    return {
        "success": False,
        "message": message
    }
