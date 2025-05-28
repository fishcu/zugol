export interface GameSettings {
  blackPlayer: {
    id: string
    name: string
    ratingPoints: number
  }
  whitePlayer: {
    id: string
    name: string
    ratingPoints: number
  }
  ratingDifference: number
  handicapStones: number
  komi: number
  isNigiri: boolean // Special case for equal ratings
}

export interface Player {
  id: string
  name: string
  rating_points: number
}

/**
 * Calculate game settings based on rating point difference
 * @param player1 First player
 * @param player2 Second player
 * @returns Game settings with black/white assignment, handicap, and komi
 */
export function calculateGameSettings(player1: Player, player2: Player): GameSettings {
  // Calculate absolute rating difference
  const ratingDifference = Math.abs(player1.rating_points - player2.rating_points)
  
  // Special case: Equal ratings (Nigiri)
  if (ratingDifference === 0) {
    // For equal ratings, assign player1 as black (logged-in user on the left) and use standard komi
    const blackPlayer = player1
    const whitePlayer = player2
    
    return {
      blackPlayer: {
        id: blackPlayer.id,
        name: blackPlayer.name,
        ratingPoints: blackPlayer.rating_points
      },
      whitePlayer: {
        id: whitePlayer.id,
        name: whitePlayer.name,
        ratingPoints: whitePlayer.rating_points
      },
      ratingDifference: 0,
      handicapStones: 0, // No handicap stones
      komi: 6.5, // Standard komi
      isNigiri: true
    }
  }
  
  // Normal case: Different ratings
  // Determine who plays black (weaker player) and white (stronger player)
  const isPlayer1Weaker = player1.rating_points <= player2.rating_points
  const blackPlayer = isPlayer1Weaker ? player1 : player2
  const whitePlayer = isPlayer1Weaker ? player2 : player1
  
  // Calculate handicap stones: 0 for first 13 points, then 2, 3, 4, ..., 9 (capped at 9)
  let handicapStones
  if (ratingDifference <= 12) {
    handicapStones = 0 // Even game with komi adjustment
  } else {
    handicapStones = Math.min(9, Math.floor((ratingDifference - 13) / 13) + 2)
  }
  
  // Calculate komi based on position within the 13-point range
  // For extreme differences beyond the table (>116), continue adding komi
  let komi
  if (ratingDifference <= 116) {
    // Normal case: within the table range
    const komiPosition = ratingDifference % 13
    komi = 6.5 - komiPosition
  } else {
    // Extreme case: beyond table range (>116)
    // Start from -5.5 (the limit of the table) and subtract 1 for each point beyond 116
    const beyondTablePoints = ratingDifference - 116
    komi = -5.5 - beyondTablePoints
  }
  
  return {
    blackPlayer: {
      id: blackPlayer.id,
      name: blackPlayer.name,
      ratingPoints: blackPlayer.rating_points
    },
    whitePlayer: {
      id: whitePlayer.id,
      name: whitePlayer.name,
      ratingPoints: whitePlayer.rating_points
    },
    ratingDifference,
    handicapStones,
    komi,
    isNigiri: false
  }
}

/**
 * Generate the rating table data for display
 * @param maxHandicap Maximum handicap stones to show (default 9)
 * @returns Array of table rows with handicap and komi values
 */
export function generateRatingTable(maxHandicap: number = 9) {
  const table = []
  
  // First row: 0 handicap stones
  const firstRow = {
    handicap: 0,
    komiValues: [] as number[]
  }
  
  // Generate 13 komi values for 0 handicap
  for (let position = 0; position < 13; position++) {
    const komi = 6.5 - position
    firstRow.komiValues.push(komi)
  }
  table.push(firstRow)
  
  // Subsequent rows: 2, 3, 4, ..., maxHandicap
  for (let handicap = 2; handicap <= maxHandicap; handicap++) {
    const row = {
      handicap,
      komiValues: [] as number[]
    }
    
    // Generate 13 komi values for this handicap level
    for (let position = 0; position < 13; position++) {
      const komi = 6.5 - position
      row.komiValues.push(komi)
    }
    
    table.push(row)
  }
  
  return table
}

/**
 * Get the table position (handicap, komi index) for a given rating difference
 * @param ratingDifference Absolute rating difference
 * @returns Object with handicap stones and komi index (0-12), or null if beyond table range
 */
export function getTablePosition(ratingDifference: number) {
  if (ratingDifference === 0) {
    // Special case: Nigiri (equal ratings)
    return {
      handicapStones: 0,
      komiIndex: 0 // 6.5 komi
    }
  }
  
  // Check if rating difference is beyond the table range (>116)
  // Table covers: 0-12 (0 handicap), 13-25 (2 handicap), ..., 104-116 (9 handicap)
  if (ratingDifference > 116) {
    // Beyond table range - don't highlight anything
    return null
  }
  
  let handicapStones
  if (ratingDifference <= 12) {
    handicapStones = 0 // Even game with komi adjustment
  } else {
    handicapStones = Math.min(9, Math.floor((ratingDifference - 13) / 13) + 2)
  }
  
  const komiIndex = ratingDifference % 13
  
  return {
    handicapStones,
    komiIndex
  }
}

/**
 * Format komi value for display (handle negative values properly)
 * @param komi Komi value
 * @returns Formatted string
 */
export function formatKomi(komi: number): string {
  if (komi >= 0) {
    return `+${komi}`
  } else {
    return komi.toString()
  }
} 