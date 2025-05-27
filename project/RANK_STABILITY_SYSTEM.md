# Rank Stability System

This document describes the rank stability system implemented in Zugol to prevent rank oscillation and provide visual feedback for recent rank changes.

## Overview

The rank stability system introduces two key features:
1. **Rank Hysteresis**: Prevents rapid rank oscillation by "freezing" ranks for 5 games after a change
2. **Asterisk Notation**: Visual indicator (*) for ranks that changed recently

## How It Works

### Database Schema

The `profiles` table includes these columns for rank stability:
- `last_rank_reached`: The current displayed rank (frozen during hysteresis period)
- `games_at_last_rank_change`: Game number when rank last changed
- `total_games_played`: Total number of games played by the user

### Rank Change Detection

When a game result is processed:
1. Calculate what the new rating-based rank would be
2. Check if we're outside the freeze period (≥5 games since last rank change)
3. If outside freeze period, compare new rating-based rank with current displayed rank
4. If different, a rank change occurred:
   - Set `last_rank_reached` to the new rank
   - Set `games_at_last_rank_change` to current game number

### Display Logic

The display rank is determined by:
```typescript
function getDisplayRank(profile) {
  const ratingBasedRank = ratingPointsToRank(profile.rating_points)
  const gamesSinceRankChange = profile.total_games_played - profile.games_at_last_rank_change
  
  if (gamesSinceRankChange >= 5) {
    return ratingBasedRank  // Unfrozen
  } else {
    return `${profile.last_rank_reached}*`  // Frozen with asterisk
  }
}
```

### States and Transitions

1. **Normal State** (`games_since_rank_change >= 5`):
   - Display rank = rating-based rank
   - No asterisk shown
   - Rank can change immediately if rating crosses threshold

2. **Frozen State** (`games_since_rank_change < 5`):
   - Display rank = `last_rank_reached` (frozen at time of change)
   - Asterisk shown
   - Rating can continue to change, but display rank stays frozen

## Examples

### Example 1: Rank Up
- Player at 15k (137 points) wins game (+13 points = 150 points)
- Rating-based rank becomes 14k
- `last_rank_reached` = "14k", `games_at_last_rank_change` = current game
- Display: "14k*" for next 5 games

### Example 2: Hysteresis Prevention
- Player just ranked up to 14k* (2 games ago)
- Loses game (-13 points), rating drops back to 15k range
- Display still shows "14k*" (frozen)
- After 3 more games, unfreezes and shows actual rating-based rank

### Example 3: Exiting Freeze Period
- Player at 15k* (4 games since rank change)
- Wins game, now has 5 games since rank change
- System checks: rating-based rank vs displayed rank
- If different, triggers immediate rank change with new freeze period

## Implementation Files

### Core Logic
- `src/lib/supabase.ts`: Helper functions for rank calculations
- `src/lib/gameUtils.ts`: Game result processing and rating updates

### UI Integration
- `src/contexts/AuthContext.tsx`: Provides `getDisplayRank()` function
- `src/app/page.tsx`: Uses display rank in user interface
- `src/app/test-ranking/page.tsx`: Testing interface for the system

### Database
- `supabase-simplified-rank-migration.sql`: Current migration for the system

## Testing

Use the test page at `/test-ranking` to:
- Simulate wins and losses
- Observe rank changes and asterisk behavior
- Test hysteresis functionality
- Verify the 5-game freeze period

## Benefits

1. **Prevents Oscillation**: Players near rank boundaries won't flip-flop between ranks
2. **Visual Feedback**: Asterisk shows when rank recently changed
3. **Psychological Stability**: Players feel more secure in their new rank
4. **Fair Competition**: Reduces gaming of the system around rank boundaries

## Configuration

The freeze period is currently set to 5 games. This can be adjusted by changing the `FREEZE_PERIOD` constant in the relevant functions. 