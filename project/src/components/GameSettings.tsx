'use client'

import { GameSettings, formatKomi } from '@/lib/gameSettings'
import { getDisplayRank } from '@/lib/supabase'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_at_last_rank_change: number
  total_games_played: number
  created_at: string
  updated_at: string
}

interface ExtendedGameSettings extends GameSettings {
  blackPlayerProfile?: Profile
  whitePlayerProfile?: Profile
}

interface GameSettingsProps {
  gameSettings: ExtendedGameSettings
  className?: string
}

// Helper function for fallback rank calculation
function getFallbackRank(ratingPoints: number): string {
  const kyuRank = 25 - Math.floor(ratingPoints / 13)
  if (kyuRank > 0) {
    return `${kyuRank}k`
  } else {
    return `${Math.min(9, Math.floor(ratingPoints / 13) - 24)}d`
  }
}

export default function GameSettingsDisplay({ gameSettings, className = '' }: GameSettingsProps) {
  const { blackPlayer, whitePlayer, ratingDifference, handicapStones, komi, isNigiri, blackPlayerProfile, whitePlayerProfile } = gameSettings

  return (
    <div className={`bg-gray-800 rounded-lg p-6 ${className}`}>
      {/* Special Nigiri Notice */}
      {isNigiri && (
        <div className="bg-yellow-900 bg-opacity-50 border border-yellow-600 rounded-lg p-4 mb-6">
          <div className="text-center text-yellow-200">
            <div className="font-medium">Player colors are assigned randomly (Nigiri)</div>
            <div className="text-sm mt-1">
              Standard 6.5 komi
            </div>
          </div>
        </div>
      )}
      
      {/* Rating Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Rating Information</h3>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm">{blackPlayer.name}'s Rating</div>
              <div className="text-white font-medium">{blackPlayer.ratingPoints} pts</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Rating Difference</div>
              <div className="text-blue-400 font-bold text-lg">{ratingDifference} pts</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">{whitePlayer.name}'s Rating</div>
              <div className="text-white font-medium">{whitePlayer.ratingPoints} pts</div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Colors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Player Colors</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Black Player */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl mr-3">{isNigiri ? '⚫/⚪' : '⚫'}</span>
              <div className="text-center">
                <div className="text-white font-medium text-lg">
                  {blackPlayer.name} ({blackPlayerProfile ? getDisplayRank(blackPlayerProfile) : getFallbackRank(blackPlayer.ratingPoints)})
                </div>
              </div>
            </div>
          </div>

          {/* White Player */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl mr-3">{isNigiri ? '⚪/⚫' : '⚪'}</span>
              <div className="text-center">
                <div className="text-white font-medium text-lg">
                  {whitePlayer.name} ({whitePlayerProfile ? getDisplayRank(whitePlayerProfile) : getFallbackRank(whitePlayer.ratingPoints)})
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Game Rules */}
      <div>
        <h3 className="text-lg font-semibold text-white mb-3">Game Rules</h3>
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Handicap */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-white text-lg font-medium">Handicap Stones:</div>
              <div className="text-2xl font-bold text-white">{handicapStones}</div>
            </div>
          </div>

          {/* Komi */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-white text-lg font-medium">Komi:</div>
                <div className="text-2xl font-bold text-white">
                  {formatKomi(komi)}
                </div>
              </div>
              
              {/* Reverse komi hint */}
              {komi < 0 && (
                <div className="text-gray-400 text-sm mt-2">
                  Black gets {Math.abs(komi)} points
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  )
} 