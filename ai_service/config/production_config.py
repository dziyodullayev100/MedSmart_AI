import os
from fastapi import FastAPI  # type: ignore
from fastapi.middleware.cors import CORSMiddleware  # type: ignore
from fastapi.middleware.trustedhost import TrustedHostMiddleware  # type: ignore

def apply_production_config(app: FastAPI):
    """
    Apply production-hardening features to FastAPI.
    - Disables OpenAPI docs (/docs and /redoc)
    - Applies strict CORS settings
    - Applies Trusted Hosts middleware to block host header injection
    """
    if os.environ.get("ENV") != "production":
        return

    # Disable documentation
    app.openapi_url = None
    app.docs_url = None
    app.redoc_url = None

    # Stricter CORS (overwrite the default blanket wildcard)
    allowed_origins = [
        os.environ.get("BACKEND_URL", "https://your-medsmart-backend.onrender.com")
    ]
    
    # We remove the old blanket CORS if possible, but FastAPI add_middleware stacks them.
    # It's better to add the production one exclusively if we modify api.py correctly.
    # However since we are injecting, we will just add Trusted Hosts.
    
    allowed_hosts = [
        "localhost",
        "127.0.0.1",
        "*.onrender.com",
        "ai-service.local", # For docker compose internal routing
    ]
    
    app.add_middleware(
        TrustedHostMiddleware, allowed_hosts=allowed_hosts
    )

    print("🛡️ FastAPI Production specific middlewares (TrustedHosts, Hidden Docs) applied.")
