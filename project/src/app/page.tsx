'use client'

import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { useEffect, useState } from 'react'
import { getRecentGames } from '@/lib/gamesUtils'
import { RecentGame } from '@/lib/supabase'
import Ladder from '@/components/Ladder'

export default function HomePage() {
  const { user, profile, loading, signOut, getDisplayRank } = useAuth()
  const [recentGames, setRecentGames] = useState<RecentGame[]>([])
  const [gamesLoading, setGamesLoading] = useState(false)
  const [selectedGameIndex, setSelectedGameIndex] = useState<number>(0) // Default to latest game

  useEffect(() => {
    if (user && profile) {
      loadRecentGames()
    }
  }, [user, profile])

  const loadRecentGames = async () => {
    if (!user) return
    
    setGamesLoading(true)
    try {
      const result = await getRecentGames(user.id, 10)
      if (result.success && result.games) {
        setRecentGames(result.games)
        setSelectedGameIndex(0) // Reset to latest game when data loads
      }
    } catch (error) {
      console.error('Failed to load recent games:', error)
    } finally {
      setGamesLoading(false)
    }
  }

  const formatGameResult = (game: RecentGame, currentUserId: string) => {
    // RecentGame already provides the result from the current user's perspective
    if (game.result === 'draw') {
      return `vs ${game.opponent_name} — Draw`
    } else if (game.result === 'win') {
      return `vs ${game.opponent_name} — You won`
    } else {
      return `vs ${game.opponent_name} — You lost`
    }
  }

  const getGameStreakDisplay = (games: RecentGame[]) => {
    // Show last 10 games in chronological order (newest first, left to right)
    const last10Games = games.slice(0, 10)
    
    return last10Games.map((game, index) => {
      let letter = ''
      let colorClass = ''
      
      switch (game.result) {
        case 'win':
          letter = 'W'
          colorClass = 'text-amber-400'
          break
        case 'loss':
          letter = 'L'
          colorClass = 'text-violet-600'
          break
        case 'draw':
          letter = 'D'
          colorClass = 'text-gray-400'
          break
      }
      
      const isSelected = selectedGameIndex === index
      
      return (
        <button
          key={`${game.game_id}-${index}`}
          onClick={() => setSelectedGameIndex(index)}
          className={`inline-block w-8 h-8 text-center text-sm font-bold ${colorClass} rounded-sm mr-1 mb-1 leading-8 transition-all hover:scale-110 ${
            isSelected ? 'bg-gray-600 ring-2 ring-blue-400' : 'bg-gray-700 hover:bg-gray-600'
          }`}
        >
          {letter}
        </button>
      )
    })
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading...</div>
      </div>
    )
  }

  return (
    <div className="layout-container">
      <main className="main-content">
        <div className="bg-gray-900 flex flex-col h-full">
          {/* Header with user status */}
          {user && profile && (
            <div className="bg-gray-800 border-b border-gray-700 px-6 py-3">
              <div className="max-w-4xl mx-auto flex justify-between items-center">
                <div className="text-sm text-gray-300">
                  Signed in as <span className="text-white font-medium">{profile.name}</span>
                  <span className="text-gray-400 ml-2">({getDisplayRank()})</span>
                </div>
                <button
                  onClick={signOut}
                  className="text-sm text-gray-400 hover:text-white transition-colors"
                >
                  Sign out
                </button>
              </div>
            </div>
          )}

          {/* Main content */}
          <div className="flex-1 flex items-center justify-center p-6">
            <div className="text-center max-w-md w-full">
              <h1 className="text-6xl font-bold text-white mb-4">
                ⚫Zugol⚪
              </h1>
              <p className="text-xl text-gray-400 mb-12">
                Zurich Go Ladder
              </p>
              
              {user && profile ? (
                <div className="space-y-6">
                  <div className="bg-gray-800 rounded-sm p-6 shadow-lg border border-gray-600" style={{
                    backgroundImage: `url("data:image/svg+xml,%3Csvg viewBox='0 0 256 256' xmlns='http://www.w3.org/2000/svg'%3E%3Cfilter id='noiseFilter'%3E%3CfeTurbulence type='fractalNoise' baseFrequency='0.85' numOctaves='3' stitchTiles='stitch'/%3E%3CfeColorMatrix values='0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 0 1 0'/%3E%3C/filter%3E%3Crect width='100%25' height='100%25' filter='url(%23noiseFilter)' opacity='0.15'/%3E%3C/svg%3E")`
                  }}>
                    <h2 className="text-xl font-semibold text-white mb-4">Welcome back, {profile.name}!</h2>
                    
                    {/* Rating and Rank - Single Row */}
                    <div className="flex justify-center items-center gap-8 mb-6">
                      <div className="text-center">
                        <div className="text-gray-400 text-sm">Rating points</div>
                        <div className="text-white font-bold text-2xl">
                          {profile.rating_points} pts
                        </div>
                      </div>
                      <div className="text-center">
                        <div className="text-gray-400 text-sm">Current rank</div>
                        <div className="text-blue-400 font-medium text-lg">
                          {getDisplayRank()}
                        </div>
                      </div>
                    </div>

                    {/* Game Streak and Selected Game Display */}
                    <div className="border-t border-gray-600 pt-4">
                      {gamesLoading ? (
                        <div className="text-gray-500 text-sm">Loading games...</div>
                      ) : recentGames.length > 0 ? (
                        <div>
                          {/* Game Streak Display */}
                          <div className="mb-4">
                            <div className="text-gray-400 text-sm mb-3 text-center">Recent results (last 10 games)</div>
                            <div className="flex flex-wrap justify-center">
                              {getGameStreakDisplay(recentGames)}
                            </div>
                          </div>

                          {/* Selected Game Info */}
                          {recentGames[selectedGameIndex] && (
                            <div className="bg-gray-600 rounded px-3 py-2 border-l-4 border-blue-400">
                              <div className="flex justify-between items-center">
                                <div className="text-white text-sm">
                                  {formatGameResult(recentGames[selectedGameIndex], user.id)}
                                </div>
                                <div className="text-gray-400 text-xs">
                                  {new Date(recentGames[selectedGameIndex].played_at).toLocaleDateString()}
                                </div>
                              </div>
                            </div>
                          )}
                        </div>
                      ) : (
                        <div className="text-gray-400 text-sm text-center">No games recorded yet</div>
                      )}
                    </div>
                  </div>

                  <div className="space-y-4">
                    <Link
                      href="/new-game"
                      className="block w-full bg-green-600 hover:bg-green-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors text-center"
                    >
                      Play a game
                    </Link>

                    <Link
                      href="/test-ranking"
                      className="block w-full bg-purple-600 hover:bg-purple-700 text-white py-4 px-6 rounded-lg font-semibold text-lg transition-colors text-center"
                    >
                      Test ranking system
                    </Link>
                  </div>
                </div>
              ) : (
                <div className="space-y-4">
                  <Link
                    href="/register"
                    className="block w-full bg-blue-600 hover:bg-blue-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Register
                  </Link>
                  <Link
                    href="/login"
                    className="block w-full bg-gray-600 hover:bg-gray-700 text-white py-3 px-6 rounded-lg font-medium transition-colors"
                  >
                    Sign in
                  </Link>
                </div>
              )}
            </div>
          </div>
        </div>
      </main>
      <div className="ladder-section">
        <Ladder />
      </div>
    </div>
  )
}

