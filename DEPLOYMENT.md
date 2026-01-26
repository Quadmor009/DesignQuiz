# Deployment Guide for Design Gym

## Project Status Check

### ✅ Your project is ready for Vercel deployment!

**Project Type:** Next.js Framework Application (not static)
- ✅ Uses Next.js 14
- ✅ Has API routes (`/api/leaderboard`)
- ✅ Uses TypeScript
- ✅ Uses Tailwind CSS
- ✅ Has proper project structure

### ✅ Leaderboard Database Setup

Your leaderboard now uses PostgreSQL (Render database). **You must add the database connection string to Vercel environment variables** for it to work in production.

**Required Setup:**
1. Add `DATABASE_URL` environment variable in Vercel (see below)
2. The database migration has already been run
3. Leaderboard will work once the environment variable is set

**See [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) for detailed instructions.**

---

## Step-by-Step Deployment Instructions

### Step 0: Install Analytics Package (NEW)

Before deploying, install the analytics package:

```bash
cd "/Users/quadri.morin/Downloads/New Request"
npm install
```

This will install `@vercel/analytics` which is already added to your `package.json`.

---

### Step 1: Initialize Git Repository

Open your terminal and navigate to your project folder, then run:

```bash
cd "/Users/quadri.morin/Downloads/New Request"
git init
```

### Step 2: Add All Files to Git

```bash
git add .
```

### Step 3: Create Your First Commit

```bash
git commit -m "Initial commit: Design Gym quiz application"
```

### Step 4: Create a New Repository on GitHub

1. Go to https://github.com/new
2. Create a new repository (name it something like `design-gym` or `design-quiz`)
3. **DO NOT** initialize it with a README, .gitignore, or license (we already have these)
4. Click "Create repository"

### Step 5: Connect Your Local Repository to GitHub

After creating the repository, GitHub will show you commands. Use these (replace `YOUR_USERNAME` and `YOUR_REPO_NAME`):

```bash
git remote add origin https://github.com/YOUR_USERNAME/YOUR_REPO_NAME.git
git branch -M main
git push -u origin main
```

**Example:**
If your GitHub username is `quadrimorin` and your repo is `design-gym`, the command would be:
```bash
git remote add origin https://github.com/quadrimorin/design-gym.git
git branch -M main
git push -u origin main
```

### Step 6: Deploy to Vercel

1. Go to https://vercel.com
2. Sign up or log in (you can use your GitHub account)
3. Click "Add New Project"
4. Import your GitHub repository (it should appear in the list)
5. Vercel will automatically detect it's a Next.js project

6. **IMPORTANT: Add Environment Variable**
   - Before clicking "Deploy", click "Environment Variables"
   - Add a new variable:
     - **Key**: `DATABASE_URL`
     - **Value**: Your Render PostgreSQL **External Database URL**
     - Select all environments (Production, Preview, Development)
   - Click "Add"

7. Click "Deploy"
8. Wait 2-3 minutes for deployment to complete
9. Your site will be live at a URL like: `https://your-project-name.vercel.app`

**Note:** If you already deployed without the environment variable, see [PRODUCTION_SETUP.md](./PRODUCTION_SETUP.md) to add it now.

---

## What Happens During Deployment

Vercel will automatically:
- ✅ Install dependencies (`npm install`)
- ✅ Build your Next.js app (`npm run build`)
- ✅ Deploy it to their servers
- ✅ Give you a live URL

---

## Troubleshooting

**If you get an error about authentication:**
- You may need to enter your GitHub username and password
- Or set up a Personal Access Token (GitHub Settings > Developer settings > Personal access tokens)

**If deployment fails:**
- Check the build logs in Vercel dashboard
- Make sure all dependencies are in `package.json`
- Ensure there are no TypeScript errors

---

## Files Included

✅ `.gitignore` - Already exists and is properly configured
✅ `package.json` - Has all required scripts
✅ `next.config.js` - Configured correctly
✅ No `vercel.json` needed - Vercel auto-detects Next.js

---

## Analytics Setup ✅

**Visit tracking is already configured!**

I've added Vercel Analytics to your project. After deployment:

1. **It works automatically** - No configuration needed
2. **View analytics in Vercel Dashboard:**
   - Go to your project in Vercel
   - Click on the "Analytics" tab
   - You'll see page views, unique visitors, and more

**What gets tracked:**
- ✅ Page views
- ✅ Unique visitors
- ✅ Top pages
- ✅ Referrers (where visitors come from)
- ✅ Device types (mobile/desktop)
- ✅ Countries

**Privacy-friendly:** Vercel Analytics is GDPR compliant and doesn't use cookies.

---

## Next Steps After Deployment

1. Test your deployed site
2. Share the URL with others
3. Check analytics in Vercel dashboard (after a few visits)
4. (Later) Migrate leaderboard to a database for full functionality

