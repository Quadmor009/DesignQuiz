# Production Environment Setup

Your app is working locally but showing 503 errors in production. This means the `DATABASE_URL` environment variable needs to be set in your production environment.

## Quick Fix: Add DATABASE_URL to Production

### If Deployed on Vercel:

1. **Go to Vercel Dashboard**
   - Visit https://vercel.com/dashboard
   - Select your project

2. **Add Environment Variable**
   - Click on "Settings" tab
   - Click "Environment Variables" in the sidebar
   - Click "Add New"
   - **Key**: `DATABASE_URL`
   - **Value**: Your Render PostgreSQL **External Database URL** (the same one you use in `.env.local`)
   - Select all environments (Production, Preview, Development)
   - Click "Save"

3. **Redeploy**
   - Go to "Deployments" tab
   - Click the three dots (⋯) on the latest deployment
   - Click "Redeploy"
   - Or push a new commit to trigger a redeploy

### If Deployed on Render:

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Select your Web Service

2. **Add Environment Variable**
   - Click on "Environment" in the sidebar
   - Click "Add Environment Variable"
   - **Key**: `DATABASE_URL`
   - **Value**: Your Render PostgreSQL **Internal Database URL** (for Render-to-Render connections)
   - Click "Save Changes"

3. **Redeploy**
   - Render will automatically redeploy when you save environment variables
   - Or manually trigger a redeploy from the "Manual Deploy" section

## How to Get Your Database URL

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click on your PostgreSQL database

2. **Copy the Connection URL**
   - For **Vercel**: Use the **External Database URL**
   - For **Render**: Use the **Internal Database URL**
   - It looks like: `postgresql://user:password@hostname:5432/database`

## Verify It's Working

After adding the environment variable and redeploying:

1. Wait for the deployment to complete (2-3 minutes)
2. Visit your live site
3. Try submitting a score
4. Check the leaderboard - it should work now!

## Troubleshooting

**Still seeing 503 errors?**
- Make sure you redeployed after adding the environment variable
- Check that the variable name is exactly `DATABASE_URL` (case-sensitive)
- Verify the database URL is correct (no extra spaces or quotes)
- Check the deployment logs for any errors

**Database connection errors?**
- Make sure your database is running on Render
- Check that the database URL format is correct
- For Vercel: Use External Database URL
- For Render: Use Internal Database URL

