import { Pool } from 'pg'

// Database connection pool
let pool: Pool | null = null

export function getDbPool(): Pool {
  if (pool) {
    return pool
  }

  // Get database connection string from environment variable
  const connectionString = process.env.DATABASE_URL

  if (!connectionString) {
    // Don't throw - return a helpful error message instead
    // This prevents Next.js from crashing during module import
    const error = new Error(
      'DATABASE_URL environment variable is not set. ' +
      'Please set it in your .env.local file (for local) or deployment platform environment variables (for production). ' +
      'Make sure to restart your dev server after creating .env.local, or redeploy after adding the environment variable.'
    )
    console.error(error.message)
    console.error('Current NODE_ENV:', process.env.NODE_ENV)
    throw error
  }

  try {
    // Create connection pool
    // Render PostgreSQL requires SSL connections
    pool = new Pool({
      connectionString,
      ssl: { rejectUnauthorized: false },
      // Add connection timeout and retry settings
      connectionTimeoutMillis: 5000,
      idleTimeoutMillis: 30000,
    })

    // Handle pool errors
    pool.on('error', (err) => {
      console.error('Unexpected database pool error:', err)
      pool = null // Reset pool on error so it can be recreated
    })

    return pool
  } catch (error) {
    console.error('Failed to create database pool:', error)
    pool = null // Reset pool on error
    throw error
  }
}

// Helper function to execute queries
export async function query(text: string, params?: any[]) {
  try {
    const db = getDbPool()
    const result = await db.query(text, params)
    return result
  } catch (error) {
    console.error('Database query error:', error)
    // Re-throw with more context
    if (error instanceof Error) {
      throw new Error(`Database query failed: ${error.message}`)
    }
    throw error
  }
}

// Test database connection (for debugging)
export async function testConnection(): Promise<boolean> {
  try {
    await query('SELECT 1')
    return true
  } catch (error) {
    console.error('Database connection test failed:', error)
    return false
  }
}

