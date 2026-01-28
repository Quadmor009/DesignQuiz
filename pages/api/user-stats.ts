import type { NextApiRequest, NextApiResponse } from 'next'
import { query } from '../../lib/db'

interface UserStats {
  totalSessions: number
  personalBestScore: number
  averageAccuracy: number
  averageTime: number
  accuracyTrend: { session: number; accuracy: number; date: string }[]
  recentSessions: Array<{
    id: string
    score: number
    accuracy: number
    timeTaken: number
    timestamp: number
  }>
}

export default async function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method !== 'GET') {
      res.setHeader('Allow', ['GET'])
      return res.status(405).json({ error: 'Method not allowed' })
    }

    const { name, twitterHandle } = req.query

    if (!name && !twitterHandle) {
      return res.status(400).json({ error: 'Name or Twitter handle required' })
    }

    // Build WHERE clause based on identifier
    let whereClause = ''
    let params: any[] = []

    if (twitterHandle) {
      // Normalize Twitter handle (add @ if missing)
      const handle = (twitterHandle as string).startsWith('@') 
        ? twitterHandle 
        : `@${twitterHandle}`
      whereClause = 'WHERE twitter_handle = $1'
      params = [handle]
    } else {
      whereClause = 'WHERE name = $1'
      params = [name]
    }

    // Get all sessions for this user
    const sessionsSQL = `
      SELECT id, score, accuracy, time_taken as "timeTaken", level, timestamp, created_at
      FROM leaderboard
      ${whereClause}
      ORDER BY created_at DESC
    `

    const result = await query(sessionsSQL, params)
    const sessions = result.rows

    if (sessions.length === 0) {
      return res.status(200).json({
        totalSessions: 0,
        personalBestScore: 0,
        averageAccuracy: 0,
        averageTime: 0,
        accuracyTrend: [],
        recentSessions: []
      })
    }

    // Calculate stats
    const totalSessions = sessions.length
    const personalBestScore = Math.max(...sessions.map(s => s.score))
    const averageAccuracy = sessions.reduce((sum, s) => sum + parseFloat(s.accuracy), 0) / totalSessions
    const averageTime = sessions.reduce((sum, s) => sum + s.timeTaken, 0) / totalSessions

    // Accuracy trend (last 10 sessions, ordered by date)
    const accuracyTrend = sessions
      .slice(0, 10)
      .reverse()
      .map((session, index) => ({
        session: index + 1,
        accuracy: parseFloat(session.accuracy),
        date: new Date(session.timestamp).toLocaleDateString()
      }))

    // Recent sessions (last 5)
    const recentSessions = sessions.slice(0, 5).map(session => ({
      id: session.id,
      score: session.score,
      accuracy: parseFloat(session.accuracy),
      timeTaken: session.timeTaken,
      timestamp: session.timestamp
    }))

    const stats: UserStats = {
      totalSessions,
      personalBestScore,
      averageAccuracy: Math.round(averageAccuracy * 100) / 100,
      averageTime: Math.round(averageTime),
      accuracyTrend,
      recentSessions
    }

    res.status(200).json(stats)
  } catch (error) {
    console.error('User stats API error:', error)
    res.status(500).json({ 
      error: 'Internal server error',
      message: error instanceof Error ? error.message : 'Unknown error'
    })
  }
}

