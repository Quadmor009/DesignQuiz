# Twitter Integration Setup

## What Was Added

1. **Twitter Handle Support in Database**
   - Added `twitter_handle` column to leaderboard table
   - Stores Twitter handles (with @ prefix) for players who connect

2. **Twitter Handle Input at Quiz Start**
   - Updated the name input modal to include optional Twitter handle field
   - Users can enter their Twitter handle (without @, it's added automatically)
   - Handle is optional - users can skip it

3. **Leaderboard Display**
   - Shows Twitter handles next to player names
   - Handles are clickable links to Twitter profiles
   - Only shows if player provided a handle

4. **Social Proof on Landing Page**
   - Fetches real Twitter handles from database
   - Displays actual handles of players who connected
   - Falls back to dummy handles if no real ones exist yet

5. **API Endpoints**
   - `/api/twitter-handles` - Returns list of unique Twitter handles for social proof
   - Updated `/api/leaderboard` to include Twitter handles in responses

## Setup Instructions

### Step 1: Run Database Migration

Run the migration to add the Twitter handle column:

```bash
npm run migrate:twitter
```

This will:
- Add `twitter_handle` column to the leaderboard table
- Create an index for faster queries

### Step 2: Test Locally

1. Start your dev server: `npm run dev`
2. Go to the quiz page
3. You should see a new input field for Twitter handle (optional)
4. Enter your name and optionally your Twitter handle
5. Complete the quiz
6. Check the leaderboard - your Twitter handle should appear if you provided one

### Step 3: Deploy to Production

1. Commit and push the changes
2. Run the migration on production (if you have database access)
   - Or the migration will run automatically when the first entry with a Twitter handle is created
3. The landing page will automatically start showing real Twitter handles once players connect

## How It Works

### For Users:
1. When starting a quiz, users see a modal asking for:
   - Their name (required)
   - Their Twitter handle (optional)
2. If they provide a Twitter handle, it's stored with their score
3. Their handle appears on the leaderboard and in social proof

### For Social Proof:
- Landing page fetches unique Twitter handles from the database
- Shows up to 20 most recent handles
- Automatically updates as more people connect
- Falls back to dummy handles if database is empty

## Future Enhancements

If you want full Twitter OAuth (automatic connection):
- Would require Twitter API keys
- More complex setup
- Current simple approach works great for MVP

## Database Schema

The leaderboard table now includes:
- `twitter_handle` VARCHAR(255) - Optional Twitter handle with @ prefix

