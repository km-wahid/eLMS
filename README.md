# eLMS – E-Learning Management System

A scalable **E-Learning Management System** built with **React** (frontend) and **Django** (backend), supporting pre-recorded video streaming, live classes, course management, assignments, real-time notifications, and background processing.

> 🎯 **Target**: 500–1000 concurrent active users  
> ☁️ **Deployed on**: DigitalOcean Cloud Infrastructure

---

## 📋 Table of Contents

- [Features](#features)
- [Tech Stack](#tech-stack)
- [System Architecture](#system-architecture)
- [Project Structure](#project-structure)
- [Getting Started](#getting-started)
- [Environment Variables](#environment-variables)
- [Deployment](#deployment)
- [Roadmap](#roadmap)
- [Author](#author)

---

## ✨ Features

| Module | Description |
|---|---|
| 🔐 Authentication | Register, login, JWT auth, role-based access (Student / Teacher / Admin) |
| 📚 Course Management | Create, edit, organize courses into modules with full CRUD |
| 🎥 Video Lectures | Upload recorded lectures streamed via HLS (adaptive bitrate) |
| 📁 Material Sharing | Share PDFs, slides, and resources per lecture |
| 📝 Assignments | Create assignments, student submission, teacher grading |
| 📡 Live Classes | Schedule live sessions via Zoom/Jitsi, with recording playback |
| 🔔 Real-Time Notifications | WebSocket-powered notifications and live class chat |
| ⚙️ Background Tasks | Video processing, email delivery, certificate generation via Celery |

---

## 🛠️ Tech Stack

### Frontend
- **React** – UI framework
- **Tailwind CSS** – styling
- **Axios** – HTTP client
- **React Router** – client-side routing
- **Zustand** – state management
- **HLS.js** – adaptive video streaming

### Backend
- **Django** – web framework
- **Django REST Framework** – REST API
- **Django Channels** – WebSocket support
- **Celery** – background task queue
- **SimpleJWT** – JWT authentication
- **django-storages + boto3** – DigitalOcean Spaces (S3-compatible)

### Infrastructure
- **PostgreSQL** – primary database
- **Redis** – cache + message broker
- **DigitalOcean Spaces** – file & video storage
- **CDN** – DigitalOcean CDN for static assets + video
- **NGINX** – reverse proxy + load balancer
- **Docker + Docker Compose** – containerization

---

## 🏗️ System Architecture

```
Users
  │
  ▼
CDN (static assets + videos)
  │
  ▼
NGINX Load Balancer
  │
  ▼
Django Backend API
  │
  ├── PostgreSQL (database)
  ├── Redis (cache + task queue)
  └── Celery Workers (background jobs)
  │
  ▼
DigitalOcean Spaces (object storage)
```

---

## 📁 Project Structure

```
eLMS/
├── backend/
│   ├── config/            # Django settings, URLs, WSGI/ASGI
│   ├── accounts/          # User auth, roles, JWT
│   ├── courses/           # Course & module management
│   ├── lectures/          # Video lectures, HLS pipeline
│   ├── materials/         # File sharing
│   ├── assignments/       # Assignments & submissions
│   ├── livestream/        # Live class scheduling
│   ├── notifications/     # Real-time notifications
│   ├── requirements.txt
│   └── Dockerfile
├── frontend/
│   ├── src/
│   │   ├── pages/
│   │   ├── components/
│   │   ├── services/      # Axios API clients
│   │   ├── hooks/
│   │   ├── store/         # Zustand stores
│   │   └── utils/
│   ├── package.json
│   └── Dockerfile
├── nginx/                 # NGINX configuration
├── docker-compose.yml     # Local dev orchestration
├── .env.example           # Environment variable template
└── README.md
```

---

## 🚀 Getting Started

### Prerequisites
- Docker & Docker Compose
- Node.js 18+ (for frontend without Docker)
- Python 3.11+ (for backend without Docker)
- ffmpeg (for video processing)

### With Docker (Recommended)

```bash
# Clone the repository
git clone https://github.com/km-wahid/eLMS.git
cd eLMS

# Copy environment variables
cp .env.example .env
# Edit .env with your values

# Start all services
docker-compose up --build
```

The app will be available at:
- **Frontend**: http://localhost:3000
- **Backend API**: http://localhost:8000/api/
- **Admin Panel**: http://localhost:8000/admin/

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

---

## ☁️ Deployment (DigitalOcean)

### Production Infrastructure
- **Compute**: DigitalOcean Droplets (Docker)
- **Database**: DO Managed PostgreSQL
- **Cache**: DO Managed Redis
- **Storage**: DigitalOcean Spaces + CDN
- **Load Balancer**: DigitalOcean Load Balancer
- **CI/CD**: GitHub Actions

### Deploy Steps
1. Push code to `main` branch
2. GitHub Actions builds & tests
3. Docker images pushed to registry
4. Droplets pull and restart containers

---

## 🗺️ Roadmap

### Completed
- [x] Phase 1 – Project Scaffolding & Infrastructure
- [x] Phase 2 – Authentication Module
- [x] Phase 3 – Course Management (CMS)
- [ ] Phase 4 – Video Lecture System (HLS)
- [ ] Phase 5 – Material Sharing
- [ ] Phase 6 – Assignment System
- [ ] Phase 7 – Live Class Module
- [ ] Phase 8 – Real-Time System (WebSockets)
- [ ] Phase 9 – Background Task System (Celery)
- [ ] Phase 10 – Deployment (DigitalOcean)

### Future Improvements
- 🤖 AI-generated lecture summaries
- 📊 Automatic quiz generation
- 🎯 Recommendation system
- 📱 Mobile application
- 🧩 Microservice architecture
- 🧑‍🏫 AI teaching assistant

---

## 🔒 Security

- JWT authentication with refresh tokens
- HTTPS enforced via NGINX
- Signed/expiring URLs for video and file access
- CORS restricted to frontend domain
- Rate limiting on auth endpoints
- Input validation on all API endpoints
- Secure file type validation on uploads

---

## 📊 Monitoring

- **Prometheus** – metrics collection
- **Grafana** – dashboards and alerts
- Metrics: CPU, request latency, DB performance, active users

---

## 📄 License

MIT License — see [LICENSE](LICENSE) for details.

---

## 👤 Author

**Khalid Muhammad**  
GitHub: [@km-wahid](https://github.com/km-wahid)
