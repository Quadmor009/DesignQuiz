import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../../lib/db'

/**
 * API endpoint to get Twitter handles for social proof
 * Returns unique Twitter handles from leaderboard entries that have them
 */
export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

    // Get unique Twitter handles from leaderboard (only those that have handles)
    const sql = `
      SELECT DISTINCT twitter_handle
      FROM leaderboard
      WHERE twitter_handle IS NOT NULL 
        AND twitter_handle != ''
      ORDER BY created_at DESC
      LIMIT 20
    `

    const result = await query(sql)
    const handles = result.rows
      .map(row => row.twitter_handle)
      .filter(handle => handle && handle.trim() !== '')

    res.status(200).json(handles)
  } catch (error) {
    console.error('Twitter handles API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

