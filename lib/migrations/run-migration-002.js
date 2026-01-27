const { Pool } = require('pg')
const fs = require('fs')
const path = require('path')

// Load .env.local file if it exists
const envPath = path.join(process.cwd(), '.env.local')
if (fs.existsSync(envPath)) {
  const envFile = fs.readFileSync(envPath, 'utf8')
  envFile.split('\n').forEach(line => {
    const trimmed = line.trim()
    if (trimmed && !trimmed.startsWith('#')) {
      const [key, ...valueParts] = trimmed.split('=')
      if (key && valueParts.length > 0) {
        process.env[key.trim()] = valueParts.join('=').trim()
      }
    }
  })
}

// Get database connection string from environment variable
const connectionString = process.env.DATABASE_URL

if (!connectionString) {
  console.error('❌ DATABASE_URL environment variable is not set.')
  console.error('Please set it in your .env.local file or environment variables.')
  process.exit(1)
}

// Create connection pool
// Render PostgreSQL requires SSL connections
const pool = new Pool({
  connectionString,
  ssl: { rejectUnauthorized: false },
})

async function runMigration() {
  try {
    console.log('Running migration 002: Add Twitter handle column...')
    
    // Read migration file
    const migrationPath = path.join(__dirname, '002_add_twitter_handle.sql')
    const migrationSQL = fs.readFileSync(migrationPath, 'utf8')
    
    // Execute migration
    await pool.query(migrationSQL)
    
    console.log('✅ Migration 002 completed successfully!')
    await pool.end()
    process.exit(0)
  } catch (error) {
    console.error('❌ Migration 002 failed:', error)
    await pool.end()
    process.exit(1)
  }
}

runMigration()

