import json
from typing import AsyncGenerator, Dict, Any
from fastapi.responses import StreamingResponse


async def stream_response(generator: AsyncGenerator[Dict[str, Any], None]):
    async def event_stream():
        async for event in generator:
            yield f"data: {json.dumps(event)}\n\n"
        yield "data: {\"type\": \"done\"}\n\n"

    return StreamingResponse(
        event_stream(),
        media_type="text/event-stream",
        headers={
            "Cache-Control": "no-cache",
            "Connection": "keep-alive",
            "X-Accel-Buffering": "no",
        },
    )
