const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Get database connection string from command line argument or environment variable
const connectionString = process.argv[2] || process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL not provided!')
  console.error('\nUsage:')
  console.error('  node run-production-migration.js "postgresql://user:password@host:5432/database"')
  console.error('\nOr set DATABASE_URL environment variable:')
  console.error('  DATABASE_URL="postgresql://..." node run-production-migration.js')
  process.exit(1)
}

// Create connection pool
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function runMigration() {
  try {
    console.log('🔌 Connecting to database...')
    console.log('📝 Running migration: Add Twitter handle column...')
    
    // Read migration SQL
    const migrationSQL = `
      -- Add twitter_handle column to leaderboard table
      ALTER TABLE leaderboard 
      ADD COLUMN IF NOT EXISTS twitter_handle VARCHAR(255);

      -- Create index for faster queries by twitter_handle
      CREATE INDEX IF NOT EXISTS idx_leaderboard_twitter ON leaderboard(twitter_handle) WHERE twitter_handle IS NOT NULL;
    `
    
    // Execute migration
    await pool.query(migrationSQL)
    
    // Verify it worked
    const result = await pool.query(`
      SELECT column_name, data_type 
      FROM information_schema.columns 
      WHERE table_name = 'leaderboard' AND column_name = 'twitter_handle'
    `)
    
    if (result.rows.length > 0) {
      console.log('✅ Migration completed successfully!')
      console.log('✅ Column verified:', result.rows[0])
    } else {
      console.log('⚠️  Migration ran but column not found - this might be normal if table doesn\'t exist yet')
    }
    
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration failed:', error.message)
    if (error.message.includes('already exists')) {
      console.log('ℹ️  Column already exists - migration may have already run. This is OK!')
    }
    await pool.end()
    process.exit(1)
  }
}

runMigration()

