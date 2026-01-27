# Running Migration on Production Database

## Option 1: Run Migration Script with Connection String (Easiest)

**Just run this command with your production database URL:**

```bash
node run-production-migration.js "postgresql://design_gym_user:mNl4RbR3MfDqkbxUESwZdlAZIz4bVPLb@dpg-d5rqbj3uibrs739hvjfg-a.oregon-postgres.render.com/design_gym"
```

Replace the connection string with your actual production database URL if different.

**Or if you have it in an environment variable:**
```bash
DATABASE_URL="postgresql://..." node run-production-migration.js
```

This will:
- Connect to your production database
- Add the twitter_handle column
- Create the index
- Verify it worked
- Show you the results

---

## Option 2: Run Migration Script Locally (Using .env.local)

1. **Get your Production Database URL**
   - Go to https://dashboard.render.com
   - Click on your PostgreSQL database
   - Copy the **External Database URL** (for local connections)

2. **Temporarily update your .env.local**
   - Open `.env.local` in your project
   - Replace the `DATABASE_URL` with the production External Database URL
   - Save the file

3. **Run the migration**
   ```bash
   npm run migrate:twitter
   ```

4. **Revert .env.local back**
   - Change `DATABASE_URL` back to your local database URL
   - Save the file

**Note:** Make sure you're using the External Database URL (not Internal) when running from your local machine.

---

## Option 2: Run SQL Directly in Render Dashboard (Alternative)

1. **Go to Render Dashboard**
   - Visit https://dashboard.render.com
   - Click on your PostgreSQL database

2. **Open Database Connection**
   - Click "Connect" in the top right
   - Select "psql" (or use any SQL client with the connection string)

3. **Run the SQL**
   Copy and paste this SQL:

```sql
-- Add twitter_handle column to leaderboard table
ALTER TABLE leaderboard 
ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);

-- Create index for faster queries by twitter_handle
CREATE INDEX IF NOT EXISTS idx_leaderboard_twitter ON leaderboard(twitter_handle) WHERE twitter_handle IS NOT NULL;
```

4. **Execute the SQL**
   - Press Enter or click Execute
   - You should see "ALTER TABLE" and "CREATE INDEX" success messages

---

## Option 3: Use Render Shell (If Available)

If Render provides a shell/terminal access:

1. Connect to your database service
2. Run: `npm run migrate:twitter`
   (Make sure DATABASE_URL is set in Render environment variables)

---

## Verify Migration Worked

After running the migration, verify it worked:

1. **Check the column exists:**
   ```sql
   SELECT column_name, data_type 
   FROM information_schema.columns 
   WHERE table_name = 'leaderboard' AND column_name = 'twitter_handle';
   ```

2. **Or test via API:**
   - Submit a score with a Twitter handle
   - Check if it appears in the leaderboard

---

## Important Notes

- **Backup first** (if you have important data): Render should have automatic backups, but it's good practice
- **Use External Database URL** when connecting from your local machine
- **The migration is safe** - it uses `IF NOT EXISTS` so it won't break if run multiple times
- **No downtime** - adding a column is a quick operation

---

## Troubleshooting

**"Column already exists" error:**
- This is fine! It means the migration already ran
- The `IF NOT EXISTS` clause should prevent this, but if you see it, you're all set

**Connection errors:**
- Make sure you're using the External Database URL (not Internal)
- Check that your IP is allowed (Render databases are usually accessible from anywhere)
- Verify the database is running on Render

**Permission errors:**
- Make sure you're using the correct database user credentials
- Check that the connection string is correct

