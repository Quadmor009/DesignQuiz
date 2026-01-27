import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../../lib/db'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  accuracy: number
  timeTaken: number // in seconds
  level: 'beginner' | 'mid' | 'expert' | 'all'
  timestamp: number
  twitterHandle?: string | null
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  // Set CORS headers
  res.setHeader('Access-Control-Allow-Origin', '*')
  res.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS')
  res.setHeader('Access-Control-Allow-Headers', 'Content-Type')

  if (req.method === 'OPTIONS') {
    return res.status(200).end()
  }

  try {
    // Check if database is configured
    if (!process.env.DATABASE_URL) {
      console.error('DATABASE_URL is not set')
      console.error('Available env vars:', Object.keys(process.env).filter(k => k.includes('DATABASE')))
      
      // Add debug info in response for easier troubleshooting
      const debugInfo = req.query.debug === 'true' ? {
        nodeEnv: process.env.NODE_ENV,
        availableEnvVars: Object.keys(process.env).filter(k => k.includes('DATABASE') || k.includes('VERCEL')),
        timestamp: new Date().toISOString()
      } : {}
      
      return res.status(503).json({ 
        error: 'Database not configured',
        message: 'DATABASE_URL environment variable is missing. Please add it in your deployment platform (Vercel/Render) environment variables and redeploy.',
        hint: 'Make sure to redeploy after adding the environment variable',
        ...debugInfo
      })
    }
    
    // Log that we have the URL (but don't log the actual URL for security)
    console.log('DATABASE_URL is set, length:', process.env.DATABASE_URL.length)

    if (req.method === 'GET') {
      const { level = 'all', debug } = req.query
      
      // If debug mode, return diagnostic info
      if (debug === 'true') {
        return res.status(200).json({
          success: true,
          databaseConfigured: true,
          databaseUrlLength: process.env.DATABASE_URL?.length || 0,
          nodeEnv: process.env.NODE_ENV,
          timestamp: new Date().toISOString(),
          message: 'Database is configured. Attempting to fetch leaderboard...'
        })
      }
      
      let sql: string
      let params: any[] = []
      
      if (level === 'all' || level === 'global') {
        // Get all entries, sorted by score DESC, accuracy DESC, time_taken ASC
        sql = `
          SELECT id, name, score, accuracy, time_taken as "timeTaken", level, timestamp, twitter_handle as "twitterHandle"
          FROM leaderboard
          ORDER BY score DESC, accuracy DESC, time_taken ASC
        `
      } else {
        // Filter by level
        sql = `
          SELECT id, name, score, accuracy, time_taken as "timeTaken", level, timestamp, twitter_handle as "twitterHandle"
          FROM leaderboard
          WHERE level = $1
          ORDER BY score DESC, accuracy DESC, time_taken ASC
        `
        params = [level]
      }
      
      const result = await query(sql, params)
      const entries: LeaderboardEntry[] = result.rows
      
      res.status(200).json(entries)
      
    } else if (req.method === 'POST') {
      const entry: LeaderboardEntry = req.body
      
      // Validate entry
      if (!entry.name || entry.score === undefined || entry.accuracy === undefined || entry.timeTaken === undefined) {
        return res.status(400).json({ error: 'Missing required fields' })
      }
      
      // Validate level
      if (!['beginner', 'mid', 'expert', 'all'].includes(entry.level)) {
        return res.status(400).json({ error: 'Invalid level' })
      }
      
      // Generate ID and timestamp
      const id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
      const timestamp = Date.now()
      
      // Insert into database
      const insertSQL = `
        INSERT INTO leaderboard (id, name, score, accuracy, time_taken, level, timestamp, twitter_handle)
        VALUES ($1, $2, $3, $4, $5, $6, $7, $8)
        RETURNING id, name, score, accuracy, time_taken as "timeTaken", level, timestamp, twitter_handle as "twitterHandle"
      `
      
      // Normalize Twitter handle (remove @ if present, add it back)
      const twitterHandle = entry.twitterHandle 
        ? entry.twitterHandle.startsWith('@') 
          ? entry.twitterHandle 
          : `@${entry.twitterHandle}`
        : null
      
      const result = await query(insertSQL, [
        id,
        entry.name,
        entry.score,
        entry.accuracy,
        entry.timeTaken,
        entry.level,
        timestamp,
        twitterHandle
      ])
      
      const newEntry: LeaderboardEntry = result.rows[0]
      
      res.status(201).json(newEntry)
      
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Leaderboard API error:', error)
    console.error('Error stack:', error instanceof Error ? error.stack : 'No stack trace')
    console.error('Request method:', req.method)
    console.error('Request URL:', req.url)
    console.error('DATABASE_URL exists:', !!process.env.DATABASE_URL)
    console.error('DATABASE_URL length:', process.env.DATABASE_URL?.length || 0)
    
    // Ensure we always send a response, even if there's an error
    if (!res.headersSent) {
      const errorMessage = error instanceof Error ? error.message : 'Unknown error'
      const errorDetails = process.env.NODE_ENV === 'production' 
        ? 'Check Vercel function logs for details'
        : errorMessage
      
      res.status(500).json({ 
        error: 'Internal server error',
        message: errorDetails,
        ...(process.env.NODE_ENV !== 'production' && { details: errorMessage })
      })
    }
  }
}
