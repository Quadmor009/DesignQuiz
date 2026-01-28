import { useState, useEffect } from 'react'
import Head from 'next/head'
import Link from 'next/link'

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

export default function Stats() {
  const [stats, setStats] = useState<UserStats | null>(null)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)
  const [userIdentifier, setUserIdentifier] = useState<string>('')

  useEffect(() => {
    // Get user identifier from URL params or sessionStorage
    const params = new URLSearchParams(window.location.search)
    const name = params.get('name')
    const twitterHandle = params.get('twitter')
    
    // Or get from sessionStorage (last submitted entry)
    const lastEntryId = sessionStorage.getItem('lastLeaderboardEntryId')
    
    if (name) {
      setUserIdentifier(name)
      fetchStats(name, null)
    } else if (twitterHandle) {
      setUserIdentifier(twitterHandle)
      fetchStats(null, twitterHandle)
    } else if (lastEntryId) {
      // Try to get name from last entry
      fetchLastEntryName(lastEntryId)
    } else {
      setError('No user identifier found. Please provide ?name=YourName or ?twitter=YourHandle')
      setLoading(false)
    }
  }, [])

  const fetchLastEntryName = async (entryId: string) => {
    try {
      const response = await fetch('/api/leaderboard')
      if (response.ok) {
        const entries = await response.json()
        const entry = entries.find((e: any) => e.id === entryId)
        if (entry) {
          setUserIdentifier(entry.name)
          fetchStats(entry.name, null)
        } else {
          setError('Could not find your stats. Please provide ?name=YourName')
          setLoading(false)
        }
      }
    } catch (error) {
      setError('Failed to load stats')
      setLoading(false)
    }
  }

  const fetchStats = async (name: string | null, twitterHandle: string | null) => {
    setLoading(true)
    setError(null)
    try {
      const params = new URLSearchParams()
      if (name) params.set('name', name)
      if (twitterHandle) params.set('twitterHandle', twitterHandle)
      
      const response = await fetch(`/api/user-stats?${params.toString()}`)
      
      if (!response.ok) {
        throw new Error(`Failed to fetch stats: ${response.status}`)
      }
      
      const data = await response.json()
      setStats(data)
    } catch (error) {
      console.error('Error fetching stats:', error)
      setError(error instanceof Error ? error.message : 'Failed to load stats')
    } finally {
      setLoading(false)
    }
  }

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60)
    const secs = seconds % 60
    return `${mins}:${secs.toString().padStart(2, '0')}`
  }


  if (loading) {
    return (
      <>
        <Head>
          <title>Your Progress - Design Gym</title>
        </Head>
        <main className="min-h-screen bg-white flex items-center justify-center">
          <p className="text-gray-500">Loading your stats...</p>
        </main>
      </>
    )
  }

  if (error || !stats) {
    return (
      <>
        <Head>
          <title>Stats - Design Gym</title>
        </Head>
        <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
          <div className="max-w-4xl mx-auto text-center">
            <h1 className="text-4xl font-bold text-black mb-4">Stats</h1>
            <p className="text-red-500 mb-6">{error || 'No stats found'}</p>
            <p className="text-gray-600 mb-6">
              View stats by visiting: <code className="bg-gray-100 px-2 py-1 rounded">/stats?name=YourName</code>
            </p>
            <Link
              href="/"
              className="inline-block px-6 py-3 bg-black text-white font-medium hover:bg-gray-800 transition-colors rounded-[8px]"
            >
              Back to Home
            </Link>
          </div>
        </main>
      </>
    )
  }

  return (
    <>
      <Head>
        <title>Your Progress - Design Gym</title>
      </Head>
      <main className="min-h-screen bg-white px-6 py-12 md:px-12 md:py-16">
        <div className="max-w-4xl mx-auto">
          {/* Header */}
          <div className="mb-12">
            <h1 className="text-4xl md:text-5xl font-normal text-black mb-2 tracking-tight">
              Your Progress
            </h1>
            <p className="text-gray-600 text-lg">
              Track your improvement over time
            </p>
          </div>

          {/* Key Stats Grid */}
          <div className="grid grid-cols-1 md:grid-cols-4 gap-4 mb-12">
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Total Sessions</p>
              <p className="text-3xl font-bold text-black">{stats.totalSessions}</p>
            </div>
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Personal Best</p>
              <p className="text-3xl font-bold text-black">{stats.personalBestScore.toLocaleString()}</p>
            </div>
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Avg Accuracy</p>
              <p className="text-3xl font-bold text-black">{stats.averageAccuracy.toFixed(1)}%</p>
            </div>
            <div className="bg-gray-50 rounded-[2rem] p-6 border border-gray-200">
              <p className="text-sm text-gray-600 mb-1">Avg Time</p>
              <p className="text-3xl font-bold text-black">{formatTime(stats.averageTime)}</p>
            </div>
          </div>

          {/* Accuracy Trend */}
          {stats.accuracyTrend.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-normal text-black mb-6">Accuracy Trend (Last 10 Sessions)</h2>
              <div className="bg-white border border-gray-200 rounded-[2rem] p-6">
                <div className="space-y-3">
                  {stats.accuracyTrend.map((point, index) => (
                    <div key={index} className="flex items-center gap-4">
                      <div className="w-20 text-sm text-gray-600">Session {point.session}</div>
                      <div className="flex-1 bg-gray-100 rounded-full h-6 relative overflow-hidden">
                        <div
                          className="h-full bg-black transition-all duration-500"
                          style={{ width: `${point.accuracy}%` }}
                        />
                        <span className="absolute inset-0 flex items-center justify-center text-xs font-medium text-gray-900">
                          {point.accuracy.toFixed(1)}%
                        </span>
                      </div>
                      <div className="w-24 text-xs text-gray-500 text-right">{point.date}</div>
                    </div>
                  ))}
                </div>
              </div>
            </div>
          )}

          {/* Recent Sessions */}
          {stats.recentSessions.length > 0 && (
            <div className="mb-12">
              <h2 className="text-2xl font-normal text-black mb-6">Recent Sessions</h2>
              <div className="bg-white border border-gray-200 rounded-[2rem] overflow-hidden">
                <div className="overflow-x-auto">
                  <table className="w-full">
                    <thead className="bg-gray-50">
                      <tr>
                        <th className="px-6 py-4 text-left text-sm font-semibold text-gray-700">Date</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Score</th>
                        <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Accuracy</th>
                      <th className="px-6 py-4 text-right text-sm font-semibold text-gray-700">Time</th>
                    </tr>
                    </thead>
                    <tbody className="divide-y divide-gray-100">
                      {stats.recentSessions.map((session) => (
                        <tr key={session.id} className="hover:bg-gray-50">
                          <td className="px-6 py-4 text-sm text-gray-600">
                            {new Date(session.timestamp).toLocaleDateString()}
                          </td>
                          <td className="px-6 py-4 text-right font-semibold text-gray-900">
                            {session.score.toLocaleString()}
                          </td>
                          <td className="px-6 py-4 text-right">
                            <span className={`text-sm font-medium ${
                              session.accuracy >= 80 ? 'text-green-600' :
                              session.accuracy >= 50 ? 'text-orange-600' :
                              'text-red-600'
                            }`}>
                              {session.accuracy.toFixed(1)}%
                            </span>
                          </td>
                          <td className="px-6 py-4 text-right text-sm text-gray-600">
                            {formatTime(session.timeTaken)}
                          </td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            </div>
          )}

          {/* Actions */}
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link
              href="/quiz"
              className="px-8 py-3 bg-black text-white font-normal hover:bg-gray-800 transition-colors rounded-[8px] text-center"
            >
              Practice Again
            </Link>
            <Link
              href="/leaderboard"
              className="px-8 py-3 bg-gray-100 text-gray-900 font-normal hover:bg-gray-200 transition-colors rounded-[8px] text-center"
            >
              View Leaderboard
            </Link>
            <Link
              href="/"
              className="px-8 py-3 bg-gray-100 text-gray-900 font-normal hover:bg-gray-200 transition-colors rounded-[8px] text-center"
            >
              Back to Home
            </Link>
          </div>
        </div>
      </main>
    </>
  )
}

