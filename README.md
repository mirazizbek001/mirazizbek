# Bon-Bon — Railway single-service deployment

This repository root is the **whole project**. Deploy this root with Railway's Dockerfile builder.

## Structure
- `Dockerfile` — builds React and runs Django + Nginx in one service
- `backend/` — Django API, auth, sessions and database models
- `frontend/react/` — React application
- `railway/` — Nginx and startup configuration
- `railway.toml` — Railway deployment configuration

## Railway
1. Deploy the repository **root** (do not deploy only `frontend/react`).
2. Add a Railway PostgreSQL database and link its `DATABASE_URL` to the web service (recommended).
3. Or add a Railway Volume mounted at `/data` for persistent SQLite storage.
4. Set `SECRET_KEY` to a long random value.
5. Open `/health` after deployment.

Railway production requires PostgreSQL or a Volume mounted at `/data`. If neither is configured, startup stops with an actionable error instead of using temporary SQLite and risking data loss.

Do not commit `backend/db.sqlite3`; production data belongs in the Railway Volume or PostgreSQL.
