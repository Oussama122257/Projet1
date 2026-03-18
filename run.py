#!/usr/bin/env python3
"""Start the Threads Bot SaaS server."""
import os
import uvicorn

if __name__ == "__main__":
    port = int(os.environ.get("PORT", 8000))
    uvicorn.run("app.main:app", host="0.0.0.0", port=port, reload=os.environ.get("RAILWAY_ENVIRONMENT") is None)
