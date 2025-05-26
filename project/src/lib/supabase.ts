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
          created_at: string
          updated_at: string
        }
        Insert: {
          id: string
          name: string
          rating_points?: number
          created_at?: string
          updated_at?: string
        }
        Update: {
          id?: string
          name?: string
          rating_points?: number
          created_at?: string
          updated_at?: string
        }
      }
    }
  }
}

// Helper function to convert traditional Go ranks to rating points
// 25k = 0 points, each rank gain adds 13 points
export function rankToRatingPoints(rank: string): number {
  const kyuMatch = rank.match(/^(\d+)k$/)
  const danMatch = rank.match(/^(\d+)d$/)
  
  if (kyuMatch) {
    const kyuLevel = parseInt(kyuMatch[1])
    // 25k = 0, 24k = 13, 23k = 26, ..., 1k = 312
    return (25 - kyuLevel) * 13
  }
  
  if (danMatch) {
    const danLevel = parseInt(danMatch[1])
    // 1d = 325, 2d = 338, ..., 9d = 429
    return (24 + danLevel) * 13
  }
  
  // Default to 15k (130 points) if rank format not recognized
  return 130
}

// Helper function to convert rating points back to rank
export function ratingPointsToRank(points: number): string {
  // Ensure non-negative points
  const safePoints = Math.max(0, points)
  
  // Calculate rank number (0-33, where 0=25k, 24=1k, 25=1d, 33=9d)
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