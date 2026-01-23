import type { NextApiRequest, NextApiResponse } from 'next'
import fs from 'fs'
import path from 'path'

export interface LeaderboardEntry {
  id: string
  name: string
  score: number
  accuracy: number
  timeTaken: number // in seconds
  level: 'beginner' | 'mid' | 'expert' | 'all'
  timestamp: number
}

const LEADERBOARD_FILE = path.join(process.cwd(), 'data', 'leaderboard.json')

// Ensure data directory exists
function ensureDataDirectory() {
  const dataDir = path.join(process.cwd(), 'data')
  if (!fs.existsSync(dataDir)) {
    fs.mkdirSync(dataDir, { recursive: true })
  }
}

// Read leaderboard data
function readLeaderboard(): LeaderboardEntry[] {
  ensureDataDirectory()
  if (!fs.existsSync(LEADERBOARD_FILE)) {
    return []
  }
  try {
    const data = fs.readFileSync(LEADERBOARD_FILE, 'utf8')
    return JSON.parse(data)
  } catch (error) {
    console.error('Error reading leaderboard:', error)
    return []
  }
}

// Write leaderboard data
function writeLeaderboard(entries: LeaderboardEntry[]) {
  ensureDataDirectory()
  fs.writeFileSync(LEADERBOARD_FILE, JSON.stringify(entries, null, 2))
}

// Sort entries: score DESC, accuracy DESC, timeTaken ASC
function sortEntries(entries: LeaderboardEntry[]): LeaderboardEntry[] {
  return [...entries].sort((a, b) => {
    // First by score (descending)
    if (b.score !== a.score) {
      return b.score - a.score
    }
    // Then by accuracy (descending)
    if (b.accuracy !== a.accuracy) {
      return b.accuracy - a.accuracy
    }
    // Finally by time taken (ascending - faster is better)
    return a.timeTaken - b.timeTaken
  })
}

// Filter entries by level
function filterByLevel(entries: LeaderboardEntry[], level: string): LeaderboardEntry[] {
  if (level === 'all' || level === 'global') {
    return entries
  }
  return entries.filter(entry => entry.level === level)
}

export default function handler(
  req: NextApiRequest,
  res: NextApiResponse
) {
  try {
    if (req.method === 'GET') {
      const { level = 'all' } = req.query
      const entries = readLeaderboard()
      const filtered = filterByLevel(entries, level as string)
      const sorted = sortEntries(filtered)
      
      res.status(200).json(sorted)
    } else if (req.method === 'POST') {
    const entry: LeaderboardEntry = req.body
    
    // Validate entry
    if (!entry.name || entry.score === undefined || entry.accuracy === undefined || !entry.timeTaken) {
      return res.status(400).json({ error: 'Missing required fields' })
    }
    
    // Generate ID
    entry.id = `${Date.now()}-${Math.random().toString(36).substr(2, 9)}`
    entry.timestamp = Date.now()
    
    // Read existing entries
    const entries = readLeaderboard()
    
    // Add new entry
    entries.push(entry)
    
    // Write back
    writeLeaderboard(entries)
    
      res.status(201).json(entry)
    } else {
      res.setHeader('Allow', ['GET', 'POST'])
      res.status(405).json({ error: 'Method not allowed' })
    }
  } catch (error) {
    console.error('Leaderboard API error:', error)
    res.status(500).json({ error: 'Internal server error' })
  }
}

