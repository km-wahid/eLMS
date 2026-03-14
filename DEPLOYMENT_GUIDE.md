# eLMS Academic Structure - Deployment Guide

## 🚀 Quick Start Deployment

### Prerequisites
- Docker & Docker Compose installed
- PostgreSQL database
- Redis server
- Node.js 16+ (for frontend build)
- Python 3.11+ (for backend)

### Step 1: Database Migrations (5 minutes)

```bash
# Navigate to project root
cd /Users/khalidmuhammad/Documents/Dev/eLMS

# Run migrations in Docker
docker-compose exec web python manage.py migrate academics
docker-compose exec web python manage.py migrate courses
```

**Verify migration success:**
```bash
docker-compose exec web python manage.py showmigrations
# Should show: academics (2 complete migrations)
# Should show: courses (1 additional migration)
```

### Step 2: Load Test Data (5 minutes)

```bash
# Create superuser (if not exists)
docker-compose exec web python manage.py createsuperuser

# Load test data via Django shell
docker-compose exec web python manage.py shell << EOF
from backend.academics.models import Department, Semester
from django.utils.text import slugify

# Create 3 test departments
departments = [
    {'name': 'Computer Science', 'code': 'CS', 'description': 'Computer Science Department'},
    {'name': 'Civil Engineering', 'code': 'CE', 'description': 'Civil Engineering Department'},
    {'name': 'Business Administration', 'code': 'BA', 'description': 'Business Administration Department'},
]

for dept_data in departments:
    dept = Department.objects.create(
        name=dept_data['name'],
        code=dept_data['code'],
        slug=slugify(dept_data['name']),
        description=dept_data['description'],
        logo_url=f"https://via.placeholder.com/400x300?text={dept_data['code']}"
    )
    
    # Create 8 semesters for each department
    for i in range(1, 9):
        Semester.objects.create(
            department=dept,
            name=f"Semester {i}",
            slug=f"sem-{i}",
            type="semester",
            order=i,
            description=f"Academic Semester {i}"
        )

print("✅ Test data loaded successfully!")
EOF
```

### Step 3: Build Frontend (3 minutes)

```bash
# Install dependencies (if needed)
cd frontend
npm install

# Build for production
npm run build

# Verify build succeeded
ls -la dist/ | head -10
```

### Step 4: Configure NGINX (2 minutes)

```bash
# Update NGINX config to serve frontend
# Edit nginx/default.conf

# Restart NGINX in Docker
docker-compose restart nginx
```

### Step 5: Verify API Endpoints (5 minutes)

```bash
# Test public department endpoint
curl http://localhost:8000/api/academics/departments/

# Expected response:
# [{"id":"...","name":"Computer Science","slug":"computer-science",...}]

# Test with authentication (get JWT token first)
# Then test protected endpoints:
curl -H "Authorization: Bearer {TOKEN}" \
     http://localhost:8000/api/academics/bookmarks/
```

### Step 6: Test Frontend Pages (5 minutes)

Open browser and verify:

```
✅ http://localhost:3000/departments
   - Should show department grid
   - Search filter should work
   - Click department should navigate to detail page

✅ http://localhost:3000/departments/computer-science
   - Should show semesters list
   - Click semester should navigate to courses

✅ http://localhost:3000/semesters/sem-1
   - Should show courses with pagination
   - Responsive on mobile

✅ http://localhost:3000/bookmarks
   - Should redirect to login if not authenticated
   - After login: shows user's bookmarks

✅ http://localhost:3000/teacher/academic
   - Teacher only: shows academic management
   - Non-teacher: shows permission denied
```

---

## 🐳 Docker Deployment

### Environment Variables

Create `.env` file in project root:

```env
# Database
DATABASE_URL=postgresql://user:password@postgres:5432/elms_db
POSTGRES_USER=user
POSTGRES_PASSWORD=password
POSTGRES_DB=elms_db

# Redis
REDIS_URL=redis://redis:6379/0

# Django
DJANGO_SETTINGS_MODULE=config.settings.production
ALLOWED_HOSTS=localhost,127.0.0.1,example.com
DEBUG=False
SECRET_KEY=your-secret-key-here

# Frontend
REACT_APP_API_URL=http://localhost:8000/api
REACT_APP_ENV=production
```

