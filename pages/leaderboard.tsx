import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

interface LeaderboardEntry {
  id: string
  name: string
  score: number
  accuracy: number
  timeTaken: number
  level: 'beginner' | 'mid' | 'expert' | 'all'
  timestamp: number
}

type FilterLevel = 'all' | 'beginner' | 'mid' | 'expert'

export default function Leaderboard() {
  const [entries, setEntries] = useState<LeaderboardEntry[]>([])
  const [filter, setFilter] = useState<FilterLevel>('all')
  const [loading, setLoading] = useState(true)
  const [currentUserId, setCurrentUserId] = useState<string | null>(null)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    // Get current user ID from sessionStorage if available
    const userId = typeof window !== 'undefined' ? sessionStorage.getItem('lastLeaderboardEntryId') : null
    setCurrentUserId(userId)
    
    fetchLeaderboard()
  }, [filter])

  const fetchLeaderboard = async () => {
    setLoading(true)
    setError(null)
    try {
      const levelParam = filter === 'all' ? 'global' : filter
      const response = await fetch(`/api/leaderboard?level=${levelParam}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch leaderboard: ${response.status} ${response.statusText}`)
      }
      
      const data = await response.json()
      setEntries(data)
    } catch (error) {
      console.error('Error fetching leaderboard:', error)
      setError(error instanceof Error ? error.message : 'Failed to load leaderboard')
      setEntries([])
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }

  const getLevelLabel = (level: string): string => {
    switch (level) {
      case 'beginner': return 'Beginner'
      case 'mid': return 'Intermediate'
      case 'expert': return 'Expert'
      default: return 'All Levels'
    }
  }

  const getRankColor = (rank: number): string => {
    if (rank === 1) return 'text-yellow-600'
    if (rank === 2) return 'text-gray-500'
    if (rank === 3) return 'text-orange-600'
    return 'text-gray-700'
  }

  return (
    <>
      <Head>
        <title>Leaderboard - Design Gym</title>
        <meta name="description" content="Design Gym Leaderboard" />
        <meta name="viewport" content="width=device-width, initial-scale=1" />
      </Head>

      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12 text-center">
            <h1 className="text-4xl md:text-5xl font-normal text-black mb-4 tracking-tight">
              Leaderboard
            </h1>
            <p className="text-gray-600 text-lg">
              See how you stack up against other designers
            </p>
          </div>

          {/* Filter Buttons */}
          <div className="flex flex-wrap gap-3 justify-center mb-8">
            {(['all', 'beginner', 'mid', 'expert'] as FilterLevel[]).map((level) => (
              <button
                key={level}
                onClick={() => setFilter(level)}
                className={`px-6 py-2 rounded-[8px] font-medium transition-colors ${
                  filter === level
                    ? 'bg-black text-white'
                    : 'bg-gray-100 text-gray-700 hover:bg-gray-200'
                }`}
              >
                {getLevelLabel(level)}
              </button>
            ))}
          </div>

          {/* Leaderboard Table */}
          {loading ? (
            <div className="text-center py-12">
              <p className="text-gray-500">Loading leaderboard...</p>
            </div>
          ) : error ? (
            <div className="text-center py-12">
              <p className="text-red-500 mb-4">{error}</p>
              <button
                onClick={fetchLeaderboard}
                className="px-6 py-2 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-[8px]"
              >
                Retry
              </button>
            </div>
          ) : entries.length === 0 ? (
            <div className="text-center py-12">
              <p className="text-gray-500 mb-4">No entries yet. Be the first!</p>
              <Link
                href="/quiz"
                className="inline-block px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px]"
              >
                Start Training
              </Link>
            </div>
          ) : (
            <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead className="bg-gray-50">
                    <tr>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Rank</th>
                      <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Name</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Score</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Accuracy</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Time</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-gray-100">
                    {entries.map((entry, index) => {
                      const rank = index + 1
                      const isCurrentUser = entry.id === currentUserId
                      const isFirstPlace = rank === 1
                      return (
                        <tr
                          key={entry.id}
                          className={`transition-colors ${
                            isCurrentUser
                              ? 'bg-yellow-50 border-l-4 border-yellow-400'
                              : isFirstPlace
                              ? 'bg-yellow-50 border-l-4 border-yellow-400'
                              : 'hover:bg-gray-50'
                          }`}
                        >
                          <td className="px-6 py-4">
                            <span className={`text-lg font-bold ${getRankColor(rank)}`}>
                              #{rank}
                            </span>
                          </td>
                          <td className="px-6 py-4">
                            <div className="flex items-center gap-2">
                              <span className="font-medium text-gray-900">{entry.name}</span>
                              {isCurrentUser && (
                                <span className="text-xs px-2 py-0.5 bg-yellow-400 text-yellow-900 rounded-full font-medium">
                                  You
                                </span>
                              )}
                            </div>
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            {entry.score.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`font-medium ${
                              entry.accuracy >= 80 ? 'text-green-600' :
                              entry.accuracy >= 50 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {entry.accuracy}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-gray-600">
                            {formatTime(entry.timeTaken)}
                          </td>
                        </tr>
                      )
                    })}
                  </tbody>
                </table>
              </div>
            </div>
          )}

          {/* Back to Home */}
          <div className="mt-12 text-center">
            <Link
              href="/"
              className="inline-block px-8 py-3 bg-gray-100 text-gray-900 font-normal hover:bg-gray-200 transition-colors rounded-[8px]"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

