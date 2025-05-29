import { supabase, updateRankAfterGame } from './supabase'

export interface GameResult {
  playerId: string
  opponentId: string
  playerWon: boolean
  ratingChange: number
}

// Function to update a player's rating after a game
export async function updatePlayerRating(
  playerId: string,
  ratingChange: number
): Promise<{ success: boolean; error?: string; rankChanged?: boolean }> {
  try {
    // First, get the current player data
    const { data: currentProfile, error: fetchError } = await supabase
      .from('profiles')
      .select('*')
      .eq('id', playerId)
      .single()

    if (fetchError || !currentProfile) {
      return { success: false, error: 'Failed to fetch player profile' }
    }

    // Calculate new rating points
    const oldRatingPoints = currentProfile.rating_points
    const newRatingPoints = Math.max(0, oldRatingPoints + ratingChange)

    // Check if rank changed and update accordingly
    const rankUpdate = updateRankAfterGame(
      oldRatingPoints,
      newRatingPoints,
      currentProfile.last_rank_reached,
      currentProfile.games_since_last_rank_change
    )

    // Update the profile with new data
    const updateData = {
      rating_points: newRatingPoints,
      last_rank_reached: rankUpdate.newLastRankReached,
      games_since_last_rank_change: rankUpdate.newGamesSinceLastRankChange,
      updated_at: new Date().toISOString()
    }
    
    const { error: updateError } = await supabase
      .from('profiles')
      .update(updateData)
      .eq('id', playerId)

    if (updateError) {
      console.error('Database update failed:', updateError)
      return { success: false, error: 'Failed to update player profile' }
    }

    return { 
      success: true, 
      rankChanged: rankUpdate.rankChanged 
    }
  } catch (error) {
    console.error('Error updating player rating:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Function to process a complete game result (both players)
export async function processGameResult(gameResult: GameResult): Promise<{
  success: boolean
  error?: string
  playerRankChanged?: boolean
  opponentRankChanged?: boolean
}> {
  try {
    // Update winner (positive rating change)
    const winnerResult = await updatePlayerRating(
      gameResult.playerWon ? gameResult.playerId : gameResult.opponentId,
      Math.abs(gameResult.ratingChange)
    )

    if (!winnerResult.success) {
      return { success: false, error: `Failed to update winner: ${winnerResult.error}` }
    }

    // Update loser (negative rating change)
    const loserResult = await updatePlayerRating(
      gameResult.playerWon ? gameResult.opponentId : gameResult.playerId,
      -Math.abs(gameResult.ratingChange)
    )

    if (!loserResult.success) {
      return { success: false, error: `Failed to update loser: ${loserResult.error}` }
    }

    return {
      success: true,
      playerRankChanged: gameResult.playerWon ? winnerResult.rankChanged : loserResult.rankChanged,
      opponentRankChanged: gameResult.playerWon ? loserResult.rankChanged : winnerResult.rankChanged
    }
  } catch (error) {
    console.error('Error processing game result:', error)
    return { success: false, error: 'Unexpected error occurred' }
  }
}

// Helper function for testing - simulate a game result for a specific player
export async function simulateGameForPlayer(
  playerId: string,
  won: boolean,
  ratingChange: number = 13
): Promise<{ success: boolean; error?: string; rankChanged?: boolean }> {
  const actualChange = won ? ratingChange : -ratingChange
  return await updatePlayerRating(playerId, actualChange)
} 