### Docker Compose Commands

```bash
# Build images
docker-compose build

# Start services
docker-compose up -d

# View logs
docker-compose logs -f web
docker-compose logs -f frontend

# Stop services
docker-compose down

# Clean up volumes (⚠️ deletes data)
docker-compose down -v
```

### Health Checks

```bash
# Backend health
curl http://localhost:8000/api/academics/departments/

# Frontend health  
curl http://localhost:3000/

# Database health
docker-compose exec postgres psql -U user -d elms_db -c "SELECT 1"

# Redis health
docker-compose exec redis redis-cli ping
# Expected: PONG
```

---

## 🔧 Production Checklist

Before deploying to production:

### Security
- [ ] Set `DEBUG=False` in settings
- [ ] Set strong `SECRET_KEY`
- [ ] Configure `ALLOWED_HOSTS` with your domain
- [ ] Enable HTTPS/SSL
- [ ] Configure CORS properly
- [ ] Set secure cookies: `SESSION_COOKIE_SECURE=True`
- [ ] Enable CSRF protection
- [ ] Run security checks: `python manage.py check --deploy`

### Database
- [ ] Backup database
- [ ] Run migrations in production
- [ ] Verify indexes created
- [ ] Set up replication/backup
- [ ] Monitor disk space

### Frontend
- [ ] Minify and optimize assets
- [ ] Update API URL to production
- [ ] Configure CDN for videos
- [ ] Set cache headers
- [ ] Test on production domain

### Performance
- [ ] Enable Redis caching
- [ ] Configure Celery workers
- [ ] Set up monitoring/logging
- [ ] Configure log rotation
- [ ] Load test (500+ concurrent users)

### Monitoring
- [ ] Set up error tracking (Sentry)
- [ ] Enable application logging
- [ ] Monitor API response times
- [ ] Monitor database performance
- [ ] Set up alerts for errors

### Documentation
- [ ] Document deployment process
- [ ] Document rollback procedure
- [ ] Document backup/restore
- [ ] Create runbook for common issues

---

## 🔄 Rolling Deployment

For zero-downtime deployment:

```bash
# 1. Build new Docker images
docker-compose build

# 2. Stop one server at a time (if multiple instances)
docker-compose stop web_1

# 3. Update and start
docker-compose up -d web_1

# 4. Run migrations
docker-compose exec web_1 python manage.py migrate

# 5. Verify health
curl http://localhost:8000/api/academics/departments/

# 6. Repeat for other instances
```

---

## 🔄 Rollback Procedure

If something goes wrong:

```bash
# 1. Check Git history
git log --oneline -10

# 2. Rollback to previous commit
git revert {commit-hash}
git push origin main

# 3. Rebuild and redeploy
docker-compose build web
docker-compose up -d web

# 4. Verify services
docker-compose logs web | tail -20
```

---

## 📊 Post-Deployment Monitoring

### Key Metrics to Track

```sql
-- Database queries per second
SELECT count(*) FROM pg_stat_statements 
WHERE query NOT LIKE '%pg_stat%'

-- Slow queries
SELECT * FROM pg_stat_statements 
WHERE mean_time > 100 
ORDER BY mean_time DESC
LIMIT 10;
```

### Frontend Performance

```javascript
// Check performance metrics in browser console
console.log(performance.timing)

// Check bundle size
ls -lh dist/

// Test compression
curl -I -H "Accept-Encoding: gzip" http://localhost:3000/
```

### API Response Times

```bash
# Test API performance
ab -n 1000 -c 100 http://localhost:8000/api/academics/departments/

# Expected for production:
# Requests per second: > 500
# Time per request: < 200ms
# Failed requests: 0
```

---

## 🆘 Troubleshooting

### Database Migration Failed

```bash
# Check status
docker-compose exec web python manage.py showmigrations academics

# If stuck, show migration details
docker-compose exec web python manage.py sqlmigrate academics 0001

# Manually reset (careful!)
docker-compose exec web python manage.py migrate academics zero
docker-compose exec web python manage.py migrate academics
```

