# Deployment Guide

Your potluck signup app is ready for deployment! Here are the best hosting options:

## Quick Start Deployment

### Step 1: Push to GitHub
1. Create a new repository on GitHub
2. Push your code:
   ```bash
   git init
   git add .
   git commit -m "Initial commit"
   git remote add origin https://github.com/yourusername/potluck-signup.git
   git push -u origin main
   ```

### Step 2: Deploy Backend (Choose One)

#### Option A: Render (Recommended - $7/month)
1. Go to [render.com](https://render.com) and sign up
2. Click "New +" → "Web Service"
3. Connect your GitHub repository
4. Configure:
   - **Name**: potluck-backend
   - **Root Directory**: `backend`
   - **Environment**: Node
   - **Build Command**: `npm install`
   - **Start Command**: `npm start`
5. Add environment variable: `PORT=10000`
6. Click "Create Web Service"
7. Copy your backend URL (e.g., `https://potluck-backend.onrender.com`)

#### Option B: Railway ($5/month)
1. Go to [railway.app](https://railway.app) and sign up
2. Click "Deploy from GitHub repo"
3. Select your repository
4. Choose the `backend` folder
5. Railway auto-detects Node.js and deploys
6. Copy your backend URL

### Step 3: Deploy Frontend

#### Option A: Vercel (Free)
1. Go to [vercel.com](https://vercel.com) and sign up
2. Click "Import Project"
3. Connect your GitHub repository
4. Configure:
   - **Framework Preset**: Create React App
   - **Root Directory**: `frontend`
   - **Build Command**: `npm run build`
   - **Output Directory**: `build`
5. Add environment variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: Your backend URL from Step 2
6. Click "Deploy"

#### Option B: Netlify (Free)
1. Go to [netlify.com](https://netlify.com) and sign up
2. Click "Add new site" → "Import an existing project"
3. Connect your GitHub repository
4. Configure:
   - **Base directory**: `frontend`
   - **Build command**: `npm run build`
   - **Publish directory**: `frontend/build`
5. Add environment variable:
   - **Name**: `REACT_APP_API_URL`
   - **Value**: Your backend URL from Step 2
6. Click "Deploy site"

## Cost Summary
- **Frontend**: Free (Vercel/Netlify)
- **Backend**: $5-7/month (Railway/Render)
- **Total**: $5-7/month for unlimited users

## Environment Variables

### Frontend (.env.production)
```
REACT_APP_API_URL=https://your-backend-url.onrender.com
```

### Backend (Set on hosting platform)
```
PORT=10000
NODE_ENV=production
```

## Database Notes
- SQLite database will work for most use cases (hundreds of users)
- Data persists on the server filesystem
- For high-traffic sites, consider upgrading to PostgreSQL
- Your current setup supports multiple potlucks and unlimited guests

## Post-Deployment
1. Test your app by creating a potluck
2. Share the URL with friends to test guest signups
3. Monitor usage on your hosting platform
4. Consider upgrading hosting plan if needed

## Troubleshooting
- If frontend can't connect to backend, check CORS settings
- Ensure REACT_APP_API_URL matches your backend URL exactly
- Check hosting platform logs for errors
- Verify environment variables are set correctly

## Features Included
✅ Create potlucks with custom names and dates
✅ Add/edit menu items with emojis
✅ Guest signup with name and family count
✅ Multiple dish selection per guest
✅ View complete guest lists
✅ Delete guests and their dish assignments
✅ Modern, responsive design
✅ URL sharing for easy access