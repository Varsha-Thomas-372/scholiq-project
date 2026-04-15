# Security Report (Review III)

## SAST Setup
- Workflow: [`.github/workflows/codeql.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/codeql.yml)
- Tool: GitHub CodeQL
- Scope: Python backend + TypeScript frontend

## DAST Setup
- Workflow: [`.github/workflows/zap-baseline.yml`](/C:/Users/Varsha%20Thomas/Documents/New%20project/.github/workflows/zap-baseline.yml)
- Tool: OWASP ZAP baseline scan
- Target: frontend local route (`http://127.0.0.1:5173`)

## Issues Identified and Fix Notes
1. Secret exposure risk
- Finding: Real API keys and service key were placed in local `.env` and shared in discussion context.
- Fix: Rotated keys and added `.gitignore` entries to prevent `.env` commits.

2. Backend auth signup 500 error
- Finding: Supabase Python SDK rejected `sb_secret_*` key format as invalid.
- Fix: Replaced SDK client usage with Supabase REST calls in backend service layer.

3. CORS/network instability in local dev
- Finding: intermittent frontend `Failed to fetch` due to host mismatch (`localhost` vs `127.0.0.1`).
- Fix: Added Vite proxy (`/api`) and API fallback logic in frontend client.
