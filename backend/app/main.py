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

# Metrics (simulates Azure App Insights)
req_count = 0
error_count = 0
latencies: Deque[float] = deque(maxlen=100)  # Rolling p95

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
                # Log summary every 100 reqs or if error rate high
                if req_count % 100 == 0 or (error_count / req_count > 0.01):
                    p95 = sorted(latencies)[-int(len(latencies)*0.95)] if latencies else 0
                    print(f"[METRICS] reqs:{req_count} errs:{error_count}({error_count/req_count:.1%}) p95:{p95*1000:.0f}ms")
                # Alert sim: error >1% or p95 >500ms
                if error_count / req_count > 0.01 or (latencies and p95 > 0.5):
                    print(f"[ALERT] High error rate {error_count/req_count:.1%} or latency p95 {p95*1000:.0f}ms")

        await self.app(scope, receive, wrapped_send)

app = FastAPI(title="SCHOLIQ Backend", version="1.0.0")
app.add_middleware(
    CORSMiddleware,
    allow_origins=settings.cors_origins_list,
    allow_credentials=True,
    allow_methods=["*"],
    allow_headers=["*"],
)
app.add_middleware(MetricsMiddleware)

@app.get("/health")
def health():
    return {"status": "ok"}

app.include_router(ai_router)
app.include_router(auth_router)
app.include_router(faculty_router)

# Startup log
print("[METRICS] Backend ready. Logs simulate Azure App Insights: request count, error rate (<1% target), p95 latency (<500ms target).")

