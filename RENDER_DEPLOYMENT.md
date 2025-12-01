# Render Deployment Guide for Exec-Connect

## ✅ Fixed Issues

The deployment errors have been fixed:
- **Database URL conversion**: Automatically converts `postgresql://` to `postgresql+psycopg://` for psycopg3 compatibility
- **CORS configuration**: Now accepts comma-separated strings from environment variables
- **Python version**: Specified Python 3.12 in `runtime.txt`
- **Database migrations**: Added to Procfile for automatic migration on deploy

## Deployment Steps

### 1. Create PostgreSQL Database

1. Go to Render Dashboard → **New** → **PostgreSQL**
2. Configure:
   - **Name**: `exec-connect-db`
   - **Database**: `exec_connect`
   - **Plan**: Free or paid
3. After creation, copy the **Internal Database URL**
4. **Important**: Enable pgvector extension by running in Render's database shell:
   ```sql
   CREATE EXTENSION IF NOT EXISTS vector;
   ```

### 2. Create Backend Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect your repository
3. Configure:
   - **Name**: `exec-connect-backend`
   - **Root Directory**: `backend`
   - **Environment**: `Python 3`
   - **Build Command**: `pip install -r requirements.txt`
   - **Start Command**: `uvicorn app.main:app --host 0.0.0.0 --port $PORT`

4. **Environment Variables** (add these):
   ```
   DATABASE_URL=<Internal Database URL from step 1>
   OPENAI_API_KEY=<your-openai-api-key>
   LLM_MODEL=gpt-5.1
   RAG_ENABLED=true
   RAG_TOP_K=4
   CORS_ORIGINS=https://exec-connect-frontend.onrender.com
   PORT=10000
   ```

5. Click **Create Web Service**

### 3. Create Frontend Web Service

1. Go to Render Dashboard → **New** → **Web Service**
2. Connect the same repository
3. Configure:
   - **Name**: `exec-connect-frontend`
   - **Root Directory**: `frontend`
   - **Environment**: `Node`
   - **Build Command**: `npm install && npm run build`
   - **Start Command**: `npm start`

4. **Environment Variables**:
   ```
   NEXT_PUBLIC_API_URL=https://exec-connect-backend.onrender.com
   NODE_ENV=production
   ```

5. Click **Create Web Service**

### 4. Update Backend CORS After Frontend Deployment

Once the frontend is deployed, update the backend's `CORS_ORIGINS` environment variable:
```
CORS_ORIGINS=https://exec-connect-frontend.onrender.com,https://your-custom-domain.com
```

Then manually redeploy the backend service.

## Files Changed for Deployment

1. **`backend/app/config.py`**:
   - Added DATABASE_URL validator to convert `postgresql://` to `postgresql+psycopg://`
   - Updated CORS_ORIGINS to accept comma-separated strings

2. **`backend/app/main.py`**:
   - Updated to use `settings.cors_origins_list` property

3. **`backend/Procfile`**:
   - Added `release: alembic upgrade head` for automatic migrations

4. **`backend/runtime.txt`**:
   - Specified Python 3.12.0

## Troubleshooting

### Database Connection Errors
- Verify DATABASE_URL uses the **Internal Database URL** from Render
- Ensure pgvector extension is enabled in PostgreSQL
- Check that migrations ran successfully (check logs)

### Build Errors
- Check that all dependencies are in `requirements.txt`
- Verify Python version in `runtime.txt` is compatible
- Check build logs for specific errors

### CORS Errors
- Ensure `CORS_ORIGINS` includes your frontend URL (with protocol: `https://`)
- Update backend environment variable and redeploy

### Migration Errors
- Check that DATABASE_URL is correct
- Verify pgvector extension is enabled
- Run migrations manually using Render Shell if needed

## Notes

- **Free tier**: Services spin down after 15 minutes of inactivity (cold starts)
- **Database migrations**: Run automatically before service starts (via Procfile `release` command)
- **Environment variables**: Set in Render dashboard under each service's Environment section
- **URL format**: The backend automatically converts Render's `postgresql://` URLs to work with psycopg3

## Verification Checklist

- [ ] Database created and pgvector extension enabled
- [ ] Backend service deployed successfully
- [ ] Database migrations ran without errors
- [ ] Frontend service deployed successfully
- [ ] CORS_ORIGINS updated with frontend URL
- [ ] Backend health check: `https://your-backend.onrender.com/api/health`
- [ ] Frontend can communicate with backend API

