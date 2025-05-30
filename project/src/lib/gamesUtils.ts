import { supabase, GameInsert, RecentGame } from './supabase'

// Function to create a new game record
export async function createGame(gameData: GameInsert): Promise<{
  success: boolean
  error?: string
  gameId?: string
}> {
  try {
    // Validate that players are different
    if (gameData.black_player_id === gameData.white_player_id) {
      return { success: false, error: 'Black and white players must be different' }
    }

    // Sanitize notes if provided
    const sanitizedNotes = gameData.notes ? sanitizeNotes(gameData.notes) : null

    // Insert the game
    const { data, error } = await supabase
      .from('games')
      .insert({
        ...gameData,
        notes: sanitizedNotes
      })
      .select('id')
      .single()

    if (error) {
      console.error('Database error creating game:', error)
      return { success: false, error: 'Failed to create game record' }
    }

    return { 
      success: true, 
      gameId: data.id 
    }
  } catch (error) {
    console.error('Unexpected error creating game:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Function to get recent games for a player (for home page)
export async function getRecentGames(playerId: string, limit: number = 5): Promise<{
  success: boolean
  games?: RecentGame[]
  error?: string
}> {
  try {
    const { data, error } = await supabase.rpc('get_recent_games', {
      player_id: playerId,
      game_limit: limit
    })

    if (error) {
      console.error('Database error fetching recent games:', error)
      return { success: false, error: 'Failed to fetch recent games' }
    }

    return { 
      success: true, 
      games: data || [] 
    }
  } catch (error) {
    console.error('Unexpected error fetching recent games:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Function to get last game date for a player (for standings)
export async function getLastGameDate(playerId: string): Promise<{
  success: boolean
  lastGameDate?: string | null
  error?: string
}> {
  try {
    const { data, error } = await supabase.rpc('get_last_game_date', {
      player_id: playerId
    })

    if (error) {
      console.error('Database error fetching last game date:', error)
      return { success: false, error: 'Failed to fetch last game date' }
    }

    return { 
      success: true, 
      lastGameDate: data 
    }
  } catch (error) {
    console.error('Unexpected error fetching last game date:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Function to get all games for a player (for future use)
export async function getPlayerGames(playerId: string): Promise<{
  success: boolean
  games?: any[]
  error?: string
}> {
  try {
    const { data, error } = await supabase
      .from('games')
      .select(`
        *,
        black_player:profiles!black_player_id(id, name),
        white_player:profiles!white_player_id(id, name)
      `)
      .or(`black_player_id.eq.${playerId},white_player_id.eq.${playerId}`)
      .order('played_at', { ascending: false })
      .order('created_at', { ascending: false })

    if (error) {
      console.error('Database error fetching player games:', error)
      return { success: false, error: 'Failed to fetch games' }
    }

    return { 
      success: true, 
      games: data || [] 
    }
  } catch (error) {
    console.error('Unexpected error fetching player games:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Helper function to sanitize notes (prevent XSS)
function sanitizeNotes(notes: string): string {
  // Remove HTML tags and script content
  return notes
    .replace(/<script\b[^<]*(?:(?!<\/script>)<[^<]*)*<\/script>/gi, '')
    .replace(/<[^>]*>/g, '')
    .trim()
    .substring(0, 10000) // Enforce character limit
}

// Helper function to format game result for display
export function formatGameResult(
  result: 'win' | 'loss' | 'draw', 
  playerColor: 'black' | 'white'
): string {
  if (result === 'draw') return 'Draw'
  if (result === 'win') return `Won as ${playerColor}`
  return `Lost as ${playerColor}`
}

// Helper function to format date for display
export function formatGameDate(dateString: string): string {
  const date = new Date(dateString)
  const now = new Date()
  const diffTime = Math.abs(now.getTime() - date.getTime())
  const diffDays = Math.ceil(diffTime / (1000 * 60 * 60 * 24))

  if (diffDays === 1) return 'Today'
  if (diffDays === 2) return 'Yesterday'
  if (diffDays <= 7) return `${diffDays - 1} days ago`
  
  return date.toLocaleDateString()
} 