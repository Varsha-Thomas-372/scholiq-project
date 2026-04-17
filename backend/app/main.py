from fastapi import FastAPI, Request
from fastapi.middleware.cors import CORSMiddleware
import time
from collections import deque
from typing import Deque

from app.config import get_settings
from app.routers.ai import router as ai_router
from app.routers.auth import router as auth_router
from app.routers.faculty import router as faculty_router

settings = get_settings()

app = FastAPI(title="SCHOLIQ Backend", version="1.0.0")

# ✅ ROOT ENDPOINT (IMPORTANT)
@app.get("/")
def root():
    return {"message": "Scholiq API is running 🚀"}

# ✅ HEALTH ENDPOINT
@app.get("/health")
def health():
    return {"status": "ok"}

# Metrics (simulates Azure App Insights)
req_count = 0
error_count = 0
latencies: Deque[float] = deque(maxlen=100)

class MetricsMiddleware:
    def __init__(self, app):
        self.app = app

    async def __call__(self, scope, receive, send):
        global req_count, error_count, latencies
        start_time = time.perf_counter()
        req_count += 1

        async def wrapped_send(message):
            if message["type"] == "http.response.start":
                status = message.get("status", 200)
                if status >= 400:
                    error_count += 1
            await send(message)
            if message["type"] == "http.response.body":
                latency = time.perf_counter() - start_time
                latencies.append(latency)

        await self.app(scope, receive, wrapped_send)

app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)

app.add_middleware(MetricsMiddleware)

app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(faculty_router)

print("[METRICS] Backend ready.")