# Project Proposal: eLMS (Scalable E-Learning Management System)

**Course:** Software Development Management Lab (0613-307)  
**Project Type:** Full-Stack Web Development & Cloud-Native Architecture  
**Target Audience:** Educational Institutions, Universities, Online Academies  
**Capacity:** 500 – 1000 Concurrent Active Learners  

---

## 👥 Team Members

| Name | Student Roll | Core Responsibility |
|---|---|---|
| **Saeed Ullah** | 26 | Backend Development & Celery HLS Pipeline |
| **Sajedur Rahman** | 09 | Frontend SPA Architecture (React + Vite) |
| **Tunajjina Islam Borna** | 31 | Database Modeling & Query Optimization |
| **Mushfiqur Rahman** | 13 | Authentication, Security & RBAC |
| **Rabby Hasan** | 23 | UI/UX Design & Administrative CMS |
| **Sheikh Forid** | 30 | DevOps, Dockerization & Nginx Proxy |

---

## 1. 📋 Abstract & Introduction

### What is an eLMS?
An **E-Learning Management System (eLMS)** is a software platform designed to manage the delivery of educational courses, track learner progress, distribute multimedia instructional assets, and facilitate interaction between students and instructors in a structured online setting.

### Project Overview
Traditional learning platforms often struggle with video bandwidth bottlenecks, complicated content management, and poor separation of user roles. This project delivers **eLMS**, an enterprise-grade, cloud-native learning management platform engineered to resolve these challenges. 

By combining **React 18** and **Vite** with **Django REST Framework (DRF)**, **Daphne (ASGI)**, **Celery**, and **PostgreSQL**, eLMS provides high-performance adaptive bitrate video streaming (via HLS.js and FFmpeg), isolated course enrollment, an administrative CMS, real-time WebSocket notifications, and containerized Docker deployment.

---

## 2. 🎯 Project Objectives

1. **Role-Based Authentication & Isolation**: Implement strict access control for **Students**, **Teachers**, and **Administrators** via JWT with refresh token rotation.
2. **Adaptive Bitrate Video Streaming**: Offload video transcoding (FFmpeg) to asynchronous Celery workers to generate multi-bitrate HLS streams, ensuring buffer-free playback across varying network conditions.
3. **Structured Academic Delivery**: Provide hierarchical course management (**Departments** $\rightarrow$ **Semesters** $\rightarrow$ **Courses** $\rightarrow$ **Modules** $\rightarrow$ **Lectures**) along with downloadable PDF resources and assignment submission/grading.
4. **Centralized CMS & Administrative Analytics**: Provide teachers and administrators with an intuitive DRF CMS dashboard to author courses, monitor enrollment metrics, and track student completion.

---

## 3. 🛠️ Tech Stack & Architecture

### Frontend Layer
- **Framework**: React 18 with Vite build tooling
- **Styling**: Tailwind CSS & `@tailwindcss/forms`
- **State Management**: Zustand lightweight reactive stores (`authStore`, `courseStore`)
- **Video Playback**: `hls.js` adaptive streaming engine
- **Icons & UI Feedback**: Lucide React & `react-hot-toast`

### Backend API Layer
- **Framework**: Django 4.2 LTS & Django REST Framework (DRF)
- **ASGI & WebSockets**: Daphne ASGI server & Django Channels with Redis channel layer
- **Authentication**: `djangorestframework-simplejwt` with token blacklisting
- **API Documentation**: OpenAPI 3.0 schema generation with Swagger UI & ReDoc via `drf-spectacular`
- **Admin UI**: Customized Django Admin with `django-jazzmin`

### Data Storage & Asynchronous Processing
- **Relational Database**: PostgreSQL 15 (Production) / SQLite (Zero-dependency development)
- **Task Queue & Caching**: Redis 7 & Celery 5
- **Task Monitoring**: Flower Celery dashboard
- **Object Storage**: S3-compatible DigitalOcean Spaces / local filesystem fallback

### Infrastructure & Deployment
- **Containerization**: Multi-container Docker & Docker Compose
- **Web Server / Reverse Proxy**: Nginx reverse proxy with gzip compression and SSL termination
- **Static Assets**: WhiteNoise middleware for static file serving

---

## 4. 📦 Project Scope

### ✅ Included in Scope
- User Registration, JWT Login, Profile Management, and Role Authorization
- Academic curriculum hierarchy: Departments, Semesters, Courses, Modules, Lectures
- Per-user course enrollment isolation (users only access enrolled material)
- Video upload with automated FFmpeg HLS transcoding
- Lecture attachments (PDFs, slide decks, resources)
- Assignment creation, student document submission, and instructor grading
- Live class scheduling (integrating Zoom, Google Meet, or Jitsi)
- Real-time notification system over WebSockets
- Full-featured administrative CMS with analytics dashboards

