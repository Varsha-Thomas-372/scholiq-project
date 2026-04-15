# How We Fixed X Issue

## Issue 1: Backend signup endpoint failed
- Symptom: Frontend auth modal displayed `Failed to fetch` on signup.
- Root cause: backend `/auth/signup` returned 500 because SDK key format compatibility mismatch.
- Resolution:
  1. Reworked backend Supabase integration to REST API calls.
  2. Verified endpoint with direct POST call.

## Issue 2: Upload endpoint network errors
- Symptom: Upload flow intermittently failed with `Failed to fetch`.
- Root cause: local host/origin mismatch and dev CORS pathing.
- Resolution:
  1. Added Vite reverse proxy for `/api`.
  2. Updated frontend API client to retry `localhost` and `127.0.0.1`.
  3. Improved user-facing error text with actionable remediation.
