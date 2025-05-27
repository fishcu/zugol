import { createClient } from '@supabase/supabase-js'

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL!
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY!

export const supabase = createClient(supabaseUrl, supabaseAnonKey)

export type Database = {
  public: {
    Tables: {
      profiles: {
        Row: {
          id: string
          name: string
          rating_points: number
          last_rank_reached: string
          games_at_last_rank_change: number
          total_games_played: number
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          rating_points?: number
          last_rank_reached?: string
          games_at_last_rank_change?: number
          total_games_played?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          rating_points?: number
          last_rank_reached?: string
          games_at_last_rank_change?: number
          total_games_played?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper function to convert traditional Go ranks to rating points
// 25k = 0 points, each rank gain adds 13 points
// New users start in the middle of their rank range (+7 points)
export function rankToRatingPoints(rank: string): number {
  const kyuMatch = rank.match(/^(\d+)k$/)
  const danMatch = rank.match(/^(\d+)d$/)
  
  if (kyuMatch) {
    const kyuLevel = parseInt(kyuMatch[1])
    // 25k = 0+7, 24k = 13+7, 23k = 26+7, ..., 1k = 312+7
    return (25 - kyuLevel) * 13 + 7
  }
  
  if (danMatch) {
    const danLevel = parseInt(danMatch[1])
    // 1d = 325+7, 2d = 338+7, ..., 9d = 429+7
    return (24 + danLevel) * 13 + 7
  }
  
  // Default to 15k (130+7 = 137 points) if rank format not recognized
  return 137
}

// Helper function to convert rating points back to rank
export function ratingPointsToRank(points: number): string {
  const safePoints = Math.max(0, points)
  const rankNumber = Math.floor(safePoints / 13)
  
  if (rankNumber <= 24) {
    // Kyu ranks: 25k down to 1k
    const kyuLevel = 25 - rankNumber
    return `${kyuLevel}k`
  } else {
    // Dan ranks: 1d up to 9d (cap at 9d)
    const danLevel = Math.min(9, rankNumber - 24)
    return `${danLevel}d`
  }
}

// Helper function to get display rank with hysteresis and asterisk notation
export function getDisplayRank(profile: {
  rating_points: number
  last_rank_reached: string
  games_at_last_rank_change: number
  total_games_played: number
}): string {
  const FREEZE_PERIOD = 5
  const ratingBasedRank = ratingPointsToRank(profile.rating_points)
  const gamesSinceRankChange = profile.total_games_played - profile.games_at_last_rank_change
  
  if (gamesSinceRankChange >= FREEZE_PERIOD) {
    return ratingBasedRank
  } else {
    return `${profile.last_rank_reached}*`
  }
}

// Helper function to update rank after a game
export function updateRankAfterGame(
  oldRatingPoints: number,
  newRatingPoints: number,
  lastRankReached: string,
  gamesAtLastRankChange: number,
  totalGamesPlayed: number
): {
  newLastRankReached: string
  newGamesAtLastRankChange: number
  rankChanged: boolean
} {
  const FREEZE_PERIOD = 5
  const newRatingRank = ratingPointsToRank(newRatingPoints)
  const gamesSinceRankChangeAfterThisGame = (totalGamesPlayed + 1) - gamesAtLastRankChange
  
  // Check for rank changes if we're not in freeze period after this game
  if (gamesSinceRankChangeAfterThisGame >= FREEZE_PERIOD) {
    if (newRatingRank !== lastRankReached) {
      return {
        newLastRankReached: newRatingRank,
        newGamesAtLastRankChange: totalGamesPlayed + 1,
        rankChanged: true
      }
    }
  }
  
  return {
    newLastRankReached: lastRankReached,
    newGamesAtLastRankChange: gamesAtLastRankChange,
    rankChanged: false
  }
} 