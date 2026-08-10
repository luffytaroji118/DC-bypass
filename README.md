# DC Bypass

DoubleCounter verification bypass — paste a link, get a result.

Two services deployed from this repo to Railway (or run locally):

- `backend/` — FastAPI + async httpx. Streams solve progress over SSE. Calls your Turnstile solver and the residential proxy.
- `frontend/` — TanStack Start (React + Vite + Nitro). Single input field, live step labels.

The Turnstile **solver** is NOT in this repo — you host it yourself and point the backend at it via `SOLVER_URL`.

## Architecture

```
Frontend (Railway) ──SSE──▶ Backend (Railway) ──▶ Solver (you host, SOLVER_URL)
                                 │
                                 └──▶ Residential proxy (PROXY_URL) for GET verify + POST token
```

## Railway setup (2 services, same repo)

Create two services from this repo, each with a Root Directory:

### 1. Backend service
- **Root Directory:** `backend`
- **Build:** Dockerfile (auto-detected)
- **Variables:**
  - `SOLVER_URL` — your solver's public URL, e.g. `http://<solver-host>:6767`
  - `PROXY_URL` — rotating residential proxy, `http://user:pass@host:port`
  - `CORS_ORIGINS` — the frontend's Railway URL, e.g. `https://<frontend>.up.railway.app`
  - `MAX_CONCURRENT` — `3` (how many solves hit the solver at once)
  - `SOLVER_NAV_TIMEOUT_MS` — `60000` (optional, default 60000)

### 2. Frontend service
- **Root Directory:** `frontend`
- **Build:** Dockerfile (uses `NITRO_PRESET=node-server`)
- **Variables:**
  - `VITE_API_BASE` — the backend's Railway URL, e.g. `https://<backend>.up.railway.app`

> Set the frontend and backend URLs on each other after the first deploy (you won't know the URLs until they exist). Redeploy to bake `VITE_API_BASE` into the frontend build.

## Run locally

1. **Solver** — run your Turnstile solver on `http://localhost:6767`

2. **Backend:**
   ```sh
   cd backend
   pip install -r requirements.txt
   $env:SOLVER_URL="http://localhost:6767"
   $env:PROXY_URL="http://user:pass@host:port"
   $env:CORS_ORIGINS="http://localhost:5173"
   uvicorn main:app --port 8000 --reload
   ```

3. **Frontend:**
   ```sh
   cd frontend
   npm install
   $env:VITE_API_BASE="http://localhost:8000"
   npm run dev
   ```

## Endpoints (backend)

- `GET /api/solve?link=<verify-url>` → `text/event-stream` of JSON step events:
  `loading` → `solving` → `verifying` → `done` (with `success`, `userid`)
- `GET /api/health` → `{ ok, solver, max_concurrent }`

## Notes

- Per-request rotating proxy (no sticky session needed — verified). Each request is independent → concurrent-safe.
- `asyncio.Semaphore(MAX_CONCURRENT)` caps concurrent solver calls; extra requests queue with a `queued` SSE event.
- No credentials are baked into the images — all secrets via env vars.
