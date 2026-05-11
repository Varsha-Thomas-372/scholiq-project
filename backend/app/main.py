from fastapi import FastAPI, Request, Depends, HTTPException, status, File, UploadFile
from fastapi.middleware.cors import CORSMiddleware
import time
from collections import deque
from typing import Deque, Annotated
import json

from msal import ConfidentialClientApplication
from app.config import get_settings
from app.routers.ai import router as ai_router
from app.routers.auth import router as auth_router
from app.routers.faculty import router as faculty_router
from app.services.azure_db_service import engine
from app.services.azure_blob_service import get_blob_service_client, upload_syllabus_pdf

settings = get_settings()

app = FastAPI(title="SCHOLIQ Backend - Azure", version="1.0.0")

# AD B2C JWT Validation (stub - replace with your tenant/client)
B2C_CONFIG = {
    "authority": "https://yourtenant.b2clogin.com/yourtenant.onmicrosoft.com/B2C_1_signup_signin",
    "client_id": "your-app-client-id",
    "client_credential": "your-client-secret"
}
b2c_app = ConfidentialClientApplication(B2C_CONFIG["client_id"], authority=B2C_CONFIG["authority"], client_credential=B2C_CONFIG["client_credential"])

async def verify_token(authorization: str = Depends(lambda: None)):
    if not authorization or not authorization.startswith("Bearer "):
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid token")
    token = authorization.split(" ")[1]
    result = b2c_app.acquire_token_silent(scopes=["api://your-api-scope"], account=None)
    if not result or "access_token" not in result:
        raise HTTPException(status_code=status.HTTP_401_UNAUTHORIZED, detail="Invalid B2C token")
    return result

@app.get("/")
async def root():
    return {"status": "healthy"}

@app.get("/health")
async def health():
    try:
        with engine.connect() as conn:
            conn.execute(text("SELECT 1"))
    except Exception as e:
        return {"status": "error", "sql": str(e)}
    
    try:
        blob_client = get_blob_service_client()
        list(blob_client.list_containers(limit=1))
    except Exception as e:
        return {"status": "error", "blob": str(e)}
    
    return {"status": "healthy", "sql": "ok", "blob": "ok"}

@app.post("/test-db")
async def test_db(payload: SignupRequest, token: str = Depends(verify_token)):
    result = upsert_user_profile(payload)
    return result

@app.post("/upload-test")
async def upload_test(file: UploadFile = File(...)):
    content = await file.read()
    url = upload_syllabus_pdf("test-" + str(time.time()), content)
    return {"uploaded": True, "url": url}

@app.on_event("startup")
async def startup_event():
    print("🚀 SCHOLIQ Azure Backend started")

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

app.include_router(ai_router, dependencies=[Depends(verify_token)])
app.include_router(auth_router)
app.include_router(faculty_router)

print("[METRICS] Azure Backend ready.")