### API Returning 500 Errors

```bash
# Check logs
docker-compose logs web | tail -50

# Check database connection
docker-compose exec web python manage.py dbshell
SELECT 1;

# Check settings
docker-compose exec web python manage.py check
```

### Frontend Not Loading

```bash
# Check frontend logs
docker-compose logs frontend

# Check NGINX config
docker-compose exec nginx nginx -t

# Check API connection
curl -I http://localhost:8000/api/academics/departments/
```

### High Memory Usage

```bash
# Check memory per service
docker stats

# If web service high:
docker-compose exec web python manage.py shell_plus --memray

# If Redis high:
docker-compose exec redis redis-cli INFO memory
```

---

## 📈 Scaling for 500+ Concurrent Users

### Recommendations

1. **Database**
   - Use managed PostgreSQL (e.g., AWS RDS)
   - Enable connection pooling (PgBouncer)
   - Set up read replicas

2. **Cache**
   - Use managed Redis (e.g., AWS ElastiCache)
   - Increase max memory policy

3. **Application**
   - Run multiple web workers (Gunicorn)
   - Load balance with HAProxy or Nginx
   - Use CDN for static files (CloudFront, Cloudflare)

4. **Video Streaming**
   - Use CDN for HLS video delivery
   - Configure bit rate adaptation

5. **Monitoring**
   - Set up performance monitoring (New Relic, DataDog)
   - Configure alerts for bottlenecks

### Docker Compose Scale

```bash
# Scale web service to 3 instances
docker-compose up -d --scale web=3

# Note: Requires load balancer in front
```

### Kubernetes Deployment

For production-scale deployment:

```yaml
# Create deployment.yaml
apiVersion: apps/v1
kind: Deployment
metadata:
  name: elms-web
spec:
  replicas: 3
  selector:
    matchLabels:
      app: elms-web
  template:
    metadata:
      labels:
        app: elms-web
    spec:
      containers:
      - name: web
        image: elms:latest
        env:
        - name: DATABASE_URL
          valueFrom:
            secretKeyRef:
              name: elms-secret
              key: database_url
        ports:
        - containerPort: 8000
        livenessProbe:
          httpGet:
            path: /api/academics/departments/
            port: 8000
          initialDelaySeconds: 30
          periodSeconds: 10
```

---

## ✅ Final Verification

Run this checklist before considering deployment complete:

```bash
#!/bin/bash

echo "🔍 Final Deployment Verification"

# 1. Check migrations
echo "1. Database migrations..."
docker-compose exec web python manage.py showmigrations academics | grep "\[X\]" > /dev/null && echo "   ✅ Migrations complete"

# 2. Check API health
echo "2. API endpoints..."
curl -s http://localhost:8000/api/academics/departments/ > /dev/null && echo "   ✅ API responding"

# 3. Check frontend
echo "3. Frontend..."
curl -s http://localhost:3000/ | grep -q "React" && echo "   ✅ Frontend loaded"

# 4. Check database
echo "4. Database..."
docker-compose exec postgres psql -U user -d elms_db -c "SELECT COUNT(*) FROM academics_department" | grep -q "3" && echo "   ✅ Test data loaded"

# 5. Check redis
echo "5. Redis..."
docker-compose exec redis redis-cli ping | grep -q "PONG" && echo "   ✅ Redis responding"

echo ""
echo "✨ All checks passed! Ready for production."
```

---

## 📞 Support

For deployment issues:

1. **Check logs**: `docker-compose logs -f {service}`
2. **Check documentation**: See TESTING_GUIDE.md
3. **Run diagnostic**: `python manage.py check --deploy`
4. **Review API docs**: Visit `/api/docs/` (if drf-spectacular enabled)

---

## 🎓 Next Steps After Deployment

1. Monitor system for 24-48 hours
2. Gather user feedback
3. Optimize based on usage patterns
4. Plan for additional features
5. Set up automated backups
6. Configure disaster recovery

---

**Deployment Checklist Complete! 🚀**
