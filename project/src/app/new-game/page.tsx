'use client'

import { useState, useEffect, useMemo } from 'react'
import Link from 'next/link'
import { useAuth } from '@/contexts/AuthContext'
import { supabase, ratingPointsToRank, getDisplayRank } from '@/lib/supabase'
import { calculateGameSettings, Player } from '@/lib/gameSettings'
import GameSettingsDisplay from '@/components/GameSettings'
import RatingTable from '@/components/RatingTable'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_since_last_rank_change: number
  created_at: string
  updated_at: string
}

export default function NewGamePage() {
  const { user, profile } = useAuth()
  const [opponents, setOpponents] = useState<Profile[]>([])
  const [selectedOpponentId, setSelectedOpponentId] = useState<string>('')
  const [searchTerm, setSearchTerm] = useState('')
  const [isDropdownOpen, setIsDropdownOpen] = useState(false)
  const [loading, setLoading] = useState(true)
  const [error, setError] = useState<string | null>(null)

  useEffect(() => {
    fetchOpponents()
  }, [user])

  const fetchOpponents = async () => {
    if (!user) return

    try {
      setLoading(true)
      const { data, error } = await supabase
        .from('profiles')
        .select('*')
        .neq('id', user.id) // Exclude current user
        .order('name', { ascending: true }) // Sort alphabetically by name

      if (error) {
        setError('Failed to load players')
        console.error('Error fetching opponents:', error)
        return
      }

      setOpponents(data || [])
    } catch (err) {
      setError('Unexpected error occurred')
      console.error('Unexpected error:', err)
    } finally {
      setLoading(false)
    }
  }

  // Filter opponents based on search term
  const filteredOpponents = useMemo(() => {
    if (!searchTerm) return opponents
    return opponents.filter(opponent => 
      opponent.name.toLowerCase().includes(searchTerm.toLowerCase())
    )
  }, [opponents, searchTerm])

  // Get selected opponent
  const selectedOpponent = opponents.find(opponent => opponent.id === selectedOpponentId)

  // Calculate game settings if opponent is selected
  const gameSettings = useMemo(() => {
    if (!profile || !selectedOpponent) return null

    const currentPlayer: Player = {
      id: profile.id,
      name: profile.name,
      rating_points: profile.rating_points
    }

    const opponentPlayer: Player = {
      id: selectedOpponent.id,
      name: selectedOpponent.name,
      rating_points: selectedOpponent.rating_points
    }

    const settings = calculateGameSettings(currentPlayer, opponentPlayer)
    
    // Add full profile data for rank display
    return {
      ...settings,
      blackPlayerProfile: settings.blackPlayer.id === profile.id ? profile : selectedOpponent,
      whitePlayerProfile: settings.whitePlayer.id === profile.id ? profile : selectedOpponent
    }
  }, [profile, selectedOpponent])

  const handleOpponentSelect = (opponentId: string) => {
    setSelectedOpponentId(opponentId)
    setIsDropdownOpen(false)
    setSearchTerm('')
  }

  if (!user || !profile) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Please sign in to start a new game.</div>
      </div>
    )
  }

  if (loading) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-white text-lg">Loading players...</div>
      </div>
    )
  }

  if (error) {
    return (
      <div className="min-h-screen bg-gray-900 flex items-center justify-center">
        <div className="text-center">
          <div className="text-red-400 text-lg mb-4">{error}</div>
          <Link
            href="/"
            className="bg-blue-600 hover:bg-blue-700 text-white py-2 px-4 rounded-lg transition-colors"
          >
            Back to Home
          </Link>
        </div>
      </div>
    )
  }

  return (
    <div className="min-h-screen bg-gray-900">
      <div className="max-w-6xl mx-auto p-6">
        {/* Header */}
        <div className="mb-8">
          <Link
            href="/"
            className="text-blue-400 hover:text-blue-300 transition-colors mb-4 inline-block"
          >
            ← Back to home
          </Link>
          <h1 className="text-3xl font-bold text-white mb-2">Play a game</h1>
          <p className="text-gray-400">Choose your opponent to see game settings</p>
        </div>

        {/* Combined Player Selection */}
        <div className="bg-gray-800 rounded-lg p-6 mb-8">
          <div className="flex items-center gap-4 mb-4">
            <span className="text-xl font-semibold text-white whitespace-nowrap">
              You ({profile.name}) vs
            </span>
            
            {opponents.length === 0 ? (
              <span className="text-gray-400">No other players found</span>
            ) : (
              <div className="relative flex-1">
                <div className="relative">
                  <input
                    type="text"
                    placeholder="Choose opponent"
                    value={selectedOpponent ? selectedOpponent.name : searchTerm}
                    onChange={(e) => {
                      setSearchTerm(e.target.value)
                      setIsDropdownOpen(true)
                      if (selectedOpponent) {
                        setSelectedOpponentId('')
                      }
                    }}
                    onFocus={() => setIsDropdownOpen(true)}
                    className="w-full bg-gray-700 text-white p-3 rounded-lg border border-gray-600 focus:border-blue-500 focus:outline-none"
                  />
                  <div className="absolute right-3 top-1/2 transform -translate-y-1/2 text-gray-400">
                    {isDropdownOpen ? '▲' : '▼'}
                  </div>
                </div>

                {isDropdownOpen && (
                  <div className="absolute z-10 w-full mt-1 bg-gray-700 border border-gray-600 rounded-lg shadow-lg max-h-60 overflow-y-auto">
                    {filteredOpponents.length === 0 ? (
                      <div className="p-3 text-gray-400 text-center">No players found</div>
                    ) : (
                      filteredOpponents.map((opponent) => {
                        const ratingDifference = opponent.rating_points - profile.rating_points
                        const displayRank = getDisplayRank(opponent)
                        
                        return (
                          <button
                            key={opponent.id}
                            onClick={() => handleOpponentSelect(opponent.id)}
                            className="w-full text-left p-3 hover:bg-gray-600 transition-colors border-b border-gray-600 last:border-b-0"
                          >
                            <div className="flex items-center justify-between">
                              <div>
                                <div className="text-white font-medium">{opponent.name}</div>
                                <div className="text-gray-400 text-sm">
                                  Rating difference: {ratingDifference > 0 ? '+' : ''}{ratingDifference} points
                                </div>
                              </div>
                              <div className="text-right">
                                <div className="text-white text-sm">{opponent.rating_points} pts <span className="text-blue-400">({displayRank})</span></div>
                              </div>
                            </div>
                          </button>
                        )
                      })
                    )}
                  </div>
                )}
              </div>
            )}
          </div>
          
          {opponents.length === 0 && (
            <div className="text-gray-400 text-center py-4">
              Invite friends to join Zugol!
            </div>
          )}
        </div>

        {/* Game Settings - Only show when opponent is selected */}
        {gameSettings && (
          <>
            <div className="mb-8">
              <GameSettingsDisplay gameSettings={gameSettings} />
            </div>

            {/* Rating Table */}
            <RatingTable 
              highlightRatingDifference={gameSettings.ratingDifference}
              className="mb-8"
            />
          </>
        )}
      </div>

      {/* Click outside to close dropdown */}
      {isDropdownOpen && (
        <div 
          className="fixed inset-0 z-5" 
          onClick={() => setIsDropdownOpen(false)}
        />
      )}
    </div>
  )
} 