### ❌ Excluded from Scope
- Paid commercial payment gateway (Stripe/PayPal) — focused on academic enrollment
- AI-based biometric proctoring and automated cheating detection
- Compiled native mobile applications (iOS/Android app store binaries)
- Sandboxed in-browser code execution engine

---

## 5. 📊 System Modeling & Diagrams

### 5.1 System Architecture
The system employs a containerized micro-service pattern orchestrated by Docker Compose:
- **Clients (Browsers)** communicate via HTTP/HTTPS and WebSockets.
- **Nginx Reverse Proxy** terminates requests, delivers static files, and routes traffic between the frontend React SPA (port 3000) and the backend Daphne ASGI server (port 8000).
- **Backend Services** interact with **PostgreSQL** for relational persistence, **Redis** for message brokering, and offload CPU-intensive FFmpeg transcoding to **Celery Workers**.

### 5.2 Use Case Modeling
- **Student**: Register/Login $\rightarrow$ Search Courses $\rightarrow$ Enroll $\rightarrow$ Watch HLS Lectures $\rightarrow$ Download Materials $\rightarrow$ Submit Assignments $\rightarrow$ Receive Real-Time Notifications.
- **Teacher**: Author Courses $\rightarrow$ Build Modules $\rightarrow$ Upload Lectures $\rightarrow$ Issue Assignments $\rightarrow$ Grade Submissions $\rightarrow$ Schedule Live Classes.
- **Admin**: User Management $\rightarrow$ Course Approval $\rightarrow$ Department & Semester Configuration $\rightarrow$ Platform Analytics.

### 5.3 Level 1 Data Flow Diagram (DFD)
- **1.0 Auth & Role Verification**: Validates credentials against `User DB` and issues signed JWTs.
- **2.0 Course & Curriculum Browsing**: Queries `Courses DB` and streams metadata to frontend.
- **3.0 Enrollment & Progress Tracking**: Manages enrollment records and lecture completion status.
- **4.0 Video Upload & HLS Transcoding**: Accepts raw video files, pushes background task to Celery, and stores HLS manifests (`.m3u8`) in Media Storage.
- **5.0 Assignment Submission & Grading**: Handles student submissions and teacher evaluations.
- **6.0 Real-time Notifications**: Dispatches WebSocket events via Redis channel layer.

---

## 6. 📅 Project Timeline (Total: 52 Days)

| Phase | Duration | Key Milestones |
|---|---|---|
| **Requirement Analysis & Specs** | 3 Days | SRS creation, scope definition, stakeholder review |
| **UI/UX Wireframes & Component System** | 4 Days | Tailwind design tokens, responsive layouts, dashboard mockups |
| **Backend API & Database Modeling** | 18 Days | Django models, migrations, REST endpoints, JWT auth |
| **Frontend SPA & CMS Dashboard** | 15 Days | React routes, Zustand store integration, CMS forms |
| **Video Pipeline & Celery Workers** | 7 Days | FFmpeg HLS transcoding, background queues, S3 storage |
| **Integration, Testing & Dockerization** | 5 Days | Docker Compose setup, Nginx proxy, QA end-to-end testing |

---

## 7. 💰 Budget Considerations & Limitations

### Infrastructure Budget (Monthly Estimates)
- **DigitalOcean Droplet (Standard 4 vCPU, 8GB RAM)**: ~$24 / month
- **DigitalOcean Spaces (250GB S3 Object Storage + 1TB Transfer)**: ~$5 / month
- **Custom Domain & SSL (Cloudflare / Namecheap)**: ~$12 / year
- **Local Dev / Testing Tier**: $0 (SQLite & Docker Desktop)

### Known Limitations
- **Transcoding Resource Demand**: Simultaneous large video uploads require throttled queue concurrency to prevent memory spikes.
- **Live Class Media Relay**: Live sessions utilize external calendar meeting URLs rather than hosting a self-managed WebRTC SFU cluster.

---

## 8. 🏁 Conclusion

The **eLMS** project delivers an end-to-end, enterprise-grade learning management platform. By addressing video streaming performance, role isolation, and academic administrative friction through modern cloud architectures (React, Django REST Framework, Celery, and Docker), eLMS provides a robust foundation for institutional education and scalable digital classrooms.
