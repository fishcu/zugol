'use client'

import { useState } from 'react'
import { useAuth } from '@/contexts/AuthContext'
import { simulateGameForPlayer } from '@/lib/gameUtils'
import { ratingPointsToRank } from '@/lib/supabase'

export default function TestRankingPage() {
  const { user, profile, getDisplayRank, refreshProfile } = useAuth()
  const [isSimulating, setIsSimulating] = useState(false)
  const [lastResult, setLastResult] = useState<string>('')

  const simulateGame = async (won: boolean) => {
    if (!user || !profile) return

    setIsSimulating(true)
    setLastResult('')

    try {
      const result = await simulateGameForPlayer(user.id, won, 1)
      
      if (result.success) {
        const action = won ? 'Won' : 'Lost'
        const rankChangeText = result.rankChanged ? ' (Rank changed!)' : ''
        setLastResult(`${action} game! Rating ${won ? '+' : '-'}1 point${rankChangeText}`)
        
        // Refresh profile data to see updates
        await refreshProfile()
      } else {
        setLastResult(`Error: ${result.error}`)
      }
    } catch (error) {
      setLastResult('Unexpected error occurred')
    } finally {
      setIsSimulating(false)
    }
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Please log in to test the ranking system</div>
      </div>
    )
  }

  const ratingBasedRank = ratingPointsToRank(profile.rating_points)
  const displayRank = getDisplayRank()
  const gamesSinceRankChange = profile.total_games_played - profile.games_at_last_rank_change
  const isRankFrozen = gamesSinceRankChange < 5
  const showsAsterisk = displayRank.includes('*')

  return (
    <div className="min-h-screen bg-gray-900 p-6">
      <div className="max-w-2xl mx-auto">
        <h1 className="text-3xl font-bold text-white mb-8 text-center">
          Rank Stability Test
        </h1>

        {/* Current Status */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Current Status</h2>
          <div className="space-y-2 text-gray-300">
            <p><span className="text-blue-400">Player:</span> {profile.name}</p>
            <p><span className="text-blue-400">Rating Points:</span> {profile.rating_points}</p>
            <p><span className="text-blue-400">Rating-based Rank:</span> {ratingBasedRank}</p>
            <p><span className="text-blue-400">Last Rank Reached:</span> {profile.last_rank_reached}</p>
            <p><span className="text-blue-400">Display Rank:</span> <span className="text-lg font-bold">{displayRank}</span></p>
            <p><span className="text-blue-400">Games Since Rank Change:</span> {gamesSinceRankChange}</p>
            <p><span className="text-blue-400">Games at Last Rank Change:</span> {profile.games_at_last_rank_change}</p>
            <p><span className="text-blue-400">Total Games Played:</span> {profile.total_games_played}</p>
          </div>
        </div>

        {/* Status Indicators */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Rank Status</h2>
          <div className="space-y-2">
            <div className={`p-3 rounded ${isRankFrozen ? 'bg-yellow-900 text-yellow-200' : 'bg-green-900 text-green-200'}`}>
              <strong>Rank Frozen:</strong> {isRankFrozen ? 'Yes (Hysteresis active)' : 'No (Normal mode)'}
            </div>
            <div className={`p-3 rounded ${showsAsterisk ? 'bg-blue-900 text-blue-200' : 'bg-gray-700 text-gray-300'}`}>
              <strong>Shows Asterisk:</strong> {showsAsterisk ? 'Yes (Recent rank change)' : 'No'}
            </div>
            {isRankFrozen && (
              <div className="p-3 rounded bg-purple-900 text-purple-200">
                <strong>Games until unfrozen:</strong> {5 - gamesSinceRankChange}
              </div>
            )}
          </div>
        </div>

        {/* Simulation Controls */}
        <div className="bg-gray-800 rounded-lg p-6 mb-6">
          <h2 className="text-xl font-semibold text-white mb-4">Simulate Games</h2>
          <div className="flex gap-4 mb-4">
            <button
              onClick={() => simulateGame(true)}
              disabled={isSimulating}
              className="flex-1 bg-green-600 hover:bg-green-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {isSimulating ? 'Simulating...' : 'Win game (+1)'}
            </button>
            <button
              onClick={() => simulateGame(false)}
              disabled={isSimulating}
              className="flex-1 bg-red-600 hover:bg-red-700 disabled:bg-gray-600 text-white py-3 px-6 rounded-lg font-medium transition-colors"
            >
              {isSimulating ? 'Simulating...' : 'Lose game (-1)'}
            </button>
          </div>
          {lastResult && (
            <div className="p-3 bg-gray-700 rounded text-gray-200">
              <strong>Last Result:</strong> {lastResult}
            </div>
          )}
        </div>

        {/* Explanation */}
        <div className="bg-gray-800 rounded-lg p-6">
          <h2 className="text-xl font-semibold text-white mb-4">How It Works</h2>
          <div className="text-gray-300 space-y-2 text-sm">
            <p><strong>Rank Hysteresis:</strong> When your rank changes, it's "frozen" for 5 games to prevent oscillation.</p>
            <p><strong>Asterisk Notation:</strong> Ranks show a * if the rank changed less than 5 games ago.</p>
            <p><strong>Display Logic:</strong> During freeze period, shows the new rank regardless of rating points.</p>
            <p><strong>After Freeze:</strong> Returns to normal rating-based rank calculation.</p>
          </div>
        </div>

        {/* Back to Home */}
        <div className="mt-6 text-center">
          <a
            href="/"
            className="inline-block bg-blue-600 hover:bg-blue-700 text-white py-2 px-6 rounded-lg font-medium transition-colors"
          >
            Back to home
          </a>
        </div>
      </div>
    </div>
  )
} 