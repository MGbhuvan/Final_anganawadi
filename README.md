# Poshan Abhiyan (Python Backend + MySQL)

This project is split into:

- `frontend/` - Vanilla HTML/CSS/JS pages
- `backend/` - Python FastAPI backend with MySQL

MySQL Workbench is fully compatible. Use Workbench to create/manage the `DB_NAME` database and inspect tables/data.

## Folder Structure

- `frontend/*.html` - App pages
- `frontend/static/*` - Shared image assets
- `frontend/js/shared/*` - API client and shared helpers
- `frontend/js/pages/*` - Page-level logic
- `backend/app/main.py` - FastAPI app and route registration
- `backend/app/routers/*` - API routes
- `backend/app/services/*` - SQL and validation logic
- `backend/app/schema.py` - Schema auto-init at startup
- `backend/sql/init.sql` - SQL script you can run in Workbench
- `backend/requirements.txt` - Python dependencies

## Backend Setup (Python)

1. Create `.env` from template:

```bash
cd backend
copy .env.example .env
```

2. Set DB values in `.env`:

- `DB_HOST`
- `DB_PORT`
- `DB_USER`
- `DB_PASSWORD`
- `DB_NAME`

3. Create and activate virtual environment:

```bash
python -m venv .venv
.venv\Scripts\activate
```

4. Install dependencies:

```bash
pip install -r requirements.txt
```

5. Start backend:

```bash
python run.py
```

Backend runs on `http://localhost:4000` (default `PORT=4000`).

Health check:

- `GET http://localhost:4000/api/health`

## Frontend Setup

Serve frontend as static files:

```bash
cd frontend
python -m http.server 5500
```

Open:

- `http://localhost:5500/intro.html`

## API Endpoints

- `GET/POST/DELETE /api/students`
- `GET/POST/DELETE /api/children`
- `GET/POST/PATCH/DELETE /api/pregnant-women`
- `GET/POST/PATCH/DELETE /api/attendance`
- `GET/POST/DELETE /api/ration-stocks`

Error response shape:

```json
{ "error": "message", "code": "VALIDATION_ERROR|NOT_FOUND|CONFLICT|INTERNAL_ERROR" }
```

## Notes

- No auth is enforced in this v1.
- LocalStorage migration is not performed; MySQL starts fresh.
"# Final_anganawadi" 
