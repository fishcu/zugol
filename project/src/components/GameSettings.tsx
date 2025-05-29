'use client'

import { GameSettings, formatKomi } from '@/lib/gameSettings'
import { getDisplayRank } from '@/lib/supabase'

interface Profile {
  id: string
  name: string
  rating_points: number
  last_rank_reached: string
  games_since_last_rank_change: number
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
      {/* Rating Information */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-1">Rating Information</h3>
        <p className="text-gray-400 text-sm mb-3">Used to determine player colors and game rules</p>
        <div className="bg-gray-700 rounded-lg p-4">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-4 text-center">
            <div>
              <div className="text-gray-400 text-sm">{blackPlayer.name}'s Rating</div>
              <div className="text-white font-bold text-lg">
                {blackPlayer.ratingPoints} pts <span className="text-blue-400 text-sm">({blackPlayerProfile ? getDisplayRank(blackPlayerProfile) : getFallbackRank(blackPlayer.ratingPoints)})</span>
              </div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">Rating Difference</div>
              <div className="text-amber-300 font-bold text-2xl">{ratingDifference} pts</div>
            </div>
            <div>
              <div className="text-gray-400 text-sm">{whitePlayer.name}'s Rating</div>
              <div className="text-white font-bold text-lg">
                {whitePlayer.ratingPoints} pts <span className="text-blue-400 text-sm">({whitePlayerProfile ? getDisplayRank(whitePlayerProfile) : getFallbackRank(whitePlayer.ratingPoints)})</span>
              </div>
            </div>
          </div>
        </div>
      </div>

      {/* Player Colors */}
      <div className="mb-6">
        <h3 className="text-lg font-semibold text-white mb-3">Player Colors</h3>
        
        {/* Special Nigiri Notice */}
        {isNigiri && (
          <div className="bg-blue-900 bg-opacity-30 border border-blue-600 rounded-lg p-3 mb-4">
            <div className="text-center text-blue-200">
              <div className="font-medium">Player colors are assigned at random (Nigiri)</div>
            </div>
          </div>
        )}
        
        <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
          {/* Black Player */}
          <div className="bg-gray-700 rounded-lg p-4">
            <div className="flex items-center justify-center">
              <span className="text-4xl mr-3">{isNigiri ? '⚫/⚪' : '⚫'}</span>
              <div className="text-center">
                <div className="text-white font-medium text-lg">
                  {blackPlayer.name}
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
                  {whitePlayer.name}
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
          <div className="bg-gradient-to-br from-indigo-800 to-indigo-900 border border-indigo-600 rounded-lg p-4">
            <div className="flex items-center justify-center space-x-3">
              <div className="text-white text-lg font-medium">Handicap Stones:</div>
              <div className="text-2xl font-bold text-indigo-200">{handicapStones}</div>
            </div>
          </div>

          {/* Komi */}
          <div className="bg-gradient-to-br from-teal-800 to-teal-900 border border-teal-600 rounded-lg p-4">
            <div className="flex flex-col items-center">
              <div className="flex items-center justify-center space-x-3">
                <div className="text-white text-lg font-medium">Komi:</div>
                <div className="text-2xl font-bold text-teal-200">
                  {formatKomi(komi)}
                </div>
              </div>
              
              {/* Reverse komi hint */}
              {komi < 0 && (
                <div className="text-teal-300 text-sm mt-2">
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