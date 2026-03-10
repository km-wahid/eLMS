# eLMS – E-Learning Management System

A full-stack **E-Learning Management System** built with **React + Vite** (frontend) and **Django + DRF** (backend), featuring pre-recorded HLS video streaming, live classes, per-user course enrollment, a DRF-style CMS for content management, real-time notifications, and background task processing — all containerised with Docker.

> 🎯 **Target**: 500–1000 concurrent active users  
> ☁️ **Deployed on**: DigitalOcean Cloud Infrastructure

---

## 📋 Table of Contents

- [Live URLs](#live-urls)
- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Demo Accounts](#demo-accounts)
- [API Documentation](#api-documentation)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Author](#author)

---

## 🌐 Live URLs

| Service | URL |
|---|---|
| Frontend | http://localhost:3000 |
| Backend API | http://localhost:8000/api/ |
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| Django Admin | http://localhost:8000/admin/ |
| Celery Flower | http://localhost:5555 |
| CMS Dashboard | http://localhost:3000/cms |

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 Authentication | Register, login, JWT auth with refresh tokens, role-based access (Student / Teacher / Admin) |
| 📚 Course Catalogue | Browse & search published courses with filters by level and category |
| 🛒 Enrollment | Per-user course enrollment fully isolated — each account sees only its own enrolled courses |
| 🎥 Video Lectures | Upload recorded lectures streamed via HLS (adaptive bitrate via Celery + ffmpeg) |
| 📁 Material Sharing | Upload & download PDFs, slides, and resources per lecture |
| 📝 Assignments | Create assignments, student submission, teacher grading |
| 📡 Live Classes | Schedule live sessions (Zoom/Jitsi/Meet), with recording playback |
| 🔔 Real-Time Notifications | WebSocket-powered notifications and live class chat |
| ⚙️ Background Tasks | Video transcoding, email delivery, certificate generation via Celery + Redis |
| 🖥️ CMS | DRF-style admin CMS to manage users, courses, modules, lectures, materials, and analytics |

---

## 🛠️ Tech Stack

### Frontend
| Tool | Purpose |
|---|---|
| React 18 + Vite | UI framework and build tool |
| Tailwind CSS | Utility-first styling |
| React Router v6 | Client-side routing |
| Zustand | Lightweight state management |
| Axios | HTTP client with JWT interceptor |
| HLS.js | Adaptive video streaming |
| Lucide React | Icon library |

### Backend
| Tool | Purpose |
|---|---|
| Django 4 | Web framework |
| Django REST Framework | REST API |
| Django Channels | WebSocket support |
| Celery | Background task queue |
| SimpleJWT | JWT authentication |
| drf-spectacular | Auto-generated OpenAPI 3 / Swagger docs |
| django-storages + boto3 | DigitalOcean Spaces (S3-compatible) |
| ffmpeg | HLS video transcoding |

### Infrastructure
| Tool | Purpose |
|---|---|
| PostgreSQL | Primary relational database |
| Redis (alpine) | Cache + Celery message broker |
| NGINX | Reverse proxy, static files, media serving |
| Docker + Docker Compose | Containerisation |
| DigitalOcean Spaces | File & video object storage |
| DigitalOcean CDN | Static assets + video delivery |

---

## 🏗️ System Architecture

```
Browser
  │
  ▼
NGINX (port 80)
  ├── /          → React SPA  (frontend container)
  ├── /api/      → Django API (backend container)
  ├── /ws/       → Django Channels WebSocket
  └── /media/    → Uploaded files (shared Docker volume)
  │
  ▼
Django Backend
  ├── PostgreSQL  (database)
  ├── Redis       (cache + Celery broker)
  ├── Celery      (video processing, emails, certs)
  └── Celery Beat (scheduled tasks)
  │
  ▼
DigitalOcean Spaces (object storage + CDN)
```

---

## 📁 Project Structure

```
eLMS/
├── backend/
│   ├── config/          # Django settings, ASGI, Celery, URLs
│   ├── accounts/        # Custom User model, JWT auth, roles
│   ├── courses/         # Courses, modules, enrollment
│   ├── lectures/        # Video lectures, HLS pipeline
│   ├── materials/       # File uploads per lecture
│   ├── assignments/     # Assignments & student submissions
│   ├── livestream/      # Live session scheduling
│   ├── notifications/   # WebSocket real-time notifications
│   ├── cms/             # Admin CMS API (DRF-style)
│   ├── requirements.txt
│   ├── entrypoint.sh
│   └── Dockerfile
├── frontend/
│   └── src/
│       ├── cms/         # CMS pages (Dashboard, Courses, Editor, Materials, Analytics, Settings)
│       ├── pages/       # Student/Teacher pages
│       ├── components/  # Shared UI components + layout
│       ├── store/       # Zustand stores (authStore, courseStore)
│       ├── services/    # Axios API client
│       ├── hooks/
│       └── utils/
├── nginx/               # NGINX config
├── docker-compose.yml
├── .env.example
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- [Docker Desktop](https://www.docker.com/products/docker-desktop/) (includes Docker Compose)

### Quick Start (Docker — Recommended)

```bash
# 1. Clone the repository
git clone https://github.com/km-wahid/eLMS.git
cd eLMS

# 2. Copy and configure environment variables
cp .env.example .env
# Edit .env with your values (see Environment Variables section)

# 3. Build and start all services
docker compose up --build

# 4. Run migrations and create a superuser (first time only)
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py createsuperuser
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Swagger Docs**: http://localhost:8000/api/docs/
- **CMS**: http://localhost:3000/cms

### Without Docker

**Backend:**
```bash
cd backend
python -m venv venv
source venv/bin/activate      # Windows: venv\Scripts\activate
pip install -r requirements.txt
cp ../.env.example .env       # fill in values
python manage.py migrate
python manage.py createsuperuser
python manage.py runserver
```

**Frontend:**
```bash
cd frontend
npm install
npm run dev
```

**Celery Worker (separate terminal):**
```bash
cd backend
celery -A config worker --loglevel=info
```

**Celery Beat scheduler (separate terminal):**
```bash
cd backend
celery -A config beat --loglevel=info
```

---

## 👥 Demo Accounts

| Role | Email | Password |
|---|---|---|
| Superuser / Admin | admin@elms.com | Admin@1234 |
| Teacher | sarah@elms.com | Teacher@1234 |
| Teacher | ali@elms.com | Teacher@1234 |
| Student | student@elms.com | Student@1234 |

> ⚠️ These are for local development only. Change all credentials before any public deployment.

---

## 📖 API Documentation

Interactive API docs are auto-generated by **drf-spectacular** (OpenAPI 3).

| Format | URL |
|---|---|
| Swagger UI | http://localhost:8000/api/docs/ |
| ReDoc | http://localhost:8000/api/redoc/ |
| Raw OpenAPI schema | http://localhost:8000/api/schema/ |

### Key API Endpoints

| Method | Endpoint | Description |
|---|---|---|
| `POST` | `/api/auth/register/` | Register a new user |
| `POST` | `/api/auth/login/` | Login (returns JWT access + refresh) |
| `POST` | `/api/auth/logout/` | Logout (blacklist refresh token) |
| `GET` | `/api/courses/` | List published courses |
| `GET` | `/api/courses/:slug/` | Course detail (includes `is_enrolled`) |
| `POST` | `/api/courses/:slug/enroll/` | Enroll in a course |
| `GET` | `/api/courses/enrollments/mine/` | My enrollments (per-user, JWT-filtered) |
| `GET` | `/api/cms/stats/` | CMS analytics stats |
| `POST` | `/api/cms/courses/create/` | Create a new course (admin) |
| `GET/PATCH/DELETE` | `/api/cms/courses/:slug/` | Manage a course (admin) |
| `GET/POST` | `/api/cms/courses/:slug/modules/` | Manage modules |
| `GET/POST` | `/api/cms/modules/:id/lectures/` | Manage lectures + video upload |
| `GET/POST` | `/api/cms/materials/` | Manage uploaded materials |

---

## 🔑 Environment Variables

Copy `.env.example` to `.env` and fill in all required values.

| Variable | Description |
|---|---|
| `SECRET_KEY` | Django secret key |
| `DEBUG` | `True` for dev, `False` for production |
| `DATABASE_URL` | PostgreSQL connection URL |
| `REDIS_URL` | Redis connection URL |
| `DO_SPACES_KEY` | DigitalOcean Spaces access key |
| `DO_SPACES_SECRET` | DigitalOcean Spaces secret key |
| `DO_SPACES_BUCKET` | Spaces bucket name |
| `DO_SPACES_REGION` | Spaces region (e.g. `nyc3`) |
| `DO_SPACES_ENDPOINT` | Spaces endpoint URL |
| `ALLOWED_HOSTS` | Comma-separated list of allowed hosts |
| `CORS_ORIGINS` | Allowed frontend origin(s) |
| `VITE_API_URL` | Frontend API base URL (e.g. `http://localhost:8000/api`) |

---

## ☁️ Deployment (DigitalOcean)

### Production Infrastructure
- **Compute**: DigitalOcean Droplets running Docker
- **Database**: DO Managed PostgreSQL
- **Cache & Broker**: DO Managed Redis
- **Storage**: DigitalOcean Spaces + CDN
- **CI/CD**: GitHub Actions → Docker Hub → Droplet

### Deploy Steps
```bash
# On your Droplet
git pull origin main
docker compose -f docker-compose.prod.yml up --build -d
docker compose exec backend python manage.py migrate
docker compose exec backend python manage.py collectstatic --no-input
```

---

## 🗺️ Roadmap

### ✅ Completed
- [x] Phase 1 – Project Scaffolding & Docker Infrastructure
- [x] Phase 2 – Authentication (JWT, roles, custom User model)
- [x] Phase 3 – Course & Enrollment Management
- [x] Phase 4 – Video Lecture System (upload → Celery → HLS)
- [x] Phase 5 – Material Sharing (file upload per lecture)
- [x] Phase 6 – Assignment System (create, submit, grade)
- [x] Phase 7 – Live Class Module (Zoom/Jitsi/Meet scheduling)
- [x] Phase 8 – Real-Time System (WebSockets via Django Channels)
- [x] Phase 9 – Background Tasks (Celery + Redis + Beat)
- [x] Phase 10 – Dockerised deployment with NGINX reverse proxy
- [x] Phase 11 – DRF-style CMS (course/module/lecture/material CRUD, analytics, settings)
- [x] Phase 12 – Per-user enrollment isolation (no cross-account data leakage)

### 🔮 Future Improvements
- 🤖 AI-generated lecture summaries
- 📊 Automatic quiz generation from lecture content
- 🎯 Course recommendation engine
- 📱 React Native mobile app
- 🧩 Microservice decomposition
- 🧑‍🏫 AI teaching assistant chatbot
- 🏆 Certificate generation on course completion

---

## 🔒 Security

- JWT authentication with short-lived access tokens + refresh token rotation
- HTTPS enforced via NGINX in production
- Signed/expiring URLs for video and file access
- CORS restricted to frontend domain
- Rate limiting on auth endpoints
- Input validation and serializer-level permissions on all API endpoints
- Secure file type validation on uploads
- Per-user enrollment data isolation (API filters by `request.user`)

---

## 📊 Monitoring

- **Celery Flower** – task queue monitoring at `:5555`
- **Prometheus** – metrics collection (production)
- **Grafana** – dashboards and alerts (production)

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Khalid Muhammad**  
GitHub: [@km-wahid](https://github.com/km-wahid)


